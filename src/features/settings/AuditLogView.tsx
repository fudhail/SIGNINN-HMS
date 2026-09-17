import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { Badge } from '../../components/ui/Badge';

export interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.staffName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              System Audit Trail & Security Logs
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Immutable legal ledger recording every reservation update, folio void, rate alteration, and key dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none"
          >
            <option value="all">All Action Types</option>
            <option value="Reservation Created">Reservation Created</option>
            <option value="Check-in Completed">Check-in Completed</option>
            <option value="Rate Overridden">Rate Overridden</option>
            <option value="Room Reassigned">Room Reassigned</option>
            <option value="Payment Recorded">Payment Recorded</option>
            <option value="Charge Voided">Charge Voided</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-600 w-56"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
              <th className="p-3">Timestamp (IST)</th>
              <th className="p-3">Staff Operator</th>
              <th className="p-3">Operation Executed</th>
              <th className="p-3">Target Entity</th>
              <th className="p-3">Event Audit Details</th>
              <th className="p-3 font-mono">Terminal IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-gray-600 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-3 font-bold text-gray-900">{log.staffName}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-800">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-mono text-blue-700 font-semibold">{log.entityId}</td>
                <td className="p-3 text-gray-700 max-w-md">{log.details}</td>
                <td className="p-3 font-mono text-[11px] text-gray-400">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
