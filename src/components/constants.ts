
import { Company, Trip, Vehicle } from './types';

export const IVORIAN_CITIES = [
  "Abidjan", 
  "Abengourou",
  "Agnibilékrou",
  "Assinie", 
  "Bondoukou",
  "Bouaké", 
  "Boundiali",
  "Daloa", 
  "Divo",
  "Ferkessédougou",
  "Gagnoa", 
  "Grand-Bassam", 
  "Korhogo", 
  "Man", 
  "Odiénné",
  "San-Pédro", 
  "Seguela",
  "Soubré",
  "Tanda",
  "Tingrela",
  "Yamoussoukro"
].sort();

export const COMPANIES: Company[] = [
  { id: 'utb', name: 'UTB', logo: 'https://picsum.photos/seed/utb/100/100', rating: 4.5, type: 'TRANSPORT' },
  { id: 'avs', name: 'AVS', logo: 'https://picsum.photos/seed/avs/100/100', rating: 4.2, type: 'BOTH' },
  { id: 'gti', name: 'GTI', logo: 'https://picsum.photos/seed/gti/100/100', rating: 4.0, type: 'TRANSPORT' },
  { id: 'sixt_ci', name: 'Elite Rentals CI', logo: 'https://picsum.photos/seed/rent/100/100', rating: 4.8, type: 'RENTAL' }
];

export const MOCK_TRIPS: Trip[] = [
  { id: '1', origin: 'Abidjan', destination: 'Yamoussoukro', departureTime: '08:00', arrivalTime: '11:00', price: 5000, companyId: 'utb', availableSeats: 25 },
  { id: '2', origin: 'Abidjan', destination: 'Bouaké', departureTime: '09:30', arrivalTime: '14:30', price: 8000, companyId: 'avs', availableSeats: 12 },
  { id: '3', origin: 'Abidjan', destination: 'San-Pédro', departureTime: '07:00', arrivalTime: '13:00', price: 10000, companyId: 'gti', availableSeats: 18 },
  { id: '4', origin: 'Abidjan', destination: 'Odiénné', departureTime: '06:00', arrivalTime: '18:00', price: 15000, companyId: 'utb', availableSeats: 40 },
  { id: '5', origin: 'Abidjan', destination: 'Tingrela', departureTime: '05:30', arrivalTime: '19:30', price: 18000, companyId: 'gti', availableSeats: 30 }
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', companyId: 'sixt_ci', model: 'Toyota Prado', type: 'CAR', capacity: 5, pricePerDay: 75000, available: true, image: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=400&q=80' },
  { id: 'v2', companyId: 'avs', model: 'Mercedes Coaster', type: 'MINIBUS', capacity: 22, pricePerDay: 150000, available: true, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80' },
  { id: 'v3', companyId: 'sixt_ci', model: 'Bus Grand Tourisme', type: 'BUS', capacity: 60, pricePerDay: 350000, available: true, image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=400&q=80' }
];
