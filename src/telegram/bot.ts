import { Bot } from 'gramio'
import { format, bold, italic, spoiler, link } from '@gramio/format'
import { MessageType, publishMessageToChannel, subscribeToChannel } from '../message'

let bot: Bot

const run = () => {
  bot = new Bot(process.env.TELEGRAM_BOT_SECRET) // put you token here
    .command("start", (context) => context.send("Hi!"))
    .onStart(console.log)
  bot.start()

  subscribeToChannel(MessageType.TRADING, (message) => {
    const parsedMessage = JSON.parse(message)

    bot.api.sendMessage({
      chat_id: -4604354193,
      text:
        format`Name: ${bold(parsedMessage.name)}
        Symbol: $${bold(parsedMessage.symbol)}
        Address: ${bold(parsedMessage.address)}
        Links: ${link(
          "Pump.fun",
          `https://pump.fun/coin/${parsedMessage.address}`
        )} | ${link(
          "GMGN.ai",
          `https://gmgn.ai/sol/token/${parsedMessage.address}`
        )}
        `,
    })
  })

  console.log(`bot running...`)
}

run()

export default {
  run
}
