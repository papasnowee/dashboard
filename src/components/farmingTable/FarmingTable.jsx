import React, { useEffect, useContext, useState, useCallback } from 'react';
import styled from 'styled-components';
import { ethers, Contract } from 'ethers';

import harvest from '../../lib/index';
import { fonts } from '../../styles/appStyles';
import {
  TableContainer,
  MainTableInner,
  MainTableRow,
  MainTableHeader,
  PanelTabContainerLeft,
  PanelTab,
  Tabs,
} from './FarmingTableStyles';
import HarvestContext from '../../Context/HarvestContext';
import FarmTableSkeleton from './FarmTableSkeleton';
import API from '../../api';
import { FTOKEN_ABI, REWARDS_ABI, iFARM_ABI } from '../../lib/data/ABIs';
import { makeBalancePrettier } from './utils';
import { vaultsWithoutReward, rewardDecimals } from './constants';

const { utils } = harvest;

const columns = [
  {
    name: 'Rewards Pool',
  },
  {
    name: 'Earn FARM',
  },
  {
    name: 'FARM to Claim',
  },
  {
    name: 'Staked Asset',
  },
  {
    name: '% of Pool',
  },
  {
    name: 'Value',
  },
  {
    name: 'Unstaked',
  },
];

const FarmingTable = () => {

  const [pools, setPools] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [assets, setAssets] = useState([]);




  const { state, setState, prettyBalance, currentExchangeRate, isCheckingBalance, addressToCheck, } = useContext(HarvestContext);
  const getThisReward = reward => {
    setState(prevState => ({ ...prevState, minimumHarvestAmount: reward }));
  };
  const [sortedSummary, setSortedSummary] = useState([]);
  const [sortDirection, setSortDirection] = useState(1);
  const sortSummary = (_col, index) => {
    // earnedRewards, stakedBalance, percentOfPool, usdValueOf, unstakedBalance
    const filteredArray = sortedSummary;
    if (index >= 2 && index <= 6) {
      filteredArray.sort((a, b) => {
        const first =
          index === 2
            ? a.earnedRewards
            : index === 3
              ? a.stakedBalance
              : index === 4
                ? a.percentOfPool.substr(0, a.percentOfPool.length - 1)
                : index === 5
                  ? a.usdValueOf
                  : index === 6
                    ? a.unstakedBalance
                    : 0;
        const second =
          index === 2
            ? b.earnedRewards
            : index === 3
              ? b.stakedBalance
              : index === 4
                ? b.percentOfPool.substr(0, b.percentOfPool.length - 1)
                : index === 5
                  ? b.usdValueOf
                  : index === 6
                    ? b.unstakedBalance
                    : 0;
        return parseFloat(first) >= parseFloat(second) ? sortDirection : -sortDirection;
      });
    } else if (index === 1) {
      filteredArray.sort((a, b) => {
        return (a.isActive || 0) >= (b.isActive || 0) ? sortDirection : -sortDirection;
      });
    }
    setSortedSummary([...filteredArray]);
    setSortDirection(-sortDirection);
  };

  const getTotalFarmEarned = useCallback(() => {
    let total = 0;
    if (state.summaries.length !== 0) {
      // eslint-disable-next-line
      state.summaries.map(utils.prettyPosition).map((summary, _index) => {
        total += parseFloat(summary.historicalRewards);
        setState(prevState => ({
          ...prevState,
          totalFarmEarned: total,
        }));
      });
    }
  }, [setState, state.summaries]);

  useEffect(() => {
    const getAssets = async () => {

      const ethersProvider = new ethers.providers.Web3Provider(state.provider);

      const walletAddress = isCheckingBalance ? addressToCheck : state.address;

      // get all pools and vaults
      const [pools, vaults] = await Promise.all([API.getPools(), API.getVaults()])

      // get all data for the table
      const assetData = vaults.map(async (vault) => {

        // a pool that has the same token as a vault
        const pool = pools.find((pool) => {
          return vault.contract.address === pool.lpToken.address;
        })

        const vaultContract = new Contract(vault.contract.address, FTOKEN_ABI, ethersProvider);

        if (pool) {

          const poolAddress = pool.contract.address;
          const poolContract = new Contract(poolAddress, REWARDS_ABI, ethersProvider);

          const rewardIsFarm = pool.rewardToken.address === '0xa0246c9032bc3a600820415ae600c6388619a14d';


          const getPricePerFullShare = async () => {
            if (rewardIsFarm) {
              return;
            }

            const iFARMContract = new Contract(pool.rewardToken.address, iFARM_ABI, ethersProvider);

            const price = await iFARMContract.getPricePerFullShare();
            const intPrice = parseInt(price._hex, 16);
            const prettyPrice = makeBalancePrettier(intPrice, rewardDecimals);
            return prettyPrice;
          }

          /** 
           * vaultBalance - balance of a wallet in the vault (are in fToken)
           * poolBalance - balance of a wallet in the pool (are in fToken)
           * fTokenPrice - the price are in USD
           * rewardTokenPrice - the price are in USD (for FARM)
           * reward - reward of a wallet in the pool
           * poolTotalSupply - the total number of tokens in the pool of all participants
           * getPricePerFullShare = iFARMPrice / (FARMPRice * 10 ** rewardDecimals)
           */
          const [vaultBalance, poolBalance, fTokenPrice, rewardTokenPrice, reward, poolTotalSupply, pricePerFullShare] =
            await Promise.all([
              vaultContract.balanceOf(walletAddress),
              poolContract.balanceOf(walletAddress),
              API.getTokenPrice(pool.contract.address),
              API.getTokenPrice(pool.rewardToken.address),
              poolContract.earned(walletAddress),
              poolContract.totalSupply(),
              getPricePerFullShare(),
            ]);

          const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
          const poolBalanceIntNumber = parseInt(poolBalance._hex, 16);


          const prettyVaultBalance = makeBalancePrettier(vaultBalanceIntNumber, vault.decimals);
          const prettyPoolBalance = makeBalancePrettier(poolBalanceIntNumber, vault.decimals);
          const prettyRewardTokenBalance = makeBalancePrettier(reward, rewardDecimals);
          const rewardTokenAreInFARM = rewardIsFarm ? prettyRewardTokenBalance : prettyRewardTokenBalance * pricePerFullShare;

          const percentOfPool = `${(poolBalance * 100 / poolTotalSupply).toFixed(3)}%`;

          /** All account assets that contains in the pool are in USD */
          const calcValue = () => {
            return (fTokenPrice * prettyPoolBalance + rewardTokenPrice * rewardTokenAreInFARM) * currentExchangeRate
          }

          return {
            name: vault.symbol,
            earnFarm: !vaultsWithoutReward.has(poolAddress),
            farmToClaim: rewardTokenAreInFARM,
            stakedBalance: prettyPoolBalance,
            percentOfPool,
            value: calcValue(),
            unstakedBalance: prettyVaultBalance,
            address: vault.contract.address,
            rewardIsFarm
          }
        }
        const vaultBalance = await vaultContract.balanceOf(walletAddress);
        const vaultBalanceIntNumber = parseInt(vaultBalance._hex, 16);
        const prettyVaultBalance = makeBalancePrettier(vaultBalanceIntNumber, vault.decimals);

        return {
          name: vault.name,
          earnFarm: false,
          farmToClaim: 0,
          stakedBalance: 0,
          percentOfPool: 0,
          value: 0,
          unstakedBalance: prettyVaultBalance,
          address: vault.contract.address,
        }


      });
      const assets = await Promise.all(assetData);
      const nonZeroAssets = assets.filter((asset) => {
        return asset.unstakedBalance || asset.stakedBalance || asset.farmToclaim;
      })
      console.log(nonZeroAssets)
      setAssets(nonZeroAssets);
    }

    if (!state.provider) { return }

    getAssets();

  }, [state.provider]);

  useEffect(() => {
    if (state.totalFarmEarned === 0) {
      getTotalFarmEarned();
    }
    const array = state.summaries.map(utils.prettyPosition);
    setSortedSummary(array);
  }, [getTotalFarmEarned, state.summaries, state.totalFarmEarned]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getTotalFarmEarned();
    }, 60000);
    return () => clearTimeout(timer);
  });

  return (
    <>

      {/* {state.display &&  // the old implementation using Deploy.js
        <Tabs>
          <PanelTabContainerLeft>
            <PanelTab>
              <p>your staked assets</p>
            </PanelTab>
          </PanelTabContainerLeft>
        </Tabs>
      }
      {state.display ? (
        <TableContainer>
          {sortedSummary.length === 0 ? (
            <NoAssetTable>
              <div className="header">
                <p>You currently are not staking any assets</p>
              </div>
              <div className="content">
                <div className="name">
                  {' '}
                  <p>Stake assets to start earning!</p>{' '}
                </div>
              </div>
            </NoAssetTable>
          ) : (
            <MainTableInner>
              <MainTableHeader>
                {columns.map((col, i) => {
                  return (
                    <div
                      className={`${col.name} table-header`}
                      key={col.name}
                      onKeyUp={() => sortSummary(col, i)}
                      onClick={() => sortSummary(col, i)}
                      role="button"
                      tabIndex={0}
                    >
                      {col.name}
                    </div>
                  );
                })}
              </MainTableHeader>
              {sortedSummary.map(summary => {
                return (
                  <MainTableRow key={summary.address}>
                    <div className="name">{summary.name}</div>
                    <div className="active">{String(summary.isActive)}</div>
                    <div
                      className="earned-rewards"
                      onKeyUp={() => getThisReward(summary.earnedRewards)}
                      onClick={() => getThisReward(summary.earnedRewards)}
                      role="button"
                      tabIndex={0}
                    >
                      {parseFloat(summary.earnedRewards).toFixed(6)}
                    </div>
                    <div className="staked">{parseFloat(summary.stakedBalance).toFixed(6)}</div>
                    <div className="pool">{summary.percentOfPool}</div>
                    <div className="value">
                      {prettyBalance(summary.usdValueOf * currentExchangeRate)}
                    </div>
                    <div className="unstaked">
                      {Math.floor(parseFloat(summary.unstakedBalance)).toFixed(6)}
                    </div>
                  </MainTableRow>
                )
              })}
            </MainTableInner>
          )}
        </TableContainer>
      ) : (
        <FarmTableSkeleton state={state} />
      )}
    </>
  ); */}
      {state.display &&
        <Tabs>
          <PanelTabContainerLeft>
            <PanelTab>
              <p>your staked assets</p>
            </PanelTab>
          </PanelTabContainerLeft>
        </Tabs>
      }
      {state.display ? (
        <TableContainer>
          {sortedSummary.length === 0 ? (
            <NoAssetTable>
              <div className="header">
                <p>You currently are not staking any assets</p>
              </div>
              <div className="content">
                <div className="name">
                  {' '}
                  <p>Stake assets to start earning!</p>{' '}
                </div>
              </div>
            </NoAssetTable>
          ) : (
            <MainTableInner>
              <MainTableHeader>
                {columns.map((col, i) => {
                  return (
                    <div
                      className={`${col.name} table-header`}
                      key={col.name}
                      // onKeyUp={() => sortSummary(col, i)}
                      // onClick={() => sortSummary(col, i)}
                      role="button"
                      tabIndex={0}
                    >
                      {col.name}
                    </div>
                  );
                })}
              </MainTableHeader>
              {assets.map(asset => {
                return (
                  <MainTableRow key={asset.address}>
                    <div className="name">{asset.name}</div>
                    <div className="active">{String(asset.earnFarm)}</div>
                    <div
                      className="earned-rewards"
                      // onKeyUp={() => getThisReward(summary.earnedRewards)}
                      // onClick={() => getThisReward(summary.earnedRewards)}
                      role="button"
                      tabIndex={0}
                    >
                      {asset.farmToClaim}
                    </div>
                    <div className="staked">{asset.stakedBalance}</div>
                    <div className="pool">{asset.percentOfPool}</div>
                    <div className="value">
                      {asset.value}
                    </div>
                    <div className="unstaked">
                      {asset.unstakedBalance}
                    </div>
                  </MainTableRow>
                )
              })}
            </MainTableInner>
          )}
        </TableContainer>
      ) : (
        <FarmTableSkeleton state={state} />
      )}
    </>
  );
};

export default FarmingTable;

const NoAssetTable = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .header {
    font-size: 2rem;
    font-family: ${fonts.headerFont};
    padding: 1.5rem 1rem;
    border-bottom: 2px black solid;
    width: 100%;
    p {
      text-align: center;
    }
  }
  .content {
    width: 100%;
    font-size: 1.7rem;
    font-family: ${fonts.contentFont};
    padding: 1.5rem 1rem;
    width: 100%;
    border-bottom: 1.2px solid rgba(53, 53, 53, 0.15);
    p {
      text-align: center;
    }
  }
`;
