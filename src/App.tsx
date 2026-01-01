
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import { AppTab, Trip, Ticket, Vehicle, UserRole, UserProfile, BookingStep, Seat, Gender, PassengerDetail } from './types.ts';
import { IVORIAN_CITIES, ABIDJAN_COMMUNES, MOCK_TRIPS, COMPANIES, MOCK_VEHICLES } from './constants.ts';
import { 
  MapPin, Calendar, Search, ArrowRight, Star, Clock, Info, ShieldCheck, 
  ChevronRight, MessageSquare, Send, Sparkles, User, Ticket as TicketIcon, 
  Plus, TrendingUp, Users, Building, Truck, Briefcase, Trash2, Edit2, Car,
  Phone, Mail, Lock, LogOut, ChevronLeft, CreditCard, Wallet, Smartphone,
  UserCheck, MapPinned, IdCard, ChevronRight as ChevronRightIcon, Key, FileText,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { getTravelAdvice } from './services/geminiService.ts';

type AuthMode = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  // Password Reset State
  const [resetStep, setResetStep] = useState<'PHONE' | 'CODE' | 'NEW_PWD'>('PHONE');
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Booking Flow State
  const [bookingStep, setBookingStep] = useState<BookingStep>('TRIP_SELECT');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<{ [number: string]: Gender }>({});
  const [passengerDetails, setPassengerDetails] = useState<{ [seatNumber: string]: PassengerDetail }>({});
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  
  // Search State
  const [origin, setOrigin] = useState('');
  const [originStation, setOriginStation] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationStation, setDestinationStation] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');

  // Auth Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    gender: 'MALE' as Gender
  });

  const [trips] = useState<Trip[]>(MOCK_TRIPS);
  const [vehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Bienvenue sur MON BILLET SECURISE ! Je peux vous aider pour vos billets ou vos locations.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Load "Remember Me" data
  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Date Carousel Logic
  const dateCarousel = useMemo(() => {
    const current = new Date(departureDate);
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(current);
    next.setDate(next.getDate() + 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const displayDate = (d: Date) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return d.toLocaleDateString('fr-FR', options);
    };

    return [
        { iso: formatDate(prev), display: displayDate(prev), label: 'Hier' },
        { iso: formatDate(current), display: displayDate(current), label: 'Départ' },
        { iso: formatDate(next), display: displayDate(next), label: 'Demain' }
    ];
  }, [departureDate]);

  // Generate mock seats with random occupancy
  const mockBusSeats = useMemo(() => {
    const seats: Seat[] = [];
    for (let i = 1; i <= 44; i++) {
      const rand = Math.random();
      let status: Seat['status'] = 'AVAILABLE';
      if (rand > 0.85) status = 'OCCUPIED_MALE';
      else if (rand > 0.7) status = 'OCCUPIED_FEMALE';
      seats.push({ id: `s${i}`, number: i.toString(), status });
    }
    return seats;
  }, [selectedTrip]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'REGISTER') {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password) {
        alert("Veuillez remplir les champs obligatoires");
        return;
      }
      if (!acceptedLegal) {
        alert("Veuillez accepter les conditions d'utilisation");
        return;
      }
    } else {
      if (!formData.phone || !formData.password) {
        alert("Veuillez entrer votre numéro et mot de passe");
        return;
      }
    }

    const loggedUser: UserProfile = {
      firstName: formData.firstName || 'Moussa',
      lastName: formData.lastName || 'Touré',
      phone: formData.phone,
      email: formData.email,
      role: 'USER',
      gender: formData.gender
    };

    if (rememberMe) {
      localStorage.setItem('remembered_user', JSON.stringify(loggedUser));
    }

    setUser(loggedUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('remembered_user');
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab(AppTab.HOME);
    setFormData({ firstName: '', lastName: '', phone: '', email: '', password: '', gender: 'MALE' });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetStep === 'PHONE') {
      if (!resetPhone) return alert("Entrez votre numéro");
      alert("SMS envoyé avec succès ! (Code de test: 1234)");
      setResetStep('CODE');
    } else if (resetStep === 'CODE') {
      if (resetCode !== '1234') return alert("Code incorrect (essayez 1234)");
      setResetStep('NEW_PWD');
    } else {
      if (!newPassword) return alert("Entrez un nouveau mot de passe");
      alert("Mot de passe réinitialisé avec succès !");
      setAuthMode('LOGIN');
      setResetStep('PHONE');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      alert("Veuillez remplir au moins le départ, l'arrivée et la date de départ.");
      return;
    }
    if (origin === "Abidjan" && !originStation) {
      alert("Veuillez préciser votre commune/gare de départ à Abidjan.");
      return;
    }
    if (destination === "Abidjan" && !destinationStation) {
      alert("Veuillez préciser votre commune/gare de descente à Abidjan.");
      return;
    }

    const filtered = trips.filter(t => 
      t.origin.toLowerCase() === origin.toLowerCase() && 
      t.destination.toLowerCase() === destination.toLowerCase()
    );
    setSearchResults(filtered);
    setActiveTab(AppTab.SEARCH);
    setBookingStep('TRIP_SELECT');
  };

  const toggleSeat = (seatNumber: string) => {
    if (selectedSeats[seatNumber]) {
      const newSelected = { ...selectedSeats };
      delete newSelected[seatNumber];
      setSelectedSeats(newSelected);
      
      const newDetails = { ...passengerDetails };
      delete newDetails[seatNumber];
      setPassengerDetails(newDetails);
    } else {
      setSelectedSeats({ ...selectedSeats, [seatNumber]: 'MALE' });
      setPassengerDetails({
        ...passengerDetails,
        [seatNumber]: {
           firstName: seatNumber === Object.keys(selectedSeats)[0] && !Object.keys(selectedSeats).length ? (user?.firstName || '') : '',
           lastName: seatNumber === Object.keys(selectedSeats)[0] && !Object.keys(selectedSeats).length ? (user?.lastName || '') : '',
           phone: seatNumber === Object.keys(selectedSeats)[0] && !Object.keys(selectedSeats).length ? (user?.phone || '') : '',
           gender: 'MALE',
           seatNumber
        }
      });
    }
  };

  const switchSeatGender = (seatNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newGender = selectedSeats[seatNumber] === 'MALE' ? 'FEMALE' : 'MALE';
    setSelectedSeats({ ...selectedSeats, [seatNumber]: newGender });
    setPassengerDetails({
        ...passengerDetails,
        [seatNumber]: { ...passengerDetails[seatNumber], gender: newGender }
    });
  };

  const handlePassengerChange = (seatNumber: string, field: keyof PassengerDetail, value: string) => {
    setPassengerDetails({
      ...passengerDetails,
      [seatNumber]: { ...passengerDetails[seatNumber], [field]: value }
    });
  };

  const validatePassengerDetails = () => {
    for (const seatNumber of Object.keys(selectedSeats)) {
      const p = passengerDetails[seatNumber];
      if (!p?.firstName || !p?.lastName || !p?.phone) {
        alert(`Veuillez remplir les informations pour le siège N°${seatNumber}`);
        return false;
      }
    }
    return true;
  };

  const completePayment = () => {
    if (!paymentMethod) {
      alert("Veuillez choisir un moyen de paiement");
      return;
    }
    
    const seatNumbers = Object.keys(selectedSeats);
    const newBatchTickets: Ticket[] = seatNumbers.map(num => {
      const p = passengerDetails[num];
      return {
        id: 'TCK-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        tripId: selectedTrip!.id,
        passengerName: `${p.firstName} ${p.lastName}`,
        passengerPhone: p.phone,
        passengerIdNumber: p.idNumber,
        gender: p.gender,
        seatNumber: num,
        bookingDate: new Date().toISOString(),
        travelDate: departureDate,
        returnDate: returnDate || undefined,
        originStation: origin === "Abidjan" ? originStation : origin,
        destinationStation: destination === "Abidjan" ? destinationStation : destination,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedTrip!.id}-${num}-${Date.now()}`,
        status: 'CONFIRMED',
        price: selectedTrip!.price
      };
    });

    setMyTickets([...newBatchTickets, ...myTickets]);
    setBookingStep('TRIP_SELECT');
    setSelectedTrip(null);
    setSelectedSeats({});
    setPassengerDetails({});
    setPaymentMethod(null);
    setActiveTab(AppTab.TICKETS);
    alert(`Paiement réussi pour ${newBatchTickets.length} billet(s) !`);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);
    const botResponse = await getTravelAdvice(userMsg);
    setChatMessages(prev => [...prev, { role: 'bot', text: botResponse || '' }]);
    setIsTyping(false);
  };

  const LegalModal = () => (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-orange-600 p-6 text-white text-center">
           <FileText size={40} className="mx-auto mb-2" />
           <h3 className="font-black text-lg uppercase">Charte de Confidentialité</h3>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] text-xs leading-relaxed text-slate-600 space-y-4 font-medium">
          <p>Bienvenue sur <strong>MON BILLET SECURISE</strong>. La protection de vos données est notre priorité absolue.</p>
          <div className="flex gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-100">
             <ShieldCheck size={24} className="text-blue-600 flex-shrink-0" />
             <p className="text-[10px] text-blue-900 font-bold uppercase tracking-tight">Chiffrement de bout en bout (E2EE) activé sur toutes vos transactions et données personnelles.</p>
          </div>
          <p><strong>1. Utilisation des données :</strong> Vos informations (Nom, Prénoms, Téléphone, Pièce d'identité) sont utilisées exclusivement pour l'édition de vos titres de transport et le contrôle lors de l'embarquement.</p>
          <p><strong>2. Partage responsable :</strong> Seule la compagnie de transport choisie a accès aux informations nécessaires à la vérification de votre voyage.</p>
          <p><strong>3. Sécurité :</strong> Nous mettons en œuvre des technologies avancées pour garantir que vos informations ne sont jamais compromises.</p>
          <p><strong>4. Vos droits :</strong> Vous disposez d'un droit d'accès et de rectification de vos données à tout moment via votre profil.</p>
        </div>
        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => { setAcceptedLegal(true); setShowLegal(false); }}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            J'accepte et je comprends
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-slate-200">
        {showLegal && <LegalModal />}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-orange-600 w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-200 mb-8 rotate-6 animate-bounce-slow">
            <ShieldCheck size={48} className="text-white" />
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase text-center">MON BILLET SECURISE</h1>
            <p className="text-slate-500 text-sm font-medium mt-2">Voyagez en toute sérénité.</p>
          </div>

          <div className="w-full bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            {authMode !== 'RESET_PASSWORD' && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                <button onClick={() => setAuthMode('LOGIN')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${authMode === 'LOGIN' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>Connexion</button>
                <button onClick={() => setAuthMode('REGISTER')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${authMode === 'REGISTER' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>Inscription</button>
              </div>
            )}

            {authMode === 'RESET_PASSWORD' ? (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-in slide-in-from-right">
                <div className="flex items-center gap-3 mb-4">
                  <button type="button" onClick={() => setAuthMode('LOGIN')} className="p-2 bg-slate-50 rounded-full text-slate-600"><ChevronLeft size={18}/></button>
                  <h3 className="font-black text-sm uppercase text-slate-800">Récupération</h3>
                </div>

                {resetStep === 'PHONE' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="tel" placeholder="07 00 00 00 00" className="w-full bg-slate-50 border-none rounded-xl py-4 pl-9 pr-4 text-xs font-bold outline-none" value={resetPhone} onChange={e => setResetPhone(e.target.value)} required />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 px-1">Un code de réinitialisation vous sera envoyé par SMS.</p>
                  </div>
                )}

                {resetStep === 'CODE' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Code de vérification (SMS)</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Entrez le code" className="w-full bg-slate-50 border-none rounded-xl py-4 pl-9 pr-4 text-xs font-bold outline-none" value={resetCode} onChange={e => setResetCode(e.target.value)} required />
                    </div>
                  </div>
                )}

                {resetStep === 'NEW_PWD' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-xl py-4 pl-9 pr-4 text-xs font-bold outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm mt-4 uppercase tracking-wider">
                  {resetStep === 'PHONE' ? 'Recevoir le code' : resetStep === 'CODE' ? 'Vérifier le code' : 'Enregistrer'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'REGISTER' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prénom</label>
                        <input type="text" placeholder="Moussa" className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-4 text-xs font-bold outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nom</label>
                        <input type="text" placeholder="Traoré" className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-4 text-xs font-bold outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="tel" placeholder="07 00 00 00 00" className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-9 pr-4 text-xs font-bold outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-9 pr-4 text-xs font-bold outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  </div>
                </div>

                {authMode === 'LOGIN' ? (
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative w-4 h-4">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-orange-600 checked:border-orange-600 transition-all" 
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                        />
                        <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-all pointer-events-none" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700">Se rappeler de moi</span>
                    </label>
                    <button type="button" onClick={() => setAuthMode('RESET_PASSWORD')} className="text-[10px] font-black text-orange-600 uppercase hover:underline">Mot de passe oublié ?</button>
                  </div>
                ) : (
                  <div className="space-y-3 px-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative w-4 h-4 mt-0.5">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-orange-600 checked:border-orange-600 transition-all" 
                          checked={acceptedLegal}
                          onChange={e => setAcceptedLegal(e.target.checked)}
                        />
                        <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-all pointer-events-none" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-500">J'accepte les <button type="button" onClick={() => setShowLegal(true)} className="text-orange-600 hover:underline">Conditions d'Utilisation</button> et la <button type="button" onClick={() => setShowLegal(true)} className="text-orange-600 hover:underline">Politique de Confidentialité</button>.</span>
                      </div>
                    </label>
                  </div>
                )}

                <button type="submit" className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 active:scale-95 transition-all text-sm mt-4 uppercase tracking-wider">
                  {authMode === 'REGISTER' ? "Créer mon compte" : "Se connecter"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-gradient-to-br from-orange-600 to-orange-500 -mx-4 -mt-4 p-8 rounded-b-[3rem] text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Bienvenue, {user?.firstName}</h2>
            <p className="opacity-80 text-xs">Où allons-nous aujourd'hui ?</p>
          </div>
          <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold border border-white/30 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            En ligne
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 shadow-xl text-slate-800 space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Départ (Ville)</label>
              <select value={origin} onChange={(e) => {setOrigin(e.target.value); if(e.target.value !== 'Abidjan') setOriginStation('');}} className="text-sm font-bold bg-slate-50 p-2 rounded-lg outline-none border-none">
                <option value="">Ville</option>
                {IVORIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Arrivée (Ville)</label>
              <select value={destination} onChange={(e) => {setDestination(e.target.value); if(e.target.value !== 'Abidjan') setDestinationStation('');}} className="text-sm font-bold bg-slate-50 p-2 rounded-lg outline-none border-none">
                <option value="">Ville</option>
                {IVORIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {(origin === "Abidjan" || destination === "Abidjan") && (
            <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                {origin === "Abidjan" && (
                  <>
                    <label className="text-[10px] font-bold text-orange-600 uppercase">Gare de départ (Abidjan)</label>
                    <select value={originStation} onChange={(e) => setOriginStation(e.target.value)} className="text-[11px] font-bold bg-orange-50 p-2 rounded-lg outline-none border border-orange-100">
                      <option value="">Choisir Commune</option>
                      {ABIDJAN_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {destination === "Abidjan" && (
                  <>
                    <label className="text-[10px] font-bold text-orange-600 uppercase">Gare de descente (Abidjan)</label>
                    <select value={destinationStation} onChange={(e) => setDestinationStation(e.target.value)} className="text-[11px] font-bold bg-orange-50 p-2 rounded-lg outline-none border border-orange-100">
                      <option value="">Choisir Commune</option>
                      {ABIDJAN_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Date de départ</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full text-xs font-bold bg-slate-50 py-2 pl-7 pr-2 rounded-lg outline-none" min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Date de retour</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full text-xs font-bold bg-slate-50 py-2 pl-7 pr-2 rounded-lg outline-none" min={departureDate} />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition flex items-center justify-center gap-2 text-sm shadow-md uppercase">
            <Search size={16} /> Rechercher un trajet
          </button>
        </form>
      </div>

      <section>
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Truck size={18} className="text-orange-600" />
          Location de véhicules
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {['CAR', 'MINIBUS', 'BUS'].map((type, i) => (
            <button key={type} onClick={() => setActiveTab(AppTab.RENTAL)} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-1 group active:scale-95 transition">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition ${i === 0 ? 'bg-blue-50 text-blue-600' : i === 1 ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                {i === 0 ? <Car size={20} /> : i === 1 ? <Briefcase size={20} /> : <Truck size={20} />}
              </div>
              <span className="text-[10px] font-bold">{type === 'CAR' ? 'Voiture' : type === 'MINIBUS' ? 'Mini Bus' : 'Car'}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h4 className="text-xl font-bold mb-1">Espace Partenaire</h4>
          <p className="text-[10px] opacity-70 mb-4">Gérez votre flotte et vos trajets en quelques clics.</p>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg uppercase active:scale-95 transition">Devenir Partenaire</button>
        </div>
        <Building size={120} className="absolute -right-4 -bottom-4 text-white opacity-5" />
      </div>
    </div>
  );

  const renderSeatSelection = () => (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => { setBookingStep('TRIP_SELECT'); setSelectedSeats({}); }} className="p-2 bg-white rounded-full shadow-sm text-slate-600 active:scale-95 transition">
          <ChevronLeft size={20}/>
        </button>
        <h2 className="font-bold text-lg">Choix des Sièges</h2>
      </div>

      <div className="bg-slate-200 rounded-[3rem] p-4 shadow-inner border-4 border-slate-300 max-w-[320px] mx-auto overflow-hidden">
        <div className="bg-slate-400 h-12 rounded-t-[2.5rem] mb-6 relative overflow-hidden flex items-center justify-center border-b-4 border-slate-500">
           <div className="bg-slate-300 w-full h-2 absolute top-2 opacity-50"></div>
           <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white border-2 border-slate-600 ml-auto mr-12">
              <Users size={14} className="opacity-50"/>
           </div>
        </div>

        <div className="flex justify-between mb-6 px-4 py-2 bg-white/50 rounded-xl">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div><span className="text-[8px] font-bold">Libre</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div><span className="text-[8px] font-bold">Homme</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-pink-500 rounded"></div><span className="text-[8px] font-bold">Femme</span></div>
        </div>

        <div className="space-y-3 pb-8">
          {Array.from({ length: 11 }).map((_, row) => (
            <div key={row} className="flex justify-between items-center px-2">
              <div className="flex gap-1.5">
                {[1, 2].map(col => {
                  const seatNum = (row * 4 + col).toString();
                  const seat = mockBusSeats.find(s => s.number === seatNum);
                  const isSelected = !!selectedSeats[seatNum];
                  const gender = selectedSeats[seatNum];
                  return (
                    <div key={seatNum} className="relative group">
                      <button disabled={seat?.status !== 'AVAILABLE'} onClick={() => toggleSeat(seatNum)} className={`w-10 h-10 rounded-lg text-[9px] font-black transition flex flex-col items-center justify-center border-b-4 ${seat?.status === 'AVAILABLE' ? (isSelected ? (gender === 'MALE' ? 'bg-blue-500 border-blue-700 text-white scale-105' : 'bg-pink-500 border-pink-700 text-white scale-105') : 'bg-white border-slate-300 text-slate-400') : (seat?.status === 'OCCUPIED_MALE' ? 'bg-blue-600 border-blue-800 text-white opacity-40' : 'bg-pink-600 border-pink-800 text-white opacity-40')}`}>
                        {seatNum}
                        {isSelected && <span className="text-[7px] mt-0.5 opacity-80">{gender === 'MALE' ? 'H' : 'F'}</span>}
                      </button>
                      {isSelected && <button onClick={(e) => switchSeatGender(seatNum, e)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-100 z-10 active:scale-95"><UserCheck size={10} className={gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}/></button>}
                    </div>
                  );
                })}
              </div>
              <div className="w-6 h-10 bg-slate-300/30 rounded-sm"></div>
              <div className="flex gap-1.5">
                {[3, 4].map(col => {
                  const seatNum = (row * 4 + col).toString();
                  const seat = mockBusSeats.find(s => s.number === seatNum);
                  const isSelected = !!selectedSeats[seatNum];
                  const gender = selectedSeats[seatNum];
                  return (
                    <div key={seatNum} className="relative group">
                      <button disabled={seat?.status !== 'AVAILABLE'} onClick={() => toggleSeat(seatNum)} className={`w-10 h-10 rounded-lg text-[9px] font-black transition flex flex-col items-center justify-center border-b-4 ${seat?.status === 'AVAILABLE' ? (isSelected ? (gender === 'MALE' ? 'bg-blue-500 border-blue-700 text-white scale-105' : 'bg-pink-500 border-pink-700 text-white scale-105') : 'bg-white border-slate-300 text-slate-400') : (seat?.status === 'OCCUPIED_MALE' ? 'bg-blue-600 border-blue-800 text-white opacity-40' : 'bg-pink-600 border-pink-800 text-white opacity-40')}`}>
                        {seatNum}
                        {isSelected && <span className="text-[7px] mt-0.5 opacity-80">{gender === 'MALE' ? 'H' : 'F'}</span>}
                      </button>
                      {isSelected && <button onClick={(e) => switchSeatGender(seatNum, e)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-100 z-10 active:scale-95"><UserCheck size={10} className={gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}/></button>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex justify-between items-center sticky bottom-4 z-20">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sélection</p>
          <p className="text-sm font-black text-slate-900">{Object.keys(selectedSeats).length} siège(s) choisi(s)</p>
          <p className="text-orange-600 font-bold text-xs">Total: {(Object.keys(selectedSeats).length * (selectedTrip?.price || 0)).toLocaleString()} CFA</p>
        </div>
        <button disabled={Object.keys(selectedSeats).length === 0} onClick={() => setBookingStep('PASSENGER_DETAILS')} className={`px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${Object.keys(selectedSeats).length > 0 ? 'bg-orange-600 text-white shadow-orange-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Suivant</button>
      </div>
    </div>
  );

  const renderPassengerDetails = () => (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setBookingStep('SEAT_SELECT')} className="p-2 bg-white rounded-full shadow-sm text-slate-600 active:scale-95 transition">
          <ChevronLeft size={20}/>
        </button>
        <h2 className="font-bold text-lg">Infos Passagers</h2>
      </div>

      <div className="space-y-6">
        {Object.keys(selectedSeats).sort((a,b) => parseInt(a) - parseInt(b)).map(num => (
          <div key={num} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${selectedSeats[num] === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                    {num}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Passager Siège {num}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{selectedSeats[num] === 'MALE' ? 'HOMME' : 'FEMME'}</p>
                  </div>
               </div>
               <UserCheck size={18} className={selectedSeats[num] === 'MALE' ? 'text-blue-500 opacity-30' : 'text-pink-500 opacity-30'} />
            </div>
            
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Prénom</label>
                    <input type="text" placeholder="Prénom" className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-4 text-xs font-bold outline-none" value={passengerDetails[num]?.firstName || ''} onChange={e => handlePassengerChange(num, 'firstName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nom</label>
                    <input type="text" placeholder="Nom" className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-4 text-xs font-bold outline-none" value={passengerDetails[num]?.lastName || ''} onChange={e => handlePassengerChange(num, 'lastName', e.target.value)} />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="tel" placeholder="Numéro de contact" className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-9 pr-4 text-xs font-bold outline-none" value={passengerDetails[num]?.phone || ''} onChange={e => handlePassengerChange(num, 'phone', e.target.value)} />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Pièce d'identité (Facultatif)</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Numéro CNI / Passeport" className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-9 pr-4 text-xs font-bold outline-none" value={passengerDetails[num]?.idNumber || ''} onChange={e => handlePassengerChange(num, 'idNumber', e.target.value)} />
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 sticky bottom-4 z-20">
         <button onClick={() => { if(validatePassengerDetails()) setBookingStep('PAYMENT'); }} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-100 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">Continuer vers le paiement</button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setBookingStep('PASSENGER_DETAILS')} className="p-2 bg-white rounded-full shadow-sm text-slate-600 active:scale-95 transition">
          <ChevronLeft size={20}/>
        </button>
        <h2 className="font-bold text-lg">Paiement</h2>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Total à payer</p>
          <p className="text-3xl font-black">{(Object.keys(selectedSeats).length * (selectedTrip?.price || 0)).toLocaleString()} <small className="text-sm">FCFA</small></p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium opacity-70">
            <span className="flex items-center gap-1"><MapPin size={10}/> {originStation || origin} ➔ {destinationStation || destination}</span>
            <span className="flex items-center gap-1"><TicketIcon size={10}/> {Object.keys(selectedSeats).length} Billets</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { id: 'wave', name: 'Wave CI', color: 'bg-blue-400', logo: '🌊' },
          { id: 'orange', name: 'Orange Money', color: 'bg-orange-500', logo: '🍊' },
          { id: 'mtn', name: 'MTN MoMo', color: 'bg-yellow-400', logo: '🟡' }
        ].map(method => (
          <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`p-4 rounded-[1.5rem] border-2 transition flex items-center justify-between w-full ${paymentMethod === method.id ? 'border-orange-600 bg-orange-50/20' : 'border-slate-100 bg-white shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${method.color} rounded-xl flex items-center justify-center text-white text-lg`}>{method.logo}</div>
              <span className="text-xs font-black text-slate-700">{method.name}</span>
            </div>
            {paymentMethod === method.id && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg"><ShieldCheck size={12}/></div>}
          </button>
        ))}
      </div>

      <button onClick={completePayment} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-sm mt-4 uppercase tracking-wider flex items-center justify-center gap-2">
        <Smartphone size={18}/> Confirmer & Payer
      </button>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role || 'USER'}>
      {activeTab === AppTab.HOME && renderHome()}
      {activeTab === AppTab.SEARCH && (
        <>
          {bookingStep === 'TRIP_SELECT' && (
            <div className="animate-in slide-in-from-bottom duration-300 pb-20">
              <div className="bg-white px-4 pt-4 pb-6 sticky top-0 z-40 border-b border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setActiveTab(AppTab.HOME)} className="p-2 bg-slate-50 rounded-full text-slate-600 active:scale-95 transition"><ChevronLeft size={20}/></button>
                  <div className="flex flex-col">
                    <h2 className="font-bold text-lg leading-tight">{origin} ➔ {destination}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{originStation || 'Départ'} ➔ {destinationStation || 'Arrivée'}</p>
                  </div>
                </div>

                {/* Coulissement de Dates */}
                <div className="flex items-center justify-between bg-slate-100/50 p-1.5 rounded-2xl gap-1">
                  {dateCarousel.map((item, i) => (
                    <button 
                        key={item.iso}
                        onClick={() => setDepartureDate(item.iso)}
                        className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center justify-center border-none
                          ${item.iso === departureDate 
                            ? 'bg-white shadow-md text-orange-600' 
                            : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 mb-0.5">{item.label}</span>
                      <span className="text-[10px] font-bold leading-none">{item.display}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {searchResults.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-orange-200 transition">
                     <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compagnie</p>
                          <p className="font-black text-sm text-slate-800">{COMPANIES.find(c => c.id === t.companyId)?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Tarif</p>
                          <p className="text-lg font-black">{t.price.toLocaleString()} <small className="text-[10px]">CFA</small></p>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 mb-6 bg-slate-50 p-4 rounded-3xl">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-1.5"><Clock size={12} className="text-orange-500"/> Départ {t.departureTime}</div>
                          <div className="flex items-center gap-1.5"><Users size={12} className="text-orange-500"/> {t.availableSeats} Places</div>
                        </div>
                     </div>
                     <button onClick={() => { setSelectedTrip(t); setBookingStep('SEAT_SELECT'); }} className="w-full bg-orange-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-100 active:scale-95 transition-all">
                       Réserver ce trajet
                     </button>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="text-center py-20 px-8 bg-white rounded-[3rem] border border-dashed border-slate-200 mx-4">
                     <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200"><Search size={32}/></div>
                     <p className="text-slate-400 text-sm font-medium leading-relaxed">Aucun départ n'est programmé pour cet itinéraire à cette date.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {bookingStep === 'SEAT_SELECT' && renderSeatSelection()}
          {bookingStep === 'PASSENGER_DETAILS' && renderPassengerDetails()}
          {bookingStep === 'PAYMENT' && renderPayment()}
        </>
      )}
      {activeTab === AppTab.TICKETS && (
        <div className="p-4 animate-in fade-in duration-500 pb-20">
          <h2 className="text-xl font-bold mb-6">Mes Billets</h2>
          <div className="space-y-6">
            {myTickets.map(t => {
               const trip = trips.find(trip => trip.id === t.tripId);
               return (
                <div key={t.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
                  <div className="p-6 border-b border-dashed border-slate-100 relative">
                    <div className="absolute -left-3 -bottom-3 w-6 h-6 bg-slate-50 rounded-full"></div>
                    <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-slate-50 rounded-full"></div>
                    <div className="flex justify-between mb-4">
                      <span className="bg-green-50 text-green-600 text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10}/> Ticket Valide</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{t.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4">
                      <div className="col-span-2 mb-2">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Trajet & Gares</p>
                        <p className="font-black text-xs flex items-center gap-2">
                           <span className="text-orange-600">{t.originStation}</span> 
                           <ArrowRight size={12} className="text-slate-300"/> 
                           <span className="text-slate-800">{t.destinationStation}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Date / Heure</p>
                        <p className="font-black text-xs">{t.travelDate} à {trip?.departureTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Siège (Genre)</p>
                        <p className={`font-black text-xs ${t.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}`}>N° {t.seatNumber} ({t.gender === 'MALE' ? 'H' : 'F'})</p>
                      </div>
                      <div className="col-span-2 flex justify-between border-t border-slate-50 pt-4">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Nom du Passager</p>
                          <p className="font-black text-xs text-orange-600 truncate max-w-[150px] uppercase">{t.passengerName}</p>
                          <p className="text-[8px] font-bold text-slate-400">{t.passengerPhone}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Prix Payé</p>
                           <p className="font-black text-xs">{t.price.toLocaleString()} CFA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50 flex flex-col items-center">
                     <div className="bg-white p-4 rounded-3xl shadow-sm mb-4">
                       <img src={t.qrCode} className="w-40 h-40" alt="Ticket QR" />
                     </div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Présenter au contrôleur</p>
                  </div>
                </div>
              )
            })}
            {myTickets.length === 0 && (
              <div className="text-center py-24 px-10">
                 <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-100 shadow-inner"><TicketIcon size={40}/></div>
                 <p className="text-slate-400 text-sm font-medium">Aucun billet réservé pour le moment.</p>
                 <button onClick={() => setActiveTab(AppTab.HOME)} className="mt-4 text-orange-600 font-bold text-[10px] tracking-widest uppercase active:scale-95 transition">Réserver maintenant</button>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === AppTab.RENTAL && (
        <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300 pb-20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Location CI</h2>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">Voitures</span>
              <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">Cars</span>
            </div>
          </div>
          <div className="space-y-4">
            {vehicles.map(v => (
              <div key={v.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-slate-100">
                <div className="relative">
                  <img src={v.image} alt={v.model} className="w-full h-44 object-cover" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur text-orange-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">{v.type}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-black text-slate-800 text-lg">{v.model}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Flotte Partenaire</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900 leading-none">{v.pricePerDay.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest">FCFA/JOUR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 py-4 border-y border-slate-50 mb-6">
                    <div className="flex items-center gap-1.5"><Users size={14} className="text-slate-400"/><span className="text-[10px] font-bold">{v.capacity} Pers</span></div>
                    <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500"/><span className="text-[10px] font-bold">Assurance</span></div>
                  </div>
                  <button className="w-full bg-slate-900 text-white text-[10px] font-black py-4 rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-slate-100 active:scale-95 transition-all">Louer maintenant</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === AppTab.ASSISTANT && (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-xs font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none shadow-orange-100' : 'bg-white border border-slate-100 rounded-tl-none text-slate-700'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-slate-400 italic font-black px-2 animate-pulse">Assistant en cours d'écriture...</div>}
           </div>
           <div className="p-4 border-t border-slate-100 bg-white shadow-2xl">
              <div className="flex gap-2 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200">
                <input type="text" className="flex-1 bg-transparent outline-none text-xs px-3 py-2 font-medium" placeholder="Posez votre question (tarifs, gares...)" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={handleSendMessage} className="bg-orange-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"><Send size={16}/></button>
              </div>
           </div>
        </div>
      )}
      {activeTab === AppTab.PROFILE && (
        <div className="p-4 space-y-6 animate-in slide-in-from-bottom duration-300 pb-20">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black mb-4 border-8 border-slate-50 shadow-2xl relative z-10 ${formData.gender === 'FEMALE' ? 'bg-pink-500 shadow-pink-100' : 'bg-blue-500 shadow-blue-100'}`}>
              {user?.firstName[0]}{user?.lastName[0]}
            </div>
            <h3 className="font-black text-2xl text-slate-900 relative z-10">{user?.firstName} {user?.lastName}</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-2 relative z-10">{user?.phone}</p>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            <button className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition group">
               <div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition"><Wallet size={20}/></div> <span className="text-xs font-black uppercase tracking-widest text-slate-700">Mon Portefeuille</span></div>
               <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full shadow-inner">0 CFA</span>
            </button>
            <button onClick={handleLogout} className="w-full p-6 text-left flex items-center justify-between hover:bg-red-50 text-red-500 transition group">
               <div className="flex items-center gap-4"><div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition"><LogOut size={20}/></div> <span className="text-xs font-black uppercase tracking-widest text-slate-700">Déconnexion</span></div>
               <ChevronRightIcon size={18}/>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
