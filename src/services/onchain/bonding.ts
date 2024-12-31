import { OnChainService } from './index'
import { Connection, Logs, PublicKey } from '@solana/web3.js'
import { decodeTransferTransaction } from '../../metadata'
import { logger } from '../../utils/logger'

const PUMP_FUN_LIQUIDITY_BONDING_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')

export default class Bonding implements OnChainService {
  private _conn: Connection
  public onPairBonding: (data: any) => void

  init(conn: Connection): boolean {
    this._conn = conn
    return true
  }

  start(): boolean {
    if (!this._conn) {
      throw new Error('RPC empty connection, initialize it at first.')
    }

    this._conn.onLogs(PUMP_FUN_LIQUIDITY_BONDING_ADDRESS, this.decodeEvent)


    return true
  }

  stop(): boolean {
  }

  /**
   * 解析 Bonding 事件
   * @param logData
   */
  async decodeEvent(logData: Logs) {
    const {
      signature,
      logs
    } = logData

    if (!Array.isArray(logs)) {
      return
    }

    const isTokenBounding = logs && logs.some(log => log.includes('initialize2'))
    if (!isTokenBounding) {
      return
    }

    try {
      const tokenInfo = await decodeTransferTransaction(this._conn, signature)
      logger.info(`Fetching Liquidity Merged：${tokenInfo.symbol} ${tokenInfo.address}`)

      return tokenInfo
    } catch (err) {
      throw new Error('Decoding tx failed', err)
    }
  }
}
