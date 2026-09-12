import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, ShieldAlert, Database, RefreshCw } from 'lucide-react';
import { fetchAuditLogs, fetchSystemStats } from '../../services/auditService';
import { Card, CardHeader, CardBody } from '../chakra/Card';
import { Stat, StatLabel, StatNumber, StatHelpText } from '../chakra/Stat';
import { Badge } from '../chakra/Badge';
import { Button } from '../chakra/Button';

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetchAuditLogs({ limit: 50 }),
        fetchSystemStats()
      ]);
      setLogs(logsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load audit metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'SECURITY_ALERT':
        return <Badge colorScheme="red" variant="subtle">Security Alert</Badge>;
      case 'WARNING':
        return <Badge colorScheme="orange" variant="subtle">Rejection</Badge>;
      default:
        return <Badge colorScheme="teal" variant="subtle">Audit Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4FD1C5]" />
            Compliance, Ingestion Rejections & Security Audit
          </h2>
          <p className="text-xs text-[#A0AEC0] mt-0.5">
            Immutable log of gate evaluations, prompt guard screening events, and document lifecycle audits.
          </p>
        </div>

        <Button
          size="sm"
          colorScheme="gray"
          variant="outline"
          isLoading={loading}
          onClick={loadData}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Audit Trail
        </Button>
      </div>

      {/* Chakra Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Stat>
          <StatLabel>
            <span>Indexed UK Authorities</span>
            <CheckCircle2 className="w-4 h-4 text-[#38A169]" />
          </StatLabel>
          <StatNumber className="text-[#4FD1C5]">
            {stats?.totalIndexed ?? 0}
          </StatNumber>
          <StatHelpText>Verified Common Law in Vault</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>
            <span>Documents Rejected</span>
            <AlertOctagon className="w-4 h-4 text-[#E53E3E]" />
          </StatLabel>
          <StatNumber className="text-[#FEB2B2]">
            {stats?.totalRejected ?? 0}
          </StatNumber>
          <StatHelpText>Filtered by Ingestion Gates</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>
            <span>Qdrant Vectors</span>
            <Database className="w-4 h-4 text-[#319795]" />
          </StatLabel>
          <StatNumber className="text-[#4FD1C5]">
            {stats?.totalChunks ?? 0}
          </StatNumber>
          <StatHelpText>1024-dim BGE-M3 Embeddings</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>
            <span>Prompt Guard Blocks</span>
            <ShieldAlert className="w-4 h-4 text-[#805AD5]" />
          </StatLabel>
          <StatNumber className="text-[#D6BCFA]">
            {stats?.securityBlocks ?? 0}
          </StatNumber>
          <StatHelpText>Adversarial Queries Intercepted</StatHelpText>
        </Stat>

      </div>

      {/* Audit Table in Chakra Card */}
      <Card variant="outline">
        <CardHeader>
          <h3 className="text-sm font-bold text-white">
            Audit Event Activity Stream (Latest 50 Events)
          </h3>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#171923] uppercase text-[11px] text-[#A0AEC0] border-b border-[#2D3748] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Event Type</th>
                <th className="px-4 py-3.5">Severity</th>
                <th className="px-4 py-3.5">Details & Diagnostics</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]/50 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#718096] text-xs">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#2D3748]/30 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[#4FD1C5] font-semibold">
                      {log.eventType}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>

                    <td className="px-4 py-3.5 max-w-md truncate text-slate-300 font-mono text-[11px]">
                      {log.details ? JSON.stringify(log.details) : 'N/A'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-[#718096] font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-[#A0AEC0] text-[11px] font-mono">
                      {new Date(log.createdAt).toLocaleString('en-GB')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
