import React, { useState, useEffect } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth, signOut } from 'firebase/auth';
import { collection, query, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc, onSnapshot, where } from 'firebase/firestore';
import { db, firebaseConfig } from './firebase'; 
import { sendTestAssignmentEmail } from './emailService';
import { 
  LayoutGrid, Users, FileText, Activity, 
  Plus, Search, Trash2, Mail, Lock, Shield, User, CheckCircle, X, Clipboard, Calendar,
  AlertTriangle, TrendingUp, ArrowLeft, Thermometer, Shuffle, Send, Heart, Briefcase, Headphones, PlayCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ==========================================
// ADMIN DASHBOARD
// ==========================================
export default function AdminDashboard({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [detailId, setDetailId] = useState(null);

  const navigateTo = (view, id = null) => {
    setCurrentView(view);
    setDetailId(id);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex font-sans">
      {/* SIDEBAR */}
      <aside className="h-screen w-72 bg-white border-r border-[#E5E5E5] sticky top-0 hidden md:flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2B1F1F] rounded-xl flex items-center justify-center text-[#C73A36]">
            <Activity size={20} />
          </div>
          <div>
            <div className="font-bold text-[#1A1A1A]">EHTS</div>
            <div className="text-xs text-[#5A5A5A]">Bias Detector</div>
          </div>
        </div>
        <nav className="px-4 flex flex-col gap-1">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
            { id: 'employees', icon: Users, label: 'Employees' },
            { id: 'tests', icon: FileText, label: 'Tests' },
            { id: 'audios', icon: Headphones, label: 'Audios' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => navigateTo(item.id)} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl mb-1 cursor-pointer transition-colors text-left font-medium ${
                currentView === item.id 
                  ? 'bg-[#9E2F2B] text-white shadow-sm' 
                  : 'text-[#5A5A5A] hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-4 border-b border-[#E5E5E5] bg-white/90 backdrop-blur flex justify-between items-center z-10">
          <div className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {user.companyId.replace(/_/g, ' ').toUpperCase()}
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
          {currentView === 'employee-detail' && <EmployeeDetailPage employeeId={detailId} companyId={user.companyId} onBack={() => navigateTo('employees')} />}
          {currentView === 'tests' && <TestsPage companyId={user.companyId} />}
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
        <button 
          onClick={() => setOpen(true)} 
          className="bg-[#9E2F2B] text-white border-none rounded-lg px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 hover:bg-[#8E2522] transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* UPDATED: LARGER CARDS WITH 2 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employees.map((e) => (
          <div 
            key={e.id} 
            className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm relative hover:shadow-lg transition-all group cursor-pointer border-l-4 border-l-[#9E2F2B]"
            onClick={() => onViewDetail(e.id)}
          >
            {/* DELETE BUTTON - Top Right */}
            <button 
              onClick={(event) => handleDelete(event, e.id)} 
              className="absolute top-4 right-4 text-[#AAA] hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors z-10"
              title="Delete User"
            >
              <Trash2 size={20} />
            </button>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#F9F9F9] flex items-center justify-center border border-[#E5E5E5] shrink-0">
                {e.role === 'admin' ? <Shield size={28} className="text-[#9E2F2B]" /> : <User size={28} className="text-[#5A5A5A]" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#1A1A1A]">{e.fullName}</h3>
                  {e.role === 'admin' && (
                    <span className="bg-[#1A1A1A] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-[#5A5A5A]">
                  <div className="flex items-center gap-2">
                    <Mail size={14} /> {e.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} /> {e.role === 'admin' ? 'Administrator' : 'Staff Member'}
                  </div>
                </div>
                {e.role !== 'admin' && (
                <div className=" pt-2 border-t border-[#F5F5F5]">
                  
                  <button 
                    className=" w-full bg-[#9E2F2B] hover:bg-[#872623] active:scale-[0.98] transition text-white text-sm font-bold py-3 rounded-lg
                      flex items-center justify-center
                    "
                  >
                    View Test History
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
      // 1. Fetch Employee Profile
      const docRef = doc(db, 'companies', companyId, 'employees', employeeId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setEmployee({ id: snap.id, ...snap.data() });

      // 2. Fetch Employee's Tests
      const q = query(
        collection(db, 'companies', companyId, 'tests'), 
        where('employeeId', '==', employeeId)
      );
      const testSnap = await getDocs(q);
      const loadedTests = testSnap.docs.map(d => ({id: d.id, ...d.data()}));
      setTests(loadedTests);
    }
    load();
  }, [employeeId, companyId]);

  if (!employee) return <div>Loading...</div>;

  // Render Graph View if a test is selected
  if (selectedTest) {
    // Use real data if available, otherwise mock it for display
    const graphData = selectedTest.timeSeriesData ;

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedTest(null)} className="flex items-center gap-2 text-[#5A5A5A] font-bold hover:text-[#1A1A1A]">
          <ArrowLeft size={16} /> Back to History
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">{selectedTest.scenario} - Results</h2>
            <div className="text-sm text-[#5A5A5A]">Code: {selectedTest.code} • Status: {selectedTest.status}</div>
          </div>
          <div className="text-right">
             <div className="text-xs font-bold uppercase text-[#5A5A5A]">Bias Score</div>
             <div className={`text-3xl font-bold ${selectedTest.stressScore > 70 ? 'text-red-600' : 'text-green-600'}`}>
               {selectedTest.stressScore || '--'}%
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
           <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
             <Activity size={20} className="text-[#9E2F2B]"/> Biometric Timeline
           </h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={graphData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="time" label={{ value: 'Seconds', position: 'insideBottom', offset: -5 }} />
                 <YAxis />
                 <Tooltip />
                 <Legend />
                 <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#ef4444" strokeWidth={2} dot={false} />
                 <Line type="monotone" dataKey="hrv" name="HRV" stroke="#3b82f6" strokeWidth={2} dot={false} />
                 <Line type="monotone" dataKey="temp" name="Body Temp" stroke="#f97316" strokeWidth={2} dot={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    );
  }

  // Render Default Profile View
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-[#5A5A5A] font-bold hover:text-[#1A1A1A]">
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Profile Header */}
      <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] shadow-sm flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-[#F9F9F9] grid place-items-center border border-[#E5E5E5]">
            <User size={48} className="text-[#9E2F2B]" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">{employee.fullName}</h1>
            <div className="flex gap-6 mt-3 text-sm text-[#5A5A5A]">
                <span className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-1 rounded-full"><Mail size={14}/> {employee.email}</span>
                <span className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-1 rounded-full"><Briefcase size={14}/> {employee.role}</span>
                <span className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-1 rounded-full"><Calendar size={14}/> {employee.dob}</span>
            </div>
        </div>
      </div>

      {/* Test History List */}
      <div>
        <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Test Assignments & History</h3>
        {tests.length === 0 ? (
           <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-[#E5E5E5] text-center text-[#AAA]">
              <Clipboard size={48} className="mx-auto mb-4 opacity-50"/>
              <p>No tests assigned to this employee yet.</p>
           </div>
        ) : (
           <div className="grid gap-4">
              {tests.map(test => (
                 <div key={test.id} className="bg-white p-5 rounded-xl border border-[#E5E5E5] flex justify-between items-center hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-lg ${test.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                          {test.status === 'completed' ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                       </div>
                       <div>
                          <div className="font-bold text-[#1A1A1A]">{test.scenario}</div>
                          <div className="text-xs text-[#5A5A5A] uppercase tracking-wider">Code: {test.code}</div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                       {test.status === 'completed' ? (
                          <>
                            <div className="text-right">
                               <div className="text-xs font-bold text-[#AAA]">SCORE</div>
                               <div className="font-bold text-[#1A1A1A]">{test.stressScore}%</div>
                            </div>
                            <button 
                               onClick={() => setSelectedTest(test)}
                               className="bg-[#9E2F2B] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#8E2522] transition-colors flex items-center gap-2"
                            >
                               <Activity size={16} /> View Graph
                            </button>
                          </>
                       ) : (
                          <div className="bg-[#FFF7ED] text-[#9A3412] px-3 py-1 rounded-full text-xs font-bold border border-[#FFEDD5]">
                             PENDING
                          </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}


function TestsPage({ companyId }) {
    const [tests, setTests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ empId: '' });
    const [loading, setLoading] = useState(false);

    const SCENARIOS = [
        "Gender Bias - Meeting",
        "Racial Bias - Interview",
        "Age Bias - Tech Talk",
        "Workplace Conflict",
        "Peer Review",
        "Customer Service"
    ];

    useEffect(() => {
        const getEmps = async () => {
            const s = await getDocs(collection(db, 'companies', companyId, 'employees'));
            setEmployees(s.docs.map(d => ({id: d.id, ...d.data()})).filter(e => e.role !== 'admin'));
        };
        const unsub = onSnapshot(query(collection(db, 'companies', companyId, 'tests')), (snap) => {
            setTests(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        getEmps();
        return unsub;
    }, [companyId]);

    const handleAssign = async () => {
        if(!form.empId) return;
        setLoading(true);
        const emp = employees.find(e => e.id === form.empId);
        
        const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const newTest = {
            employeeId: emp.id, 
            employeeName: emp.fullName, 
            employeeEmail: emp.email, 
            dob: emp.dob,
            scenario: randomScenario, 
            audioConfig: { triggerTime: 40 },
            code: code,
            status: 'assigned',
            createdAt: new Date().toISOString()
        };
        
        try {
          await addDoc(collection(db, 'companies', companyId, 'tests'), newTest);
          
          // --- SEND EMAIL (Updated with companyId) ---
          await sendTestAssignmentEmail(emp.email, emp.fullName, code, randomScenario, companyId);
          
          alert(`Test Assigned! Email sent to ${emp.email}`);
        } catch(err) {
          alert("Assignment Failed: " + err.message);
        } finally {
          setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Delete test assignment?")) {
            try { await deleteDoc(doc(db, 'companies', companyId, 'tests', id)); } catch (e) {}
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <h1 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Test Assignments</h1>
            
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm mb-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2">Employee</label>
                        <select 
                            className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] outline-none" 
                            value={form.empId} 
                            onChange={e => setForm({...form, empId: e.target.value})}
                        >
                            <option value="">Select Employee</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.email})</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-[#5A5A5A] uppercase mb-2">Test Type</label>
                        <div className="w-full p-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] text-[#5A5A5A] flex items-center gap-2">
                            <Shuffle size={16} /> Randomly Generated
                        </div>
                    </div>
                    <button 
                        onClick={handleAssign} 
                        disabled={loading}
                        className="bg-[#9E2F2B] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#8E2522] transition-colors whitespace-nowrap disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? 'Sending...' : <><Send size={16}/> Generate & Email</>}
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#1A1A1A]">Test History & Results</h2>
                {tests.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#F5F5F5] rounded-xl"><FileText size={24} className="text-[#9E2F2B]" /></div>
                            <div>
                                <div className="font-bold text-[#1A1A1A]">{t.employeeName}</div>
                                <div className="text-xs text-[#5A5A5A]">{t.scenario}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-mono font-bold text-[#1A1A1A] tracking-wider">{t.code}</div>
                                <div className="text-xs text-[#5A5A5A] font-bold uppercase tracking-widest">Access Code</div>
                            </div>

                            {t.status === 'completed' ? (
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-green-200">
                                    COMPLETED
                                </span>
                            ) : (
                                <span className="text-xs bg-[#FFEDD5] text-[#9A3412] px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-[#FFEDD5]">
                                    PENDING
                                </span>
                            )}
                            
                            <button onClick={() => handleDelete(t.id)} className="text-[#AAA] hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}