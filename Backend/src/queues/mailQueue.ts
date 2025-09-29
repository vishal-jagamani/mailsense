import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/redis.js';

export const mailQueue = new Queue('mailQueue', { ...defaultQueueOptions });
