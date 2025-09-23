import { Request, Response } from 'express';
import { DemoController } from '../demo.controller.js';

describe('DemoController', () => {
    let controller: DemoController;
    let mockReq: Request;
    let mockRes: Response;
    let mockNext: jest.Mock;

    beforeEach(() => {
        controller = new DemoController();
        mockReq = { query: { id: '1' } } as unknown as Request;
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
        mockNext = jest.fn();
    });

    it('should get cat fact', async () => {
        await controller.getCatFact(mockReq, mockRes, mockNext);

        // Verify the response was sent with status 200
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalled();
    });
});
