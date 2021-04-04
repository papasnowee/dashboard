import axios from 'axios';

import { IPool, IVault } from "../types/Entities";

export default class API {

    public static async getPools(): Promise<IPool[]> {
        const response = await axios
            .get(`${process.env.REACT_APP_ETH_PARSER_URL}/contracts/pools`);
        return response ? response.data.data : [];
    }

    public static async getVaults(): Promise<IVault[]> {
        const response = await axios
            .get(`${process.env.REACT_APP_ETH_PARSER_URL}/contracts/vaults`);
        return response ? response.data.data : [];
    }
}