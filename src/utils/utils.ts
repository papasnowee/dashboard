import { Contract, ethers } from 'ethers';
import { API } from '../api';
import { rewardDecimals, vaultsWithoutReward } from '../constants/constants';
import { FTOKEN_ABI, REWARDS_ABI } from '../lib/data/ABIs';
import { IAssetsInfo } from '../types';

/** Converts the balance into tokens and rounds to the sixth decimal place */
export const makeBalancePrettier = (balance: number, decimals: number) => {
	// balance calculated in tokens
	const balancePerToken = balance / 10 ** decimals;
	return Number(balancePerToken);
};

const currencyFormatter = (currency: string) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
	});

export const prettyBalance = (balance: number, currency: string) => {
	return currencyFormatter(currency).format(balance);
};

export const convertStandardNumber = (num: number, currency: string) => {
	return num ? currencyFormatter(currency).format(num) : '$0.00';
};

export const getAssets = async (
	walletAddress: string,
	provider: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc,
): Promise<IAssetsInfo[]> => {
	const ethersProvider = new ethers.providers.Web3Provider(provider);

	// get all pools and vaults
	const [pools, vaults] = await Promise.all([API.getPools(), API.getVaults()]);
	// get all data for the table
	const assetsData = vaults.map(async vault => {
		// IFarm vault?
		const isIFarm =
			vault.contract.address.toLowerCase() ===
			'0x1571eD0bed4D987fe2b498DdBaE7DFA19519F651'.toLowerCase();

		// a pool that has the same token as a vault
		const pool = pools.find(i => {
			return vault.contract.address === i.lpToken.address;
		});

		const vaultContract = new Contract(vault.contract.address, FTOKEN_ABI, ethersProvider);

		if (pool && pool.rewardToken.address === '0xa0246c9032bc3a600820415ae600c6388619a14d') {
			const poolAddress = pool.contract.address;
			const poolContract = new Contract(poolAddress, REWARDS_ABI, ethersProvider);
			const rewardIsFarm =
				pool.rewardToken.address === '0xa0246c9032bc3a600820415ae600c6388619a14d';

			// for iFARM
			const getPricePerFullShare = async () => {
				const iFARMContract = new Contract(pool.rewardToken.address, FTOKEN_ABI, ethersProvider);

				const price = await iFARMContract.getPricePerFullShare();
				// .catch(e => console.log('22222 err: ', pool.rewardToken.address)); bug is here! if rewardToken !== FARM (=== iFARM?)
				const intPrice = parseInt(price._hex, 16);
				const prettyPrice = makeBalancePrettier(intPrice, rewardDecimals);

				return prettyPrice;
			};

			const getPricePerFullShareFToken = async () => {
				const price = await vaultContract.getPricePerFullShare();
				const intPrice = parseInt(price._hex, 16);
				const prettyPrice = makeBalancePrettier(intPrice, vault.decimals);
				return prettyPrice;
			};

			/**
			 * vaultBalance - balance of a wallet in the vault (are in fToken)
			 * poolBalance - balance of a wallet in the pool (are in fToken)
			 * fTokenPrice - the price are in USD
			 * rewardTokenPrice - the price are in USD (for FARM)
			 * reward - reward of a wallet in the pool
			 * poolTotalSupply - the total number of tokens in the pool of all participants
			 * getPricePerFullShare = iFARMPrice / (FARMPRice * 10 ** rewardDecimals)
			 */

			// TODO fix FARM-price must be got 1 time
			// const tokenPrice2 = await getPricePerFullShare();
			// console.log('11111 token price2', tokenPrice2, vault.underlying.address);

			const [
				vaultBalance,
				poolBalance,
				underlyingPrice,
				rewardTokenPrice,
				reward,
				poolTotalSupply,
				// pricePerFullShare,
				pricePerFullShareFToken,
			] = await Promise.all([
				vaultContract.balanceOf(walletAddress),
				poolContract.balanceOf(walletAddress),
				API.getTokenPrice(vault.underlying.address),
				API.getTokenPrice(pool.rewardToken.address),
				poolContract.earned(walletAddress),
				poolContract.totalSupply(),
				// getPricePerFullShare(),
				getPricePerFullShareFToken(),
			]);

			const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
			const poolBalanceIntNumber = parseInt(poolBalance._hex, 16);

			const prettyVaultBalance = makeBalancePrettier(vaultBalanceIntNumber, vault.decimals);
			const prettyPoolBalance = makeBalancePrettier(poolBalanceIntNumber, vault.decimals);
			const prettyRewardTokenBalance = makeBalancePrettier(reward, rewardDecimals);
			// const rewardTokenAreInFARM = rewardIsFarm
			// 	? prettyRewardTokenBalance
			// 	: prettyRewardTokenBalance * pricePerFullShare;
			const rewardTokenAreInFARM = prettyRewardTokenBalance;

			const percentOfPool = `${((poolBalance * 100) / poolTotalSupply).toFixed(6)}%`;

			/** All account assets that contains in the pool are in USD */
			const calcValue = () => {
				// if (vault.contract.name === 'UNI_ETH_DAI')
				// {
				// 	debugger
				// }
				return (
					underlyingPrice * prettyPoolBalance * pricePerFullShareFToken +
					rewardTokenPrice * rewardTokenAreInFARM
				);
			};

			// fTokens balance in underlying Tokens;
			const underlyingBalance = prettyPoolBalance * pricePerFullShareFToken;

			return {
				name: vault.contract.name,
				earnFarm: true,
				farmToClaim: rewardTokenAreInFARM,
				stakedBalance: prettyPoolBalance,
				percentOfPool,
				value: calcValue(),
				unstakedBalance: prettyVaultBalance,
				address: vault.contract.address,
				rewardIsFarm,
				underlyingBalance,
			};
		}
		if (isIFarm) {
			const [
				vaultBalance,
				farmPrice,
				totalSupply,
				underlyingBalanceWithInvestmentForHolder,
			] = await Promise.all([
				vaultContract.balanceOf(walletAddress),
				API.getTokenPrice(vault.underlying.address),
				vaultContract.totalSupply(),
				vaultContract.underlyingBalanceWithInvestmentForHolder(walletAddress),
			]);
			const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
			const prettyVaultBalance = makeBalancePrettier(vaultBalanceIntNumber, vault.decimals);

			const intUnderlyingBalanceWithInvestmentForHolder = parseInt(
				underlyingBalanceWithInvestmentForHolder._hex,
				16,
			);
			const value =
				(intUnderlyingBalanceWithInvestmentForHolder * farmPrice) / 10 ** vault.decimals;

			const percentOfPool = ((vaultBalance / totalSupply) * 100).toFixed(6);
			return {
				name: vault.contract.name,
				earnFarm: true,
				farmToClaim: 0,
				stakedBalance: prettyVaultBalance,
				percentOfPool: `${percentOfPool}%`,
				value,
				unstakedBalance: 0,
				address: vault.contract.address,
				underlyingBalance: 0,
			};
		}
		const vaultBalance = await vaultContract.balanceOf(walletAddress);
		const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
		const prettyVaultBalance = makeBalancePrettier(vaultBalanceIntNumber, vault.decimals);

		return {
			name: vault.contract.name,
			earnFarm: false,
			farmToClaim: 0,
			stakedBalance: 0,
			percentOfPool: '0.00000%',
			value: 0,
			unstakedBalance: prettyVaultBalance,
			address: vault.contract.address,
			underlyingBalance: 0,
		};
	});
	const assetsDataResolved: IAssetsInfo[] = await Promise.all(assetsData);
	const nonZeroAssets = assetsDataResolved.filter(asset => {
		return (
			asset.farmToClaim ||
			asset.stakedBalance ||
			asset.value ||
			asset.unstakedBalance ||
			asset.underlyingBalance
		);
	});

	console.log('1111 nonZeroAssets', nonZeroAssets);
	return nonZeroAssets;
};
