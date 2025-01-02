import { MongoClient } from 'mongodb'

export default class Database {
  private readonly CONNECT_URL = 'mongodb://localhost:27017'
  private readonly _db_name = 'solana'
  private _client: MongoClient

  constructor() {
    this._client = new MongoClient(this.CONNECT_URL)
  }

  public async getDB() {
    await this._client.connect()
    return this._client.db('solana')
  }

  public close() {
    return this._client.close()
  }
}
