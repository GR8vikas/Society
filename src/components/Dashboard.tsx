import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Building2, 
  Users, 
  CreditCard, 
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { collection, query, getDocs, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Flat, Resident, Complaint, MaintenanceBill, Notice, Visitor } from '../types';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, trend, color, valueColor }: any) => (
  <div className="bg-white p-5 rounded-xl border border-theme-border shadow-sm flex flex-col justify-between h-36">
    <div className="flex items-center justify-between">
      <p className="text-[0.7rem] font-bold text-theme-slate uppercase tracking-wider">{title}</p>
      {trend !== undefined && (
        <div className={cn("flex items-center text-[0.7rem] font-bold", trend >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <h3 className={cn("text-3xl font-bold tracking-tight", valueColor || 'text-navy')}>{value}</h3>
    <div className="text-[0.7rem] text-theme-slate opacity-70 flex items-center gap-1 font-medium italic">
      <Icon className="w-3 h-3" />
      <span>Updated just now</span>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFlats: 0,
    occupancy: 0,
    pendingDuesAmount: 0,
    openComplaints: 0,
    activeVisitors: 0
  });
  
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [flatsMap, setFlatsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const flatsSnap = await getDocs(collection(db, 'flats'));
        const billsSnap = await getDocs(collection(db, 'maintenance'));
        const visitorsSnap = await getDocs(collection(db, 'visitors'));
        const noticesSnap = await getDocs(query(collection(db, 'notices'), orderBy('date', 'desc'), limit(3)));
        
        // Fetch complaints based on role
        let complaintsSnap;
        if (auth.role === 'resident' && auth.flatId) {
          complaintsSnap = await getDocs(query(collection(db, 'complaints'), where('flatId', '==', auth.flatId), orderBy('createdAt', 'desc')));
        } else {
          complaintsSnap = await getDocs(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')));
        }

        // Create flats map for lookups
        const fMap: Record<string, string> = {};
        flatsSnap.docs.forEach(f => {
          const data = f.data() as Flat;
          fMap[f.id] = `${data.wing}-${data.flatNo}`;
        });
        setFlatsMap(fMap);

        const totalFlats = flatsSnap.size;
        const occupiedFlats = flatsSnap.docs.filter(d => (d.data() as Flat).occupancy === 'occupied').length;
        
        // Calculate pending dues amount
        const pendingAmount = billsSnap.docs
          .filter(d => {
            const bill = d.data() as MaintenanceBill;
            if (auth.role === 'resident' && bill.flatId !== auth.flatId) return false;
            return bill.status === 'pending' || bill.status === 'overdue';
          })
          .reduce((sum, d) => sum + ((d.data() as MaintenanceBill).amount || 0), 0);

        const openComplaintsCount = complaintsSnap.docs.filter(d => (d.data() as Complaint).status !== 'Resolved').length;
        
        // Calculate active visitors inside right now
        const activeVisitorsCount = visitorsSnap.docs.filter(d => {
             const v = d.data() as Visitor;
             if (auth.role === 'resident' && v.flatId !== auth.flatId) return false;
             return !v.exitTime;
        }).length;

        setStats({
          totalFlats,
          occupancy: totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0,
          pendingDuesAmount: pendingAmount,
          openComplaints: openComplaintsCount,
          activeVisitors: activeVisitorsCount
        });

        // Set recent lists
        setRecentComplaints(complaintsSnap.docs.map(d => ({id: d.id, ...d.data()}) as Complaint).slice(0, 4));
        setRecentNotices(noticesSnap.docs.map(d => ({id: d.id, ...d.data()}) as Notice));

      } catch (e) {
        console.error("Error fetching dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
        </div>
        {auth.role === 'admin' && (
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/notices')}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              New Notice
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {auth.role === 'admin' && (
          <StatCard 
            title="Occupancy Rate" 
            value={`${stats.occupancy}%`} 
            icon={Users} 
            trend={stats.occupancy > 50 ? 2.4 : 0} 
          />
        )}
        <StatCard 
          title="Pending Maintenance" 
          value={`₹${stats.pendingDuesAmount.toLocaleString()}`} 
          icon={CreditCard} 
          valueColor={stats.pendingDuesAmount > 0 ? "text-rose-500" : "text-emerald-500"}
        />
        <StatCard 
          title={auth.role === 'resident' ? "My Active Visitors" : "Active Visitors"} 
          value={stats.activeVisitors.toString()} 
          icon={ShieldAlert} 
        />
        <StatCard 
          title="Open Complaints" 
          value={stats.openComplaints < 10 && stats.openComplaints > 0 ? `0${stats.openComplaints}` : stats.openComplaints.toString()} 
          icon={MessageSquare} 
          valueColor={stats.openComplaints > 0 ? "text-amber" : "text-emerald-500"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        <div className="lg:col-span-3 bg-white rounded-xl border border-theme-border shadow-sm flex flex-col min-h-[500px]">
          <div className="p-4 px-5 border-b border-theme-border flex items-center justify-between">
            <h3 className="font-bold text-base">Recent Status & Requests</h3>
            <button onClick={() => navigate('/complaints')} className="text-xs font-bold text-amber uppercase tracking-wider hover:underline">View All</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-[100px_1fr_120px_100px] p-4 px-5 bg-theme-bg/50 text-[0.75rem] font-bold text-theme-slate uppercase tracking-wider border-b border-theme-border flex-1 min-w-[600px]">
              <span>Flat No</span>
              <span>Description</span>
              <span>Status</span>
              <span>Created</span>
            </div>
            
            <div className="divide-y divide-slate-50 min-w-[600px]">
              {loading ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">Loading activity...</div>
              ) : recentComplaints.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">No recent complaints found.</div>
              ) : (
                recentComplaints.map(complaint => (
                  <div key={complaint.id} className="grid grid-cols-[100px_1fr_120px_100px] p-4 px-5 items-center text-sm hover:bg-slate-50 transition-colors">
                    <span className="font-bold text-navy">{flatsMap[complaint.flatId] || 'N/A'}</span>
                    <span className="text-slate-600 truncate pr-4">{complaint.type}: {complaint.description}</span>
                    <span className={cn(
                      "px-2 py-1 text-[0.7rem] font-black uppercase rounded-full w-fit",
                      complaint.status === 'Open' ? "bg-blue-100 text-blue-800" :
                      complaint.status === 'In Progress' ? "bg-amber/20 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    )}>
                      {complaint.status}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-theme-slate">{format(new Date(complaint.createdAt), 'MMM dd, p')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-theme-border shadow-sm overflow-hidden">
            <div className="p-4 px-5 border-b border-theme-border">
              <h3 className="font-bold text-base">Quick Actions</h3>
            </div>
            <div className="p-5 flex flex-col gap-2.5">
              {auth.role === 'admin' ? (
                <>
                  <button 
                    onClick={() => navigate('/maintenance')}
                    className="w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider bg-amber text-navy rounded-lg transition-all hover:bg-amber-600 border border-amber"
                  >
                    <Plus className="w-4 h-4" /> Manage Billing
                  </button>
                  <button 
                    onClick={() => navigate('/visitors')}
                    className="w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider bg-white text-navy border border-theme-border rounded-lg transition-all hover:bg-theme-bg"
                  >
                    <Users className="w-4 h-4" /> Log New Visitor
                  </button>
                  <button 
                    onClick={() => navigate('/notices')}
                    className="w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider bg-white text-navy border border-theme-border rounded-lg transition-all hover:bg-theme-bg"
                  >
                    <Bell className="w-4 h-4" /> Post Notice
                  </button>
                </>
              ) : (
                 <>
                  <button 
                    onClick={() => navigate('/complaints')}
                    className="w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider bg-amber text-navy rounded-lg transition-all hover:bg-amber-600 border border-amber"
                  >
                    <MessageSquare className="w-4 h-4" /> Raise Complaint
                  </button>
                  <button 
                    onClick={() => navigate('/maintenance')}
                    className="w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider bg-white text-navy border border-theme-border rounded-lg transition-all hover:bg-theme-bg"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Maintenance
                  </button>
                 </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-theme-border shadow-sm overflow-hidden flex flex-col min-h-[220px]">
            <div className="p-4 px-5 border-b border-theme-border flex justify-between items-center">
              <h3 className="font-bold text-base">Notice Board</h3>
              <button onClick={() => navigate('/notices')} className="text-xs text-amber font-bold uppercase tracking-wider hover:underline">All</button>
            </div>
            <div className="divide-y divide-slate-50 flex-1">
              {loading ? (
                <div className="p-4 text-center text-slate-400 italic text-sm">Loading...</div>
              ) : recentNotices.length === 0 ? (
                <div className="p-4 text-center text-slate-400 italic text-sm">No notices.</div>
              ) : (
                recentNotices.map(notice => (
                  <div key={notice.id} className="p-4 px-5 hover:bg-slate-50 transition-colors">
                    <p className="text-[0.7rem] font-bold text-theme-slate uppercase mb-1">
                      {format(new Date(notice.date), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm font-medium leading-tight text-navy">{notice.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
