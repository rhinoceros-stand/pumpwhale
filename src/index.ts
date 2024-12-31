import chalk from 'chalk'
import { pick } from 'lodash'
import * as dotenv from 'dotenv'
import { getWalletProfit } from './api/gmgn'

(async () => {
  dotenv.config({
    path: ['.env.local', 'env']
  })

  const profitList = await getWalletProfit('ByMszMN63xeJs9CqqaErRmKqJx4sjZd6eHfqQwwyDSSk')
  const coloredList = profitList.map(v => {
    const profit = Number(v.profit)
    return {
      ...pick(v,[
        'symbol',
        'tokenAddress',
      ]),
      profit: profit >= 0 ? chalk.green(profit.toFixed(2)) : chalk.red(Math.abs(profit).toFixed(2)),
      holding: v.balance <= 0 ? chalk.white('SOLD') : chalk.yellowBright('HODL')
    }
  })

  console.table(coloredList)
})()
