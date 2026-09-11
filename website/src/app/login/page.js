"use client";
import { useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ⏳ Naya Loading State
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // ⏳ Jaise hi button dabega, loading shuru

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("❌ Galat Email ya Password! Kripya dobara check karein.");
      setIsLoading(false); // ⏳ Agar error aaya, toh loading band kar do
    } else {
      router.push('/');
      // Success hone par page khud dashboard par chala jayega
    }
  };

  return (
    // Background Image & Overlay
    <div 
      className="min-h-screen bg-cover bg-center relative font-sans text-white"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542336391-ae2936d8efe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95"></div>

      <div className="relative z-10 flex flex-col min-h-screen p-6 md:p-10">
        
        {/* TOP NAVBAR */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">Sanjeev Sharma</h1>
            <p className="text-xs tracking-[0.2em] text-gray-300 mt-1 uppercase">Government Electrical Contractor</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1px] w-8 bg-yellow-500"></div>
              <p className="text-sm font-semibold tracking-widest uppercase">Class - A</p>
              <div className="h-[1px] w-8 bg-yellow-500"></div>
            </div>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-200">
            <a href="#" className="text-white border-b-2 border-yellow-500 pb-1">Home</a>
            <a href="#" className="hover:text-yellow-400 transition">About</a>
            <a href="#" className="hover:text-yellow-400 transition">Projects</a>
            <a href="#" className="hover:text-yellow-400 transition">Services</a>
            <a href="#" className="hover:text-yellow-400 transition">Support</a>
          </nav>

          <div className="flex items-center gap-6">
            <button className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-yellow-400 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Create Account
            </button>
            <div className="text-center">
              <div className="w-10 h-12 border-2 border-white/50 mx-auto rounded-sm mb-1 flex items-center justify-center text-[10px]">LOGO</div>
              <p className="text-[9px] tracking-wider uppercase text-yellow-500 font-bold">Powering<br/>Public Service</p>
            </div>
          </div>
        </header>

        {/* CENTER CONTENT */}
        <div className="flex-grow flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
              Reliable <br/>
              Electrical Infrastructure <br/>
              <span className="text-yellow-500">for a Stronger Tomorrow</span>
            </h2>
            <p className="text-lg text-gray-300 font-medium tracking-wide">
              Government Projects <span className="mx-2 text-yellow-500">|</span> 
              Safety <span className="mx-2 text-yellow-500">|</span> 
              Quality <span className="mx-2 text-yellow-500">|</span> 
              Public Trust
            </p>
          </div>

          {/* Login Box */}
          <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-600/50 p-8 rounded-xl shadow-2xl">
            <h3 className="text-2xl font-bold mb-1">Welcome Back</h3>
            <p className="text-gray-400 text-sm mb-6">Login to access your account</p>

            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="User ID / Email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center text-gray-300 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded border-gray-600 bg-slate-800 text-yellow-500 focus:ring-yellow-500" />
                  Remember me
                </label>
                <a href="#" className="text-yellow-500 hover:text-yellow-400 transition">Forgot Password?</a>
              </div>

              {/* ⏳ Updated Login Button with Loading Logic */}
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition shadow-lg ${
                  isLoading 
                    ? 'bg-yellow-600/70 text-slate-800 cursor-not-allowed' 
                    : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Login 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-slate-600"></div>
                <span className="px-3 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-slate-600"></div>
              </div>

              <button type="button" className="w-full bg-transparent border border-gray-400 hover:border-white text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-12 pt-8 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="text-gray-400 text-xs">
            <div className="w-10 h-1 bg-yellow-500 mb-2"></div>
            <p>Lighting Communities.</p>
            <p>Empowering Progress.</p>
          </div>
          <div className="hidden md:block transform -rotate-6">
            <p className="text-xl font-serif italic text-white tracking-wide">
              Infrastructure <br/>
              <span className="text-yellow-500">for a Better India</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}