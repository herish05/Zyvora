export type CustomerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  gender: "male" | "female" | "other";
};

export type CustomerAddress = {
  id: string;
  fullName: string;
  mobile: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
  tag: "home" | "work";
};

export type CustomerOrder = {
  id: string;
  createdAt: string;
  status: "placed" | "shipped" | "delivered";
  totalMinor: number;
  itemCount: number;
};

const PROFILE_KEY = "zyvora_customer_profile";
const ADDRESS_KEY = "zyvora_customer_addresses";

const defaultProfile: CustomerProfile = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  gender: "male"
};

const defaultAddresses: CustomerAddress[] = [
  {
    id: "addr-home-1",
    fullName: "Hersh Kumar",
    mobile: "9872117365",
    line1: "6-C, Room No. 501, Chauhan Apartment, Madanpur Khadar Village",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110076",
    landmark: "Near Fire Station Sarita Vihar",
    tag: "home"
  }
];

export const readCustomerProfile = (): CustomerProfile => {
  if (typeof window === "undefined") return defaultProfile;

  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return defaultProfile;

  try {
    const parsed = JSON.parse(raw) as CustomerProfile;
    return {
      firstName: parsed.firstName || defaultProfile.firstName,
      lastName: parsed.lastName || defaultProfile.lastName,
      email: parsed.email || defaultProfile.email,
      mobile: parsed.mobile || defaultProfile.mobile,
      gender: parsed.gender || defaultProfile.gender
    };
  } catch {
    return defaultProfile;
  }
};

export const writeCustomerProfile = (profile: CustomerProfile) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const ensureCustomerProfileEmail = (email: string) => {
  if (typeof window === "undefined") return;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const current = readCustomerProfile();
  if ((current.email || "").trim().toLowerCase() === normalized) {
    return;
  }

  writeCustomerProfile({
    ...current,
    email: normalized
  });
};

const isValidMobile = (value: string) => value.replace(/\D/g, "").length >= 10;

export const hasCustomerProfileSetup = () => {
  if (typeof window === "undefined") return false;

  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const profile = JSON.parse(raw) as CustomerProfile;
    return Boolean(
      profile.firstName?.trim() &&
      profile.lastName?.trim() &&
      profile.email?.trim() &&
      isValidMobile(profile.mobile || "")
    );
  } catch {
    return false;
  }
};

export const readCustomerAddresses = (): CustomerAddress[] => {
  if (typeof window === "undefined") return defaultAddresses;

  const raw = window.localStorage.getItem(ADDRESS_KEY);
  if (!raw) return defaultAddresses;

  try {
    const parsed = JSON.parse(raw) as CustomerAddress[];
    return parsed.length ? parsed : defaultAddresses;
  } catch {
    return defaultAddresses;
  }
};

export const writeCustomerAddresses = (addresses: CustomerAddress[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses));
};

export const upsertCustomerAddress = (address: Omit<CustomerAddress, "id">, id?: string) => {
  const addresses = readCustomerAddresses();

  if (id) {
    const updated = addresses.map((item) => (item.id === id ? { ...address, id } : item));
    writeCustomerAddresses(updated);
    return updated;
  }

  const next = [{ ...address, id: `addr-${Date.now()}` }, ...addresses];
  writeCustomerAddresses(next);
  return next;
};

export const removeCustomerAddress = (id: string) => {
  const addresses = readCustomerAddresses();
  const updated = addresses.filter((item) => item.id !== id);
  writeCustomerAddresses(updated);
  return updated;
};

export const getMockOrders = (): CustomerOrder[] => [
  {
    id: "ORD-20261116-1001",
    createdAt: "2026-11-16",
    status: "shipped",
    totalMinor: 829800,
    itemCount: 2
  },
  {
    id: "ORD-20261108-0944",
    createdAt: "2026-11-08",
    status: "delivered",
    totalMinor: 259900,
    itemCount: 1
  }
];
