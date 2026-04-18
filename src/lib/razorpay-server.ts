import Razorpay from 'razorpay';

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay env vars (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not set');
  }
  if (!_client) {
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _client;
}

// Amount in paise for each product
export const PRICES = {
  pay_per_use:     1500,   // ₹15
  pro_monthly:     9900,   // ₹99
  pro_annual:      79900,  // ₹799
  elite_monthly:   19900,  // ₹199
  elite_annual:    149900, // ₹1,499
} as const;

export type PriceKey = keyof typeof PRICES;
