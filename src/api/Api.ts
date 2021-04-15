import axios from 'axios';

import { IPool, IVault } from '../types/Entities';

export default class API {
    public static async getPools(): Promise<IPool[]> {
        const response = await axios.get(`${process.env.REACT_APP_ETH_PARSER_URL}/contracts/pools`);
        return response ? response.data.data : [];
    }

    public static async getVaults(): Promise<IVault[]> {
        const response = await axios.get(
            `${process.env.REACT_APP_ETH_PARSER_URL}/contracts/vaults`,
        );
        return response ? response.data.data : [];
    }

    public static async getTokenPrice(tokenAddress): Promise<string> {
        const response = await axios.get(
            `${process.env.REACT_APP_ETH_PARSER_URL}/price/token/${tokenAddress}`,
        );
        return response ? response.data.data : 0;
    }

    public static async getAPY(): Promise<any> {
        const response = await axios
            .get(`https://api-ui.harvest.finance/pools?key=${process.env.REACT_APP_HARVEST_KEY}`)
            .catch(err => {
                console.log(err);
            });

        const APY = response ? response.data.eth[0].rewardAPY : 0;
        return APY;
    }
    // TODO: remove, move to getAssets-method who gets farm-price
    public static async getFarmPrice(): Promise<any> {
        const response = await axios
            .get(`${process.env.REACT_APP_ETH_PARSER_URL}/price/token/0xa0246c9032bC3A600820415aE600c6388619A14D`)
            .catch(err => {
                console.log(err);
            });

        const farmPrice = response ? response.data.data : 0;
        return farmPrice;
    };
}
