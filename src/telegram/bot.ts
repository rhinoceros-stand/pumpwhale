import { Bot } from 'gramio'
import { format, bold, italic, spoiler, link } from '@gramio/format'
import { MessageType, publishMessageToChannel, subscribeToChannel } from '../message'

let bot: Bot

const run = () => {
  bot = new Bot(process.env.TELEGRAM_BOT_SECRET) // put you token here
    .command('start', (context) => context.send('Hi!'))
    .onStart(console.log)
  bot.start()

  console.log(`bot running...`)
}

const sendMessage = (token) => {
  bot.api.sendMessage({
    chat_id: -4604354193,
    text:
      format`Name: ${bold(token.name)}
        Symbol: $${bold(token.symbol)}
        Address: ${bold(token.address)}
        Links: ${link(
        'Pump.fun',
        `https://pump.fun/coin/${token.address}`
      )} | ${link(
        'GMGN.ai',
        `https://gmgn.ai/sol/token/${token.address}`
      )}
        `
  })
}

export default {
  run,
  sendMessage
}
