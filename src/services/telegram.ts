import { Bot } from 'gramio'
import chalk from 'chalk'
import { format, bold, link } from '@gramio/format'

const CHANNEL_NAME = '@pumpfun_bonding_alert'
let bot: Bot

const sendMessage = (token: any) => {
  bot.api.sendMessage({
    chat_id: CHANNEL_NAME,
    text:
      format`
        ${bold(token.name)}($${bold(token.symbol)})
        ${bold(token.address)}
        Links: ${link(
        'Pump.fun',
        `https://pump.fun/coin/${token.address}`
      )} | ${link(
        'GMGN.ai',
        `https://gmgn.ai/sol/token/${token.address}`
      )} | ${link(
        'SOLSCAN',
        `https://solscan.io/token/${token.address}`
      )}`
  })
}

/**
 * 获取 Bot 实例
 */
const getBot = () => {
  if (!bot) {
    console.log(`Telegram bot not initialized, Run bot first.`)
  }

  bot = new Bot(process.env.TELEGRAM_BOT_SECRET) // put you token here
    .command('start', (context) => context.send('Hi!'))
    .onStart((params) => {
      console.log(`Telegram bot[${chalk.blue(params.info.first_name)}] running...`)
    })

  bot.start()

  return bot
}

export default {
  getBot,
  sendMessage
}
