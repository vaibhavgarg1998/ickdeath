import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { isValidIndianPhone, normalizePhone } from "@/lib/orders";

export const RESTAURANT_SUBSCRIPTIONS_COLLECTION = "restaurantSubscriptions";

export const RESTAURANT_SUBSCRIPTION_STATUSES = [
  "new",
  "contacted",
  "active",
] as const;

export type RestaurantSubscriptionStatus =
  (typeof RESTAURANT_SUBSCRIPTION_STATUSES)[number];

export type RestaurantSubscription = {
  id: string;
  name: string;
  restaurantName: string;
  phone: string;
  email: string;
  status: RestaurantSubscriptionStatus;
  plan: "monthly";
  source: "ickdeath-website";
  createdAt: string;
  updatedAt?: string;
};

export type RestaurantSubscriptionInput = {
  name: string;
  restaurantName: string;
  phone: string;
  email: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRequiredEmail(email: string): boolean {
  const value = email.trim();
  return value.length > 0 && value.length <= 120 && EMAIL_PATTERN.test(value);
}

export function validateRestaurantSubscription(
  input: RestaurantSubscriptionInput,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const restaurantName = input.restaurantName.trim();

  if (name.length < 2 || name.length > 80) {
    errors.name = "Enter your name";
  }
  if (restaurantName.length < 2 || restaurantName.length > 120) {
    errors.restaurantName = "Enter the restaurant name";
  }
  if (!isValidIndianPhone(input.phone)) {
    errors.phone = "Enter a valid 10-digit phone number";
  }
  if (!isRequiredEmail(input.email)) {
    errors.email = "Enter a valid email";
  }

  return errors;
}

function newSubscriptionId(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `RS-${y}${m}${d}-${suffix}`;
}

export function toRestaurantSubscription(
  input: RestaurantSubscriptionInput,
  now = new Date(),
): RestaurantSubscription {
  return {
    id: newSubscriptionId(now),
    name: input.name.trim(),
    restaurantName: input.restaurantName.trim(),
    phone: normalizePhone(input.phone),
    email: input.email.trim().toLowerCase(),
    status: "new",
    plan: "monthly",
    source: "ickdeath-website",
    createdAt: now.toISOString(),
  };
}

function fromDoc(data: DocumentData): RestaurantSubscription {
  return data as RestaurantSubscription;
}

export async function createRestaurantSubscription(
  input: RestaurantSubscriptionInput,
): Promise<RestaurantSubscription> {
  const errors = validateRestaurantSubscription(input);
  if (Object.keys(errors).length) {
    throw new Error("Check the form and try again");
  }
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const record = toRestaurantSubscription(input);
  await setDoc(
    doc(getFirebaseDb(), RESTAURANT_SUBSCRIPTIONS_COLLECTION, record.id),
    record,
  );
  return record;
}

export function subscribeRestaurantSubscriptions(
  onData: (rows: RestaurantSubscription[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(new Error("Firebase is not configured"));
    return () => {};
  }

  const q = query(
    collection(getFirebaseDb(), RESTAURANT_SUBSCRIPTIONS_COLLECTION),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((row) => fromDoc(row.data())));
    },
    (err) => onError(err),
  );
}

export async function updateRestaurantSubscriptionStatus(
  id: string,
  status: RestaurantSubscriptionStatus,
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  await updateDoc(
    doc(getFirebaseDb(), RESTAURANT_SUBSCRIPTIONS_COLLECTION, id),
    {
      status,
      updatedAt: new Date().toISOString(),
    },
  );
}
