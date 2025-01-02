import { Bot } from 'gramio'
import { logger } from '../../utils/logger'
import { renderBonding } from './_utils/template'

const CHANNEL_NAME = '@pumpfun_bonding_alert'

export default class ChannelBot {
  /**
   * Telegram Bot
   * @private
   */
  private _bot: Bot

  constructor(secret: string) {
    this._bot = new Bot(secret)
  }

  /**
   *
   */
  start() {
    this._bot.onStart((params) => {
      logger.info(`Channel Bot ${params.info.first_name} running...`)
    })
  }

  /**
   * 发送 Bonding 消息
   * @param message
   */
  sendBondingMessage(message: any) {
    const { name, symbol, address } = message

    this._bot.api.sendMessage({
      chat_id: CHANNEL_NAME,
      text: renderBonding(name, symbol, address)
    })
  }
}

