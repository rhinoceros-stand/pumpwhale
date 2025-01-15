import { Cron } from 'croner'
import { findLast, pick } from 'lodash'
import { Connection } from '@solana/web3.js'
import Database from '../services/database'
import { calcMarketCapitalization, getTokenMeatData, getTokenPriceShortly, getUpdatePriority } from '../services/onchain/metadata'
import { decodeBondingTransaction } from '../services/onchain/transaction'
import { getTokenListPrice, getTokenPrice } from '../services/okx/token'
import { logger } from '../utils/logger'

const database = new Database()
const connection = new Connection(process.env.SOLANA_RPC_URL, {
  commitment: 'confirmed'
})

/**
 * 获取代币信息
 */
const fetchingTokenJob = new Cron('*/10 * * * * *', async () => {
  const db = await database.getDB()
  const collection = db.collection('tokens')
  const rows = await collection.find({
    status: {
      $exists: false
    }
  }).limit(1).toArray()

  if (rows.length === 0) {
    return
  }

  const row = rows[0]
  if (!row.address) {
    // 获取token信息
    const mintAddress = await decodeBondingTransaction(row.signature, connection)
    const tokenMeta = await getTokenMeatData(mintAddress, connection)
    logger.info(`Fetching Token Meta：${tokenMeta.symbol} ${tokenMeta.address}`)
    await collection.updateOne({ signature: row.signature }, {
      $set: {
        ...tokenMeta
      }
    })

    return
  }

  const response = await (
    await getTokenPrice(row.address)
  ).json()

  if (response.code === '0') {
    const { price } = pick(response.data[0], [
      'price',
      'tokenAddress'
    ])

    const mc = calcMarketCapitalization(price, row.supply, row.decimals)
    const updateResult = await collection.updateOne({ signature: row.signature }, {
      $set: {
        price: getTokenPriceShortly(price),
        marketCap: mc,
        // 1 代币价格获取成功；2 代币初始化完成
        status: 1
      }
    })

    if (updateResult.modifiedCount > 0) {
      logger.info(`Update token success：${row.symbol} ${row.address}`)
    }
  }
})

/**
 * 获取代币价格
 */
const fetchingPriceJob = new Cron('0 */1 * * * *', async () => {
  const db = await database.getDB()
  const collection = db.collection('tokens')
  const rows = await collection.find({
    status: {
      $eq: 1
    }
  }).limit(50).toArray()

  if (rows.length === 0) {
    return
  }

  try {
    const tokens = rows.map(token => token.address)
    const response = await (
      await getTokenListPrice(tokens)
    ).json()

    const {
      data,
      msg
    } = pick(response, [
      'data',
      'msg'
    ])

    if (response.msg !== 'success') {
      logger.error(`Calling getTokenListPrice error: ${msg}`)
      return
    }

    const hasData = Array.isArray(data) && data.length > 0
    if (!hasData) {
      return
    }

    for (const row of rows) {
      const matched = findLast(data, item => item.tokenAddress === row.address)
      if (matched) {
        const mc = calcMarketCapitalization(matched.price, row.supply, row.decimals)
        const price = getTokenPriceShortly(matched.price)
        const priority = getUpdatePriority(mc)
        await collection.updateOne({ signature: row.signature }, {
          $set: {
            price,
            marketCap: mc,
            status: 2,
            priority
          }
        })

        logger.info(`Update ${row.address} priority: ${priority} price: ${price}`)
      }
    }

  } catch (e) {

  }
})

