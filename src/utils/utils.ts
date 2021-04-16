/** Converts the balance into tokens and rounds to the sixth decimal place */
export const makeBalancePrettier = (balance: number, decimals: number) => {
	// balance calculated in tokens
	const balancePerToken = balance / 10 ** decimals;
	return Number(balancePerToken);
};
