import { Wallet } from '@project-serum/anchor'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import queryString from 'query-string'
import { getTokenHolders, getTokenMeatData } from './metadata'
import { logger } from '../../utils/logger'
import { OnChainService } from './index'

const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'

/**
 * Everytime trade 0.005 SOL
 */
const SOL_ORDER_AMOUNT = 0.0005 * LAMPORTS_PER_SOL

/**
 * 默认滑点 10%
 */
const SLIPPAGE_DEFAULT_BPS = 1000

export default class Trading implements OnChainService {
  private _conn: Connection
  private _wallet: Wallet

  public solanaPrice: number


  init(conn: Connection): boolean {
    this._conn = conn
    this._wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY || '')))

    return true
  }

  start(): boolean {
    if (!this._conn) {
      throw new Error('RPC empty connection, initialize it at first.')
    }

    logger.info('Trading Service Start!')

    return true
  }

  stop(): boolean {
  }

  /**
   * 开始代币交换
   * @param address
   */
  async startTokenSwap(address: string) {
    const mintAddress = new PublicKey(address)


    // 获取代币信息
    const tokenMetadata = await getTokenMeatData(mintAddress, this._conn)

    // 查询代币报价
    const pairQuoteResponse = await this.getTokenPairQuote(address)

    // 计算下单价值
    const valueInUSD = this.solanaPrice * (SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL)

    // 获取单价和市值
    const {
      price,
      marketCapitalization,
      outAmount
    } = this.getPairPrice(pairQuoteResponse.outAmount, valueInUSD, tokenMetadata.supply, tokenMetadata.decimals)

    logger.info(`Jupiter Quote: $${tokenMetadata.symbol}, ${valueInUSD} USD for ${outAmount}, Avg Price: ${price}, MCAP: ${this.displayMarketCapitalization(marketCapitalization)}`)

    // 查询持有人数量
    const holders = await getTokenHolders(mintAddress, this._conn)
    logger.info(`$${tokenMetadata.symbol}(${tokenMetadata.address}) Holders: ${holders}`)

    // 查询 TOP 20 持有量
    const topHolders = await this._conn.getTokenLargestAccounts(mintAddress)

    const holderMinimum = 200
    if (holders < holderMinimum) {
      logger.warn(`$${tokenMetadata.symbol}(${tokenMetadata.address}) Holders is less than ${holderMinimum}, ignore for swap.`)
      return
    }

    const tokenValueMinimum = 85000
    if (marketCapitalization < tokenValueMinimum) {
      logger.warn(`$${tokenMetadata.symbol}(${tokenMetadata.address}) market capitalization is less than ${tokenValueMinimum}, ignore for swap.`)
      return
    }

    // 准备交易
    const tx = await this.preparingSwap(address)

    // 根据 transaction 查询交换的代币数量，输出单价
    const transactionInfo = await this._conn.getParsedTransaction(tx, {
      maxSupportedTransactionVersion: 0
    })

    const { meta } = transactionInfo
    const filterBalance = meta.postTokenBalances.findLast(v => v.owner === this._wallet.publicKey.toBase58())
    if (filterBalance) {
      const executeSwap = {
        amount: filterBalance.uiTokenAmount,
        price: valueInUSD / filterBalance.uiTokenAmount.uiAmount
      }

      logger.info(`$${tokenMetadata.symbol}(${tokenMetadata.address}) swap success, ${valueInUSD} USD for ${executeSwap.amount}, Avg Price: ${executeSwap.price}`)
    }

    return tx
  }

  /**
   * 准备交换
   * @param mintAddress 报价信息
   */
  async preparingSwap(mintAddress: string) {
    // 查询代币报价
    const quoteResponse = await this.getTokenPairQuote(mintAddress)

    // get serialized transactions for the swap
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // quoteResponse from /quote api
          quoteResponse,
          // user public key to be used for the swap
          userPublicKey: this._wallet.publicKey.toString(),
          // auto wrap and unwrap SOL. default is true
          wrapAndUnwrapSol: true,
          // jup.ag frontend default max for user
          dynamicSlippage: {
            'maxBps': SLIPPAGE_DEFAULT_BPS
          }
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // feeAccount: "fee_account_public_key"
        })
      })
    ).json()

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    // @ts-ignore
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

    // sign the transaction
    transaction.sign([this._wallet.payer])

    // get the latest block hash
    const latestBlockHash = await this._conn.getLatestBlockhash()

    try {
      // Execute the transaction
      const rawTransaction = transaction.serialize()
      const txid = await this._conn.sendRawTransaction(rawTransaction, {
        skipPreflight: false
      })

      // 查询交易是否成功
      const confirmInfo = await this._conn.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
      })

      return txid
    } catch (err) {
      logger.error(`Send swap request error`, err)
    }
  }

  /**
   * 查询代币报价
   * @param outputMint
   */
  async getTokenPairQuote(outputMint: string) {
    // Swap 0.0005 SOL with 10% slippage
    const params = {
      inputMint: SOL_MINT_ADDRESS,
      amount: SOL_ORDER_AMOUNT,
      slippageBps: SLIPPAGE_DEFAULT_BPS,
      outputMint
    }

    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?${queryString.stringify(params)}`
      )
    ).json()

    return quoteResponse
  }

  /**
   * 计算交易对价格
   * @param outAmount
   * @param inputValue
   * @param supply
   * @param decimals
   */
  getPairPrice(outAmount: bigint, inputValue: number, supply: bigint, decimals: number) {
    const decimalWithZero = 10 ** decimals

    const amount = Number(outAmount) / decimalWithZero
    const price = inputValue / amount

    return {
      outAmount: amount,
      price: inputValue / (Number(outAmount) / decimalWithZero),
      marketCapitalization: price * (Number(supply) / decimalWithZero)
    }
  }

  /**
   * 市值显示转换
   * @param value
   */
  displayMarketCapitalization(value: number) {
    let getValue = value
    if (value > 1000000) {
      getValue = value / 1000000

      return `${Math.trunc(getValue)}M`
    }
    if (value < 1000000) {
      getValue = value / 1000

      return `${Math.trunc(getValue)}K`
    }

    if (value < 100000) {
      return `${Math.trunc(getValue)}K`
    }
  }
}
