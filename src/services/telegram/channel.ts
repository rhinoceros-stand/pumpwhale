import { assertIsAddress } from '@solana/addresses'
import { Bot } from 'gramio'
import { pick } from 'lodash'
import { logger } from '../../utils/logger'
import { displayMarketCapitalization, renderBonding, renderToken } from './_utils/template'
import { getTokenMeta } from '../okx/token'


const CHANNEL_NAME = '@pumpfun_bonding_alert'

export default class Channel {
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
    this._bot
      .command('start', (context) => context.send('Hello!'))
      .onStart((params) => {
        logger.info(`Telegram Channel Bot ${params.info.first_name} running...`)
      })
      .on('message', async (context) => {
        const { text } = context

        let isAddress = false

        try {
          assertIsAddress(text)

          isAddress = true
        } catch (e) {

        }

        if (isAddress) {
          try {
            const tokenResponse = await (
              await getTokenMeta(text)
            ).json()

            const tokenMeta = tokenResponse.data[0]

            const {
              symbol,
              name,
              marketCap,
              volume24h,
              tokenAddress
            } = pick(tokenMeta, [
              'symbol',
              'name',
              'marketCap',
              'volume24h',
              'tokenAddress'
            ])

            const capText = displayMarketCapitalization(Number(marketCap))
            const volumeText = displayMarketCapitalization(Number(volume24h))
            return context.send(renderToken(tokenAddress, symbol, capText, volumeText, name))
          } catch (e) {

          }
        } else {
          return context.send('Hi!')
        }
      })
  }

  /**
   * 发送 Bonding 消息
   * @param message
   */
  sendBondingMessage(message: any) {
    const { name, symbol, address, holders } = message

    this._bot.api.sendMessage({
      chat_id: CHANNEL_NAME,
      text: renderBonding(address, symbol, name, holders)
    })
  }
}

