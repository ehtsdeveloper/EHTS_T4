import React from 'react';
import { Activity, LogOut, User, ClipboardList, Users } from 'lucide-react';

export default function EvaluatorDash({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
      <header className="px-8 py-4 border-b border-[#E5E5E5] bg-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2B1F1F] rounded-xl flex items-center justify-center text-[#C73A36]">
                <Activity size={20} />
            </div>
            <div>
                <h1 className="font-bold text-[#1A1A1A] leading-none">Evaluator Portal</h1>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clinical Dashboard</span>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right border-r pr-6 border-gray-100">
                <div className="text-sm font-bold text-[#1A1A1A]">{user?.fullName || 'Evaluator'}</div>
                <div className="text-[10px] text-[#9E2F2B] uppercase font-bold">{user?.specialty || 'Clinical Professional'}</div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 hover:text-[#9E2F2B] font-bold text-xs transition-colors">
                <LogOut size={18} /> Logout
            </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="bg-[#9E2F2B] rounded-3xl p-8 text-white flex justify-between items-center shadow-xl shadow-red-100">
            <div>
                <h2 className="text-3xl font-bold">
                    Welcome back, {user?.fullName ? user.fullName.split(' ')[0] : 'Evaluator'}
                </h2>
                <p className="opacity-80 mt-2 font-medium">You have 0 pending evaluations for this week.</p>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center">
                <User size={40} />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned Employees Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-not-allowed opacity-60">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Assigned Employees</h3>
                <p className="text-sm text-gray-500 mt-1">View bias test results for employees assigned to your care.</p>
            </div>

            {/* Evaluation Records Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-not-allowed opacity-60">
                <div className="w-12 h-12 bg-red-50 text-[#9E2F2B] rounded-xl flex items-center justify-center mb-4">
                    <ClipboardList size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Evaluation Records</h3>
                <p className="text-sm text-gray-500 mt-1">Review and manage your clinical subject notes and history.</p>
            </div>
        </div>
      </main>
    </div>
  );
}