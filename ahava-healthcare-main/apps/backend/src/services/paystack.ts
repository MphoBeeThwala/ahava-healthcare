import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';

interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

interface InitializePaymentParams {
  email: string;
  amount: number; // Amount in kobo (smallest currency unit)
  reference?: string;
  currency?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
  channels?: string[];
}

interface InitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
    };
  };
}

interface RefundParams {
  reference: string;
  amount?: number; // Optional partial refund amount
  merchant_note?: string;
  customer_note?: string;
}

class PaystackService {
  private client: AxiosInstance;
  private config: PaystackConfig;

  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
    
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    this.config = {
      secretKey,
      publicKey,
      baseUrl: 'https://api.paystack.co',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Paystack API request', {
          method: config.method,
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('Paystack request error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Paystack API response', {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error('Paystack response error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate a unique payment reference
   */
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `AHV-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Initialize a payment transaction
   * @param params Payment initialization parameters
   * @returns Payment initialization response with authorization URL
   */
  async initializePayment(
    params: InitializePaymentParams
  ): Promise<InitializePaymentResponse> {
    try {
      // Generate reference if not provided
      if (!params.reference) {
        params.reference = this.generateReference();
      }

      // Set default currency to ZAR (South African Rand)
      if (!params.currency) {
        params.currency = 'ZAR';
      }

      // Validate amount (must be positive)
      if (params.amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      logger.info('Initializing Paystack payment', {
        reference: params.reference,
        amount: params.amount,
        email: params.email,
      });

      const response = await this.client.post<InitializePaymentResponse>(
        '/transaction/initialize',
        params
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Payment initialization failed');
      }

      logger.info('Payment initialized successfully', {
        reference: params.reference,
        authorizationUrl: response.data.data.authorization_url,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to initialize payment', {
        error: error.message,
        params,
      });
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify a payment transaction
   * @param reference Payment reference to verify
   * @returns Payment verification response
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      logger.info('Verifying payment', { reference });

      const response = await this.client.get<VerifyPaymentResponse>(
        `/transaction/verify/${reference}`
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Payment verification failed');
      }

      logger.info('Payment verified', {
        reference,
        status: response.data.data.status,
        amount: response.data.data.amount,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to verify payment', {
        error: error.message,
        reference,
      });
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Process a refund
   * @param params Refund parameters
   * @returns Refund response
   */
  async processRefund(params: RefundParams): Promise<any> {
    try {
      logger.info('Processing refund', {
        reference: params.reference,
        amount: params.amount,
      });

      const response = await this.client.post('/refund', params);

      if (!response.data.status) {
        throw new Error(response.data.message || 'Refund processing failed');
      }

      logger.info('Refund processed successfully', {
        reference: params.reference,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to process refund', {
        error: error.message,
        params,
      });
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param payload Request body as string
   * @param signature Signature from x-paystack-signature header
   * @returns Boolean indicating if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        logger.error('PAYSTACK_WEBHOOK_SECRET is not configured');
        return false;
      }

      const hash = crypto
        .createHmac('sha512', webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = hash === signature;

      if (!isValid) {
        logger.security('Invalid webhook signature', {
          expected: hash.substring(0, 10) + '...',
          received: signature.substring(0, 10) + '...',
        });
      }

      return isValid;
    } catch (error: any) {
      logger.error('Error verifying webhook signature', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get transaction details
   * @param transactionId Transaction ID
   * @returns Transaction details
   */
  async getTransaction(transactionId: number): Promise<any> {
    try {
      const response = await this.client.get(`/transaction/${transactionId}`);

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to get transaction');
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get transaction', {
        error: error.message,
        transactionId,
      });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * List transactions with filters
   * @param params Query parameters
   * @returns List of transactions
   */
  async listTransactions(params?: {
    perPage?: number;
    page?: number;
    customer?: string;
    status?: 'success' | 'failed' | 'abandoned';
    from?: string;
    to?: string;
    amount?: number;
  }): Promise<any> {
    try {
      const response = await this.client.get('/transaction', { params });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to list transactions');
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to list transactions', {
        error: error.message,
        params,
      });
      throw new Error(`Failed to list transactions: ${error.message}`);
    }
  }

  /**
   * Export transactions
   * @param params Export parameters
   * @returns Export path
   */
  async exportTransactions(params?: {
    perPage?: number;
    page?: number;
    from?: string;
    to?: string;
    customer?: string;
    status?: 'success' | 'failed' | 'abandoned';
    currency?: string;
    amount?: number;
    settled?: boolean;
    settlement?: number;
    payment_page?: number;
  }): Promise<any> {
    try {
      const response = await this.client.get('/transaction/export', { params });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to export transactions');
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to export transactions', {
        error: error.message,
        params,
      });
      throw new Error(`Failed to export transactions: ${error.message}`);
    }
  }

  /**
   * Check if Paystack is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.secretKey &&
      process.env.PAYSTACK_WEBHOOK_SECRET
    );
  }

  /**
   * Get public key (for frontend)
   */
  getPublicKey(): string {
    return this.config.publicKey;
  }
}

// Singleton instance
const paystackService = new PaystackService();

export default paystackService;
export { PaystackService };


