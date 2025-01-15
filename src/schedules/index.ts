import { Cron } from 'croner'
import { pick, toNumber } from 'lodash'
import { Connection } from '@solana/web3.js'
import { getTokenMeatData } from '../services/onchain/metadata'
import { decodeBondingTransaction } from '../services/onchain/transaction'
import Database from '../services/database'
import { logger } from '../utils/logger'
import { getTokenPrice } from '../services/okx/token'


const database = new Database()
const connection = new Connection(process.env.SOLANA_RPC_URL, {
  commitment: 'confirmed'
})

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

    const decimalWithZero = 10 ** row.decimals
    const priceZeroCount = -Math.floor(Math.log(price) / Math.log(10) + 1)
    const marketCapitalization = Math.trunc(price * (Number(row.supply) / decimalWithZero))

    const startIndex = price.indexOf('.') + priceZeroCount
    const priceUpdate = price.substring(0, startIndex + 5)

    const updateResult = await collection.updateOne({ signature: row.signature }, {
      $set: {
        price: toNumber(priceUpdate),
        marketCap: marketCapitalization,
        status: 1
      }
    })

    if (updateResult.modifiedCount > 0) {
      logger.info(`Update token success：${row.symbol} ${row.address}`)
    }
  }
})

const fetchingPriceJob = new Cron('0 */1 * * * *', async () => {
})

