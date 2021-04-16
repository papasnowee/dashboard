import React from 'react';

// components
import APY from './apy/APY';
import Balance from './balance/Balance';
import FarmPrice from './farmPrice/FarmPrice';
import TotalFarmEarned from './totalFarmEarned/TotalFarmEarned';

const FarmInfo = () => {
	return (
		<div className="farm-info">
			<Balance />
			<APY />
			<FarmPrice />
			<TotalFarmEarned />
		</div>
	);
};

export default FarmInfo;
