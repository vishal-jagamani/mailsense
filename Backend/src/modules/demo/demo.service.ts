import axios, { AxiosRequestConfig } from 'axios';
import { config } from '../../config/config.js';

export class DemoService {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getCatFact(id: number): Promise<void> {
        try {
            const options: AxiosRequestConfig = {
                url: `${config.url}/fact`,
                method: 'GET',
            };
            const { data } = await axios(options);
            return data;
        } catch (err) {
            console.error('Error in DemoService.getCatFact: ', err);
            throw err;
        }
    }
}
