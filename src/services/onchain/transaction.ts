import { Connection, PublicKey } from '@solana/web3.js'
import { findLast, get } from 'lodash'
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

    const selectedRecord = findLast(instructions, record => {
      const program = get(record, 'program')
      const authorityType = get(record, 'parsed.info.authorityType')
      return program === 'spl-token' && authorityType === 'mintTokens'
    })

    if (!selectedRecord) {
      return
    }

    return new PublicKey(selectedRecord.mint)
  } catch (e) {
    logger.error('Error decoding bonding transaction:', e)
  }
}
