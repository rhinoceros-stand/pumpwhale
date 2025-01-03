import { Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv'
import { Bot } from 'gramio'
import Bonding from '../services/onchain/bonding'
import Trading from '../services/onchain/trading'
import Quoted from '../services/quoted'
import { logger } from '../utils/logger'
import { renderSwap } from '../_utils/template'

dotenv.config({
  path: ['.env.local', 'env']
})

const PRIVATE_CHAT_ID = 7216621593

export default class TradingBot {
  private readonly SOL_RPC_URL = process.env.SOLANA_RPC_URL
  private readonly BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

  /**
   * Telegram Bot
   * @private
   */
  private _bot: Bot

  private _conn: Connection

  /**
   * 交易服务
   * @private
   */
  private _trading: Trading

  /**
   * Bonding 服务
   * 接收流动性注入通知
   * @private
   */
  private _bonding: Bonding

  /**
   * SOL 报价服务
   * 用于计算市值和下单价格
   * @private
   */
  private _quoted: Quoted

  constructor() {
    this._conn = new Connection(this.SOL_RPC_URL, 'confirmed')
    this._bot = new Bot(this.BOT_SECRET)
  }

  /**
   * 初始化服务
   */
  async initService() {
    this._bonding = new Bonding()
    this._bonding.init(this._conn)
    this._bonding.setCallback(this.onPairBonding.bind(this))

    this._quoted = new Quoted({
      onQuoteChange: (value: number) => {
        this._trading.solanaPrice = value
      }
    })

    const liveSOLPrice = await this._quoted.onFetchPrice()

    this._trading = new Trading()
    this._trading.solanaPrice = liveSOLPrice
    this._trading.init(this._conn)
  }

  /**
   *
   */
  start() {
    this._bot.onStart((params) => {
      logger.info(`Swap Bot ${params.info.first_name} running...`)
    })

    this._bonding.start()
  }

  /**
   *
   * @param data
   */
  async onPairBonding(data: any) {
    const {
      address,
      name,
      symbol
    } = data

    // start swap
    const tx = await this._trading.startTokenSwap(address)
    if (!tx) {
      return
    }

    this._bot.api.sendMessage({
      chat_id: PRIVATE_CHAT_ID,
      text: renderSwap(name, symbol, address, tx)
    })
  }
}
