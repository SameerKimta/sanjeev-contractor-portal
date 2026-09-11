"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function UploadBill() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Expanded card tracking & Tabs
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' | 'contract' | 'department' | 'status'

  // Form states
  const [pdfFile, setPdfFile] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [poNo, setPoNo] = useState('');
  const [vendorType, setVendorType] = useState('Opex'); // 'Opex' | 'Capex' | 'Camper'
  const [invoiceDate, setInvoiceDate] = useState('');
  const [amount, setAmount] = useState('');
  const [agreementNo, setAgreementNo] = useState('');
  const [agreementDate, setAgreementDate] = useState('');
  const [nitNo, setNitNo] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [billLocation, setBillLocation] = useState('');
  const [title, setTitle] = useState('');

  // 🔒 Security Guard & Fetch Bills
  useEffect(() => {
    async function checkUserAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchBills();
    }
    checkUserAndFetch();
  }, [router]);

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from('government_bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setBills(data || []);
    }
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

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("❌ Kripya PDF file select karein!");
      return;
    }

    setLoading(true);
    let pdfUrl = "";

    try {
      const fileName = `bill_${Date.now()}_${pdfFile.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('govt_bills')
        .upload(fileName, pdfFile);

      if (uploadError) throw new Error("PDF upload failed: " + uploadError.message);

      const { data: publicURLData } = supabase.storage
        .from('govt_bills')
        .getPublicUrl(fileName);
      
      pdfUrl = publicURLData.publicUrl;

      const billData = {
        invoice_no: invoiceNo,
        po_no: poNo,
        vendor_type: vendorType,
        invoice_date: invoiceDate,
        amount: Number(amount),
        agreement_no: agreementNo,
        agreement_date: agreementDate,
        nit_no: nitNo,
        issued_by: issuedBy,
        bill_location: billLocation,
        title: title,
        pdf_url: pdfUrl,
        status: 'Submitted'
      };

      const { error: dbError } = await supabase
        .from('government_bills')
        .insert([billData]);

      if (dbError) throw dbError;

      alert("✅ Government Bill Successfully Upload & Submit Ho Gaya!");
      
      // Reset form
      setInvoiceNo('');
      setPoNo('');
      setVendorType('Opex');
      setInvoiceDate('');
      setAmount('');
      setAgreementNo('');
      setAgreementDate('');
      setNitNo('');
      setIssuedBy('');
      setBillLocation('');
      setTitle('');
      setPdfFile(null);
      e.target.reset();
      fetchBills();

    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('government_bills')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) fetchBills();
  };

  const handleDelete = async (id, titleName) => {
    if (confirm(`Kya aap "${titleName}" bill ko hamesha ke liye delete karna chahte hain?`)) {
      const { error } = await supabase.from('government_bills').delete().eq('id', id);
      if (!error) {
        alert("✅ Bill successfully delete ho gaya!");
        fetchBills();
      }
    }
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.agreement_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <a href="/hpscbl-tenders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>⚡</span>HPSCBL Tenders</a>
            <a href="/upload-bill" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>📄</span>Government Bills</a>
            <a href="/add-challan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>📦</span>Material Challan</a>
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
            Dashboard <span className="mx-2">›</span> Government Bills <span className="mx-2">›</span> <span className="text-white font-medium">Upload & Manage Bills</span>
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
                <h1 className="text-2xl font-bold text-white">Upload Government Bills & Documents</h1>
                <p className="text-slate-300 text-xs mt-1">Upload your bills, agreements, and supporting documents for HPSCBL and departments.</p>
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
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📄</span> Bill & Tender Details Form
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in all official particulars accurately.</p>
              </div>

              {/* Row 1: Invoice No, PO No, Vendor Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Number *</label>
                  <input type="text" required value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Invoice No" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PO Number *</label>
                  <input type="text" required value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="PO No" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Vendor Type *</label>
                  <select value={vendorType} onChange={(e) => setVendorType(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs cursor-pointer">
                    <option value="Opex">Opex Vendor</option>
                    <option value="Capex">Capex Vendor</option>
                    <option value="Camper">Camper Vendor (Vehicle)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Invoice Date, Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Date *</label>
                  <input type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Amount (₹) *</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Total Amount" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
              </div>

              {/* Row 3: Agreement No, Agreement Date, NIT No */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Agreement Number *</label>
                  <input type="text" required value={agreementNo} onChange={(e) => setAgreementNo(e.target.value)} placeholder="Agreement No" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Agreement Date *</label>
                  <input type="date" required value={agreementDate} onChange={(e) => setAgreementDate(e.target.value)} className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">NIT Number *</label>
                  <input type="text" required value={nitNo} onChange={(e) => setNitNo(e.target.value)} placeholder="NIT No" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
              </div>

              {/* Row 4: From (Issued By), Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">From / Issued By (JE / SDO / XEN) *</label>
                  <input type="text" required value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="e.g. SDO HPSCBL Kotkhai" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bill Location / Site *</label>
                  <input type="text" required value={billLocation} onChange={(e) => setBillLocation(e.target.value)} placeholder="e.g. Rampur Sub Station" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs" />
                </div>
              </div>

              {/* Title / Description (Big Field) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bill Title / Description (Main Work Title) *</label>
                <textarea rows="3" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter detailed bill title or work description..." className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-yellow-500"></textarea>
              </div>

              {/* PDF Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Upload Bill (PDF) *</label>
                <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-xs text-white font-medium mb-1">
                    {pdfFile ? `Selected: ${pdfFile.name}` : "Drag & drop your PDF file here, or click to browse"}
                  </p>
                  <p className="text-[10px] text-slate-500 mb-4">Only PDF files are allowed (Max size: 10 MB)</p>
                  <label className="bg-slate-800 hover:bg-slate-700 text-yellow-500 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer border border-slate-700 inline-block">
                    Choose File
                    <input type="file" accept="application/pdf" onChange={handlePdfChange} required className="hidden" />
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2 border-t border-slate-800">
                <button type="reset" className="w-1/3 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 font-medium py-2.5 rounded-lg transition text-xs">
                  Reset
                </button>
                <button type="submit" disabled={loading} className="w-2/3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 rounded-lg transition shadow-lg text-xs cursor-pointer">
                  {loading ? "Uploading & Submitting..." : "Submit Government Bill 🚀"}
                </button>
              </div>
            </form>

            {/* Guidelines Card */}
            <div className="space-y-6">
              <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <span>🔒</span> Your data is secure and accessible only to authorised personnel.
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-500">ℹ️</span> Important Guidelines
                </h3>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-start gap-2"><span>✔</span> Upload clear and readable official PDF files.</li>
                  <li className="flex items-start gap-2"><span>✔</span> Ensure file size does not exceed 10 MB.</li>
                  <li className="flex items-start gap-2"><span>✔</span> Fill all NIT, Agreement & Vendor details correctly.</li>
                  <li className="flex items-start gap-2"><span>✔</span> Track status changes (Submitted ➔ In Process ➔ Payment Released).</li>
                </ul>
              </div>
            </div>

          </div>

          {/* SUBMITTED BILLS TABLE WITH "KUNDLI TABS" VIEW */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Submitted Government Bills Directory</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track bill stages, payment clearance, and view detailed records.</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by invoice, agreement, title..." 
                    className="w-full bg-[#1F2937] text-xs text-white placeholder-slate-500 border border-slate-700 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-yellow-500" 
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#1F2937] text-xs text-white border border-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="In Process (SDO/XEN)">In Process (SDO/XEN)</option>
                  <option value="Approved">Approved</option>
                  <option value="Payment Released">Payment Released</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="space-y-4">
              {filteredBills.map((bill, index) => {
                const isExpanded = expandedId === bill.id;
                const currentStatus = bill.status || 'Submitted';

                let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                if (currentStatus === 'In Process (SDO/XEN)') badgeColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                if (currentStatus === 'Approved') badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                if (currentStatus === 'Payment Released') badgeColor = "bg-teal-500/10 text-teal-400 border-teal-500/20";
                if (currentStatus === 'Rejected') badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";

                return (
                  <div key={bill.id} className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden transition">
                    
                    {/* Main Row */}
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
                      
                      <div className="lg:col-span-3">
                        <p className="text-[10px] text-slate-500">Invoice: <strong className="text-white">{bill.invoice_no}</strong> ({bill.vendor_type})</p>
                        <h3 className="font-bold text-white text-sm mt-1 line-clamp-1">{bill.title}</h3>
                        <p className="text-[10px] text-yellow-500 mt-0.5">Location: {bill.bill_location}</p>
                      </div>

                      <div className="lg:col-span-3 space-y-1 border-x border-slate-800 px-3">
                        <p className="text-slate-400">Agreement: <span className="text-white font-medium">{bill.agreement_no}</span></p>
                        <p className="text-slate-400">NIT No: <span className="text-white font-medium">{bill.nit_no}</span></p>
                        <p className="text-slate-400">From: <span className="text-white font-medium">{bill.issued_by}</span></p>
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-slate-400">Amount</p>
                        <p className="font-bold text-emerald-400 text-sm mt-0.5">₹{bill.amount?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Date: {bill.invoice_date}</p>
                      </div>

                      <div className="lg:col-span-4 flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2 w-full justify-end">
                          <span className="text-[10px] text-slate-400">Status:</span>
                          <select 
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(bill.id, e.target.value)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded border outline-none cursor-pointer bg-[#1F2937] ${badgeColor}`}
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="In Process (SDO/XEN)">In Process (SDO/XEN)</option>
                            <option value="Approved">Approved</option>
                            <option value="Payment Released">Payment Released</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 w-full justify-end">
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : bill.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-yellow-400 font-semibold py-1.5 px-3 rounded text-[11px] border border-slate-700"
                          >
                            {isExpanded ? "▲ Hide Kundli" : "▼ View Full Details & PDF"}
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(bill.id, bill.title)}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-1.5 px-2.5 rounded text-[11px]"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* EXPANDABLE "KUNDLI TABS" VIEW */}
                    {isExpanded && (
                      <div className="bg-[#0b1329] border-t border-slate-800 p-6 space-y-4 text-xs">
                        
                        {/* Sub-Tabs */}
                        <div className="flex gap-2 border-b border-slate-800 pb-3">
                          <button onClick={() => setActiveTab('financial')} className={`px-3 py-1.5 rounded font-bold transition ${activeTab === 'financial' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            Financial Details
                          </button>
                          <button onClick={() => setActiveTab('contract')} className={`px-3 py-1.5 rounded font-bold transition ${activeTab === 'contract' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            Contract & Agreement
                          </button>
                          <button onClick={() => setActiveTab('department')} className={`px-3 py-1.5 rounded font-bold transition ${activeTab === 'department' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            Department & Location
                          </button>
                          <button onClick={() => setActiveTab('status')} className={`px-3 py-1.5 rounded font-bold transition ${activeTab === 'status' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            Document & Payment Status
                          </button>
                        </div>

                        {/* Tab 1 */}
                        {activeTab === 'financial' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                            <div><span className="text-slate-500 block">Invoice Number</span><strong className="text-white text-sm">{bill.invoice_no}</strong></div>
                            <div><span className="text-slate-500 block">Invoice Date</span><strong className="text-white text-sm">{bill.invoice_date}</strong></div>
                            <div><span className="text-slate-500 block">PO Number</span><strong className="text-white text-sm">{bill.po_no}</strong></div>
                            <div><span className="text-slate-500 block">Vendor Type</span><strong className="text-yellow-400 text-sm">{bill.vendor_type} Vendor</strong></div>
                            <div><span className="text-slate-500 block">Total Amount</span><strong className="text-emerald-400 text-sm">₹{bill.amount?.toLocaleString('en-IN')}</strong></div>
                          </div>
                        )}

                        {/* Tab 2 */}
                        {activeTab === 'contract' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-slate-300">
                            <div><span className="text-slate-500 block">Agreement Number</span><strong className="text-white text-sm">{bill.agreement_no}</strong></div>
                            <div><span className="text-slate-500 block">Agreement Date</span><strong className="text-white text-sm">{bill.agreement_date}</strong></div>
                            <div><span className="text-slate-500 block">NIT Number</span><strong className="text-white text-sm">{bill.nit_no}</strong></div>
                          </div>
                        )}

                        {/* Tab 3 */}
                        {activeTab === 'department' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-slate-300">
                            <div><span className="text-slate-500 block">Issued From (JE/SDO/XEN)</span><strong className="text-white text-sm">{bill.issued_by}</strong></div>
                            <div><span className="text-slate-500 block">Bill Location / Site</span><strong className="text-white text-sm">{bill.bill_location}</strong></div>
                            <div className="col-span-2 md:col-span-3"><span className="text-slate-500 block">Full Title / Description</span><strong className="text-yellow-400 text-sm">{bill.title}</strong></div>
                          </div>
                        )}

                        {/* Tab 4 */}
                        {activeTab === 'status' && (
                          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white">Current Stage: <span className="text-yellow-400">{currentStatus}</span></p>
                              <p className="text-xs text-slate-400 mt-0.5">Official PDF Bill Attached for Audit & Verification</p>
                            </div>
                            {bill.pdf_url ? (
                              <a href={bill.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow">
                                View Official PDF ↗
                              </a>
                            ) : (
                              <span className="text-xs text-red-400">No PDF found</span>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

              {filteredBills.length === 0 && (
                <div className="text-center py-12 bg-[#111827] rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Koi bhi government bill nahi mila.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}