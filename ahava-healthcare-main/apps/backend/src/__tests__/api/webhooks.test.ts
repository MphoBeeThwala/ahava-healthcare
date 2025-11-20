// Paystack Webhook route tests
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

let prismaMock: any;
let webhookEventMock: any;

jest.mock('@prisma/client', () => {
  webhookEventMock = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  prismaMock = {
    webhookEvent: webhookEventMock,
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => prismaMock),
  };
});

jest.mock('../../services/paystack', () => ({
  __esModule: true,
  default: {
    verifyWebhookSignature: jest.fn(),
  },
}));

jest.mock('../../services/payment', () => ({
  __esModule: true,
  default: {
    verifyPayment: jest.fn(),
  },
}));

import webhookRoutes from '../../routes/webhooks';
import paystackService from '../../services/paystack';
import paymentService from '../../services/payment';

const mockedPaystackService = paystackService as jest.Mocked<typeof paystackService>;
const mockedPaymentService = paymentService as jest.Mocked<typeof paymentService>;

describe('Paystack webhooks', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/webhooks', webhookRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPaystackService.verifyWebhookSignature.mockReturnValue(true);
    mockedPaymentService.verifyPayment.mockResolvedValue({} as any);
    webhookEventMock.findUnique.mockResolvedValue(null);
    webhookEventMock.create.mockResolvedValue({ id: 'evt_test' });
    webhookEventMock.update.mockResolvedValue({ id: 'evt_test' });
    webhookEventMock.findMany.mockResolvedValue([]);
  });

  it('stores and processes charge.success events', async () => {
    const payload = {
      event: 'charge.success',
      data: {
        id: 12345,
        reference: 'ref_12345',
      },
    };

    const response = await request(app)
      .post('/webhooks/paystack')
      .set('x-paystack-signature', 'valid-signature')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockedPaystackService.verifyWebhookSignature).toHaveBeenCalledWith(
      JSON.stringify(payload),
      'valid-signature'
    );
    expect(mockedPaymentService.verifyPayment).toHaveBeenCalledWith('ref_12345');
    expect(webhookEventMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'charge.success',
          reference: 'ref_12345',
        }),
      })
    );
    expect(webhookEventMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt_test' },
        data: expect.objectContaining({ status: 'PROCESSED' }),
      })
    );
  });

  it('ignores duplicate events that were already processed', async () => {
    webhookEventMock.findUnique.mockResolvedValueOnce({
      id: 'evt_test',
      status: 'PROCESSED',
    });

    const response = await request(app)
      .post('/webhooks/paystack')
      .set('x-paystack-signature', 'valid-signature')
      .send({
        event: 'charge.success',
        data: {
          id: 12345,
          reference: 'ref_12345',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.duplicate).toBe(true);
    expect(webhookEventMock.create).not.toHaveBeenCalled();
    expect(webhookEventMock.update).not.toHaveBeenCalled();
    expect(mockedPaymentService.verifyPayment).not.toHaveBeenCalled();
  });

  it('lists recent webhook events for the admin endpoint', async () => {
    webhookEventMock.findMany.mockResolvedValueOnce([
      {
        id: 'evt_1',
        provider: 'Paystack',
        eventType: 'charge.success',
        status: 'PROCESSED',
        createdAt: new Date().toISOString(),
      },
    ]);

    const response = await request(app).get('/webhooks/events');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.events[0].id).toBe('evt_1');
    expect(webhookEventMock.findMany).toHaveBeenCalled();
  });
});

