import { Connection } from '@solana/web3.js'
import { createNanoEvents } from 'nanoevents'
import Database from '../services/database'
import Bonding from '../services/onchain/bonding'
import { decodeBondingTransaction } from '../services/onchain/transaction'
import { getTokenMeatData } from '../services/onchain/metadata'
import { logger } from '../utils/logger'

export default class BondingBot {
  private readonly _conn: Connection
  private readonly _database: Database
  private readonly _emitter = createNanoEvents()

  /**
   * Bonding 服务
   * 接收流动性注入通知
   * @private
   */
  private _bonding: Bonding

  constructor(rpcUrl: string) {
    this._conn = new Connection(rpcUrl, 'confirmed')
    this._database = new Database()
  }

  /**
   * 初始化服务
   */
  initService() {
    this._bonding = new Bonding()
    this._bonding.init(this._conn, this._emitter)
    this._emitter.on('mint', this.handleLiquidBounding.bind(this))
  }

  /**
   *
   */
  start() {
    this._bonding.start()
  }

  /**
   *
   * @param signature
   */
  async handleLiquidBounding(signature: string) {
    try {
      const db = await this._database.getDB()
      const collection = db.collection('tokens')
      await collection.insertOne({
        signature,
        launchTime: Date.now()
      })

      const mintAddress = await decodeBondingTransaction(signature, this._conn)
      const tokenMeta = await getTokenMeatData(mintAddress, this._conn)

      logger.info(`Fetching Liquidity Merged：${tokenMeta.symbol} ${tokenMeta.address}`)

      // Send Event to Telegram Channel
      this._emitter.emit('channel', tokenMeta)

      const updateResult = await collection.updateOne({ signature }, {
        $set: {
          ...tokenMeta
        }
      })

      if (updateResult.modifiedCount > 0) {
        logger.info(`Update token success：${tokenMeta.symbol} ${tokenMeta.address}`)
      }
    } catch (err) {
      console.log('Insert Error', err)
    }
  }
}

