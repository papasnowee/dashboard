import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';

import { Row, Col } from 'styled-bootstrap-grid';
import { motion } from 'framer-motion';
import { fonts } from '../../styles/appStyles';

// COMPONENTS
import MainContent from '../MainContent';
import Radio from '../radio/Radio';
import Wallet from '../Wallet';

// CONTEXT
import HarvestContext from '../../Context/HarvestContext';

const CheckBalance = () => {
  const {
    state,
    setState,
    isCheckingBalance,
    setCheckingBalance,
    addressToCheck,
    setAddressToCheck,
    getPools,
  } = useContext(HarvestContext);

  const [validationMessage, setValidationMessage] = useState('');

  const validateAddress = address => {
    try {
      ethers.utils.getAddress(address);
    } catch (e) {
      return false;
    }
    return true;
  };

  const changeHandler = e => {
    setAddressToCheck(e.target.value);
  };

  const setCheck = () => {
    if (addressToCheck && validateAddress(addressToCheck)) {
      setCheckingBalance(true);
      getPools();
      setState(prevState => ({ ...prevState, addressToCheck }));
    } else {
      setAddressToCheck('');
      setState(prevState => ({ ...prevState, addressToCheck: '' }));
      setValidationMessage('You must enter a valid address');
      const timer = setTimeout(() => {
        setValidationMessage('');
      }, 2500);
      return () => clearTimeout(timer);
    }
  };

  return (
    <>
      {validationMessage ? (
        <motion.div
          key={validationMessage}
          initial={{ x: 0, y: -100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ x: 0, y: -100, opacity: 1 }}
        >
          <ValidationMessage className="validation-message">
            <p>{validationMessage}</p>
          </ValidationMessage>
        </motion.div>
      ) : null}

      <Panel>
        {isCheckingBalance ? <Radio /> : ''}
        {isCheckingBalance ? (
          <Row>
            <Col>
              <Wallet theme={state.theme} address={addressToCheck} provider={state.provider} />
            </Col>
          </Row>
        ) : null}
        {isCheckingBalance ? (
          ''
        ) : (
          <div className="read-only-header">
            <h1>Or enter a wallet address for read-only mode</h1>
            <div className="address-input">
              <input
                type="text"
                value={addressToCheck}
                placeholder="Enter address"
                onChange={changeHandler}
              />
            </div>
            {/* //address-input */}
          </div>
        )}

        {isCheckingBalance ? (
          ''
        ) : (
          <button onClick={() => setCheck()} className="check-all button" type="button">
            Check Balance
          </button>
        )}
        {isCheckingBalance ? (
          <MainContent setAddressToCheck={setAddressToCheck} state={state} />
        ) : null}
      </Panel>
    </>
  );
};
export default CheckBalance;
const Panel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 2rem auto;
  background-color: ${props => props.theme.style.panelBackground};
  color: ${props => props.theme.style.primaryFontColor};
  font-size: 1.7rem;
  font-family: ${fonts.contentFont};
  padding: 1rem 1.5rem 0rem 1.5rem;
  border: ${props => props.theme.style.mainBorder};
  border-radius: 0.5rem;
  box-sizing: border-box;
  box-shadow: ${props => props.theme.style.panelBoxShadow};
  z-index: 1;
  position: relative;

  h1 {
    font-family: ${fonts.headerFont};
    margin-bottom: 2.2rem;
    font-size: 2.5rem;
    text-align: center;
    position: relative;
  }
  .address-input {
    display: flex;
    flex-direction: column;
    align-items: center;
    input {
      width: 30%;
      text-align: center;
      border-radius: 0.5rem;
      font-size: 1.7rem;
      font-family: ${fonts.contentFont};
    }
  }
  .button {
    width: max-content;
    margin: 2rem auto 2rem auto;
    font-size: 2rem;
    font-family: ${fonts.headerFont};
    position: relative;
    &:hover {
      top: 1.5px;
    }
  }
  .check-all {
    position: relative;
    &:hover {
      top: 1.5px;
    }
  }
  .clear {
    position: relative;
    z-index: 400;
  }
`;
const ValidationMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: max-content;
  background-color: ${props => props.theme.style.lightBackground};
  color: ${props => props.theme.style.primaryFontColor};
  font-family: ${fonts.contentFont};
  font-size: 2rem;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: ${props => props.theme.style.mainBorder};
  box-shadow: ${props => props.theme.style.panelBoxShadow};
  margin: -5rem auto 0 auto;
  position: absolute;
  left: 0%;
  right: 0%;
  @media (max-width: 768px) {
    left: 30%;
    right: 30%;
  }
  p {
    text-align: center;
  }
`;
