"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function AddNewSite() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  
  // Tabs state: 'Government' | 'Company'
  const [siteType, setSiteType] = useState('Government');

  // Expanded site for Kundli View & Edit
  const [expandedId, setExpandedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Form Fields State
  const [title, setTitle] = useState('');
  const [tenderNo, setTenderNo] = useState('');
  const [tenderPrice, setTenderPrice] = useState('');
  const [workOrderDate, setWorkOrderDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('31.1048');
  const [longitude, setLongitude] = useState('77.1734');
  const [department, setDepartment] = useState('HPSEBL');
  const [workType, setWorkType] = useState('Electrical Line Work');
  const [workCategory, setWorkCategory] = useState('HT Line');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [description, setDescription] = useState('');
  const [drawingNo, setDrawingNo] = useState('');

  // Selected Project for Material Allocation & Store stock
  const [selectedProject, setSelectedProject] = useState(null);
  const [siteMaterials, setSiteMaterials] = useState([]);
  const [storeStockItems, setStoreStockItems] = useState([]); // Godown store raw items
  const [allAllocatedMaterials, setAllAllocatedMaterials] = useState([]); // Sabhi sites par kitna use ho gaya

  // Dynamic Multi-Row Allocation State
  const [allocationRows, setAllocationRows] = useState([
    { material_name: '', qty_used: '' }
  ]);

  useEffect(() => {
    async function checkUserAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await fetchProjects();
      await fetchStoreStock();
      await fetchAllAllocations();
    }
    checkUserAndFetch();
  }, [router]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
        fetchSiteMaterials(data[0].id);
      }
    }
  };

  const fetchStoreStock = async () => {
    const { data, error } = await supabase.from('challan_items').select('*');
    if (!error && data) {
      setStoreStockItems(data);
    }
  };

  const fetchAllAllocations = async () => {
    const { data, error } = await supabase.from('site_materials').select('*');
    if (!error && data) {
      setAllAllocatedMaterials(data);
    }
  };

  const fetchSiteMaterials = async (projectId) => {
    const { data } = await supabase
      .from('site_materials')
      .select('*')
      .eq('project_id', projectId);
    if (data) setSiteMaterials(data);
  };

  // Calculate live remaining stock for a material across all sites
  const getRemainingStock = (materialName) => {
    const matchingStoreItems = storeStockItems.filter(i => i.description === materialName);
    const totalReceived = matchingStoreItems.reduce((acc, curr) => acc + Number(curr.qty_received || 0), 0);

    const matchingAllocations = allAllocatedMaterials.filter(a => a.material_name === materialName);
    const totalUsed = matchingAllocations.reduce((acc, curr) => acc + Number(curr.qty_used || 0), 0);

    return totalReceived - totalUsed;
  };

  // Submit New Site
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        site_type: siteType,
        title: title || 'Untitled Site',
        tender_no: tenderNo || 'N/A',
        tender_price: Number(tenderPrice || 0),
        work_order_date: workOrderDate || null,
        completion_date: completionDate || null,
        location: location || 'Rampur',
        latitude,
        longitude,
        department,
        work_type: workType,
        work_category: workCategory,
        estimated_cost: Number(estimatedCost || 0),
        actual_cost: Number(actualCost || 0),
        description: description || '-',
        drawing_no: drawingNo || 'N/A',
        status: 'Active'
      };

      const { data, error } = await supabase.from('projects').insert([payload]).select().single();
      if (error) throw error;

      alert("🎉 New Project / Site Successfully Created!");
      setTitle('');
      setTenderNo('');
      setTenderPrice('');
      setLocation('');
      setDescription('');
      setDrawingNo('');
      await fetchProjects();
      if (data) {
        setSelectedProject(data);
        fetchSiteMaterials(data.id);
      }

    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update Site Details
  const handleUpdateSite = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('projects')
      .update(editForm)
      .eq('id', editForm.id);

    if (!error) {
      alert("✅ Site details updated successfully!");
      setIsEditing(false);
      fetchProjects();
    } else {
      alert("❌ Error: " + error.message);
    }
  };

  // Delete Site
  const handleDeleteSite = async (id, name) => {
    if (confirm(`Kya aap site "${name}" ko delete karna chahte hain?`)) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  };

  // Dynamic Row Handlers
  const handleAddRow = () => {
    setAllocationRows([...allocationRows, { material_name: '', qty_used: '' }]);
  };

  const handleRemoveRow = (index) => {
    const list = [...allocationRows];
    list.splice(index, 1);
    setAllocationRows(list);
  };

  const handleRowChange = (index, field, value) => {
    const list = [...allocationRows];
    list[index][field] = value;
    setAllocationRows(list);
  };

  // Bulk Save Material Allocation with Validation
  const handleSaveAllocation = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      // Validate quantities against remaining stock
      for (const row of allocationRows) {
        const remaining = getRemainingStock(row.material_name);
        if (Number(row.qty_used) > remaining) {
          alert(`❌ Error: "${row.material_name}" ka available stock sirf ${remaining} hai, aap ${row.qty_used} allocate nahi kar sakte!`);
          return;
        }
      }

      const rowsToInsert = allocationRows.map(row => ({
        project_id: selectedProject.id,
        material_name: row.material_name,
        challan_no: 'MC-STORE-CHALLAN',
        challan_date: new Date().toISOString().split('T')[0],
        qty_challan: Number(row.qty_used || 0),
        qty_used: Number(row.qty_used || 0),
        remarks: 'Installed on site from Store'
      }));

      const { error } = await supabase.from('site_materials').insert(rowsToInsert);
      if (error) throw error;

      alert("✅ Materials successfully allocated to this site!");
      setAllocationRows([{ material_name: '', qty_used: '' }]);
      await fetchAllAllocations();
      fetchSiteMaterials(selectedProject.id);

    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

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
            <a href="/add-site" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>🏗️</span>Projects / Sites</a>
            <a href="/hpscbl-tenders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>⚡</span>HPSEBL Tenders</a>
            <a href="/upload-bill" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📄</span>Government Bills</a>
            <a href="/add-challan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📦</span>Material Challan</a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 tracking-wider">Building Infrastructure for a Better Tomorrow</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-xs text-slate-400">
            Dashboard <span className="mx-2">›</span> Projects / Sites <span className="mx-2">›</span> <span className="text-white font-medium">Manage & Add Sites</span>
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
                <h1 className="text-2xl font-bold text-white">Projects & Sites Management</h1>
                <p className="text-slate-300 text-xs mt-1">Create, inspect, allocate store material and update government/company sites.</p>
              </div>
              <div className="hidden lg:block text-right -rotate-3">
                <p className="text-sm font-serif italic text-yellow-500">Building Infrastructure for a Better Tomorrow</p>
              </div>
            </div>
          </div>

          {/* SITE TYPE TOGGLE BUTTONS */}
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setSiteType('Government')}
              className={`py-3 px-6 rounded-xl text-xs font-bold transition border flex items-center gap-2 cursor-pointer ${siteType === 'Government' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg' : 'bg-[#111827] text-white border-slate-800'}`}
            >
              🏛️ Government Sites
            </button>
            <button 
              type="button" 
              onClick={() => setSiteType('Company')}
              className={`py-3 px-6 rounded-xl text-xs font-bold transition border flex items-center gap-2 cursor-pointer ${siteType === 'Company' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg' : 'bg-[#111827] text-white border-slate-800'}`}
            >
              🏢 Company Sites
            </button>
          </div>

          {/* MAIN FORM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* FORM SECTION (LEFT 7 COLS) */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-[#111827] p-6 rounded-xl border border-slate-800 space-y-6 shadow-xl">
              
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-500 text-slate-950 font-bold flex items-center justify-center text-xs">1</div>
                <h2 className="text-base font-bold text-white">Add New {siteType} Site</h2>
              </div>

              {siteType === 'Government' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Title of Work *</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HT Line Work - Rampur" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Tender Number *</label>
                      <input type="text" required value={tenderNo} onChange={(e) => setTenderNo(e.target.value)} placeholder="e.g. NIT-2025-11" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Tender Price (₹) *</label>
                      <input type="number" required value={tenderPrice} onChange={(e) => setTenderPrice(e.target.value)} placeholder="1248560" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Work Order Date *</label>
                      <input type="date" required value={workOrderDate} onChange={(e) => setWorkOrderDate(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Date of Completion *</label>
                      <input type="date" required value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Site Location / Address *</label>
                    <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Rampur, Himachal Pradesh" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Project / Company Site Title *</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Private Sub-Station Setup" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Drawing Number *</label>
                      <input type="text" required value={drawingNo} onChange={(e) => setDrawingNo(e.target.value)} placeholder="e.g. DWG-2026-001" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Location / Address *</label>
                    <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kotkhai Industrial Area" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                </>
              )}

              {/* Work Details */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-500 text-slate-950 font-bold flex items-center justify-center text-xs">2</div>
                  <h2 className="text-base font-bold text-white">Work Details & Costs</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs">
                      <option value="HPSEBL">HPSEBL</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Cost (₹)</label>
                    <input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="1000000" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Actual Cost (₹)</label>
                    <input type="number" value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder="950000" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Work Description</label>
                  <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter full work description..." className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs"></textarea>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition shadow-lg text-xs cursor-pointer">
                {loading ? "Creating Site..." : "Save Project / Site 🚀"}
              </button>
            </form>

            {/* STORE STOCK SUMMARY (RIGHT 5 COLS) - Live Remaining Stock */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">📦 Godown / Store Material Stock</h3>
                <p className="text-xs text-slate-400">Live remaining stock available for sites:</p>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Array.from(new Set(storeStockItems.map(i => i.description))).map((matName, idx) => {
                    const remaining = getRemainingStock(matName);
                    const sampleItem = storeStockItems.find(i => i.description === matName);

                    return (
                      <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{matName}</p>
                          <p className="text-[10px] text-slate-400">Unit: {sampleItem?.unit || 'Nos'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {remaining} {sampleItem?.unit || 'Nos'}
                          </p>
                          <p className="text-[9px] text-slate-500">Remaining Stock</p>
                        </div>
                      </div>
                    );
                  })}

                  {storeStockItems.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-6">Store mein abhi koi material recorded nahi hai.</p>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* ================= EXISTING SITES & PROJECTS DIRECTORY ================= */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Existing Projects & Active Sites Directory ({projects.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click "View Kundli & Material" to inspect site details, update status, or allocate store material.</p>
              </div>
            </div>

            <div className="space-y-4">
              {projects.map((p) => {
                const isExpanded = expandedId === p.id;
                const isEditingThis = isEditing && editForm.id === p.id;

                return (
                  <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow">
                    
                    {/* Main Row */}
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
                      <div className="lg:col-span-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">{p.site_type} Site</span>
                        <h3 className="font-bold text-white text-sm mt-1">{p.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Location: {p.location}</p>
                      </div>

                      <div className="lg:col-span-4 space-y-1 border-x border-slate-800 px-3">
                        <p className="text-slate-400">Department: <span className="text-white font-medium">{p.department}</span></p>
                        <p className="text-slate-400">Tender No: <span className="text-white font-medium">{p.tender_no || 'N/A'}</span></p>
                        <p className="text-slate-400">Completion: <span className="text-white font-medium">{p.completion_date || 'N/A'}</span></p>
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-slate-400">Tender Price</p>
                        <p className="font-bold text-emerald-400 text-sm mt-0.5">₹{Number(p.tender_price || 0).toLocaleString('en-IN')}</p>
                      </div>

                      <div className="lg:col-span-3 flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedProject(p);
                            fetchSiteMaterials(p.id);
                            setExpandedId(isExpanded ? null : p.id);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-yellow-400 font-semibold py-1.5 px-3 rounded text-[11px] border border-slate-700 cursor-pointer"
                        >
                          {isExpanded ? "▲ Hide Kundli" : "▼ View Kundli & Material"}
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteSite(p.id, p.title)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-1.5 rounded text-[11px]"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE KUNDLI & EDIT SECTION */}
                    {isExpanded && (
                      <div className="bg-[#0b1329] border-t border-slate-800 p-6 space-y-6 text-xs">
                        
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <h4 className="text-sm font-bold text-white">Site Inspection & Material Allocation: <span className="text-yellow-400">{p.title}</span></h4>
                          <button 
                            onClick={() => {
                              setIsEditing(!isEditingThis);
                              setEditForm(p);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded"
                          >
                            {isEditingThis ? "Cancel Edit" : "✏️ Edit Site Details"}
                          </button>
                        </div>

                        {/* EDIT FORM OR VIEW DETAILS */}
                        {isEditingThis ? (
                          <form onSubmit={handleUpdateSite} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
                            <h5 className="font-bold text-yellow-500">Update Site Particulars</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-400 mb-1">Title</label>
                                <input type="text" value={editForm.title || ''} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full bg-[#1F2937] p-2 rounded text-white" />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Location</label>
                                <input type="text" value={editForm.location || ''} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full bg-[#1F2937] p-2 rounded text-white" />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Tender Price (₹)</label>
                                <input type="number" value={editForm.tender_price || ''} onChange={(e) => setEditForm({...editForm, tender_price: e.target.value})} className="w-full bg-[#1F2937] p-2 rounded text-white" />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Completion Date</label>
                                <input type="date" value={editForm.completion_date || ''} onChange={(e) => setEditForm({...editForm, completion_date: e.target.value})} className="w-full bg-[#1F2937] p-2 rounded text-white" />
                              </div>
                            </div>
                            <button type="submit" className="bg-emerald-600 text-white font-bold py-2 px-4 rounded">Save Changes 💾</button>
                          </form>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div><span className="text-slate-500 block">Department</span><strong className="text-white">{p.department}</strong></div>
                            <div><span className="text-slate-500 block">Work Order Date</span><strong className="text-white">{p.work_order_date || 'N/A'}</strong></div>
                            <div><span className="text-slate-500 block">Estimated Cost</span><strong className="text-emerald-400">₹{p.estimated_cost || 0}</strong></div>
                            <div><span className="text-slate-500 block">Actual Cost</span><strong className="text-yellow-400">₹{p.actual_cost || 0}</strong></div>
                            <div className="col-span-2 md:col-span-4"><span className="text-slate-500 block">Description</span><strong className="text-slate-300">{p.description || 'No description provided.'}</strong></div>
                          </div>
                        )}

                        {/* MATERIAL ALLOCATION TO THIS SITE (DYNAMIC ROWS + GODOWN STORE DROPDOWN WITH LIVE BALANCE) */}
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-white">Allocate Material from Store to This Site</h4>
                            <button type="button" onClick={handleAddRow} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded shadow">
                              + Add Row
                            </button>
                          </div>
                          
                          <form onSubmit={handleSaveAllocation} className="space-y-3">
                            {allocationRows.map((row, index) => {
                              const remainingStock = row.material_name ? getRemainingStock(row.material_name) : null;

                              return (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                                  
                                  <div className="md:col-span-7">
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Select Material from Store *</label>
                                    <select 
                                      required
                                      value={row.material_name}
                                      onChange={(e) => handleRowChange(index, 'material_name', e.target.value)}
                                      className="w-full bg-[#1F2937] border border-slate-700 p-2 rounded text-white text-xs cursor-pointer"
                                    >
                                      <option value="">-- Choose Material from Store --</option>
                                      {Array.from(new Set(storeStockItems.map(i => i.description))).map((matName, sIdx) => {
                                        const rem = getRemainingStock(matName);
                                        return (
                                          <option key={sIdx} value={matName}>
                                            {matName} (Available Balance: {rem})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  <div className="md:col-span-3">
                                    <label className="text-[10px] text-slate-400 block mb-0.5">
                                      Quantity to Install * {remainingStock !== null && <span className="text-emerald-400">(Max: {remainingStock})</span>}
                                    </label>
                                    <input 
                                      type="number" 
                                      required 
                                      max={remainingStock !== null ? remainingStock : undefined}
                                      value={row.qty_used} 
                                      onChange={(e) => handleRowChange(index, 'qty_used', e.target.value)} 
                                      placeholder="Qty" 
                                      className="w-full bg-[#1F2937] border border-slate-700 p-2 rounded text-white text-xs" 
                                    />
                                  </div>

                                  <div className="md:col-span-2 flex items-end">
                                    {allocationRows.length > 1 && (
                                      <button type="button" onClick={() => handleRemoveRow(index)} className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded transition w-full text-center">
                                        🗑️ Remove
                                      </button>
                                    )}
                                  </div>

                                </div>
                              );
                            })}

                            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 rounded transition cursor-pointer text-xs shadow">
                              Save Material Allocations 🚀
                            </button>
                          </form>

                          {/* Allocated Material List Table */}
                          <div className="overflow-x-auto pt-2">
                            <table className="w-full text-left text-xs">
                              <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider">
                                <tr>
                                  <th className="pb-3 font-normal">#</th>
                                  <th className="pb-3 font-normal">Material Name</th>
                                  <th className="pb-3 font-normal">Installed Qty</th>
                                  <th className="pb-3 font-normal text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {siteMaterials.map((m, idx) => (
                                  <tr key={m.id || idx} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3.5">{idx + 1}</td>
                                    <td className="font-bold text-white">{m.material_name}</td>
                                    <td className="text-blue-400 font-semibold">{m.qty_used}</td>
                                    <td className="text-right">
                                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 text-[10px] font-bold">
                                        Installed on Site
                                      </span>
                                    </td>
                                  </tr>
                                ))}

                                {siteMaterials.length === 0 && (
                                  <tr>
                                    <td colSpan="4" className="text-center py-6 text-slate-500">
                                      Is site par abhi koi material allocate nahi kiya gaya hai.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Koi bhi site ya project create nahi kiya gaya hai.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}