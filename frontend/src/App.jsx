import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import ResearchWorkbench from './components/research/ResearchWorkbench';
import FileDropzone from './components/upload/FileDropzone';
import DocumentTable from './components/documents/DocumentTable';
import AuditView from './components/audit/AuditView';
import AuthPage from './components/auth/AuthPage';
import { fetchDocuments, deleteDocument } from './services/documentService';
import { fetchSystemStats, checkHealth } from './services/auditService';
import { authService } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [activeTab, setActiveTab] = useState(() => {
    const user = authService.getStoredUser();
    return user?.role === 'admin' ? 'vault' : 'research';
  });
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user?.role === 'admin') {
      setActiveTab('vault'); // Admin space: Document Vault where all uploaded files are seen & RAG upload
    } else {
      setActiveTab('research'); // User space: Chat Interface only
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Enforce Space Boundary: regular users cannot access vault or audit
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && activeTab !== 'research') {
      setActiveTab('research');
    }
  }, [currentUser, activeTab]);

  const loadVaultData = async () => {
    setLoadingDocs(true);
    try {
      const [docsRes, statsRes, healthRes] = await Promise.all([
        fetchDocuments({ limit: 100 }),
        fetchSystemStats().catch(() => ({ data: null })),
        checkHealth().catch(() => ({ services: {} }))
      ]);

      setDocuments(docsRes.data || []);
      if (statsRes?.data) setStats(statsRes.data);
      if (healthRes) setHealthStatus(healthRes);
    } catch (err) {
      console.error('Error loading vault data:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadVaultData();
    // Poll health status periodically
    const timer = setInterval(() => {
      checkHealth().then(setHealthStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async (id) => {
    if (currentUser?.role !== 'admin') {
      alert('Access denied: Administrator privileges are required to delete documents.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this document from MongoDB and purge vectors from Qdrant?')) {
      return;
    }
    try {
      await deleteDocument(id);
      await loadVaultData();
    } catch (err) {
      alert(err.error?.message || 'Failed to delete document');
    }
  };

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col font-sans selection:bg-[#2DD4BF]/20">
      
      {/* Header / Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
        stats={stats}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {activeTab === 'research' && (
          <ResearchWorkbench />
        )}

        {activeTab === 'vault' && currentUser?.role === 'admin' && (
          <div className="space-y-8">
            <FileDropzone
              onUploadSuccess={loadVaultData}
              currentUser={currentUser}
            />
            <DocumentTable
              documents={documents}
              onDelete={handleDelete}
              onRefresh={loadVaultData}
              currentUser={currentUser}
            />
          </div>
        )}

        {activeTab === 'audit' && currentUser?.role === 'admin' && (
          <AuditView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#131A29] bg-[#070B12] py-4 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <span>© 2025 LawIntel AI Platform (United Kingdom Supreme Court Jurisdiction). Strictly Confidential.</span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-[#64748B]">
            <span>Engine: Groq 120B Legal-FT</span>
            <span>Embedding: BGE-M3 (1024-dim)</span>
            <span>Security: SRA / Cyber Essentials Plus</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
