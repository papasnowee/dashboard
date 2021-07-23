import BigNumber from 'bignumber.js'

export interface IContract {
  id: number
  address: string
  name: string
  created?: number
  type?: number
  /** TODO: to type */
  network?: null | string
  underlying?: null | { address?: string }
  createdDate: number | null
  updated: number | null
  updatedDate: number | null
}

interface IVaultAndPoolAddresses {
  vault?: string
  pool?: string
}

interface IRewardToken extends IContract {
  address: string
}

export interface IPool {
  id: number
  contract: IContract
  updatedBlock?: number
  governance?: IContract
  controller: IContract
  owner?: IContract
  lpToken?: IContract
  rewardToken?: IRewardToken
}

export interface IVault {
  id: number
  contract: IContract
  controller: IContract
  updatedBlock?: number | null
  governance?: IContract
  strategy: IContract | null
  underlying?: IContract | null
  name: string
  symbol: string
  decimals?: number
  underlyingUnit?: number
}

export const ETH = 'eth'
export const BSC = 'bsc'

export interface IPartialAssetData {
  underlyingAddress: IAssetsInfo['underlyingAddress']
}

export interface IAssetsInfo {
  id: string
  network: typeof ETH | typeof BSC
  name: string
  prettyName: string
  earnFarm: boolean
  farmToClaim: BigNumber | null
  stakedBalance: BigNumber | null
  percentOfPool: BigNumber | null
  value: BigNumber | null
  unstakedBalance: BigNumber | null
  address: IVaultAndPoolAddresses
  underlyingBalance: BigNumber | null
  underlyingAddress?: string
}
