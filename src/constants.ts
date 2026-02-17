
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
  { id: 'mtk', name: 'MTK', logo: 'https://picsum.photos/seed/mtk/100/100', rating: 4.7, type: 'TRANSPORT' },
  { id: 'chonco', name: 'Chonco', logo: 'https://picsum.photos/seed/cho/100/100', rating: 4.0, type: 'TRANSPORT' },
  { id: 'ck_transport', name: 'CK Transport', logo: 'https://picsum.photos/seed/ckk/100/100', rating: 4.4, type: 'TRANSPORT' },
  { id: 'uts', name: 'UTS (Universal)', logo: 'https://picsum.photos/seed/uts/100/100', rating: 4.2, type: 'TRANSPORT' },
  { id: 'sito', name: 'SITO', logo: 'https://picsum.photos/seed/sit/100/100', rating: 3.9, type: 'TRANSPORT' },
];

export const MOCK_TRIPS: Trip[] = [
  // MTK - DÉPARTS DEPUIS TOUTES LES COMMUNES D'ABIDJAN VERS KORHOGO
  { id: 'mtk-adj-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '06:00', arrivalTime: '15:00', price: 10000, companyId: 'mtk', availableSeats: 30, vehicleName: 'MTK Confort' },
  { id: 'mtk-abo-1', origin: 'Abidjan (Abobo)', destination: 'Korhogo', departureTime: '06:30', arrivalTime: '15:30', price: 10000, companyId: 'mtk', availableSeats: 45, vehicleName: 'MTK Grand Nord' },
  { id: 'mtk-yop-1', origin: 'Abidjan (Yopougon)', destination: 'Korhogo', departureTime: '07:00', arrivalTime: '16:00', price: 9500, companyId: 'mtk', availableSeats: 12, vehicleName: 'MTK Éco' },
  { id: 'mtk-kou-1', origin: 'Abidjan (Koumassi)', destination: 'Korhogo', departureTime: '07:15', arrivalTime: '16:15', price: 10000, companyId: 'mtk', availableSeats: 20, vehicleName: 'MTK Direct' },
  { id: 'mtk-any-1', origin: 'Abidjan (Anyama)', destination: 'Korhogo', departureTime: '05:45', arrivalTime: '14:45', price: 9000, companyId: 'mtk', availableSeats: 50, vehicleName: 'MTK Express' },
  { id: 'mtk-coc-1', origin: 'Abidjan (Cocody)', destination: 'Korhogo', departureTime: '08:00', arrivalTime: '17:00', price: 12000, companyId: 'mtk', availableSeats: 15, vehicleName: 'MTK VIP' },
  { id: 'mtk-tre-1', origin: 'Abidjan (Treichville)', destination: 'Korhogo', departureTime: '07:30', arrivalTime: '16:30', price: 10000, companyId: 'mtk', availableSeats: 25, vehicleName: 'MTK Confort' },
  { id: 'mtk-pla-1', origin: 'Abidjan (Plateau)', destination: 'Korhogo', departureTime: '08:30', arrivalTime: '17:30', price: 15000, companyId: 'mtk', availableSeats: 10, vehicleName: 'MTK Business' },
  { id: 'mtk-mar-1', origin: 'Abidjan (Marcory)', destination: 'Korhogo', departureTime: '07:45', arrivalTime: '16:45', price: 11000, companyId: 'mtk', availableSeats: 18, vehicleName: 'MTK Premium' },
  { id: 'mtk-pb-1', origin: 'Abidjan (Port-Bouët)', destination: 'Korhogo', departureTime: '06:15', arrivalTime: '15:15', price: 10000, companyId: 'mtk', availableSeats: 24, vehicleName: 'MTK Littoral' },

  // MTK - RETOURS DEPUIS KORHOGO VERS TOUTES LES COMMUNES D'ABIDJAN
  { id: 'mtk-ret-adj-1', origin: 'Korhogo', destination: 'Abidjan (Adjamé (Gare Centrale))', departureTime: '06:00', arrivalTime: '15:00', price: 10000, companyId: 'mtk', availableSeats: 30 },
  { id: 'mtk-ret-abo-1', origin: 'Korhogo', destination: 'Abidjan (Abobo)', departureTime: '06:30', arrivalTime: '15:30', price: 10000, companyId: 'mtk', availableSeats: 20 },
  { id: 'mtk-ret-yop-1', origin: 'Korhogo', destination: 'Abidjan (Yopougon)', departureTime: '07:00', arrivalTime: '16:00', price: 9500, companyId: 'mtk', availableSeats: 22 },
  { id: 'mtk-ret-kou-1', origin: 'Korhogo', destination: 'Abidjan (Koumassi)', departureTime: '07:30', arrivalTime: '16:30', price: 10000, companyId: 'mtk', availableSeats: 15 },
  { id: 'mtk-ret-coc-1', origin: 'Korhogo', destination: 'Abidjan (Cocody)', departureTime: '08:00', arrivalTime: '17:00', price: 12000, companyId: 'mtk', availableSeats: 10 },

  // AUTRES COMPAGNIES (ABIDJAN <-> KORHOGO)
  { id: 'k-leo-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '06:30', arrivalTime: '15:30', price: 10000, companyId: 'leopard', availableSeats: 12 },
  { id: 'k-utr-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '07:00', arrivalTime: '16:00', price: 10000, companyId: 'utrako', availableSeats: 25 },
  { id: 'k-cho-1', origin: 'Abidjan (Adjamé (Gare Centrale))', destination: 'Korhogo', departureTime: '06:00', arrivalTime: '15:00', price: 10000, companyId: 'chonco', availableSeats: 35 },
  { id: 'k-ck-1', origin: 'Abidjan (Abobo)', destination: 'Korhogo', departureTime: '05:30', arrivalTime: '14:30', price: 10000, companyId: 'ck_transport', availableSeats: 15 },
  { id: 'k-uts-1', origin: 'Abidjan (Koumassi)', destination: 'Korhogo', departureTime: '07:30', arrivalTime: '16:30', price: 11000, companyId: 'uts', availableSeats: 22 },

  // AUTRES TRAJETS
  { id: 't1', origin: 'Abidjan', destination: 'Yamoussoukro', departureTime: '08:00', arrivalTime: '11:00', price: 5000, companyId: 'utb', availableSeats: 25 },
  { id: 't2', origin: 'Abidjan', destination: 'Bouaké', departureTime: '09:30', arrivalTime: '14:30', price: 8000, companyId: 'avs', availableSeats: 12 },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', companyId: 'sixt_ci', model: 'Toyota Prado', type: 'CAR', capacity: 5, pricePerDay: 75000, available: true, image: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=400&q=80' },
  { id: 'v2', companyId: 'avs', model: 'Mercedes Coaster', type: 'MINIBUS', capacity: 22, pricePerDay: 150000, available: true, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80' },
];
