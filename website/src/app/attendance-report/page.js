"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function SalaryAttendanceReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [labours, setLabours] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  
  // Filters & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabour, setSelectedLabour] = useState(null);

  // Add Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('');
  const [payScreenshot, setPayScreenshot] = useState(null);

  useEffect(() => {
    async function checkUserAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchAllData();
    }
    checkUserAndFetch();
  }, [router]);

  const fetchAllData = async () => {
    setLoading(true);
    // 1. Fetch Labours
    const { data: lData } = await supabase.from('labour_profile').select('*');
    if (lData) {
      setLabours(lData);
      if (lData.length > 0 && !selectedLabour) setSelectedLabour(lData[0]);
    }

    // 2. Fetch Attendance
    const { data: aData } = await supabase.from('attendance').select('*');
    if (aData) setAttendanceData(aData);

    // 3. Fetch Payments (All payment records ordered by latest)
    const { data: pData } = await supabase.from('labour_payments').select('*').order('created_at', { ascending: false });
    if (pData) setPaymentsData(pData);

    setLoading(false);
  };

  // Handle Add Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!selectedLabour) return;

    let screenshotUrl = "";
    try {
      if (payScreenshot) {
        const fileName = `pay_${Date.now()}_${payScreenshot.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('labour-files').upload(fileName, payScreenshot);
        if (!upErr) {
          const { data: pub } = supabase.storage.from('labour-files').getPublicUrl(fileName);
          screenshotUrl = pub.publicUrl;
        }
      }

      const { error } = await supabase.from('labour_payments').insert([{
        labour_id: selectedLabour.id.toString(),
        labour_name: selectedLabour.labour_name,
        payment_date: new Date().toISOString().split('T')[0],
        amount: Number(payAmount),
        payment_mode: payMode,
        screenshot_url: screenshotUrl
      }]);

      if (error) throw error;

      alert("✅ Payment successfully recorded!");
      setShowPayModal(false);
      setPayAmount('');
      setPayMode('');
      setPayScreenshot(null);
      fetchAllData();

    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  // Delete Payment Record
  const handleDeletePayment = async (payId) => {
    if (confirm("Kya aap yeh payment record delete karna chahte hain?")) {
      const { error } = await supabase.from('labour_payments').delete().eq('id', payId);
      if (!error) fetchAllData();
    }
  };

  // Calculations for a specific labour
  const getLabourStats = (labour) => {
    const lAtt = attendanceData.filter(a => a.labour_id === labour.id.toString());
    const present = lAtt.filter(a => a.status === 'Present').length;
    const halfDay = lAtt.filter(a => a.status === 'Half Day').length;
    const absent = lAtt.filter(a => a.status === 'Absent').length;
    
    const totalDays = present + halfDay + absent;
    const effectiveDays = present + (halfDay * 0.5);
    const wage = Number(labour.daily_wage || 0);
    const totalSalary = effectiveDays * wage;

    const lPay = paymentsData.filter(p => p.labour_id === labour.id.toString());
    const totalPaid = lPay.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const balance = totalSalary - totalPaid;

    let status = "Paid";
    if (balance > 0 && totalPaid > 0) status = "Partial";
    if (totalPaid === 0) status = "Pending";

    return { present, halfDay, absent, totalDays, totalSalary, totalPaid, balance, status, lAtt, lPay };
  };

  // Overall Totals
  const totalLaboursCount = labours.length;
  let overallSalary = 0;
  let overallPaid = 0;

  labours.forEach(l => {
    const st = getLabourStats(l);
    overallSalary += st.totalSalary;
    overallPaid += st.totalPaid;
  });
  const overallPending = overallSalary - overallPaid;

  const filteredLabours = labours.filter(l => 
    l.labour_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.mobile_number?.includes(searchQuery)
  );

  const selectedStats = selectedLabour ? getLabourStats(selectedLabour) : { present: 0, halfDay: 0, absent: 0, totalDays: 0, totalSalary: 0, totalPaid: 0, balance: 0, status: 'Paid', lAtt: [], lPay: [] };

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-300 font-sans" suppressHydrationWarning={true}>
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-wide">Sanjeev Sharma</h1>
          <p className="text-[10px] tracking-widest text-slate-400 uppercase mt-1">Government Electrical Contractor</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-[1px] w-4 bg-yellow-500"></div>
            <p className="text-[10px] font-bold tracking-widest text-white uppercase">Class - A</p>
            <div className="h-[1px] w-4 bg-yellow-500"></div>
          </div>
        </div>

        <div className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>🏠</span>Dashboard</a>
            <a href="/attendance-report" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>₹</span>Salary & Attendance Report</a>
            <a href="/mark-attendance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📅</span>Make Attendance</a>
            <a href="/labour-list" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>👤</span>Labour Directory</a>
            <a href="/upload-bill" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📄</span>Government Bills</a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 tracking-wider">Building Powering Serving the Nation</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-xs text-slate-400">
            Dashboard <span className="mx-2">›</span> <span className="text-white font-medium">Salary & Attendance Report</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              <span>🔒</span> SECURE | GOVERNMENT COMPLIANT
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-600 rounded-full overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=11" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">Sanjeev Sharma</p>
                <p className="text-[10px] text-slate-400">Contractor (Class - A)</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Hero Banner */}
          <div className="relative rounded-xl overflow-hidden bg-slate-800 h-36 flex items-center px-8 border border-slate-700 shadow-lg">
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: "url('https://images.unsplash.com/photo-1541888086225-2be9bfbbaea7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"}}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-[#0B1120]/80 to-transparent"></div>
            
            <div className="relative z-10 flex justify-between items-center w-full">
              <div>
                <h1 className="text-2xl font-bold text-white">Salary & Attendance Report</h1>
                <p className="text-slate-300 text-xs mt-1">Manage attendance, salary calculation, payments and pending dues.</p>
              </div>
              <div className="hidden lg:block text-right -rotate-3">
                <p className="text-sm font-serif italic text-yellow-500">Building Powering Serving the Nation</p>
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold">👥</div>
              <div>
                <p className="text-xs text-slate-400">Total Labours</p>
                <h3 className="text-xl font-bold text-white">{totalLaboursCount}</h3>
                <p className="text-[10px] text-slate-500">Active Workforce</p>
              </div>
            </div>

            <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold">₹</div>
              <div>
                <p className="text-xs text-slate-400">Total Salary</p>
                <h3 className="text-xl font-bold text-emerald-400">₹{overallSalary.toLocaleString('en-IN')}</h3>
                <p className="text-[10px] text-slate-500">Calculated from Attendance</p>
              </div>
            </div>

            <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-400 flex items-center justify-center text-2xl font-bold">💳</div>
              <div>
                <p className="text-xs text-slate-400">Total Paid</p>
                <h3 className="text-xl font-bold text-white">₹{overallPaid.toLocaleString('en-IN')}</h3>
                <p className="text-[10px] text-slate-500">Disbursed to Labour</p>
              </div>
            </div>

            <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold">⏳</div>
              <div>
                <p className="text-xs text-slate-400">Pending Payment</p>
                <h3 className="text-xl font-bold text-red-400">₹{overallPending.toLocaleString('en-IN')}</h3>
                <p className="text-[10px] text-slate-500">Dues Remaining</p>
              </div>
            </div>
          </div>

          {/* MAIN GRID: TABLE (LEFT) & SELECTED LABOUR DETAILS (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: Labour Salary Table (7 Cols) */}
            <div className="lg:col-span-7 bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Labour Salary Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Click any labour to view their complete attendance and payment logs.</p>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search labour..." 
                  className="bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2 w-48"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 font-normal">#</th>
                      <th className="pb-3 font-normal">Labour Name</th>
                      <th className="pb-3 font-normal">Present</th>
                      <th className="pb-3 font-normal">Salary (₹)</th>
                      <th className="pb-3 font-normal">Paid (₹)</th>
                      <th className="pb-3 font-normal">Balance (₹)</th>
                      <th className="pb-3 font-normal">Status</th>
                      <th className="pb-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredLabours.map((labour, index) => {
                      const st = getLabourStats(labour);
                      const isSelected = selectedLabour?.id === labour.id;

                      let statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      if (st.status === 'Pending') statusBadge = "bg-red-500/10 text-red-400 border-red-500/20";
                      if (st.status === 'Partial') statusBadge = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";

                      return (
                        <tr 
                          key={labour.id} 
                          onClick={() => setSelectedLabour(labour)}
                          className={`hover:bg-slate-800/50 transition cursor-pointer ${isSelected ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : ''}`}
                        >
                          <td className="py-3.5">{index + 1}</td>
                          <td className="font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden">
                              {labour.photo_url && labour.photo_url !== "Uploaded_Photo_Placeholder" ? (
                                <img src={labour.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>
                              )}
                            </div>
                            {labour.labour_name}
                          </td>
                          <td>{st.present} ({st.halfDay} Half)</td>
                          <td className="font-bold text-emerald-400">₹{st.totalSalary.toLocaleString('en-IN')}</td>
                          <td>₹{st.totalPaid.toLocaleString('en-IN')}</td>
                          <td className="font-bold text-red-400">₹{st.balance.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`px-2.5 py-1 rounded border text-[10px] font-bold ${statusBadge}`}>
                              {st.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button className="bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded text-[10px] font-semibold">
                              Inspect ➔
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredLabours.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-500">
                          Koi labour nahi mila.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* RIGHT: Selected Labour Detailed Inspection Card (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {selectedLabour ? (
                <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
                  
                  {/* Labour Profile Header */}
                  <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden border border-slate-700">
                      {selectedLabour.photo_url && selectedLabour.photo_url !== "Uploaded_Photo_Placeholder" ? (
                        <img src={selectedLabour.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Photo</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{selectedLabour.labour_name}</h3>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold">Active</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">ID: LB-{selectedLabour.id} | <span className="text-yellow-400">{selectedLabour.skill}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">📞 {selectedLabour.mobile_number} | 📍 {selectedLabour.village || 'Rampur'}</p>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-white border-b border-slate-800 pb-2 flex justify-between">
                      <span>Salary & Payment Calculation</span>
                      <span className="text-yellow-400">Wage: ₹{selectedLabour.daily_wage}/day</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>Present Days: <strong className="text-white">{selectedStats.present}</strong></div>
                      <div>Half Days: <strong className="text-white">{selectedStats.halfDay}</strong></div>
                      <div>Absent Days: <strong className="text-white">{selectedStats.absent}</strong></div>
                      <div>Total Tracked: <strong className="text-white">{selectedStats.totalDays} Days</strong></div>
                    </div>

                    <div className="border-t border-slate-800 pt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#111827] p-2 rounded border border-slate-800">
                        <p className="text-[10px] text-slate-400">Total Salary</p>
                        <p className="font-bold text-emerald-400 text-sm mt-0.5">₹{selectedStats.totalSalary}</p>
                      </div>
                      <div className="bg-[#111827] p-2 rounded border border-slate-800">
                        <p className="text-[10px] text-slate-400">Total Paid</p>
                        <p className="font-bold text-blue-400 text-sm mt-0.5">₹{selectedStats.totalPaid}</p>
                      </div>
                      <div className="bg-[#111827] p-2 rounded border border-slate-800">
                        <p className="text-[10px] text-slate-400">Balance Due</p>
                        <p className="font-bold text-red-400 text-sm mt-0.5">₹{selectedStats.balance}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment History & Add Payment Button */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">Payment Records & History</h4>
                      <button 
                        onClick={() => setShowPayModal(true)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg shadow transition cursor-pointer"
                      >
                        + Add Payment / Advance
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedStats.lPay.map((pay, i) => (
                        <div key={pay.id || i} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-emerald-400 text-sm">₹{pay.amount?.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">{pay.payment_mode} • {pay.payment_date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {pay.screenshot_url ? (
                              <a href={pay.screenshot_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-2.5 py-1 rounded text-[10px]">
                                Proof ↗
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500">No Proof</span>
                            )}
                            <button onClick={() => handleDeletePayment(pay.id)} className="text-red-400 hover:text-red-500 px-1">🗑️</button>
                          </div>
                        </div>
                      ))}

                      {selectedStats.lPay.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">Is labour ki koi payment record nahi hai.</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#111827] p-12 rounded-xl border border-slate-800 text-center text-slate-500">
                  Left table se kisi labour par click karein.
                </div>
              )}

            </div>

          </div>

          {/* ================= ALL PAYMENTS & ADVANCES MASTER TABLE ================= */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">All Payments & Advances Master Ledger</h2>
                <p className="text-xs text-slate-400 mt-0.5">Complete history of all payments disbursed across all labours.</p>
              </div>
              <div className="text-xs text-slate-400">
                Total Transactions: <strong className="text-white">{paymentsData.length}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 font-normal">#</th>
                    <th className="pb-3 font-normal">Date</th>
                    <th className="pb-3 font-normal">Labour Name</th>
                    <th className="pb-3 font-normal">Amount (₹)</th>
                    <th className="pb-3 font-normal">Payment Mode / UPI ID</th>
                    <th className="pb-3 font-normal">Receipt Proof</th>
                    <th className="pb-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {paymentsData.map((pay, index) => (
                    <tr key={pay.id || index} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5">{index + 1}</td>
                      <td>{pay.payment_date}</td>
                      <td className="font-bold text-white">{pay.labour_name}</td>
                      <td className="font-bold text-emerald-400">₹{pay.amount?.toLocaleString('en-IN')}</td>
                      <td>{pay.payment_mode}</td>
                      <td>
                        {pay.screenshot_url ? (
                          <a href={pay.screenshot_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-3 py-1 rounded text-[10px] font-semibold inline-block">
                            View Screenshot ↗
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No Screenshot</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleDeletePayment(pay.id)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1 rounded text-[10px]"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paymentsData.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-500">
                        Abhi tak koi payment disbursement record nahi ki gayi hai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ================= ADD PAYMENT MODAL ================= */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-6 shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Record Payment / Advance</h3>
                <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Labour Name</label>
                  <input type="text" disabled value={selectedLabour?.labour_name || ''} className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded text-white" />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹) *</label>
                  <input type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Enter amount" className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white" />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Payment Mode / ID (e.g. UPI / NEFT / Cash) *</label>
                  <input type="text" required value={payMode} onChange={(e) => setPayMode(e.target.value)} placeholder="e.g. UPI/ICICI/98231" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Payment Screenshot / Receipt Proof (PDF/Image)</label>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setPayScreenshot(e.target.files[0])} className="text-slate-300 w-full bg-[#1F2937] p-2 rounded border border-slate-700" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 rounded-lg cursor-pointer">
                    {loading ? "Saving..." : "Save Payment 💾"}
                  </button>
                  <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}