import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth, signOut } from 'firebase/auth';
import { collection, query, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc, onSnapshot, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; 
import { db, firebaseConfig } from './firebase'; 
import { sendTestAssignmentEmail } from './emailService';
import { 
  LayoutGrid, Users, UserSquare, FileText, Activity, 
  Plus, Trash2, Mail, Shield, User, CheckCircle, X, Calendar,
  AlertTriangle, ArrowLeft, Shuffle, Send, Briefcase, Headphones, 
  PlayCircle, Mic, Upload, LogOut, Menu, MonitorPlay, Mic2, Clock
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend, AreaChart, Area 
} from "recharts";
import EvaluatorAdminDash from './evaluatorAdminDash'; 

const DEFAULT_SCENARIOS = [
  { id: 'def_1', title: "Gender Bias - Women Authority", description: "Scenario depicting subtle undermining of female authority in a corporate setting.", isDefault: true, audioUrl: "https://firebasestorage.googleapis.com/v0/b/biasdetection-8e483.firebasestorage.app/o/Audio%20Library%2FAudio%20Library%2Fgender_w.mp3?alt=media&token=4d83b272-62dc-40b8-99e0-f7828dec93da"},
  { id: 'def_2', title: "Gender Bias - Male Authority", description: "Scenario exploring biases related to traditional male-dominated leadership expectations.", isDefault: true },
  { id: 'def_3', title: "Racial Bias - White", description: "Examining interactions and potential unconscious favoritism or assumptions in majority-group settings.", isDefault: true },
  { id: 'def_4', title: "Racial Bias - Black", description: "Scenario highlighting unconscious bias, microaggressions, or double standards in a professional environment.", isDefault: true },
  { id: 'def_5', title: "Faith - Christianity", description: "Workplace scenario involving religious expression, holiday observance, or cultural assumptions related to Christian traditions.", isDefault: true },
  { id: 'def_6', title: "Faith - Islam", description: "Scenario focusing on religious accommodations, prayer breaks, or overcoming common stereotypes in the workplace.", isDefault: true },
  { id: 'def_7', title: "Faith - Judaism", description: "Exploring biases related to Jewish identity, cultural observance, and professional inclusion.", isDefault: true }
];

export default function AdminDashboard({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [detailId, setDetailId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [companyName, setCompanyName] = useState('Loading...');

  const navigateTo = (view, id = null) => {
    setCurrentView(view);
    setDetailId(id);
  };

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (user?.companyId) {
        try {
          const docRef = doc(db, 'companies', user.companyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCompanyName(data.name || data.companyName || user.companyId.toUpperCase());
          } else {
            setCompanyName(user.companyId.toUpperCase());
          }
        } catch (error) {
          setCompanyName(user.companyId.toUpperCase());
        }
      }
    };
    fetchCompanyName();
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} h-screen bg-white border-r border-[#E5E5E5] sticky top-0 hidden md:flex flex-col shrink-0 transition-all duration-300 shadow-sm`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-[#2B1F1F] rounded-xl flex items-center justify-center text-[#C73A36]">
              <Activity size={20} />
            </div>
            <div>
              <div className="font-bold text-[#1A1A1A] leading-none">EHTS</div>
              <div className="text-[10px] text-[#5A5A5A] mt-1 font-semibold uppercase tracking-wider">Bias Detector</div>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <Menu size={20} />
          </button>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
            { id: 'employees', icon: Users, label: 'Employees' },
            { id: 'evaluators', icon: UserSquare, label: 'Evaluators' }, 
            { id: 'tests', icon: FileText, label: 'Tests' },
            { id: 'audios', icon: Headphones, label: 'Audio Library' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => navigateTo(item.id)} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-left font-semibold ${
                currentView === item.id 
                  ? 'bg-[#9E2F2B] text-white shadow-md' 
                  : 'text-[#5A5A5A] hover:bg-gray-50'
              }`}
            >
              <item.icon size={22} className="shrink-0" /> 
              {isSidebarOpen && <span className="text-sm truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 border-b border-[#E5E5E5] bg-white/90 backdrop-blur flex justify-between items-center z-10">
          <div className="text-3xl flex items-center gap-2 font-semibold text-[#1A1A1A]">
            <span className=" w-2 h-2 bg-green-500 rounded-full"></span>
            {companyName}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block border-r pr-4 border-[#E5E5E5]">
              <div className="text-[10px] font-black text-[#9E2F2B] uppercase">Admin Portal</div>
              <div className="text-xs text-[#5A5A5A] font-medium">{user.email}</div>
            </div>
            <button onClick={onLogout} className="px-4 py-2 border border-[#E5E5E5] bg-white rounded-lg cursor-pointer font-bold text-xs hover:bg-red-50 hover:text-red-600 transition-colors text-[#1A1A1A]">Log Out</button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {currentView === 'dashboard' && <AdminHomeStats companyId={user.companyId} />}
          {currentView === 'employees' && <EmployeesPage companyId={user.companyId} onViewDetail={(id) => navigateTo('employee-detail', id)} />}
          {currentView === 'evaluators' && <EvaluatorAdminDash user={user} />}
          {currentView === 'employee-detail' && <EmployeeDetailPage employeeId={detailId} companyId={user.companyId} onBack={() => navigateTo('employees')} />}
          {currentView === 'tests' && <TestsPage companyId={user.companyId} />}
          {currentView === 'audios' && <AudiosPage />}
        </main>
      </div>
    </div>
  );
}

function AdminHomeStats({ companyId }) {
  const [counts, setCounts] = useState({ employees: 0, pendingTests: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const empSnap = await getDocs(collection(db, 'companies', companyId, 'employees'));
        const testSnap = await getDocs(collection(db, 'companies', companyId, 'tests'));
        const emps = empSnap.docs.filter(doc => doc.data().role !== 'admin').length;
        const pending = testSnap.docs.filter(d => d.data().status === 'assigned').length;
        setCounts({ employees: emps, pendingTests: pending });
      } catch (e) { console.error("Stats Error:", e); }
    }
    fetchData();
  }, [companyId]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard Overview</h1>
        <p className="text-sm text-[#5A5A5A]">Real-time Metrics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Employees" value={counts.employees} note="Excludes Admins" icon={Users} />
        <StatCard title="Pending Tests" value={counts.pendingTests} note="Assigned but not completed" icon={Activity} />
        <StatCard title="Avg Bias Score" value="--" note="Insufficient data" icon={Activity} />
      </div>
    </div>
  );
}

function StatCard({ title, value, note, icon: Icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm flex justify-between items-start">
      <div>
        <div className="text-sm font-semibold text-[#5A5A5A] uppercase tracking-wide">{title}</div>
        <div className="text-3xl font-bold my-2 text-[#1A1A1A]">{value}</div>
        <div className="text-xs bg-[#F3F3F3] px-2 py-1 rounded inline-block text-[#5A5A5A]">{note}</div>
      </div>
      <div className="p-3 bg-[#FAFAFA] rounded-xl text-[#9E2F2B]">
        <Icon size={24} />
      </div>
    </div>
  );
}

function EmployeesPage({ companyId, onViewDetail }) {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'employee', dob: '', phone: '', gender: '', height: '', weight: '' });

  useEffect(() => {
    const q = query(collection(db, 'companies', companyId, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [companyId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const tempPass = Math.random().toString(36).slice(-8) + "1!";
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, form.email, tempPass);
      await sendPasswordResetEmail(secondaryAuth, form.email);
      const uid = userCred.user.uid;
      await signOut(secondaryAuth);
      
      let dobForWatch = form.dob; 
      if (form.dob.includes('-')) {
          const [y, m, d] = form.dob.split('-');
          dobForWatch = `${m}${d}${y}`;
      }

      await setDoc(doc(db, 'companies', companyId, 'employees', uid), { ...form, dob: dobForWatch, createdAt: new Date().toISOString() });
      setOpen(false);
      setForm({ fullName: '', email: '', role: 'employee', dob: '', phone: '', gender: '', height: '', weight: '' });
    } catch (err) { alert("Error: " + err.message); } 
    finally { await deleteApp(secondaryApp); setLoading(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const userToDelete = employees.find(emp => emp.id === id);
    if (userToDelete && userToDelete.role === 'admin') {
      const adminCount = employees.filter(emp => emp.role === 'admin').length;
      if (adminCount <= 1) {
        alert("Action Denied: You cannot delete the only administrator for this company.");
        return;
      }
    }
    if(window.confirm("Are you sure you want to delete this user? This will also remove their test assignments.")) {
        try { await deleteDoc(doc(db, 'companies', companyId, 'employees', id)); } catch(err) { alert("Error: " + err.message); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Staff Management</h1>
        <button onClick={() => setOpen(true)} className="bg-[#9E2F2B] text-white border-none rounded-lg px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 hover:bg-[#8E2522] transition-colors">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employees.map((e) => (
          <div key={e.id} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm relative hover:shadow-lg transition-all group cursor-pointer border-l-4 border-l-[#9E2F2B]" onClick={() => onViewDetail(e.id)}>
            <button onClick={(event) => handleDelete(event, e.id)} className="absolute top-4 right-4 text-[#AAA] hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors z-10">
              <Trash2 size={20} />
            </button>
            <div className="flex items-start gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border border-[#E5E5E5] shrink-0 ${e.role === 'admin' ? 'bg-white' : 'bg-[#F9F9F9]'}`}>
                {e.role === 'admin' ? <Shield size={28} className="text-[#9E2F2B]" /> : <User size={28} className="text-[#5A5A5A]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#1A1A1A]">{e.fullName}</h3>
                  {e.role === 'admin' && <span className="bg-[#1A1A1A] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                </div>
                <div className="space-y-1 text-sm text-[#5A5A5A]">
                  <div className="flex items-center gap-2"><Mail size={14} /> {e.email}</div>
                  <div className="flex items-center gap-2"><Briefcase size={14} /> {e.role === 'admin' ? 'Administrator' : 'Staff Member'}</div>
                </div>
                {e.role !== 'admin' && (
                <div className=" pt-2 border-t border-[#F5F5F5]">
                  <button className=" w-full bg-[#9E2F2B] hover:bg-[#872623] active:scale-[0.98] transition text-white text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                     <Activity size={16} /> View Test History
                </button>
                </div> )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Add User</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-4">
                <input className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none focus:border-[#9E2F2B]" placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                <input className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none focus:border-[#9E2F2B]" placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                <div className="flex gap-4">
                    <input className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none focus:border-[#9E2F2B]" type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} required />
                    <select className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none focus:border-[#9E2F2B]" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                        <option value="employee">Employee</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>
                <button type="submit" disabled={loading} className="w-full p-3 bg-[#9E2F2B] text-white rounded-lg font-bold hover:bg-[#8E2522] disabled:opacity-70">
                    {loading ? 'Creating...' : 'Create & Invite'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeDetailPage({ employeeId, companyId, onBack }) {
  const [employee, setEmployee] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    async function load() {
      const docRef = doc(db, 'companies', companyId, 'employees', employeeId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setEmployee({ id: snap.id, ...snap.data() });

      const q = query(collection(db, 'companies', companyId, 'tests'), where('employeeId', '==', employeeId));
      const testSnap = await getDocs(q);
      const loadedTests = testSnap.docs.map(d => ({id: d.id, ...d.data()})).filter(t => !t.archived);
      loadedTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTests(loadedTests);
    }
    load();
  }, [employeeId, companyId]);

  if (!employee) return <div className="p-8 text-gray-500">Loading profile...</div>;

  // --- VIEW 1: FULL TEST RESULTS (Graph + Evaluator Notes) ---
  if (selectedTest) {
    const graphData = selectedTest.timeSeriesData || [];
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button onClick={() => setSelectedTest(null)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors">
          <ArrowLeft size={16} /> Back to History
        </button>

        {/* Results Header */}
        <div className="flex justify-between items-end bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                {selectedTest.simulationType || 'AUDIO'} SIMULATION
              </span>
              <span className="text-gray-400 text-[10px] font-bold">ID: {selectedTest.code}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{selectedTest.scenario} - Results</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(selectedTest.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><User size={14}/> Evaluator: <b className="text-[#9E2F2B]">{selectedTest.therapistName || 'Unassigned'}</b></span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Bias Score</div>
             <div className="text-5xl font-mono font-bold text-gray-900">{selectedTest.stressScore || '--'}<span className="text-xl text-gray-400">%</span></div>
          </div>
        </div>

        {/* Biometric Timeline Graph */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg flex items-center gap-2"><Activity className="text-[#9E2F2B]" size={20}/> Biometric Timeline</h3>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Heart Rate</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> HRV</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Stress Score</span>
              </div>
           </div>
           
           <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="time" hide />
                  <YAxis yAxisId="left" stroke="#CCC" />
                  <YAxis yAxisId="right" orientation="right" stroke="#CCC" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="heart_rate_0_to_200" stroke="#ef4444" dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="hrv_ms" stroke="#22c55e" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="stress_score_0_to_10" stroke="#3b82f6" dot={false} strokeWidth={2} />
                </LineChart>
             </ResponsiveContainer>
           </div>
           
           {/* Baseline Statistics Footer */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: 'Baseline Mean HR', value: selectedTest.baselineHR ? Math.round(selectedTest.baselineHR) : '--', unit: 'bpm' },
                { label: 'Baseline HR SD', value: selectedTest.baselineHR_StdDev ? selectedTest.baselineHR_StdDev.toFixed(2) : '--', unit: '' },
                { label: 'Final Mean HR', value: selectedTest.finalHeartRate ? Math.round(selectedTest.finalHeartRate) : '--', unit: 'bpm' },
                { label: 'Active Samples Failed', value: '0 / 14', unit: '', color: 'text-red-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-[#F9F9F9] p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color || 'text-gray-900'}`}>{stat.value} <span className="text-xs font-normal text-gray-400">{stat.unit}</span></p>
                </div>
              ))}
           </div>
        </div>

        {/* RESTORED: Evaluator Assessment Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Observation Notes</h4>
                <div className="min-h-[100px] text-gray-700 leading-relaxed italic">
                    {selectedTest.therapistNotes || "Waiting for evaluator's clinical observations..."}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Recommendations</h4>
                <div className="min-h-[100px] text-gray-700 leading-relaxed italic">
                    {selectedTest.recommendations || "N/A"}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: EMPLOYEE HISTORY LIST ---
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-gray-400 font-bold hover:text-black">
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Profile Header (Assigned Threshold Removed) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center mb-8">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-[#F9F9F9] flex items-center justify-center border border-gray-100">
                <User size={40} className="text-[#9E2F2B]" />
            </div>
            <div>
                <h1 className="text-4xl font-bold text-gray-900">{employee.fullName}</h1>
                <div className="flex gap-3 mt-2">
                    <span className="text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-500 flex items-center gap-1 font-medium"><Mail size={12}/> {employee.email}</span>
                    <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 flex items-center gap-1 font-black uppercase tracking-widest"><Briefcase size={10}/> EMPLOYEE</span>
                    <span className="text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-500 flex items-center gap-1 font-medium"><Calendar size={12}/> Joined {new Date(employee.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText size={20} className="text-gray-400"/> Clinical Assessment History
      </h3>
      
      <div className="space-y-3">
        {tests.map(test => (
            <div key={test.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${test.status === 'completed' || test.status === 'Reviewed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                     {test.status === 'completed' || test.status === 'Reviewed' ? <CheckCircle size={24}/> : <Clock size={24}/>}
                  </div>
                  <div>
                     <div className="font-bold text-gray-900 text-lg">{test.scenario}</div>
                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-4 mt-1">
                       <span className="text-gray-500">CODE: {test.code}</span>
                       <span className="flex items-center gap-1"><Clock size={10}/> {new Date(test.createdAt).toLocaleDateString()} {new Date(test.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} </span>
                        <span>Evaluator: <b className={test.therapistName ? "text-[#9E2F2B]" : "text-orange-500"}>{test.therapistName || 'Pending'}</b></span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-6">
                 {/* BUTTON LOGIC: Only show if test is NOT pending */}
                 {test.status !== 'assigned' ? (
                   <div className="flex items-center gap-6">
                     <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{test.stressScore || '0'}%</div>
                        <div className="text-[8px] uppercase font-black text-gray-300 tracking-widest">Score</div>
                     </div>
                     <button onClick={() => setSelectedTest(test)} className="bg-[#9E2F2B] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-all">
                        Review Full Data
                     </button>
                   </div>
                 ) : (
                   <div className="text-gray-300 text-xs font-bold italic pr-4">
                     Simulation Pending
                   </div>
                 )}
               </div>
            </div>
        ))}
      </div>
    </div>
  );
}

function TestsPage({ companyId }) {
    const [allTests, setAllTests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [evaluators, setEvaluators] = useState([]);
    const [form, setForm] = useState({ empId: '', simulationType: 'Audio Simulation', evaluatorId: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getEmps = async () => {
            const s = await getDocs(collection(db, 'companies', companyId, 'employees'));
            setEmployees(s.docs.map(d => ({id: d.id, ...d.data()})).filter(e => e.role !== 'admin'));
        };
        const getEvals = async () => {
            const q = query(collection(db, 'companies', companyId, 'therapists')); 
            const s = await getDocs(q);
            setEvaluators(s.docs.map(d => ({id: d.id, ...d.data()})));
        };
        const unsub = onSnapshot(query(collection(db, 'companies', companyId, 'tests')), (snap) => {
            const sorted = snap.docs.map(d => ({id: d.id, ...d.data()}))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllTests(sorted);
        });
        getEmps(); getEvals();
        return unsub;
    }, [companyId]);

    const handleAssign = async () => {
        if(!form.empId || !form.evaluatorId || !form.simulationType) return alert("Select Mode, Employee, and Evaluator"); 
        setLoading(true);
        const emp = employees.find(e => e.id === form.empId);
        const evalUser = evaluators.find(ev => ev.id === form.evaluatorId);
        
        const randomScenario = DEFAULT_SCENARIOS[Math.floor(Math.random() * DEFAULT_SCENARIOS.length)];
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const newTest = {
            employeeId: emp.id, 
            employeeEmail: emp.fullName, 
            therapistId: form.evaluatorId,   
            therapistName: evalUser.fullName,
            simulationType: form.simulationType.includes("Live") ? "Live" : "Audio",
            scenario: form.simulationType.includes("Live") ? "Real-Life Scenario" : randomScenario.title,
            code: code,
            status: 'assigned',
            archived: false, 
            createdAt: new Date().toISOString()
        };
        try {
          await addDoc(collection(db, 'companies', companyId, 'tests'), newTest);
          alert(`Test Generated! Scenario Picked: ${newTest.scenario}`);
          setForm({ empId: '', simulationType: 'Audio Simulation', evaluatorId: '' });
        } catch(err) { alert(err.message); } finally { setLoading(false); }
    };

    const handleDeleteTest = async (testId) => {
        if(window.confirm("Delete this test assignment?")) {
            await deleteDoc(doc(db, 'companies', companyId, 'tests', testId));
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Test Assignments</h1>
            <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] flex flex-col md:flex-row gap-4 items-end shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Test Mode</label>
                    <select className="w-full p-4 rounded-xl border bg-[#F9F9F9] focus:border-[#9E2F2B] outline-none text-sm font-semibold" value={form.simulationType} onChange={e => setForm({...form, simulationType: e.target.value})}>
                        <option value="Audio Simulation">Audio Simulation</option>
                        <option value="Live Simulation">Live Simulation</option>
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Employee</label>
                    <select className="w-full p-4 rounded-xl border bg-[#F9F9F9] focus:border-[#9E2F2B] outline-none text-sm font-semibold" value={form.empId} onChange={e => setForm({...form, empId: e.target.value})}>
                        <option value="">Select Employee</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Assign to Evaluator</label>
                    <select className="w-full p-4 rounded-xl border bg-[#F9F9F9] focus:border-[#9E2F2B] outline-none text-sm font-semibold" value={form.evaluatorId} onChange={e => setForm({...form, evaluatorId: e.target.value})}>
                        <option value="">Select Evaluator</option>
                        {evaluators.map(ev => <option key={ev.id} value={ev.id}>{ev.fullName}</option>)}
                    </select>
                </div>
                <button onClick={handleAssign} disabled={loading} className="w-full md:w-auto h-[52px] bg-[#9E2F2B] text-white px-8 rounded-xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-widest hover:bg-[#8E2522]">
                   <Send size={16}/> {loading ? '...' : 'Generate & Email'}
                </button>
            </div>

            <div>
                <h2 className="text-lg font-bold text-[#1A1A1A] mb-6">Test History & Results</h2>
                <div className="space-y-4">
                    {allTests.filter(t => !t.archived).map(t => (
                        <div key={t.id} className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl text-[#9E2F2B]">
                                    {t.simulationType === 'Live' ? <Mic size={20} className="text-blue-500" /> : <FileText size={20} className="text-[#9E2F2B]" />}
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-[#1A1A1A]">{t.employeeEmail}</div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {t.scenario} {t.simulationType === 'Live' && <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">LIVE</span>}
                                        <div className="mt-1 text-[#9E2F2B] italic font-semibold">Evaluator: {t.therapistName}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right flex flex-col items-end">
                                    <div className="text-xl font-mono font-bold text-[#1A1A1A]">{t.code}</div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400">Access Code</div>
                                </div>
                                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'assigned' || t.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                        {t.status === 'assigned' ? 'PENDING' : t.status.toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                        <Clock size={10} />
                                        {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        <span className="mx-0.5">•</span>
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteTest(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AudiosPage() {
  const [scenarios, setScenarios] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newScenario, setNewScenario] = useState({ title: '', description: '', file: null });

  useEffect(() => {
    const q = query(collection(db, 'audio_scenarios'));
    return onSnapshot(q, (snapshot) => {
        setScenarios([...DEFAULT_SCENARIOS, ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
    });
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newScenario.file || !newScenario.title) return;
    setIsUploading(true);
    try {
        const storageRef = ref(getStorage(), `scenarios/${Date.now()}_${newScenario.file.name}`);
        await uploadBytes(storageRef, newScenario.file);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'audio_scenarios'), { title: newScenario.title, description: newScenario.description, audioUrl: url });
        setShowUploadForm(false);
    } catch (error) { alert(error.message); } finally { setIsUploading(false); }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Audio Library</h1>
            <button onClick={() => setShowUploadForm(!showUploadForm)} className="bg-[#9E2F2B] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#8E2522]">
                <Plus size={20}/> Upload Scenario
            </button>
        </div>
        {showUploadForm && (
            <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border mb-6 space-y-4 shadow-sm">
                <input className="p-3 border rounded-lg w-full bg-[#F9F9F9] focus:border-[#9E2F2B] outline-none" placeholder="Title" value={newScenario.title} onChange={e => setNewScenario({...newScenario, title: e.target.value})} />
                <textarea className="p-3 border rounded-lg w-full bg-[#F9F9F9] focus:border-[#9E2F2B] outline-none" placeholder="Description" value={newScenario.description} onChange={e => setNewScenario({...newScenario, description: e.target.value})} />
                <div className="flex items-center gap-4">
                  <input type="file" onChange={e => setNewScenario({...newScenario, file: e.target.files[0]})} className="text-sm text-gray-500" />
                  <button type="submit" disabled={isUploading} className="bg-[#9E2F2B] text-white px-6 py-2 rounded-lg font-bold">{isUploading ? 'Uploading...' : 'Save Scenario'}</button>
                </div>
            </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-50 rounded-lg text-[#9E2F2B]"><Headphones size={20}/></div>
                        <h3 className="font-bold">{s.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 h-12 overflow-hidden">{s.description}</p>
                    {s.audioUrl ? (
                        <audio controls src={s.audioUrl} className="w-full h-8" />
                    ) : (
                        <button className="w-full py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-400">No Audio Attached</button>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}



