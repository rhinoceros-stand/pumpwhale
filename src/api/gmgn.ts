import { get } from 'lodash'
import chalk from 'chalk'

/**
 * 获取钱包利润
 * @param walletAddress
 */
export const getWalletProfit = async (walletAddress: string) => {
  const response = await (
    await fetch(`https://gmgn.ai/api/v1/wallet_holdings/sol/${walletAddress}?limit=100&orderby=last_active_timestamp&direction=desc&showsmall=true&sellout=true&tx30d=true`, {
      credentials: 'include',
      headers: {
        Cookie: process.env.GMGN_COOKIES,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    })
  ).json()

  const holdings = get(response, 'data.holdings')
  if (Array.isArray(holdings) && holdings.length > 0) {
    return holdings.map(v => {
      const profit = Number(v.realized_profit)
      return {
        ...v,
        profit
      }
    }).sort((a, b) => b.profit - a.profit).map(v => {
      const profit = Number(v.profit)
      return {
        symbol: v.token.symbol,
        tokenAddress: v.token.token_address,
        profit: profit > 0 ? chalk.green(profit.toFixed(2)) : chalk.red(profit.toFixed(2))
      }
    })
  }

  return []
}
