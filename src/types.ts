
export type UserRole = 'USER' | 'COMPANY_ADMIN' | 'SERVICE_PARTNER' | 'GLOBAL_ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'AVAILABLE';
export type ServiceType = 'HOTEL' | 'RESIDENCE' | 'RESTAURANT' | 'CAR' | 'MINIBUS' | 'BUS';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: UserRole;
  gender?: Gender;
  companyId?: string;
  joinDate: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  rating: number;
  type: 'TRANSPORT' | 'SERVICE' | 'BOTH' | 'RENTAL';
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  companyId: string;
  availableSeats: number;
  vehicleName?: string;
}

export interface Vehicle {
  id: string;
  companyId: string;
  model: string;
  type: ServiceType;
  capacity: number;
  pricePerDay: number;
  available: boolean;
  image: string;
}

export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerIdNumber?: string;
  seatNumber: string;
  bookingDate: string;
  travelDate: string;
  departureTime: string;
  originStation?: string;
  destinationStation?: string;
  qrCode: string;
  status: 'CONFIRMED' | 'USED' | 'CANCELLED';
  price: number;
  gender: Gender;
}

export enum AppTab {
  HOME = 'home',
  SERVICES = 'services',
  SEARCH = 'search',
  TICKETS = 'tickets',
  PROFILE = 'profile',
  ASSISTANT = 'assistant',
  ADMIN_DASHBOARD = 'admin_dashboard',
  PARTNER_DASHBOARD = 'partner_dashboard'
}

export type BookingStep = 'TRIP_SELECT' | 'SEAT_SELECT' | 'PASSENGER_DETAILS' | 'PAYMENT' | 'CONFIRMATION';
