import { Connection, Logs, PublicKey } from '@solana/web3.js'
import { Emitter } from 'nanoevents'
import { logger } from '../../utils/logger'
import { OnChainService } from './index'

const PUMP_FUN_LIQUIDITY_BONDING_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')

export default class Bonding implements OnChainService {
  private _conn: Connection
  private _emitter: Emitter
  private _listenId: number

  init(conn: Connection, emitter: Emitter): boolean {
    this._conn = conn
    this._emitter = emitter
    return true
  }

  start(): boolean {
    if (!this._conn) {
      throw new Error('RPC empty connection, initialize it at first.')
    }

    this._listenId = this._conn.onLogs(PUMP_FUN_LIQUIDITY_BONDING_ADDRESS, (logs) => {
      const { signature } = logs

      const logList = logs.logs
      const isTokenBounding = logList && logList.some(log => log.includes('initialize2'))
      if (!isTokenBounding) {
        return
      }

      logger.info(`Fetching Bonding Event: ${signature}`)

      if (this._emitter) {
        this._emitter.emit('mint', signature)
      }
    })

    logger.info('Register Bonding Callback!')

    return true
  }

  /**
   *
   */
  stop(): boolean {
    if (this._conn) {
      return
    }

    this._conn.removeOnLogsListener(this._listenId)
  }
}
