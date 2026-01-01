
export type UserRole = 'USER' | 'COMPANY_ADMIN' | 'SERVICE_PARTNER' | 'GLOBAL_ADMIN';
export type Gender = 'MALE' | 'FEMALE';
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

export interface Seat {
  id: string;
  number: string;
  status: 'AVAILABLE' | 'OCCUPIED_MALE' | 'OCCUPIED_FEMALE';
}

export interface PassengerDetail {
  firstName: string;
  lastName: string;
  phone: string;
  idNumber?: string;
  gender: Gender;
  seatNumber: string;
}

export type VehicleType = 'CAR' | 'BUS' | 'MINIBUS';

export interface Vehicle {
  id: string;
  companyId: string;
  model: string;
  type: VehicleType;
  capacity: number;
  pricePerDay: number;
  available: boolean;
  image: string;
}

export interface ServiceListing {
  id: string;
  companyId: string;
  name: string;
  type: ServiceType;
  price: number;
  location: string;
  description: string;
  image: string;
  available: boolean;
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
  returnDate?: string;
  originStation?: string;
  destinationStation?: string;
  qrCode: string;
  status: 'CONFIRMED' | 'USED' | 'CANCELLED';
  price: number;
  gender: Gender;
}

export enum AppTab {
  HOME = 'home',
  SEARCH = 'search',
  RENTAL = 'rental',
  TICKETS = 'tickets',
  PROFILE = 'profile',
  ASSISTANT = 'assistant',
  ADMIN_DASHBOARD = 'admin_dashboard',
  PARTNER_DASHBOARD = 'partner_dashboard'
}

export type BookingStep = 'TRIP_SELECT' | 'SEAT_SELECT' | 'PASSENGER_DETAILS' | 'PAYMENT' | 'CONFIRMATION';
