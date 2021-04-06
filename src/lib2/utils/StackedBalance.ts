import { ethers, Contract } from 'ethers';
import API from '../../api'
import { FTOKEN_ABI, ERC20_ABI } from '../../lib/data/ABIs';

export const getBalanceFromVault = async (provider, aby1, contractAddress1, walletAddress1) => {
    const vaults = await API.getVaults();
    const vaultAddress = '0xf2b223eb3d2b382ead8d85f3c1b7ef87c1d35f3a';

    // const provider = ethers.getDefaultProvider();
    // console.log(1111, balance)
    const ethersProvider = new ethers.providers.Web3Provider(provider);

    // const signer = ethersProvider.getSigner();
    const balance = await ethersProvider.getBalance('0x3BF0113FD1f940C582AAF439d272f01a4307AB80');

    // ethersProvider.getBalance(signer);

    const contractAddres1 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const contractAddres2 = '0xdac17f958d2ee523a2206206994597c13d831ec7';

    const walletAddress = '0x814055779f8d2f591277b76c724b7adc74fb82d9';

    const contract1 = new Contract(contractAddres1, ERC20_ABI, ethersProvider);
    const contract2 = new Contract(contractAddres2, ERC20_ABI, ethersProvider);

    const allVaultBalances = await Promise.all([contract1.balanceOf(walletAddress), contract2.balanceOf(walletAddress)])
    debugger

    // const balanceFromContract = await contract2.balanceOf(walletAddress); // 0x format number
    const balanceIntNumber1 = parseInt(allVaultBalances[0]._hex, 16); // decimal number system
    const balanceIntNumber2 = parseInt(allVaultBalances[1]._hex, 16);
    debugger

}

// TUSD 101.053779  addres contract TUSD token address  === 0x0000000000085d4780B73119b644AE5ecd22b376

// 26381          28766
// 0.026381 число из таблицы для staked assets в поле FARM to Claim (FARM к требованию)
// 0x814055779f8d2f591277b76c724b7adc74fb82d9 test wallet
// const contract = new Contract(vaultAddress, abi, ethersProvider);
// const balanceFromContract = await contract.balanceOf(walletAddress);


// fTUSD 0x7674622c63Bee7F46E86a4A5A18976693D54441b??


// 2876673948697964

//409403014