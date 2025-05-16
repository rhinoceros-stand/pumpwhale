import { Connection, PublicKey } from '@solana/web3.js'
import { get } from 'lodash'
import { logger } from '../../utils/logger'
import { getPoolInfo } from './meteora'

/**
 * Decode virtual curve tx
 * @param signature
 * @param connection
 */
export async function decodeVirtualCurveTransaction(signature: string, connection: Connection) {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })

    if (!tx) {
      return null
    }

    const innerInstructions = tx.meta?.innerInstructions
    if (!Array.isArray(innerInstructions)) {
      return
    }


    // #3.1 - Meteora Pools Program: lock
    // #1 - Pool

    const instructions = get(innerInstructions[2], 'instructions')
    const accounts = get(instructions[0], 'accounts')

    // Pool Address
    const poolInfo = accounts[0]
    const response = await getPoolInfo(poolInfo.toBase58())

    // pool_token_mints contains two spl address, So11111111111111111111111111111111111111112
    const { data } = response
    if (!Array.isArray(data)) {
      return
    }

    const poolTokenPair = data[0]?.pool_token_mints
    return new PublicKey(poolTokenPair[0])
  } catch (e) {
    logger.error('Error decoding bonding transaction:', e)
  }
}
