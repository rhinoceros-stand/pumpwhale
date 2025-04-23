import request from './request'

export async function getSupportChains() {
  return request('/api/v5/wallet/chain/supported-chains')
}
