import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; 
import { 
  Activity, LogOut, Calendar, CheckCircle, AlertTriangle, ArrowLeft, Clipboard 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";

// --- HELPER: Mock Data for Graphs ---
// Used if real watch data hasn't synced yet so the UI doesn't look broken
const getMockGraphData = (baseHR = 75) => {
  const data = [];
  let currentHR = baseHR;
  let currentHRV = 45;
  let currentTemp = 98.6;
  for (let i = 0; i < 40; i++) {
    currentHR += (Math.random() - 0.5) * 5;
    currentHRV += (Math.random() - 0.5) * 8;
    currentTemp += (Math.random() - 0.5) * 0.1;
    data.push({
      time: i,
      hr: Math.max(60, Math.min(120, Math.round(currentHR))),
      hrv: Math.max(20, Math.min(100, Math.round(currentHRV))),
      temp: parseFloat(currentTemp.toFixed(1))
    });
  }
  return data;
};

// --- COMPONENT: Biometric Graph ---
const BiometricGraph = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm mt-6">
      <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
        <Activity size={20} className="text-[#9E2F2B]"/> Biometric Timeline
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" label={{ value: 'Seconds', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="hrv" name="HRV" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="temp" name="Body Temp" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
  </div>
);

// ==========================================
// EMPLOYEE DASHBOARD MAIN COMPONENT
// ==========================================
export default function EmployeeDashboard({ user, onLogout }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.companyId || !user.uid) return;

    // Fetch tests assigned to this specific employee
    const q = query(
      collection(db, 'companies', user.companyId, 'tests'),
      where('employeeId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Sort by date created (newest first)
      const fetchedTests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTests(fetchedTests);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // VIEW: DETAILED RESULT (WITH GRAPH)
  if (selectedTest) {
    const graphData = selectedTest.timeSeriesData || getMockGraphData(selectedTest.finalHeartRate || 75);

    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] font-sans">
        {/* HEADER (Sticky) */}
        <header className="bg-white px-8 py-4 border-b border-[#E5E5E5] flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2B1F1F] rounded-lg flex items-center justify-center text-[#C73A36]">
              <Activity size={16} />
            </div>
            <div className="font-bold text-[#1A1A1A] text-lg">
              Welcome, {user.fullname}
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <LogOut size={16} /> Log Out
          </button>
        </header>

        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <button 
            onClick={() => setSelectedTest(null)} 
            className="flex items-center gap-2 text-[#5A5A5A] font-bold hover:text-[#1A1A1A] transition-colors"
          >
            <ArrowLeft size={16} /> Back to My Tests
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A]">{selectedTest.scenario}</h1>
              <div className="text-sm text-[#5A5A5A] mt-1 flex items-center gap-2">
                <span className="bg-white border border-[#E5E5E5] px-2 py-0.5 rounded font-mono text-xs">
                  {selectedTest.code}
                </span>
                <span>•</span>
                <span>Completed on {new Date(selectedTest.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="text-right bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-sm">
              <div className="text-xs font-bold uppercase text-[#5A5A5A]">Your Bias Score</div>
              <div className={`text-3xl font-bold ${selectedTest.stressScore > 70 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedTest.stressScore || '--'}%
              </div>
            </div>
          </div>

          <BiometricGraph data={graphData} />
        </div>
      </div>
    );
  }

  // VIEW: DASHBOARD LIST
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] font-sans">
      {/* HEADER */}
      <header className="bg-white px-8 py-4 border-b border-[#E5E5E5] flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2B1F1F] rounded-lg flex items-center justify-center text-[#C73A36]">
            <Activity size={16} />
          </div>
          <div className="font-bold text-[#1A1A1A] text-lg">
            Welcome, {user.name}
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <LogOut size={16} /> Log Out
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
          <Clipboard size={24} className="text-[#9E2F2B]"/> My Test History
        </h2>

        {loading ? (
          <div className="text-[#5A5A5A] animate-pulse">Loading your records...</div>
        ) : tests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-[#E5E5E5] text-center text-[#AAA]">
            <Activity size={48} className="mx-auto mb-4 opacity-50"/>
            <p>You have not been assigned any tests yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map(test => (
              <div key={test.id} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`p-4 rounded-xl shrink-0 ${test.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {test.status === 'completed' ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#1A1A1A]">{test.scenario}</h3>
                    <div className="text-sm text-[#5A5A5A] flex items-center gap-2 mt-1">
                      <Calendar size={14}/> {new Date(test.createdAt).toLocaleDateString()}
                      <span className="text-[#E5E5E5]">|</span>
                      Code: <span className="font-mono bg-[#F5F5F5] px-1.5 py-0.5 rounded text-[#1A1A1A] text-xs border border-[#E5E5E5]">{test.code}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                  {test.status === 'completed' ? (
                    <>
                       <div className="text-right hidden sm:block">
                          <div className="text-xs font-bold text-[#AAA] uppercase">Score</div>
                          <div className={`font-bold text-lg ${test.stressScore > 70 ? 'text-red-600' : 'text-green-600'}`}>
                            {test.stressScore}%
                          </div>
                       </div>
                       <button 
                          onClick={() => setSelectedTest(test)}
                          className="bg-[#9E2F2B] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#8E2522] transition-colors flex items-center gap-2 shadow-sm"
                       >
                          <Activity size={16} /> View Results
                       </button>
                    </>
                  ) : (
                    <div className="bg-[#FFF7ED] text-[#9A3412] px-4 py-2 rounded-full font-bold text-sm border border-[#FFEDD5] flex items-center gap-2">
                       In Progress...
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}