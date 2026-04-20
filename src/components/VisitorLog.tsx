import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Visitor, Flat } from '../types';
import { ShieldAlert, LogIn, LogOut, Clock, Plus, X, Search, User, Camera, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function VisitorLog() {
  const { auth } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [formData, setFormData] = useState<Visitor>({
    name: '',
    flatId: '',
    purpose: 'Guest',
    entryTime: new Date().toISOString(),
    photo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let vSnap;
      if (auth.role === 'resident' && auth.flatId) {
        vSnap = await getDocs(query(collection(db, 'visitors'), where('flatId', '==', auth.flatId), orderBy('entryTime', 'desc')));
      } else {
        vSnap = await getDocs(query(collection(db, 'visitors'), orderBy('entryTime', 'desc')));
      }
      const fSnap = await getDocs(collection(db, 'flats'));
      
      setVisitors(vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor)));
      setFlats(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flat)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (e) {
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const data = canvas.toDataURL('image/jpeg', 0.7);
      setFormData({ ...formData, photo: data });
      stopCamera();
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      await updateDoc(doc(db, 'visitors', id), {
        exitTime: new Date().toISOString()
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const getFlatName = (id: string) => {
    const flat = flats.find(f => f.id === id);
    return flat ? `${flat.wing}-${flat.flatNo}` : 'N/A';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans">
            {auth.role === 'resident' ? 'My Visitors' : 'Visitor Management'}
          </h2>
          <p className="text-slate-500">
            {auth.role === 'resident' ? 'View visitor log restricted to your flat.' : 'Security gate logging system for guest entries and exits.'}
          </p>
        </div>
        {auth.role === 'admin' && (
          <button 
            onClick={() => {
              setFormData({ name: '', flatId: '', purpose: 'Guest', entryTime: new Date().toISOString(), photo: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-black transition-all shadow-lg"
          >
            <LogIn className="w-5 h-5" />
            Log New Entry
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-theme-border shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f9fafb] text-theme-slate font-bold uppercase text-[0.7rem] tracking-wider">
              <tr>
                <th className="px-6 py-4">Visitor Name</th>
                <th className="px-6 py-4">Flat Visited</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Entry Time</th>
                <th className="px-6 py-4">Exit Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Syncing gates...</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No visitor records today.</td></tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
                           {v.photo ? (
                             <img src={v.photo} alt={v.name} className="w-full h-full object-cover" />
                           ) : (
                             <User className="w-5 h-5" />
                           )}
                        </div>
                        <p className="font-bold text-slate-900">{v.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {getFlatName(v.flatId)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold text-slate-500">
                        {v.purpose}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                       {format(new Date(v.entryTime), 'p, MMM dd')}
                    </td>
                    <td className="px-6 py-4">
                      {v.exitTime ? (
                        <p className="text-slate-500 font-medium">{format(new Date(v.exitTime), 'p, MMM dd')}</p>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          Still Inside
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!v.exitTime && auth.role === 'admin' && (
                        <button 
                          onClick={() => v.id && handleCheckout(v.id)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <LogOut className="w-3 h-3" />
                          Checkout
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold italic serif">Visitor Entry Log</h3>
              <button 
                onClick={() => {
                  stopCamera();
                  setIsModalOpen(false);
                }} 
                className="p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addDoc(collection(db, 'visitors'), formData);
                setIsModalOpen(false);
                fetchData();
              } catch (e) {
                console.error(e);
              }
            }} className="p-6 space-y-4">
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl relative group">
                {showCamera ? (
                  <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    <button 
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 p-3 rounded-full shadow-lg hover:bg-slate-100"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                ) : formData.photo ? (
                  <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden">
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={startCamera}
                      className="absolute top-2 right-2 bg-white/80 p-2 rounded-lg backdrop-blur-sm hover:bg-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={startCamera}
                    className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold uppercase">Take Visitor Selfie</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Visitor Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                  placeholder="e.g. Michael Smith"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Visiting Unit</label>
                <select 
                  required
                  value={formData.flatId}
                  onChange={e => setFormData({...formData, flatId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                >
                  <option value="">Choose Unit...</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>{f.wing}-{f.flatNo}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Purpose</label>
                <select 
                  value={formData.purpose}
                  onChange={e => setFormData({...formData, purpose: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                >
                  <option>Guest</option>
                  <option>Delivery</option>
                  <option>Maintenance Staff</option>
                  <option>Others</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-black shadow-lg"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
