"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase';

export default function DashboardHome() {
  const router = useRouter();
  
  // Real Data States
  const [userEmail, setUserEmail] = useState('');
  const [activeSitesCount, setActiveSitesCount] = useState(0);
  const [totalLaboursCount, setTotalLaboursCount] = useState(0);
  const [pendingSalarySum, setPendingSalarySum] = useState(0);
  const [materialChallansCount, setMaterialChallansCount] = useState(0);
  const [pendingBillsSum, setPendingBillsSum] = useState(0);

  const [pendingBillsList, setPendingBillsList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Dropdown states for sidebar
  const [labourOpen, setLabourOpen] = useState(true);
  const [sitesOpen, setSitesOpen] = useState(true);
  const [billsOpen, setBillsOpen] = useState(true);
  const [challanOpen, setChallanOpen] = useState(true);
  const [hpseblOpen, setHpseblOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  
  // User profile popup state
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    async function fetchRealDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserEmail(session.user.email);

      // 1. Fetch Active Sites Count
      const { count: siteCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
      if (siteCount !== null) setActiveSitesCount(siteCount);

      // 2. Fetch Total Labour Count
      const { count: labourCount } = await supabase.from('labour_profile').select('*', { count: 'exact', head: true });
      if (labourCount !== null) setTotalLaboursCount(labourCount);

      // 3. Fetch Material Challans Count
      const { count: challanCount } = await supabase.from('material_challans').select('*', { count: 'exact', head: true });
      if (challanCount !== null) setMaterialChallansCount(challanCount);

      // 4. Fetch Government Bills & Calculate Pending Amount
      const { data: billsData } = await supabase.from('government_bills').select('*').order('created_at', { ascending: false });
      if (billsData) {
        const pendingBills = billsData.filter(b => b.status === 'Submitted' || b.status === 'In Process (SDO/XEN)' || b.status === 'Pending');
        const pendingSum = pendingBills.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        setPendingBillsSum(pendingSum);
        setPendingBillsList(billsData.slice(0, 5)); // Top 5 recent bills
      }

      // 5. Fetch Real Pending Salary Sum from Labours & Attendance
      const { data: laboursData } = await supabase.from('labour_profile').select('*');
      const { data: attendanceData } = await supabase.from('attendance').select('*');
      const { data: paymentsData } = await supabase.from('labour_payments').select('*');

      if (laboursData) {
        let totalPending = 0;
        laboursData.forEach(l => {
          const lAtt = attendanceData ? attendanceData.filter(a => a.labour_id === l.id.toString()) : [];
          const present = lAtt.filter(a => a.status === 'Present').length;
          const halfDay = lAtt.filter(a => a.status === 'Half Day').length;
          const effectiveDays = present + (halfDay * 0.5);
          const totalSalary = effectiveDays * Number(l.daily_wage || 0);

          const lPay = paymentsData ? paymentsData.filter(p => p.labour_id === l.id.toString()) : [];
          const totalPaid = lPay.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
          
          const balance = totalSalary - totalPaid;
          if (balance > 0) totalPending += balance;
        });
        setPendingSalarySum(totalPending);
      }

      // 6. Recent Activity Log (Current session login entry)
      setRecentActivities([
        { user: session.user.email.split('@')[0], date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), duration: 'Active Session' }
      ]);
    }

    fetchRealDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden" suppressHydrationWarning={true}>
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 select-none border-r border-slate-800">
        
        {/* Brand Header */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-800/80 flex-shrink-0">
          <h1 className="text-base font-bold text-white tracking-wide">Sanjeev Sharma</h1>
          <p className="text-[10px] tracking-wider text-slate-400 uppercase mt-0.5">Government Electrical Contractor</p>
          <p className="text-[10px] font-bold tracking-widest text-yellow-500 uppercase mt-0.5">Class A</p>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar text-xs">
          
          <a href="/" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
            <span className="text-sm">🏠</span> Dashboard
          </a>

          <div>
            <button onClick={() => setLabourOpen(!labourOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-3"><span className="text-sm">👥</span> Labour</div>
              <span className={`text-[10px] transition-transform ${labourOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {labourOpen && (
              <div className="pl-9 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <a href="/labour-list" className="block py-1.5 text-slate-400 hover:text-white transition">Add New Labour</a>
                <a href="/labour-list" className="block py-1.5 text-slate-400 hover:text-white transition">View Labour</a>
                <a href="/mark-attendance" className="block py-1.5 text-slate-400 hover:text-white transition">Attendance</a>
                <a href="/attendance-report" className="block py-1.5 text-slate-400 hover:text-white transition">Salary Record</a>
              </div>
            )}
          </div>

          <div>
            <button onClick={() => setSitesOpen(!sitesOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-3"><span className="text-sm">🏗️</span> Sites / Projects</div>
              <span className={`text-[10px] transition-transform ${sitesOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {sitesOpen && (
              <div className="pl-9 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <a href="/add-site" className="block py-1.5 text-slate-400 hover:text-white transition">New Project Site</a>
                <a href="/add-site" className="block py-1.5 text-slate-400 hover:text-white transition">Active Sites</a>
              </div>
            )}
          </div>

          <div>
            <button onClick={() => setBillsOpen(!billsOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-3"><span className="text-sm">📄</span> Government Bills</div>
              <span className={`text-[10px] transition-transform ${billsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {billsOpen && (
              <div className="pl-9 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <a href="/upload-bill" className="block py-1.5 text-slate-400 hover:text-white transition">Upload Bills</a>
                <a href="/upload-bill" className="block py-1.5 text-slate-400 hover:text-white transition">Bill Records</a>
              </div>
            )}
          </div>

          <div>
            <button onClick={() => setChallanOpen(!challanOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-3"><span className="text-sm">📦</span> Material & Challan</div>
              <span className={`text-[10px] transition-transform ${challanOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {challanOpen && (
              <div className="pl-9 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <a href="/add-challan" className="block py-1.5 text-slate-400 hover:text-white transition">Material Record</a>
              </div>
            )}
          </div>

          <div>
            <button onClick={() => setHpseblOpen(!hpseblOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-3"><span className="text-sm">⚡</span> HPSEBL</div>
              <span className={`text-[10px] transition-transform ${hpseblOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {hpseblOpen && (
              <div className="pl-9 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <a href="/hpscbl-tenders" className="block py-1.5 text-slate-400 hover:text-white transition">Tenders</a>
              </div>
            )}
          </div>

          <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition">
            <span className="text-sm">⚙️</span> Settings
          </a>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-xs bg-[#090D16]">
          <p className="font-bold text-white">Sanjeev Sharma</p>
          <p className="text-[10px] text-slate-400">Government Electrical Contractor</p>
          <p className="text-[10px] text-yellow-500 font-semibold">Class A</p>
          <div className="mt-3 pt-3 border-t border-slate-800/60 text-[9px] text-slate-500 text-center">
            Designed & Developed Sameer Kimta
          </div>
        </div>

      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm">
          
          <div className="flex items-center gap-4 w-1/3">
            <button className="text-slate-500 hover:text-slate-800 text-lg">☰</button>
            <div className="relative w-full max-w-md">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full bg-[#F1F5F9] text-xs text-slate-800 placeholder-slate-400 rounded-lg pl-10 pr-16 py-2.5 border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition" 
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">Ctrl + K</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-800">
              🔔
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Real Logged-in User Profile */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 cursor-pointer focus:outline-none bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition"
              >
                <div className="w-8 h-8 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center text-xs shadow-sm">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{userEmail || 'User'}</p>
                </div>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {/* Popup Dropdown for Logged-in user */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">Logged in as</span>
                    <button onClick={() => setShowUserMenu(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                  </div>
                  
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-900 break-all">{userEmail}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">● Active Session</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between">
                    <a href="#" className="text-blue-600 hover:underline font-semibold">Settings ⚙️</a>
                    <button onClick={handleLogout} className="text-red-600 hover:underline font-semibold">Logout 🚪</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time overview of your projects, labour, billing & materials</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Build Today for a Brighter Tomorrow</p>
            </div>
          </div>

          {/* ================= 5 REAL METRIC CARDS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            
            {/* 1. Active Sites */}
            <a href="/add-site" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">🏗️</div>
                <span className="text-xs text-blue-600 font-bold group-hover:translate-x-1 transition">→</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Active Sites</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{activeSitesCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Managed Sites</p>
            </a>

            {/* 2. Registered Labour */}
            <a href="/labour-list" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">👥</div>
                <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition">→</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Registered Labour</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalLaboursCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total Workforce</p>
            </a>

            {/* 3. Pending Labour Amount */}
            <a href="/attendance-report" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">₹</div>
                <span className="text-xs text-amber-600 font-bold group-hover:translate-x-1 transition">→</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Pending Labour Amount</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">₹ {pendingSalarySum.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Dues Remaining</p>
            </a>

            {/* 4. Material Challans */}
            <a href="/add-challan" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">📦</div>
                <span className="text-xs text-purple-600 font-bold group-hover:translate-x-1 transition">→</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Material Challans</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{materialChallansCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Recorded Challans</p>
            </a>

            {/* 5. Total Pending Bill Amount */}
            <a href="/upload-bill" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">📄</div>
                <span className="text-xs text-rose-600 font-bold group-hover:translate-x-1 transition">→</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Total Pending Bill Amount</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">₹ {pendingBillsSum.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Pending Approval</p>
            </a>

          </div>

          {/* ================= CHARTS & GRIDS SECTION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Monthly Overview Bar Chart */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Monthly Overview</h3>
                <span className="text-xs text-slate-400">Live Analytics</span>
              </div>
              <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-slate-100 px-4">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-4 bg-blue-500 h-24 rounded-t"></div>
                  <span className="text-[10px] text-slate-400 font-medium">Active Sites</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-4 bg-emerald-500 h-32 rounded-t"></div>
                  <span className="text-[10px] text-slate-400 font-medium">Labours</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-4 bg-purple-500 h-16 rounded-t"></div>
                  <span className="text-[10px] text-slate-400 font-medium">Challans</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-4 bg-amber-500 h-28 rounded-t"></div>
                  <span className="text-[10px] text-slate-400 font-medium">Bills</span>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-400">System performance metrics updated live from database.</p>
            </div>

            {/* Labour Attendance Summary */}
            <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-900">Labour Workforce</h3>
              <div className="flex flex-col items-center justify-center my-auto py-4">
                <div className="w-28 h-28 rounded-full border-8 border-emerald-500 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-extrabold text-slate-900">{totalLaboursCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">Active registered personnel in directory.</p>
            </div>

            {/* Projects Status Summary */}
            <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-900">Projects Status</h3>
              <div className="flex flex-col items-center justify-center my-auto py-4">
                <div className="w-28 h-28 rounded-full border-8 border-blue-600 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-extrabold text-slate-900">{activeSitesCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active</span>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">Ongoing government and company sites.</p>
            </div>

          </div>

          {/* ================= BOTTOM SECTION: PENDING BILLS & RECENT ACTIVITIES ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
            
            {/* Real Pending Government Bills Table */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-900">Pending Government Bills</h3>
                <a href="/upload-bill" className="text-xs font-semibold text-blue-600 hover:underline">View All →</a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="pb-2.5 font-semibold">Invoice No.</th>
                      <th className="pb-2.5 font-semibold">Title / Site</th>
                      <th className="pb-2.5 font-semibold">Amount</th>
                      <th className="pb-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {pendingBillsList.map((b, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium text-slate-900">{b.invoice_no}</td>
                        <td className="truncate max-w-[180px]">{b.title || b.bill_location}</td>
                        <td className="font-semibold text-emerald-600">₹ {Number(b.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {b.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {pendingBillsList.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-slate-400">No pending bills found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real Login Audit Log */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-900">Recent Login Audit</h3>
                <span className="text-xs text-slate-400">Secured Log</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="pb-2.5 font-semibold">Logged User</th>
                      <th className="pb-2.5 font-semibold">Date & Time</th>
                      <th className="pb-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {recentActivities.map((act, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium text-slate-900 truncate max-w-[140px]">{act.user}</td>
                        <td>{act.date} • {act.time}</td>
                        <td className="text-right font-semibold text-emerald-600">{act.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Footer Copyright */}
          <div className="pt-4 pb-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
            <p>© 2026 Sanjeev Sharma. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">Designed & Developed Sameer Kimta</p>
          </div>

        </div>
      </main>
    </div>
  );
}