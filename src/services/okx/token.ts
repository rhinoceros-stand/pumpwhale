import request, { SOLANA_CHAIN_ID } from './request'

/**
 * 获取代币价格
 * @param tokenAddress
 */
export async function getTokenPrice(tokenAddress: string) {
  return request('/api/v5/wallet/token/current-price', [
    {
      chainIndex: SOLANA_CHAIN_ID,
      tokenAddress
    }
  ], 'POST')
}

/**
 * 获取代币信息
 * @param tokenAddress
 */
export async function getTokenMeta(tokenAddress: string) {
  return request('/api/v5/wallet/token/token-detail', {
    chainIndex: SOLANA_CHAIN_ID,
    tokenAddress
  })
}
