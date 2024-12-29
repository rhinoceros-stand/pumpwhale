import * as dotenv from 'dotenv'
import { Connection } from '@solana/web3.js'
import { bold, format, link } from '@gramio/format'
import PumpFun from '../services/pumpfun'
import Telegram from '../services/telegram'

dotenv.config({
  path: ['.env.local', 'env']
})

const CHANNEL_NAME = '@pumpfun_bonding_alert'
let connection: Connection

try {
  connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')
  console.info('Solana RPC Connection Success, Monitoring Pump.fun Bonding Address!')
} catch (err) {
  console.error('Solana RPC Connection Error', err)
}

const telegram = new Telegram({
  secret: process.env.TELEGRAM_BOT_SECRET
})

const onPairBonding = (tokenData) => {
  telegram.bot.api.sendMessage({
    chat_id: CHANNEL_NAME,
    text:
      format`
        ${bold(tokenData.name)}($${bold(tokenData.symbol)})
        ${bold(tokenData.address)}
        Links: ${link(
        'Pump.fun',
        `https://pump.fun/coin/${tokenData.address}`
      )} | ${link(
        'GMGN.ai',
        `https://gmgn.ai/sol/token/${tokenData.address}`
      )} | ${link(
        'SOLSCAN',
        `https://solscan.io/token/${tokenData.address}`
      )}`
  })
}

new PumpFun({
  connection,
  onPairBonding
}).start()

