
import React from 'react';
import { Home, Search, Ticket, User, MessageCircle, Car, Settings } from 'lucide-react';
import { AppTab, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  role: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, role }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="bg-orange-600 text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div>
          <h1 className="font-bold text-sm tracking-tight leading-none">MON BILLET SECURISE</h1>
          <p className="text-[10px] opacity-80 uppercase font-medium">{role === 'USER' ? 'Voyageur' : role === 'COMPANY_ADMIN' ? 'Gérant Compagnie' : 'Administrateur Général'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-[10px] font-bold">LIVE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-slate-200 px-4 py-3 flex justify-between items-center z-50">
        <NavItem 
          icon={<Home size={20} />} 
          label="Home" 
          active={activeTab === AppTab.HOME} 
          onClick={() => setActiveTab(AppTab.HOME)} 
        />
        <NavItem 
          icon={<Car size={20} />} 
          label="Rental" 
          active={activeTab === AppTab.RENTAL} 
          onClick={() => setActiveTab(AppTab.RENTAL)} 
        />
        <NavItem 
          icon={<MessageCircle size={20} />} 
          label="Aide" 
          active={activeTab === AppTab.ASSISTANT} 
          onClick={() => setActiveTab(AppTab.ASSISTANT)} 
        />
        <NavItem 
          icon={<Ticket size={20} />} 
          label="Billets" 
          active={activeTab === AppTab.TICKETS} 
          onClick={() => setActiveTab(AppTab.TICKETS)} 
        />
        {role !== 'USER' ? (
          <NavItem 
            icon={<Settings size={20} />} 
            label="Admin" 
            active={activeTab === AppTab.ADMIN_DASHBOARD} 
            onClick={() => setActiveTab(AppTab.ADMIN_DASHBOARD)} 
          />
        ) : (
          <NavItem 
            icon={<User size={20} />} 
            label="Profil" 
            active={activeTab === AppTab.PROFILE} 
            onClick={() => setActiveTab(AppTab.PROFILE)} 
          />
        )}
      </nav>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-200 flex-1 ${active ? 'text-orange-600' : 'text-slate-400'}`}
  >
    <div className={`${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className="text-[9px] font-bold uppercase">{label}</span>
  </button>
);

export default Layout;
