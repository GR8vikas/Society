import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Resident, Flat } from '../types';
import { Plus, Search, MoreVertical, Edit2, Trash2, UserPlus, Phone, Home, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ResidentManagement() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState<Resident>({
    name: '',
    flatId: '',
    contact: '',
    status: 'owner',
    moveInDate: new Date().toISOString(),
    emergencyContact: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resSnap = await getDocs(collection(db, 'residents'));
      const flatsSnap = await getDocs(collection(db, 'flats'));
      
      setResidents(resSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
      setFlats(flatsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flat)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'residents'), formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        flatId: '',
        contact: '',
        status: 'owner',
        moveInDate: new Date().toISOString(),
        emergencyContact: ''
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resident?')) {
      await deleteDoc(doc(db, 'residents', id));
      fetchData();
    }
  };

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.contact.includes(searchQuery)
  );

  const getFlatDisplay = (flatId: string) => {
    const flat = flats.find(f => f.id === flatId);
    return flat ? `${flat.wing}-${flat.flatNo}` : 'N/A';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resident Management</h2>
          <p className="text-slate-500">Add, edit and monitor society residents.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-navy/10"
        >
          <UserPlus className="w-5 h-5" />
          Add Resident
        </button>
      </div>

      <div className="bg-white rounded-xl border border-theme-border shadow-sm overflow-hidden text-sm">
        <div className="p-4 border-b border-theme-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-slate" />
            <input 
              type="text" 
              placeholder="Search by name or contact..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-theme-bg border border-theme-border rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f9fafb] text-theme-slate font-bold uppercase text-[0.7rem] tracking-wider">
              <tr>
                <th className="px-6 py-4">Name & Contact</th>
                <th className="px-6 py-4">Flat No.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Move-in Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading residents...</td></tr>
              ) : filteredResidents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No residents found.</td></tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {r.contact}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-slate-400" />
                        {getFlatDisplay(r.flatId)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        r.status === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber/20 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(r.moveInDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => r.id && handleDelete(r.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold italic serif">Add New Resident</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Contact No.</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                    placeholder="+91..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                  >
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Flat</label>
                <select 
                  required
                  value={formData.flatId}
                  onChange={e => setFormData({...formData, flatId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                >
                  <option value="">Choose a flat...</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>{f.wing}-{f.flatNo}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Emergency Contact</label>
                <input 
                  type="text" 
                  value={formData.emergencyContact}
                  onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                  placeholder="Relative's name/phone"
                />
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
                  className="flex-1 py-2 bg-navy text-white font-semibold rounded-lg hover:bg-slate-800 shadow-lg shadow-navy/20"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const X = ({ className, onClick }: any) => (
  <svg onClick={onClick} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
