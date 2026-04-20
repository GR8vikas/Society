import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MaintenanceBill, Flat } from '../types';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Plus, FileText, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceBilling() {
  const { auth } = useAuth();
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<MaintenanceBill>({
    flatId: '',
    amount: 0,
    dueDate: new Date().toISOString(),
    status: 'pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let billsSnap;
      if (auth.role === 'resident' && auth.flatId) {
        billsSnap = await getDocs(query(collection(db, 'maintenance'), where('flatId', '==', auth.flatId), orderBy('dueDate', 'desc')));
      } else {
        billsSnap = await getDocs(query(collection(db, 'maintenance'), orderBy('dueDate', 'desc')));
      }
      const flatsSnap = await getDocs(collection(db, 'flats'));
      
      setBills(billsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceBill)));
      setFlats(flatsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flat)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (billId: string) => {
    try {
      await updateDoc(doc(db, 'maintenance', billId), {
        status: 'paid',
        paymentDate: new Date().toISOString()
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const getFlatName = (flatId: string) => {
    const flat = flats.find(f => f.id === flatId);
    return flat ? `${flat.wing}-${flat.flatNo}` : 'N/A';
  };

  const stats = {
    total: bills.length,
    paid: bills.filter(b => b.status === 'paid').length,
    pending: bills.filter(b => b.status === 'pending').length,
    overdue: bills.filter(b => b.status === 'overdue').length,
    totalAmount: bills.reduce((acc, b) => acc + (b.status === 'paid' ? b.amount : 0), 0)
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {auth.role === 'resident' ? 'My Maintenance Dues' : 'Maintenance & Billing'}
          </h2>
          <p className="text-slate-500">
            {auth.role === 'resident' ? 'View and pay your society maintenance bills.' : 'Track monthly payments and generate statements.'}
          </p>
        </div>
        <div className="flex gap-3">
          {auth.role === 'admin' ? (
            <>
              <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" />
                Export Log
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-navy/10"
              >
                <Plus className="w-5 h-5" />
                Generate Bill
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
             <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Paid Bills</p>
            <p className="text-xl font-bold italic serif">{stats.paid}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
             <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Pending</p>
            <p className="text-xl font-bold italic serif">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
             <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Overdue</p>
            <p className="text-xl font-bold italic serif">{stats.overdue}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-navy text-white rounded-lg">
             <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Collected</p>
            <p className="text-xl font-bold italic serif">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-theme-border shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f9fafb] text-theme-slate font-bold uppercase text-[0.7rem] tracking-wider">
              <tr>
                <th className="px-6 py-4">Bill ID / Flat</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading billing records...</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No records found.</td></tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{getFlatName(bill.flatId)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{bill.id?.slice(-8).toUpperCase()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">₹{bill.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center w-fit gap-1 ${
                        bill.status === 'paid' ? 'bg-[#d1fae5] text-[#065f46]' : 
                        bill.status === 'pending' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#991b1b]'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.status !== 'paid' && (
                        <button 
                          onClick={() => auth.role === 'admin' && bill.id ? markAsPaid(bill.id) : alert('Integrates with payment gateway (e.g., Razorpay/Stripe)')}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          {auth.role === 'admin' ? 'Mark Paid' : 'Pay Now'}
                        </button>
                      )}
                      <button className="ml-2 p-2 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </button>
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
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold italic serif">Generate Maintenance Bill</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (formData.flatId === 'ALL') {
                  const billPromises = flats.map(f => 
                    addDoc(collection(db, 'maintenance'), {
                      ...formData,
                      flatId: f.id,
                      description: `Monthly maintenance for ${format(new Date(), 'MMMM yyyy')}`
                    })
                  );
                  await Promise.all(billPromises);
                } else {
                  await addDoc(collection(db, 'maintenance'), {
                    ...formData,
                    description: `Maintenance bill for ${format(new Date(), 'MMMM yyyy')}`
                  });
                }
                setIsModalOpen(false);
                fetchData();
              } catch (e) {
                console.error(e);
              }
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Unit(s)</label>
                <select 
                  required
                  value={formData.flatId}
                  onChange={e => setFormData({...formData, flatId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                >
                  <option value="">Choose Unit...</option>
                  <option value="ALL">All Occupied Units</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>{f.wing}-{f.flatNo}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
                <input 
                  required
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
                  placeholder="e.g. 2500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.dueDate.split('T')[0]}
                  onChange={e => setFormData({...formData, dueDate: new Date(e.target.value).toISOString()})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy/5 focus:border-navy"
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
                  {formData.flatId === 'ALL' ? 'Generate for All' : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
