export interface CreateOrderResult {
  id: string; // The gateway order ID or PaymentIntent ID
  clientSecret?: string; // Stripe client secret, if applicable
  raw: any; // Raw response from the gateway
}

export interface PaymentGateway {
  createOrder(
    paymentId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<CreateOrderResult>;

  verifyWebhookSignature(
    rawBody: Buffer | string,
    signature: string,
    secret: string,
  ): boolean;
}
