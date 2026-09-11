"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function HpscblTenders() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenders, setTenders] = useState([]);
  
  // Tabs & Filters state
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'OPEX' | 'CAPEX' | 'Camper'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  // Selected Tender for right-side Inspection Panel
  const [selectedTender, setSelectedTender] = useState(null);

  useEffect(() => {
    async function checkUserAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchTenders();
    }
    checkUserAndFetch();
  }, [router]);

  const fetchTenders = async () => {
    setLoading(true);
    // Hum government_bills table se hi data fetch kar rahe hain
    const { data, error } = await supabase
      .from('government_bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTenders(data);
      if (data.length > 0 && !selectedTender) {
        setSelectedTender(data[0]);
      }
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredTenders = tenders.filter(t => {
    // Tab filter (vendor_type matches Opex, Capex, Camper)
    if (activeTab !== 'All') {
      if (activeTab === 'Camper' && t.vendor_type !== 'Camper') return false;
      if (activeTab === 'OPEX' && t.vendor_type !== 'Opex') return false;
      if (activeTab === 'CAPEX' && t.vendor_type !== 'Capex') return false;
    }

    // Search query match across multiple fields
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      t.invoice_no?.toLowerCase().includes(query) ||
      t.po_no?.toLowerCase().includes(query) ||
      t.agreement_no?.toLowerCase().includes(query) ||
      t.nit_no?.toLowerCase().includes(query) ||
      t.title?.toLowerCase().includes(query) ||
      t.bill_location?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesLocation = locationFilter === 'All' || t.bill_location === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Summary Counts
  const totalTendersCount = tenders.length;
  const opexCount = tenders.filter(t => t.vendor_type === 'Opex').length;
  const capexCount = tenders.filter(t => t.vendor_type === 'Capex').length;
  const camperCount = tenders.filter(t => t.vendor_type === 'Camper').length;
  const totalAmountSum = tenders.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

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
            <a href="/hpscbl-tenders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>⚡</span>HPSCBL Tenders</a>
            <a href="/upload-bill" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📄</span>Government Bills</a>
            <a href="/add-challan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📦</span>Material Challan</a>
            <a href="/attendance-report" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>₹</span>Salary Report</a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 tracking-wider">Building Himachal Building Tomorrow</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-xs text-slate-400">
            Dashboard <span className="mx-2">›</span> <span className="text-white font-medium">HPSCBL Tenders</span>
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
            <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{backgroundImage: "url('https://images.unsplash.com/photo-1541888086225-2be9bfbbaea7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"}}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-[#0B1120]/80 to-transparent"></div>
            
            <div className="relative z-10 flex justify-between items-center w-full">
              <div>
                <h1 className="text-2xl font-bold text-white">HPSCBL Tenders</h1>
                <p className="text-slate-300 text-xs mt-1">Search, view and manage all HPSCBL tenders and related documents.</p>
              </div>
              <div className="hidden lg:flex items-center gap-4 bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="text-right">
                  <p className="text-[10px] text-slate-300">Official Tenders</p>
                  <p className="text-xs font-bold text-white">Himachal Pradesh State Electricity Board Ltd.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-slate-950 font-bold flex items-center justify-center text-sm">⚡</div>
              </div>
            </div>
          </div>

          {/* TOP TABS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setActiveTab('All')}
              className={`p-4 rounded-xl border flex items-center justify-between transition ${activeTab === 'All' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg font-bold' : 'bg-[#111827] text-white border-slate-800'}`}
            >
              <span>All Tenders</span>
              <span className="bg-black/20 px-2.5 py-1 rounded-lg text-xs">{totalTendersCount}</span>
            </button>
            <button 
              onClick={() => setActiveTab('OPEX')}
              className={`p-4 rounded-xl border flex items-center justify-between transition ${activeTab === 'OPEX' ? 'bg-blue-600 text-white border-blue-500 shadow-lg font-bold' : 'bg-[#111827] text-white border-slate-800'}`}
            >
              <span>OPEX</span>
              <span className="bg-blue-500/20 px-2.5 py-1 rounded-lg text-xs">{opexCount}</span>
            </button>
            <button 
              onClick={() => setActiveTab('CAPEX')}
              className={`p-4 rounded-xl border flex items-center justify-between transition ${activeTab === 'CAPEX' ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg font-bold' : 'bg-[#111827] text-white border-slate-800'}`}
            >
              <span>CAPEX</span>
              <span className="bg-emerald-500/20 px-2.5 py-1 rounded-lg text-xs">{capexCount}</span>
            </button>
            <button 
              onClick={() => setActiveTab('Camper')}
              className={`p-4 rounded-xl border flex items-center justify-between transition relative ${activeTab === 'Camper' ? 'bg-purple-600 text-white border-purple-500 shadow-lg font-bold' : 'bg-[#111827] text-white border-slate-800'}`}
            >
              <span>Camper Vendor</span>
              <span className="bg-purple-500/20 px-2.5 py-1 rounded-lg text-xs">{camperCount}</span>
            </button>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>🔍</span> Search & Filter Tenders</h3>
              <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); setLocationFilter('All'); }} className="text-xs text-slate-400 hover:text-white">Reset Filters</button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice no., PO no., agreement no., NIT, amount, location, title..." 
                className="w-full bg-[#1F2937] text-xs text-white placeholder-slate-500 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Filter Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg p-2.5">
                  <option value="All">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Filter Location</label>
                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg p-2.5">
                  <option value="All">All Locations</option>
                  {Array.from(new Set(tenders.map(t => t.bill_location))).map((loc, i) => (
                    loc && <option key={i} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button onClick={fetchTenders} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition shadow">
                  Refresh Tenders List 🔄
                </button>
              </div>
            </div>
          </div>

          {/* MAIN GRID: TABLE (LEFT 7 COLS) & INSPECTION PANEL (RIGHT 5 COLS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: Tenders Table (7 Cols) */}
            <div className="lg:col-span-7 bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Tenders List ({filteredTenders.length})</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Click any row to inspect full tender and document details.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 font-normal">#</th>
                      <th className="pb-3 font-normal">Type</th>
                      <th className="pb-3 font-normal">Agreement No.</th>
                      <th className="pb-3 font-normal">Invoice No.</th>
                      <th className="pb-3 font-normal">Amount (₹)</th>
                      <th className="pb-3 font-normal">Location</th>
                      <th className="pb-3 font-normal">Status</th>
                      <th className="pb-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredTenders.map((t, index) => {
                      const isSelected = selectedTender?.id === t.id;

                      let typeBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      if (t.vendor_type === 'Capex') typeBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      if (t.vendor_type === 'Camper') typeBadge = "bg-purple-500/10 text-purple-400 border-purple-500/20";

                      let statusBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      if (t.status === 'Approved') statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      if (t.status === 'Under Review') statusBadge = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";

                      return (
                        <tr 
                          key={t.id} 
                          onClick={() => setSelectedTender(t)}
                          className={`hover:bg-slate-800/50 transition cursor-pointer ${isSelected ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : ''}`}
                        >
                          <td className="py-3.5">{index + 1}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${typeBadge}`}>
                              {t.vendor_type || 'Opex'}
                            </span>
                          </td>
                          <td className="font-bold text-white">{t.agreement_no}</td>
                          <td>{t.invoice_no}</td>
                          <td className="font-bold text-emerald-400">₹{t.amount?.toLocaleString('en-IN')}</td>
                          <td>{t.bill_location}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusBadge}`}>
                              {t.status}
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

                    {filteredTenders.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-500">
                          Koi tender record nahi mila.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* RIGHT: Tender Details Inspection Panel (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {selectedTender ? (
                <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6 sticky top-6">
                  
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>📄</span> Tender Details
                    </h3>
                    {selectedTender.pdf_url && (
                      <a href={selectedTender.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow">
                        View PDF ↗
                      </a>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedTender.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded font-bold">{selectedTender.status}</span>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2.5 py-0.5 rounded font-bold">{selectedTender.vendor_type || 'Opex'}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">Agreement No.</span> <strong className="text-white">{selectedTender.agreement_no}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">Invoice No.</span> <strong className="text-white">{selectedTender.invoice_no}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">PO Number</span> <strong className="text-white">{selectedTender.po_no}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">NIT Number</span> <strong className="text-white">{selectedTender.nit_no}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">Invoice Date</span> <strong className="text-white">{selectedTender.invoice_date}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">Agreement Date</span> <strong className="text-white">{selectedTender.agreement_date}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">Amount</span> <strong className="text-emerald-400 font-bold text-sm">₹{selectedTender.amount?.toLocaleString('en-IN')}</strong></div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-slate-500">Location</span> <strong className="text-white">{selectedTender.bill_location}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Issued By</span> <strong className="text-yellow-400">{selectedTender.issued_by}</strong></div>
                  </div>

                  {/* Official PDF Document Card */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white">Official Attached Document (PDF)</h4>
                    {selectedTender.pdf_url ? (
                      <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-300 truncate max-w-[200px]">Official_Tender_Bill.pdf</span>
                        <a href={selectedTender.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-[10px] font-semibold">
                          Download ⬇
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No PDF attached.</p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-[#111827] p-12 rounded-xl border border-slate-800 text-center text-slate-500">
                  Left table se kisi tender par click karein.
                </div>
              )}

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}