import { WebsocketAPI } from '@binance/connector-typescript'
import { get } from 'lodash'
import { logger } from '../utils/logger'

export default class Quoted {
  private readonly PRICE_TICKER_PAIR = 'SOLUSDT'
  private _wsClient: WebsocketAPI
  private SOL_PRICE: number = -1

  constructor() {
    const callbacks = {
      open: (client: WebsocketAPI) => {
        logger.info('Connected to Binance WebSocket server')
        client.avgPrice(this.PRICE_TICKER_PAIR)
      },
      close: () => {
        logger.info('Disconnected from WebSocket server')
      },
      message: (data: string) => {
        const parseData = JSON.parse(data)
        const priceText = get(parseData, 'result.price')
        this.SOL_PRICE = parseInt(parseData.result.price, 10)
      }
    }

    this._wsClient = new WebsocketAPI('', '', { callbacks })
  }
}
