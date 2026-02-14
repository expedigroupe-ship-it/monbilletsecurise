
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout.tsx';
import { AppTab, Trip, Ticket, UserRole, UserProfile, BookingStep, Gender, Company } from './types.ts';
import { IVORIAN_CITIES, ABIDJAN_COMMUNES, MOCK_TRIPS, COMPANIES, MOCK_VEHICLES } from './constants.ts';
import { 
  Search, ArrowRight, ShieldCheck, ChevronLeft, MessageCircle, Send, Plus, 
  Car, Phone, Lock, LogOut, Wallet, CheckCircle2, AlertCircle, 
  LayoutDashboard, Building, Sparkles, Mic, Repeat, X, Fingerprint, 
  Image as ImageIcon, Video, Bell, Users, BarChart3, Activity,
  User, Truck, Store, Ticket as TicketIcon, ChevronRight, Armchair, 
  CreditCard, Key, Smartphone, Settings, Briefcase, Star, Wand2, 
  Camera, Map as MapIcon, DollarSign, Clock, Upload, Coffee, Utensils, Bed, Zap, History, Trash2,
  MapPin, Wifi, Check, MicOff, Waves, Calendar, PlusCircle, Save, FileText, Film, Eye, TrendingUp, Ban, Loader2
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

type AuthMode = 'LOGIN' | 'REGISTER';
type ServiceCategory = 'RENTAL' | 'ACCOMMODATION' | 'DINING';

// --- Utilitaires Audio pour Gemini Live ---
const AUDIO_INPUT_RATE = 16000;
const AUDIO_OUTPUT_RATE = 24000;

function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

function float32ToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let val = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Composants Bus Intérieur ---

const BusDoor: React.FC = () => (
  <div className="w-8 h-[144px] flex flex-col justify-center items-center py-2 border-r-2 border-dashed border-orange-500/30 mx-2 bg-orange-500/5 rounded-l-xl">
    <div className="w-1 h-12 bg-orange-500 rounded-full animate-pulse mb-2"></div>
    <span className="text-[6px] font-black uppercase text-orange-600 -rotate-90 whitespace-nowrap tracking-widest">PORTE</span>
  </div>
);

const SteeringWheel: React.FC = () => (
  <div className="w-12 h-[92px] flex flex-col justify-center items-center mx-2 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="w-10 h-10 rounded-full border-4 border-slate-500 flex items-center justify-center bg-slate-900 shadow-lg relative mb-2">
         <div className="w-1 h-full bg-slate-500"></div>
         <div className="h-1 w-full bg-slate-500 absolute"></div>
      </div>
      <p className="text-[5px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">PILOTE<br/>MSB</p>
  </div>
);

const HorizontalBusInterior: React.FC<{ 
  selectedSeats: Record<string, Gender>, 
  onSeatSelect: (num: string, gender: Gender | null) => void,
  isInteractive?: boolean 
}> = ({ selectedSeats, onSeatSelect, isInteractive = true }) => {
  const [activeSelector, setActiveSelector] = useState<string | null>(null);

  const cols = Array.from({ length: 14 }, (_, i) => i);
  const rows = [0, 1, 2, 3, 4, 5]; 

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] border-4 border-slate-800 shadow-inner overflow-x-auto custom-scrollbar-dark relative">
      <div className="min-w-max flex gap-4 items-stretch pl-2">
        <div className="flex flex-col justify-between items-center py-1">
            <BusDoor />
            <div className="flex-1"></div>
            <SteeringWheel />
        </div>

        {cols.map((colIdx) => {
           const isMiddleDoor = colIdx === 5;
           return (
             <React.Fragment key={colIdx}>
               {isMiddleDoor && (
                 <div className="flex flex-col justify-start py-1">
                     <BusDoor />
                 </div>
               )}
               
               <div className="flex flex-col gap-3 py-1">
                 {rows.map(rowIdx => {
                    if (rowIdx === 3) {
                       return <div key={`aisle-${colIdx}`} className="h-10 w-10 flex items-center justify-center opacity-10 select-none"><span className="text-[5px] font-black uppercase rotate-90 text-slate-500 tracking-[0.2em]">ALLÉE</span></div>;
                    }
                    
                    const seatIdx = colIdx * 5 + (rowIdx > 3 ? rowIdx - 1 : rowIdx) + 1;
                    const num = seatIdx.toString();
                    const gender = selectedSeats[num];
                    
                    return (
                       <div key={num} className="relative">
                          <button
                             disabled={!isInteractive}
                             onClick={() => setActiveSelector(activeSelector === num ? null : num)}
                             className={`w-10 h-10 rounded-xl flex items-center justify-center border-b-4 transition-all relative group
                                ${gender === 'MALE' ? 'bg-blue-500 border-blue-700 text-white' : 
                                  gender === 'FEMALE' ? 'bg-pink-500 border-pink-700 text-white' : 
                                  'bg-white border-slate-200 text-slate-400 hover:border-orange-500'}`}
                          >
                             <Armchair size={16} />
                             <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[6px] font-bold px-1 rounded-full">{num}</span>
                          </button>
                          
                          {isInteractive && activeSelector === num && (
                             <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white rounded-2xl shadow-2xl p-2 flex gap-2 border border-slate-100 animate-in zoom-in">
                                <button onClick={() => { onSeatSelect(num, 'MALE'); setActiveSelector(null); }} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-sm"><User size={14}/></button>
                                <button onClick={() => { onSeatSelect(num, 'FEMALE'); setActiveSelector(null); }} className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 shadow-sm"><User size={14}/></button>
                                {gender && (
                                   <button onClick={() => { onSeatSelect(num, null); setActiveSelector(null); }} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 shadow-sm"><Trash2 size={14}/></button>
                                )}
                                <button onClick={() => setActiveSelector(null)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200"><X size={14}/></button>
                             </div>
                          )}
                       </div>
                    );
                 })}
               </div>
             </React.Fragment>
           );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [authContext, setAuthContext] = useState<UserRole>('USER');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  
  const [authData, setAuthData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [mockUsers, setMockUsers] = useState<UserProfile[]>([
    { id: 'u_default', firstName: 'Jean-Marc', lastName: 'Koffi', phone: '0707070707', role: 'USER', joinDate: '01/01/2024' },
    { id: 'u_admin', firstName: 'Admin', lastName: 'Principal', phone: '0101010101', role: 'GLOBAL_ADMIN', joinDate: '01/01/2024' }
  ]);
  
  const [bookingStep, setBookingStep] = useState<BookingStep>('TRIP_SELECT');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, Gender>>({});
  const [origin, setOrigin] = useState('Abidjan');
  const [originCommune, setOriginCommune] = useState('');
  const [destination, setDestination] = useState('Korhogo');
  const [destinationCommune, setDestinationCommune] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);

  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('RENTAL');

  const [activeSubTab, setActiveSubTab] = useState<'GESTION' | 'BILLETS' | 'AIDE' | 'RESERVATIONS' | 'VOYAGES' | 'OFFRES'>('GESTION');
  const [companyTrips, setCompanyTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [managingTrip, setManagingTrip] = useState<Trip | null>(null);
  const [managedSeats, setManagedSeats] = useState<Record<string, Gender>>({});
  const [newTripData, setNewTripData] = useState({
    origin: 'Abidjan',
    originCommune: '',
    destination: 'Korhogo',
    destinationCommune: '',
    departureTime: '08:00',
    arrivalTime: '13:00',
    price: 10000
  });

  const [partnerServices, setPartnerServices] = useState<any[]>([
    { id: 1, name: "Suite Royale", type: 'ACCOMMODATION', price: 45000, desc: "Vue sur la lagune, petit déj inclus", images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"] },
    { id: 2, name: "Toyota Prado", type: 'RENTAL', price: 75000, desc: "Location journalière avec chauffeur", images: ["https://images.unsplash.com/photo-1594502184342-2e12f877aa73"] }
  ]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', type: 'RENTAL', price: 0, desc: '', images: [] as string[] });
  
  const [notifications, setNotifications] = useState<{id: number, text: string, time: string, read: boolean}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [ticketAction, setTicketAction] = useState<{ type: 'CANCEL' | 'MODIFY', ticketId: string } | null>(null);

  const [activeAdminTab, setActiveAdminTab] = useState<'OVERVIEW' | 'ACCOUNTS' | 'FINANCE'>('OVERVIEW');
  const [pendingAccounts, setPendingAccounts] = useState([
    { id: '101', name: 'Transport Ivoirien Rapide', type: 'COMPANY_ADMIN', date: '10:30', status: 'PENDING' },
    { id: '102', name: 'Résidence Les Palmiers', type: 'SERVICE_PARTNER', date: '11:15', status: 'PENDING' },
    { id: '103', name: 'Location Express', type: 'SERVICE_PARTNER', date: '14:00', status: 'PENDING' }
  ]);

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: "BONJOUR ! COMMENT PUIS-JE VOUS AIDER DANS VOTRE VOYAGE AUJOURD'HUI ?" }
  ]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    email: 'utilisateur@msb.ci',
    language: 'Français',
    notifications: true,
    biometric: true
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
       let notifText = '';
       if (user?.role === 'SERVICE_PARTNER') notifText = 'Nouvelle réservation confirmée pour Suite Royale';
       else if (user?.role === 'COMPANY_ADMIN') notifText = 'Nouvelle réservation confirmée pour Départ 08:00';
       else if (user?.role === 'GLOBAL_ADMIN') notifText = 'Nouveau compte partenaire en attente de validation';

       if (notifText) {
         const timer = setTimeout(() => {
            const newNotif = {
               id: Date.now(),
               text: notifText,
               time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
         }, 5000);
         return () => clearTimeout(timer);
       }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput("");
    setAssistantMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsSending(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userText,
          config: {
            systemInstruction: "Tu es l'assistant de 'MON BILLET SECURISE'. Aide les voyageurs pour les réservations de bus en Côte d'Ivoire, les locations de voiture et les hôtels. Sois concis, serviable et chaleureux. Utilise des emojis.",
          },
        });
        const aiText = response.text || "Désolé, je n'ai pas pu générer de réponse.";
        setAssistantMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
        setAssistantMessages(prev => [...prev, { role: 'model', text: "Désolé, service temporairement indisponible." }]);
    } finally {
        setIsSending(false);
    }
  };

  const startVoiceSession = async () => {
    try {
      if (isVoiceActive) return;
      setIsVoiceActive(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_OUTPUT_RATE });
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_INPUT_RATE });
      inputAudioContextRef.current = inputCtx;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'Tu es l\'assistant vocal de "MON BILLET SECURISE". Tu es serviable, chaleureux et précis. Tu aides pour les réservations de bus, locations et infos sur la Côte d\'Ivoire.',
        },
        callbacks: {
          onopen: () => console.log('Connexion Live établie'),
          onmessage: (msg: LiveServerMessage) => {
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               const float32 = base64ToFloat32Array(base64Audio);
               const buffer = outputCtx.createBuffer(1, float32.length, AUDIO_OUTPUT_RATE);
               buffer.getChannelData(0).set(float32);
               
               const source = outputCtx.createBufferSource();
               source.buffer = buffer;
               source.connect(outputCtx.destination);
               
               const startTime = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
               source.start(startTime);
               nextStartTimeRef.current = startTime + buffer.duration;
             }
          },
          onclose: () => {
             console.log('Session fermée');
             stopVoiceSession();
          },
          onerror: (e) => console.error('Erreur Live:', e)
        }
      });

      liveSessionRef.current = sessionPromise;

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Data = float32ToBase64(inputData);
        
        sessionPromise.then(session => {
           session.sendRealtimeInput({
             media: {
               mimeType: 'audio/pcm;rate=16000',
               data: base64Data
             }
           });
        });
      };

    } catch (error) {
      console.error("Erreur démarrage vocal:", error);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceSession = () => {
    setIsVoiceActive(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    liveSessionRef.current = null;
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'REGISTER') {
        if (!acceptedLegal) {
          alert("Veuillez accepter les conditions.");
          return;
        }
        
        const existingUser = mockUsers.find(u => u.phone === authData.phone);
        if (existingUser) {
            alert("Ce numéro est déjà associé à un compte. Veuillez vous connecter.");
            setAuthMode('LOGIN');
            return;
        }

        const nameParts = authData.name.trim().split(' ');
        const firstName = nameParts[0] || 'Voyageur';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newUser: UserProfile = {
          id: Math.random().toString(36).substr(2, 9),
          firstName: firstName,
          lastName: lastName,
          phone: authData.phone,
          role: authContext,
          joinDate: new Date().toLocaleDateString()
        };
        
        setMockUsers(prev => [...prev, newUser]);
        setUser(newUser);
        setIsAuthenticated(true);
    } else {
        const foundUser = mockUsers.find(u => u.phone === authData.phone);
        if (foundUser) {
            setUser(foundUser);
            setIsAuthenticated(true);
        } else {
            alert("Aucun compte trouvé avec ce numéro. Veuillez vous inscrire.");
            setAuthMode('REGISTER');
            return;
        }
    }

    if (authContext === 'GLOBAL_ADMIN') setActiveTab(AppTab.ADMIN_DASHBOARD);
    else if (authContext === 'USER') setActiveTab(AppTab.HOME);
    else setActiveTab(AppTab.PARTNER_DASHBOARD);
  };

  const handleSeatSelect = (num: string, gender: Gender | null) => {
    setSelectedSeats(prev => {
        if (gender === null) {
            const next = { ...prev };
            delete next[num];
            return next;
        }
        return { ...prev, [num]: gender };
    });
  };

  const finalizeBooking = () => {
    const tickets = Object.entries(selectedSeats).map(([num, gender]) => ({
      id: 'MSB-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      tripId: selectedTrip?.id || '',
      passengerName: user?.firstName || 'Passager',
      passengerPhone: user?.phone || '',
      seatNumber: num,
      bookingDate: new Date().toLocaleDateString(),
      travelDate: departureDate,
      originStation: origin === 'Abidjan' ? originCommune : origin,
      destinationStation: destination === 'Abidjan' ? destinationCommune : destination,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MSB-CRYPT-${Math.random()}`,
      status: 'CONFIRMED' as const,
      price: selectedTrip?.price || 0,
      gender
    }));
    setMyTickets(prev => [...tickets, ...prev]);
    setBookingStep('CONFIRMATION');
  };

  const handleCreateTrip = () => {
    const newId = 'trip-' + Math.random().toString(36).substr(2, 5);
    const originLabel = newTripData.origin === 'Abidjan' && newTripData.originCommune ? `Abidjan (${newTripData.originCommune})` : newTripData.origin;
    const destinationLabel = newTripData.destination === 'Abidjan' && newTripData.destinationCommune ? `Abidjan (${newTripData.destinationCommune})` : newTripData.destination;

    const trip: Trip = {
      id: newId,
      companyId: 'ck_transport',
      availableSeats: 70,
      vehicleName: 'Bus VIP 70 Places',
      origin: originLabel,
      destination: destinationLabel,
      departureTime: newTripData.departureTime,
      arrivalTime: newTripData.arrivalTime,
      price: newTripData.price
    };
    setCompanyTrips(prev => [trip, ...prev]);
    setIsAddingTrip(false);
  };

  const handleAddService = () => {
     setPartnerServices(prev => [{...newServiceData, id: Date.now(), images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957']}, ...prev]);
     setIsAddingService(false);
  };

  const handleAccountAction = (id: string, action: 'VALIDATE' | 'REJECT') => {
    setPendingAccounts(prev => prev.filter(acc => acc.id !== id));
    const text = action === 'VALIDATE' ? 'Compte validé avec succès' : 'Compte rejeté';
    setNotifications(prev => [{id: Date.now(), text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), read: false}, ...prev]);
  };

  const handleTicketActionConfirm = () => {
    if (!ticketAction) return;
    if (ticketAction.type === 'CANCEL') {
        setMyTickets(prev => prev.map(t => t.id === ticketAction.ticketId ? { ...t, status: 'CANCELLED' } : t));
    } else {
        setActiveTab(AppTab.HOME);
        setBookingStep('TRIP_SELECT');
    }
    setTicketAction(null);
  };

  const openTripManagement = (trip: Trip) => {
    setManagingTrip(trip);
    const mockSeats: Record<string, Gender> = {};
    const occupiedCount = Math.floor(Math.random() * 40);
    for (let i = 0; i < occupiedCount; i++) {
        const seatNum = Math.floor(Math.random() * 70) + 1;
        mockSeats[seatNum.toString()] = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
    }
    setManagedSeats(mockSeats);
  };

  // Filtrage intelligent des trajets basé sur les villes et les communes
  const filteredTrips = useMemo(() => {
    return MOCK_TRIPS.filter(t => {
      // Logic pour l'origine
      let matchOrigin = false;
      if (origin === 'Abidjan' && originCommune) {
        // Recherche spécifique par commune
        matchOrigin = t.origin.includes(originCommune);
      } else {
        // Recherche globale par ville
        matchOrigin = t.origin.startsWith(origin);
      }

      // Logic pour la destination
      let matchDest = false;
      if (destination === 'Abidjan' && destinationCommune) {
        matchDest = t.destination.includes(destinationCommune);
      } else {
        // Recherche globale par ville
        matchDest = t.destination.startsWith(destination);
      }

      return matchOrigin && matchDest;
    });
  }, [origin, originCommune, destination, destinationCommune]);

  if (!isAuthenticated) return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto p-8 justify-center font-sans relative">
      <div className="flex flex-col items-center mb-10">
        <div className="bg-orange-600 w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
          <ShieldCheck size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none text-center whitespace-nowrap">MON BILLET SECURISE</h1>
        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-[0.1em] text-center whitespace-nowrap">Votre voyage commence ici, voyagez en toute sérénité</p>
      </div>

      <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 relative z-10">
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'REGISTER' && (
            <input 
                type="text" 
                placeholder="Nom et prénoms" 
                className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100 focus:border-orange-500" 
                value={authData.name}
                onChange={e => setAuthData({...authData, name: e.target.value})}
                required 
            />
          )}
          <input 
            type="tel" 
            placeholder="Numéro de téléphone" 
            className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" 
            value={authData.phone}
            onChange={e => setAuthData({...authData, phone: e.target.value})}
            required 
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" 
            value={authData.password}
            onChange={e => setAuthData({...authData, password: e.target.value})}
            required 
          />
          
          {authMode === 'REGISTER' && (
            <>
              <input type="password" placeholder="À nouveau mot de passe" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" required />
              <div className="flex items-start gap-3 px-2 mt-4">
                <input type="checkbox" checked={acceptedLegal} onChange={e => setAcceptedLegal(e.target.checked)} className="w-5 h-5 accent-orange-600 rounded mt-0.5 shrink-0" />
                <span className="text-[9px] font-black text-slate-800 uppercase leading-tight">
                  J'accepte les <button type="button" onClick={() => setShowPolicy(true)} className="underline text-red-600 hover:text-red-700 text-left decoration-2 underline-offset-2">Conditions d'Utilisation</button> et la <button type="button" onClick={() => setShowPolicy(true)} className="underline text-red-600 hover:text-red-700 text-left decoration-2 underline-offset-2">Politique de Confidentialité</button>
                </span>
              </div>
            </>
          )}

          {authMode === 'LOGIN' && (
            <div className="flex justify-between items-center px-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-orange-600 w-3 h-3" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-[9px] font-black text-orange-600 uppercase">Mot de passe oublié</button>
            </div>
          )}

          <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl mt-4 border-4 border-orange-600/20 active:scale-95 transition-all">
            {authMode === 'LOGIN' ? 'ENTRER' : "S'INSCRIRE"}
          </button>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={() => {
                  setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                  setAuthData(prev => ({ ...prev, password: '', confirmPassword: '' }));
              }}
              className="text-[10px] font-bold text-slate-400 uppercase hover:text-orange-600 transition-colors"
            >
              {authMode === 'LOGIN' ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <p className="text-[8px] font-black text-slate-300 uppercase text-center mb-4 tracking-[0.2em]">ESPACE PARTENAIRES</p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { id: 'USER', label: 'VOYAGEUR' },
            { id: 'COMPANY_ADMIN', label: 'COMPAGNIE DE TRANSPORT' },
            { id: 'SERVICE_PARTNER', label: 'PRESTATAIRES' },
            { id: 'GLOBAL_ADMIN', label: 'ADMIN' }
          ].map(role => (
            <button 
              key={role.id} 
              onClick={() => setAuthContext(role.id as UserRole)} 
              className={`px-4 py-2 rounded-xl border-2 text-[7px] font-black uppercase transition-all
                ${authContext === role.id 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-300 hover:border-orange-200'}`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {showPolicy && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in duration-300">
             <div className="bg-indigo-600 p-6 text-center shadow-lg relative z-10">
                <ShieldCheck className="text-white/20 absolute top-4 right-4" size={40} />
                <h3 className="text-white font-black uppercase text-xs tracking-widest leading-relaxed relative z-20">CHARTE DE<br/>CONFIDENTIALITÉ</h3>
             </div>
             
             <div className="p-8 overflow-y-auto custom-scrollbar text-[10px] font-bold text-slate-600 space-y-5 leading-relaxed bg-slate-50">
               <p className="text-slate-800">Bienvenue sur MON BILLET SECURISE. La protection de vos données est notre priorité absolue.</p>
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-indigo-600 font-black">CHIFFREMENT DE BOUT EN BOUT (E2EE) ACTIVÉ SUR TOUTES VOS TRANSACTIONS ET DONNÉES PERSONNELLES.</p>
               </div>
               <div>
                 <span className="text-slate-900 uppercase font-black block mb-1">Utilisation des données :</span> Vos informations (Nom, Prénoms, Téléphone, Pièce d'identité) sont utilisées exclusivement pour l'édition de vos titres de transport et le contrôle lors de l'embarquement.
               </div>
               <div>
                 <span className="text-slate-900 uppercase font-black block mb-1">Partage responsable :</span> Seule la compagnie de transport choisie a accès aux informations nécessaires à la vérification de votre voyage.
               </div>
               <div>
                 <span className="text-slate-900 uppercase font-black block mb-1">Sécurité :</span> Nous mettons en œuvre des technologies avancées pour garantir que vos informations ne sont jamais compromises.
               </div>
             </div>

             <button 
               onClick={() => { setAcceptedLegal(true); setShowPolicy(false); }}
               className="bg-orange-600 p-5 text-center text-white font-black uppercase text-[10px] hover:bg-orange-700 active:scale-95 transition-all shadow-xl z-20"
             >
               J'ACCEPTE ET JE COMPRENDS
             </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role || 'USER'}>
      
      {activeTab === AppTab.HOME && user?.role === 'USER' && (
        <div className="p-6 space-y-8 animate-in fade-in pb-24">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Salut, {user?.firstName}</h2>
              <p className="text-[10px] font-black text-orange-600 uppercase">OÙ allons-nous aujourd'hui ?</p>
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 shadow-sm"><LogOut size={20}/></button>
          </div>

          <div className="bg-white p-7 rounded-[3rem] shadow-2xl border border-slate-50 space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); setBookingStep('TRIP_SELECT'); setActiveTab(AppTab.SEARCH); }} className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Départ</p>
                  <select className="w-full bg-slate-50 py-3.5 px-4 rounded-xl text-[10px] font-bold border border-slate-100" value={origin} onChange={e => setOrigin(e.target.value)}>
                    {IVORIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => { const oldO = origin; setOrigin(destination); setDestination(oldO); }} className="mt-4 p-2 bg-slate-100 rounded-full text-slate-400"><Repeat size={14}/></button>
                <div className="flex-1 space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Arrivée</p>
                  <select className="w-full bg-slate-50 py-3.5 px-4 rounded-xl text-[10px] font-bold border border-slate-100" value={destination} onChange={e => setDestination(e.target.value)}>
                    {IVORIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {(origin === 'Abidjan' || destination === 'Abidjan') && (
                <div className="flex gap-3 animate-in fade-in">
                   {origin === 'Abidjan' && (
                    <div className="flex-1 space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Zone Départ (ABJ)</p>
                      <select className="w-full bg-orange-50/50 py-2.5 px-4 rounded-xl text-[10px] font-bold border border-orange-100" value={originCommune} onChange={e => setOriginCommune(e.target.value)}>
                        <option value="">Toutes les gares</option>
                        {ABIDJAN_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                   )}
                   {destination === 'Abidjan' && (
                    <div className="flex-1 space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Zone Arrivée (ABJ)</p>
                      <select className="w-full bg-orange-50/50 py-2.5 px-4 rounded-xl text-[10px] font-bold border border-orange-100" value={destinationCommune} onChange={e => setDestinationCommune(e.target.value)}>
                        <option value="">Toutes les gares</option>
                        {ABIDJAN_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                   )}
                </div>
              )}

              <div className="flex gap-3">
                 <div className="flex-1 space-y-1">
                    <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Date Aller</p>
                    <input type="date" className="w-full bg-slate-50 py-3.5 px-4 rounded-xl text-[10px] font-bold border border-slate-100" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                 </div>
                 <div className="flex-1 space-y-1">
                    <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Date Retour (Option)</p>
                    <input type="date" className="w-full bg-slate-50 py-3.5 px-4 rounded-xl text-[10px] font-bold border border-slate-100 opacity-40" />
                 </div>
              </div>

              <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Rechercher</button>
            </form>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end px-2">
               <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2"><History size={12} className="text-orange-500"/> Vos habitudes de voyage</h3>
               <div className="px-2 py-0.5 bg-green-50 rounded-full text-[6px] font-black text-green-600 uppercase border border-green-100">Prédiction IA</div>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
               {[
                 { from: 'Abidjan', to: 'Korhogo', price: '10 000' },
                 { from: 'Korhogo', to: 'Abidjan', price: '10 000' },
                 { from: 'Abidjan', to: 'Bouaké', price: '8 000' }
               ].map((pred, idx) => (
                 <button 
                    key={idx} 
                    onClick={() => { setOrigin(pred.from); setDestination(pred.to); }}
                    className="shrink-0 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all flex flex-col items-start gap-1 min-w-[140px]"
                 >
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700">
                      <span>{pred.from}</span> <ArrowRight size={10} className="text-orange-400"/> <span>{pred.to}</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Estimé: {pred.price} F</p>
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* ASSISTANT (AIDE) TAB */}
      {activeTab === AppTab.ASSISTANT && (
        <div className="flex flex-col h-full bg-slate-50 pb-24 relative overflow-hidden animate-in fade-in">
           <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <Sparkles size={20} />
                 </div>
                 <div>
                    <h2 className="text-sm font-black uppercase text-slate-900 leading-none mb-1">Assistant MSB</h2>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">En ligne</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {assistantMessages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm text-[11px] font-bold animate-in zoom-in-50 duration-300 ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                       {msg.text}
                    </div>
                 </div>
              ))}
              {isSending && (
                 <div className="flex justify-start animate-in fade-in">
                    <div className="bg-white p-4 rounded-[1.5rem] rounded-bl-none border border-slate-100 shadow-sm flex gap-1">
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
           </div>

           <div className="p-4 bg-white border-t border-slate-100 sticky bottom-[88px]">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-orange-500 transition-all">
                 <button onClick={startVoiceSession} className="p-3 bg-slate-200 text-slate-600 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors">
                    <Mic size={20} />
                 </button>
                 <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Posez votre question..." 
                    className="flex-1 bg-transparent text-[11px] font-bold text-slate-900 placeholder:text-slate-400 outline-none px-2"
                 />
                 <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 active:scale-95 disabled:opacity-50"
                 >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                 </button>
              </div>
           </div>

           {isVoiceActive && (
              <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-in fade-in">
                 <div className="absolute top-6 right-6">
                    <button onClick={stopVoiceSession} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={24}/></button>
                 </div>
                 <div className="relative mb-12">
                    <div className="absolute inset-0 bg-orange-500/30 rounded-full animate-ping duration-[2000ms]"></div>
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl relative z-10 animate-pulse">
                       <Mic size={48} className="text-white" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Je vous écoute...</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">Mode Conversation Live</p>
                 <button onClick={stopVoiceSession} className="bg-white text-slate-900 px-8 py-4 rounded-[2rem] font-black uppercase text-xs shadow-xl flex items-center gap-2">
                    <MicOff size={16}/> Arrêter
                 </button>
              </div>
           )}
        </div>
      )}

      {/* RECHERCHE & TUNNEL (LISTE DES DÉPARTS) */}
      {activeTab === AppTab.SEARCH && (
        <div className="p-6 space-y-6 animate-in slide-in-from-right pb-24">
           <div className="flex items-center gap-3">
              <button onClick={() => { setBookingStep('TRIP_SELECT'); setActiveTab(AppTab.HOME); }} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft size={18}/></button>
              <div className="flex flex-col">
                 <h2 className="text-[11px] font-black uppercase text-slate-900 leading-tight">
                    {origin} {originCommune ? `(${originCommune})` : ''}<br/>
                    <span className="text-orange-600 text-[9px]">➔ {destination} {destinationCommune ? `(${destinationCommune})` : ''}</span>
                 </h2>
              </div>
           </div>

           {bookingStep === 'TRIP_SELECT' && (
             <div className="space-y-4">
                <div className="flex justify-between p-2 bg-white rounded-2xl border border-slate-100 shadow-sm text-[9px] font-black uppercase">
                   <div className="px-4 py-2 text-slate-300">Précédent</div>
                   <div className="px-6 py-2 bg-orange-600 text-white rounded-xl shadow-lg">Aujourd'hui</div>
                   <div className="px-4 py-2 text-slate-300">Suivant</div>
                </div>

                {filteredTrips.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Aucun départ trouvé</p>
                  </div>
                ) : filteredTrips.map(t => {
                  const company = COMPANIES.find(c => c.id === t.companyId);
                  return (
                    <div key={t.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:border-orange-500 transition-all group relative overflow-hidden">
                       {t.availableSeats < 10 && (
                          <div className="absolute top-0 right-10 bg-red-600 text-white text-[7px] font-black px-3 py-1 rounded-b-xl uppercase z-10 animate-pulse">
                            Plus que {t.availableSeats} places !
                          </div>
                       )}
                       
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-12 h-12 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-1 group-hover:bg-orange-50 transition-colors">
                               <img src={company?.logo} className="w-full h-full object-contain" alt={company?.name} />
                             </div>
                             <div>
                                <p className="text-[11px] font-black uppercase text-slate-900 tracking-tighter">{company?.name}</p>
                                <div className="flex items-center gap-1 text-[7px] font-bold text-slate-400 uppercase">
                                   <MapPin size={8} className="text-orange-500"/>
                                   <span className="truncate max-w-[100px]">{t.origin}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-slate-900 leading-none">{t.price.toLocaleString()}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">CFA / Passager</p>
                          </div>
                       </div>

                       <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100/50 group-hover:bg-white group-hover:border-orange-100 transition-all">
                          <div className="text-center">
                             <p className="text-[14px] font-black text-slate-900">{t.departureTime}</p>
                             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">DÉPART</p>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center gap-1">
                             <div className="w-full h-[1px] bg-slate-200 relative">
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-slate-50 px-2 group-hover:bg-white text-[6px] font-black text-orange-500 uppercase tracking-widest">
                                   9h 00m
                                </div>
                             </div>
                             <ArrowRight size={14} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                          </div>

                          <div className="text-center">
                             <p className="text-[14px] font-black text-slate-900">{t.arrivalTime}</p>
                             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ARRIVÉE</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1 text-[8px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase border border-green-100">
                                <Wifi size={10}/> Wifi
                             </div>
                             <div className="flex items-center gap-1 text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase border border-blue-100">
                                <Utensils size={10}/> Snack
                             </div>
                          </div>
                          <button 
                            onClick={() => { setSelectedTrip(t); setBookingStep('SEAT_SELECT'); }} 
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-[9px] shadow-lg active:scale-95 transition-all group-hover:bg-orange-600"
                          >
                             Choisir
                          </button>
                       </div>
                    </div>
                  );
                })}
             </div>
           )}

           {bookingStep === 'SEAT_SELECT' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nomenclature Bus VIP (70 Places)</h3>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-white border border-slate-200 rounded-sm"></div><span className="text-[6px] font-black uppercase">Dispo</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div><span className="text-[6px] font-black uppercase">H</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-pink-500 rounded-sm"></div><span className="text-[6px] font-black uppercase">F</span></div>
                   </div>
                </div>

                <HorizontalBusInterior selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} />

                {Object.keys(selectedSeats).length > 0 && (
                   <button onClick={() => setBookingStep('PASSENGER_DETAILS')} className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Suivant ({Object.keys(selectedSeats).length} sièges)</button>
                )}
             </div>
           )}

           {bookingStep === 'PASSENGER_DETAILS' && (
             <div className="space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-900 px-2 flex items-center gap-3"><User size={18} className="text-orange-600" /> COORDONNÉES PASSAGER(S)</h3>
                {Object.keys(selectedSeats).map(seat => (
                  <div key={seat} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-sm">
                     <p className="text-[9px] font-black text-orange-600 uppercase">COORDONNÉES SIÈGE {seat}</p>
                     <input type="text" placeholder="Nom et prénoms" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" />
                     <input type="tel" placeholder="Numéro de téléphone" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" />
                  </div>
                ))}
                <button onClick={() => setBookingStep('PAYMENT')} className="w-full bg-orange-600 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs shadow-lg">Passer au paiement</button>
             </div>
           )}

           {bookingStep === 'PAYMENT' && (
             <div className="space-y-6">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl text-center relative overflow-hidden">
                   <p className="text-[10px] font-black uppercase opacity-60 mb-2">Total à payer</p>
                   <h2 className="text-4xl font-black tabular-nums">{(Object.keys(selectedSeats).length * (selectedTrip?.price || 0)).toLocaleString()} <small className="text-xs font-bold text-orange-500">CFA</small></h2>
                </div>
                
                <h4 className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest text-center">Choisir le mode de paiement</h4>
                <div className="grid grid-cols-3 gap-3">
                   {['WAVE', 'ORANGE', 'MTN', 'MOOV', 'DJAMO', 'VISA', 'MASTERCARD'].map(p => (
                     <button key={p} className="h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center font-black text-[8px] hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm active:scale-95 uppercase">{p}</button>
                   ))}
                </div>

                <button onClick={() => { setIsBiometricVerifying(true); setTimeout(() => { setIsBiometricVerifying(false); finalizeBooking(); }, 3000); }} className="w-full bg-orange-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                  <Fingerprint size={28}/> VALIDER PAR BIOMÉTRIE
                </button>

                {isBiometricVerifying && (
                  <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center animate-in fade-in">
                    <Fingerprint size={120} className="text-orange-500 relative z-10 animate-pulse mb-6"/>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Vérification Sécurisée...</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Cryptographie dynamique en cours</p>
                  </div>
                )}
             </div>
           )}

           {bookingStep === 'CONFIRMATION' && (
             <div className="text-center py-10 space-y-8 animate-in zoom-in h-full flex flex-col items-center justify-center">
                <CheckCircle2 size={100} className="text-green-500" />
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Billet MSB<br/>Signé !</h2>
                <button onClick={() => { setActiveTab(AppTab.TICKETS); setBookingStep('TRIP_SELECT'); setSelectedSeats({}); }} className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs shadow-2xl active:scale-95">VOIR MES BILLETS</button>
             </div>
           )}
        </div>
      )}

      {/* TICKETS TAB */}
      {activeTab === AppTab.TICKETS && (
        <div className="p-6 space-y-6 pb-24 animate-in fade-in">
           <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><TicketIcon className="text-orange-600" size={24} /> Mes Titres Sécurisés</h2>
           {myTickets.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[3.5rem] border border-dashed border-slate-200">
               <TicketIcon size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-[10px] font-black uppercase text-slate-400">Vous n'avez pas encore de billets</p>
             </div>
           ) : myTickets.map(t => (
             <div key={t.id} className={`bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border ${t.status === 'CANCELLED' ? 'border-red-100 opacity-70' : 'border-slate-100'} group mb-8`}>
                <div className={`p-8 border-b-2 border-dashed ${t.status === 'CANCELLED' ? 'border-red-100 bg-red-50/20' : 'border-slate-100 bg-slate-50/20'} relative`}>
                   <div className="flex justify-between items-start mb-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">REF: {t.id}</p>
                      {t.status === 'CANCELLED' ? (
                        <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5"><X size={12}/> Annulé</div>
                      ) : (
                        <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5"><ShieldCheck size={12}/> Certifié</div>
                      )}
                   </div>
                   <div className="space-y-4">
                      <p className="font-black text-[12px] uppercase text-slate-800">{t.passengerName}</p>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                         <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Itinéraire</p><p className="font-black text-[9px] uppercase">{t.originStation} ➔ {t.destinationStation}</p></div>
                         <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Siège/Genre</p><p className="font-black text-[10px] uppercase text-orange-600">{t.seatNumber} ({t.gender === 'MALE' ? 'H' : 'F'})</p></div>
                      </div>
                   </div>
                </div>
                <div className="p-8 flex flex-col items-center">
                   <img src={t.qrCode} className={`w-36 h-36 ${t.status === 'CANCELLED' && 'grayscale opacity-20'}`} alt="QR Cryptographique" />
                </div>
                {t.status !== 'CANCELLED' && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button onClick={() => setTicketAction({type: 'MODIFY', ticketId: t.id})} className="flex-1 py-3 rounded-2xl border border-slate-200 text-[9px] font-black uppercase text-slate-500 flex items-center justify-center gap-2"><Settings size={12}/> Modifier</button>
                        <button onClick={() => setTicketAction({type: 'CANCEL', ticketId: t.id})} className="flex-1 py-3 rounded-2xl border border-red-100 bg-red-50 text-[9px] font-black uppercase text-red-500 flex items-center justify-center gap-2"><Trash2 size={12}/> Annuler</button>
                    </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* DASHBOARD PARTENAIRES (COMPAGNIE & PRESTATAIRE) */}
      {activeTab === AppTab.PARTNER_DASHBOARD && (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom pb-24">
           <div className="bg-slate-900 text-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Tableau de Bord</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Espace {user?.role === 'COMPANY_ADMIN' ? 'Compagnie' : 'Prestataire'}</p>
                  </div>
                  <div className="relative">
                      <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all relative">
                          <Bell size={20} className={notifications.some(n => !n.read) ? "animate-bounce-slow text-orange-400" : "text-slate-400"} />
                      </button>
                  </div>
              </div>
              <div className="flex gap-2 mt-8 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar-dark pb-2">
                {(['GESTION', user?.role === 'COMPANY_ADMIN' ? 'VOYAGES' : null, user?.role === 'SERVICE_PARTNER' ? 'OFFRES' : null, user?.role === 'COMPANY_ADMIN' ? 'BILLETS' : 'RESERVATIONS', 'AIDE'].filter(Boolean) as any[]).map(tab => (
                  <button key={tab} onClick={() => { setActiveSubTab(tab); setManagingTrip(null); setIsAddingTrip(false); setIsAddingService(false); }} className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === tab ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400'}`}>{tab}</button>
                ))}
              </div>
           </div>

           {activeSubTab === 'VOYAGES' && (
             <div className="space-y-6 animate-in fade-in">
                {!isAddingTrip && !managingTrip && (
                  <>
                     <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-black uppercase text-slate-900">Départs Programmés</h3>
                        <button onClick={() => setIsAddingTrip(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg"><PlusCircle size={14}/> Nouveau</button>
                     </div>
                     <div className="space-y-4">
                        {companyTrips.map(trip => (
                           <div key={trip.id} onClick={() => openTripManagement(trip)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-orange-500 transition-all cursor-pointer group relative overflow-hidden">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[7px] font-black uppercase">Actif</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase text-slate-900">{trip.origin} ➔ {trip.destination}</h4>
                                 </div>
                                 <p className="text-lg font-black text-orange-600">{trip.price.toLocaleString()} F</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Clock size={12}/> {trip.departureTime}</div>
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Clock size={12}/> {trip.arrivalTime}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
                )}

                {isAddingTrip && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                     <div className="flex items-center gap-3 px-2">
                        <button onClick={() => setIsAddingTrip(false)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronLeft size={18}/></button>
                        <h3 className="text-xs font-black uppercase text-slate-900">Programmer un départ</h3>
                     </div>
                     <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Départ</label>
                              <select className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.origin} onChange={e => setNewTripData({...newTripData, origin: e.target.value})}>
                                {IVORIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Arrivée</label>
                              <select className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.destination} onChange={e => setNewTripData({...newTripData, destination: e.target.value})}>
                                {IVORIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <input type="time" className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.departureTime} onChange={e => setNewTripData({...newTripData, departureTime: e.target.value})} />
                           <input type="time" className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.arrivalTime} onChange={e => setNewTripData({...newTripData, arrivalTime: e.target.value})} />
                        </div>
                        <input type="number" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" value={newTripData.price} onChange={e => setNewTripData({...newTripData, price: parseInt(e.target.value)})} placeholder="Prix du ticket" />
                        <button onClick={handleCreateTrip} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg mt-4"><Save size={16}/> Enregistrer</button>
                     </div>
                  </div>
                )}
             </div>
           )}

           <div className="mt-8 pt-8 border-t border-slate-200">
             <button onClick={() => setIsAuthenticated(false)} className="w-full bg-red-50 text-red-500 py-4 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3">
               <LogOut size={16} /> Déconnexion
             </button>
           </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {activeTab === AppTab.ADMIN_DASHBOARD && user?.role === 'GLOBAL_ADMIN' && (
        <div className="p-6 pb-24 space-y-6 animate-in fade-in">
           <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Administration</h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Système Opérationnel</p>
                </div>
              </div>
           </div>

           <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <button onClick={() => setActiveAdminTab('OVERVIEW')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeAdminTab === 'OVERVIEW' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Vue d'Ensemble</button>
              <button onClick={() => setActiveAdminTab('ACCOUNTS')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeAdminTab === 'ACCOUNTS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Validation</button>
              <button onClick={() => setActiveAdminTab('FINANCE')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeAdminTab === 'FINANCE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Finances</button>
           </div>

           {activeAdminTab === 'OVERVIEW' && (
             <div className="space-y-6 animate-in slide-in-from-right">
                <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center">
                   <div>
                      <p className="text-3xl font-black">1,458</p>
                      <p className="text-[8px] font-bold opacity-80 uppercase tracking-wider">Voyageurs Actifs</p>
                   </div>
                   <User size={40} className="opacity-20" />
                </div>
                <div className="bg-orange-600 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center">
                   <div>
                      <p className="text-3xl font-black">42</p>
                      <p className="text-[8px] font-bold opacity-80 uppercase tracking-wider">Départs programmés</p>
                   </div>
                   <Truck size={40} className="opacity-20" />
                </div>
             </div>
           )}

           <div className="mt-8 pt-8 border-t border-slate-200">
             <button onClick={() => setIsAuthenticated(false)} className="w-full bg-red-50 text-red-500 py-4 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3">
               <LogOut size={16} /> Déconnexion Admin
             </button>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
