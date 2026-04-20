import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Complaint, Resident, Flat } from '../types';
import { MessageSquare, CheckCircle2, Clock, Hammer, Plus, X, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function Complaints() {
  const { auth } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Complaint>({
    residentId: '',
    flatId: '',
    type: 'Plumbing',
    description: '',
    status: 'Open',
    createdAt: new Date().toISOString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let cSnap;
      if (auth.role === 'resident' && auth.flatId) {
        cSnap = await getDocs(query(collection(db, 'complaints'), where('flatId', '==', auth.flatId), orderBy('createdAt', 'desc')));
      } else {
        cSnap = await getDocs(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')));
      }
      const rSnap = await getDocs(collection(db, 'residents'));
      const fSnap = await getDocs(collection(db, 'flats'));
      
      setComplaints(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint)));
      setResidents(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
      setFlats(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flat)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Complaint['status']) => {
    try {
      await updateDoc(doc(db, 'complaints', id), { status: newStatus });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const getResidentName = (id: string) => residents.find(r => r.id === id)?.name || 'Guest';
  const getFlatName = (id: string) => {
    const flat = flats.find(f => f.id === id);
    return flat ? `${flat.wing}-${flat.flatNo}` : 'N/A';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans">
            {auth.role === 'resident' ? 'My Complaints' : 'Service Requests'}
          </h2>
          <p className="text-slate-500">
            {auth.role === 'resident' ? 'Track your service requests and reports.' : 'Track and manage resident complaints and maintenance tasks.'}
          </p>
        </div>
        <button 
          onClick={() => {
            setFormData({ 
              residentId: (auth.role === 'resident' && residents.find(r => r.flatId === auth.flatId)?.id) || '', 
              flatId: auth.flatId || '', 
              type: 'Plumbing', 
              description: '', 
              status: 'Open', 
              createdAt: new Date().toISOString() 
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
        >
          <Plus className="w-5 h-5" />
          Raise Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Open', 'In Progress', 'Resolved'].map((status) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${
                    status === 'Open' ? 'bg-rose-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500'
                 }`}></div>
                 {status}
               </h3>
               <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                 {complaints.filter(c => c.status === status).length}
               </span>
            </div>
            <div className="space-y-4 min-h-[500px]">
              {complaints.filter(c => c.status === status).map((complaint) => (
                <div key={complaint.id} className="bg-white rounded-xl border border-theme-border shadow-sm group hover:border-slate-300 transition-all flex flex-col italic overflow-hidden">
                  <div className="p-4 px-5 border-b border-theme-border bg-theme-bg/30 text-[10px] font-bold uppercase tracking-tight text-theme-slate flex justify-between items-center">
                    <span className="font-black italic text-navy">{complaint.type}</span>
                    <span>{format(new Date(complaint.createdAt), 'MMM dd')}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm font-bold text-navy mb-4 leading-snug">{complaint.description}</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-theme-border flex items-center justify-center text-navy font-bold text-[10px]">
                        {getResidentName(complaint.residentId).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate text-navy">{getResidentName(complaint.residentId)}</p>
                        <p className="text-[10px] text-theme-slate">Unit: {getFlatName(complaint.flatId)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 px-5 border-t border-slate-50 flex gap-2">
                    {auth.role === 'admin' && status === 'Open' && (
                       <button 
                         onClick={() => complaint.id && updateStatus(complaint.id, 'In Progress')}
                         className="flex-1 py-1.5 bg-[#fef3c7] text-[#92400e] text-[0.7rem] font-bold uppercase tracking-wider rounded-md transition-all hover:bg-amber-100"
                       >
                         Start Work
                       </button>
                    )}
                    {auth.role === 'admin' && (status === 'Open' || status === 'In Progress') && (
                       <button 
                         onClick={() => complaint.id && updateStatus(complaint.id, 'Resolved')}
                         className="flex-1 py-1.5 bg-[#d1fae5] text-[#065f46] text-[0.7rem] font-bold uppercase tracking-wider rounded-md transition-all hover:bg-emerald-100"
                       >
                         Resolve
                       </button>
                    )}
                  </div>
                </div>
              ))}
              {complaints.filter(c => c.status === status).length === 0 && (
                <div className="border border-dashed border-slate-200 rounded-2xl py-12 flex items-center justify-center text-slate-400 italic text-xs">
                  No {status.toLowerCase()} requests
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-rose-500 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold italic serif">Log Service Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const resident = residents.find(r => r.id === formData.residentId);
                await addDoc(collection(db, 'complaints'), {
                  ...formData,
                  flatId: resident ? resident.flatId : ''
                });
                setIsModalOpen(false);
                fetchData();
              } catch (e) {
                console.error(e);
              }
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Resident Name</label>
                <select 
                  required
                  value={formData.residentId}
                  onChange={e => setFormData({...formData, residentId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500"
                >
                  <option value="">Select Resident...</option>
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - ({getFlatName(r.flatId)})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Type of Issue</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500"
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Cleaning</option>
                  <option>Security</option>
                  <option>Elevator</option>
                  <option>Others</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Issue Description</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 resize-none"
                  placeholder="Tell us what's wrong..."
                ></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
