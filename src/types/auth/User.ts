import { type Timestamp } from "firebase/firestore";

export type UserStatus = "loading" | "success" | "unauthenticated" | "error";

export interface PaymentMethod {
  brand: string;        // 'visa' | 'mastercard' | 'amex' etc.
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface Subscription {
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'none';
  priceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: Timestamp;
  paymentMethod?: PaymentMethod;
}

export interface UserData {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  myUid: string;
  myName: string;
  myAvatar: string;
  myTag: string;
  myEmail: string;
  myDateJoined: number;
  myBio: string;
  subscription?: Subscription;
}

export interface TagInfo {
  timestamp: number;
  uid: string;
}