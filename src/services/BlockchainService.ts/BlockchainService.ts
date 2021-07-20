import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

import { BigNumberZero } from '@/constants'
import { IVault, IPool } from '@/types'

// common methods for working with blockchain
export class BlockchainService {
  static calcUnderlying(vault?: IVault, pool?: IPool): string | undefined {
    if (vault) {
      return vault.underlying?.address
    }
    return pool?.lpToken?.address
  }

  static async calcUnderlyingPrice(
    poolBalance: string | null,
    priceAddress: string | undefined,
    getPrice: (priceAddress: string) => Promise<BigNumber | null>,
  ): Promise<BigNumber | null> {
    if (!poolBalance) {
      return null
    }

    if (poolBalance === '0') {
      return BigNumberZero
    }
    return priceAddress ? await getPrice(priceAddress) : null
  }

  static isValidAddress(address: any, web3: Web3): boolean {
    const isValid: boolean = web3.utils.isAddress(String(address))
    if (!isValid) {
      // eslint-disable-next-line no-console
      console.log(`address ${address} is not valid`)
    }
    return isValid
  }

  static async makeRequest(
    contract: Contract,
    methodName: string,
    ...args: any[]
  ): Promise<string | null> {
    try {
      const response: string = await contract.methods[methodName](
        ...args,
      ).call()
      return response
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `An error occurred while calling blockchain method: ${methodName}. Contract address: ${contract?._address}. ${error}`,
      )
      return Promise.resolve(null)
    }
  }
}
