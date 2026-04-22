import React, { useState } from 'react';
import { Building2, ShieldAlert, Users, ChevronRight, UserPlus, LogIn as LogInIcon, Mail, Lock, Phone } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { forceRefresh } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'selection' | 'admin_login' | 'resident_login' | 'resident_register'>('selection');
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Unified login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Registration state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    contact: '',
    wing: 'A',
    flatNo: '',
    type: '2 BHK'
  });

  const handleLogin = async (e: React.FormEvent, type: 'admin' | 'resident') => {
    e.preventDefault();
    setErrorInfo(null);
    if (!loginData.email || !loginData.password) {
      setErrorInfo("Please fill all fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      // Let AuthContext handle resolution!
    } catch (error: any) {
      console.error("Login attempt failed:", error);
      
      const safeEmail = loginData.email.toLowerCase().trim();
      const isAdminEmail = safeEmail.startsWith('admin') || 
                           safeEmail.includes('unitysquare.com') || 
                           safeEmail === 'vikaspat371@gmail.com';

      // Auto-create dummy admin to save prototype setups
      if (type === 'admin' && isAdminEmail) {
        try {
          // If login failed for an admin email, try creating it.
          await createUserWithEmailAndPassword(auth, loginData.email, loginData.password);
          return; // Success!
        } catch (e2: any) {
          // If creation fails because it exists, the password was just wrong.
          if (e2.code === 'auth/email-already-in-use') {
            setErrorInfo('Incorrect password for this Admin account.');
          } else {
            setErrorInfo('Setup error: Please check your password length (min 6 characters).');
          }
        }
      } else {
        // Resident or non-admin failure
        if (type === 'resident') {
          setErrorInfo("Incorrect Email or Password. If you are new, please Register your flat.");
        } else {
          setErrorInfo("Admin login denied: Incorrect Email or Password.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    if (!regData.name || !regData.flatNo || !regData.contact || !regData.email || !regData.password) {
      setErrorInfo("Please fill all fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Create Firebase Auth User
      const userCred = await createUserWithEmailAndPassword(auth, regData.email, regData.password);

      // 2. Create the Flat mapping
      const flatRef = await addDoc(collection(db, 'flats'), {
        wing: regData.wing,
        flatNo: regData.flatNo,
        occupancy: 'occupied',
        type: regData.type,
        size: 'Standard'
      });

      // 3. Create the Resident mapping linking to Firebase UID
      await addDoc(collection(db, 'residents'), {
        userId: userCred.user.uid,
        email: userCred.user.email,
        name: regData.name,
        contact: regData.contact,
        flatId: flatRef.id,
        status: 'owner',
        moveInDate: new Date().toISOString(),
        emergencyContact: ''
      });

      // 4. Force auth refresh since user is already logged in securely via Auth instance
      forceRefresh();
      
    } catch (error: any) {
      console.error("Registration failed", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorInfo("This email is already registered. Please go back and login.");
      } else if (error.code === 'auth/weak-password') {
        setErrorInfo("Password is too weak. Please use at least 6 characters.");
      } else {
        setErrorInfo("Registration Failed. Please check your details and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col items-start justify-center p-8">
          <div className="w-16 h-16 bg-amber rounded-2xl flex items-center justify-center font-bold text-navy text-4xl mb-6 shadow-xl shadow-amber/20">
            U
          </div>
          <h1 className="text-4xl font-black text-navy tracking-tight mb-4">Unity Square</h1>
          <p className="text-theme-slate text-lg leading-relaxed">
            Welcome to the modern society management platform. Securely login with your verified credentials.
          </p>
        </div>

        {/* Right Side: Flow */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-theme-border flex flex-col min-h-[400px] justify-center relative">
          
          {view === 'selection' && (
            <div className="space-y-6">
              <div className="text-center mb-8 md:hidden">
                <div className="w-12 h-12 bg-amber rounded-xl flex items-center justify-center font-bold text-navy text-2xl mx-auto mb-4">U</div>
                <h1 className="text-2xl font-black text-navy tracking-tight">Unity Square</h1>
              </div>

              <h2 className="text-2xl font-bold text-navy mb-8 text-center text-sans">Select Login Portal</h2>
              
              <button 
                onClick={() => setView('resident_login')}
                className="w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-amber hover:bg-amber/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-amber group-hover:bg-amber group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-navy text-lg">Resident Portal</p>
                    <p className="text-sm text-theme-slate">Manage your flat, dues & reports</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber" />
              </button>

              <button 
                onClick={() => setView('admin_login')}
                className="w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-navy hover:bg-navy/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-navy text-lg">Admin / Security</p>
                    <p className="text-sm text-theme-slate">Full society management access</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-navy" />
              </button>
            </div>
          )}

          {/* ADMIN LOGIN */}
          {view === 'admin_login' && (
            <div className="space-y-6 flex flex-col h-full">
              <button onClick={() => { setView('selection'); setErrorInfo(null); }} className="text-sm font-bold text-theme-slate uppercase tracking-wider hover:text-navy flex items-center gap-1 w-fit absolute top-6 left-6">
                ← Back
              </button>

              <div className="pt-8 w-full max-w-sm mx-auto">
                <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-navy text-center mb-8">Admin Access</h2>

                <form onSubmit={(e) => handleLogin(e, 'admin')} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase">Admin Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" required value={loginData.email} onChange={e => { setLoginData({...loginData, email: e.target.value}); setErrorInfo(null); }}
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" 
                        placeholder="admin@unitysquare.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" required value={loginData.password} onChange={e => { setLoginData({...loginData, password: e.target.value}); setErrorInfo(null); }}
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {errorInfo && (
                    <p className="text-red-500 text-xs font-bold mt-1 text-center bg-red-50 p-2 rounded-lg border border-red-100">
                      {errorInfo}
                    </p>
                  )}

                  <button 
                    disabled={isSubmitting} type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-navy text-white rounded-xl font-bold transition-all hover:bg-slate-800 shadow-sm mt-6"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {isSubmitting ? 'Authenticating...' : 'Secure Login'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* RESIDENT LOGIN */}
          {view === 'resident_login' && (
            <div className="space-y-6 flex flex-col h-full">
              <button onClick={() => { setView('selection'); setErrorInfo(null); }} className="text-sm font-bold text-theme-slate uppercase tracking-wider hover:text-navy flex items-center gap-1 w-fit absolute top-6 left-6">
                ← Back
              </button>

              <div className="pt-8 w-full max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber rounded-xl flex items-center justify-center mx-auto mb-4 text-navy">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-navy text-center mb-8">Resident Portal</h2>

                <form onSubmit={(e) => handleLogin(e, 'resident')} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" required value={loginData.email} onChange={e => { setLoginData({...loginData, email: e.target.value}); setErrorInfo(null); }}
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" required value={loginData.password} onChange={e => { setLoginData({...loginData, password: e.target.value}); setErrorInfo(null); }}
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {errorInfo && (
                    <p className="text-red-500 text-xs font-bold mt-1 text-center bg-red-50 p-2 rounded-lg border border-red-100">
                      {errorInfo}
                    </p>
                  )}

                  <button 
                    disabled={isSubmitting} type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-amber text-navy rounded-xl font-bold transition-all hover:bg-amber-600 shadow-sm mt-6"
                  >
                    <LogInIcon className="w-5 h-5" />
                    {isSubmitting ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-500 mb-4">Don't have an account or new to the society?</p>
                  <button 
                    onClick={() => setView('resident_register')}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-slate-50 text-navy border border-slate-200 hover:border-amber rounded-xl font-bold transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register Your Flat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESIDENT REGISTER */}
          {view === 'resident_register' && (
             <div className="space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar px-1 py-1">
              <button onClick={() => { setView('resident_login'); setErrorInfo(null); }} className="text-sm font-bold text-theme-slate uppercase tracking-wider hover:text-navy flex items-center gap-1 w-fit sticky top-0 bg-white z-10 pb-4">
                ← Back
              </button>

              <div className="pt-2">
                <h2 className="text-2xl font-bold text-navy mb-2 text-center text-sans">New Resident Setup</h2>
                <p className="text-sm text-theme-slate text-center mb-6">Create your account and register your flat securely.</p>
                
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Account Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Email Address</label>
                      <input 
                        required type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                        placeholder="name@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Account Password</label>
                      <input 
                        required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                        placeholder="Min 6 characters" minLength={6}
                      />
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Full Name</label>
                    <input 
                      required type="text" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                      placeholder="Your First & Last Name"
                    />
                  </div>
                  
                  {/* Flat Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Wing / Block</label>
                      <select 
                        value={regData.wing} onChange={e => setRegData({...regData, wing: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="A">A Wing</option>
                        <option value="B">B Wing</option>
                        <option value="C">C Wing</option>
                        <option value="D">D Wing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Flat Number</label>
                      <input 
                        required type="text" value={regData.flatNo} onChange={e => setRegData({...regData, flatNo: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                        placeholder="e.g. 101"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Contact Number</label>
                      <input 
                        required type="tel" value={regData.contact} onChange={e => { setRegData({...regData, contact: e.target.value}); setErrorInfo(null); }}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-amber focus:ring-1 focus:ring-amber outline-none" 
                        placeholder="+91..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Configuration</label>
                      <select 
                        value={regData.type} onChange={e => setRegData({...regData, type: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                        <option value="Penthouse">Penthouse</option>
                      </select>
                    </div>
                  </div>

                  {errorInfo && (
                    <p className="text-red-500 text-xs font-bold mt-1 text-center bg-red-50 p-2 rounded-lg border border-red-100">
                      {errorInfo}
                    </p>
                  )}

                  <button 
                    disabled={isSubmitting} type="submit"
                    className="w-full flex items-center justify-center gap-2 p-3 bg-navy text-white rounded-xl font-bold transition-all hover:bg-slate-800 shadow-sm mt-4 disabled:opacity-70"
                  >
                    <UserPlus className="w-5 h-5" />
                    {isSubmitting ? 'Registering...' : 'Register Securely'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
