import { bold, format, link } from '@gramio/format'

/**
 * 输出 Bonding 消息
 * @param mintAddress
 * @param symbol
 * @param name
 * @param holders
 */
export function renderBonding(mintAddress: string, symbol: string, name: string, holders: number) {
  return format`
   ${bold(name)}($${bold(symbol)})
   ${bold(mintAddress)}
   Holders: ${bold(holders)}
   Links: ${link(
    'Pump.fun', `https://pump.fun/coin/${mintAddress}`
  )} | ${link(
    'GMGN.ai', `https://gmgn.ai/sol/token/${mintAddress}`
  )} | ${link(
    'SOLSCAN', `https://solscan.io/token/${mintAddress}`
  )}`
}

export function renderToken(mintAddress: string, symbol: string, mcap: string, volumes: string, name: string) {
  return format`
   ${bold(name)}($${bold(symbol)})
   ${bold(mintAddress)}
   MarketCap: ${bold(mcap)}
   Volumes(24H): ${bold(volumes)}
   Links: ${link(
    'Pump.fun', `https://pump.fun/coin/${mintAddress}`
  )} | ${link(
    'GMGN.ai', `https://gmgn.ai/sol/token/${mintAddress}`
  )} | ${link(
    'SOLSCAN', `https://solscan.io/token/${mintAddress}`
  )}`
}

/**
 * 输出 Swap 消息
 * @param name
 * @param symbol
 * @param mintAddress
 * @param tx
 */
export function renderSwap(name: string, symbol: string, mintAddress: string, tx: string) {
  return format`
   Swap 0.0005SOL for ${bold(name)}($${bold(symbol)})
   ${bold(mintAddress)}
   Links: ${link(
    'GMGN.ai', `https://gmgn.ai/sol/token/${mintAddress}`
  )} | ${link(
    'TX', `https://solscan.io/tx/${tx}`
  )}`
}

/**
 * 市值显示转换
 * @param value
 */
export function displayMarketCapitalization(value: number) {
  let getValue = value
  if (value > 1000000) {
    getValue = value / 1000000

    return `${Math.trunc(getValue)}M`
  }
  if (value < 1000000) {
    getValue = value / 1000

    return `${Math.trunc(getValue)}K`
  }

  if (value < 100000) {
    return `${Math.trunc(getValue)}K`
  }
}
