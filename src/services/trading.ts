import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import chalk from 'chalk'
import fetch from 'cross-fetch'
import { WebsocketAPI } from '@binance/connector-typescript'
import { Wallet } from '@project-serum/anchor'
import { getTokenInfo } from '../metadata'

const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'

/**
 * Everytime trade 0.005 SOL
 */
const SOL_ORDER_AMOUNT = 0.005 * LAMPORTS_PER_SOL
const PRICE_TICKER_PAIR = 'SOLUSDT'

export default class Trading {
  private readonly _connection: Connection
  private readonly _wsClient: WebsocketAPI
  private _wallet: Wallet
  private _solPrice: number

  constructor({ connection }) {
    const callbacks = {
      open: (client: WebsocketAPI) => {
        console.debug(chalk.blue('Connected to Binance WebSocket server'))
        client.avgPrice('SOLUSDT')
      },
      close: () => console.log(chalk.red('Disconnected from WebSocket server')),
      message: (data: string) => {
        const parseData = JSON.parse(data)
        this._solPrice = parseInt(parseData.result.price, 10)

        console.info(`SOLUSDT now: ${chalk.magenta(`${this._solPrice}USDT`)}`)
      }
    }

    this._connection = connection
    this._wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY || '')))
    this._wsClient = new WebsocketAPI('', '', { callbacks })
  }

  /**
   * 获取 SOL 报价
   */
  async getSOLPrice() {
    if (!this._wsClient) {
      return
    }

    this._wsClient.avgPrice(PRICE_TICKER_PAIR)
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
          wrapAndUnwrapSol: true
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

    const tokenInfo = {
      ...tokenMetadata,
      amount: supply.value.uiAmount,
      topHolders: topHolders.value.map(v => {
        return {
          address: v.address.toString(),
          amount: v.uiAmount,
          percent: (v.uiAmount / supply.value.uiAmount) * 100
        }
      })
    }

    // Swapping SOL to Mint Address with input 0.005 SOL and 10% slippage
    // 查询代币报价
    // 使用 0.005 SOL 互换，交易滑点 10%
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT_ADDRESS}&outputMint=${address}&amount=${SOL_ORDER_AMOUNT}&slippageBps=1000`
      )
    ).json()

    // 计算代币市值
    const mcapUSD = this.getMarketCAP(quoteResponse.outAmount, supply.value.amount)
    const marketStr = this.formatMarketCAP(mcapUSD)

    // 如果市值低于 100K，跳过 Swap
    if (mcapUSD < 100000) {
      console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) mcap is ${chalk.red(marketStr)}, it's below 100K, won't swap it.`)
      return
    }

    console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) mcap is ${marketStr}, preparing swap.`)

    // 准备交易
    const tx = await this.preparingSwap(quoteResponse)
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
   * @param address
   */
  async getHolders(address: string) {
    return
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
