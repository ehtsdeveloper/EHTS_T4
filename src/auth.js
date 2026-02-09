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

// ==========================================
// 1. MAIN AUTH PORTAL (Orchestrator)
// ==========================================
export default function AuthPortal() {
  const [currentView, setCurrentView] = useState('admin'); // 'admin', 'evaluator', 'register'

  if (currentView === 'register') {
    return <RegisterCompanyPage onBack={() => setCurrentView('admin')} />;
  }

  return (
    <SplitLoginScreen 
      view={currentView} 
      onSwitchView={setCurrentView} 
    />
  );
}

// ==========================================
// 2. SPLIT SCREEN LOGIN (Merged Layout)
// ==========================================
function SplitLoginScreen({ view, onSwitchView }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  
  const isEvaluator = view === 'evaluator';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // App.js listener handles redirect
    } catch (err) {
      // Demo bypass (remove in prod)
      if (email === 'admin@demo.com') { window.location.reload(); } 
      else { setError("Login failed: " + err.message); }
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if(!email) { setError("Please enter email to reset."); return; }
    setIsSubmitting(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setResetMessage("Reset link sent to inbox.");
        setError("");
    } catch (err) { setError(err.message); }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row w-full h-full font-sans bg-white overflow-y-auto">
      
      {/* LEFT SIDE: Black Panel (Login Form) - 40% width */}
      <div className="w-full md:w-2/5 min-h-full bg-black text-white flex flex-col justify-center p-8 md:p-12 order-2 md:order-1 relative">
        
        <div className="max-w-sm mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2  text-[#1A1A1A] px-4 py-2 rounded-lg shadow-md">
                    <div className="w-12 h-12 bg-white border border-[#333] rounded-xl grid place-items-center">
                        {isEvaluator ? <UserCircle className="w-6 h-6 text-[#9E2F2B]" /> : <Shield className="w-6 h-6 text-[#9E2F2B]" />}
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight uppercase text-white">
                        {isEvaluator ? "Evaluator Portal" : "Admin Portal"}
                    </h2>
                </div>
                <p className="text-gray-400 text-sm">
                    {isEvaluator ? "Therapist evaluations" : "Manage your organization"}
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-lg mb-6 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4"/> {error}
                </div>
            )}
            {resetMessage && (
                <div className="bg-green-900/20 border border-green-900/50 text-green-400 p-3 rounded-lg mb-6 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4"/> {resetMessage}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-white uppercase mb-1 ml-1">Email</label>
                    <input 
                        className="w-full p-3 rounded-xl border border-[#333] bg-[#111] text-white placeholder-gray-600 text-sm outline-none focus:border-[#9E2F2B] focus:bg-black transition-colors"
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder={isEvaluator ? "evaluator@org.com" : "admin@org.com"}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-white uppercase mb-1 ml-1">Password</label>
                    <input 
                        className="w-full p-3 rounded-xl border border-[#333] bg-[#111] text-white placeholder-gray-600 text-sm outline-none focus:border-[#9E2F2B] focus:bg-black transition-colors"
                        type="password" 
                        value={pass} 
                        onChange={e => setPass(e.target.value)} 
                        required 
                        placeholder="••••••••"
                    />
                </div>
                
                <div className="flex justify-end">
                    <button type="button" onClick={handleReset} className="text-xs font-bold text-white hover:text-white transition-colors">
                        Forgot Password?
                    </button>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full p-3 bg-[#9E2F2B] text-white rounded-xl font-bold text-sm hover:bg-[#B23631] transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                    {isSubmitting ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>

            {/* Switcher & Register Buttons */}
            <div className="mt-8 pt-6 border-t border-[#222] space-y-3">
                
                {/* Switch Button */}
                <button 
                    onClick={() => onSwitchView(isEvaluator ? 'admin' : 'evaluator')}
                    className="w-full py-3 rounded-xl border border-white bg-transparent text-gray-300 hover:border-white hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                >
                    {isEvaluator ? (
                        <><ArrowLeft className="w-3 h-3" /> Back to Admin Login</>
                    ) : (
                        <><UserCircle className="w-4 h-4" /> Login to Evaluator Portal</>
                    )}
                </button>

                {/* Register Button (Only on Admin view) */}
                {!isEvaluator && (
                    <button 
                        onClick={() => onSwitchView('register')}
                        className="w-full py-2 rounded-xl border border-white bg-[#1A1A1A] text-xs font-bold text-white hover:text-[#9E2F2B] hover:bg-white flex items-center justify-center gap-2 transition-colors"
                    >
                        <Building className="w-3 h-3" /> Register New Organization
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: White Panel (Branding) - 60% width */}
      <div className="w-full md:w-3/5 min-h-full bg-white flex flex-col items-center justify-center p-8 md:p-16 text-center order-1 md:order-2">
        <div className="w-32 h-32 bg-[#2B1F1F] rounded-3xl grid place-items-center mb-8 shadow-2xl shadow-red-900/20">
          <Activity className="w-16 h-16 text-[#C73A36]" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-[#1A1A1A] tracking-tighter leading-none mb-4">E.H.T.S</h1>
        <p className="text-xl md:text-2xl text-[#5A5A5A] font-medium">
          placeholder text
        </p>
      </div>

    </div>
  );
}

// ==========================================
// 3. REGISTER COMPANY SCREEN (Card Style)
// ==========================================
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
          <ArrowLeft className="w-5 h-5" /> Back to Login
        </button>
        <div className="bg-white p-10 rounded-3xl border border-[#E5E5E5] shadow-xl">
          <div className="text-center mb-8">
               <div className="w-16 h-16 bg-[#2B1F1F] rounded-2xl grid place-items-center mx-auto mb-6 text-white shadow-lg shadow-black/10">
                 <Building className="w-8 h-8"/>
               </div>
               <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">Register Company</h2>
               <p className="text-sm text-gray-500 mt-2">Create a new organization workspace.</p>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className='space-y-2'>
                    <label className="block text-xs font-bold text-[#5A5A5A] uppercase ml-1">Company</label>
                    <input 
                    className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                    placeholder="Acme Inc." value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} 
                    />
                </div>
                <div className='space-y-2'>
                    <label className="block text-xs font-bold text-[#5A5A5A] uppercase ml-1">Admin Name</label>
                    <input 
                    className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                    placeholder="Name" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} 
                    />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2 ml-1">Admin Email</label>
                <input 
                  className="w-full p-4 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] text-base outline-none focus:border-[#9E2F2B] focus:bg-white transition-colors"
                  placeholder="admin@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
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

// Backward Compatibility for App.js
export const RoleSelectionScreen = AuthPortal;
export const LoginPage = SplitLoginScreen; // Exporting internal component if needed by tests