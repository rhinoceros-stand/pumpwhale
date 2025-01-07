import { Connection } from '@solana/web3.js'
import { assertIsAddress } from '@solana/addresses'
import { Bot } from 'gramio'
import { pick } from 'lodash'
import Database from '../services/database'
import { logger } from '../utils/logger'
import { displayMarketCapitalization, renderToken } from '../services/telegram/_utils/template'
import { getTokenMeta } from '../services/okx/token'

export default class MessageBot {
  private readonly SOL_RPC_URL = process.env.SOLANA_RPC_URL
  private readonly BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

  private readonly _database: Database

  /**
   * Telegram Bot
   * @private
   */
  private _bot: Bot

  private _conn: Connection

  constructor() {
    this._conn = new Connection(this.SOL_RPC_URL, 'confirmed')
    this._bot = new Bot(this.BOT_SECRET)
    this._database = new Database()
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
    this._bot
      .command('start', (context) => context.send('Hello!'))
      .onStart((params) => {
        logger.info(`Message Bot ${params.info.first_name} running...`)
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

    this._bot.start()
  }
}
