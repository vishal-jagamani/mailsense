import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

class EnvConfig {
    public readonly PORT: number;
    public readonly ENABLE_AUTH: boolean;
    public readonly NODE_ENV: string;

    constructor() {
        const envFilePath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'local'}`);
        dotenv.config({ path: envFilePath });

        const schema = z.object({
            PORT: z.coerce.number().default(8020),
            ENABLE_AUTH: z.enum(['true', 'false']).default('true'),
            NODE_ENV: z.string().default('local'),
        });
        const result = schema.safeParse(process.env);
        if (!result.success) {
            console.error('❌ Invalid environment variables:', result.error.flatten());
            process.exit(1);
        }

        const data = result.data;
        this.PORT = data.PORT;
        this.ENABLE_AUTH = data.ENABLE_AUTH === 'true';
        this.NODE_ENV = data.NODE_ENV;
    }
}

export const ENV = new EnvConfig();
