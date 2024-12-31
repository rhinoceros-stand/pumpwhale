import { Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv'
import { Bot } from 'gramio'
import Bonding from '../services/onchain/bonding'
import { logger } from '../utils/logger'
import { renderBonding } from './_utils/template'

dotenv.config({
  path: ['.env.local', 'env']
})

const CHANNEL_NAME = '@pumpfun_bonding_alert'

export default class BotChannel {
  private readonly SOL_RPC_URL = process.env.SOLANA_RPC_URL
  private readonly BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

  /**
   * Telegram Bot
   * @private
   */
  private _bot: Bot

  private _conn: Connection

  /**
   * Bonding 服务
   * 接收流动性注入通知
   * @private
   */
  private _bonding: Bonding

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
  }

  /**
   *
   */
  start() {
    this._bot.onStart((params) => {
      logger.info(`Channel Bot ${params.info.first_name} running...`)
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

    this._bot.api.sendMessage({
      chat_id: CHANNEL_NAME,
      text: renderBonding(name, symbol, address)
    })
  }
}

