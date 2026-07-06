import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Coins,
  History,
  Download,
  User,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { userProfile, wallet, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Trade', path: '/trade', icon: TrendingUp },
    { name: 'History', path: '/history', icon: History },
    { name: 'Deposit', path: '/deposit', icon: Download },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // If user is admin, add admin panel link
  const isAdmin = userProfile?.isAdmin === true;
  if (isAdmin) {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const initialOfUser = userProfile?.displayName
    ? userProfile.displayName.slice(0, 2).toUpperCase()
    : userProfile?.email
    ? userProfile.email.slice(0, 2).toUpperCase()
    : 'TR';

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0f0f0] flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#080808] border-b border-[#1a1a1a] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#D4AF37] to-[#F9E29B] rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-black rotate-45"></div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            Forex<span className="text-[#D4AF37]">Arena</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white p-1 focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:flex flex-col w-56 bg-[#080808] border-r border-[#1a1a1a] transition-transform duration-300 ease-in-out z-40 h-full md:min-h-screen shrink-0`}
      >
        {/* Brand Logo Header */}
        <div className="p-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#D4AF37] to-[#F9E29B] rounded-lg flex items-center justify-center shrink-0">
              <div className="w-4 h-4 border-2 border-black rotate-45"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Forex<span className="text-[#D4AF37]">Arena</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-r-md text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#121212] border-l-2 border-[#D4AF37] text-white font-semibold pl-3.5 shadow-[inset_4px_0_10px_rgba(212,175,55,0.03)]'
                    : 'text-gray-400 hover:text-white hover:bg-[#121212]/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile Summary */}
        <div className="p-6 mt-auto border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#D4AF37] flex items-center justify-center text-[10px] text-[#D4AF37] font-bold font-mono">
              {initialOfUser}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {userProfile?.displayName || 'Trader'}
              </span>
              <span className="text-[10px] text-gray-500 font-mono truncate">
                ID: {userProfile?.uid ? userProfile.uid.slice(0, 8).toUpperCase() : '842910'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs font-medium text-red-400 hover:text-red-300 flex items-center justify-center gap-2 border border-red-900/30 rounded bg-red-950/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#050505]">
        {/* Global Trading Header for Desktop/Tablet */}
        <header className="h-16 border-b border-[#1a1a1a] flex items-center px-6 justify-between bg-[#080808] sticky top-0 z-10 overflow-x-auto">
          <div className="flex items-center gap-8 md:gap-12 py-1">
            <div className="flex flex-col min-w-max">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Balance</span>
              <span className="text-sm font-bold font-mono text-zinc-100">{formatCurrency(wallet?.balance)}</span>
            </div>
            <div className="flex flex-col min-w-max">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Equity</span>
              <span className="text-sm font-bold font-mono text-[#D4AF37]">{formatCurrency(wallet?.equity)}</span>
            </div>
            <div className="flex flex-col min-w-max">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Today's P/L</span>
              <span className={`text-sm font-bold font-mono ${(wallet?.floatingPL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {(wallet?.floatingPL || 0) >= 0 ? '+' : ''}{formatCurrency(wallet?.floatingPL)}
              </span>
            </div>
            <div className="flex flex-col min-w-max">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Free Margin</span>
              <span className="text-sm font-bold font-mono text-zinc-100">{formatCurrency(wallet?.freeMargin)}</span>
            </div>
          </div>

          <div className="hidden sm:flex gap-4 items-center shrink-0">
            <div className="px-3 py-1 rounded bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live Market</span>
            </div>
            <div className="px-3 py-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
              {userProfile?.isAdmin ? 'Corporate Admin' : 'Gold Tier'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30 animate-fade-in"
        />
      )}
    </div>
  );
}

