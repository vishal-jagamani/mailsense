import { DemoService } from '../demo.service';

describe('DemoService', () => {
    let service: DemoService;

    beforeEach(() => {
        service = new DemoService();
    });

    it('should get cat fact', async () => {
        // added expected timeout of 5000
        jest.setTimeout(5000);
        const result = await service.getCatFact(1);
        expect(result).toBeDefined();
    });
});
