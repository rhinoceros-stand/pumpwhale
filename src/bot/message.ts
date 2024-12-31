import * as dotenv from 'dotenv'
import { Bot } from 'gramio'
import chalk from 'chalk'
import { bold, format, link } from '@gramio/format'
import { Connection } from '@solana/web3.js'
import PumpFun from '../services/pumpfun'
import Trading from '../services/trading'

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

  console.log(`${chalk.blue(name)}($${chalk.yellow(symbol)}) ${chalk.white(address)}`)
  const tx = await trading.startTokenSwap(address)
  if (!tx) {
    return
  }

  // start swap
  bot.api.sendMessage({
    chat_id: PRIVATE_CHAT_ID,
    text:
      format`
        Swap 0.0005SOL for ${bold(name)}($${bold(symbol)})
        ${bold(address)}
        Links: ${link(
        'GMGN.ai',
        `https://gmgn.ai/sol/token/${tokenData.address}`
      )} | ${link(
        'TX',
        `https://solscan.io/tx/${tx}`
      )}`
  })
}

try {
  connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')
  trading = new Trading({
    connection
  })
  pumpFun = new PumpFun({
    connection,
    onPairBonding
  })
  console.info('RPC Connected')
} catch (err) {
  console.error('RPC Connection Error', err)
}

const secret = process.env.TELEGRAM_BOT_SECRET
const bot = new Bot(secret)
bot.onStart((params) => {
  console.log(`Swap Bot ${chalk.blue(params.info.first_name)} running...`)
})

bot.start()
pumpFun.start()

