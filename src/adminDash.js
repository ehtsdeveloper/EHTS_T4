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
  PlayCircle, Mic, Upload, LogOut, Menu 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// UPDATED: Standardized import name
import EvaluatorAdminDash from './evaluatorAdminDash'; 

// ==========================================
// CONSTANTS
// ==========================================
const DEFAULT_SCENARIOS = [
  { id: 'def_1', title: "Gender Bias - Women Authority", description: "Scenario depicting subtle undermining of female authority in a corporate setting.", isDefault: true, audioUrl: "https://firebasestorage.googleapis.com/v0/b/biasdetection-8e483.firebasestorage.app/o/Audio%20Library%2FAudio%20Library%2Fgender_w.mp3?alt=media&token=4d83b272-62dc-40b8-99e0-f7828dec93da"},
  { id: 'def_2', title: "Gender Bias - Male Authority", description: "Scenario exploring biases related to traditional male-dominated leadership expectations.", isDefault: true },
  { id: 'def_3', title: "Racial Bias - White", description: "Examining interactions and potential unconscious favoritism or assumptions in majority-group settings.", isDefault: true },
  { id: 'def_4', title: "Racial Bias - Black", description: "Scenario highlighting unconscious bias, microaggressions, or double standards in a professional environment.", isDefault: true },
  { id: 'def_5', title: "Faith - Christianity", description: "Workplace scenario involving religious expression, holiday observance, or cultural assumptions related to Christian traditions.", isDefault: true },
  { id: 'def_6', title: "Faith - Islam", description: "Scenario focusing on religious accommodations, prayer breaks, or overcoming common stereotypes in the workplace.", isDefault: true },
  { id: 'def_7', title: "Faith - Judaism", description: "Exploring biases related to Jewish identity, cultural observance, and professional inclusion.", isDefault: true }
];

// ==========================================
// ADMIN DASHBOARD
// ==========================================
export default function AdminDashboard({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [detailId, setDetailId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  // State to store the real company name
  const [companyName, setCompanyName] = useState('Loading...');

  const navigateTo = (view, id = null) => {
    setCurrentView(view);
    setDetailId(id);
  };

  // Fetch Company Name from Firestore
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
          console.error("Error fetching company name:", error);
          setCompanyName(user.companyId.toUpperCase());
        }
      }
    };
    fetchCompanyName();
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex font-sans">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} h-screen bg-white border-r border-[#E5E5E5] sticky top-0 hidden md:flex flex-col shrink-0 transition-all duration-300 shadow-sm`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-[#2B1F1F] rounded-xl flex items-center justify-center text-[#C73A36]">
              <Activity size={20} />
            </div>
            <div>
              <div className="font-bold text-[#1A1A1A] leading-none">EHTS</div>
              <div className="text-[10px] text-[#5A5A5A] mt-1">Bias Detector</div>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
            { id: 'employees', icon: Users, label: 'Employees' },
            // UPDATED: Changed from Therapists to Evaluators
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

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 border-b border-[#E5E5E5] bg-white/90 backdrop-blur flex justify-between items-center z-10">
          <div className="text-3xl flex items-center gap-2 font-semibold text-[#1A1A1A]">
            <span className=" w-2 h-2 bg-green-500 rounded-full"></span>
            {companyName}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#1A1A1A]">Administrator</div>
              <div className="text-xs text-[#5A5A5A]">{user.email}</div>
            </div>
            <button 
              onClick={onLogout} 
              className="px-4 py-2 border border-[#E5E5E5] bg-white rounded-lg cursor-pointer font-bold text-xs hover:bg-gray-50 transition-colors text-[#1A1A1A]"
            >
              Log Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {currentView === 'dashboard' && <AdminHomeStats companyId={user.companyId} />}
          {currentView === 'employees' && <EmployeesPage companyId={user.companyId} onViewDetail={(id) => navigateTo('employee-detail', id)} />}
          
          {/* UPDATED: Changed from therapists to evaluators */}
          {currentView === 'evaluators' && <EvaluatorAdminDash user={user} />}
          
          {currentView === 'employee-detail' && <EmployeeDetailPage employeeId={detailId} companyId={user.companyId} onBack={() => navigateTo('employees')} />}
          {currentView === 'tests' && <TestsPage companyId={user.companyId} />}
          {currentView === 'audios' && <AudiosPage />}
        </main>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

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
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef(null);

  const handleTimeUpdate = () => { }; 

  const handleArchive = async (testId) => {
    if (window.confirm("Archive this test?")) {
        try {
            await updateDoc(doc(db, 'companies', companyId, 'tests', testId), { archived: true });
            setTests(prev => prev.filter(t => t.id !== testId));
        } catch (e) { alert("Error: " + e.message); }
    }
  };

  const handleDelete = async (test) => {
    if (window.confirm("Permanently delete this pending test?")) {
        try {
            // Delete Audio if exists
            if (test.audioUrl) {
                try {
                    const storage = getStorage(db.app);
                    const fileRef = ref(storage, test.audioUrl);
                    await deleteObject(fileRef);
                } catch (err) { console.warn("Audio delete skipped:", err); }
            }
            // Delete DB Record
            await deleteDoc(doc(db, 'companies', companyId, 'tests', test.id));
            setTests(prev => prev.filter(t => t.id !== test.id));
        } catch (e) { alert("Error: " + e.message); }
    }
  };

  const handlePermanentDelete = async (id) => {
    if(window.confirm("WARNING: This will permanently delete this record. Continue?")) {
      try { 
        // Delete Audio if exists
        if (selectedTest && selectedTest.audioUrl) {
            try {
                const storage = getStorage(db.app);
                const fileRef = ref(storage, selectedTest.audioUrl);
                await deleteObject(fileRef);
            } catch (err) { console.warn("Audio delete skipped:", err); }
        }
        // Delete DB Record
        await deleteDoc(doc(db, 'companies', companyId, 'tests', id));
        setTests(prev => prev.filter(t => t.id !== id));
        if (selectedTest && selectedTest.id === id) setSelectedTest(null);
      } catch(e) { alert(e.message); }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTest) return;
    setIsUploading(true);
    try {
        const storage = getStorage(db.app);
        const storageRef = ref(storage, `recordings/${selectedTest.id}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await updateDoc(doc(db, 'companies', companyId, 'tests', selectedTest.id), { audioUrl: downloadURL });
        setSelectedTest(prev => ({ ...prev, audioUrl: downloadURL }));
    } catch (error) { alert("Upload failed: " + error.message); } 
    finally { setIsUploading(false); }
  };

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

  if (!employee) return <div>Loading...</div>;

  if (selectedTest) {
    // PREPARE DATA
    const rawData = selectedTest.timeSeriesData || [];
    const graphData = rawData.map(point => ({
        ...point,
        stressIndicator: point.stressIndicator === -1 ? null : point.stressIndicator
    }));

    const validSamples = graphData.filter(pt => pt.time > 65).length;
    const failedSamples = graphData.filter(pt => pt.stress).length;

    const audioSrc = selectedTest.audioUrl || "";

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedTest(null)} className="flex items-center gap-2 text-[#5A5A5A] font-bold hover:text-[#1A1A1A]">
          <ArrowLeft size={16} /> Back to History
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">{selectedTest.scenario} - Results</h2>
            <div className="text-sm text-[#5A5A5A] mt-1 flex items-center gap-4">
              <span>Code: {selectedTest.code}</span>
              <span className={`font-bold ${selectedTest.testType === 'live' ? 'text-blue-600' : 'text-purple-600'}`}>
                {selectedTest.testType === 'live' ? 'LIVE SCENARIO' : 'AUDIO SIMULATION'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {selectedTest.completedDate || new Date(selectedTest.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-xs font-bold uppercase text-[#5A5A5A]">Bias Score</div>
                <div className={`text-3xl font-bold ${selectedTest.stressScore > 25 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedTest.stressScore || '--'}%
                </div>
            </div>
            <button onClick={() => handlePermanentDelete(selectedTest.id)} className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-200">
                <Trash2 size={20} />
            </button>
          </div>
        </div>

        {selectedTest.testType === 'live' && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 mt-6">
                <div className="bg-blue-200 p-2 rounded-full text-blue-700"><Mic size={20} /></div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-blue-800">Session Recording</div>
                    <div className="text-xs text-blue-600">Audio timeline aligned with graph.</div>
                </div>
                {audioSrc ? (
                    <audio controls src={audioSrc} ref={audioRef} onTimeUpdate={handleTimeUpdate} className="h-10 w-full max-w-md" />
                ) : (
                    <label className="cursor-pointer bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                        <Upload size={16} /> {isUploading ? "Uploading..." : "Upload Audio"}
                        <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={isUploading}/>
                    </label>
                )}
            </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
           <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Activity size={20} className="text-[#9E2F2B]"/> Biometric Timeline
                </h3>
                <div className="flex gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Heart Rate</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> HRV</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Score</div>
                </div>
           </div>
           
           <div className="h-96 w-full">
             {graphData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" type="number" label={{ value: 'Seconds', position: 'insideBottom', offset: -5 }} />
                    <YAxis yAxisId="left" domain={['auto', 'auto']} label={{ value: 'BPM / ms', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} label={{ value: 'Stress Index', angle: 90, position: 'insideRight' }} />
                    <Tooltip labelFormatter={(label) => `Time: ${label}s`} />
                    <ReferenceLine yAxisId="right" y={2.0} stroke="#9ca3af" strokeDasharray="5 5" label="Threshold (2.0)" />
                    <Line yAxisId="left" type="monotone" dataKey="heart_rate_0_to_200" name="Heart Rate" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="stress_score_0_to_10" name="Stress Score" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="stressIndicator" name="Confirmed Stress" stroke="none" dot={{ fill: '#dc2626', r: 4, strokeWidth: 0 }} activeDot={false} />
                  </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <Activity size={48} className="mb-4 opacity-20" />
                 <p>No timeline data available.</p>
               </div>
             )}
           </div>

           {/* --- STATS GRID --- */}
           <div className="mt-6 pt-6 border-t border-[#F5F5F5]">
                <h4 className="text-sm font-bold text-[#5A5A5A] mb-3 uppercase tracking-wider">Baseline Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#F9F9F9] p-4 rounded-xl border border-[#E5E5E5]">
                        <div className="text-xs text-[#5A5A5A] font-bold">Baseline Mean HR</div>
                        <div className="text-xl font-bold text-[#1A1A1A] mt-1">
                            {selectedTest.baselineHR ? Math.round(selectedTest.baselineHR) : '--'} <span className="text-xs text-[#999] font-normal">bpm</span>
                        </div>
                    </div>
                    <div className="bg-[#F9F9F9] p-4 rounded-xl border border-[#E5E5E5]">
                        <div className="text-xs text-[#5A5A5A] font-bold">Baseline HR SD</div>
                        <div className="text-xl font-bold text-[#1A1A1A] mt-1">
                            {selectedTest.baselineHR_StdDev ? parseFloat(selectedTest.baselineHR_StdDev).toFixed(2) : '--'}
                        </div>
                    </div>
                    <div className="bg-[#F9F9F9] p-4 rounded-xl border border-[#E5E5E5]">
                         <div className="text-xs text-[#5A5A5A] font-bold">Final Mean HR</div>
                         <div className="text-xl font-bold text-[#1A1A1A] mt-1">
                            {selectedTest.finalHeartRate || '--'} <span className="text-xs text-[#999] font-normal">bpm</span>
                        </div>
                    </div>
                    <div className="bg-[#F9F9F9] p-4 rounded-xl border border-[#E5E5E5]">
                        <div className="text-xs text-[#5A5A5A] font-bold">Active Samples Failed</div>
                        <div className="text-xl font-bold text-[#C73A36] mt-1">
                            {failedSamples} <span className="text-xs text-[#999] font-normal">/ {validSamples}</span>
                        </div>
                    </div>
                </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-[#5A5A5A] font-bold hover:text-[#1A1A1A]">
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] shadow-sm flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-[#F9F9F9] grid place-items-center border border-[#E5E5E5]">
            <User size={48} className="text-[#9E2F2B]" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">{employee.fullName}</h1>
            <div className="flex gap-6 mt-3 text-sm text-[#5A5A5A]">
                <span className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-1 rounded-full"><Mail size={14}/> {employee.email}</span>
                <span className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-1 rounded-full uppercase"><Briefcase size={14}/> {employee.role}</span>
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Test Assignments & History</h3>
        {tests.map(test => (
             <div key={test.id} className="bg-white p-5 rounded-xl border border-[#E5E5E5] flex justify-between items-center hover:shadow-sm transition-shadow mb-4">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-lg ${test.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      {test.status === 'completed' ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                   </div>
                   <div>
                      <div className="font-bold text-[#1A1A1A]">{test.scenario}</div>
                      <div className="text-xs text-[#5A5A5A] mt-0.5 flex items-center gap-1">
                         <Calendar size={12} /> {test.completedDate || 'Pending'}
                      </div>
                      <div className="text-xs text-[#5A5A5A] uppercase tracking-wider mt-0.5">Code: {test.code}</div>
                   </div>
                </div>
                {test.status === 'completed' ? (
                  <button onClick={() => setSelectedTest(test)} className="bg-[#9E2F2B] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                     <Activity size={16} /> View Graph
                  </button>
                ) : (
                  <button onClick={() => handleDelete(test)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                )}
             </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// TESTS PAGE
// ==========================================
function TestsPage({ companyId }) {
    const [allTests, setAllTests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ empId: '', testType: 'audio' });
    const [loading, setLoading] = useState(false);
    const [scenarios, setScenarios] = useState([]);

    const activeTests = allTests.filter(t => !t.archived);

    useEffect(() => {
        const q = query(collection(db, 'audio_scenarios'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customItems = snapshot.docs.map(doc => ({ title: doc.data().title }));
            const defaultItems = DEFAULT_SCENARIOS.map(s => ({ title: s.title }));
            setScenarios([...defaultItems, ...customItems]);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const getEmps = async () => {
            const s = await getDocs(collection(db, 'companies', companyId, 'employees'));
            setEmployees(s.docs.map(d => ({id: d.id, ...d.data()})).filter(e => e.role !== 'admin'));
        };
        const unsub = onSnapshot(query(collection(db, 'companies', companyId, 'tests')), (snap) => {
            setAllTests(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        getEmps();
        return unsub;
    }, [companyId]);

    const handleAssign = async () => {
        if(!form.empId) return;
        setLoading(true);
        const emp = employees.find(e => e.id === form.empId);
        let finalScenarioName = "Real-Life Scenario";
        if (form.testType === 'audio') {
            if (scenarios.length > 0) {
                const randomIndex = Math.floor(Math.random() * scenarios.length);
                finalScenarioName = scenarios[randomIndex].title;
            } else {
                finalScenarioName = "Standard Bias Test";
            }
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const newTest = {
            employeeId: emp.id, 
            employeeName: emp.fullName, 
            employeeEmail: emp.email, 
            dob: emp.dob,
            scenario: finalScenarioName,
            testType: form.testType,
            audioConfig: { triggerTime: 60 },
            code: code,
            status: 'assigned',
            archived: false, 
            createdAt: new Date().toISOString()
        };
        try {
          await addDoc(collection(db, 'companies', companyId, 'tests'), newTest);
          await sendTestAssignmentEmail(emp.email, emp.fullName, code, finalScenarioName, companyId);
          alert(`Test Assigned! Random scenario selected: "${finalScenarioName}"`);
        } catch(err) {
          alert("Assignment Failed: " + err.message);
        } finally {
          setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Permanently delete this pending test?")) {
            try { 
                await deleteDoc(doc(db, 'companies', companyId, 'tests', id));
            } catch (e) { alert(e.message); }
        }
    };

    const handleArchive = async (id) => {
        if(window.confirm("Archive this test?")) {
            try { 
                await updateDoc(doc(db, 'companies', companyId, 'tests', id), { archived: true }); 
            } catch (e) { alert("Error: " + e.message); }
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <h1 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Test Assignments</h1>
            
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm mb-6">
                <div className="flex gap-4 items-end">
                    <div className="w-1/4">
                        <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2">Test Mode</label>
                        <select className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none font-bold" value={form.testType} onChange={e => setForm({...form, testType: e.target.value})}>
                            <option value="audio">Audio Simulation</option>
                            <option value="live">Live Scenario</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2">Employee</label>
                        <select className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none" value={form.empId} onChange={e => setForm({...form, empId: e.target.value})}>
                            <option value="">Select Employee</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.email})</option>)}
                        </select>
                    </div>
  
                    <button onClick={handleAssign} disabled={loading} className="bg-[#9E2F2B] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#8E2522] transition-colors whitespace-nowrap disabled:opacity-70 flex items-center gap-2">
                        {loading ? 'Sending...' : <><Send size={16}/> Generate & Email</>}
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#1A1A1A]">Test History & Results</h2>
                {activeTests.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${t.testType === 'live' ? 'bg-blue-50 text-blue-600' : 'bg-[#F5F5F5] text-[#9E2F2B]'}`}>
                                {t.testType === 'live' ? <Mic size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                                <div className="font-bold text-[#1A1A1A]">{t.employeeName}</div>
                                <div className="text-xs text-[#5A5A5A]">
                                    {t.scenario} 
                                    {t.testType === 'live' && <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">LIVE</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-mono font-bold text-[#1A1A1A] tracking-wider">{t.code}</div>
                                <div className="text-xs text-[#5A5A5A] font-bold uppercase tracking-widest">Access Code</div>
                            </div>
                            {t.status === 'completed' ? (
                                <>
                                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-green-200">COMPLETED</span>
                                    <button onClick={() => handleArchive(t.id)} className="text-[#AAA] hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs bg-[#FFEDD5] text-[#9A3412] px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-[#FFEDD5]">PENDING</span>
                                    <button onClick={() => handleDelete(t.id)} className="text-[#AAA] hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
// AUDIOS PAGE
// ==========================================
function AudiosPage() {
  const [scenarios, setScenarios] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newScenario, setNewScenario] = useState({ title: '', description: '', file: null });

  useEffect(() => {
    const q = query(collection(db, 'audio_scenarios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScenarios([...DEFAULT_SCENARIOS, ...items]);
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newScenario.file || !newScenario.title) return;
    setIsUploading(true);
    try {
        const storage = getStorage(db.app);
        const storageRef = ref(storage, `scenarios/${Date.now()}_${newScenario.file.name}`);
        
        await uploadBytes(storageRef, newScenario.file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'audio_scenarios'), {
            title: newScenario.title,
            description: newScenario.description,
            audioUrl: url,
            createdAt: new Date().toISOString()
        });
        
        setShowUploadForm(false);
        setNewScenario({ title: '', description: '', file: null });
        alert("Scenario added successfully!");
    } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed: " + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Audio Scenario Library</h1>
                <p className="text-[#5A5A5A]">Review and manage audio simulations for bias testing.</p>
            </div>
            <button onClick={() => setShowUploadForm(!showUploadForm)} className="bg-[#9E2F2B] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#8E2522] transition-colors">
                {showUploadForm ? <X size={20} /> : <Plus size={20} />}
                {showUploadForm ? "Cancel" : "Upload New Scenario"}
            </button>
        </div>
        
        {showUploadForm && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-lg mb-8">
                <h3 className="font-bold text-lg mb-4 text-[#1A1A1A]">Add New Scenario</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input className="p-3 border border-[#E5E5E5] rounded-lg w-full outline-none focus:border-[#9E2F2B]" placeholder="Scenario Title" value={newScenario.title} onChange={e => setNewScenario({...newScenario, title: e.target.value})} required />
                    </div>
                    <textarea className="p-3 border border-[#E5E5E5] rounded-lg w-full outline-none focus:border-[#9E2F2B]" placeholder="Description of the scenario..." rows="3" value={newScenario.description} onChange={e => setNewScenario({...newScenario, description: e.target.value})} />
                    <div className="flex items-center gap-4">
                        <input type="file" accept="audio/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#F5F5F5] file:text-[#9E2F2B] hover:file:bg-[#E5E5E5]" onChange={e => setNewScenario({...newScenario, file: e.target.files[0]})} required />
                        <button type="submit" disabled={isUploading} className="bg-[#9E2F2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8E2522] transition-colors disabled:opacity-50">
                            {isUploading ? "Uploading..." : "Save Scenario"}
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((item, index) => (
                <div key={item.id || index} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-[#F9F9F9] rounded-xl text-[#9E2F2B]"><Headphones size={24} /></div>
                    <h3 className="font-bold text-[#1A1A1A]">{item.title}</h3>
                  </div>
                    <p className="text-sm text-[#5A5A5A] mb-4 h-16 overflow-hidden text-ellipsis">{item.description}</p>
                    {item.audioUrl ? (
                        <audio controls src={item.audioUrl} className="w-full h-8" />
                    ) : (
                        <button className="w-full py-2 bg-[#F5F5F5] hover:bg-[#E5E5E5] rounded-lg text-[#1A1A1A] font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                            <PlayCircle size={16} /> Preview Audio
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}

