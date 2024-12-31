import { Wallet } from '@project-serum/anchor'
import { Connection, Keypair, LAMPORTS_PER_SOL, Logs, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import queryString from 'query-string'
import { OnChainService } from './index'
import { logger } from '../../utils/logger'
import { getTokenMeatData } from './metadata'

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
  private _solPrice: number

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
   * SOL 报价更新
   * @param value
   */
  onSolanaPriceUpdate(value: number) {
    this._solPrice = value
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

    const valueInUSD = this._solPrice * (SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL)
    // 获取单价和市值
    const {
      price,
      marketCapitalization,
      outAmount
    } = this.getPairPrice(pairQuoteResponse.outAmount, valueInUSD, tokenMetadata.supply, tokenMetadata.decimals)

    logger.info(`Jupiter Quote: $${tokenMetadata.symbol}, ${valueInUSD} USD for ${outAmount}, Avg Price: ${price}, Market CAP: ${marketCapitalization}`)

    return ''
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
   * 计算下单均价
   * @param outAmount
   */
  getAvgPrice(outAmount: number) {
    const valueInSOL = this._solPrice * (SOL_ORDER_AMOUNT / LAMPORTS_PER_SOL)
    console.log(valueInSOL, outAmount)

    return valueInSOL / outAmount
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
}
