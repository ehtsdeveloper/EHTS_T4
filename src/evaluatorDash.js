import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
 collection, query, where, onSnapshot, doc, updateDoc
} from 'firebase/firestore';
import {
 LayoutDashboard, Activity, Save, Search,
 User, Clock, CheckCircle, Menu, Edit3, ArrowLeft
} from "lucide-react";
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
   const companyId = user?.companyId || 'company1';
   
   if (!evalId) return;

   // Query matches your Firestore screenshot: therapistId and archived status
   const q = query(
     collection(db, 'companies', companyId, 'tests'),
     where('therapistId', '==', evalId),
     where('archived', '==', false)
   );

   const unsub = onSnapshot(q, (snapshot) => {
     const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
     setAssignedTests(docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
   }, (error) => {
     console.error("Firestore Error:", error);
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
     const companyId = user?.companyId || 'company1';
     const testRef = doc(db, 'companies', companyId, 'tests', selectedSubject.id);
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

 // Updated search to check email/name as per your screenshot fields
 const filteredTests = assignedTests.filter(t =>
   (t.employeeName || t.employeeEmail|| "").toLowerCase().includes(searchTerm.toLowerCase())
 );


 return (
   <div className="flex h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
     <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white border-r border-[#E5E5E5] flex flex-col transition-all duration-300 relative z-20`}>
       <div className="p-8">
         <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-4 overflow-hidden">
               <div className="min-w-[48px] h-12 bg-[#2B1F1F] rounded-2xl flex items-center justify-center text-[#C73A36] shadow-lg">
                 <Activity size={24} />
               </div>
               {isSidebarOpen && (
                 <div className="animate-in fade-in duration-500">
                   <div className="font-bold text-xl tracking-tighter">EHTS</div>
                   <div className="text-[11px] text-[#5A5A5A] font-bold uppercase tracking-widest leading-none">Bias Detector</div>
                 </div>
               )}
           </div>
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
             <Menu size={28} />
           </button>
         </div>
         <nav className="space-y-3">
           <NavItem icon={<LayoutDashboard size={22}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSelectedSubject(null);}} showLabel={isSidebarOpen} />
         </nav>
       </div>
     </aside>


     <div className="flex-1 flex flex-col overflow-hidden">
       <header className="h-20 bg-white border-b border-[#E5E5E5] px-10 flex justify-between items-center">
           <div>
             {selectedSubject && (
               <button onClick={() => {setSelectedSubject(null); setActiveTab('dashboard');}} className="flex items-center gap-2 text-gray-400 hover:text-[#1A1A1A] font-bold text-sm transition-all">
                 <ArrowLeft size={18}/> Back to Directory
               </button>
             )}
           </div>
           <div className="flex items-center gap-6">
             <div className="text-right">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Practitioner</p>
                 <p className="text-sm font-bold text-[#1A1A1A]">{user?.fullName || "Evaluator"}</p>
             </div>
             <button onClick={onLogout} className="text-xs font-bold text-[#5A5A5A] hover:text-[#9E2F2B] border border-[#E5E5E5] px-5 py-2.5 rounded-xl transition-all hover:bg-gray-50">Log Out</button>
           </div>
       </header>


       <main className="flex-1 overflow-y-auto p-12">
         {activeTab === 'dashboard' && !selectedSubject && (
           <div className="max-w-6xl space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <SummaryCard label="Total Subjects" value={assignedTests.length} icon={<User size={20}/>} color="#1A1A1A" />
               <SummaryCard label="Needs Review" value={assignedTests.filter(t => t.status !== 'Reviewed').length} icon={<Clock size={20}/>} color="#9E2F2B" />
               <SummaryCard label="Finalized" value={assignedTests.filter(t => t.status === 'Reviewed').length} icon={<CheckCircle size={20}/>} color="#10B981" />
             </div>


             <div className="bg-white rounded-[2rem] border border-[#E5E5E5] shadow-sm overflow-hidden">
               <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h3 className="font-bold text-xl">Recent Test Results</h3>
                 <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input
                     type="text" placeholder="Search recent subjects..."
                     className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#9E2F2B] text-sm"
                     value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </div>
               </div>
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.15em] border-b border-gray-100">
                     <th className="px-8 py-5">Subject</th>
                     <th className="px-8 py-5">Test Date</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {filteredTests.map((test) => (
                     <tr key={test.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors group">
                       <td className="px-8 py-5 font-bold">{test.employeeName || test.employeeEmail}</td>
                       <td className="px-8 py-5 text-gray-400">
                         {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'N/A'}
                       </td>
                       <td className="px-8 py-5">
                         <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${test.status === 'Reviewed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                           {test.status === 'Reviewed' ? 'Reviewed' : 'Pending'}
                         </span>
                       </td>
                       <td className="px-8 py-5 text-right">
                         <button onClick={() => handleOpenEditor(test)} className="bg-[#1A1A1A] text-white px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#9E2F2B]">Review</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}


         {selectedSubject && (
           <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
             <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center">
               <div>
                 <h2 className="text-5xl font-black tracking-tighter">{selectedSubject.employeeName || selectedSubject.employeeEmail}</h2>
                 <p className="text-[#9E2F2B] font-bold text-xs uppercase tracking-[0.2em] mt-2">{selectedSubject.scenario || 'Clinical Assessment'}</p>
               </div>
               <div className="flex flex-col items-end gap-3">
                 <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bias Index Score</p>
                   <p className="text-3xl font-black text-[#9E2F2B]">{selectedSubject.stressScore || '0'}%</p>
                 </div>
                 {!isEditing && (
                   <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-xs font-bold hover:bg-[#9E2F2B] transition-all shadow-lg">
                     <Edit3 size={16}/> Edit Evaluation
                   </button>
                 )}
               </div>
             </div>


             <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-12">
                 <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tighter">
                   <Activity className="text-[#9E2F2B]" size={20}/> Biometric Timeline
                 </h3>
                 <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
                   <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Heart Rate</span>
                   <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> Stress Score</span>
                 </div>
               </div>


               <div className="h-[450px] w-full mb-12">
  <ResponsiveContainer width="100%" height="100%">
    {/* Added margin to prevent axis labels from clipping */}
    <LineChart 
      data={selectedSubject.timeSeriesData || []} 
      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
      
      {/* XAxis: Added padding 0 to make the graph touch the sides */}
      <XAxis 
        dataKey="time" 
        hide 
        padding={{ left: 0, right: 0 }} 
      />
      
      {/* Left Axis (Heart Rate): domain 'auto' or 'dataMin/Max' makes it look "full" */}
      <YAxis 
        yAxisId="left" 
        stroke="#CCC" 
        fontSize={10} 
        domain={[0, 100]}
        ticks={[25, 50, 75, 100]}
        axisLine={false} 
        tickLine={false}
        tickFormatter={(value) => Math.round(value)}
      />

      {/* Right Axis (Stress Score): scaled to match the 0-10 range in your data */}
      <YAxis 
        yAxisId="right" 
        orientation="right" 
        stroke="#CCC" 
        fontSize={10} 
        domain={[0, 'auto']} 
        axisLine={false} 
        tickLine={false} 
      />

      <Tooltip 
        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
      />
      
      <Line 
        yAxisId="left" 
        type="monotone" 
        dataKey="heart_rate_0_to_200" 
        stroke="#ef4444" 
        strokeWidth={4} 
        dot={false}
        animationDuration={1500}
      />
      
      <Line 
        yAxisId="right" 
        type="monotone" 
        dataKey="stress_score_0_to_10" 
        stroke="#3b82f6" 
        strokeWidth={3} 
        dot={false}
        animationDuration={2000}
      />
    </LineChart>
  </ResponsiveContainer>
</div>


               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <AdminStatCard label="Baseline Mean HR" value={selectedSubject.baselineHR ? Math.round(selectedSubject.baselineHR) : '--'} unit="bpm" />
                 <AdminStatCard label="Baseline HR SD" value={selectedSubject.baselineHR_StdDev ? selectedSubject.baselineHR_StdDev.toFixed(2) : '--'} />
                 {/* FIXED: Using "finalHeartRate" to match your Firestore field */}
                 <AdminStatCard label="Final Mean HR" value={selectedSubject.finalHeartRate || '--'} unit="bpm" />
                 <AdminStatCard label="Active Samples Failed" value={selectedSubject.samplesFailed || '0/14'} color="text-red-500" />
               </div>
             </div>


             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                 <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Observation Notes</label>
                 <textarea
                   disabled={!isEditing}
                   className={`w-full p-6 min-h-[300px] outline-none text-base leading-relaxed transition-all rounded-3xl ${isEditing ? 'bg-gray-50 border-2 border-[#9E2F2B]/10 focus:border-[#9E2F2B] shadow-inner' : 'bg-transparent text-gray-500 italic'}`}
                   value={noteForm.evaluation}
                   onChange={(e) => setNoteForm({...noteForm, evaluation: e.target.value})}
                   placeholder="Waiting for evaluator's clinical observations..."
                 />
               </div>
               <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                 <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Recommendations</label>
                 <textarea
                   disabled={!isEditing}
                   className={`w-full p-6 min-h-[300px] outline-none text-base leading-relaxed transition-all rounded-3xl ${isEditing ? 'bg-gray-50 border-2 border-[#9E2F2B]/10 focus:border-[#9E2F2B] shadow-inner' : 'bg-transparent text-gray-500 italic'}`}
                   value={noteForm.recommendations}
                   onChange={(e) => setNoteForm({...noteForm, recommendations: e.target.value})}
                   placeholder="Document intervention steps or follow-up training..."
                 />
               </div>
             </div>


             {isEditing && (
               <div className="flex gap-5">
                 <button onClick={handleSaveNotes} disabled={loading} className="flex-1 py-6 bg-[#9E2F2B] text-white rounded-[2rem] font-bold uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#8E2522] transition-all flex items-center justify-center gap-3">
                   <Save size={20}/> {loading ? 'Saving...' : 'Save & Commit Evaluation'}
                 </button>
                 <button onClick={() => {setIsEditing(false); setNoteForm({evaluation: selectedSubject.therapistNotes || '', recommendations: selectedSubject.recommendations || ''});}} className="px-12 py-6 bg-gray-200 rounded-[2rem] font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-300 transition-all">Cancel</button>
               </div>
             )}
           </div>
         )}
       </main>
     </div>
   </div>
 );
}


function AdminStatCard({ label, value, unit = "", color = "text-[#1A1A1A]" }) {
 return (
   <div className="bg-[#F9F9F9] p-8 rounded-[2rem] border border-gray-50">
     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 leading-none">{label}</p>
     <p className={`text-4xl font-bold tracking-tighter ${color}`}>{value} <span className="text-sm font-normal text-gray-400">{unit}</span></p>
   </div>
 );
}


function NavItem({ icon, label, active, onClick, showLabel }) {
 return (
   <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all group ${active ? 'bg-[#9E2F2B] text-white shadow-xl shadow-red-900/20' : 'text-gray-400 hover:bg-gray-50 hover:text-[#9E2F2B]'}`}>
     <div className={`min-w-[24px] ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</div>
     {showLabel && <span className="whitespace-nowrap tracking-tight">{label}</span>}
   </button>
 );
}


function SummaryCard({ label, value, icon, color }) {
 return (
   <div className="bg-white p-8 rounded-[2rem] border border-[#E5E5E5] flex flex-col justify-between h-44 relative transition-all hover:shadow-xl group">
     <div className="flex items-center justify-between text-gray-300 group-hover:text-gray-400">
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
        <div style={{color: color}} className="opacity-80">{icon}</div>
     </div>
     <span className="text-5xl font-black tracking-tighter">{value}</span>
     <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-50 overflow-hidden rounded-b-[2rem]">
       <div className="h-full transition-all duration-1000" style={{backgroundColor: color, width: '100%'}}></div>
     </div>
   </div>
 );
}