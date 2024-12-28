import { Bot } from 'gramio'
import chalk from 'chalk'
import { format, bold, link } from '@gramio/format'

let bot: Bot

const CHANNEL_NAME = '@pumpfun_bonding_alert'

const run = () => {
  bot = new Bot(process.env.TELEGRAM_BOT_SECRET) // put you token here
    .command('start', (context) => context.send('Hi!'))
    .onStart((params) => {
      console.log(`Telegram bot[${chalk.blue(params.info.first_name)}] running...`)
    })

  bot.start()
}

const sendMessage = (token: any) => {
  bot.api.sendMessage({
    chat_id: CHANNEL_NAME,
    text:
      format`
        ${bold(token.name)}($${bold(token.symbol)})
        Address: ${bold(token.address)}
        Links: ${link(
        'Pump.fun',
        `https://pump.fun/coin/${token.address}`
      )} | ${link(
        'GMGN.ai',
        `https://gmgn.ai/sol/token/${token.address}`
      )}`
  })
}

export default {
  run,
  sendMessage
}
