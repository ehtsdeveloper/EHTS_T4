import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, query, where, onSnapshot, doc, updateDoc 
} from 'firebase/firestore';
import { 
  LayoutDashboard, ClipboardList, Activity, Save, Search, 
  User, Clock, CheckCircle, Menu, BookOpen, Edit3, ArrowLeft, TrendingUp
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

export default function EvaluatorDash({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignedTests, setAssignedTests] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [noteForm, setNoteForm] = useState({ evaluation: '', recommendations: '' });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const evalId = user?.id || user?.uid;
    if (!evalId || !user?.companyId) return;

    const q = query(
      collection(db, 'companies', user.companyId, 'tests'),
      where('therapistId', '==', evalId),
      where('archived', '==', false)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAssignedTests(docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
    return unsub;
  }, [user]);

  const handleOpenEditor = (test) => {
    setSelectedSubject(test);
    setNoteForm({
      evaluation: test.therapistNotes || '',
      recommendations: test.recommendations || ''
    });
    setIsEditing(!test.therapistNotes || test.therapistNotes.trim() === "");
    setActiveTab('results');
  };

  const handleSaveNotes = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const testRef = doc(db, 'companies', user.companyId, 'tests', selectedSubject.id);
      await updateDoc(testRef, {
        therapistNotes: noteForm.evaluation,
        recommendations: noteForm.recommendations,
        status: 'Reviewed',
        reviewedAt: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = assignedTests.filter(t => 
    t.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white border-r border-[#E5E5E5] flex flex-col transition-all duration-300 relative z-20`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4 overflow-hidden">
                <div className="min-w-[48px] h-12 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-[#9E2F2B] shadow-xl">
                  <Activity size={24} />
                </div>
                {isSidebarOpen && (
                  <div className="animate-in fade-in duration-500">
                    <div className="font-black text-xl tracking-tighter italic">EHTS</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none">Evaluator</div>
                  </div>
                )}
            </div>
          </div>
          <nav className="space-y-3">
            <NavItem icon={<LayoutDashboard size={22}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSelectedSubject(null);}} showLabel={isSidebarOpen} />
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-[#E5E5E5] px-10 flex justify-between items-center">
            <div>
              {selectedSubject && (
                <button onClick={() => {setSelectedSubject(null); setActiveTab('dashboard');}} className="flex items-center gap-2 text-gray-400 hover:text-[#9E2F2B] font-bold text-sm transition-all group">
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Back to Dashboard
                </button>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Authenticated Evaluator</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{user.fullName}</p>
              </div>
              <button onClick={onLogout} className="text-xs font-black text-white bg-[#1A1A1A] px-6 py-3 rounded-xl transition-all hover:bg-[#9E2F2B] uppercase tracking-widest shadow-lg shadow-black/5">Log Out</button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12">
          {activeTab === 'dashboard' && !selectedSubject && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SummaryCard label="Total Subjects" value={assignedTests.length} icon={<User size={20}/>} color="#1A1A1A" />
                <SummaryCard label="Needs Review" value={assignedTests.filter(t => t.status !== 'Reviewed').length} icon={<Clock size={20}/>} color="#9E2F2B" />
                <SummaryCard label="Finalized" value={assignedTests.filter(t => t.status === 'Reviewed').length} icon={<CheckCircle size={20}/>} color="#10B981" />
              </div>

              <div className="bg-white rounded-[2.5rem] border border-[#E5E5E5] shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-black text-2xl tracking-tight">Clinical Test Directory</h3>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      type="text" placeholder="Search by subject name..." 
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#9E2F2B]/20 focus:ring-4 focus:ring-[#9E2F2B]/5 transition-all text-sm"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] uppercase font-black text-gray-400 tracking-[0.2em] border-b border-gray-100">
                      <th className="px-10 py-6">Subject Name</th>
                      <th className="px-10 py-6">Session Date</th>
                      <th className="px-10 py-6">Session Status</th>
                      <th className="px-10 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredTests.map((test) => (
                      <tr key={test.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                        <td className="px-10 py-6 font-bold text-lg tracking-tight">{test.employeeName}</td>
                        <td className="px-10 py-6 text-gray-400 font-medium">{new Date(test.createdAt).toLocaleDateString()}</td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${test.status === 'Reviewed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {test.status === 'Reviewed' ? 'Reviewed' : 'Awaiting Review'}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button onClick={() => handleOpenEditor(test)} className="bg-[#1A1A1A] text-white px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#9E2F2B] shadow-lg shadow-black/5 transition-all active:scale-95">Open Results</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedSubject && (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
              
              {/* TOP HEADER & BIAS INDEX CARD (Same as Admin) */}
              <div className="flex flex-col md:flex-row gap-8 items-stretch">
                <div className="flex-1 bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                  <h2 className="text-6xl font-black tracking-tighter mb-2">{selectedSubject.employeeName}</h2>
                  <div className="flex items-center gap-3 text-[#9E2F2B] font-black text-sm uppercase tracking-[0.3em]">
                    <TrendingUp size={18}/> {selectedSubject.scenario}
                  </div>
                </div>
                
                <div className="w-full md:w-96 bg-[#1A1A1A] p-12 rounded-[3rem] shadow-2xl flex flex-col justify-center relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Bias Index Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-7xl font-black text-white tracking-tighter">{selectedSubject.stressScore || '0'}</span>
                      <span className="text-2xl font-black text-[#9E2F2B]">%</span>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Activity size={180} className="text-white"/>
                  </div>
                </div>
              </div>

              {/* BIOMETRIC TIMELINE FULL GRAPH */}
              <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter">
                    <div className="w-1.5 h-8 bg-[#9E2F2B] rounded-full"></div>
                    Biometric Timeline Analysis
                  </h3>
                  <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-lg shadow-red-500/20"></span> Heart Rate</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-lg shadow-blue-500/20"></span> Stress Score</span>
                  </div>
                </div>

                <div className="h-[500px] w-full mb-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedSubject.timeSeriesData || []}>
                      <defs>
                        <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="time" hide />
                      <YAxis yAxisId="left" stroke="#CCC" fontSize={10} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                      <YAxis yAxisId="right" orientation="right" stroke="#CCC" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="heart_rate" stroke="#ef4444" fill="url(#colorHR)" strokeWidth={4} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="stressScore" stroke="#3b82f6" strokeWidth={4} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* STAT CARDS - EXACT ADMIN LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <AdminStatCard label="Baseline Mean HR" value={selectedSubject.baselineMeanHR || '--'} unit="bpm" />
                  <AdminStatCard label="Baseline HR SD" value={selectedSubject.baselineHRSD || '--'} />
                  <AdminStatCard label="Final Mean HR" value={selectedSubject.finalMeanHR || '--'} unit="bpm" />
                  <AdminStatCard label="Samples Failed" value={selectedSubject.samplesFailed || '0/14'} color="text-red-500" />
                </div>
              </div>

              {/* EVALUATION SECTION (Where they can put evaluations and edit) */}
              <div className="flex justify-between items-center mb-6 px-4">
                 <h4 className="font-black text-xl uppercase tracking-tighter">Clinical Evaluation Documentation</h4>
                 {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-xs font-bold hover:bg-[#9E2F2B] transition-all shadow-xl shadow-black/10">
                      <Edit3 size={16}/> Edit Evaluation
                    </button>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                  <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1">Evaluator Observations</label>
                  <textarea 
                    disabled={!isEditing}
                    className={`w-full p-0 min-h-[300px] outline-none text-lg leading-relaxed transition-all resize-none bg-transparent ${isEditing ? 'text-[#1A1A1A] placeholder-gray-200' : 'text-gray-400 font-medium'}`}
                    value={noteForm.evaluation}
                    onChange={(e) => setNoteForm({...noteForm, evaluation: e.target.value})}
                    placeholder="Document subject physiological responses and behavioral markers..."
                  />
                </div>
                <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                  <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1">Clinical Recommendations</label>
                  <textarea 
                    disabled={!isEditing}
                    className={`w-full p-0 min-h-[300px] outline-none text-lg leading-relaxed transition-all resize-none bg-transparent ${isEditing ? 'text-[#1A1A1A] placeholder-gray-200' : 'text-gray-400 font-medium'}`}
                    value={noteForm.recommendations}
                    onChange={(e) => setNoteForm({...noteForm, recommendations: e.target.value})}
                    placeholder="Document recommended training protocols or bias mitigation steps..."
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-6 animate-in slide-in-from-bottom-8 duration-500">
                  <button onClick={handleSaveNotes} disabled={loading} className="flex-1 py-8 bg-[#9E2F2B] text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-red-900/20 hover:bg-[#8E2522] transition-all flex items-center justify-center gap-4">
                    <Save size={24}/> {loading ? 'Saving to Cloud...' : 'Commit Clinical Record'}
                  </button>
                  <button onClick={() => {setIsEditing(false); setNoteForm({evaluation: selectedSubject.therapistNotes || '', recommendations: selectedSubject.recommendations || ''});}} className="px-14 py-8 bg-gray-100 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-200 transition-all">Cancel</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// COMPONENT: ADMIN-STYLE STAT CARD
function AdminStatCard({ label, value, unit = "", color = "text-[#1A1A1A]" }) {
  return (
    <div className="bg-[#F8F9FA] p-10 rounded-[2.5rem] border border-gray-50 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/[0.02] group">
      <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] mb-4 group-hover:text-gray-400 transition-colors">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black tracking-tighter ${color}`}>{value}</span>
        <span className="text-xs font-bold text-gray-300 uppercase">{unit}</span>
      </div>
    </div>
  );
}

// COMPONENT: NAV ITEM
function NavItem({ icon, label, active, onClick, showLabel }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] font-black text-xs transition-all group uppercase tracking-widest ${active ? 'bg-[#1A1A1A] text-white shadow-2xl shadow-black/20' : 'text-gray-300 hover:bg-gray-50 hover:text-[#1A1A1A]'}`}>
      <div className={`min-w-[24px] ${active ? 'scale-110 text-[#9E2F2B]' : 'group-hover:scale-110'} transition-transform`}>{icon}</div>
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

// COMPONENT: SUMMARY CARD
function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-[#E5E5E5] flex flex-col justify-between h-48 relative transition-all hover:shadow-2xl hover:-translate-y-1 group">
      <div className="flex items-center justify-between text-gray-200 group-hover:text-gray-300">
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</p>
         <div style={{color: color}} className="opacity-50">{icon}</div>
      </div>
      <span className="text-6xl font-black tracking-tighter italic">{value}</span>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-50 overflow-hidden rounded-b-[2.5rem]">
        <div className="h-full transition-all duration-1000" style={{backgroundColor: color, width: '40%'}}></div>
      </div>
    </div>
  );
}