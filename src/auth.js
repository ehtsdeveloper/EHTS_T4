import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import { 
  Shield, UserCircle, Activity, Building, ArrowLeft, AlertTriangle, CheckCircle 
} from "lucide-react";

// 1. ROLE SELECTION SCREEN (Split Layout)
export function RoleSelectionScreen({ onSelect, onRegister }) {
  return (
    // Fixed position ensures it covers the whole screen, removing grey margins/scroll from parent
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row w-full h-full font-sans bg-white overflow-y-auto">
      
      {/* LEFT SIDE: Black Panel (Now 40% width instead of 50%) */}
      <div className="w-full md:w-2/5 min-h-full bg-black text-white flex flex-col justify-center p-8 md:p-12 gap-8 order-2 md:order-1">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-extrabold mb-8 text-gray-200 tracking-tight uppercase">
            Select Portal
          </h2>

          <div className="flex flex-col gap-6">
            {/* Admin Button - White BG, Black Text */}
            <button 
              onClick={() => onSelect('admin')} 
              className="group flex items-center gap-6 bg-white p-8 rounded-3xl border border-transparent w-full text-left hover:bg-gray-100 transition-all hover:scale-[1.01] shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 grid place-items-center flex-shrink-0 group-hover:bg-white group-hover:border group-hover:border-gray-200 transition-all">
                <Shield className="w-8 h-8 text-[#9E2F2B]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-1">Admin Portal</h3>
                <p className="text-sm text-gray-500">Manage employees & analysis.</p>
              </div>
            </button>

            {/* Employee Button - White BG, Black Text */}
            <button 
              onClick={() => onSelect('employee')} 
              className="group flex items-center gap-6 bg-white p-8 rounded-3xl border border-transparent w-full text-left hover:bg-gray-100 transition-all hover:scale-[1.01] shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 grid place-items-center flex-shrink-0 group-hover:bg-white group-hover:border group-hover:border-gray-200 transition-all">
                <UserCircle className="w-8 h-8 text-[#5A5A5A]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-1">Employee Portal</h3>
                <p className="text-sm text-gray-500">View your tasks & history.</p>
              </div>
            </button>
          </div>

          <div className="mt-12 text-center md:text-left flex items-center gap-4">
             <button 
               onClick={onRegister} 
               className="w-full text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:text-[#9E2F2B] transition-colors border border-white hover:border-[#9E2F2B]"
             >
               <Building className="w-4 h-4" /> Register New Organization
             </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: White Panel (Now 60% width) */}
      <div className="w-full md:w-3/5 min-h-full bg-white flex flex-col items-center justify-center p-8 md:p-16 text-center order-1 md:order-2">
        <div className="w-32 h-32 bg-[#2B1F1F] rounded-3xl grid place-items-center mb-8 shadow-2xl shadow-red-900/20">
          <Activity className="w-16 h-16 text-[#C73A36]" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-[#1A1A1A] tracking-tighter leading-none mb-4">E.H.T.S</h1>
        <p className="text-xl md:text-2xl text-[#5A5A5A] font-medium">We will add more info about EHTS. This is just a placeholder</p>
      
      </div>

    </div>
  );
}

// 2. LOGIN SCREEN
export function LoginPage({ role, onBack, onError, globalError }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState('login'); 
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      if (email === 'admin@demo.com') { window.location.reload(); } 
      else { onError("Login failed: " + err.message); }
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if(!email) { onError("Please enter your email."); return; }
    setIsSubmitting(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setResetMessage("Check your inbox for the reset link.");
        onError("");
    } catch (err) { onError(err.message); }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-8 font-sans">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-[#5A5A5A] font-bold mb-6 hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        
        <div className="bg-white p-10 rounded-3xl border border-[#E5E5E5] shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-2 capitalize tracking-tight">
              {mode === 'reset' ? 'Reset Password' : `${role} Login`}
            </h2>
            <p className="text-[#5A5A5A]">Enter your credentials to continue.</p>
          </div>

          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0"/> {globalError}
            </div>
          )}
          
          {resetMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0"/> {resetMessage}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Email</label>
                 <input 
                   className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                   type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Password</label>
                 <input 
                   className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                   type="password" value={pass} onChange={e => setPass(e.target.value)} required 
                 />
              </div>
              <div className="text-right">
                  <button type="button" onClick={() => setMode('reset')} className="text-sm font-bold text-[#5A5A5A] hover:text-[#1A1A1A]">Forgot Password?</button>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full p-4 bg-[#9E2F2B] text-white rounded-xl font-bold text-lg hover:bg-[#B23631] transition-colors mt-2 disabled:opacity-70"
              >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
               <div>
                  <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Email Address</label>
                  <input 
                    className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                  />
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full p-4 bg-[#9E2F2B] text-white rounded-xl font-bold text-lg hover:bg-[#B23631] transition-colors disabled:opacity-70">
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
               <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm font-bold text-[#5A5A5A] hover:text-[#1A1A1A]">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. REGISTER COMPANY SCREEN
export function RegisterCompanyPage({ onBack }) {
  const [form, setForm] = useState({ companyName: '', adminName: '', email: '', password: '', accessCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const MASTER_KEY = "EHTS2025"; 

  const handleRegister = async (e) => {
    e.preventDefault();
    if(form.accessCode !== MASTER_KEY) { setError("Invalid Authorization Code."); return; }
    setLoading(true); setError('');

    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCred.user.uid;
      const cleanName = form.companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const companyId = `${cleanName}_${Math.random().toString(36).substr(2, 5)}`;

      await setDoc(doc(db, 'companies', companyId, 'employees', uid), {
        fullName: form.adminName, email: form.email, role: 'admin', companyId, createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'companies', companyId), { name: form.companyName, createdBy: uid });
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#F5F5F5] p-8 font-sans">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-[#5A5A5A] font-bold mb-6 hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="bg-white p-10 rounded-3xl border border-[#E5E5E5] shadow-xl">
          <div className="text-center mb-8">
               <div className="w-16 h-16 bg-[#2B1F1F] rounded-2xl grid place-items-center mx-auto mb-6 text-white shadow-lg shadow-black/10">
                 <Building className="w-8 h-8"/>
               </div>
               <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">Register Company</h2>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
               <AlertTriangle className="w-5 h-5 flex-shrink-0"/> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Authorization Code</label>
                <input 
                  className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-yellow-50 text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors font-mono"
                  type="password" placeholder="Master Key" value={form.accessCode} onChange={e => setForm({...form, accessCode: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Company Name</label>
                <input 
                  className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                  placeholder="Acme Inc." value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Admin Email</label>
                <input 
                  className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                  placeholder="admin@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Admin Name</label>
                <input 
                  className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                  placeholder="Your Name" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} 
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Password</label>
                <input 
                  className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                  type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full p-4 bg-[#9E2F2B] text-white rounded-xl font-bold text-lg hover:bg-[#B23631] transition-colors disabled:opacity-70"
              >
                  {loading ? 'Creating...' : 'Register'}
              </button>
          </form>
        </div>
      </div>
    </div>
  );
}