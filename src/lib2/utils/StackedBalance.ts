import { ethers, Contract } from 'ethers';
import API from '../../api'
import { FTOKEN_ABI } from '../../lib/data/ABIs';

export const getBalanceFromVault = async (provider) => {
    const vaults = await API.getVaults();
    const vaultAddress = '0xf2b223eb3d2b382ead8d85f3c1b7ef87c1d35f3a';

    // const provider = ethers.getDefaultProvider();
    // console.log(1111, balance)
    const ethersProvider = new ethers.providers.Web3Provider(provider);

    // const signer = ethersProvider.getSigner();
    const balance = await ethersProvider.getBalance('0x3BF0113FD1f940C582AAF439d272f01a4307AB80');

    // ethersProvider.getBalance(signer);

    const contract = new Contract(vaultAddress, FTOKEN_ABI, ethersProvider);
    console.log(contract)
    debugger
    const balanceFromContract = await contract.balanceOf('0x3BF0113FD1f940C582AAF439d272f01a4307AB80');
    debugger

}