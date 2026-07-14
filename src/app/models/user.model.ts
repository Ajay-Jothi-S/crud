export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  originalIndex: number;
}

export interface UserPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface JsonPlaceholderAddress {
  street?: string;
  suite?: string;
  city?: string;
  zipcode?: string;
}

export interface JsonPlaceholderUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: JsonPlaceholderAddress;
}
