import { Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv'
import { Bot } from 'gramio'
import chalk from 'chalk'
import PumpFun from '../services/pumpfun'
import Trading from '../services/trading'
import { logger } from '../utils/logger'
import { renderSwap } from './_utils/template'
import Bonding from '../services/onchain/bonding'

dotenv.config({
  path: ['.env.local', 'env']
})

const PRIVATE_CHAT_ID = 7216621593

export default class BotMessage {
  private readonly SOL_RPC_URL = process.env.SOLANA_RPC_URL
  private readonly BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

  private _bot: Bot
  private _conn: Connection
  private _trading: Trading
  private _bonding: Bonding

  constructor() {
    this._conn = new Connection(this.SOL_RPC_URL, 'confirmed')
    this._bot = new Bot(this.BOT_SECRET)
  }

  /**
   * 初始化服务
   */
  initService() {
    this._trading = new Trading()
    this._trading.setConnection(this._conn)

    this._bonding = new Bonding()
    this._bonding.init(this._conn)
    this._bonding.start()
    this._bonding.onPairBonding = this.onPairBonding
  }

  start() {
    this._bot.onStart((params) => {
      logger.info(`Swap Bot ${params.info.first_name} running...`)
    })
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

    logger.info(`${name} ($${chalk.yellow(symbol)}) ${address}`)

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
