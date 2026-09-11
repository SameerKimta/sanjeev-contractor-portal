"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function AddMaterialChallan() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [challans, setChallans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expanded card tracking & Tabs
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'items'

  // Form Header States
  const [challanType, setChallanType] = useState('Company Challan');
  const [challanNo, setChallanNo] = useState('');
  const [challanDate, setChallanDate] = useState('');
  const [storeEngineer, setStoreEngineer] = useState('');
  const [townLocation, setTownLocation] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  // Smart Meter Specific States
  const [meterSerials, setMeterSerials] = useState('');
  const [meterPhoto, setMeterPhoto] = useState(null);

  // Dynamic Items Rows State (For Company & Govt Supply)
  const [items, setItems] = useState([
    { description: '', unit: 'Nos', qty_challan: '', qty_received: '', item_price: '', remarks: '' }
  ]);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchChallans();
    }
    checkUser();
  }, [router]);

  const fetchChallans = async () => {
    const { data, error } = await supabase
      .from('material_challans')
      .select('*, challan_items(*)')
      .order('created_at', { ascending: false });

    if (!error) setChallans(data || []);
  };

  const handleAddRow = () => {
    setItems([...items, { description: '', unit: 'Nos', qty_challan: '', qty_received: '', item_price: '', remarks: '' }]);
  };

  const handleRemoveRow = (index) => {
    const list = [...items];
    list.splice(index, 1);
    setItems(list);
  };

  const handleItemChange = (index, field, value) => {
    const list = [...items];
    list[index][field] = value;
    setItems(list);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("❌ File size cannot exceed 10 MB!");
        e.target.value = "";
        return;
      }
      setPdfFile(file);
    }
  };

  // Submit Challan
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let pdfUrl = "";

    try {
      const fileToUpload = pdfFile || meterPhoto;
      if (fileToUpload) {
        const fileName = `challan_${Date.now()}_${fileToUpload.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('govt_bills')
          .upload(fileName, fileToUpload);

        if (!uploadError) {
          const { data: pubUrl } = supabase.storage.from('govt_bills').getPublicUrl(fileName);
          pdfUrl = pubUrl.publicUrl;
        }
      }

      // Insert Main Challan
      const { data: challanData, error: challanError } = await supabase
        .from('material_challans')
        .insert([{
          challan_type: challanType,
          challan_no: challanType === 'Smart Meter Stock' ? `METER-${Date.now().toString().slice(-6)}` : challanNo,
          challan_date: challanDate,
          store_engineer: storeEngineer,
          town_location: townLocation,
          received_by: receivedBy,
          vehicle_no: vehicleNo || 'N/A',
          pdf_url: pdfUrl,
          status: 'Submitted'
        }])
        .select()
        .single();

      if (challanError) throw challanError;
      const challanId = challanData.id;

      // Insert Items
      if (challanType === 'Smart Meter Stock') {
        await supabase.from('challan_items').insert([{
          challan_id: challanId,
          description: `Smart Meters Stock (Serials: ${meterSerials})`,
          unit: 'Nos',
          qty_challan: meterSerials.split(',').length,
          qty_received: meterSerials.split(',').length,
          meter_serials: meterSerials,
          remarks: 'Meter Serial Range Stock'
        }]);
      } else {
        const itemsToInsert = items.map(item => ({
          challan_id: challanId,
          description: item.description,
          unit: item.unit,
          qty_challan: Number(item.qty_challan),
          qty_received: Number(item.qty_received),
          item_price: challanType === 'Government Supply' ? Number(item.item_price || 0) : 0,
          remarks: item.remarks || '-'
        }));
        await supabase.from('challan_items').insert(itemsToInsert);
      }

      alert("🎉 Material / Meter Stock Successfully Record Ho Gaya!");
      
      setChallanNo('');
      setChallanDate('');
      setStoreEngineer('');
      setTownLocation('');
      setReceivedBy('');
      setVehicleNo('');
      setMeterSerials('');
      setPdfFile(null);
      setMeterPhoto(null);
      setItems([{ description: '', unit: 'Nos', qty_challan: '', qty_received: '', item_price: '', remarks: '' }]);
      fetchChallans();

    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from('material_challans').update({ status: newStatus }).eq('id', id);
    fetchChallans();
  };

  const handleDelete = async (id, no) => {
    if (confirm(`Kya aap challan ${no} delete karna chahte hain?`)) {
      await supabase.from('material_challans').delete().eq('id', id);
      fetchChallans();
    }
  };

  const filteredChallans = challans.filter(c => 
    c.challan_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.town_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.challan_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <a href="/add-challan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>📦</span>Material Challan</a>
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
          <div className="text-xs text-slate-400">
            Dashboard <span className="mx-2">›</span> Material & Challans <span className="mx-2">›</span> <span className="text-white font-medium">Add Material Challan / Stock</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              <span>🔒</span> SECURE | GOVERNMENT PROJECTS
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
                <h1 className="text-2xl font-bold text-white">Material Challan & Smart Meter Stock</h1>
                <p className="text-slate-300 text-xs mt-1">Record company challans, government supply with pricing, or smart meter serial stocks.</p>
              </div>
              <div className="hidden lg:block text-right -rotate-3">
                <p className="text-sm font-serif italic text-yellow-500">Reliable Infrastructure for a Better Tomorrow</p>
              </div>
            </div>
          </div>

          {/* Form & Guidelines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section (2 Cols) */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-[#111827] p-6 rounded-xl border border-slate-800 space-y-6 shadow-xl">
              
              {/* Challan Type Selector */}
              <div className="border-b border-slate-800 pb-4">
                <label className="block text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider">Select Challan / Stock Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setChallanType('Company Challan')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold transition border ${challanType === 'Company Challan' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg' : 'bg-[#1F2937] text-slate-300 border-slate-700'}`}
                  >
                    📦 Company Challan
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChallanType('Government Supply')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold transition border ${challanType === 'Government Supply' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg' : 'bg-[#1F2937] text-slate-300 border-slate-700'}`}
                  >
                    🏛️ Government Supply
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChallanType('Smart Meter Stock')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold transition border ${challanType === 'Smart Meter Stock' ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg' : 'bg-[#1F2937] text-slate-300 border-slate-700'}`}
                  >
                    ⚡ Smart Meter Stock
                  </button>
                </div>
              </div>

              {/* Section 1: General Information */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-yellow-500 text-slate-950 flex items-center justify-center text-xs font-bold">1</span> 
                  General Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {challanType !== 'Smart Meter Stock' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Challan Number *</label>
                      <input type="text" required value={challanNo} onChange={(e) => setChallanNo(e.target.value)} placeholder="e.g. MC-2026-015" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Challan / Entry Date *</label>
                    <input type="date" required value={challanDate} onChange={(e) => setChallanDate(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Store Engineer *</label>
                    <input type="text" required value={storeEngineer} onChange={(e) => setStoreEngineer(e.target.value)} placeholder="Engineer name" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Town / Location *</label>
                    <input type="text" required value={townLocation} onChange={(e) => setTownLocation(e.target.value)} placeholder="e.g. Kotkhai / Rampur" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Received By *</label>
                    <input type="text" required value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Receiver name / mobile" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Vehicle Number</label>
                    <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g. HP-01-1234" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                  </div>
                </div>
              </div>

              {/* Section 2: Conditional Items or Smart Meter Serials */}
              {challanType === 'Smart Meter Stock' ? (
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-yellow-500 text-slate-950 flex items-center justify-center text-xs font-bold">2</span> 
                    Smart Meter Serial Numbers & Barcodes
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Enter Serial Numbers (Comma separated or range) *</label>
                    <textarea rows="4" required value={meterSerials} onChange={(e) => setMeterSerials(e.target.value)} placeholder="e.g. SM-9001, SM-9002, SM-9003..." className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-yellow-500"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Upload Meter Photo / Box Barcode (Optional)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => setMeterPhoto(e.target.files[0])} className="text-xs text-slate-300 w-full bg-[#1F2937] p-2 rounded border border-slate-700" />
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-yellow-500 text-slate-950 flex items-center justify-center text-xs font-bold">2</span> 
                      Material Items Details
                    </h2>
                    <button type="button" onClick={handleAddRow} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition shadow">
                      + Add Row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div className={challanType === 'Government Supply' ? "md:col-span-3" : "md:col-span-4"}>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Description *</label>
                          <input type="text" required value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Material name" className="w-full bg-[#1F2937] border border-slate-700 rounded p-2 text-white text-xs" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Unit *</label>
                          <select value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded p-2 text-white text-xs">
                            <option value="Nos">Nos</option>
                            <option value="Meter">Meter</option>
                            <option value="Kg">Kg</option>
                            <option value="Bundle">Bundle</option>
                            <option value="Drum">Drum</option>
                          </select>
                        </div>
                        {challanType === 'Government Supply' && (
                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Price (₹) *</label>
                            <input type="number" required value={item.item_price} onChange={(e) => handleItemChange(index, 'item_price', e.target.value)} placeholder="Unit Price" className="w-full bg-[#1F2937] border border-slate-700 rounded p-2 text-white text-xs" />
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Challan Qty *</label>
                          <input type="number" required value={item.qty_challan} onChange={(e) => handleItemChange(index, 'qty_challan', e.target.value)} placeholder="Challan" className="w-full bg-[#1F2937] border border-slate-700 rounded p-2 text-white text-xs" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Received Qty *</label>
                          <input type="number" required value={item.qty_received} onChange={(e) => handleItemChange(index, 'qty_received', e.target.value)} placeholder="Received" className="w-full bg-[#1F2937] border border-slate-700 rounded p-2 text-white text-xs" />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          {items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveRow(index)} className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded transition w-full text-center">
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Supporting Documents */}
              {challanType !== 'Smart Meter Stock' && (
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-yellow-500 text-slate-950 flex items-center justify-center text-xs font-bold">3</span> 
                    Supporting Challan PDF
                  </h2>
                  <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-6 text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-xs text-white font-medium mb-1">{pdfFile ? `Selected: ${pdfFile.name}` : "Upload Challan Copy (PDF)"}</p>
                    <label className="bg-slate-800 hover:bg-slate-700 text-yellow-500 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer border border-slate-700 inline-block">
                      Choose File
                      <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg transition shadow-lg text-xs cursor-pointer">
                {loading ? "Saving Record..." : "Submit Material Record 🚀"}
              </button>
            </form>

            {/* Guidelines */}
            <div className="space-y-6">
              <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-500">ℹ️</span> System Guidelines
                </h3>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-start gap-2"><span>✔</span> Switch between Company, Govt Supply & Meters.</li>
                  <li className="flex items-start gap-2"><span>✔</span> Track short/damaged materials via remarks.</li>
                  <li className="flex items-start gap-2"><span>✔</span> Smart Meter stocks log serial numbers directly.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* RECENT CHALLANS DIRECTORY WITH "KUNDLI TABS" VIEW */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Recent Material & Stock Records</h2>
                <p className="text-xs text-slate-400 mt-0.5">View full details and items via expand tabs.</p>
              </div>
              <div className="w-72">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search challan, location..." 
                  className="w-full bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2" 
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredChallans.map((ch) => {
                const isExpanded = expandedId === ch.id;

                let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                if (ch.challan_type === 'Government Supply') badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                if (ch.challan_type === 'Smart Meter Stock') badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";

                return (
                  <div key={ch.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
                      <div className="lg:col-span-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>{ch.challan_type}</span>
                        <h3 className="font-bold text-white text-sm mt-1">{ch.challan_no}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Town: {ch.town_location}</p>
                      </div>

                      <div className="lg:col-span-4 space-y-1 border-x border-slate-800 px-3">
                        <p className="text-slate-400">Engineer: <span className="text-white font-medium">{ch.store_engineer}</span></p>
                        <p className="text-slate-400">Received By: <span className="text-white font-medium">{ch.received_by}</span></p>
                        <p className="text-slate-400">Date: <span className="text-white">{ch.challan_date}</span></p>
                      </div>

                      <div className="lg:col-span-5 flex items-center justify-end gap-3">
                        <select 
                          value={ch.status || 'Submitted'}
                          onChange={(e) => handleStatusChange(ch.id, e.target.value)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded border bg-[#1F2937] text-white cursor-pointer"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Verified">Verified</option>
                          <option value="Discrepancy">Discrepancy</option>
                        </select>

                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : ch.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-yellow-400 font-semibold py-1.5 px-3 rounded text-[11px] border border-slate-700"
                        >
                          {isExpanded ? "▲ Hide Kundli" : "▼ View Items & PDF"}
                        </button>

                        <button 
                          onClick={() => handleDelete(ch.id, ch.challan_no)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-1.5 rounded text-[11px]"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE "KUNDLI TABS" FOR ITEMS */}
                    {isExpanded && (
                      <div className="bg-[#0b1329] border-t border-slate-800 p-6 space-y-4 text-xs">
                        <div className="flex gap-2 border-b border-slate-800 pb-3">
                          <button onClick={() => setActiveTab('info')} className={`px-3 py-1.5 rounded font-bold transition ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            General Information
                          </button>
                          <button onClick={() => setActiveTab('items')} className={`px-3 py-1.5 rounded font-bold transition ${activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            Material / Meter Items List
                          </button>
                        </div>

                        {activeTab === 'info' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                            <div><span className="text-slate-500 block">Challan Type</span><strong className="text-yellow-400">{ch.challan_type}</strong></div>
                            <div><span className="text-slate-500 block">Store Engineer</span><strong className="text-white">{ch.store_engineer}</strong></div>
                            <div><span className="text-slate-500 block">Vehicle Number</span><strong className="text-white">{ch.vehicle_no}</strong></div>
                            <div><span className="text-slate-500 block">Receiver</span><strong className="text-white">{ch.received_by}</strong></div>
                          </div>
                        )}

                        {activeTab === 'items' && (
                          <div className="space-y-3">
                            {ch.challan_items?.map((item, idx) => (
                              <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-white">{item.description}</p>
                                  {item.meter_serials && <p className="text-[10px] text-purple-400 mt-0.5">Serials: {item.meter_serials}</p>}
                                </div>
                                <div className="flex gap-6 text-slate-300">
                                  {item.item_price > 0 && <span>Price: ₹{item.item_price}</span>}
                                  <span>Challan Qty: <strong>{item.qty_challan} {item.unit}</strong></span>
                                  <span>Received Qty: <strong className="text-emerald-400">{item.qty_received} {item.unit}</strong></span>
                                </div>
                              </div>
                            ))}

                            {ch.pdf_url && (
                              <div className="pt-2 text-right">
                                <a href={ch.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow inline-block">
                                  View Official Challan PDF ↗
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}