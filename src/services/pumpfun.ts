import { Connection, Logs, PublicKey } from '@solana/web3.js'
import chalk from 'chalk'
import { decodeTransferTransaction } from '../metadata'

export default class PumpFun {
  /**
   *
   * @private
   */
  private PUMP_FUN_ADDRESS = new PublicKey('TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM')

  /**
   * Bonding Address
   * Pumpfun send liquid from there
   * @private
   */
  private PUMP_FUN_LIQUIDITY_BONDING_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')


  /**
   *
   * @private
   */
  private readonly _connection: Connection

  constructor({ connection }) {
    this._connection = connection
  }

  private register(connection: Connection) {
    connection.onLogs(this.PUMP_FUN_LIQUIDITY_BONDING_ADDRESS, (logs) => {
      this.decodeBondingEvent(logs)
    })
  }

  async decodeBondingEvent(logData: Logs) {
    const {
      signature,
      logs
    } = logData

    if (!Array.isArray(logs)) {
      return
    }

    if (logs.length < 10) {
      return
    }

    const event = logs[7]
    if (event.indexOf('initialize2') > -1) {
      const tokenInfo = await decodeTransferTransaction(this._connection, signature)
      if (tokenInfo) {
        console.log(`${chalk.blue(Date.now())} Pump.fun Liquidity Merged ${chalk.yellow(signature)}`)

        return tokenInfo
      } else {
        console.log(`${chalk.blue(Date.now())} Decode signature failed: ${chalk.cyan(signature)}`)
        return
      }
    } else {
      console.log(`${chalk.blue(Date.now())} Not initialize2 ${chalk.cyan(signature)}`)
    }
  }

  start() {
    if (!this._connection) {
      console.log('Connection not initialize, please load it at first')

      return
    }

    this.register(this._connection)
  }
}
