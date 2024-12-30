import { Connection, PublicKey } from '@solana/web3.js'

export default class Trading {
  private readonly _connection: Connection

  constructor({ connection }) {
    this._connection = connection
  }

  async getHolders(address: string) {
    const mintAddress = new PublicKey(address)
    const supply = await this._connection.getTokenSupply(mintAddress)
    const topHolders = await this._connection.getTokenLargestAccounts(mintAddress)

    const tokenInfo = {
      address,
      amount: supply.value.uiAmount,
      topHolders: topHolders.value.map(v => {
        return {
          address: v.address.toString(),
          amount: v.uiAmount,
          percent: (v.uiAmount / supply.value.uiAmount) * 100
        }
      })
    }

    console.log(tokenInfo)
  }
}
