interface IContract {
	id: number;
	address: string;
	name: string;
	created: number;
	type: number;
	/** TODO: to type */
	network: null;
}

export interface IPool {
	id: number;
	contract: IContract;
	updatedBlock: number;
	governance: IContract;
	owner: IContract;
	lpToken: IContract;
	rewardToken: IContract;
}

export interface IVault {
	id: number;
	contract: IContract;
	updatedBlock: number;
	governance: IContract;
	strategy: IContract;
	underlyinger: IContract;
	name: string;
	symbol: string;
	decimals: number;
	underlyingUnit: number;
}
