import React, { useContext } from 'react';
import { Panel } from '../../styles/AppJsStyles';
import MainContent from '../MainContent';
import Button from '../Button';
import HarvestContext from '../../Context/HarvestContext';

export default function ModeSelectBoard({ setState, openModal }) {
  const { isConnecting, setIsConnecting, getPools } = useContext(HarvestContext);

  const onGoDashboard = () => {
    setIsConnecting(true);
    getPools();
  };

  return isConnecting ? (
    <MainContent setState={setState} openModal={openModal} />
  ) : (
    <div className="mode-select-container">
      <Panel className="mode-select-user">
        <h1>Check your farming status</h1>
        <Button onClick={onGoDashboard}>Go to user dashboard</Button>
      </Panel>
    </div>
  );
}
