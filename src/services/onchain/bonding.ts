import { Connection, Logs, PublicKey } from '@solana/web3.js'
import { logger } from '../../utils/logger'
import { decodeTransferTransaction } from '../../metadata'
import { OnChainService } from './index'

const PUMP_FUN_LIQUIDITY_BONDING_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')

export default class Bonding implements OnChainService {
  private _conn: Connection
  private _callback: (data: any) => void

  init(conn: Connection): boolean {
    this._conn = conn
    return true
  }

  start(): boolean {
    if (!this._conn) {
      throw new Error('RPC empty connection, initialize it at first.')
    }

    this._conn.onLogs(PUMP_FUN_LIQUIDITY_BONDING_ADDRESS, (logs) => {
      const { signature } = logs

      const logList = logs.logs

      if (!Array.isArray(logList)) {
        return
      }

      const isTokenBounding = logList && logList.some(log => log.includes('initialize2'))
      if (!isTokenBounding) {
        return
      }

      decodeTransferTransaction(this._conn, signature).then((mint) => {
        logger.info(`Fetching Liquidity Merged：${mint.symbol} ${mint.address}`)
        if (this._callback) {
          this._callback(mint)
        }
      }).catch(err => logger.error(`Decoding tx ${signature} failed `, err))
    })

    logger.info('Register Bonding Callback!')

    return true
  }

  stop(): boolean {
  }

  /**
   *
   * @param callback
   */
  setCallback(callback: any) {
    this._callback = callback
  }
}
