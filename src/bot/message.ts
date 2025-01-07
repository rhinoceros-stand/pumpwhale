import { Connection } from '@solana/web3.js'
import { Bot } from 'gramio'
import { logger } from '../utils/logger'

const PRIVATE_CHAT_ID = 7216621593

export default class MessageBot {
  private readonly SOL_RPC_URL = process.env.SOLANA_RPC_URL
  private readonly BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

  /**
   * Telegram Bot
   * @private
   */
  private _bot: Bot

  private _conn: Connection

  constructor() {
    this._conn = new Connection(this.SOL_RPC_URL, 'confirmed')
    this._bot = new Bot(this.BOT_SECRET)
  }

  /**
   * 初始化服务
   */
  async initService() {
  }

  /**
   *
   */
  start() {
    this._bot.onStart((params) => {
      logger.info(`Message Bot ${params.info.first_name} running...`)
    })
  }
}
