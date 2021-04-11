import { IVault } from "../../types"

const decimalPlace = 6;

/** Converts the balance into tokens and rounds to the sixth decimal place */
export const makeBalancePrettier = (balance: number, decimals: IVault['decimals']) => {
    // balance calculated in tokens
    const balancePerToken = balance / (Math.pow(10, decimals));
    return Number(balancePerToken.toFixed(decimalPlace));
}