import { WebsocketAPI } from '@binance/connector-typescript'
import { get } from 'lodash'
import { logger } from '../utils/logger'

export default class Quoted {
  private readonly PRICE_TICKER_PAIR = 'SOLUSDT'
  private _wsClient: WebsocketAPI
  private _timeId: Timer
  private SOL_PRICE: number = -1
  private _callback: (value: number) => void

  constructor({ onQuoteChange }) {
    this._callback = onQuoteChange
    this._wsClient = new WebsocketAPI('', '', {
      callbacks: {
        open: () => {
          logger.info('Connected to Binance WebSocket server')
          this.handleGetQuote()
        },
        close: () => {
          logger.info('Disconnected from WebSocket server')
        },
        message: this.onPriceMessage.bind(this)
      }
    })
  }

  onPriceMessage(data: string) {
    const parseData = JSON.parse(data)
    const priceText = get(parseData, 'result.price')
    this.SOL_PRICE = parseInt(priceText, 10)
    logger.info(`SOLUSDT: ${priceText}`)

    if (this._callback) {
      this._callback(this.SOL_PRICE)
    }

    this._timeId = setTimeout(this.handleGetQuote.bind(this), 50000)
  }

  /**
   * 获取报价
   */
  handleGetQuote() {
    this._wsClient.avgPrice(this.PRICE_TICKER_PAIR)
  }
}
