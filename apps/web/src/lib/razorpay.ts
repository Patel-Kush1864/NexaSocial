'use client';

// Declare Razorpay window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script from CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  keyId?: string;
  orderId: string;
  amount: number; // in paise
  currency?: string;
  planName?: string;
  userName?: string;
  userEmail?: string;
  onSuccess: (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  onDismiss?: () => void;
  onError?: (err: any) => void;
}

export async function launchRazorpayCheckout(options: RazorpayCheckoutOptions) {
  // Check for developer mockup fallback mode
  if (options.orderId.startsWith('order_mock_') || options.keyId === 'rzp_test_dummy') {
    console.log('[Razorpay Checkout] Running in simulated mock order mode');
    // Simulate user interaction via browser prompt or instant mock confirmation
    const mockPaymentId = `pi_mock_${Math.random().toString(36).substring(2, 12)}`;
    await options.onSuccess({
      razorpay_order_id: options.orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: 'mock_signature_valid',
    });
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Razorpay checkout SDK could not be loaded. Please check your internet connection.');
  }

  const rzpOptions = {
    key: options.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy',
    amount: options.amount,
    currency: options.currency || 'INR',
    name: 'NexaSocial',
    description: `Subscription: ${options.planName || 'Plan Access'}`,
    image: '/favicon.ico',
    order_id: options.orderId,
    prefill: {
      name: options.userName || '',
      email: options.userEmail || '',
    },
    theme: {
      color: '#7c3aed', // NexaSocial violet
    },
    handler: async (response: any) => {
      try {
        await options.onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      } catch (err) {
        options.onError?.(err);
      }
    },
    modal: {
      ondismiss: () => {
        options.onDismiss?.();
      },
      backdropclose: false,
    },
  };

  const razorpayInstance = new window.Razorpay(rzpOptions);
  razorpayInstance.on('payment.failed', (response: any) => {
    options.onError?.(response.error);
  });
  razorpayInstance.open();
}
