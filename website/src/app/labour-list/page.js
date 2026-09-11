"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function LabourList() {
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Expanded card tracking & Edit Modal state
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'work' | 'address' | 'documents'
  const [editingLabour, setEditingLabour] = useState(null);
  
  // New file states for Edit Modal
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newDocFile, setNewDocFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    }
    checkUser();
  }, [router]);

  const fetchLabours = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('labour_profile')
      .select('*')
      .order('created_at', { ascending: false }); 

    if (!error) setLabours(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLabours();
  }, []);

  // Quick Status Toggle directly from list
  const handleQuickStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('labour_profile')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("❌ Status update error: " + error.message);
    } else {
      fetchLabours();
    }
  };

  // Delete Labour
  const handleDelete = async (id, name) => {
    if (confirm(`Kya aap ${name} ka record hamesha ke liye delete karna chahte hain?`)) {
      const { error } = await supabase.from('labour_profile').delete().eq('id', id);
      if (!error) {
        alert("✅ Record successfully delete ho gaya!");
        fetchLabours();
      }
    }
  };

  // Handle Full Form Update in Modal (including Photo & Document)
  const handleFullUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    let photoUrl = editingLabour.photo_url;
    let docUrl = editingLabour.document_url;

    try {
      // 1. Upload new photo if selected
      if (newPhotoFile) {
        const photoFileName = `photo_${Date.now()}_${newPhotoFile.name.replace(/\s+/g, '_')}`;
        const { error: photoErr } = await supabase.storage.from('labour-files').upload(photoFileName, newPhotoFile);
        if (!photoErr) {
          const { data: pubUrl } = supabase.storage.from('labour-files').getPublicUrl(photoFileName);
          photoUrl = pubUrl.publicUrl;
        }
      }

      // 2. Upload new document if selected
      if (newDocFile) {
        const docFileName = `doc_${Date.now()}_${newDocFile.name.replace(/\s+/g, '_')}`;
        const { error: docErr } = await supabase.storage.from('labour-files').upload(docFileName, newDocFile);
        if (!docErr) {
          const { data: pubUrl } = supabase.storage.from('labour-files').getPublicUrl(docFileName);
          docUrl = pubUrl.publicUrl;
        }
      }

      // 3. Update database with all fields
      const { error } = await supabase
        .from('labour_profile')
        .update({
          labour_name: editingLabour.labour_name,
          father_name: editingLabour.father_name,
          mobile_number: editingLabour.mobile_number,
          alternate_mobile: editingLabour.alternate_mobile,
          dob: editingLabour.dob,
          skill: editingLabour.skill,
          daily_wage: editingLabour.daily_wage,
          joining_date: editingLabour.joining_date,
          village: editingLabour.village,
          post_office: editingLabour.post_office,
          tehsil: editingLabour.tehsil,
          district: editingLabour.district,
          state: editingLabour.state,
          pincode: editingLabour.pincode,
          status: editingLabour.status,
          photo_url: photoUrl,
          document_url: docUrl
        })
        .eq('id', editingLabour.id);

      if (error) {
        alert("❌ Update error: " + error.message);
      } else {
        alert("✅ Labour details poori tarah update ho gayi!");
        setEditingLabour(null);
        setNewPhotoFile(null);
        setNewDocFile(null);
        fetchLabours();
      }
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredLabours = labours.filter(l => {
    const matchesSearch = l.labour_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.mobile_number.includes(searchQuery);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-300 font-sans">
      
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
            <a href="/add-labour" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>👥</span>Add New Labour</a>
            <a href="/labour-list" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>👤</span>View Labour Details</a>
            <a href="/mark-attendance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📅</span>Attendance</a>
            <a href="/attendance-report" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>₹</span>Salary Report</a>
            <a href="/upload-bill" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📄</span>Government Bills</a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 tracking-wider">Powering<br/>Public Service</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4 w-1/2">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, mobile number..." 
                className="w-full bg-[#1F2937] text-sm text-white placeholder-slate-500 border border-slate-700 rounded-lg pl-10 pr-16 py-2 focus:outline-none focus:border-yellow-500" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-600 rounded-full overflow-hidden">
              <img src="https://i.pravatar.cc/100?img=11" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">Sameer Kimta</p>
              <p className="text-[10px] text-slate-400">Contractor (Class - A)</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Hero Banner */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 flex justify-between items-center relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1541888086225-2be9bfbbaea7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"}}></div>
            <div className="relative z-10">
              <h1 className="text-2xl font-bold text-white">Labour Directory</h1>
              <p className="text-slate-400 text-sm mt-1">Manage status, full details, and documents of all labourers.</p>
            </div>
            <div className="relative z-10">
              <a href="/add-labour" className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm transition shadow-lg flex items-center gap-2">
                <span>+</span> Add New Labour
              </a>
            </div>
          </div>

          {/* Filters & Export Row */}
          <div className="flex justify-between items-center bg-[#111827] p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Filter Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1F2937] text-white text-xs border border-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Left / Village">Left / Village</option>
              </select>
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{filteredLabours.length}</span> labours
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <p className="text-center text-slate-500 py-12">Labour records load ho rahe hain...</p>
          ) : (
            
            /* LABOUR CARDS LIST */
            <div className="space-y-4">
              {filteredLabours.map((labour) => {
                const isExpanded = expandedId === labour.id;
                const currentStatus = labour.status || 'Active';

                // Status Badge Color configuration
                let statusBadgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                if (currentStatus === 'Inactive') statusBadgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
                if (currentStatus === 'On Leave') statusBadgeColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                if (currentStatus === 'Left / Village') statusBadgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";

                return (
                  <div key={labour.id} className="bg-[#111827] rounded-xl border border-slate-800 shadow-xl overflow-hidden transition">
                    
                    {/* MAIN CARD ROW */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      
                      {/* 1. Photo & Name + Status Toggle */}
                      <div className="lg:col-span-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700 relative">
                          {labour.photo_url && labour.photo_url !== "Uploaded_Photo_Placeholder" ? (
                            <img src={labour.photo_url} alt={labour.labour_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No Photo</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{labour.labour_name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Father: <span className="text-white">{labour.father_name}</span></p>
                          
                          {/* Direct Status Selector Dropdown on Card */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Status:</span>
                            <select 
                              value={currentStatus}
                              onChange={(e) => handleQuickStatusChange(labour.id, e.target.value)}
                              className={`text-[10px] font-bold px-2 py-1 rounded border outline-none cursor-pointer bg-[#1F2937] ${statusBadgeColor}`}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="On Leave">On Leave</option>
                              <option value="Left / Village">Left / Village</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 2. Key Info */}
                      <div className="lg:col-span-4 grid grid-cols-2 gap-2 text-xs text-slate-300 border-x border-slate-800 px-4">
                        <div>
                          <p className="text-slate-400">Mobile No.</p>
                          <p className="font-bold text-white mt-0.5">📞 {labour.mobile_number}</p>
                          <p className="text-slate-400 mt-2">Daily Wage</p>
                          <p className="font-bold text-emerald-400 mt-0.5">₹{labour.daily_wage} / Day</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Skill / Trade</p>
                          <p className="font-bold text-yellow-400 mt-0.5">{labour.skill}</p>
                          <p className="text-slate-400 mt-2">Joining Date</p>
                          <p className="font-bold text-white mt-0.5">📆 {labour.joining_date}</p>
                        </div>
                      </div>

                      {/* 3. Action Buttons */}
                      <div className="lg:col-span-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {/* View Documents Button */}
                          {labour.document_url && labour.document_url !== "Uploaded_Doc_Placeholder" ? (
                            <a 
                              href={labour.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition shadow"
                            >
                              👁️ View Docs
                            </a>
                          ) : (
                            <button disabled className="flex-1 bg-slate-800 text-slate-500 text-xs py-2 px-3 rounded-lg cursor-not-allowed">
                              No Doc Found
                            </button>
                          )}

                          {/* Edit Full Form Button */}
                          <button 
                            onClick={() => setEditingLabour(labour)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition shadow flex items-center justify-center gap-1"
                          >
                            <span>✏️</span> Edit Full Form
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Expand/Collapse Detailed View */}
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : labour.id)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-yellow-400 text-xs font-semibold py-2 px-3 rounded-lg transition border border-slate-700 text-center"
                          >
                            {isExpanded ? "▲ Hide Details" : "▼ View Kundli Tabs"}
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDelete(labour.id, labour.labour_name)}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold py-2 px-3 rounded-lg transition shadow"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* EXPANDABLE TABBED SECTION */}
                    {isExpanded && (
                      <div className="bg-[#0f172a] border-t border-slate-800 p-6 space-y-6">
                        
                        {/* Sub-Tabs Header */}
                        <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                          <button 
                            onClick={() => setActiveTab('personal')} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            Personal Details
                          </button>
                          <button 
                            onClick={() => setActiveTab('work')} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'work' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            Work Details
                          </button>
                          <button 
                            onClick={() => setActiveTab('address')} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'address' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            Address Details
                          </button>
                          <button 
                            onClick={() => setActiveTab('documents')} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                            Documents & Status
                          </button>
                        </div>

                        {/* Tab Content 1: Personal Details */}
                        {activeTab === 'personal' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300">
                            <div><span className="text-slate-500 block">Full Name</span><strong className="text-white text-sm">{labour.labour_name}</strong></div>
                            <div><span className="text-slate-500 block">Father's Name</span><strong className="text-white text-sm">{labour.father_name}</strong></div>
                            <div><span className="text-slate-500 block">Mobile Number</span><strong className="text-white text-sm">{labour.mobile_number}</strong></div>
                            <div><span className="text-slate-500 block">Alternate Mobile</span><strong className="text-white text-sm">{labour.alternate_mobile || 'N/A'}</strong></div>
                            <div><span className="text-slate-500 block">Date of Birth</span><strong className="text-white text-sm">{labour.dob || 'N/A'}</strong></div>
                          </div>
                        )}

                        {/* Tab Content 2: Work Details */}
                        {activeTab === 'work' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-300">
                            <div><span className="text-slate-500 block">Skill / Trade</span><strong className="text-yellow-400 text-sm">{labour.skill}</strong></div>
                            <div><span className="text-slate-500 block">Daily Wage</span><strong className="text-emerald-400 text-sm">₹{labour.daily_wage} / Day</strong></div>
                            <div><span className="text-slate-500 block">Joining Date</span><strong className="text-white text-sm">{labour.joining_date}</strong></div>
                          </div>
                        )}

                        {/* Tab Content 3: Address Details */}
                        {activeTab === 'address' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs text-slate-300">
                            <div><span className="text-slate-500 block">Village</span><strong className="text-white">{labour.village}</strong></div>
                            <div><span className="text-slate-500 block">Post Office</span><strong className="text-white">{labour.post_office}</strong></div>
                            <div><span className="text-slate-500 block">Tehsil</span><strong className="text-white">{labour.tehsil}</strong></div>
                            <div><span className="text-slate-500 block">District</span><strong className="text-white">{labour.district}</strong></div>
                            <div><span className="text-slate-500 block">State</span><strong className="text-white">{labour.state}</strong></div>
                            <div><span className="text-slate-500 block">Pin Code</span><strong className="text-white">{labour.pincode}</strong></div>
                          </div>
                        )}

                        {/* Tab Content 4: Documents & Status */}
                        {activeTab === 'documents' && (
                          <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 gap-4">
                            <div>
                              <p className="text-sm font-bold text-white">Current Status: <span className="text-yellow-400">{currentStatus}</span></p>
                              <p className="text-xs text-slate-400 mt-0.5">Aadhaar Card / ID Proof verified document</p>
                            </div>
                            {labour.document_url && labour.document_url !== "Uploaded_Doc_Placeholder" ? (
                              <a href={labour.document_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow">
                                View Full Document ↗
                              </a>
                            ) : (
                              <span className="text-xs text-red-400 font-medium">No document uploaded</span>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

              {filteredLabours.length === 0 && (
                <div className="text-center py-16 bg-[#111827] rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Koi bhi labour record nahi mila.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ================= FULL EDIT FORM MODAL ================= */}
        {editingLabour && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-[#111827] border border-slate-700 rounded-xl p-6 w-full max-w-3xl space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-white">Edit Full Labour Record</h2>
                <button onClick={() => setEditingLabour(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
              </div>

              <form onSubmit={handleFullUpdate} className="space-y-6">
                
                {/* 1. Personal & Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-yellow-500">1. Personal Details & Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400">Labour Name *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.labour_name} 
                        onChange={(e) => setEditingLabour({...editingLabour, labour_name: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Father's Name *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.father_name} 
                        onChange={(e) => setEditingLabour({...editingLabour, father_name: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Status *</label>
                      <select 
                        value={editingLabour.status || 'Active'} 
                        onChange={(e) => setEditingLabour({...editingLabour, status: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Left / Village">Left / Village</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400">Mobile Number *</label>
                      <input 
                        type="text" 
                        required
                        maxLength="10"
                        value={editingLabour.mobile_number} 
                        onChange={(e) => setEditingLabour({...editingLabour, mobile_number: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Alternate Mobile</label>
                      <input 
                        type="text" 
                        maxLength="10"
                        value={editingLabour.alternate_mobile || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, alternate_mobile: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Date of Birth</label>
                      <input 
                        type="date" 
                        value={editingLabour.dob || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, dob: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Work Details */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-yellow-500">2. Work Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400">Skill / Trade *</label>
                      <select 
                        value={editingLabour.skill} 
                        onChange={(e) => setEditingLabour({...editingLabour, skill: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      >
                        <option value="Unskilled (Helper)">Unskilled (Helper)</option>
                        <option value="Semi-Skilled">Semi-Skilled</option>
                        <option value="Skilled (Fitter/Electrician)">Skilled (Fitter/Electrician)</option>
                        <option value="Highly Skilled">Highly Skilled</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Daily Wage (₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={editingLabour.daily_wage} 
                        onChange={(e) => setEditingLabour({...editingLabour, daily_wage: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Joining Date</label>
                      <input 
                        type="date" 
                        value={editingLabour.joining_date || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, joining_date: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Address Details */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-yellow-500">3. Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400">Village *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.village} 
                        onChange={(e) => setEditingLabour({...editingLabour, village: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Post Office *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.post_office || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, post_office: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Tehsil *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.tehsil || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, tehsil: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400">District *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.district || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, district: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">State *</label>
                      <input 
                        type="text" 
                        required
                        value={editingLabour.state || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, state: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Pin Code *</label>
                      <input 
                        type="text" 
                        required
                        maxLength="6"
                        value={editingLabour.pincode || ''} 
                        onChange={(e) => setEditingLabour({...editingLabour, pincode: e.target.value})}
                        className="w-full bg-[#1F2937] border border-slate-700 p-2.5 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Update Photo & Document Files */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-yellow-500">4. Change Photo or Documents (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                      <label className="text-xs text-slate-400 block mb-1">New Profile Photo</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setNewPhotoFile(e.target.files[0])}
                        className="text-xs text-slate-300 w-full"
                      />
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                      <label className="text-xs text-slate-400 block mb-1">New Supporting Document (300KB-500KB)</label>
                      <input 
                        type="file" 
                        accept=".pdf,image/*"
                        onChange={(e) => setNewDocFile(e.target.files[0])}
                        className="text-xs text-slate-300 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="submit" 
                    disabled={updating}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition cursor-pointer"
                  >
                    {updating ? "Saving Changes..." : "Save All Changes 💾"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingLabour(null)} 
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition"
                  >
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