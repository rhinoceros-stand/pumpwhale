import { Connection, PublicKey } from '@solana/web3.js'
import { findIndex } from 'lodash'
import { logger } from '../../utils/logger'

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
    const instructions = innerInstructions[0]?.instructions

    if (!Array.isArray(instructions)) {
      return
    }

    // fetching initializePermissionlessConstantProductPoolWithConfig2 data, get the address before So11111111111111111111111111111111111111112
    const poolConfig = instructions[1]
    const solIndex = findIndex(poolConfig.accounts, r => r.toBase58() === 'So11111111111111111111111111111111111111112')
    if (solIndex < 0) {
      return
    }

    const mintRecord = poolConfig?.accounts[solIndex - 1]
    if (!mintRecord) {
      return
    }

    return new PublicKey(mintRecord.toBase58())
  } catch (e) {
    logger.error('Error decoding bonding transaction:', e)
  }
}
