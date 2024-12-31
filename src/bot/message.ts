import { Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv'
import { Bot } from 'gramio'
import chalk from 'chalk'
import PumpFun from '../services/pumpfun'
import Trading from '../services/trading'
import { logger } from '../utils/logger'
import { renderSwap } from './_utils/template'

dotenv.config({
  path: ['.env.local', 'env']
})

const PRIVATE_CHAT_ID = 7216621593
let connection: Connection
let trading: Trading
let pumpFun: PumpFun

/**
 *
 * @param tokenData
 */
const onPairBonding = async (tokenData) => {
  const {
    address,
    name,
    symbol
  } = tokenData

  logger.info(`${name} ($${chalk.yellow(symbol)}) ${address}`)

  const tx = await trading.startTokenSwap(address)
  if (!tx) {
    return
  }

  // start swap
  bot.api.sendMessage({
    chat_id: PRIVATE_CHAT_ID,
    text: renderSwap(name, symbol, address, tx)
  })
}

try {
  connection = new Connection(process.env.SOLANA_RPC_URL + '1', 'confirmed')
  trading = new Trading({
    connection
  })
  pumpFun = new PumpFun({
    connection,
    onPairBonding
  })

  logger.info('RPC Connected')
} catch (err) {
  logger.error('RPC Connection Error', err)
}

const secret = process.env.TELEGRAM_BOT_SECRET
const bot = new Bot(secret)
bot.onStart((params) => {
  console.log(`Swap Bot ${chalk.blue(params.info.first_name)} running...`)
})

// bot.start()
// pumpFun.start()

