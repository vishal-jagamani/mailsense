export class BatchProcessor<T, R> {
    private concurrency: number;
    private delay: number;

    constructor(concurrency = 2, delay = 100) {
        this.concurrency = concurrency;
        this.delay = delay;
    }

    async processBatches(items: T[], processor: (item: T) => Promise<R>): Promise<R[]> {
        const results: R[] = [];

        for (let i = 0; i < items.length; i += this.concurrency) {
            const batch = items.slice(i, i + this.concurrency);
            const batchResults = await Promise.allSettled(batch.map((item) => processor(item)));

            results.push(
                ...batchResults
                    .filter((result): result is PromiseFulfilledResult<Awaited<R>> => result.status === 'fulfilled')
                    .map((result) => result.value),
            );

            // Add delay between batches to prevent rate limiting
            if (i + this.concurrency < items.length) {
                await this.sleep(this.delay);
            }
        }
        return results;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
