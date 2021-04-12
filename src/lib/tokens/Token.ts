import { ethers } from 'ethers';
import EthParser from '../ethParser';
import ERC20Extended from './ERC20Extended';
/**
 * Token wrapper
 */
export default class Token extends ERC20Extended {
  /**
   *
   * @param {Object} asset object from data/deploy.js
   * @param {Object} abi abi
   * @param {Object} provider web3 provider
   */
  type: string;

  constructor(asset, abi, provider) {
    super(asset.address, asset.decimals, abi, provider);
    this.type = asset.type;
    this.tokenDecimals = asset.decimals;
    this.asset = asset;
  }

  /**
   * Calculate USD value of an amount of tokens
   * @param {BigNumber} amount the amount of tokens to value
   * @return {BigNumber} the value in microdollars
   */
  async usdValueOf(amount, address) {
    if (amount.isZero()) return ethers.BigNumber.from(0);
    const priceParser = EthParser.parser();
    const value = await priceParser.getPrice(this.address);
    // if (address && address.toLowerCase() === '0x7c497298d9576499e17f9564ce4e13faa87a9b33') {
    //   console.log('11113 value price', value)
    // }
    const unit = ethers.BigNumber.from(10).pow(this.tokenDecimals);

    return amount.mul(value).div(unit);
  }
}
