
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import { AppTab, Trip, Ticket, UserRole, UserProfile, BookingStep, Seat, Gender, PassengerDetail, ServiceListing, ServiceType, Company } from './types.ts';
import { IVORIAN_CITIES, ABIDJAN_COMMUNES, MOCK_TRIPS, COMPANIES, MOCK_VEHICLES } from './constants.ts';
import { 
  MapPin, Calendar, Search, ArrowRight, Star, Clock, Info, ShieldCheck, 
  ChevronRight, MessageSquare, MessageCircle, Send, Sparkles, User, Ticket as TicketIcon, 
  Plus, TrendingUp, Users, Building, Truck, Briefcase, Trash2, Edit2, Car,
  Phone, Mail, Lock, LogOut, ChevronLeft, CreditCard, Wallet, Smartphone,
  UserCheck, MapPinned, IdCard, ChevronRight as ChevronRightIcon, Key, FileText,
  CheckCircle2, AlertCircle, LayoutDashboard, BarChart3, Settings, MoreHorizontal,
  Home as HomeIcon, Coffee, Bed, Map as MapIcon, CircleUserRound, Store, Navigation2, LogIn,
  Repeat, Upload, X, Save, DollarSign, ChevronDown, ChevronUp, HelpCircle, Armchair
} from 'lucide-react';
import { getTravelAdvice } from './services/geminiService.ts';

type AuthMode = 'LOGIN' | 'REGISTER';
type AuthContext = 'USER' | 'PRO_ADMIN' | 'PRO_TRANSPORT' | 'PRO_SERVICE';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [authContext, setAuthContext] = useState<AuthContext>('USER');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  // Core Data
  const [allTrips, setAllTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [allCompanies, setAllCompanies] = useState<Company[]>(COMPANIES);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);

  // Simulation de sièges occupés avec leur genre respectif (pour informer le chercheur)
  // Fix: Shadows global Map constructor with Lucide Map icon. Renamed import to MapIcon.
  const [occupiedSeatsInfo] = useState<Map<string, Gender>>(new Map([
    ['5', 'MALE'], ['12', 'FEMALE'], ['18', 'MALE'], ['25', 'FEMALE'], 
    ['33', 'MALE'], ['48', 'FEMALE'], ['60', 'MALE'], ['2', 'FEMALE'], ['69', 'MALE']
  ]));

  // Auth Form State
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', gender: 'MALE' as Gender });
  const [errorMsg, setErrorMsg] = useState('');

  // Booking/Search State
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [bookingStep, setBookingStep] = useState<BookingStep>('TRIP_SELECT');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<{ [number: string]: Gender }>({});
  const [passengerDetails, setPassengerDetails] = useState<{ [seatNumber: string]: { firstName?: string, phone?: string, idNumber?: string } }>({});
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  
  // Search Inputs
  const [origin, setOrigin] = useState('');
  const [originStation, setOriginStation] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationStation, setDestinationStation] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('remembered_user');
    if (saved) { 
      const parsed = JSON.parse(saved);
      setUser(parsed); 
      setIsAuthenticated(true); 
    }
  }, []);

  const navigationDates = useMemo(() => {
    const current = new Date(departureDate);
    const prev = new Date(current); prev.setDate(current.getDate() - 1);
    const next = new Date(current); next.setDate(current.getDate() + 1);
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const iso = (d: Date) => d.toISOString().split('T')[0];
    return [
      { label: fmt(prev), value: iso(prev), type: 'prev' },
      { label: fmt(current), value: iso(current), type: 'current' },
      { label: fmt(next), value: iso(next), type: 'next' }
    ];
  }, [departureDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert("Veuillez choisir une ville de départ et une ville d'arrivée.");
      return;
    }
    const results = allTrips.filter(t => t.origin === origin && t.destination === destination);
    setSearchResults(results);
    setActiveTab(AppTab.SEARCH);
    setBookingStep('TRIP_SELECT');
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (authMode === 'REGISTER' && !acceptedLegal) {
      setErrorMsg('Veuillez accepter les conditions d\'utilisation.');
      return;
    }
    const role: UserRole = authContext === 'PRO_ADMIN' ? 'GLOBAL_ADMIN' : authContext === 'PRO_TRANSPORT' ? 'COMPANY_ADMIN' : authContext === 'PRO_SERVICE' ? 'SERVICE_PARTNER' : 'USER';
    const loggedUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: formData.firstName || 'Voyageur',
      lastName: formData.lastName || 'MSB',
      phone: formData.phone,
      email: formData.email,
      role,
      joinDate: new Date().toLocaleDateString()
    };
    if (rememberMe) localStorage.setItem('remembered_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setIsAuthenticated(true);
  };

  const renderAuth = () => (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto p-8 justify-center animate-in fade-in">
      <div className="flex flex-col items-center mb-10">
        <div className="bg-orange-600 w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-orange-200 mb-6 rotate-6 animate-bounce-slow">
          <ShieldCheck size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase text-center leading-none whitespace-nowrap">MON BILLET SECURISE</h1>
        <p className="text-slate-500 text-[8px] font-bold mt-3 text-center px-4 leading-tight uppercase tracking-[0.15em] opacity-70 whitespace-nowrap">
          VOTRE VOYAGE COMMENCE ICI, VOYAGEZ EN TOUTE SÉRÉNITÉ
        </p>
      </div>

      <div className="bg-white rounded-[3rem] p-7 shadow-2xl border border-slate-100">
        <div className="mb-8 text-center">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">
            {authMode === 'REGISTER' ? "Créer un compte" : (
              authContext === 'USER' ? "Connexion Voyageur" : 
              authContext === 'PRO_ADMIN' ? "Admin Système" :
              authContext === 'PRO_TRANSPORT' ? "Accès Transporteur" :
              "Accès Prestataire"
            )}
          </h3>
          {authContext !== 'USER' && (
            <button onClick={() => setAuthContext('USER')} className="text-[9px] font-black text-orange-600 uppercase mt-2 border-b border-orange-200">Retour Voyageur</button>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-bold mb-4 flex items-center gap-2 animate-in slide-in-from-top">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'REGISTER' && (
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Prénom" className="w-full bg-slate-50 py-4 px-4 rounded-2xl text-xs font-bold outline-none" required onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input type="text" placeholder="Nom" className="w-full bg-slate-50 py-4 px-4 rounded-2xl text-xs font-bold outline-none" required onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <div className="relative">
            {authContext === 'USER' ? <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
            <input type={authContext === 'USER' ? "tel" : "email"} placeholder={authContext === 'USER' ? "N° de téléphone" : "Email professionnel"} className="w-full bg-slate-50 py-4 pl-12 pr-4 rounded-2xl text-xs font-bold outline-none shadow-inner" required onChange={e => setFormData({...formData, phone: e.target.value, email: e.target.value})} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="password" placeholder="Mot de passe" className="w-full bg-slate-50 py-4 pl-12 pr-4 rounded-2xl text-xs font-bold outline-none shadow-inner" required onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-orange-600 focus:ring-orange-500" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Se souvenir de moi</span>
            </label>
            {authMode === 'LOGIN' && <button type="button" className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter hover:underline">Mot de passe oublié ?</button>}
          </div>

          {authMode === 'REGISTER' && (
            <label className="flex items-start gap-3 px-2 pt-2 cursor-pointer">
              <div className="relative mt-0.5">
                <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-200 checked:bg-orange-600 checked:border-orange-600 transition-all" checked={acceptedLegal} onChange={e => setAcceptedLegal(e.target.checked)} />
                <CheckCircle2 size={12} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity"/>
              </div>
              <span className="text-[10px] font-bold text-slate-500 leading-tight">
                J'ACCEPTE LES <span className="text-orange-600 underline uppercase">Conditions d'Utilisation</span> ET LA <span className="text-orange-600 underline uppercase">Politique de Confidentialité</span>.
              </span>
            </label>
          )}

          <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all mt-4 border-none">
            {authMode === 'REGISTER' ? "S'INSCRIRE" : "SE CONNECTER"}
          </button>
        </form>

        <button onClick={() => { setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setAuthContext('USER'); setErrorMsg(''); }} className="w-full text-[10px] font-bold text-slate-400 uppercase mt-8 text-center hover:text-orange-600 transition-colors">
          {authMode === 'LOGIN' ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
        </button>
      </div>

      <div className="mt-10 flex flex-col items-center animate-in slide-in-from-bottom duration-500">
           <div className="flex items-center gap-3 w-full mb-6 text-slate-300">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Espace Partenaires</span>
              <div className="h-px bg-slate-200 flex-1"></div>
           </div>
           <div className="flex justify-center gap-8">
              {['ADMIN', 'TRANSPORT', 'PRESTA'].map((p, i) => (
                <button key={p} onClick={() => setAuthContext(i === 0 ? 'PRO_ADMIN' : i === 1 ? 'PRO_TRANSPORT' : 'PRO_SERVICE')} className="group flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all border border-slate-100">
                    {i === 0 ? <LayoutDashboard size={20} /> : i === 1 ? <Truck size={20} /> : <Store size={20} />}
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{p}</span>
                </button>
              ))}
           </div>
        </div>
    </div>
  );

  const handleToggleSeat = (num: string) => {
    if (occupiedSeatsInfo.has(num)) return;
    if (selectedSeats[num]) {
      const newSeats = { ...selectedSeats };
      delete newSeats[num];
      setSelectedSeats(newSeats);
    } else {
      setSelectedSeats({ ...selectedSeats, [num]: 'MALE' });
    }
  };

  const nextBookingStep = () => {
    if (bookingStep === 'TRIP_SELECT') setBookingStep('SEAT_SELECT');
    else if (bookingStep === 'SEAT_SELECT') {
      if (Object.keys(selectedSeats).length === 0) { alert("Veuillez sélectionner au moins un siège."); return; }
      setBookingStep('PASSENGER_DETAILS');
    }
    else if (bookingStep === 'PASSENGER_DETAILS') {
      for (let seat of Object.keys(selectedSeats)) {
        const details = passengerDetails[seat];
        if (!details?.firstName || !details?.phone) {
          alert(`Veuillez remplir le nom et le téléphone pour le siège ${seat}`);
          return;
        }
      }
      setBookingStep('PAYMENT');
    }
    else if (bookingStep === 'PAYMENT') {
      if (!paymentMethod) { alert("Veuillez choisir un mode de paiement."); return; }
      const tickets: Ticket[] = Object.keys(selectedSeats).map(seat => ({
        id: 'MSB-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        tripId: selectedTrip?.id || '',
        passengerName: passengerDetails[seat]?.firstName || '',
        passengerPhone: passengerDetails[seat]?.phone || '',
        passengerIdNumber: passengerDetails[seat]?.idNumber,
        seatNumber: seat,
        bookingDate: new Date().toLocaleDateString(),
        travelDate: departureDate,
        returnDate: returnDate || undefined,
        originStation: originStation || origin,
        destinationStation: destinationStation || destination,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MSB-TICKET-${seat}-${Math.random()}`,
        status: 'CONFIRMED',
        price: selectedTrip?.price || 0,
        gender: selectedSeats[seat]
      }));
      setMyTickets([...tickets, ...myTickets]);
      setBookingStep('CONFIRMATION');
    }
  };

  if (!isAuthenticated) return renderAuth();

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role || 'USER'}>
      
      {activeTab === AppTab.HOME && (
        <div className="p-4 space-y-6 animate-in fade-in pb-24">
          <div className="bg-gradient-to-br from-orange-600 to-orange-500 -mx-4 -mt-4 p-8 rounded-b-[3.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1"><h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Salut,<br/>{user?.firstName}</h2><p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest">Où allons-nous aujourd'hui ?</p></div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20"><CircleUserRound size={28} /></div>
              </div>
              <form onSubmit={handleSearch} className="bg-white rounded-3xl p-5 shadow-2xl text-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Départ</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={14} /><select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full text-xs font-bold bg-slate-50 py-3.5 pl-9 rounded-xl outline-none appearance-none">{IVORIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Arrivée</label><div className="relative"><Navigation2 className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 rotate-90" size={14} /><select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full text-xs font-bold bg-slate-50 py-3.5 pl-9 rounded-xl outline-none appearance-none">{IVORIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                </div>
                {(origin === 'Abidjan' || destination === 'Abidjan') && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top">
                    {origin === 'Abidjan' && (<div className="space-y-1.5"><label className="text-[9px] font-black text-orange-600 uppercase ml-1 tracking-widest">Gare ABJ</label><select value={originStation} onChange={(e) => setOriginStation(e.target.value)} className="w-full text-[10px] font-bold bg-orange-50 py-3 px-3 rounded-xl outline-none border border-orange-100">{ABIDJAN_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>)}
                    {destination === 'Abidjan' && (<div className="space-y-1.5"><label className="text-[9px] font-black text-orange-600 uppercase ml-1 tracking-widest">Arrivée ABJ</label><select value={destinationStation} onChange={(e) => setDestinationStation(e.target.value)} className="w-full text-[10px] font-bold bg-orange-50 py-3 px-3 rounded-xl outline-none border border-orange-100">{ABIDJAN_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Date Aller</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={14} /><input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full text-[10px] font-bold bg-slate-50 py-3.5 pl-9 rounded-xl outline-none" min={new Date().toISOString().split('T')[0]} /></div></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Retour (Facultatif)</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full text-[10px] font-bold bg-slate-50 py-3.5 pl-9 rounded-xl outline-none" min={departureDate} /></div></div>
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-[11px] active:scale-95 transition-transform">Rechercher</button>
              </form>
            </div>
          </div>
          <section className="px-1"><h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]"><Truck size={18} className="text-orange-600" /> Nos Services Populaires</h3><div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Voiture Luxe', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=300&q=80', tag: 'A partir de 50.000F' },
              { title: 'Bus VIP', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80', tag: 'Climatisé & WiFi' },
              { title: 'Résidence', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80', tag: 'Assinie / Yakro' },
              { title: 'Restaurant', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80', tag: 'Gastronomie Locale' }
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group active:scale-95 transition-all">
                <div className="h-28 overflow-hidden relative"><img src={s.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute inset-0 bg-black/20" /></div>
                <div className="p-4 text-center"><p className="text-[10px] font-black uppercase text-slate-800">{s.title}</p><p className="text-[8px] font-bold text-orange-600 mt-1">{s.tag}</p></div>
              </div>
            ))}
          </div></section>
        </div>
      )}

      {activeTab === AppTab.SEARCH && (
        <div className="animate-in slide-in-from-bottom duration-300 pb-24 h-full flex flex-col">
          {bookingStep === 'TRIP_SELECT' && (
            <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
              <div className="flex items-center gap-2 p-4"><button onClick={() => setActiveTab(AppTab.HOME)} className="p-2 bg-slate-50 rounded-full text-slate-600"><ChevronLeft size={18}/></button><div className="flex-1 text-center"><h2 className="font-black text-sm uppercase tracking-tighter">{origin} ➔ {destination}</h2></div></div>
              <div className="flex justify-around items-center px-4 pb-4">
                {navigationDates.map((d, i) => (<button key={i} onClick={() => setDepartureDate(d.value)} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${d.type === 'current' ? 'bg-orange-600 text-white scale-110 shadow-lg px-4' : 'text-slate-400'}`}><span className="text-[8px] font-black uppercase tracking-widest">{d.type === 'prev' ? 'Hier' : d.type === 'next' ? 'Demain' : 'Choisie'}</span><span className="text-xs font-black">{d.label}</span></button>))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {bookingStep === 'TRIP_SELECT' && (
              <div className="space-y-4">
                {searchResults.length > 0 ? searchResults.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 group">
                    <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><img src={allCompanies.find(c => c.id === t.companyId)?.logo} className="w-10 h-10 rounded-xl object-cover" /><div><p className="text-[9px] font-black text-slate-400 uppercase">Compagnie</p><p className="font-black text-sm uppercase">{allCompanies.find(c => c.id === t.companyId)?.name}</p></div></div><div className="text-right"><p className="text-lg font-black text-orange-600">{t.price.toLocaleString()} <small className="text-[10px] text-slate-400">CFA</small></p></div></div>
                    <div className="flex justify-between items-center py-4 border-y border-slate-50 mb-4"><div className="text-center flex-1"><p className="text-sm font-black">{t.departureTime}</p><p className="text-[8px] font-bold text-slate-400 uppercase">Départ</p></div><div className="px-4 text-slate-200"><ArrowRight size={14}/></div><div className="text-center flex-1"><p className="text-sm font-black">{t.arrivalTime}</p><p className="text-[8px] font-bold text-slate-400 uppercase">Arrivée</p></div></div>
                    <button onClick={() => { setSelectedTrip(t); nextBookingStep(); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95">Choisir mon départ</button>
                  </div>
                )) : <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px]">Aucun départ ce jour</div>}
              </div>
            )}

            {bookingStep === 'SEAT_SELECT' && (
              <div className="space-y-6 animate-in slide-in-from-right h-full flex flex-col">
                <div className="flex items-center gap-3"><button onClick={() => setBookingStep('TRIP_SELECT')} className="p-2 bg-slate-50 rounded-full text-slate-600"><ChevronLeft size={18}/></button><h2 className="font-black text-sm uppercase tracking-tighter">Plan de Salle (70 Places)</h2></div>
                
                {/* Vue Bus Réaliste Horizontal Scrolling */}
                <div className="bg-slate-200 p-2 rounded-[3.5rem] border-4 border-slate-300 shadow-2xl overflow-x-auto relative flex-1 min-h-[450px] custom-scrollbar">
                   <div className="min-w-[1500px] h-full bg-white rounded-[3rem] p-8 relative">
                      {/* Volant Chauffeur */}
                      <div className="absolute left-8 top-[10%] w-16 h-16 bg-slate-100 rounded-full border-4 border-slate-200 flex items-center justify-center opacity-30 rotate-12"><div className="w-10 h-2 bg-slate-300 rounded-full" /></div>
                      
                      {/* Disposition : 2 places à droite, 3 places à gauche */}
                      <div className="grid grid-rows-6 grid-flow-col gap-x-4 gap-y-3 h-full items-center">
                         {Array.from({length: 14}, (_, col) => {
                           return Array.from({length: 6}, (__, row) => {
                             if (row === 2) return <div key={`aisle-${col}`} className="h-8" />; // Allée centrale

                             const seatIndex = col * 5 + (row > 2 ? row - 1 : row) + 1;
                             if (seatIndex > 70) return null;

                             const num = seatIndex.toString();
                             const isOccupied = occupiedSeatsInfo.has(num);
                             const genderOccupied = occupiedSeatsInfo.get(num);
                             const genderSelected = selectedSeats[num];
                             
                             return (
                               <button 
                                 key={num} 
                                 onClick={() => handleToggleSeat(num)} 
                                 disabled={isOccupied} 
                                 className={`w-12 h-12 rounded-2xl border-b-4 transition-all flex items-center justify-center relative group
                                   ${isOccupied ? 
                                     (genderOccupied === 'MALE' ? 'bg-blue-200 border-blue-300 text-blue-600' : 'bg-pink-200 border-pink-300 text-pink-600') : 
                                     genderSelected === 'MALE' ? 'bg-blue-500 border-blue-700 text-white shadow-lg' : 
                                     genderSelected === 'FEMALE' ? 'bg-pink-500 border-pink-700 text-white shadow-lg' : 
                                     'bg-white border-slate-200 text-slate-400 hover:border-orange-400'}`}
                               >
                                 <span className="text-[10px] font-black">{num}</span>
                                 {isOccupied && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border flex items-center justify-center">
                                      <div className={`w-1.5 h-1.5 rounded-full ${genderOccupied === 'MALE' ? 'bg-blue-600' : 'bg-pink-600'}`} />
                                    </div>
                                 )}
                                 {!isOccupied && genderSelected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border flex items-center justify-center">
                                      <div className={`w-1.5 h-1.5 rounded-full ${genderSelected === 'MALE' ? 'bg-blue-600' : 'bg-pink-600'}`} />
                                    </div>
                                 )}
                               </button>
                             )
                           });
                         })}
                      </div>
                   </div>
                </div>

                <div className="bg-white p-5 rounded-3xl flex justify-around gap-4 border border-slate-100 shadow-sm shrink-0">
                   <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 bg-white border-2 border-slate-200 rounded-md"/> <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Disponible</span></div>
                   <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 bg-blue-500 border-b-2 border-blue-700 rounded-md"/> <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Homme</span></div>
                   <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 bg-pink-500 border-b-2 border-pink-700 rounded-md"/> <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Femme</span></div>
                </div>

                <button onClick={nextBookingStep} className="w-full bg-orange-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all shrink-0 border-none">Valider les sièges ({Object.keys(selectedSeats).length})</button>
              </div>
            )}

            {bookingStep === 'PASSENGER_DETAILS' && (
              <div className="space-y-6 animate-in slide-in-from-right">
                <div className="flex items-center gap-3"><button onClick={() => setBookingStep('SEAT_SELECT')} className="p-2 bg-slate-50 rounded-full text-slate-600"><ChevronLeft size={18}/></button><h2 className="font-black text-sm uppercase tracking-tighter">Coordonnées Passager(s)</h2></div>
                {Object.keys(selectedSeats).map((seatNum, idx) => (
                   <div key={seatNum} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-black uppercase bg-orange-50 text-orange-600 px-3 py-1 rounded-full">Passager {idx + 1} - Siège {seatNum}</span>
                         <div className="flex gap-2">
                           <button onClick={() => setSelectedSeats({...selectedSeats, [seatNum]: 'MALE'})} className={`p-2 rounded-lg transition-all ${selectedSeats[seatNum] === 'MALE' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><User size={14}/></button>
                           <button onClick={() => setSelectedSeats({...selectedSeats, [seatNum]: 'FEMALE'})} className={`p-2 rounded-lg transition-all ${selectedSeats[seatNum] === 'FEMALE' ? 'bg-pink-600 text-white' : 'bg-slate-50 text-slate-400'}`}><User size={14}/></button>
                         </div>
                      </div>
                      <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={14} /><input type="text" placeholder="Nom et Prénoms (Obligatoire)" className="w-full bg-slate-50 py-3.5 pl-10 pr-4 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:border-orange-500" required value={passengerDetails[seatNum]?.firstName || ''} onChange={e => setPassengerDetails({...passengerDetails, [seatNum]: {...(passengerDetails[seatNum] || {}), firstName: e.target.value}})} /></div>
                      <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={14} /><input type="tel" placeholder="Numéro de téléphone (Obligatoire)" className="w-full bg-slate-50 py-3.5 pl-10 pr-4 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:border-orange-500" required value={passengerDetails[seatNum]?.phone || ''} onChange={e => setPassengerDetails({...passengerDetails, [seatNum]: {...(passengerDetails[seatNum] || {}), phone: e.target.value}})} /></div>
                      <div className="relative"><IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" placeholder="N° Pièce d'identité (Facultatif)" className="w-full bg-slate-50 py-3.5 pl-10 pr-4 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:border-orange-500" value={passengerDetails[seatNum]?.idNumber || ''} onChange={e => setPassengerDetails({...passengerDetails, [seatNum]: {...(passengerDetails[seatNum] || {}), idNumber: e.target.value}})} /></div>
                   </div>
                ))}
                <button onClick={nextBookingStep} className="w-full bg-orange-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all border-none">Étape Paiement</button>
              </div>
            )}

            {bookingStep === 'PAYMENT' && (
              <div className="space-y-6 animate-in slide-in-from-right">
                <div className="flex items-center gap-3"><button onClick={() => setBookingStep('PASSENGER_DETAILS')} className="p-2 bg-slate-50 rounded-full text-slate-600"><ChevronLeft size={18}/></button><h2 className="font-black text-sm uppercase tracking-tighter">Paiement Mobile Money</h2></div>
                <div className="bg-orange-600 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center mb-6"><div><p className="text-[10px] font-black uppercase opacity-75">Total à régler</p><p className="text-2xl font-black">{((selectedTrip?.price || 0) * Object.keys(selectedSeats).length).toLocaleString()} <small className="text-xs">CFA</small></p></div><Wallet size={32} className="opacity-50" /></div>
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { id: 'wave', name: 'Wave', color: 'bg-[#47A3FF]', logo: 'https://wave.com/static/wave-logo.svg' },
                     { id: 'orange', name: 'Orange Money', color: 'bg-[#FF7900]', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg' },
                     { id: 'mtn', name: 'MTN MoMo', color: 'bg-[#FFCC00]', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/af/MTN_Logo.svg' },
                     { id: 'moov', name: 'Moov Money', color: 'bg-[#003366]', logo: 'https://picsum.photos/seed/moov/40/40' },
                     { id: 'visa', name: 'Visa / Mastercard', color: 'bg-slate-900', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' }
                   ].map(method => (
                     <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`flex flex-col items-center p-5 rounded-[2.5rem] border-2 transition-all relative ${paymentMethod === method.id ? 'border-orange-600 bg-orange-50/50' : 'border-slate-50 bg-white'}`}><div className={`w-14 h-14 rounded-2xl mb-3 flex items-center justify-center ${method.color} shadow-lg overflow-hidden border border-white/20`}><img src={method.logo} className="w-10 h-10 object-contain brightness-110" /></div><span className="text-[9px] font-black uppercase text-slate-700">{method.name}</span>{paymentMethod === method.id && <div className="absolute top-2 right-2 text-orange-600"><CheckCircle2 size={16}/></div>}</button>
                   ))}
                </div>
                <button onClick={nextBookingStep} className="w-full bg-orange-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all mt-4 border-none">PAYER MAINTENANT</button>
              </div>
            )}

            {bookingStep === 'CONFIRMATION' && (
              <div className="text-center py-10 space-y-6 animate-in zoom-in">
                 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={64} className="text-green-600" /></div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Paiement Effectué !</h2>
                 <p className="text-[10px] text-slate-500 font-bold px-8 uppercase tracking-widest leading-relaxed">Vos billets ont été édités. Retrouvez-les dans l'onglet 'Billets'.</p>
                 <button onClick={() => { setActiveTab(AppTab.TICKETS); setBookingStep('TRIP_SELECT'); }} className="w-full bg-orange-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border-none">VOIR MES BILLETS</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === AppTab.TICKETS && (
        <div className="p-4 animate-in fade-in pb-24 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><TicketIcon className="text-orange-600" /> Mes Billets Payés</h2>
          {myTickets.length > 0 ? myTickets.map(t => (
            <div key={t.id} className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-slate-100 relative group animate-in slide-in-from-bottom duration-500 mb-6">
               <div className="p-6 border-b-2 border-dashed border-slate-100 relative">
                  <div className="absolute -left-3 bottom-0 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border border-slate-100" />
                  <div className="absolute -right-3 bottom-0 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border border-slate-100" />
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Référence Ticket</p>
                        <p className="text-sm font-black text-slate-900">{t.id}</p>
                     </div>
                     <span className="text-[8px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase border border-green-100">PAIEMENT RÉUSSI</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-5">
                    <div className="col-span-2">
                       <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Passager</p>
                       <p className="font-black text-xs uppercase text-slate-800">{t.passengerName}</p>
                       <p className="text-[9px] font-bold text-slate-400">{t.passengerPhone}</p>
                    </div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase mb-1">Trajet</p><p className="font-black text-[10px] uppercase text-slate-800">{t.originStation} ➔ {t.destinationStation}</p></div>
                    <div className="text-right"><p className="text-[8px] text-slate-400 font-black uppercase mb-1">Date Voyage</p><p className="font-black text-[10px] text-slate-800">{t.travelDate}</p></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase mb-1">Siège</p><p className="font-black text-[10px] uppercase text-orange-600">N° {t.seatNumber} ({t.gender === 'MALE' ? 'H' : 'F'})</p></div>
                    <div className="text-right"><p className="text-[8px] text-slate-400 font-black uppercase mb-1">Montant</p><p className="font-black text-[10px] text-slate-800">{t.price.toLocaleString()} CFA</p></div>
                  </div>
               </div>
               <div className="p-8 flex flex-col items-center bg-slate-50/50">
                  <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 transform hover:scale-105 transition-transform"><img src={t.qrCode} className="w-28 h-28" /></div>
                  <p className="text-[8px] font-black uppercase mt-4 text-slate-400 tracking-[0.2em]">Présentez ce QR Code à l'embarquement</p>
               </div>
            </div>
          )) : <div className="flex flex-col items-center py-20 text-slate-300 space-y-4"><TicketIcon size={64} className="opacity-20" /><p className="text-xs font-black uppercase tracking-widest text-center">Aucun billet trouvé</p></div>}
        </div>
      )}

      {activeTab === AppTab.PROFILE && (
        <div className="p-4 space-y-6 pb-24 animate-in slide-in-from-bottom">
          <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-600" />
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black mb-6 shadow-2xl bg-orange-600 rotate-3`}>{user?.firstName[0]}{user?.lastName[0]}</div>
            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter leading-none mb-1">{user?.firstName} {user?.lastName}</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
               <ShieldCheck size={14} /> {user?.role === 'GLOBAL_ADMIN' ? 'Administrateur' : 'Voyageur Certifié'}
            </div>
            
            <div className="w-full space-y-4 mt-6 pt-6 border-t border-slate-50">
               <div className="flex justify-between items-center"><div className="flex items-center gap-3 text-slate-400"><Phone size={16}/><span className="text-[10px] font-black uppercase">Téléphone</span></div><span className="text-xs font-black text-slate-800">{user?.phone}</span></div>
               <div className="flex justify-between items-center"><div className="flex items-center gap-3 text-slate-400"><Mail size={16}/><span className="text-[10px] font-black uppercase">Email</span></div><span className="text-xs font-black text-slate-800">{user?.email || 'N/A'}</span></div>
               <div className="flex justify-between items-center"><div className="flex items-center gap-3 text-slate-400"><Calendar size={16}/><span className="text-[10px] font-black uppercase">Membre depuis</span></div><span className="text-xs font-black text-slate-800">{user?.joinDate}</span></div>
            </div>
          </div>
          <div className="space-y-3">
             <button className="w-full p-6 bg-white rounded-[2rem] flex items-center justify-between border border-slate-100 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4"><Wallet size={20} className="text-orange-600"/> Mon Portefeuille</div><ChevronRight size={18} className="text-slate-300"/></button>
             <button className="w-full p-6 bg-white rounded-[2rem] flex items-center justify-between border border-slate-100 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4"><Settings size={20} className="text-orange-600"/> Paramètres du compte</div><ChevronRight size={18} className="text-slate-300"/></button>
             <button onClick={() => { localStorage.removeItem('remembered_user'); setIsAuthenticated(false); setUser(null); }} className="w-full p-6 bg-red-50 rounded-[2.5rem] text-red-600 flex items-center justify-between border border-red-100 font-black uppercase text-[10px] tracking-[0.2em] mt-8 shadow-lg active:scale-95 transition-all"><div className="flex items-center gap-4"><LogOut size={20}/> Déconnexion</div><ChevronRight size={18}/></button>
          </div>
        </div>
      )}

      {activeTab === AppTab.RENTAL && (
        <div className="p-4 space-y-6 pb-24 animate-in fade-in">
           <div className="bg-orange-600 text-white p-7 rounded-[3rem] shadow-xl mb-4">
              <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">Services & Location</h2>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-tight">Louez nos véhicules ou profitez de nos services partenaires</p>
           </div>
           
           <div className="space-y-8">
              <section>
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Car size={16} className="text-orange-600"/> Location de Voitures</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group">
                       <div className="h-28 overflow-hidden"><img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
                       <div className="p-4 text-center"><p className="text-[9px] font-black uppercase text-slate-800">Toyota Prado VIP</p><p className="text-[8px] text-orange-600 font-bold mt-1 uppercase tracking-widest">75.000F / Jour</p></div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group">
                       <div className="h-28 overflow-hidden"><img src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
                       <div className="p-4 text-center"><p className="text-[9px] font-black uppercase text-slate-800">Mercedes Classe C</p><p className="text-[8px] text-orange-600 font-bold mt-1 uppercase tracking-widest">100.000F / Jour</p></div>
                    </div>
                 </div>
              </section>

              <section>
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Truck size={16} className="text-orange-600"/> Transport de Groupe (Car/Bus)</h3>
                 <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-lg flex items-center p-3 relative group">
                    <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80" className="w-28 h-28 rounded-[2rem] object-cover" />
                    <div className="flex-1 px-5"><p className="text-[10px] font-black uppercase text-slate-800 mb-1">Bus VIP 45-70 Places</p><p className="text-[8px] text-slate-500 font-bold leading-relaxed">Idéal pour mariages, sorties d'entreprises ou convois religieux.</p><div className="bg-orange-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full mt-3 inline-block uppercase tracking-widest">Devis Gratuit</div></div>
                 </div>
              </section>

              <section>
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Store size={16} className="text-orange-600"/> Hébergement & Gastronomie</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group">
                       <div className="h-28 overflow-hidden"><img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
                       <div className="p-4 text-center"><p className="text-[9px] font-black uppercase text-slate-800">Restaurant Le Toit</p><p className="text-[8px] text-orange-600 font-bold mt-1 uppercase tracking-widest">Gastronomie Africaine</p></div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group">
                       <div className="h-28 overflow-hidden"><img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
                       <div className="p-4 text-center"><p className="text-[9px] font-black uppercase text-slate-800">Résidence Prestige</p><p className="text-[8px] text-orange-600 font-bold mt-1 uppercase tracking-widest">Yakro / Assinie</p></div>
                    </div>
                 </div>
              </section>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
