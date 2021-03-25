import React, { useEffect, useState, useContext } from 'react';
import HarvestContext from '../../../../Context/HarvestContext';
import harvest from '../../../../lib/index';
import LoadingBluePanel from '../loadingBluePanel/LoadingBluePanelStyles';
import BluePanel from '../bluePanel/BluePanel';

const { ethers } = harvest;

const Balance = () => {
  const { state, currentExchangeRate, prettyBalance } = useContext(HarvestContext);
  const [userBalance, setUserBalance] = useState(ethers.BigNumber.from(0));

  useEffect(() => {
    const balance = () => {
      let ub = ethers.BigNumber.from(0);

      for (let i = 0; i < state.summaries.length; i = +1) {
        ub = ub.add(state.summaries[i].summary.usdValueOf);

        setUserBalance(ub);
      }
    };
    balance();
  }, [state.summaries]);

  return state.display ? (
    <BluePanel value={prettyBalance(userBalance * currentExchangeRate)} text="Staked Balance" />
  ) : (
    <LoadingBluePanel />
  );
};

export default Balance;
