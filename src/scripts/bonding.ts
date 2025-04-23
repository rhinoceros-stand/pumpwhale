import * as dotenv from 'dotenv'
import BondingBot from '../bot/bonding'

dotenv.config({
  path: ['.env.local', 'env']
})

const bot = new BondingBot(process.env.SOLANA_RPC_URL)

bot.initService()
bot.start()
