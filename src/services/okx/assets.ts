import request, { SOLANA_CHAIN_ID } from './request'

/**
 * 获取地址总资产价值
 * @param address
 */
export async function getAddressTotalValue(address: string) {
  return request('/api/v5/wallet/asset/total-value-by-address', {
    address,
    chains: SOLANA_CHAIN_ID
  })
}

/**
 * 获取地址资产明细
 * @param address
 */
export async function getAddressAssets(address: string) {
  return request('/api/v5/wallet/asset/all-token-balances-by-address', {
    address,
    chains: SOLANA_CHAIN_ID
  })
}
