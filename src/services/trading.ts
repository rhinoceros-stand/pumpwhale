import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import chalk from 'chalk'
import fetch from 'cross-fetch'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Wallet } from '@project-serum/anchor'
import { getTokenInfo } from '../metadata'

/**
 * Everytime trade 0.005 SOL
 */
const SOL_ORDER_AMOUNT = 0.0005 * LAMPORTS_PER_SOL
const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'

const SLIPPAGE_MAX_BPS = 1000

export default class Trading {
  private _connection: Connection
  private _wallet: Wallet
  private _solPrice: number

  constructor() {
    this._wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY || '')))
  }

  /**
   *
   * @param conn
   */
  setConnection(conn: Connection) {
    this._connection = conn
  }

  /**
   * 更新 SOL 价格
   * @param price
   */
  updateSOLPrice(price: number) {
    this._solPrice = price
  }

  /**
   * 准备交换
   * @param quoteResponse 报价信息
   */
  async preparingSwap(quoteResponse: any) {
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
            'maxBps': SLIPPAGE_MAX_BPS
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
    const latestBlockHash = await this._connection.getLatestBlockhash()

    try {
      // Execute the transaction
      const rawTransaction = transaction.serialize()
      const txid = await this._connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false
      })

      // 查询交易是否成功
      const confirmInfo = await this._connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
      })

      return txid
    } catch (err) {
      console.error('send swap error', err)
    }
  }

  /**
   * 开始代币交换
   * @param address
   */
  async startTokenSwap(address: string) {
    if (!address) {
      return
    }

    const mintAddress = new PublicKey(address)

    // 获取代币信息
    const tokenMetadata = await getTokenInfo(this._connection, address)

    // 查询总量
    const supply = await this._connection.getTokenSupply(mintAddress)

    // 查询 TOP 20 持有量
    const topHolders = await this._connection.getTokenLargestAccounts(mintAddress)

    // 查询持有人数量
    const holders = await this.getHolders(mintAddress)

    const tokenInfo = {
      ...tokenMetadata,
      holders,
      amount: supply.value.uiAmount,
      topHolders: topHolders.value.map(v => {
        return {
          address: v.address.toString(),
          amount: v.uiAmount,
          percent: (v.uiAmount / supply.value.uiAmount) * 100
        }
      })
    }

    if (holders < 300) {
      console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) holders ${holders} is below 300, won't swap it.`)
      return
    }

    // Swapping SOL to Mint Address with input 0.005 SOL and 10% slippage
    // 查询代币报价
    // 使用 0.0005 SOL 互换，交易滑点 10%
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT_ADDRESS}&outputMint=${address}&amount=${SOL_ORDER_AMOUNT}&slippageBps=${SLIPPAGE_MAX_BPS}`
      )
    ).json()

    // 计算代币市值
    const mcapUSD = this.getMarketCAP(quoteResponse.outAmount, supply.value.amount)
    const marketStr = this.formatMarketCAP(mcapUSD)

    // 如果市值低于 70K，跳过 Swap
    if (mcapUSD < 85000) {
      console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) mcap is ${chalk.red(marketStr)}, it's below 85K, won't swap it.`)
      return
    }

    console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) mcap is ${marketStr}, preparing swap.`)

    // 准备交易
    const tx = await this.preparingSwap(quoteResponse)

    // 根据 transaction 查询交换的代币数量，输出单价
    const transactionInfo = await this._connection.getParsedTransaction(tx, {
      maxSupportedTransactionVersion: 0
    })

    const { meta } = transactionInfo
    const filterBalance = meta.postTokenBalances.findLast(v => v.owner === this._wallet.publicKey.toBase58())
    if (filterBalance) {
      const tokenAmount = filterBalance.uiTokenAmount.uiAmount
      const price = SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL * this._solPrice / filterBalance.uiTokenAmount.uiAmount
      const solAmount = SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL
      console.log(`${tokenAmount} ${`$${chalk.blue(tokenInfo.name)}`} swap with ${solAmount} SOL, Price ${chalk.green(Number(price).toFixed(4))}`)
    }

    return tx
  }

  /**
   * 获取代币市值
   * @param outAmount
   * @param supplyAmount
   */
  getMarketCAP(outAmount: string, supplyAmount: string) {
    const outAmountNumber = parseInt(outAmount, 10)
    const supplyAmountNumber = parseInt(supplyAmount)
    const outPercent = (outAmountNumber / supplyAmountNumber)
    const marketCAPSOL = 1 / outPercent * (SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL)

    return Math.trunc(this._solPrice * marketCAPSOL)
  }

  /**
   * 获取持有者信息
   * @param mintAddress
   */
  async getHolders(mintAddress: PublicKey) {
    const accounts = await this._connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        {
          dataSize: 165 // Number of bytes for a token account
        },
        {
          memcmp: {
            offset: 0, // Offset to start reading the token mint address
            bytes: mintAddress.toBase58() // The token mint address
          }
        }
      ]
    })

    const holders = accounts
      .filter((account) => account.account.data.parsed.info.tokenAmount.uiAmount > 0)
      .map((account) => account.pubkey.toBase58())

    return holders.length
  }

  /**
   * 市值显示转换
   * @param value
   */
  formatMarketCAP(value: number) {
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
