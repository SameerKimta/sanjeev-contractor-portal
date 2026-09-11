"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function AddLabour() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [docFile, setDocFile] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    }
    checkUser();
  }, [router]);

  // Photo select karne par live preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 📏 Document Size Validation (Must be between 300 KB and 500 KB)
  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileSizeInKB = file.size / 1024;
      
      if (fileSizeInKB < 300) {
        alert("❌ Document size must be at least 300 KB! Kripya badi file select karein.");
        e.target.value = "";
        setDocFile(null);
        return;
      }
      
      if (fileSizeInKB > 500) {
        alert("❌ Document size cannot exceed 500 KB! Kripya choti file select karein (Max 500 KB).");
        e.target.value = "";
        setDocFile(null);
        return;
      }

      setDocFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) {
      alert("❌ Kripya valid 300KB-500KB ka document upload karein!");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.target);
    let photoUrl = "";
    let docUrl = "";

    try {
      // 1. Upload Photo to Supabase Storage
      if (photoFile) {
        const photoFileName = `photo_${Date.now()}_${photoFile.name.replace(/\s+/g, '_')}`;
        const { error: photoUploadError } = await supabase.storage
          .from('labour-files')
          .upload(photoFileName, photoFile);

        if (!photoUploadError) {
          const { data: publicURLData } = supabase.storage
            .from('labour-files')
            .getPublicUrl(photoFileName);
          photoUrl = publicURLData.publicUrl;
        }
      }

      // 2. Upload Document to Supabase Storage
      if (docFile) {
        const docFileName = `doc_${Date.now()}_${docFile.name.replace(/\s+/g, '_')}`;
        const { error: docUploadError } = await supabase.storage
          .from('labour-files')
          .upload(docFileName, docFile);

        if (!docUploadError) {
          const { data: publicURLData } = supabase.storage
            .from('labour-files')
            .getPublicUrl(docFileName);
          docUrl = publicURLData.publicUrl;
        }
      }

      // 3. Save to Database
      const labourData = {
        labour_name: formData.get('labour_name'),
        father_name: formData.get('father_name'),
        mobile_number: formData.get('mobile_number'),
        alternate_mobile: formData.get('alternate_mobile') || '',
        dob: formData.get('dob'),
        skill: formData.get('skill'),
        daily_wage: formData.get('daily_wage'),
        joining_date: formData.get('joining_date'),
        village: formData.get('village'),
        post_office: formData.get('post_office'),
        tehsil: formData.get('tehsil'),
        district: formData.get('district'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
        photo_url: photoUrl,
        document_url: docUrl
      };

      const { error: dbError } = await supabase
        .from('labour_profile')
        .insert([labourData]);

      if (dbError) {
        alert("❌ Database Error: " + dbError.message);
        setLoading(false);
      } else {
        alert("🎉 Labour record aur files successfully save ho gayi!");
        router.push('/labour-list');
      }

    } catch (err) {
      alert("❌ Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-300 font-sans">
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-wide">Sanjeev Sharma</h1>
          <p className="text-[10px] tracking-widest text-slate-400 uppercase mt-1">Government Electrical Contractor</p>
        </div>
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>🏠</span>Dashboard</a>
            <a href="/add-labour" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-semibold"><span>👥</span>Add New Labour</a>
            <a href="/labour-list" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"><span>👤</span>View Labour Details</a>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-sm text-slate-400">Dashboard › Add New Labour</div>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Info & Photo */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4">1. Personal Information & Photo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-4 text-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto overflow-hidden flex items-center justify-center text-slate-400 mb-2 border border-slate-700">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📷</span>
                    )}
                  </div>
                  <p className="text-xs text-white font-medium mb-1">Upload Photo</p>
                  <label className="bg-slate-800 hover:bg-slate-700 text-yellow-500 text-xs font-semibold py-1.5 px-3 rounded cursor-pointer border border-slate-700 inline-block">
                    Choose File
                    <input type="file" accept="image/*" onChange={handlePhotoChange} required className="hidden" />
                  </label>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                    <input type="text" name="labour_name" required placeholder="Enter full name" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Father's Name *</label>
                    <input type="text" name="father_name" required placeholder="Enter father's name" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number *</label>
                  <input type="tel" name="mobile_number" maxLength="10" required placeholder="Mobile number" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Alternate Mobile Number</label>
                  <input type="tel" name="alternate_mobile" maxLength="10" placeholder="Alternate mobile" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date of Birth *</label>
                <input type="date" name="dob" required className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4">2. Work Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Skill *</label>
                  <select name="skill" required className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm">
                    <option value="">Select skill</option>
                    <option value="Unskilled (Helper)">Unskilled (Helper)</option>
                    <option value="Semi-Skilled">Semi-Skilled</option>
                    <option value="Skilled (Fitter/Electrician)">Skilled (Fitter/Electrician)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Daily Wage (₹) *</label>
                  <input type="number" name="daily_wage" required placeholder="Daily wage" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Joining Date *</label>
                  <input type="date" name="joining_date" required className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4">3. Address Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Village *</label>
                    <input type="text" name="village" required placeholder="Village" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Post Office *</label>
                    <input type="text" name="post_office" required placeholder="Post Office" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tehsil *</label>
                    <input type="text" name="tehsil" required placeholder="Tehsil" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">District *</label>
                    <input type="text" name="district" required placeholder="District" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">State *</label>
                    <input type="text" name="state" defaultValue="Himachal Pradesh" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pin Code *</label>
                    <input type="text" name="pincode" maxLength="6" required placeholder="Pincode" className="w-full bg-[#1F2937] border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Document Upload (300KB to 500KB Rule) */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-2">4. Supporting Document (Aadhaar / ID Proof)</h2>
              <p className="text-xs text-yellow-500 mb-4">⚠️ Note: Document size must be between 300 KB and 500 KB.</p>
              <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-white">Upload Aadhaar / ID Document *</p>
                  <p className="text-xs text-slate-400">PDF / JPG / PNG (300 KB - 500 KB)</p>
                </div>
                <label className="bg-slate-800 hover:bg-slate-700 text-yellow-500 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer border border-slate-700">
                  {docFile ? "Selected (300-500KB) ✓" : "Choose File"}
                  <input type="file" accept=".pdf,image/*" onChange={handleDocChange} required className="hidden" />
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3.5 rounded-lg transition shadow-lg cursor-pointer">
              {loading ? "Uploading & Saving..." : "Submit Labour Record 🚀"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}