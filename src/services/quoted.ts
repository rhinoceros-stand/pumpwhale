import { logger } from '../utils/logger'

const REST_API_OKX = 'https://www.okx.com/api/v5/market/index-tickers?instId=SOL-USDT'

export default class Quoted {
  private _timeId: Timer
  private SOL_PRICE: number = -1
  private _callback: (value: number) => void

  constructor({ onQuoteChange }) {
    this._callback = onQuoteChange

    this.onFetchPrice()
    this.callPriceOnce()
  }

  /**
   * 获取价格
   */
  async onFetchPrice() {
    const response = await (
      await fetch(REST_API_OKX)
    ).json()

    if (response.code === '0') {
      const data = response?.data[0]
      const lastPrice = data?.idxPx
      if (lastPrice) {
        this.SOL_PRICE = Number(lastPrice)
        logger.info(`SOLUSDT: ${lastPrice}`)
        return this.SOL_PRICE
      } else {
        throw new Error('Bybit SOLUSD ticker price not found.')
      }
    }
  }

  /**
   *
   */
  callPriceOnce() {
    this._timeId = setTimeout(this.onFetchPrice.bind(this), 1000 * 5 * 10)
  }
}
