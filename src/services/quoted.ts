import { Spot } from '@binance/connector-typescript'
import { logger } from '../utils/logger'

export default class Quoted {
  private _client
  private _timeId: Timer
  private SOL_PRICE: number = -1
  private _callback: (value: number) => void

  constructor({ onQuoteChange }) {
    this._callback = onQuoteChange

    this._client = new Spot('', '', { baseURL: 'https://api.binance.com' })
    this.onFetchPrice()
  }

  async onFetchPrice() {
    const response = await this._client.currentAveragePrice('SOLUSDT')
    this.SOL_PRICE = Number(response.price)
    logger.info(`SOLUSDT: ${response.price}`)

    if (this._callback) {
      this._callback(this.SOL_PRICE)
    }

    this._timeId = setTimeout(this.onFetchPrice.bind(this), 1000 * 60 * 10)
  }
}
