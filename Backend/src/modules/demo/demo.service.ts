import axios, { AxiosRequestConfig } from 'axios';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';

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
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in DemoService.getCatFact: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
