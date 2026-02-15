import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { UserSquare, Trash2, Plus, X, Search, Edit3, ClipboardList } from "lucide-react";

export default function EvaluatorAdminDash({ user }) {
  const [evaluators, setEvaluators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEvaluatorNotes, setSelectedEvaluatorNotes] = useState(null);
  const [editingEvaluator, setEditingEvaluator] = useState(null);
  const [realNotes, setRealNotes] = useState([]);

  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    npi: '', 
    license: '', 
    specialty: '', 
    subjectNotes: '',
    role: 'evaluator' 
  });

  // Fetch all evaluators for this company
  useEffect(() => {
    if (!user?.companyId) return;
    const q = query(collection(db, 'companies', user.companyId, 'therapists')); // Note: Keep 'therapists' if that is your DB collection name
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvaluators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user.companyId]);

  // Fetch real notes for the selected evaluator
  useEffect(() => {
    if (!selectedEvaluatorNotes || !user?.companyId) return;
    const notesQ = query(collection(db, 'companies', user.companyId, 'therapists', selectedEvaluatorNotes.id, 'evaluations'));
    const unsub = onSnapshot(notesQ, (snapshot) => {
      setRealNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [selectedEvaluatorNotes, user?.companyId]);

  const filteredEvaluators = evaluators.filter(e => 
    e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.npi?.includes(searchTerm) ||
    e.license?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingEvaluator) {
        const evaluatorRef = doc(db, 'companies', user.companyId, 'therapists', editingEvaluator);
        const updatedData = {
          fullName: form.fullName || "",
          phone: form.phone || "",
          npi: form.npi || "",
          license: form.license || "",
          specialty: form.specialty || "",
          subjectNotes: form.subjectNotes || "",
          updatedAt: new Date().toISOString()
        };
        await updateDoc(evaluatorRef, updatedData);
        alert("Evaluator updated successfully!");
      } else {
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryEvaluator");
        const secondaryAuth = getAuth(secondaryApp);
        const tempPass = Math.random().toString(36).slice(-8) + "1!";
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, form.email, tempPass);
        try { await sendPasswordResetEmail(secondaryAuth, form.email); } catch (e) { console.warn("Email failed"); }
        const uid = userCred.user.uid;
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
        await setDoc(doc(db, 'companies', user.companyId, 'therapists', uid), { 
          ...form, role: 'evaluator', active: true, totalNotes: 0, createdAt: new Date().toISOString() 
        });
        alert("New evaluator registered!");
      }
      setOpen(false);
      setEditingEvaluator(null);
      setForm({ fullName: '', email: '', phone: '', npi: '', license: '', specialty: '', subjectNotes: '', role: 'evaluator' });
    } catch (err) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* 1. STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <div className="text-xs font-bold text-[#5A5A5A] uppercase">Total Evaluators</div>
          <div className="text-3xl font-bold text-[#1A1A1A] mt-1">{evaluators.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <div className="text-xs font-bold text-[#5A5A5A] uppercase">Active Evaluators</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{evaluators.filter(e => e.active).length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <div className="text-xs font-bold text-[#5A5A5A] uppercase">Total Notes</div>
          <div className="text-3xl font-bold text-[#9E2F2B] mt-1">
            {evaluators.reduce((acc, curr) => acc + (Number(curr.totalNotes) || 0), 0)}
          </div>
        </div>
      </div>

      {/* 2. SEARCH AND ADD */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Search Evaluators..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E5E5] outline-none focus:border-[#9E2F2B] bg-white"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingEvaluator(null); setForm({ fullName: '', email: '', phone: '', npi: '', license: '', specialty: '', subjectNotes: '', role: 'evaluator' }); setOpen(true); }} className="bg-[#9E2F2B] text-white rounded-lg px-6 py-2.5 font-bold flex items-center gap-2 hover:bg-[#8E2522]">
          <Plus size={20} /> Add New Evaluator
        </button>
      </div>

      {/* 3. EVALUATOR LIST */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvaluators.map((e) => (
          <div key={e.id} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F9F9F9] rounded-full flex items-center justify-center border border-[#E5E5E5]"><UserSquare className="text-[#9E2F2B]" size={24} /></div>
              <div>
                <h3 className="font-bold text-[#1A1A1A]">{e.fullName}</h3>
                <p className="text-xs text-[#9E2F2B] font-semibold">{e.specialty || "Unassigned"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 px-4 text-sm">
              <div><span className="block text-[10px] uppercase font-bold text-gray-400">NPI</span><span className="font-medium">{e.npi || 'N/A'}</span></div>
              <div><span className="block text-[10px] uppercase font-bold text-gray-400">License</span><span className="font-medium">{e.license || 'N/A'}</span></div>
              <div><span className="block text-[10px] uppercase font-bold text-gray-400">Activity</span><span className="font-medium">Notes: <span className="font-bold text-[#9E2F2B]">{e.totalNotes || 0}</span></span></div>
              <div><span className="block text-[10px] uppercase font-bold text-gray-400">Email</span><span className="font-medium truncate block w-32">{e.email}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedEvaluatorNotes(e)} className="px-3 py-2 bg-[#F5F5F5] text-[#1A1A1A] rounded-lg text-xs font-bold hover:bg-[#E5E5E5] flex items-center gap-2"><ClipboardList size={14} /> View Notes</button>
              <button onClick={() => { setForm(e); setEditingEvaluator(e.id); setOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit3 size={18} /></button>
              <button onClick={async () => { if (window.confirm(`Delete ${e.fullName}?`)) { try { await deleteDoc(doc(db, 'companies', user.companyId, 'therapists', e.id)); } catch (err) { alert(err.message); } } }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* SESSION NOTES MODAL */}
      {selectedEvaluatorNotes && (
        <div className="fixed inset-0 bg-white z-[100] overflow-y-auto flex flex-col animate-in fade-in duration-200">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md">
            <button onClick={() => setSelectedEvaluatorNotes(null)} className="flex items-center gap-2 text-[#9E2F2B] font-bold hover:opacity-70"><X size={20}/> Back to Evaluators</button>
            <div className="text-right">
              <h2 className="text-xl font-bold text-[#1A1A1A]">{selectedEvaluatorNotes.fullName}</h2>
              <p className="text-xs text-gray-500">NPI: {selectedEvaluatorNotes.npi || 'N/A'} • License: {selectedEvaluatorNotes.license || 'N/A'}</p>
            </div>
          </div>
          <div className="max-w-4xl mx-auto w-full p-8">
            <div className="flex justify-between items-end mb-8 border-b-2 border-[#9E2F2B] pb-2">
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Subject Evaluation Notes</h3>
              <span className="text-sm font-bold text-gray-400">{realNotes.length} Records Found</span>            
            </div>
            <div className="space-y-12">
              {realNotes.length === 0 ? (
                <div className="text-center py-20 text-gray-400 italic font-medium">No real evaluation records found in the database for this evaluator.</div>
              ) : (
                realNotes.map((note) => (
                  <div key={note.id} className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-gray-100">
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg text-[#1A1A1A]">{note.subjectName || 'Unknown Subject'}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">ID: {note.subjectId || 'N/A'}</p>
                      <p className="text-sm font-bold text-[#9E2F2B]">Bias Score: {note.biasScore}/10</p>
                      <div className="pt-4 text-[10px] text-gray-400 leading-tight font-medium">Test Date: {note.date || 'N/A'}</div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <div><h5 className="text-xs font-bold uppercase text-gray-400 mb-1">Evaluation</h5><p className="text-sm text-gray-700 leading-relaxed">{note.evaluationText || 'No evaluation provided.'}</p></div>
                      <div><h5 className="text-xs font-bold uppercase text-gray-400 mb-1">Recommendations</h5><p className="text-sm text-gray-700 leading-relaxed font-medium">{note.recommendations || 'No recommendations provided.'}</p></div>
                      <p className="text-[10px] text-gray-400 italic">Evaluated by {selectedEvaluatorNotes.fullName} • NPI: {selectedEvaluatorNotes.npi}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#9E2F2B] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingEvaluator ? 'Edit Evaluator Details' : 'Register New Evaluator'}</h2>
              <button onClick={() => { setOpen(false); setEditingEvaluator(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">Full Name</span><input className="w-full mt-1 p-3 rounded-xl border border-gray-200 bg-gray-50" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required /></label>
                <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">Email Address</span><input className={`w-full mt-1 p-3 rounded-xl border border-gray-200 ${editingEvaluator ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50'}`} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={editingEvaluator} /></label>
                <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">Phone Number</span><input className="w-full mt-1 p-3 rounded-xl border border-gray-200 bg-gray-50" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></label>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">NPI Number</span><input className="w-full mt-1 p-3 rounded-xl border border-gray-200 bg-gray-50" value={form.npi} onChange={e => setForm({...form, npi: e.target.value})} /></label>
                  <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">License #</span><input className="w-full mt-1 p-3 rounded-xl border border-gray-200 bg-gray-50" value={form.license} onChange={e => setForm({...form, license: e.target.value})} /></label>
                </div>
                <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">Specialty</span><select className="w-full mt-1 p-3 rounded-xl border border-gray-200 bg-gray-50" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}><option value="">Select Specialty</option><option value="Clinical Psychology">Clinical Psychology</option><option value="Behavioral Analysis">Behavioral Analysis</option><option value="Organizationall Psychology">Organizationall Psychology</option><option value="Cognitive Psychology">Cognitive Psychology</option><option value="Social Psychology">Social Psychology</option></select></label>
                <label className="block"><span className="text-xs font-bold text-gray-500 uppercase">Subject Notes</span><textarea className="w-full mt-1 p-3 rounded-xl border border-gray-200 bg-gray-50 h-20" value={form.subjectNotes} onChange={e => setForm({...form, subjectNotes: e.target.value})} /></label>
              </div>
              <div className="md:col-span-2 pt-4"><button type="submit" disabled={loading} className="w-full p-4 bg-[#9E2F2B] text-white rounded-xl font-bold hover:bg-[#8E2522] transition-all shadow-lg">{loading ? 'Processing...' : (editingEvaluator ? 'Update Evaluator' : 'Register Evaluator')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

