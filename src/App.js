/* global __initial_auth_token */
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import { RoleSelectionScreen, LoginPage, RegisterCompanyPage } from './auth.js'; // Importing from Auth.js
import AdminDashboard from './adminDash'; // Importing from adminDash.js
import EmployeeDashboard from './employeeDash'; // Importing from employeeDash.js

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
      let q = query(collectionGroup(db, 'employees'), where('email', '==', email));
      let querySnapshot = await getDocs(q);
      let foundDoc = null;

      if (!querySnapshot.empty) {
        foundDoc = querySnapshot.docs[0];
      } else {
        // Fallback for legacy
        q = query(collectionGroup(db, 'employees'), where('email', '==', email)); 
        let legacySnap = await getDocs(q);
        if(!legacySnap.empty) foundDoc = legacySnap.docs[0];
      }

      if (foundDoc) {
        const data = foundDoc.data();
        if (selectedRole && data.role !== selectedRole) {
          setError(`Access Denied: You cannot log in as ${selectedRole}.`);
          await signOut(auth);
          setLoading(false);
          return;
        }
        
        let companyId = "company_dept"; 
        if (foundDoc.ref.parent.parent) {
            companyId = foundDoc.ref.parent.parent.id;
        }

        setUser(auth.currentUser);
        setUserData({ id: foundDoc.id, ...data, companyId: companyId });
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
      console.error(err);
      setError("Login Error: " + err.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E5E5] border-t-[#9E2F2B]"></div>
        <div className="text-[#5A5A5A] font-medium">Verifying Credentials...</div>
      </div>
    );
  }

  if (user && userData) {
    if (userData.role === 'admin') return <AdminDashboard user={userData} onLogout={() => { signOut(auth); setSelectedRole(null); }} />;
    if (userData.role === 'employee') return <EmployeeDashboard user={userData} onLogout={() => { signOut(auth); setSelectedRole(null); }} />;
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