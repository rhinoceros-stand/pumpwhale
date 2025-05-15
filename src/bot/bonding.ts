import { Connection } from '@solana/web3.js'
import { get } from 'lodash'
import { createNanoEvents } from 'nanoevents'
import Bonding from '../services/onchain/bonding'
import { decodeVirtualCurveTransaction } from '../services/onchain/transaction'
import { getTokenMeatData } from '../services/onchain/metadata'
import { sendNotification } from '../services/pushing'
import { logger } from '../utils/logger'

export default class BondingBot {
  private readonly _conn: Connection
  private readonly _emitter = createNanoEvents()

  /**
   * Bonding 服务
   * 接收流动性注入通知
   * @private
   */
  private _bonding: Bonding

  constructor(rpcUrl: string) {
    this._conn = new Connection(rpcUrl, 'confirmed')
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
   * @param isMint
   */
  async handleLiquidBounding(signature: string, isMint: any) {
    try {
      if (isMint.isPumpFunMint) {

      }

      if (isMint.isLaunchCoinMint) {
        const mintAddress = await decodeVirtualCurveTransaction(signature, this._conn)
        if (!mintAddress) {
          return
        }

        const tokenMeta = await getTokenMeatData(mintAddress, this._conn)
        logger.info(`Fetching Liquidity Merged：${tokenMeta.symbol} ${tokenMeta.address}`)
        if (isMint.isLaunchCoinMint) {
          const userName = get(tokenMeta.json, 'metadata.tweetCreatorUsername')
          const image = get(tokenMeta.json, 'image')

          if (!userName) {
            return
          }
          await sendNotification(`${tokenMeta.symbol} ${userName ? `@${userName}` : ''}`, tokenMeta.address, image)
        }
      }
    } catch (err) {
      console.log('Insert Error', err)
    }
  }
}

