"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function MarkAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [activeLabours, setActiveLabours] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Form States
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState('Present');

  // Filters & Calendar View state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedLabourForCalendar, setSelectedLabourForCalendar] = useState('');

  useEffect(() => {
    async function checkUserAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchActiveLabours();
      fetchAttendanceRecords();
    }
    checkUserAndFetch();
  }, [router]);

  const fetchActiveLabours = async () => {
    const { data: labours, error } = await supabase
      .from('labour_profile')
      .select('*')
      .eq('status', 'Active');

    if (!error && labours) {
      setActiveLabours(labours);
    }
  };

  const fetchAttendanceRecords = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('id', { ascending: false });

    if (!error) {
      setAttendanceRecords(data || []);
      // Default select first labour for calendar if not selected
      if (data && data.length > 0 && !selectedLabourForCalendar) {
        setSelectedLabourForCalendar(data[0].labour_name);
      }
    }
  };

  // Submit Attendance
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLabourId) {
      alert("❌ Kripya labour select karein!");
      return;
    }

    setLoading(true);
    const labour = activeLabours.find(l => l.id.toString() === selectedLabourId);

    if (!labour) {
      alert("❌ Labour data nahi mila!");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('attendance').insert([{
        labour_id: labour.id.toString(),
        labour_name: labour.labour_name,
        mobile_number: labour.mobile_number,
        site_location: labour.village || 'Rampur',
        attendance_date: attendanceDate,
        status: attendanceStatus
      }]);

      if (error) throw error;

      alert(`✅ Attendance marked successfully as ${attendanceStatus}!`);
      setSelectedLabourId('');
      fetchActiveLabours();
      fetchAttendanceRecords();

    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Kya aap yeh attendance record delete karna chahte hain?")) {
      await supabase.from('attendance').delete().eq('id', id);
      fetchActiveLabours();
      fetchAttendanceRecords();
    }
  };

  const handleViewCalendar = (labourName) => {
    setSelectedLabourForCalendar(labourName);
    // Smooth scroll down to calendar section
    const calendarSection = document.getElementById('calendar-view-section');
    if (calendarSection) {
      calendarSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredRecords = attendanceRecords.filter(rec => {
    const matchesSearch = rec.labour_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.mobile_number?.includes(searchQuery);
    const matchesDate = !filterDate || rec.attendance_date === filterDate;
    const matchesStatus = filterStatus === 'All' || rec.status === filterStatus;
    return matchesSearch && matchesDate && matchesStatus;
  });

  const todayRecords = attendanceRecords.filter(r => r.attendance_date === new Date().toISOString().split('T')[0]);
  const presentCount = todayRecords.filter(r => r.status === 'Present').length;
  const absentCount = todayRecords.filter(r => r.status === 'Absent').length;
  const halfDayCount = todayRecords.filter(r => r.status === 'Half Day').length;

  const activeLabourList = attendanceRecords.length > 0 ? Array.from(new Set(attendanceRecords.map(r => r.labour_name))) : [];
  const targetCalendarLabour = selectedLabourForCalendar || activeLabourList[0] || '';
  const labourHistory = attendanceRecords.filter(r => r.labour_name === targetCalendarLabour);

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
            <a href="/mark-attendance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>📅</span>Make Attendance</a>
            <a href="/labour-list" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>👤</span>Labour Directory</a>
            <a href="/upload-bill" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📄</span>Government Bills</a>
            <a href="/add-challan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📦</span>Material Challan</a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 tracking-wider">People Power Progress</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto" suppressHydrationWarning={true}>
        
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-xs text-slate-400">
            Dashboard <span className="mx-2">›</span> Attendance <span className="mx-2">›</span> <span className="text-white font-medium">Make Attendance</span>
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
                <h1 className="text-2xl font-bold text-white">Make Attendance</h1>
                <p className="text-slate-300 text-xs mt-1">Mark daily attendance for your active labours.</p>
              </div>
              <div className="hidden lg:block text-right -rotate-3">
                <p className="text-sm font-serif italic text-yellow-500">People Power Progress</p>
              </div>
            </div>
          </div>

          {/* Form & Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Mark Attendance Form (2 Cols) */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-[#111827] p-6 rounded-xl border border-slate-800 space-y-6 shadow-xl">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-500 text-slate-950 font-bold flex items-center justify-center text-xs">1</div>
                <h2 className="text-base font-bold text-white">Mark Attendance</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Labour Name (Active only) *</label>
                  <select 
                    value={selectedLabourId} 
                    onChange={(e) => setSelectedLabourId(e.target.value)} 
                    required 
                    className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs cursor-pointer"
                  >
                    <option value="">-- Choose Active Labour ({activeLabours.length} Available) --</option>
                    {activeLabours.map(labour => (
                      <option key={labour.id} value={labour.id}>
                        {labour.labour_name} (ID: LB-{labour.id} | {labour.skill})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date *</label>
                  <input 
                    type="date" 
                    value={attendanceDate} 
                    onChange={(e) => setAttendanceDate(e.target.value)} 
                    required 
                    className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" 
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Attendance Status *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAttendanceStatus('Present')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold transition border flex items-center justify-center gap-2 ${attendanceStatus === 'Present' ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-[#1F2937] text-slate-400 border-slate-700'}`}
                  >
                    🟢 Present
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAttendanceStatus('Absent')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold transition border flex items-center justify-center gap-2 ${attendanceStatus === 'Absent' ? 'bg-red-600 text-white border-red-500 shadow-lg' : 'bg-[#1F2937] text-slate-400 border-slate-700'}`}
                  >
                    🔴 Absent
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAttendanceStatus('Half Day')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold transition border flex items-center justify-center gap-2 ${attendanceStatus === 'Half Day' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg' : 'bg-[#1F2937] text-slate-400 border-slate-700'}`}
                  >
                    🟡 Half Day
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                ℹ️ <strong className="text-white">Note:</strong> Admin mode active. You can mark attendance for any date and labour smoothly.
              </div>

              <div className="flex gap-4 pt-2 border-t border-slate-800">
                <button type="reset" className="w-1/3 bg-transparent border border-slate-700 text-slate-300 py-2.5 rounded-lg text-xs">Reset</button>
                <button type="submit" disabled={loading} className="w-2/3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs shadow-lg cursor-pointer">
                  {loading ? "Marking..." : "Submit Attendance 🚀"}
                </button>
              </div>
            </form>

            {/* Today's Overview Sidebar Card */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Today's Attendance Overview</h3>
                <p className="text-xs text-slate-400">{new Date().toDateString()}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center my-4">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-emerald-400 font-bold text-lg">{presentCount}</span>
                  <p className="text-[10px] text-slate-400 mt-1">Present</p>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-red-400 font-bold text-lg">{absentCount}</span>
                  <p className="text-[10px] text-slate-400 mt-1">Absent</p>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-yellow-400 font-bold text-lg">{halfDayCount}</span>
                  <p className="text-[10px] text-slate-400 mt-1">Half Day</p>
                </div>
              </div>
              <div className="text-xs text-slate-400 text-center border-t border-slate-800 pt-3">
                Total Tracked Today: <strong className="text-white">{todayRecords.length}</strong>
              </div>
            </div>

          </div>

          {/* ATTENDANCE RECORDS TABLE SECTION */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Attendance Records</h2>
                <p className="text-xs text-slate-400 mt-0.5">View, search and manage all submitted attendance records.</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2"
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2 cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                </select>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, mobile..." 
                  className="bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2 w-48" 
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 font-normal">#</th>
                    <th className="pb-3 font-normal">Labour Name</th>
                    <th className="pb-3 font-normal">Labour ID</th>
                    <th className="pb-3 font-normal">Mobile No.</th>
                    <th className="pb-3 font-normal">Site / Location</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal">Attendance Date</th>
                    <th className="pb-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {filteredRecords.map((rec, index) => {
                    let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    if (rec.status === 'Absent') badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                    if (rec.status === 'Half Day') badgeColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5">{index + 1}</td>
                        <td className="font-bold text-white">{rec.labour_name}</td>
                        <td>LB-{rec.labour_id}</td>
                        <td>{rec.mobile_number}</td>
                        <td>{rec.site_location}</td>
                        <td>
                          <span className={`px-2.5 py-1 rounded border text-[10px] font-bold ${badgeColor}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td>{rec.attendance_date}</td>
                        <td className="text-right space-x-2">
                          <button 
                            onClick={() => handleViewCalendar(rec.labour_name)}
                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-3 py-1 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            View Calendar
                          </button>
                          <button 
                            onClick={() => handleDelete(rec.id)}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1 rounded text-[10px]"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-500">
                        Koi attendance record nahi mila.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* LABOUR ATTENDANCE CALENDAR VIEW SECTION */}
          <div id="calendar-view-section" className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6 scroll-mt-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Labour Attendance Calendar View</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select a labour to inspect their monthly attendance history.</p>
              </div>
              
              <select 
                value={targetCalendarLabour}
                onChange={(e) => setSelectedLabourForCalendar(e.target.value)}
                className="bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2 cursor-pointer font-bold"
              >
                {activeLabourList.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-4">History for: <span className="text-yellow-400">{targetCalendarLabour || "Select Labour"}</span></h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {labourHistory.map((h, i) => {
                  let bgCol = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  if (h.status === 'Absent') bgCol = "bg-red-500/10 text-red-400 border-red-500/20";
                  if (h.status === 'Half Day') bgCol = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";

                  return (
                    <div key={i} className={`p-3 rounded-lg border flex justify-between items-center ${bgCol}`}>
                      <div>
                        <p className="font-bold text-xs">📅 {h.attendance_date}</p>
                        <p className="text-[10px] mt-0.5">Site: {h.site_location}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/30">{h.status}</span>
                    </div>
                  );
                })}

                {labourHistory.length === 0 && (
                  <p className="text-xs text-slate-500 py-6">Is labour ka koi attendance history record nahi mila.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}