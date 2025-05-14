import { Connection, Logs, PublicKey } from '@solana/web3.js'
import { some } from 'lodash'
import { Emitter } from 'nanoevents'
import { logger } from '../../utils/logger'
import { OnChainService } from './index'

const PUMP_FUN_LIQUIDITY_BONDING_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')
const LAUNCH_COIN_METRORA_CURVE_ADDRESS = new PublicKey('CQdrEsYAxRqkwmpycuTwnMKggr3cr9fqY8Qma4J9TudY')

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

    this._listenId = this._conn.onLogs(LAUNCH_COIN_METRORA_CURVE_ADDRESS, (logs) => {
      const { signature } = logs
      const logList = logs.logs

      if (!Array.isArray(logList)) {
        return
      }

      console.log(logList, signature)

      const isMint = {
        isPumpFunMint: logList && logList.some(log => log.includes('initialize2')),
        isLaunchCoinMint: logList && logList.some(log => log.includes('MigrateMeteoraDamm'))
      }

      const isTokenBounding = some(Object.keys(isMint).map(key => isMint[key]), el => el)
      if (!isTokenBounding) {
        return
      }

      logger.info(`Fetching Bonding Event: ${signature}`)

      if (this._emitter) {
        this._emitter.emit('mint', signature, isMint)
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
