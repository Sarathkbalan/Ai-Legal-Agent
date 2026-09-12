import React from 'react';
import { Scale, ShieldCheck, FileText, User, Shield, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthStatus, stats, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="border-b border-[#161F30] bg-[#0B0F17]/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Heading */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E1F24] border border-[#1A3B3E] flex items-center justify-center shadow-lg shadow-[#2DD4BF]/10 text-[#2DD4BF]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  LawIntel
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0E1F24] border border-[#1A3B3E] text-[#2DD4BF] uppercase tracking-wider">
                  UK LEGAL AI
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block">
                UK Legal Research Agent  
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Exact Boxed / Stacked Design) */}
          <nav className="hidden md:flex items-center space-x-2">
            {/* Legal Research Chat */}
            <button
              type="button"
              onClick={() => setActiveTab('research')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-center transition flex flex-col justify-center items-center leading-tight ${
                activeTab === 'research'
                  ? 'bg-[#0E2328] border border-[#244E52] text-[#2DD4BF]'
                  : 'text-[#7B8CA3] hover:text-white hover:bg-[#121A2B] border border-transparent'
              }`}
            >
              {/* <span>Legal</span>
              <span>Research</span> */}
              <span>Chat</span>
            </button>

            {/* Document Vault & RAG Upload: Admin Space */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center transition flex items-center gap-1.5 leading-tight ${
                  activeTab === 'vault'
                    ? 'bg-[#0E2328] border border-[#244E52] text-[#2DD4BF]'
                    : 'text-[#7B8CA3] hover:text-white hover:bg-[#121A2B] border border-transparent'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>Document</span>
                  {/* <span>Vault &</span>
                  <span>RAG Upload</span> */}
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] uppercase tracking-wider ml-1">
                  ADMIN
                </span>
              </button>
            )}

            {/* Audit & Compliance: Admin Space */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-center transition flex flex-col justify-center items-center leading-tight ${
                  activeTab === 'audit'
                    ? 'bg-[#0E2328] border border-[#244E52] text-[#2DD4BF]'
                    : 'text-[#7B8CA3] hover:text-white hover:bg-[#121A2B] border border-transparent'
                }`}
              >
                <span>Audit &</span>
                <span>Compliance</span>
              </button>
            )}
          </nav>

          {/* Right Status Badges & User Profile */}
          <div className="flex items-center space-x-2.5 text-xs">
          

            {/* User Details Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1 bg-[#101726] border border-[#1E2638] rounded-xl text-xs shadow-inner">
              <div className="w-6 h-6 rounded-md bg-[#182236] border border-[#232F46] flex items-center justify-center text-[#2DD4BF]">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs leading-none">
                    {isAdmin ? 'Admin' : (currentUser?.name || 'Researcher')}
                  </span>
                  <span className="text-[9px] px-1 py-0 font-mono font-bold uppercase rounded bg-[#0D3836] text-[#2DD4BF] border border-[#134E4A]">
                    {currentUser?.role || (isAdmin ? 'Admin' : 'User')}
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] truncate max-w-[140px] mt-0.5">
                  {currentUser?.email || (isAdmin ? 'admin123@gmail.com' : 'user@lawintel.uk')}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101726] hover:bg-[#1E2638] border border-[#1E2638] text-[#94A3B8] hover:text-white transition text-xs font-semibold"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Rightmost User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-[#2DD4BF] text-[#071317] flex items-center justify-center font-bold text-xs shadow-md shrink-0">
              <User className="w-4 h-4 text-[#071317]" />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
