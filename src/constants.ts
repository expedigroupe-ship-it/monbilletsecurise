
import { Company, Trip, Vehicle } from './types.ts';

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

export const ABIDJAN_COMMUNES = [
  "Adjamé (Gare Centrale)",
  "Abobo",
  "Anyama",
  "Attécoubé",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Songon",
  "Treichville",
  "Yopougon"
].sort();

export const COMPANIES: Company[] = [
  { id: 'utb', name: 'UTB', logo: 'https://picsum.photos/seed/utb/100/100', rating: 4.5, type: 'TRANSPORT' },
  { id: 'avs', name: 'AVS', logo: 'https://picsum.photos/seed/avs/100/100', rating: 4.2, type: 'BOTH' },
  { id: 'gti', name: 'GTI', logo: 'https://picsum.photos/seed/gti/100/100', rating: 4.0, type: 'TRANSPORT' },
  { id: 'sixt_ci', name: 'Elite Rentals CI', logo: 'https://picsum.photos/seed/rent/100/100', rating: 4.8, type: 'RENTAL' },
  
  // Compagnies du Nord (Korhogo / Tingrela)
  { id: 'leopard', name: 'Léopard', logo: 'https://picsum.photos/seed/leo/100/100', rating: 4.3, type: 'TRANSPORT' },
  { id: 'utrako', name: 'UTRAKO', logo: 'https://picsum.photos/seed/utr/100/100', rating: 4.1, type: 'TRANSPORT' },
  { id: 'mtk', name: 'MTK', logo: 'https://picsum.photos/seed/mtk/100/100', rating: 4.5, type: 'TRANSPORT' },
  { id: 'chonco', name: 'Chonco', logo: 'https://picsum.photos/seed/cho/100/100', rating: 4.0, type: 'TRANSPORT' },
  { id: 'ck_transport', name: 'CK Transport', logo: 'https://picsum.photos/seed/ckk/100/100', rating: 4.4, type: 'TRANSPORT' },
  { id: 'uts', name: 'UTS (Universal)', logo: 'https://picsum.photos/seed/uts/100/100', rating: 4.2, type: 'TRANSPORT' },
  { id: 'sito', name: 'SITO', logo: 'https://picsum.photos/seed/sit/100/100', rating: 3.9, type: 'TRANSPORT' },
  { id: 'mk_transport', name: 'MK Transport', logo: 'https://picsum.photos/seed/mkt/100/100', rating: 4.2, type: 'TRANSPORT' },
  
  { id: 'art_luxury', name: 'ART Luxury Bus', logo: 'https://picsum.photos/seed/art/100/100', rating: 4.9, type: 'TRANSPORT' },
  { id: 'sbta', name: 'SBTA', logo: 'https://picsum.photos/seed/sbt/100/100', rating: 4.4, type: 'TRANSPORT' },
];

export const MOCK_TRIPS: Trip[] = [
  // ABIDJAN -> KORHOGO (COMPAGNIES DEMANDÉES)
  { id: 'k-leo-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '06:30', arrivalTime: '15:30', price: 10000, companyId: 'leopard', availableSeats: 12, vehicleName: 'Léopard Express' },
  { id: 'k-utr-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '07:00', arrivalTime: '16:00', price: 10000, companyId: 'utrako', availableSeats: 25, vehicleName: 'UTRAKO Confort' },
  { id: 'k-mtk-1', origin: 'Abidjan (Yopougon)', destination: 'Korhogo', departureTime: '08:00', arrivalTime: '17:00', price: 9500, companyId: 'mtk', availableSeats: 8, vehicleName: 'MTK Éco' },
  { id: 'k-cho-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '06:00', arrivalTime: '15:00', price: 10000, companyId: 'chonco', availableSeats: 35, vehicleName: 'Chonco Trans' },
  { id: 'k-ck-1', origin: 'Abidjan (Abobo)', destination: 'Korhogo', departureTime: '05:30', arrivalTime: '14:30', price: 10000, companyId: 'ck_transport', availableSeats: 15, vehicleName: 'CK Premium' },
  { id: 'k-uts-1', origin: 'Abidjan (Koumassi)', destination: 'Korhogo', departureTime: '07:30', arrivalTime: '16:30', price: 11000, companyId: 'uts', availableSeats: 22, vehicleName: 'UTS Global' },
  { id: 'k-mtk-2', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '10:00', arrivalTime: '19:00', price: 9500, companyId: 'mtk', availableSeats: 45, vehicleName: 'MTK Éco' },
  { id: 'k-leo-2', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '13:00', arrivalTime: '22:00', price: 10000, companyId: 'leopard', availableSeats: 5, vehicleName: 'Léopard Night' },
  { id: 'k-uts-2', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '08:45', arrivalTime: '17:45', price: 11000, companyId: 'uts', availableSeats: 18, vehicleName: 'UTS Global' },

  // KORHOGO -> ABIDJAN (RETOUR)
  { id: 'rk-leo-1', origin: 'Korhogo', destination: 'Abidjan (Adjamé (Gare Centrale))', departureTime: '06:30', arrivalTime: '15:30', price: 10000, companyId: 'leopard', availableSeats: 30 },
  { id: 'rk-utr-1', origin: 'Korhogo', destination: 'Abidjan (Adjamé (Gare Centrale))', departureTime: '07:00', arrivalTime: '16:00', price: 10000, companyId: 'utrako', availableSeats: 14 },
  { id: 'rk-mtk-1', origin: 'Korhogo', destination: 'Abidjan (Yopougon)', departureTime: '08:00', arrivalTime: '17:00', price: 9500, companyId: 'mtk', availableSeats: 20 },
  { id: 'rk-cho-1', origin: 'Korhogo', destination: 'Abidjan (Adjamé (Gare Centrale))', departureTime: '06:00', arrivalTime: '15:00', price: 10000, companyId: 'chonco', availableSeats: 28 },
  { id: 'rk-ck-1', origin: 'Korhogo', destination: 'Abidjan (Abobo)', departureTime: '05:30', arrivalTime: '14:30', price: 10000, companyId: 'ck_transport', availableSeats: 5 },
  { id: 'rk-uts-1', origin: 'Korhogo', destination: 'Abidjan (Koumassi)', departureTime: '07:30', arrivalTime: '16:30', price: 11000, companyId: 'uts', availableSeats: 19 },

  // AUTRES TRAJETS
  { id: 't1', origin: 'Abidjan', destination: 'Yamoussoukro', departureTime: '08:00', arrivalTime: '11:00', price: 5000, companyId: 'utb', availableSeats: 25 },
  { id: 't2', origin: 'Abidjan', destination: 'Bouaké', departureTime: '09:30', arrivalTime: '14:30', price: 8000, companyId: 'avs', availableSeats: 12 },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', companyId: 'sixt_ci', model: 'Toyota Prado', type: 'CAR', capacity: 5, pricePerDay: 75000, available: true, image: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=400&q=80' },
  { id: 'v2', companyId: 'avs', model: 'Mercedes Coaster', type: 'MINIBUS', capacity: 22, pricePerDay: 150000, available: true, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80' },
];
