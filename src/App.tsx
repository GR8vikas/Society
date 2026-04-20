/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Building2, 
  CreditCard, 
  MessageSquare, 
  ShieldAlert, 
  Menu, 
  X,
  Bell,
  Search,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Context & Auth
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';

// Pages
import Dashboard from './components/Dashboard';
import ResidentManagement from './components/ResidentManagement';
import FlatManagement from './components/FlatManagement';
import MaintenanceBilling from './components/MaintenanceBilling';
import NoticeBoard from './components/NoticeBoard';
import Complaints from './components/Complaints';
import VisitorLog from './components/VisitorLog';

const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-6 py-3 transition-all duration-200 border-l-4 text-sm font-medium",
      active 
        ? "bg-navy-light text-white border-amber" 
        : "text-white/70 border-transparent hover:text-white hover:bg-white/5"
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { auth, logout } = useAuth();
  
  return (
    <header className="h-[70px] border-b border-theme-border bg-white flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-theme-slate hover:bg-theme-bg rounded-md">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight hidden lg:block">
          {auth.role === 'resident' ? 'Resident Portal' : 'Overview'}
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold leading-none">{auth.residentName || 'Admin User'}</p>
          <p className="text-[0.75rem] text-theme-slate mt-1">{auth.flatName || 'Managing Block A & B'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="avatar w-9 h-9 bg-theme-border rounded-full flex items-center justify-center text-xs font-bold text-navy">
            {auth.role === 'resident' ? 'RE' : 'AD'}
          </div>
          <button 
            onClick={logout}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

const ProtectedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { auth } = useAuth();

  const adminNavItems = [
    { to: '/', icon: BarChart3, label: 'Dashboard' },
    { to: '/residents', icon: Users, label: 'Residents' },
    { to: '/flats', icon: Building2, label: 'Flats & Units' },
    { to: '/maintenance', icon: CreditCard, label: 'Maintenance' },
    { to: '/notices', icon: Bell, label: 'Notice Board' },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
    { to: '/visitors', icon: ShieldAlert, label: 'Visitor Logs' },
  ];

  const residentNavItems = [
    { to: '/', icon: BarChart3, label: 'Dashboard' },
    { to: '/maintenance', icon: CreditCard, label: 'My Dues' },
    { to: '/visitors', icon: ShieldAlert, label: 'My Visitors' },
    { to: '/complaints', icon: MessageSquare, label: 'My Complaints' },
    { to: '/notices', icon: Bell, label: 'Notice Board' },
  ];

  const navItems = auth.role === 'resident' ? residentNavItems : adminNavItems;

  return (
    <div className="flex min-h-screen bg-theme-bg font-sans">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[240px] bg-navy text-white transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col py-6">
          <div className="px-6 pb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber rounded-md flex items-center justify-center font-bold text-navy">U</div>
              <span className="text-xl font-bold tracking-tighter">Unity Square</span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <nav className="flex-1">
            {navItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to} 
              />
            ))}
          </nav>

          <div className="px-6 mt-auto px-6">
            <div className="bg-navy-light p-3 rounded-lg text-[0.75rem]">
              <div className="opacity-60 mb-1">Server Status</div>
              <div className="flex items-center gap-2 font-medium italic">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Operational
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/maintenance" element={<MaintenanceBilling />} />
            <Route path="/notices" element={<NoticeBoard />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/visitors" element={<VisitorLog />} />
            {auth.role === 'admin' && (
              <>
                <Route path="/residents" element={<ResidentManagement />} />
                <Route path="/flats" element={<FlatManagement />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent = () => {
  const { auth, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-theme-slate">
          <div className="w-12 h-12 border-4 border-amber border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold tracking-widest uppercase text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!auth.role) {
    return <Login />;
  }

  return <ProtectedLayout />;
};
