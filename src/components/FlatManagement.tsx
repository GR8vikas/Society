import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Flat } from '../types';
import { Building2, Plus, Search, Layers, Square, UserCheck, X } from 'lucide-react';

export default function FlatManagement() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterWing, setFilterWing] = useState('All');

  const [formData, setFormData] = useState<Flat>({
    wing: 'A',
    flatNo: '',
    occupancy: 'vacant',
    type: '2BHK',
    size: '1200'
  });

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'flats'));
      setFlats(snap.docs.map(d => ({ id: d.id, ...d.data() } as Flat)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'flats'), formData);
      setIsModalOpen(false);
      setFormData({ wing: 'A', flatNo: '', occupancy: 'vacant', type: '2BHK', size: '1200' });
      fetchFlats();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredFlats = filterWing === 'All' ? flats : flats.filter(f => f.wing === filterWing);
  const wings = ['All', ...Array.from(new Set(flats.map(f => f.wing)))].sort();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans">Flat & Unit Management</h2>
          <p className="text-slate-500">Manage blocks, wings and individual housing units.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" />
          Add New Unit
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {wings.map(wing => (
          <button 
            key={wing}
            onClick={() => setFilterWing(wing)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
              filterWing === wing 
                ? 'bg-navy text-white shadow-md shadow-navy/20' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-navy hover:text-navy'
            }`}
          >
            {wing === 'All' ? 'All Units' : `Wing ${wing}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFlats.map((flat) => (
            <div key={flat.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${flat.occupancy === 'occupied' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  <Building2 className={`w-5 h-5 ${flat.occupancy === 'occupied' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  flat.occupancy === 'occupied' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {flat.occupancy}
                </span>
              </div>
              <h4 className="text-xl font-bold flex items-baseline gap-1">
                <span className="text-slate-400 text-sm font-medium">UNIT</span>
                {flat.wing}-{flat.flatNo}
              </h4>
              <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Layers className="w-3 h-3" /> {flat.type}
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Layers className="w-3 h-3" /> {flat.size} sq.ft
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-slate-50 flex items-center justify-between">
                <button className="text-xs font-bold text-navy hover:text-amber-500 transition-colors uppercase tracking-tight">View Details</button>
                <div className="flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-amber-500 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold italic serif">Add Housing Unit</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Wing / Block</label>
                  <input 
                    required
                    type="text" 
                    value={formData.wing}
                    onChange={e => setFormData({...formData, wing: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/5 focus:border-amber-500"
                    placeholder="e.g. A"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Flat Number</label>
                  <input 
                    required
                    type="text" 
                    value={formData.flatNo}
                    onChange={e => setFormData({...formData, flatNo: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/5 focus:border-amber-500"
                    placeholder="e.g. 101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Unit Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/5 focus:border-amber-500"
                  >
                    <option>1BHK</option>
                    <option>2BHK</option>
                    <option>3BHK</option>
                    <option>Penthouse</option>
                    <option>Studio</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Size (sq.ft)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/5 focus:border-amber-500"
                    placeholder="1200"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Initial Status</label>
                <div className="flex gap-2">
                   {['occupied', 'vacant'].map(status => (
                     <button
                       key={status}
                       type="button"
                       onClick={() => setFormData({...formData, occupancy: status as any})}
                       className={`flex-1 py-2 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all ${
                         formData.occupancy === status 
                          ? 'bg-navy text-white border-navy' 
                          : 'bg-white text-slate-500 border-slate-200'
                       }`}
                     >
                       {status}
                     </button>
                   ))}
                </div>
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
                  className="flex-1 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
