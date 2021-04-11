import { IPool } from '../../types/Entities';

/** This Set contains addresses of vaults that have no reward  */
export const vaultsWithoutReward = new Set<IPool['contract']['address']>([

]);

export const rewardDecimals = 18;