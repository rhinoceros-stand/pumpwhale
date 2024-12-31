import { Connection } from '@solana/web3.js'

export interface OnChainService {
  init(conn: Connection): boolean

  start(): boolean

  stop(): boolean
}
