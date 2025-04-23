import { Connection } from '@solana/web3.js'
import { Emitter } from 'nanoevents'

export interface OnChainService {
  init(conn: Connection, emitter: Emitter): boolean

  start(): boolean

  stop(): boolean
}
