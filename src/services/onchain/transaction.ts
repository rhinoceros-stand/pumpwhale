import { Connection } from '@solana/web3.js'
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

    const firstInstruction = tx.meta?.innerInstructions[0]
    const instructions = firstInstruction?.instructions
    if (!Array.isArray(instructions)) {
      return
    }

    const metroraProgram = findLast(instructions, record => {
      const programId = get(record, 'programId').toBase58()
      const accounts = get(record, 'accounts')
      return programId === 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' && Array.isArray(accounts)
    })

    if (!metroraProgram) {
      return
    }

    const accounts = get(metroraProgram, 'accounts', [])
    return accounts[1]
  } catch (e) {
    logger.error('Error decoding bonding transaction:', e)
  }
}
