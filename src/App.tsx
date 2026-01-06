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

  // 14 columns
  const cols = Array.from({ length: 14 }, (_, i) => i);
  // Rows: 0,1,2 (Top), 3 (Aisle), 4,5 (Bottom)
  const rows = [0, 1, 2, 3, 4, 5]; 

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] border-4 border-slate-800 shadow-inner overflow-x-auto custom-scrollbar-dark relative">
      <div className="min-w-max flex gap-4 items-stretch pl-2">
        
        {/* Front Section: Door (Left of Seat 1) & Driver (Left of Seat 4,5) */}
        <div className="flex flex-col justify-between items-center py-1">
            <BusDoor />
            <div className="flex-1"></div>
            <SteeringWheel />
        </div>

        {cols.map((colIdx) => {
           // Insert Middle Door before Col 5 (Starts with Seat 26)
           // It sits between Col 4 (Ends with Seat 25) and Col 5
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
                          
                          {/* Selector Popup */}
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
  
  // Auth Data State
  const [authData, setAuthData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Mock Database of Users
  const [mockUsers, setMockUsers] = useState<UserProfile[]>([
    { id: 'u_default', firstName: 'Jean-Marc', lastName: 'Koffi', phone: '0707070707', role: 'USER', joinDate: '01/01/2024' },
    { id: 'u_admin', firstName: 'Admin', lastName: 'Principal', phone: '0101010101', role: 'GLOBAL_ADMIN', joinDate: '01/01/2024' }
  ]);
  
  // States Booking
  const [bookingStep, setBookingStep] = useState<BookingStep>('TRIP_SELECT');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<string, Gender>>({});
  const [origin, setOrigin] = useState('Abidjan');
  const [originCommune, setOriginCommune] = useState('');
  const [destination, setDestination] = useState('Yamoussoukro');
  const [destinationCommune, setDestinationCommune] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);

  // States Services
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('RENTAL');

  // States Prestataire/Compagnie
  const [activeSubTab, setActiveSubTab] = useState<'GESTION' | 'BILLETS' | 'AIDE' | 'RESERVATIONS' | 'VOYAGES' | 'OFFRES'>('GESTION');
  const [companyTrips, setCompanyTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [managingTrip, setManagingTrip] = useState<Trip | null>(null);
  const [managedSeats, setManagedSeats] = useState<Record<string, Gender>>({});
  const [newTripData, setNewTripData] = useState({
    origin: 'Abidjan',
    originCommune: '',
    destination: 'Bouaké',
    destinationCommune: '',
    departureTime: '08:00',
    arrivalTime: '13:00',
    price: 8000
  });

  // States Prestataire (Services/Produits)
  const [partnerServices, setPartnerServices] = useState<any[]>([
    { id: 1, name: "Suite Royale", type: 'ACCOMMODATION', price: 45000, desc: "Vue sur la lagune, petit déj inclus", images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"] },
    { id: 2, name: "Toyota Prado", type: 'RENTAL', price: 75000, desc: "Location journalière avec chauffeur", images: ["https://images.unsplash.com/photo-1594502184342-2e12f877aa73"] }
  ]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', type: 'RENTAL', price: 0, desc: '', images: [] as string[] });
  
  // States Notifications (Provider & Admin)
  const [notifications, setNotifications] = useState<{id: number, text: string, time: string, read: boolean}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // States Ticket Actions
  const [ticketAction, setTicketAction] = useState<{ type: 'CANCEL' | 'MODIFY', ticketId: string } | null>(null);

  // States ADMIN Dashboard
  const [activeAdminTab, setActiveAdminTab] = useState<'OVERVIEW' | 'ACCOUNTS' | 'FINANCE'>('OVERVIEW');
  const [pendingAccounts, setPendingAccounts] = useState([
    { id: '101', name: 'Transport Ivoirien Rapide', type: 'COMPANY_ADMIN', date: '10:30', status: 'PENDING' },
    { id: '102', name: 'Résidence Les Palmiers', type: 'SERVICE_PARTNER', date: '11:15', status: 'PENDING' },
    { id: '103', name: 'Location Express', type: 'SERVICE_PARTNER', date: '14:00', status: 'PENDING' }
  ]);

  // States Voice & Text Assistant
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: "BONJOUR ! COMMENT PUIS-JE VOUS AIDER DANS VOTRE VOYAGE AUJOURD'HUI ?" }
  ]);

  // States Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    email: 'utilisateur@msb.ci',
    language: 'Français',
    notifications: true,
    biometric: true
  });
  
  // Refs for Audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SIMULATION: Notification automatique
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

  // Scroll to bottom on new message
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
      
      // Output Context
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_OUTPUT_RATE });
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // Input Context
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
             // Audio Output
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
    
    // Close Audio Contexts
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    // Close Gemini Session (Using close() if available in SDK, otherwise just removing refs)
    // The current SDK pattern relies on simply stopping the input stream primarily.
    liveSessionRef.current = null;
  };

  const toggleVoice = () => {
    if (isVoiceActive) stopVoiceSession();
    else startVoiceSession();
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'REGISTER') {
        if (!acceptedLegal) {
          alert("Veuillez accepter les conditions.");
          return;
        }
        
        // CHECK UNIQUE PHONE
        const existingUser = mockUsers.find(u => u.phone === authData.phone);
        if (existingUser) {
            alert("Ce numéro est déjà associé à un compte. Veuillez vous connecter.");
            setAuthMode('LOGIN');
            return;
        }

        // Create new user with parsed name
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
        // LOGIN MODE: Unicity check = User must exist
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
      companyId: 'utb', // Mock company ID
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
    // Simulation: Add notification for admin about action
    const text = action === 'VALIDATE' ? 'Compte validé avec succès' : 'Compte rejeté';
    setNotifications(prev => [{id: Date.now(), text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), read: false}, ...prev]);
  };

  const handleTicketActionConfirm = () => {
    if (!ticketAction) return;

    if (ticketAction.type === 'CANCEL') {
        setMyTickets(prev => prev.map(t => t.id === ticketAction.ticketId ? { ...t, status: 'CANCELLED' } : t));
    } else {
        // Modification: For demo purposes, we just simulate the intent by redirecting to search
        // In a real app, we might cancel the current one and pre-fill search with previous details
        setActiveTab(AppTab.HOME);
        setBookingStep('TRIP_SELECT');
    }
    setTicketAction(null);
  };

  const openTripManagement = (trip: Trip) => {
    setManagingTrip(trip);
    // Simulate some random occupied seats for visualization
    const mockSeats: Record<string, Gender> = {};
    const occupiedCount = Math.floor(Math.random() * 40); // Random occupancy
    for (let i = 0; i < occupiedCount; i++) {
        const seatNum = Math.floor(Math.random() * 70) + 1;
        mockSeats[seatNum.toString()] = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
    }
    setManagedSeats(mockSeats);
  };

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
                  // Optional: Clear sensitive data but keep phone for convenience if switching modes
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

      {/* POLICY MODAL */}
      {showPolicy && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in duration-300">
             {/* Blue-violet Header */}
             <div className="bg-indigo-600 p-6 text-center shadow-lg relative z-10">
                <ShieldCheck className="text-white/20 absolute top-4 right-4" size={40} />
                <h3 className="text-white font-black uppercase text-xs tracking-widest leading-relaxed relative z-20">CHARTE DE<br/>CONFIDENTIALITÉ</h3>
             </div>
             
             {/* Content */}
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
               <div>
                 <span className="text-slate-900 uppercase font-black block mb-1">Vos droits :</span> Vous disposez d'un droit d'accès et de rectification de vos données à tout moment via votre profil.
               </div>
             </div>

             {/* Orange Button */}
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
      
      {/* VOYAGEUR HOME */}
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
              {/* Recherche Linéaire */}
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

              {/* Communes Proportionnelles */}
              {(origin === 'Abidjan' || destination === 'Abidjan') && (
                <div className="flex gap-3 animate-in fade-in">
                   {origin === 'Abidjan' && (
                    <div className="flex-1 space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Zone Départ (ABJ)</p>
                      <select className="w-full bg-orange-50/50 py-2.5 px-4 rounded-xl text-[10px] font-bold border border-orange-100" value={originCommune} onChange={e => setOriginCommune(e.target.value)}>
                        {ABIDJAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                   )}
                   {destination === 'Abidjan' && (
                    <div className="flex-1 space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Zone Arrivée (ABJ)</p>
                      <select className="w-full bg-orange-50/50 py-2.5 px-4 rounded-xl text-[10px] font-bold border border-orange-100" value={destinationCommune} onChange={e => setDestinationCommune(e.target.value)}>
                        {ABIDJAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
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

          {/* PREDICTIONS HABITUDES */}
          <div className="space-y-4">
             <div className="flex justify-between items-end px-2">
               <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2"><History size={12} className="text-orange-500"/> Vos habitudes de voyage</h3>
               <div className="px-2 py-0.5 bg-green-50 rounded-full text-[6px] font-black text-green-600 uppercase border border-green-100">Prédiction IA</div>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
               {[
                 { from: 'Abidjan', to: 'Bouaké', price: '8 000' },
                 { from: 'Korhogo', to: 'Abidjan', price: '10 000' },
                 { from: 'Abidjan', to: 'Yamoussoukro', price: '5 000' }
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

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest px-2">Nos services populaires</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {[
                { img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957', label: 'Bus VIP' },
                { img: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73', label: 'Voitures' },
                { img: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e', label: 'Hôtels' },
                { img: 'https://images.unsplash.com/photo-1551218808-94e220e084d2', label: 'Restaurants' }
              ].map((s, i) => (
                <div key={i} className="shrink-0 w-32 space-y-2 group cursor-pointer" onClick={() => setActiveTab(AppTab.SERVICES)}>
                   <div className="h-24 bg-slate-200 rounded-3xl overflow-hidden shadow-sm group-hover:scale-105 transition-all">
                      <img src={s.img} className="w-full h-full object-cover" />
                   </div>
                   <p className="text-[8px] font-black uppercase text-slate-500 text-center">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ASSISTANT (AIDE) TAB - ACTIVÉ */}
      {activeTab === AppTab.ASSISTANT && (
        <div className="flex flex-col h-full bg-slate-50 pb-24 relative overflow-hidden animate-in fade-in">
           {/* Header Assistant */}
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

           {/* Chat Messages */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {assistantMessages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm text-[11px] leading-relaxed font-bold animate-in zoom-in-50 duration-300 ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
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

           {/* Input Zone */}
           <div className="p-4 bg-white border-t border-slate-100 sticky bottom-[88px]">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                 <button onClick={startVoiceSession} className="p-3 bg-slate-200 text-slate-600 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors active:scale-95">
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
                    className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                 </button>
              </div>
           </div>

           {/* Voice Overlay (Gemini Live) */}
           {isVoiceActive && (
              <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                 <div className="absolute top-6 right-6">
                    <button onClick={stopVoiceSession} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={24}/></button>
                 </div>
                 
                 <div className="relative mb-12">
                    <div className="absolute inset-0 bg-orange-500/30 rounded-full animate-ping duration-[2000ms]"></div>
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping delay-150 duration-[2000ms]"></div>
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.5)] relative z-10 animate-pulse">
                       <Mic size={48} className="text-white" />
                    </div>
                 </div>
                 
                 <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Je vous écoute...</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">Mode Conversation Live</p>
                 
                 <button onClick={stopVoiceSession} className="bg-white text-slate-900 px-8 py-4 rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2">
                    <MicOff size={16}/> Arrêter
                 </button>
              </div>
           )}
        </div>
      )}

      {/* SERVICES TAB - NOUVEAU */}
      {activeTab === AppTab.SERVICES && (
        <div className="p-6 space-y-6 pb-24 animate-in slide-in-from-right">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Services &<br/>Partenaires</h2>
              <div className="bg-orange-600 text-white p-2 rounded-xl shadow-lg"><Briefcase size={24}/></div>
           </div>

           {/* Services Navigation */}
           <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button 
                onClick={() => setServiceCategory('RENTAL')} 
                className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] border font-black text-[9px] uppercase whitespace-nowrap transition-all ${serviceCategory === 'RENTAL' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                <Car size={14}/> Location
              </button>
              <button 
                onClick={() => setServiceCategory('ACCOMMODATION')} 
                className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] border font-black text-[9px] uppercase whitespace-nowrap transition-all ${serviceCategory === 'ACCOMMODATION' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                <Bed size={14}/> Hébergement
              </button>
              <button 
                onClick={() => setServiceCategory('DINING')} 
                className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] border font-black text-[9px] uppercase whitespace-nowrap transition-all ${serviceCategory === 'DINING' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                <Utensils size={14}/> Gastronomie
              </button>
           </div>

           {/* Content Sections */}
           <div className="space-y-6">
              
              {/* RENTAL SECTION */}
              {serviceCategory === 'RENTAL' && (
                <div className="space-y-4 animate-in fade-in">
                   <div className="flex justify-between items-center px-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Véhicules Disponibles</p>
                      <button className="text-[9px] font-black text-orange-600 uppercase">Tout voir</button>
                   </div>
                   {MOCK_VEHICLES.map(vehicle => (
                     <div key={vehicle.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group">
                        <div className="h-40 relative">
                           <img src={vehicle.image} className="w-full h-full object-cover" />
                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-slate-900 flex items-center gap-1">
                              <User size={10}/> {vehicle.capacity} places
                           </div>
                           <div className="absolute bottom-4 left-4">
                              <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1 inline-block">{vehicle.type}</div>
                              <h3 className="text-white font-black text-lg drop-shadow-md">{vehicle.model}</h3>
                           </div>
                        </div>
                        <div className="p-5 flex justify-between items-center">
                           <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Tarif journalier</p>
                              <p className="text-lg font-black text-orange-600">{vehicle.pricePerDay.toLocaleString()} F</p>
                           </div>
                           <button className="bg-slate-900 text-white p-3 rounded-2xl active:scale-95 transition-all"><ArrowRight size={20}/></button>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* ACCOMMODATION SECTION */}
              {serviceCategory === 'ACCOMMODATION' && (
                <div className="space-y-4 animate-in fade-in">
                   <div className="flex justify-between items-center px-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Hôtels & Résidences</p>
                   </div>
                   {[
                     { name: 'Hôtel Président', type: 'HÔTEL 5*', location: 'Yamoussoukro', price: '45.000', rating: 4.8, img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' },
                     { name: 'Résidence Cocody', type: 'APPART MEUBLÉ', location: 'Abidjan', price: '30.000', rating: 4.5, img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
                     { name: 'Villa Assinie', type: 'VILLA PRIVÉE', location: 'Assinie', price: '150.000', rating: 4.9, img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80' }
                   ].map((item, i) => (
                      <div key={i} className="bg-white p-4 rounded-[2.5rem] border border-slate-100 flex gap-4 items-center shadow-sm">
                         <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0">
                            <img src={item.img} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                               <p className="text-[7px] font-black text-orange-600 uppercase tracking-wider">{item.type}</p>
                               <div className="flex items-center gap-1 text-[8px] font-black"><Star size={10} className="text-yellow-400 fill-yellow-400"/> {item.rating}</div>
                            </div>
                            <h3 className="font-black text-slate-900 text-sm leading-tight">{item.name}</h3>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase"><MapPin size={10}/> {item.location}</div>
                            <p className="text-[12px] font-black text-slate-900 pt-1">{item.price} F <span className="text-[8px] text-slate-400 font-normal">/ nuit</span></p>
                         </div>
                      </div>
                   ))}
                </div>
              )}

              {/* DINING SECTION */}
              {serviceCategory === 'DINING' && (
                <div className="space-y-4 animate-in fade-in">
                   <div className="flex justify-between items-center px-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Meilleures Tables</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: 'Chez Georges', cuisine: 'Africaine', rating: 4.7, img: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80' },
                        { name: 'La Langouste', cuisine: 'Fruits de mer', rating: 4.9, img: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=400&q=80' },
                        { name: 'Pasta & Pizza', cuisine: 'Italienne', rating: 4.5, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
                        { name: 'Burger House', cuisine: 'Fast Food', rating: 4.2, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' }
                      ].map((resto, i) => (
                         <div key={i} className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
                            <div className="h-24 rounded-[1.5rem] overflow-hidden relative">
                               <img src={resto.img} className="w-full h-full object-cover" />
                               <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[7px] font-black flex items-center gap-1">
                                  <Star size={8} className="text-yellow-400 fill-yellow-400"/> {resto.rating}
                               </div>
                            </div>
                            <div className="px-1">
                               <h3 className="font-black text-[10px] text-slate-900 uppercase truncate">{resto.name}</h3>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">{resto.cuisine}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* RECHERCHE & TUNNEL */}
      {activeTab === AppTab.SEARCH && (
        <div className="p-6 space-y-6 animate-in slide-in-from-right pb-24">
           <div className="flex items-center gap-3">
              <button onClick={() => { setBookingStep('TRIP_SELECT'); setActiveTab(AppTab.HOME); }} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft size={18}/></button>
              <h2 className="text-sm font-black uppercase text-slate-900">{origin} ➔ {destination}</h2>
           </div>

           {bookingStep === 'TRIP_SELECT' && (
             <div className="space-y-6">
                <div className="flex justify-between p-2 bg-white rounded-2xl border border-slate-100 shadow-sm text-[9px] font-black uppercase overflow-hidden">
                   <div className="px-4 py-2 text-slate-300">{(new Date(new Date(departureDate).getTime() - 86400000)).toLocaleDateString()}</div>
                   <div className="px-6 py-2 bg-orange-600 text-white rounded-xl shadow-lg">{(new Date(departureDate)).toLocaleDateString()}</div>
                   <div className="px-4 py-2 text-slate-300">{(new Date(new Date(departureDate).getTime() + 86400000)).toLocaleDateString()}</div>
                </div>

                {MOCK_TRIPS.filter(t => t.origin === origin && t.destination === destination).map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-4 hover:border-orange-500 transition-all">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-[14px]">
                             {COMPANIES.find(c => c.id === t.companyId)?.name[0]}
                           </div>
                           <p className="text-[11px] font-black uppercase text-slate-900">{COMPANIES.find(c => c.id === t.companyId)?.name}</p>
                        </div>
                        <p className="text-lg font-black text-orange-600">{t.price.toLocaleString()} CFA</p>
                     </div>
                     <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-center"><p className="text-[12px] font-black text-slate-900">{t.departureTime}</p><p className="text-[7px] font-bold text-slate-400 uppercase">Départ</p></div>
                        <ArrowRight size={18} className="text-slate-200" />
                        <div className="text-center"><p className="text-[12px] font-black text-slate-900">{t.arrivalTime}</p><p className="text-[7px] font-bold text-slate-400 uppercase">Arrivée</p></div>
                     </div>
                     <button onClick={() => { setSelectedTrip(t); setBookingStep('SEAT_SELECT'); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all">Réserver</button>
                  </div>
                ))}
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
                     <input type="text" placeholder="N° de la pièce d'identité (facultatif)" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" />
                  </div>
                ))}
                <button onClick={() => setBookingStep('PAYMENT')} className="w-full bg-orange-600 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs shadow-lg">Passer au paiement</button>
             </div>
           )}

           {bookingStep === 'PAYMENT' && (
             <div className="space-y-6">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5"><Wallet size={120} /></div>
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
                    <div className="relative mb-12">
                      <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                      <Fingerprint size={120} className="text-orange-500 relative z-10 animate-pulse"/>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Vérification Sécurisée...</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Cryptographie dynamique en cours</p>
                  </div>
                )}
             </div>
           )}

           {bookingStep === 'CONFIRMATION' && (
             <div className="text-center py-10 space-y-8 animate-in zoom-in h-full flex flex-col items-center justify-center">
                <div className="w-40 h-40 bg-green-50 rounded-full flex items-center justify-center relative shadow-xl">
                   <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-10"></div>
                   <CheckCircle2 size={100} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Billet MSB<br/>Signé !</h2>
                <p className="text-[11px] text-slate-500 font-bold px-12 uppercase leading-relaxed tracking-wide">Votre transaction est validée. Vos billets cryptés sont prêts.</p>
                <button onClick={() => { setActiveTab(AppTab.TICKETS); setBookingStep('TRIP_SELECT'); setSelectedSeats({}); }} className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs shadow-2xl active:scale-95">VOIR MES BILLETS</button>
             </div>
           )}
        </div>
      )}

      {/* TICKETS TAB - VUE BILLETS AVEC QR DYNAMIQUE */}
      {activeTab === AppTab.TICKETS && (
        <div className="p-6 space-y-6 pb-24 animate-in fade-in">
           <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><TicketIcon className="text-orange-600" size={24} /> Mes Titres Sécurisés</h2>
           {myTickets.map(t => (
             <div key={t.id} className={`bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border ${t.status === 'CANCELLED' ? 'border-red-100 opacity-70' : 'border-slate-100'} group mb-8`}>
                <div className={`p-8 border-b-2 border-dashed ${t.status === 'CANCELLED' ? 'border-red-100 bg-red-50/20' : 'border-slate-100 bg-slate-50/20'} relative`}>
                   <div className="absolute -left-4 bottom-0 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border border-slate-100" />
                   <div className="absolute -right-4 bottom-0 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border border-slate-100" />
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
                   <p className="text-[7px] font-black uppercase mt-6 text-slate-400 tracking-[0.3em]">MSB-DYNAMIC-CRYPT-V1</p>
                </div>
                
                {/* ACTION BUTTONS */}
                {t.status !== 'CANCELLED' && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button onClick={() => setTicketAction({type: 'MODIFY', ticketId: t.id})} className="flex-1 py-3 rounded-2xl border border-slate-200 text-[9px] font-black uppercase text-slate-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-all flex items-center justify-center gap-2"><Settings size={12}/> Modifier</button>
                        <button onClick={() => setTicketAction({type: 'CANCEL', ticketId: t.id})} className="flex-1 py-3 rounded-2xl border border-red-100 bg-red-50 text-[9px] font-black uppercase text-red-500 hover:bg-red-100 transition-all flex items-center justify-center gap-2"><Trash2 size={12}/> Annuler</button>
                    </div>
                )}
             </div>
           ))}

           {/* CONFIRMATION MODAL */}
            {ticketAction && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl space-y-5 animate-in zoom-in border border-slate-100">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${ticketAction.type === 'CANCEL' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                        {ticketAction.type === 'CANCEL' ? <Trash2 size={32} /> : <Settings size={32} />}
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="font-black uppercase text-lg text-slate-900">
                            {ticketAction.type === 'CANCEL' ? 'Annuler ce billet ?' : 'Modifier le trajet ?'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Action irréversible</p>
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                        <div className="flex gap-3">
                            <AlertCircle size={24} className="text-orange-500 shrink-0" />
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase">Politique de délai 5H</p>
                                <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                                    Conformément aux CGV, toute modification ou annulation doit être effectuée <span className="text-orange-600 underline decoration-2">5 heures avant le départ</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setTicketAction(null)} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-4 rounded-3xl font-black uppercase text-[10px] hover:bg-slate-50 transition-all">Retour</button>
                        <button 
                            onClick={handleTicketActionConfirm} 
                            className={`flex-1 text-white py-4 rounded-3xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all ${ticketAction.type === 'CANCEL' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {ticketAction.type === 'CANCEL' ? 'Confirmer Annulation' : 'Procéder'}
                        </button>
                    </div>
                </div>
                </div>
            )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === AppTab.PROFILE && (
        <div className="p-6 space-y-8 animate-in slide-in-from-right pb-24">
           {/* Header Profile */}
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Mon Profil</h2>
              <button onClick={() => setIsEditingProfile(!isEditingProfile)} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${isEditingProfile ? 'bg-slate-900 text-white border-slate-900' : 'text-orange-600 bg-orange-50 border-orange-100'}`}>
                  {isEditingProfile ? 'Terminé' : 'Modifier'}
              </button>
           </div>

           {/* Identity Card */}
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-orange-600/10"></div>
              <div className="w-28 h-28 bg-slate-900 rounded-full mb-4 border-[6px] border-white shadow-2xl relative z-10 flex items-center justify-center text-white text-3xl font-black">
                   {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight relative z-10">{user?.firstName} {user?.lastName}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">{user?.phone}</p>
              
              <div className="flex gap-4 relative z-10 w-full justify-center">
                  <div className="bg-green-50 text-green-600 px-4 py-2 rounded-2xl text-[8px] font-black uppercase flex items-center gap-2 border border-green-100"><ShieldCheck size={12}/> Vérifié</div>
                  <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-[8px] font-black uppercase flex items-center gap-2 border border-blue-100"><Star size={12}/> 4.9/5</div>
              </div>
           </div>

           {/* Details Section */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Informations Personnelles</h4>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
                  <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-2">Email</label>
                      <input 
                          type="email" 
                          disabled={!isEditingProfile}
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="w-full bg-slate-50 py-3.5 px-6 rounded-2xl text-[10px] font-bold border border-slate-100 disabled:opacity-50 disabled:bg-slate-50/50 transition-all focus:border-orange-500"
                      />
                  </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-2">Langue</label>
                      <select 
                          disabled={!isEditingProfile}
                          value={profileData.language}
                          onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                          className="w-full bg-slate-50 py-3.5 px-6 rounded-2xl text-[10px] font-bold border border-slate-100 disabled:opacity-50 transition-all focus:border-orange-500"
                      >
                          <option>Français</option>
                          <option>English</option>
                          <option>Baoulé</option>
                          <option>Dioula</option>
                      </select>
                  </div>
              </div>
           </div>

           {/* Security & Settings */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Sécurité & Préférences</h4>
              <div className="bg-white p-3 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between p-4 border-b border-slate-50">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Bell size={18}/></div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-800">Notifications</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Alertes voyages</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={profileData.notifications} onChange={() => setProfileData(p => ({...p, notifications: !p.notifications}))} className="sr-only peer" />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                  </div>
                  <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Fingerprint size={18}/></div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-slate-800">Face ID / Touch ID</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Connexion rapide</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={profileData.biometric} onChange={() => setProfileData(p => ({...p, biometric: !p.biometric}))} className="sr-only peer" />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                      </label>
                  </div>
              </div>
           </div>

           {/* Logout Button - Distinctly requested */}
           <button 
              onClick={() => { setIsAuthenticated(false); setBookingStep('TRIP_SELECT'); }}
              className="w-full bg-red-500 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-red-200 active:scale-95 transition-all mt-8"
           >
              <LogOut size={20} /> Déconnexion
           </button>
           
           <div className="text-center pt-4 opacity-30">
               <ShieldCheck size={24} className="mx-auto mb-2 text-slate-900"/>
               <p className="text-[8px] font-black text-slate-900 uppercase tracking-[0.3em]">MON BILLET SECURISE<br/>v2.4.0 (2025)</p>
           </div>
        </div>
      )}

      {/* DASHBOARD PARTENAIRES (Compagnie & Prestataire) */}
      {activeTab === AppTab.PARTNER_DASHBOARD && (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom pb-24">
           {/* Header Dashboard avec Notification Bell */}
           <div className="bg-slate-900 text-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Tableau de Bord</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Espace {user?.role === 'COMPANY_ADMIN' ? 'Compagnie' : 'Prestataire'}</p>
                  </div>
                  <div className="relative">
                      <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all relative">
                          <Bell size={20} className={notifications.some(n => !n.read) ? "animate-bounce-slow text-orange-400" : "text-slate-400"} />
                          {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>}
                      </button>
                      
                      {/* Dropdown Notifications */}
                      {showNotifications && (
                          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 z-20 animate-in zoom-in border border-slate-100">
                              <div className="p-3 bg-slate-50 border-b border-slate-100"><p className="text-[9px] font-black uppercase text-slate-500">Notifications Récentes</p></div>
                              <div className="max-h-48 overflow-y-auto">
                                  {notifications.length === 0 ? (
                                      <p className="p-4 text-[9px] text-center text-slate-400 uppercase">Aucune notification</p>
                                  ) : (
                                      notifications.map(n => (
                                          <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-orange-50/50 transition-colors">
                                              <p className="text-[9px] font-bold leading-tight mb-1">{n.text}</p>
                                              <p className="text-[7px] text-slate-400 text-right">{n.time}</p>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
              
              <div className="flex gap-2 mt-8 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar-dark pb-2">
                {(['GESTION', user?.role === 'COMPANY_ADMIN' ? 'VOYAGES' : null, user?.role === 'SERVICE_PARTNER' ? 'OFFRES' : null, user?.role === 'COMPANY_ADMIN' ? 'BILLETS' : 'RESERVATIONS', 'AIDE'].filter(Boolean) as any[]).map(tab => (
                  <button key={tab} onClick={() => { setActiveSubTab(tab); setManagingTrip(null); setIsAddingTrip(false); setIsAddingService(false); }} className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === tab ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400'}`}>{tab}</button>
                ))}
              </div>
           </div>

           {activeSubTab === 'GESTION' && (
             <div className="space-y-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
                   <h3 className="text-xs font-black uppercase text-slate-900">Coordonnées</h3>
                   <div className="flex flex-col items-center py-4 border-b border-slate-50">
                      <div className="w-20 h-20 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[1.5rem] flex items-center justify-center relative group">
                        <Camera size={24} className="text-slate-300" />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Logo & Photos/Vidéos</p>
                   </div>
                   <input type="text" placeholder="Nom commercial" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" />
                   <input type="tel" placeholder="Numéros" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" />
                   <textarea placeholder="Adresse & Activité" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100 h-24" />
                   <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Sauvegarder</button>
                </div>
             </div>
           )}

           {/* ONGLET OFFRES POUR PRESTATAIRES */}
           {activeSubTab === 'OFFRES' && user?.role === 'SERVICE_PARTNER' && (
             <div className="space-y-6 animate-in fade-in">
                {!isAddingService ? (
                    <>
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xs font-black uppercase text-slate-900">Mon Catalogue</h3>
                            <button onClick={() => setIsAddingService(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95"><PlusCircle size={14}/> Ajouter</button>
                        </div>
                        <div className="grid gap-4">
                            {partnerServices.map((service, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4">
                                    <div className="w-24 h-24 bg-slate-100 rounded-[1.5rem] overflow-hidden shrink-0 relative">
                                        <img src={service.images[0]} className="w-full h-full object-cover" />
                                        {service.images.length > 1 && <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[7px] font-black px-1.5 py-0.5 rounded-lg">+{service.images.length - 1}</div>}
                                    </div>
                                    <div className="flex-1 py-1">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[7px] font-black uppercase bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg mb-1 inline-block">{service.type}</span>
                                            <p className="text-[10px] font-black text-slate-900">{service.price.toLocaleString()} F</p>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase leading-tight mb-1">{service.name}</h4>
                                        <p className="text-[8px] text-slate-400 leading-snug line-clamp-2">{service.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right">
                         <div className="flex items-center gap-3 px-2">
                            <button onClick={() => setIsAddingService(false)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronLeft size={18}/></button>
                            <h3 className="text-xs font-black uppercase text-slate-900">Ajouter un produit</h3>
                         </div>
                         
                         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                             <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Nom du produit / service</label>
                                <input type="text" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" value={newServiceData.name} onChange={e => setNewServiceData({...newServiceData, name: e.target.value})} />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Catégorie</label>
                                    <select className="w-full bg-slate-50 py-4 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newServiceData.type} onChange={e => setNewServiceData({...newServiceData, type: e.target.value})}>
                                        <option value="RENTAL">Location</option>
                                        <option value="ACCOMMODATION">Hébergement</option>
                                        <option value="DINING">Restauration</option>
                                    </select>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Prix (CFA)</label>
                                    <input type="number" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" value={newServiceData.price} onChange={e => setNewServiceData({...newServiceData, price: parseInt(e.target.value)})} />
                                 </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Description détaillée</label>
                                <textarea className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100 h-24" value={newServiceData.desc} onChange={e => setNewServiceData({...newServiceData, desc: e.target.value})} />
                             </div>

                             {/* Media Upload Area */}
                             <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Galerie Photos & Vidéos</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 relative group cursor-pointer hover:border-orange-300 hover:text-orange-300 transition-all">
                                        <input type="file" multiple accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                // Fake upload for demo
                                                const url = URL.createObjectURL(e.target.files[0]);
                                                setNewServiceData(prev => ({...prev, images: [...prev.images, url]}));
                                            }
                                        }} />
                                        <Plus size={24} />
                                        <span className="text-[7px] font-black uppercase mt-1">Ajouter</span>
                                    </div>
                                    {newServiceData.images.map((img, i) => (
                                        <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button onClick={() => setNewServiceData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             <button onClick={handleAddService} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg mt-4"><Save size={16}/> Enregistrer le produit</button>
                         </div>
                    </div>
                )}
             </div>
           )}

           {activeSubTab === 'VOYAGES' && (
             <div className="space-y-6 animate-in fade-in">
                {/* Mode LISTE */}
                {!isAddingTrip && !managingTrip && (
                  <>
                     <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-black uppercase text-slate-900">Départs Programmés</h3>
                        <button onClick={() => setIsAddingTrip(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95"><PlusCircle size={14}/> Nouveau</button>
                     </div>
                     
                     <div className="space-y-4">
                        {companyTrips.map(trip => (
                           <div key={trip.id} onClick={() => openTripManagement(trip)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-orange-500 transition-all cursor-pointer group relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Settings size={40} /></div>
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[7px] font-black uppercase">Actif</span>
                                       <span className="text-[9px] font-black text-slate-300 uppercase">#{trip.id}</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase text-slate-900">{trip.origin} ➔ {trip.destination}</h4>
                                 </div>
                                 <p className="text-lg font-black text-orange-600">{trip.price.toLocaleString()} F</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Clock size={12}/> {trip.departureTime}</div>
                                 <div className="w-8 h-[2px] bg-slate-300 rounded-full"></div>
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Clock size={12}/> {trip.arrivalTime}</div>
                              </div>
                              <p className="text-[8px] font-black text-slate-400 uppercase mt-3 text-center tracking-widest group-hover:text-orange-500 transition-colors">Gérer les places & suivi</p>
                           </div>
                        ))}
                     </div>
                  </>
                )}

                {/* Mode AJOUT */}
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
                              {newTripData.origin === 'Abidjan' && (
                                <select 
                                   className="w-full bg-orange-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-orange-100 mt-2" 
                                   value={newTripData.originCommune} 
                                   onChange={e => setNewTripData({...newTripData, originCommune: e.target.value})}
                                >
                                   <option value="">Choisir Commune...</option>
                                   {ABIDJAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
                                </select>
                              )}
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Arrivée</label>
                              <select className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.destination} onChange={e => setNewTripData({...newTripData, destination: e.target.value})}>
                                {IVORIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                              {newTripData.destination === 'Abidjan' && (
                                <select 
                                   className="w-full bg-orange-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-orange-100 mt-2" 
                                   value={newTripData.destinationCommune} 
                                   onChange={e => setNewTripData({...newTripData, destinationCommune: e.target.value})}
                                >
                                   <option value="">Choisir Commune...</option>
                                   {ABIDJAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
                                </select>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Heure Départ</label>
                              <input type="time" className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.departureTime} onChange={e => setNewTripData({...newTripData, departureTime: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Heure Arrivée</label>
                              <input type="time" className="w-full bg-slate-50 py-3 px-4 rounded-2xl text-[10px] font-bold border border-slate-100" value={newTripData.arrivalTime} onChange={e => setNewTripData({...newTripData, arrivalTime: e.target.value})} />
                           </div>
                        </div>

                        <div className="space-y-1">
                           <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Prix du ticket (CFA)</label>
                           <input type="number" className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-[11px] font-bold border border-slate-100" value={newTripData.price} onChange={e => setNewTripData({...newTripData, price: parseInt(e.target.value)})} />
                        </div>

                        <button onClick={handleCreateTrip} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg mt-4"><Save size={16}/> Enregistrer le départ</button>
                     </div>
                  </div>
                )}

                {/* Mode GESTION DÉTAILLÉE */}
                {managingTrip && (
                  <div className="space-y-6 animate-in zoom-in">
                     <div className="flex items-center gap-3 px-2">
                        <button onClick={() => setManagingTrip(null)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronLeft size={18}/></button>
                        <div>
                           <h3 className="text-xs font-black uppercase text-slate-900">{managingTrip.origin} ➔ {managingTrip.destination}</h3>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">Suivi Temps Réel</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-4 rounded-[2rem] border border-blue-100 flex flex-col items-center justify-center text-center">
                           <p className="text-[20px] font-black text-blue-600">{Object.keys(managedSeats).length} / 70</p>
                           <p className="text-[7px] font-black uppercase text-blue-400 tracking-wider">Places Occupées</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-[2rem] border border-green-100 flex flex-col items-center justify-center text-center">
                           <p className="text-[20px] font-black text-green-600">{(Object.keys(managedSeats).length * managingTrip.price).toLocaleString()}</p>
                           <p className="text-[7px] font-black uppercase text-green-400 tracking-wider">Chiffre d'Affaires (CFA)</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                           <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Suivi CAR 70 places</h3>
                           <div className="flex gap-4">
                              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-white border border-slate-200 rounded-sm"></div><span className="text-[6px] font-black uppercase">Libre</span></div>
                              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div><span className="text-[6px] font-black uppercase">Occupé (H)</span></div>
                              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-pink-500 rounded-sm"></div><span className="text-[6px] font-black uppercase">Occupé (F)</span></div>
                           </div>
                        </div>
                        <HorizontalBusInterior selectedSeats={managedSeats} onSeatSelect={() => {}} isInteractive={false} />
                     </div>
                  </div>
                )}
             </div>
           )}

           {(activeSubTab === 'BILLETS' || activeSubTab === 'RESERVATIONS') && (
             <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-900 px-2">Liste des opérations</h3>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><User size={20}/></div>
                        <div><p className="text-[11px] font-black uppercase">Client #{i*242}</p><p className="text-[8px] font-bold text-slate-400 uppercase">Resa {i*12}9A</p></div>
                     </div>
                     <ChevronRight size={18} className="text-slate-200" />
                  </div>
                ))}
             </div>
           )}

           {activeSubTab === 'AIDE' && (
             <div className="space-y-6">
                <div className="bg-orange-600 text-white p-8 rounded-[3rem] shadow-xl">
                   <h4 className="font-black uppercase text-sm mb-2">IA Assistant MSB</h4>
                   <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">Echangez par écrit ou vocalement pour toute assistance technique ou commerciale.</p>
                   <div className="flex gap-3 mt-6">
                      <button className="flex-1 bg-white text-orange-600 py-3 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2"><MessageCircle size={14}/> Ecrire</button>
                      <button onClick={() => { setActiveTab(AppTab.ASSISTANT); setTimeout(startVoiceSession, 500); }} className="flex-1 bg-white/20 text-white py-3 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 transition-all"><Mic size={14}/> Vocal</button>
                   </div>
                </div>
             </div>
           )}

           {/* Bouton de Déconnexion en bas du Dashboard */}
           <div className="mt-8 pt-8 border-t border-slate-200">
             <button 
               onClick={() => { setIsAuthenticated(false); setBookingStep('TRIP_SELECT'); }}
               className="w-full bg-red-50 text-red-500 py-4 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 hover:bg-red-100 transition-all border border-red-100 active:scale-95 shadow-sm"
             >
               <LogOut size={16} /> Déconnexion
             </button>
           </div>
        </div>
      )}

      {/* ESPACE ADMIN DASHBOARD COMPLET */}
      {activeTab === AppTab.ADMIN_DASHBOARD && user?.role === 'GLOBAL_ADMIN' && (
        <div className="p-6 pb-24 space-y-6 animate-in fade-in">
           {/* Header Admin avec Notification Centralisée */}
           <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Administration</h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Système Opérationnel</p>
                </div>
              </div>
              <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-white rounded-full shadow-md border border-slate-100 hover:bg-slate-50 transition-all relative">
                      <Bell size={20} className={notifications.some(n => !n.read) ? "animate-bounce-slow text-orange-400" : "text-slate-400"} />
                      {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                  </button>
                  {showNotifications && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 z-20 animate-in zoom-in border border-slate-100">
                          <div className="p-3 bg-slate-900 text-white"><p className="text-[9px] font-black uppercase">Alertes Admin</p></div>
                          <div className="max-h-48 overflow-y-auto">
                              {notifications.length === 0 ? <p className="p-4 text-[9px] text-center text-slate-400">Rien à signaler</p> : notifications.map(n => (
                                  <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-orange-50 transition-colors">
                                      <p className="text-[9px] font-bold leading-tight mb-1">{n.text}</p>
                                      <p className="text-[7px] text-slate-400 text-right">{n.time}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
           </div>

           {/* Navigation Sous-Onglets Admin */}
           <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <button onClick={() => setActiveAdminTab('OVERVIEW')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeAdminTab === 'OVERVIEW' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Vue d'Ensemble</button>
              <button onClick={() => setActiveAdminTab('ACCOUNTS')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeAdminTab === 'ACCOUNTS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Validation Comptes</button>
              <button onClick={() => setActiveAdminTab('FINANCE')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeAdminTab === 'FINANCE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Finances</button>
           </div>

           {/* CONTENU VUE D'ENSEMBLE (SEGMENTÉ) */}
           {activeAdminTab === 'OVERVIEW' && (
             <div className="space-y-6 animate-in slide-in-from-right">
                
                {/* Segment Voyageurs */}
                <div className="space-y-3">
                   <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-2"><User size={12}/> Flux Voyageurs</h3>
                   <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-10"><User size={100}/></div>
                      <div>
                         <p className="text-3xl font-black">1,458</p>
                         <p className="text-[8px] font-bold opacity-80 uppercase tracking-wider">Actifs aujourd'hui</p>
                      </div>
                      <div className="text-right z-10">
                         <p className="text-xl font-black">+12%</p>
                         <p className="text-[8px] font-bold opacity-80 uppercase">Croissance</p>
                      </div>
                   </div>
                </div>

                {/* Segment Compagnies */}
                <div className="space-y-3">
                   <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-2"><Truck size={12}/> Flux Transporteurs</h3>
                   <div className="bg-orange-600 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-10"><Truck size={100}/></div>
                      <div>
                         <p className="text-3xl font-black">42</p>
                         <p className="text-[8px] font-bold opacity-80 uppercase tracking-wider">Départs en cours</p>
                      </div>
                      <div className="text-right z-10">
                         <p className="text-xl font-black">850</p>
                         <p className="text-[8px] font-bold opacity-80 uppercase">Billets vendus</p>
                      </div>
                   </div>
                </div>

                {/* Segment Prestataires */}
                <div className="space-y-3">
                   <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-2"><Store size={12}/> Flux Prestataires</h3>
                   <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-10"><Store size={100}/></div>
                      <div>
                         <p className="text-3xl font-black">18</p>
                         <p className="text-[8px] font-bold opacity-80 uppercase tracking-wider">Réservations Hôtels/Autos</p>
                      </div>
                      <div className="text-right z-10">
                         <p className="text-xl font-black">2.4M</p>
                         <p className="text-[8px] font-bold opacity-80 uppercase">Volume (CFA)</p>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* CONTENU VALIDATION COMPTES */}
           {activeAdminTab === 'ACCOUNTS' && (
             <div className="space-y-6 animate-in slide-in-from-right">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Demandes en attente</h3>
                   <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-[8px] font-black">{pendingAccounts.length}</span>
                </div>

                {pendingAccounts.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-[2.5rem] border border-slate-100">
                     <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3 opacity-20"/>
                     <p className="text-[9px] font-black uppercase text-slate-300">Aucune demande en attente</p>
                  </div>
                ) : (
                  pendingAccounts.map(account => (
                     <div key={account.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${account.type === 'COMPANY_ADMIN' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {account.type === 'COMPANY_ADMIN' ? 'Transporteur' : 'Prestataire'}
                                 </span>
                                 <span className="text-[9px] text-slate-300 font-black">#{account.id}</span>
                              </div>
                              <h4 className="font-black text-sm text-slate-900 uppercase">{account.name}</h4>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Reçu à {account.date}</p>
                           </div>
                           <Eye size={20} className="text-slate-300"/>
                        </div>
                        <div className="flex gap-3 pt-2">
                           <button onClick={() => handleAccountAction(account.id, 'REJECT')} className="flex-1 bg-red-50 text-red-500 py-3 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"><Ban size={12}/> Rejeter</button>
                           <button onClick={() => handleAccountAction(account.id, 'VALIDATE')} className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:bg-green-600 transition-colors"><CheckCircle2 size={12}/> Valider</button>
                        </div>
                     </div>
                  ))
                )}
             </div>
           )}

           {/* CONTENU FINANCES */}
           {activeAdminTab === 'FINANCE' && (
             <div className="space-y-6 animate-in slide-in-from-right">
                <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5"><Wallet size={150} /></div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solde MSB (Commissions)</p>
                   <h2 className="text-4xl font-black mb-6">4,850,000 <span className="text-sm text-orange-500">CFA</span></h2>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                         <div className="flex items-center gap-2 mb-1 text-green-400"><TrendingUp size={14}/> <span className="text-[9px] font-black">+15%</span></div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase">Croissance Hebdo</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                         <div className="flex items-center gap-2 mb-1 text-white"><DollarSign size={14}/> <span className="text-[9px] font-black">5%</span></div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase">Taux Commission</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">Derniers Mouvements Financiers</h3>
                   {[
                     { label: 'Commission UTB (Voyage #889)', amount: '+ 400', time: '10:42', type: 'IN' },
                     { label: 'Commission Hôtel Ivoire', amount: '+ 2,250', time: '11:15', type: 'IN' },
                     { label: 'Frais Serveurs', amount: '- 15,000', time: 'Hier', type: 'OUT' },
                   ].map((m, i) => (
                      <div key={i} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                               {m.type === 'IN' ? <ArrowRight className="rotate-45" size={16}/> : <ArrowRight className="-rotate-45" size={16}/>}
                            </div>
                            <div>
                               <p className="text-[9px] font-black uppercase text-slate-900">{m.label}</p>
                               <p className="text-[7px] font-bold text-slate-400 uppercase">{m.time}</p>
                            </div>
                         </div>
                         <p className={`font-black text-sm ${m.type === 'IN' ? 'text-green-600' : 'text-slate-900'}`}>{m.amount}</p>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* Bouton de Déconnexion Admin */}
           <div className="mt-8 pt-8 border-t border-slate-200">
             <button 
               onClick={() => { setIsAuthenticated(false); setBookingStep('TRIP_SELECT'); }}
               className="w-full bg-red-50 text-red-500 py-4 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 hover:bg-red-100 transition-all border border-red-100 active:scale-95 shadow-sm"
             >
               <LogOut size={16} /> Déconnexion Admin
             </button>
           </div>
        </div>
      )}

    </Layout>
  );
};

export default App;
