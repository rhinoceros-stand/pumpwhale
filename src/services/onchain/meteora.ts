import axios from 'axios'

/**
 * 获取流动性池信息
 * @param address
 */
export async function getPoolInfo(address: string) {
  return axios.get(`https://amm-v2.meteora.ag/pools?address=${address}`)
}
