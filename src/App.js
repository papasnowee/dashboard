import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from 'styled-components';
import { Row, Col } from 'styled-bootstrap-grid';
import Loadable from 'react-loadable';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { ethers, Contract } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';

import ModeSelectBoard from './components/ModeSelectBoard';
import HarvestContext from './Context/HarvestContext';
import { FTOKEN_ABI, REWARDS_ABI } from './lib/data/ABIs';
import { darkTheme, lightTheme } from './styles/appStyles';
import { makeBalancePrettier } from './utils';
import { rewardDecimals, vaultsWithoutReward } from './constants';

import API from './api';
// images
import logo from './assets/newLogo.png';
// styles
import { Topbar, GlobalStyle, Brand, Panel, Container } from './styles/AppJsStyles';

// components
import TabContainer from './components/tabContainer/TabContainer';
import SettingsModal from './components/userSettings/SettingsModal';
import Radio from './components/radio/Radio';
import WelcomeText from './components/WelcomeText';
import CheckBalance from './components/checkBalance/CheckBalance';
import TokenMessage from './components/statusMessages/TokenMessage';
import HarvestAndStakeMessage from './components/statusMessages/HarvestAndStakeMessage';
import Sidedrawer from './components/userSettings/sidedrawer/Sidedrawer';

const web3Modal = new Web3Modal({
	network: 'mainnet', // optional
	cacheProvider: false, // optional
	providerOptions: {
		walletconnect: {
			package: WalletConnectProvider, // required
			options: {
				infuraId: `${process.env.REACT_APP_INFURA_KEY}`, // required
			},
		},
	},
});

const ErrorModal = Loadable({
	loader: () => import('./components/ErrorModal'),
	loading() {
		return null;
	},
});

function App() {
	const [displayFarmInfo, setDisplayFarmInfo] = useState(false);
	const [assets, setAssets] = useState([]);
	const [personalGasSaved, setPersonalGasSaved] = useState(0);
	// for read-only-mode
	const [personalGasSavedToCheck, setPersonalGasSavedToCheck] = useState(0);
	// for currency conversion
	const [baseCurrency, setBaseCurrency] = useState(
		window.localStorage.getItem('HarvestFinance:currency') || 'USD',
	);
	const [exchangeRates, setExchangeRates] = useState({});
	const [currentExchangeRate, setCurrentExchangeRate] = useState(1);
	// for currency conversion
	const [openDrawer, setOpenDrawer] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isCheckingBalance, setCheckingBalance] = useState(false);
	const [tokenAddedMessage, setTokenAddedMessage] = useState('');
	const [harvestAndStakeMessage, setHarvestAndStakeMessage] = useState({
		first: '',
		second: '',
	});

	/**The wallet address that user check in read-mode */
	const [addressToCheck, setAddressToCheck] = useState('');
	const [state, setState] = useState({
		provider: undefined,
		signer: undefined,
		/** The wallet address of an user */
		address: '',
		addressToCheck: '',
		summaries: [],
		// underlyings: [],
		// usdValue: 0,
		error: { message: null, type: null, display: false },
		theme: window.localStorage.getItem('HarvestFinance:Theme'),
		display: false,
		minimumHarvestAmount: '0',
		apy: 0,
		farmPrice: 0,
		totalFarmEarned: 0,
	});

	const getPools = async () => {
		const [APY, farmPrice] = await Promise.all([API.getAPY(), API.getFarmPrice()]);
		setState(prevState => ({ ...prevState, apy: APY, farmPrice }));
		setDisplayFarmInfo(true);
	};

	const refresh = useCallback(() => {
		let address = '';

		if (isCheckingBalance) {
			address = state.addressToCheck;
		} else if (isConnecting) {
			address = state.address;
		} else {
			return;
		}
	}, [isCheckingBalance, isConnecting, state.address, state.addressToCheck]);

	const memoizeExchangeRates = () => {
		axios
			.get('https://api.ratesapi.io/api/latest?base=USD')
			.then(res => {
				setExchangeRates(res.data.rates);
			})
			.catch(err => {
				console.log(err);
			});
	};

	const getPersonalGasSaved = async (address, setGasInfo) => {
		address &&
			(await axios
				.get(
					`${process.env.REACT_APP_ETH_PARSER_URL}/total_saved_gas_fee_by_address?address=${address}`,
				)
				.then(res => {
					setGasInfo(Math.round(res.data.data));
				})
				.catch(err => {
					console.log(err);
				}));
	};

	useEffect(() => {
		const getAssets = async () => {
			const ethersProvider = new ethers.providers.Web3Provider(state.provider);

			const walletAddress = isCheckingBalance ? addressToCheck : state.address;

			// get all pools and vaults
			const [pools, vaults] = await Promise.all([API.getPools(), API.getVaults()]);

			// get all data for the table
			const assetData = vaults.map(async vault => {
				// IFarm vault?
				const isIFarm =
					vault.contract.address.toLowerCase() ===
					'0x1571eD0bed4D987fe2b498DdBaE7DFA19519F651'.toLowerCase();

				// a pool that has the same token as a vault
				const pool = pools.find(pool => {
					return vault.contract.address === pool.lpToken.address;
				});

				const vaultContract = new Contract(
					vault.contract.address,
					FTOKEN_ABI,
					ethersProvider,
				);

				if (pool) {
					const poolAddress = pool.contract.address;
					const poolContract = new Contract(poolAddress, REWARDS_ABI, ethersProvider);

					const rewardIsFarm =
						pool.rewardToken.address === '0xa0246c9032bc3a600820415ae600c6388619a14d';

					// for iFARM
					const getPricePerFullShare = async () => {
						if (rewardIsFarm) {
							return;
						}

						const iFARMContract = new Contract(
							pool.rewardToken.address,
							FTOKEN_ABI,
							ethersProvider,
						);

						const price = await iFARMContract.getPricePerFullShare();
						const intPrice = parseInt(price._hex, 16);
						const prettyPrice = makeBalancePrettier(intPrice, rewardDecimals);
						return prettyPrice;
					};

					const getPricePerFullShareFToken = async () => {
						// const fTokenContract = new Contract(vault.contract.address, fTOKEN_ABI2, ethersProvider);

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
					const [
						vaultBalance,
						poolBalance,
						underlyingPrice,
						rewardTokenPrice,
						reward,
						poolTotalSupply,
						pricePerFullShare,
						pricePerFullShareFToken,
					] = await Promise.all([
						vaultContract.balanceOf(walletAddress),
						poolContract.balanceOf(walletAddress),
						API.getTokenPrice(vault.underlying.address),
						API.getTokenPrice(pool.rewardToken.address),
						poolContract.earned(walletAddress),
						poolContract.totalSupply(),
						getPricePerFullShare(),
						getPricePerFullShareFToken(),
					]);

					const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
					const poolBalanceIntNumber = parseInt(poolBalance._hex, 16);

					const prettyVaultBalance = makeBalancePrettier(
						vaultBalanceIntNumber,
						vault.decimals,
					);
					const prettyPoolBalance = makeBalancePrettier(
						poolBalanceIntNumber,
						vault.decimals,
					);
					const prettyRewardTokenBalance = makeBalancePrettier(reward, rewardDecimals);
					const rewardTokenAreInFARM = rewardIsFarm
						? prettyRewardTokenBalance
						: prettyRewardTokenBalance * pricePerFullShare;

					const percentOfPool = `${((poolBalance * 100) / poolTotalSupply).toFixed(3)}%`;

					/** All account assets that contains in the pool are in USD */
					const calcValue = () => {
						return (
							(underlyingPrice * prettyPoolBalance * pricePerFullShareFToken +
								rewardTokenPrice * rewardTokenAreInFARM) *
							currentExchangeRate
						);
					};

					// fTokens balance in underlying Tokens;
					const underlyingBalance = (prettyPoolBalance * pricePerFullShareFToken).toFixed(
						6,
					);

					return {
						name: vault.contract.name,
						earnFarm: !vaultsWithoutReward.has(poolAddress),
						farmToClaim: rewardTokenAreInFARM,
						stakedBalance: prettyPoolBalance,
						percentOfPool,
						value: `$${calcValue().toFixed(6)}`,
						unstakedBalance: prettyVaultBalance,
						address: vault.contract.address,
						rewardIsFarm,
						underlyingBalance,
					};
				}

				const vaultBalance = await vaultContract.balanceOf(walletAddress);
				const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
				const prettyVaultBalance = makeBalancePrettier(
					vaultBalanceIntNumber,
					vault.decimals,
				);

				if (isIFarm) {
					const [
						farmPrice,
						totalSupply,
						underlyingBalanceWithInvestmentForHolder,
					] = await Promise.all([
						API.getTokenPrice(vault.underlying.address),
						vaultContract.totalSupply(),
						vaultContract.underlyingBalanceWithInvestmentForHolder(walletAddress),
					]);

					const intUnderlyingBalanceWithInvestmentForHolder = parseInt(
						underlyingBalanceWithInvestmentForHolder._hex,
						16,
					);
					const value = (
						(intUnderlyingBalanceWithInvestmentForHolder * farmPrice) /
						10 ** vault.decimals
					).toFixed(6);
					// const prettyIntUnderlyingBalanceWithInvestmentForHolder = makeBalancePrettier(intUnderlyingBalanceWithInvestmentForHolder. vault.decimals);

					const percentOfPool = ((vaultBalance / totalSupply) * 100).toFixed(6);
					return {
						name: vault.contract.name,
						earnFarm: true,
						farmToClaim: 0,
						stakedBalance: prettyVaultBalance,
						percentOfPool: `${percentOfPool}%`,
						value: value,
						unstakedBalance: 0,
						address: vault.contract.address,
						underlyingBalance: 0,
					};
				}

				return {
					name: vault.contract.name,
					earnFarm: false,
					farmToClaim: 0,
					stakedBalance: 0,
					percentOfPool: '0.000%',
					value: 0,
					unstakedBalance: prettyVaultBalance,
					address: vault.contract.address,
					underlyingBalance: 0,
				};
			});
			const assets = await Promise.all(assetData);
			const nonZeroAssets = assets.filter(asset => {
				return (
					asset.farmToclaim ||
					asset.stakedBalance ||
					asset.value ||
					asset.unstakedBalance ||
					asset.underlyingBalance
				);
			});

			console.log('1111 nonZeroAssets', nonZeroAssets);

			setState(prevState => ({ ...prevState, display: true }));
			setAssets(nonZeroAssets);
		};

		if (state.provider && (addressToCheck || state.address)) {
			getAssets();
		}
	}, [state.provider, isCheckingBalance, addressToCheck, state.address, currentExchangeRate]);

	// using state.address
	useEffect(() => {
		getPersonalGasSaved(state.address, setPersonalGasSaved);
	}, [state.address]);

	// using addressToCheck
	useEffect(() => {
		getPersonalGasSaved(addressToCheck, setPersonalGasSavedToCheck);
	}, [addressToCheck]);

	useEffect(() => {
		const timer = setTimeout(() => {
			refresh();
		}, 20000);
		return () => clearTimeout(timer);
	});

	useEffect(() => {
		if (isConnecting) {
			refresh();
		}
	}, [isConnecting, refresh]);

	useEffect(() => {
		const timer = setTimeout(() => {
			getPools();
		}, 20000);
		return () => clearTimeout(timer);
	});

	useEffect(() => {
		getPools();
		memoizeExchangeRates();
		// eslint-disable-next-line
	}, []);
	useEffect(() => {
		const timer = setTimeout(() => {
			memoizeExchangeRates();
		}, 600000);
		return () => clearTimeout(timer);
	});

	useEffect(() => {
		if (state.address !== '') {
			refresh();
		}
		// eslint-disable-next-line
	}, [state.address]);

	useEffect(() => {
		if (state.addressToCheck !== '') {
			refresh();
		}
		// eslint-disable-next-line
	}, [state.addressToCheck]);

	const disconnect = () => {
		setState(prevState => ({
			...prevState,
			provider: undefined,
			signer: undefined,
			address: '',
			apy: 0,
			farmPrice: 0,
			totalFarmEarned: 0,
			error: { message: null, type: null, display: false },
			theme: window.localStorage.getItem('HarvestFinance:Theme'),
		}));
		setIsConnecting(false);
		web3Modal.clearCachedProvider();
	};

	const closeErrorModal = () => {
		setState(prevState => ({
			...prevState,
			error: { message: null, type: null, display: false },
		}));
	};

	const openModal = (message, type) => {
		setState(prevState => ({
			...prevState,
			error: { message, type, display: true },
		}));
	};

	const toggleUserSettings = () => {
		setSettingsOpen(!settingsOpen);
	};
	const toggleSideDrawer = () => {
		setOpenDrawer(!openDrawer);
	};

	const setConnection = (provider, signer) => {
		setState(prevState => ({
			...prevState,
			provider,
			signer,
		}));
	};

	const setAddress = address => {
		setState(prevState => ({ ...prevState, address }));
	};

	// Radio Modal
	const [radio, setRadio] = useState(false);

	const toggleRadio = () => {
		setRadio(!radio);
	};

	// currency conversion helpers
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: baseCurrency,
	});

	const prettyBalance = balance => {
		return currencyFormatter.format(balance / 1000000);
	};
	const convertStandardNumber = num => {
		return num ? currencyFormatter.format(num) : '$0.00';
	};

	const setCheckingBalanceStatus = checking => {
		setState(prevState => ({
			...prevState,
			apy: 0,
			farmPrice: 0,
			totalFarmEarned: 0,
		}));
		setCheckingBalance(checking);
	};

	return (
		<HarvestContext.Provider
			value={{
				displayFarmInfo,
				assets,
				setAssets,
				state,
				setState,
				personalGasSaved,
				personalGasSavedToCheck,
				radio,
				setRadio,
				toggleRadio,
				tokenAddedMessage,
				setTokenAddedMessage,
				isConnecting,
				setIsConnecting,
				isCheckingBalance,
				setCheckingBalance: setCheckingBalanceStatus,
				setConnection,
				disconnect,
				refresh,
				harvestAndStakeMessage,
				setHarvestAndStakeMessage,
				exchangeRates,
				baseCurrency,
				setBaseCurrency,
				currentExchangeRate,
				setCurrentExchangeRate,
				currencyFormatter,
				prettyBalance,
				convertStandardNumber,
				settingsOpen,
				toggleUserSettings,
				openDrawer,
				toggleSideDrawer,
				web3Modal,
				addressToCheck,
				setAddressToCheck,
				getPools,
			}}
		>
			<ThemeProvider theme={state.theme === 'dark' ? darkTheme : lightTheme}>
				<GlobalStyle />
				{openDrawer ? <Sidedrawer /> : null}

				<Container>
					<Row>
						<Col col>
							<Topbar>
								<Brand>
									<img src={logo} alt="harvest finance logo" />{' '}
									{openDrawer ? '' : <span>harvest.dashboard</span>}
								</Brand>
								<i
									onClick={toggleUserSettings}
									onKeyUp={toggleUserSettings}
									className="fas fa-user-cog"
									role="button"
									tabIndex="0"
								/>
								{settingsOpen ? <SettingsModal /> : ''}
								<i
									className="fas fa-bars"
									onClick={toggleSideDrawer}
									onKeyUp={toggleSideDrawer}
									role="button"
									tabIndex="0"
								/>
							</Topbar>
						</Col>
					</Row>

					<Row>
						<Col>
							<>
								{!isCheckingBalance && (
									<>
										<TabContainer />
										<Panel>
											<Radio />

											<TokenMessage />
											<HarvestAndStakeMessage />

											{state.provider ? (
												<ModeSelectBoard
													state={state}
													setState={setState}
												/>
											) : (
												<Row>
													<Col>
														<WelcomeText
															state={state}
															openModal={openModal}
															disconnect={disconnect}
															setConnection={setConnection}
															setAddress={setAddress}
														/>
													</Col>
												</Row>
											)}
										</Panel>
									</>
								)}
							</>
						</Col>
					</Row>
					{state.provider && !isConnecting && (
						<Row>
							<Col style={{ marginTop: '3rem', marginBottom: '3rem' }}>
								{isCheckingBalance ? <TabContainer /> : ''}
								<Panel>
									<CheckBalance state={state} />
								</Panel>
							</Col>
						</Row>
					)}
				</Container>
				<ErrorModal state={state} onClose={() => closeErrorModal()} />
			</ThemeProvider>
		</HarvestContext.Provider>
	);
}

export default App;
