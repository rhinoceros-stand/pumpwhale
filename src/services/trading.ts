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
  private _solPrice: number

  constructor({ connection }) {
    const callbacks = {
      open: (client: WebsocketAPI) => {
        console.debug(chalk.blue('Connected to Binance WebSocket server'))
        client.avgPrice('SOLUSDT')
      },
      close: () => chalk.red('Disconnected from WebSocket server'),
      message: (data: string) => {
        const parseData = JSON.parse(data)
        this._solPrice = parseInt(parseData.result.price, 10)

        console.info(`SOLUSDT now: ${chalk.magenta(this._solPrice)}USDT`)
      }
    }

    this._connection = connection
    this._wsClient = new WebsocketAPI('', '', { callbacks })
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

  async getSOLPrice() {
    if (!this._wsClient) {
      return
    }

    this._wsClient.avgPrice(PRICE_TICKER_PAIR)
  }

  async getHolders(address: string) {
    const mintAddress = new PublicKey(address)
    const tokenMetadata = await getTokenInfo(this._connection, address)
    const supply = await this._connection.getTokenSupply(mintAddress)
    const topHolders = await this._connection.getTokenLargestAccounts(mintAddress)
    if (!address) {
      return
    }

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

    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY || '')))

    // Swapping SOL to Mint Address with input 0.001 SOL and 10% slippage
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT_ADDRESS}&outputMint=${address}&amount=${SOL_ORDER_AMOUNT}&slippageBps=1000`
      )
    ).json()

    // get the market cap
    const buyAmount = parseInt(quoteResponse.outAmount, 10)
    const totalAmount = parseInt(supply.value.amount, 10)

    const marketCAPSOL = 1 / (buyAmount / totalAmount) * (SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL)
    const marketCAPUSD = Math.round(this._solPrice * marketCAPSOL)
    const marketStr = this.formatMarketCAP(marketCAPUSD)

    if (marketCAPUSD < 100000) {
      console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) mcap is ${chalk.red(marketStr)}, it's below 100K, won't swap it.`)
      return
    }

    console.log(`${chalk.blue(tokenInfo.name)}(${chalk.red(tokenInfo.address)}) mcap is ${marketStr}, preparing swap.`)

    return

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
          userPublicKey: wallet.publicKey.toString(),
          // auto wrap and unwrap SOL. default is true
          wrapAndUnwrapSol: true
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // feeAccount: "fee_account_public_key"
        })
      })
    ).json()

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

    // sign the transaction
    transaction.sign([wallet.payer])

    // get the latest block hash
    const latestBlockHash = await this._connection.getLatestBlockhash()

    try {
      // Execute the transaction
      const rawTransaction = transaction.serialize()
      const txid = await this._connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false
      })

      console.log('txid', txid)

      // const confirmInfo = await this._connection.confirmTransaction({
      //   blockhash: latestBlockHash.blockhash,
      //   lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      //   signature: txid
      // })
      // console.log(txid, confirmInfo)
    } catch (e) {
      console.log('error', e)
    }
  }
}
