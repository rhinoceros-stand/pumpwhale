import chalk from 'chalk'
import { pick } from 'lodash'
import * as dotenv from 'dotenv'
import { Connection } from '@solana/web3.js'
import Trading from './services/trading'
import { getWalletProfit } from './api/gmgn'

(async () => {
  dotenv.config({
    path: ['.env.local', 'env']
  })

  const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')

  const profitList = await getWalletProfit('')
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
