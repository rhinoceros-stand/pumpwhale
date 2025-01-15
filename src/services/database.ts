import { MongoClient } from 'mongodb'
import { logger } from '../utils/logger'

export default class Database {
  private readonly CONNECT_URL = 'mongodb://localhost:27017'
  private readonly _db_name = 'solana'
  private _client: MongoClient

  constructor() {
    this._client = new MongoClient(this.CONNECT_URL)
  }

  /**
   *
   */
  public async getDB() {
    try {
      await this._client.connect()
      return this._client.db(this._db_name)
    } catch (e) {
      logger.error(`Error connecting database: ${e}`)
    }
  }

  /**
   *
   */
  public close() {
    return this._client.close()
  }
}
