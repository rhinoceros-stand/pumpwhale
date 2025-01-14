import { Cron } from 'croner'
import { pick, toNumber } from 'lodash'
import Database from '../services/database'
import { logger } from '../utils/logger'
import { getTokenPrice } from '../services/okx/token'

const database = new Database()

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
  const response = await (
    await getTokenPrice(row.address)
  ).json()

  if (response.code === '0') {
    const {
      price
    } = pick(response.data[0], [
      'price'
    ])

    const decimalWithZero = 10 ** row.decimals
    const marketCapitalization = Math.trunc(price * (Number(row.supply) / decimalWithZero))

    const updateResult = await collection.updateOne({ tokenAddress: row.tokenAddress }, {
      $set: {
        price: toNumber(price),
        marketCap: marketCapitalization,
        status: 1
      }
    })

    if (updateResult.modifiedCount > 0) {
      logger.info(`Update token success：${row.symbol} ${row.address}`)
    }
  }

  console.log('res', response)
})

const fetchingPriceJob = new Cron('0 */1 * * * *', async () => {
})

