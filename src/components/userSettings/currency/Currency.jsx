import React, { useContext, useMemo } from 'react';
import HarvestContext from '../../../Context/HarvestContext';
import { CurrencyContainer } from './CurrencyStyles';

const Currency = () => {
  const { exchangeRates, baseCurrency, setBaseCurrency, setCurrentExchangeRate } = useContext(
    HarvestContext,
  );

  const changeHandler = e => {
    setBaseCurrency(e.target.value);
    setCurrentExchangeRate(exchangeRates[e.target.value]);
    window.localStorage.setItem('HarvestFinance:currency', e.target.value);
  };

  const options = useMemo(() => {
    return Object.entries(exchangeRates).map(([key]) => {
      return (
        <option key={key} value={key}>
          {key}
        </option>
      );
    });
  }, [exchangeRates]);

  return (
    <CurrencyContainer>
      <h3>Display currency in:</h3>
      <select onChange={changeHandler} value={baseCurrency} name="currency" id="currencies">
        <option value="USD">{baseCurrency}</option>

        {exchangeRates && options}
      </select>
    </CurrencyContainer>
  );
};

export default Currency;
