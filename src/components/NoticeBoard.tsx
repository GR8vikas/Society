import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notice } from '../types';
import { Bell, Megaphone, Calendar, Tag, Plus, X, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function NoticeBoard() {
  const { auth } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  const [formData, setFormData] = useState<Notice>({
    title: '',
    content: '',
    category: 'general',
    date: new Date().toISOString()
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'notices'), orderBy('date', 'desc')));
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notices'), formData);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', category: 'general', date: new Date().toISOString() });
      fetchNotices();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotices = filter === 'All' ? notices : notices.filter(n => n.category === filter.toLowerCase());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans">Notice Board</h2>
          <p className="text-slate-500">Official announcements and important society events.</p>
        </div>
        {auth.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Megaphone className="w-5 h-5" />
            Post Notice
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-2 border border-slate-200 rounded-xl overflow-x-auto">
        <div className="flex items-center gap-2 px-3 border-r border-slate-100 shrink-0">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Filter</span>
        </div>
        {['All', 'General', 'Urgent', 'Event'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
               <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <h3 className="text-slate-500 font-medium">No active notices found.</h3>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-xl border border-theme-border shadow-sm hover:shadow-md transition-all divide-y divide-slate-50 italic overflow-hidden">
                <div className="p-4 px-6">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[0.7rem] font-bold text-theme-slate uppercase tracking-wider">
                      {format(new Date(notice.date), 'MMM dd, yyyy')} • {notice.category}
                    </p>
                    <span className={`w-2 h-2 rounded-full ${
                      notice.category === 'urgent' ? 'bg-rose-500' :
                      notice.category === 'event' ? 'bg-amber' : 'bg-blue-500'
                    }`}></span>
                  </div>
                  <h3 className="text-base font-bold text-navy">{notice.title}</h3>
                </div>
                <div className="p-6 pt-2">
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{notice.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold italic serif">Create Society Notice</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <span className="sr-only">Close</span>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Notice Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600"
                  placeholder="e.g. Annual Maintenance Work"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <div className="flex gap-2">
                   {['general', 'urgent', 'event'].map(cat => (
                     <button
                       key={cat}
                       type="button"
                       onClick={() => setFormData({...formData, category: cat as any})}
                       className={`flex-1 py-2 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all ${
                         formData.category === cat 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-500 border-slate-200'
                       }`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Description / Content</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 resize-none"
                  placeholder="Type the notice details here..."
                ></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
