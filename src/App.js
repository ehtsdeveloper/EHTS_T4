/* global __initial_auth_token */
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase.js'; 
import { RoleSelectionScreen, LoginPage, RegisterCompanyPage } from './auth.js'; 
import AdminDashboard from './adminDash.js'; 
import EmployeeDashboard from './employeeDash.js'; 

// FIXED: Matching the filename to evaluatorDash.js
import EvaluatorDash from './evaluatorDash.js'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null); 
  const [isRegistering, setIsRegistering] = useState(false); 

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.__initial_auth_token) {
        try { await signInWithCustomToken(auth, window.__initial_auth_token); } catch(e) {}
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await checkUserRole(currentUser.uid, currentUser.email);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [selectedRole]);

  const checkUserRole = async (uid, email) => {
    setLoading(true);
    setError('');
    try {
      let foundDoc = null;

      // 1. Check Employees
      const empQ = query(collectionGroup(db, 'employees'), where('email', '==', email));
      const empSnap = await getDocs(empQ);

      if (!empSnap.empty) {
        foundDoc = empSnap.docs[0];
      } else {
        // 2. Check Evaluators (Searching the 'therapists' collection in Firestore)
        const evalQ = query(collectionGroup(db, 'therapists'), where('email', '==', email));
        const evalSnap = await getDocs(evalQ);
        if (!evalSnap.empty) {
            foundDoc = evalSnap.docs[0];
        }
      }

      if (foundDoc) {
        const data = foundDoc.data();
        
        // Normalize: If DB says 'therapist', treat as 'evaluator'
        const dbRole = data.role === 'therapist' ? 'evaluator' : data.role;

        if (selectedRole && selectedRole !== dbRole) {
          setError(`Access Denied: You are registered as an ${dbRole}.`);
          await signOut(auth);
          setLoading(false);
          return;
        }
        
        let companyId = "company_dept"; 
        if (foundDoc.ref.parent && foundDoc.ref.parent.parent) {
            companyId = foundDoc.ref.parent.parent.id;
        }

        setUser(auth.currentUser);
        setUserData({ id: foundDoc.id, ...data, companyId: companyId, role: dbRole });
      } else {
        if (email === 'admin@demo.com') {
             setUser(auth.currentUser);
             setUserData({ id: 'demo', role: 'admin', companyId: 'company_dept', fullName: 'Demo Admin', email: 'admin@demo.com' });
        } else {
             setError(`Account not found.`);
             await signOut(auth);
        }
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError("Login Error: Check internet or Firebase Indexes.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E5E5] border-t-[#9E2F2B]"></div>
        <div className="text-[#5A5A5A] font-medium">Authenticating...</div>
      </div>
    );
  }

  if (user && userData) {
    if (userData.role === 'admin') return <AdminDashboard user={userData} onLogout={() => { signOut(auth); setSelectedRole(null); }} />;
    if (userData.role === 'employee') return <EmployeeDashboard user={userData} onLogout={() => { signOut(auth); setSelectedRole(null); }} />;
    // Renders the EvaluatorDash component
    if (userData.role === 'evaluator') return <EvaluatorDash user={userData} onLogout={() => { signOut(auth); setSelectedRole(null); }} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      {isRegistering ? (
        <RegisterCompanyPage onBack={() => setIsRegistering(false)} />
      ) : !selectedRole ? (
        <RoleSelectionScreen 
          onSelect={role => setSelectedRole(role)} 
          onRegister={() => setIsRegistering(true)}
        />
      ) : (
        <LoginPage 
          role={selectedRole} 
          onBack={() => { setSelectedRole(null); setError(''); }} 
          onError={setError} 
          globalError={error} 
        />
      )}
    </div>
  );
}