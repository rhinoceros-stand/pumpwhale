import * as dotenv from 'dotenv'
import BotBonding from '../bot/bonding'

dotenv.config({
  path: ['.env.local', 'env']
})

const bot = new BotBonding(process.env.SOLANA_RPC_URL)

bot.initService()
bot.start()
