import React, { useState, useEffect, useRef } from 'react';
import { db, firebaseConfig, storage } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserSquare, Trash2, Plus, X, Search, Edit3, ClipboardList, Camera, UploadCloud } from "lucide-react";

export default function EvaluatorAdminDash({ user, allTests = [] }) {  const [evaluators, setEvaluators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEvaluatorNotes, setSelectedEvaluatorNotes] = useState(null);
  const [editingEvaluator, setEditingEvaluator] = useState(null);
  const [realNotes, setRealNotes] = useState([]);
  
  // Photo State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    npi: '', 
    license: '', 
    specialty: '', 
    role: 'evaluator' 
  });

  useEffect(() => {
    if (!user?.companyId) return;
    const q = query(collection(db, 'companies', user.companyId, 'therapists'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvaluators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user.companyId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalPhotoUrl = editingEvaluator ? (evaluators.find(ev => ev.id === editingEvaluator)?.photoURL || '') : '';

      if (editingEvaluator) {
        if (photoFile) {
          const storageRef = ref(storage, `companies/${user.companyId}/evaluatorPhotos/${editingEvaluator}`);
          await uploadBytes(storageRef, photoFile);
          finalPhotoUrl = await getDownloadURL(storageRef);
        }

        const evaluatorRef = doc(db, 'companies', user.companyId, 'therapists', editingEvaluator);
        await updateDoc(evaluatorRef, {
          ...form,
          photoURL: finalPhotoUrl,
          updatedAt: new Date().toISOString()
        });
        alert("Evaluator updated successfully!");
      } else {
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryEvaluator");
        const secondaryAuth = getAuth(secondaryApp);
        const tempPass = Math.random().toString(36).slice(-8) + "1!";
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, form.email, tempPass);
        const uid = userCred.user.uid;

        if (photoFile) {
          const storageRef = ref(storage, `companies/${user.companyId}/evaluatorPhotos/${uid}`);
          await uploadBytes(storageRef, photoFile);
          finalPhotoUrl = await getDownloadURL(storageRef);
        }

        try { await sendPasswordResetEmail(secondaryAuth, form.email); } catch (e) { console.warn("Email failed"); }
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        await setDoc(doc(db, 'companies', user.companyId, 'therapists', uid), { 
          ...form, 
          photoURL: finalPhotoUrl,
          role: 'evaluator', 
          active: true, 
          createdAt: new Date().toISOString() 
        });
        alert("New evaluator registered!");
      }
      resetModal();
    } catch (err) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  const resetModal = () => {
    setOpen(false);
    setEditingEvaluator(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setForm({ fullName: '', email: '', phone: '', npi: '', license: '', specialty: '', subjectNotes: '', role: 'evaluator' });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Evaluators" value={evaluators.length} />
        <StatCard label="Active Evaluators" value={evaluators.filter(e => e.active).length} color="text-green-600" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Search Evaluators..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E5E5] outline-none focus:border-[#9E2F2B] bg-white"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingEvaluator(null); setOpen(true); }} className="bg-[#9E2F2B] text-white rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 hover:bg-[#8E2522] transition-all">
          <Plus size={20} /> Add New Evaluator
        </button>
      </div>

<div className="grid grid-cols-1 gap-4">
  {evaluators.filter(e => e.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map((e) => (
    <div key={e.id} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center gap-4 min-w-[200px]">
        {e.photoURL ? (
          <img src={e.photoURL} alt={e.fullName} className="w-12 h-12 rounded-full object-cover border border-[#E5E5E5]" />
        ) : (
          <div className="w-12 h-12 bg-[#F9F9F9] rounded-full flex items-center justify-center border border-[#E5E5E5]"><UserSquare className="text-[#9E2F2B]" size={24} /></div>
        )}
        <div>
          <h3 className="font-bold text-[#1A1A1A]">{e.fullName}</h3>
          <p className="text-xs text-[#9E2F2B] font-semibold">{e.specialty || "Generalist"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 px-4 text-sm">
        <ListInfo label="NPI" value={e.npi} />
        <ListInfo label="License" value={e.license} />
        <ListInfo label="Email" value={e.email} isEmail />
      </div>

      <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
        <button 
          onClick={() => { setForm(e); setEditingEvaluator(e.id); setPhotoPreview(e.photoURL); setOpen(true); }} 
          className="p-2 text-gray-400 hover:text-[#9E2F2B] hover:bg-red-50 rounded-full transition-all"
        >
          <Edit3 size={18} />
        </button>
        <button 
          onClick={async () => { if (window.confirm(`Delete ${e.fullName}?`)) { try { await deleteDoc(doc(db, 'companies', user.companyId, 'therapists', e.id)); } catch (err) { alert(err.message); } } }} 
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  ))}
</div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#9E2F2B] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight">{editingEvaluator ? 'Edit Profile' : 'Register New Evaluator'}</h2>
              <button onClick={resetModal} className="hover:bg-white/20 p-1 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-[#9E2F2B] transition-all cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-gray-300 group-hover:text-[#9E2F2B] transition-colors" size={32} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold uppercase transition-opacity">Change</div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" value={form.fullName} onChange={v => setForm({...form, fullName: v})} required />
                <Input label="Email Address" value={form.email} onChange={v => setForm({...form, email: v})} required type="email" disabled={editingEvaluator} />
                <Input label="Phone Number" value={form.phone} onChange={v => setForm({...form, phone: v})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="NPI Number" value={form.npi} onChange={v => setForm({...form, npi: v})} />
                  <Input label="License #" value={form.license} onChange={v => setForm({...form, license: v})} />
                </div>

                <Input label="Specialty" value={form.specialty} onChange={v => setForm({...form, specialty: v})} placeholder="e.g. Behavioral Science" required />
                
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Notes</label>
                  <textarea 
                    className="w-full mt-2 p-4 rounded-2xl border border-gray-200 bg-gray-50 h-24 outline-none focus:border-[#9E2F2B] transition-all text-sm"
                    value={form.subjectNotes}
                    onChange={e => setForm({...form, subjectNotes: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-[#9E2F2B] text-white rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-[#8E2522] transition-all disabled:opacity-50">
                {loading ? 'Saving to Database...' : (editingEvaluator ? 'Update Evaluator' : 'Register Evaluator')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "text-[#1A1A1A]" }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function ListInfo({ label, value, isEmail = false }) {
  return (
    <div>
      <span className="block text-[10px] uppercase font-black text-gray-400 tracking-wider">{label}</span>
      <span className={`font-medium ${isEmail ? 'truncate block w-32' : ''}`}>{value || 'N/A'}</span>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false, disabled = false, placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type} required={required} disabled={disabled} placeholder={placeholder}
        className={`w-full px-5 py-3 rounded-2xl border border-gray-200 outline-none focus:border-[#9E2F2B] text-sm transition-all ${disabled ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-gray-50'}`}
        value={value} onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}