import { Bot } from 'gramio'
import chalk from 'chalk'

export type TokenMeta = {
  name: string
  symbol: string
  address: string
}

export default class Telegram {
  bot: Bot

  constructor({ secret }) {
    this.bot = new Bot(secret) // put you token here
      .command('start', (context) => context.send('Hi!'))
      .onStart((params) => {
        console.log(`Telegram bot[${chalk.blue(params.info.first_name)}] running...`)
      })
  }
}
