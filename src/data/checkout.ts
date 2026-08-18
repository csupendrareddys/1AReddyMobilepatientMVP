import { Ionicons } from '@expo/vector-icons';
import { healthCredits, membershipTiers, membershipSubscription, wallet } from './mock';

/**
 * Everything the web's booking flow settles with, in one place.
 *
 * The price model mirrors `priceParts()` in the web's PricingConfig, which in
 * turn mirrors `price_breakdown` in `app/common/display_pricing.py`:
 *
 *     doctor fee
 *   + increment (fixed ₹ and %)          → gross
 *   − overall discount (%)               → final price
 *   − plan discount (membership tier)
 *   − vouchers   (flat ₹, admin's voucher book)
 *   − coupons    (flat ₹, admin's coupon book)
 *   − health credits
 *   = total payable
 *
 * Vouchers and coupons are two separate books server-side and stay separate
 * here for the same reason: an admin manages them as distinct things, and
 * folding them into one line would leave no figure saying which is which.
 *
 * None of this is authoritative. The web POSTs the booking, then reads the
 * amount back off the Razorpay order the server creates — so the real total is
 * decided there. Everything below is a design stand-in until that is wired up.
 */

export type ProductKind =
  | 'appointment' | 'service' | 'group_offering' | 'recovery_plan' | 'advanced_plan';

export const PRODUCT_LABEL: Record<ProductKind, string> = {
  appointment: 'Appointment',
  service: 'Service',
  group_offering: 'Group Offering',
  recovery_plan: 'Recovery Plan',
  advanced_plan: 'Advanced Care Plan',
};

/** A flat ₹ row from one of the two discount books. */
export type Discount = {
  id: string;
  code: string;
  label: string;
  amount: number;
  kind: 'voucher' | 'coupon';
};

/** Vouchers the admin attached to this offering — offered, not typed in. */
export const vouchersFor = (kind: ProductKind): Discount[] => {
  if (kind === 'appointment') {
    return [
      { id: 'v1', code: 'FAMILY100', label: 'Family Care plan voucher', amount: 100, kind: 'voucher' },
      { id: 'v2', code: 'FOLLOWUP50', label: 'Follow-up within 14 days', amount: 50, kind: 'voucher' },
    ];
  }
  if (kind === 'recovery_plan' || kind === 'advanced_plan') {
    return [{ id: 'v3', code: 'PLAN250', label: 'Care plan enrolment credit', amount: 250, kind: 'voucher' }];
  }
  return [{ id: 'v4', code: 'FIRSTBUY', label: 'First purchase credit', amount: 75, kind: 'voucher' }];
};

/** Coupons the patient can type in. Codes are matched case-insensitively. */
export const COUPON_BOOK: Discount[] = [
  { id: 'c1', code: 'WELCOME200', label: 'Welcome offer', amount: 200, kind: 'coupon' },
  { id: 'c2', code: 'HEALTH15', label: 'Health week', amount: 150, kind: 'coupon' },
  { id: 'c3', code: 'REFER100', label: 'Referral reward', amount: 100, kind: 'coupon' },
];

export const findCoupon = (code: string): Discount | null =>
  COUPON_BOOK.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()) ?? null;

/**
 * A discount an admin set on this patient's account — the web's per-patient
 * override, applied before any plan benefit.
 */
export const userDiscountPct = 5;

export type PaymentMethodKey = 'razorpay' | 'wallet';

export const paymentMethods: {
  key: PaymentMethodKey;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'razorpay',
    label: 'Pay via Razorpay',
    sub: 'UPI · Cards · Net banking · Wallets',
    icon: 'shield-checkmark-outline',
  },
  {
    key: 'wallet',
    label: 'Larazen Wallet',
    sub: `Balance ₹${wallet.balance.toLocaleString('en-IN')}`,
    icon: 'wallet-outline',
  },
];

/** What Razorpay's own sheet will offer — shown so the choice isn't a mystery. */
export const razorpayModes: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'UPI', icon: 'phone-portrait-outline' },
  { label: 'Cards', icon: 'card-outline' },
  { label: 'Net banking', icon: 'business-outline' },
  { label: 'Wallets', icon: 'wallet-outline' },
];

/** The membership discount that applies to everything this patient buys. */
export const activeTier = membershipTiers.find((t) => t.id === membershipSubscription.plan_id) ?? null;
export const planDiscountPct =
  membershipSubscription.status === 'active' ? (activeTier?.member_discount_pct ?? 0) : 0;

export type Quote = {
  /** Struck-through list price when the offering is marked down. */
  listPrice: number | null;
  fee: number;
  incrementFixed: number;
  incrementPct: number;
  incrementPctAmount: number;
  gross: number;
  overallDiscountPct: number;
  overallDiscount: number;
  /** Final Price — what the offering costs before the patient's own benefits. */
  finalPrice: number;
  userDiscountPct: number;
  userDiscount: number;
  planDiscountPct: number;
  planDiscount: number;
  voucherTotal: number;
  couponTotal: number;
  creditsApplied: number;
  total: number;
  /** Ceiling the server puts on credit redemption for this offering. */
  maxCredits: number;
};

// Every figure the patient sees is in whole rupees. Carrying paise through a
// percentage discount produces things like ₹2,499.9, which reads as a bug even
// though the arithmetic is right.
const rupees = (n: number) => Math.round(n);
const sum = (rows: Discount[]) => rows.reduce((s, d) => s + d.amount, 0);

export function quoteFor(opts: {
  fee: number;
  listPrice?: number | null;
  incrementFixed?: number;
  incrementPct?: number;
  overallDiscountPct?: number;
  vouchers?: Discount[];
  coupons?: Discount[];
  creditsApplied?: number;
}): Quote {
  const {
    fee, listPrice = null, incrementFixed = 0, incrementPct = 0,
    overallDiscountPct = 0, vouchers = [], coupons = [], creditsApplied = 0,
  } = opts;

  const incrementPctAmount = rupees((fee * incrementPct) / 100);
  const gross = rupees(fee + incrementFixed + incrementPctAmount);
  const overallDiscount = rupees((gross * overallDiscountPct) / 100);
  const finalPrice = Math.max(0, rupees(gross - overallDiscount));

  const userDiscount = rupees((finalPrice * userDiscountPct) / 100);
  const planDiscount = rupees((finalPrice * planDiscountPct) / 100);
  const voucherTotal = rupees(sum(vouchers));
  const couponTotal = rupees(sum(coupons));

  const afterDiscounts = Math.max(
    0,
    rupees(finalPrice - userDiscount - planDiscount - voucherTotal - couponTotal),
  );

  // Credits can only cover the server-set share of the offering, and never
  // more than the patient holds or still owes.
  const maxCredits = Math.min(
    healthCredits.available,
    Math.floor((finalPrice * healthCredits.max_redeemable_pct) / 100),
    afterDiscounts,
  );
  const credits = Math.min(creditsApplied, maxCredits);

  return {
    listPrice,
    fee,
    incrementFixed,
    incrementPct,
    incrementPctAmount,
    gross,
    overallDiscountPct,
    overallDiscount,
    finalPrice,
    userDiscountPct,
    userDiscount,
    planDiscountPct,
    planDiscount,
    voucherTotal,
    couponTotal,
    creditsApplied: credits,
    total: Math.max(0, rupees(afterDiscounts - credits)),
    maxCredits,
  };
}

/** Web reserves the slot while payment runs; the countdown is part of the UI. */
export const RESERVATION_MINUTES = 20;

export const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;
