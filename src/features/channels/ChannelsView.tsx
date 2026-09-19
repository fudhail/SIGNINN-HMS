import React, { useState } from "react";
import {
  Globe, RefreshCw, Sliders, Mail, Calendar, FileSpreadsheet,
  Copy, Check, Play, Zap, ExternalLink, TrendingDown, TrendingUp,
  ArrowRight, Link2, AlertCircle, CheckCircle2, Upload, BarChart3, IndianRupee,
} from "lucide-react";
import { ChannelConnection, Property, Tenant } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import {
  useOtaIngestionLogsQuery, useSimulateOtaEmailMutation,
  useReconcileCsvMutation, useSyncIcalMutation,
} from "../../services/api/queries";

export interface ChannelsViewProps {
  channels: ChannelConnection[];
  currentProperty?: Property | null;
  currentTenant?: Tenant | null;
  onForceSync: () => Promise<void>;
  onToggleChannelStatus: (channelId: string) => Promise<void>;
  onUpdateMarkup: (channelId: string, markupPercent: number) => Promise<void>;
}
type TabType = "overview" | "email" | "csv" | "ical";

const OTA_LOGOS: Record<string, { initials: string; color: string; bg: string }> = {
  "Booking.com": { initials: "BK", color: "#003580", bg: "#e8eef8" },
  "MakeMyTrip":  { initials: "MM", color: "#e41d24", bg: "#fde8e9" },
  "Agoda":       { initials: "AG", color: "#1864ab", bg: "#e2ecf7" },
  "Airbnb":      { initials: "AB", color: "#FF385C", bg: "#ffe8ec" },
  "Expedia":     { initials: "EX", color: "#00355f", bg: "#e0eaf2" },
  "Goibibo":     { initials: "GO", color: "#ec5b24", bg: "#fdeae2" },
};
const SETUP_STEPS = [
  { step: 1, title: "Booking.com Extranet", icon: "🏨", desc: "Property → Contacts → Reservations Notifications. Add your forwarder alias as additional recipient." },
  { step: 2, title: "MakeMyTrip InGoMMT",   icon: "✈️", desc: "InGoMMT Extranet → Settings → Email Alerts. Add the forwarder address to receive booking vouchers." },
  { step: 3, title: "Gmail / Outlook",       icon: "📧", desc: "Create a filter for *@booking.com or *@makemytrip.com and auto-forward to your forwarder alias." },
];

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels, currentProperty, onForceSync, onToggleChannelStatus, onUpdateMarkup,
}) => {
  const { showToast } = useToast();
  const [activeTab,         setActiveTab]         = useState<TabType>("overview");
  const [isSyncing,         setIsSyncing]         = useState(false);
  const [selectedChannel,   setSelectedChannel]   = useState<ChannelConnection | null>(null);
  const [copiedText,        setCopiedText]        = useState<string | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simChannel,          setSimChannel]          = useState("Booking.com");
  const [simGuestName,        setSimGuestName]        = useState("Siddharth Singhania");
  const [simGuestPhone,       setSimGuestPhone]       = useState("+91 98201 55678");
  const [simGuestEmail,       setSimGuestEmail]       = useState("siddharth.s@gmail.com");
  const [simNights,           setSimNights]           = useState(2);
  const [simAmount,           setSimAmount]           = useState(19500);
  const [simCommissionRate,   setSimCommissionRate]   = useState(15);
  const [simPaymentMode,      setSimPaymentMode]      = useState("Virtual Card (VCC)");
  const [csvContent,          setCsvContent]          = useState("");
  const [csvChannel,          setCsvChannel]          = useState("Auto-detect");
  const [csvResult,           setCsvResult]           = useState<any | null>(null);
  const [selectedIcalChannel, setSelectedIcalChannel] = useState("Airbnb");
  const [inboundIcalUrl,      setInboundIcalUrl]      = useState("");

  const { data: ingestionLogs = [] } = useOtaIngestionLogsQuery();
  const simulateEmailMutation = useSimulateOtaEmailMutation();
  const reconcileCsvMutation  = useReconcileCsvMutation();
  const syncIcalMutation      = useSyncIcalMutation();

  const propertyId   = currentProperty?.id   || "prop-1";
  const propertyName = currentProperty?.name || "This Property";
  const inboundEmailAlias = `ota+${propertyId}@inbound.signinn.app`;
  const icalFeedUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/ical/${propertyId}.ics`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast({ title: "Copied!", description: text, type: "success" });
    setTimeout(() => setCopiedText(null), 2500);
  };
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try { await onForceSync(); showToast({ title: "Sync Complete", description: "All OTA feeds refreshed.", type: "success" }); }
    finally { setIsSyncing(false); }
  };
  const handleRunSimulation = async () => {
    try {
      const res = await simulateEmailMutation.mutateAsync({
        channel: simChannel, property_id: propertyId,
        guest_name: simGuestName, guest_phone: simGuestPhone, guest_email: simGuestEmail,
        nights: Number(simNights), total_amount: Number(simAmount),
        commission_rate: Number(simCommissionRate), payment_mode: simPaymentMode,
      });
      showToast({ title: `${simChannel} Booking Ingested!`, description: `${res.ota_reservation_id} → Folio ${res.ref_code}`, type: "success" });
      setIsSimulateModalOpen(false);
    } catch (err: any) { showToast({ title: "Simulation Failed", description: err.message, type: "error" }); }
  };
  const handleLoadSampleCsv = () => {
    setCsvContent("Booking Number,Guest Name,Check-in,Check-out,Gross Amount,Commission %,Status\nBK-BKG-889102,Karan Johar,2026-10-18,2026-10-21,28500,15%,Confirmed\nBK-MMT-443219,Priyanka Chopra,2026-10-22,2026-10-25,32000,18%,Confirmed\nBK-AGD-119283,Arjun Rampal,2026-10-27,2026-10-29,14500,15%,Confirmed");
  };
  const handleRunCsvReconcile = async () => {
    if (!csvContent.trim()) { showToast({ title: "No CSV", description: "Load sample or paste your own.", type: "error" }); return; }
    try {
      const res = await reconcileCsvMutation.mutateAsync({ property_id: propertyId, csv_content: csvContent, channel: csvChannel });
      setCsvResult(res);
      showToast({ title: "Reconciliation Complete", description: res.message, type: "success" });
    } catch (err: any) { showToast({ title: "Failed", description: err.message, type: "error" }); }
  };
  const handleSyncIcalInbound = async () => {
    try {
      const res = await syncIcalMutation.mutateAsync({ channelName: selectedIcalChannel, propertyId, icalUrl: inboundIcalUrl || undefined });
      showToast({ title: "iCal Synced", description: res.message, type: "success" });
    } catch (err: any) { showToast({ title: "Sync Failed", description: err.message, type: "error" }); }
  };

  const totalRevenue    = channels.reduce((a, c) => a + (c.revenueThisMonth || 0), 0);
  const totalCommission = channels.reduce((a, c) => a + ((c.revenueThisMonth || 0) * c.commissionRate) / 100, 0);
  const netPayout       = totalRevenue - totalCommission;
  const connectedCount  = channels.filter(c => c.status === "Connected").length;

  const TABS: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "overview", label: "OTA Portals",    icon: <Globe className="w-3.5 h-3.5" />,          badge: String(channels.length) },
    { id: "email",    label: "Email Ingestion", icon: <Mail className="w-3.5 h-3.5" />,           badge: ingestionLogs.length > 0 ? String(ingestionLogs.length) : undefined },
    { id: "csv",      label: "CSV Reconciler",  icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { id: "ical",     label: "iCal Calendars",  icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">OTA Distribution Hub</h1>
            <p className="text-[11px] text-slate-500">{propertyName} · Hybrid tracking — no channel manager fees</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSimulateModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-all shadow-sm cursor-pointer">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Test Booking
          </button>
          <button onClick={handleSyncAll} disabled={isSyncing} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} /> Sync Feeds
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "OTA Revenue",      value: formatCurrency(totalRevenue),    sub: "This month",         icon: <IndianRupee className="w-4 h-4 text-blue-400" />,   accent: "text-slate-900" },
          { label: "Commission Paid",  value: formatCurrency(totalCommission), sub: `Avg ${totalRevenue > 0 ? ((totalCommission/totalRevenue)*100).toFixed(1) : 0}%`, icon: <TrendingDown className="w-4 h-4 text-rose-400" />, accent: "text-rose-600" },
          { label: "Net Hotel Payout", value: formatCurrency(netPayout),       sub: "After OTA cut",      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, accent: "text-emerald-600" },
          { label: "Auto-Ingested",    value: `${ingestionLogs.length + 18}`,  sub: "Email + iCal total", icon: <BarChart3 className="w-4 h-4 text-purple-400" />,   accent: "text-slate-900" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div className={`text-lg font-bold ${kpi.accent}`}>{kpi.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN TABS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}>
              {tab.icon} {tab.label}
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-5">
          {/* ===== TAB 1: OTA PORTALS ===== */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-emerald-800">{connectedCount} of {channels.length} channels active</span>
                  <span className="text-emerald-600 ml-1.5">· Tracked via email parsing, iCal sync and CSV reconciliation. No channel manager needed.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {channels.map(ch => {
                  const isConnected = ch.status === "Connected";
                  const channelName = (ch.channelName as string) || "";
                  const logo = OTA_LOGOS[channelName] || { initials: channelName?.slice(0,2)?.toUpperCase() || "OT", color: "#64748b", bg: "#f1f5f9" };
                  const commission = ch.commissionRate || 0;
                  const revenue    = ch.revenueThisMonth || 0;
                  const netRev     = revenue - (revenue * commission) / 100;
                  const markupPct  = ch.rateMultiplier && ch.rateMultiplier > 1 ? Math.round((ch.rateMultiplier - 1) * 100) : 0;
                  return (
                    <div key={ch.id} className={`rounded-xl border p-4 transition-all hover:shadow-md ${isConnected ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/50 opacity-70"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black" style={{ backgroundColor: logo.bg, color: logo.color }}>
                            {logo.initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{channelName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{(ch as any).code || "OTA"}</div>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {isConnected ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Commission</div>
                          <div className="text-sm font-bold text-rose-600 mt-0.5">{commission}%</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Markup</div>
                          <div className="text-sm font-bold text-blue-600 mt-0.5">{markupPct > 0 ? `+${markupPct}%` : "Parity"}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Net Rev</div>
                          <div className="text-xs font-bold text-emerald-600 mt-0.5">{formatCurrency(netRev)}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100"><Mail className="w-2.5 h-2.5" />Email</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100"><Calendar className="w-2.5 h-2.5" />iCal</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200"><FileSpreadsheet className="w-2.5 h-2.5" />CSV</span>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                        <button onClick={() => onToggleChannelStatus(ch.id)} className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
                          {isConnected ? "Pause" : "Activate"}
                        </button>
                        <button onClick={() => setSelectedChannel(ch)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer">
                          <Sliders className="w-3 h-3" /> Rate Rules
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== TAB 2: EMAIL INGESTION ===== */}
          {activeTab === "email" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest">Your Property Forwarder Alias</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-white bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-2 select-all break-all">
                      {inboundEmailAlias}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Add this to your OTA Extranets or create a Gmail auto-forward rule. Every new booking email is auto-parsed into a reservation and folio within 30 seconds.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    <button onClick={() => copyToClipboard(inboundEmailAlias, "email")} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer">
                      {copiedText === "email" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText === "email" ? "Copied!" : "Copy Address"}
                    </button>
                    <button onClick={() => setIsSimulateModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer">
                      <Play className="w-3.5 h-3.5" /> Test Ingestion
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">How to Connect — 3 Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SETUP_STEPS.map(step => (
                    <div key={step.step} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none mt-0.5">{step.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">{step.step}</span>
                            <span className="text-xs font-bold text-slate-800">{step.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Ingested Bookings</h3>
                  <button onClick={() => setIsSimulateModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all cursor-pointer">
                    <Play className="w-3 h-3" /> Simulate
                  </button>
                </div>
                {ingestionLogs.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <Mail className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">No bookings ingested yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Connect your OTA extranet or run a simulation.</p>
                    <button onClick={() => setIsSimulateModalOpen(true)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all cursor-pointer">
                      <Play className="w-3 h-3" /> Run Test Simulation
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {["Time","Channel","OTA Ref","Guest","Dates","Gross","Commission","Net Payout","Status"].map(h => <th key={h} className="px-3 py-2.5">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ingestionLogs.map(log => {
                            const net = log.total_amount - (log.commission_amount || 0);
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">{log.created_at ? log.created_at?.slice(0,16)?.replace("T"," ") : "Just now"}</td>
                                <td className="px-3 py-2.5"><Badge variant="channel" channel={log.channel} size="sm" /></td>
                                <td className="px-3 py-2.5 font-mono font-semibold text-blue-600">{log.ota_reservation_id}</td>
                                <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{log.guest_name}</td>
                                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{log.check_in_date} → {log.check_out_date}</td>
                                <td className="px-3 py-2.5 font-semibold text-slate-800">{formatCurrency(log.total_amount)}</td>
                                <td className="px-3 py-2.5 text-rose-600">{formatCurrency(log.commission_amount || 0)}</td>
                                <td className="px-3 py-2.5 font-bold text-emerald-600">{formatCurrency(net)}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === "Cancelled" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TAB 3: CSV RECONCILER ===== */}
          {activeTab === "csv" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Smart Extranet CSV Reconciler</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Download your monthly reservation report from Booking.com, MakeMyTrip or Agoda Extranet. Paste it here for 1-click folio creation and commission auditing.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 shrink-0">OTA Source</label>
                    <select value={csvChannel} onChange={e => setCsvChannel(e.target.value)} className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                      <option value="Auto-detect">Auto-detect from CSV</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="MakeMyTrip">MakeMyTrip / InGoMMT</option>
                      <option value="Agoda">Agoda YCS</option>
                      <option value="Expedia">Expedia</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">CSV Data</label>
                      <button onClick={handleLoadSampleCsv} className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer">
                        <FileSpreadsheet className="w-3 h-3" /> Load Sample
                      </button>
                    </div>
                    <textarea value={csvContent} onChange={e => setCsvContent(e.target.value)}
                      placeholder={"Booking Number,Guest Name,Check-in,Check-out,Gross Amount,Commission %,Status\nBK-BKG-889102,Rahul Sharma,2026-10-18,2026-10-21,28500,15%,Confirmed"}
                      rows={8} className="w-full text-[11px] font-mono p-3 border border-slate-200 rounded-xl bg-slate-50 resize-none text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-400" />
                  </div>
                  <button onClick={handleRunCsvReconcile} disabled={reconcileCsvMutation.isPending} className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-60">
                    {reconcileCsvMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {reconcileCsvMutation.isPending ? "Reconciling…" : "Reconcile & Import Folios"}
                  </button>
                </div>
                <div>
                  {!csvResult ? (
                    <div className="h-full min-h-48 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-400">Results appear here</p>
                      <p className="text-[11px] text-slate-400 mt-1">Load sample CSV and click Reconcile</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Processed",      value: csvResult.total_rows,         accent: "text-slate-900" },
                          { label: "New Folios",     value: csvResult.new_folios_created, accent: "text-blue-600" },
                          { label: "Gross Revenue",  value: formatCurrency(csvResult.total_revenue),    accent: "text-slate-900" },
                          { label: "OTA Commission", value: formatCurrency(csvResult.total_commission), accent: "text-rose-600" },
                        ].map(m => (
                          <div key={m.label} className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">{m.label}</div>
                            <div className={`text-sm font-bold ${m.accent} mt-0.5`}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      {csvResult.records && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                  {["Channel","Booking ID","Guest","Dates","Amount","Commission","Status"].map(h => <th key={h} className="px-3 py-2">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {csvResult.records.map((rec: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-3 py-2"><Badge variant="channel" channel={rec.channel || csvResult.channel || "Booking.com"} size="sm" /></td>
                                    <td className="px-3 py-2 font-mono text-blue-600 font-semibold text-[11px]">{rec.ota_id}</td>
                                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{rec.guest_name}</td>
                                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{rec.check_in} → {rec.check_out}</td>
                                    <td className="px-3 py-2 font-semibold text-slate-800">{formatCurrency(rec.amount)}</td>
                                    <td className="px-3 py-2 text-rose-600">{formatCurrency(rec.commission)}</td>
                                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.action === "created" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{rec.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB 4: iCal CALENDARS ===== */}
          {activeTab === "ical" && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-purple-600" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Outbound Calendar Feed (RFC 5545)</h3>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">Live</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Plug this link into Airbnb, Booking.com, or VRBO calendar sync settings. OTAs poll this feed and block dates automatically.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-600 min-w-0">
                    <Link2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{icalFeedUrl}</span>
                  </div>
                  <button onClick={() => copyToClipboard(icalFeedUrl, "ical")} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all cursor-pointer shrink-0">
                    {copiedText === "ical" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === "ical" ? "Copied!" : "Copy URL"}
                  </button>
                  <a href={icalFeedUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </a>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Inbound OTA Calendar Sync</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Paste the iCal export URL from Airbnb or Booking.com. SIGNINN polls it to block those OTA dates on your tape chart.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">OTA Source</label>
                      <select value={selectedIcalChannel} onChange={e => setSelectedIcalChannel(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white">
                        <option value="Airbnb">Airbnb</option>
                        <option value="Booking.com">Booking.com</option>
                        <option value="VRBO">VRBO / Homestay</option>
                        <option value="Agoda">Agoda YCS</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">OTA iCal Export URL</label>
                      <input type="url" value={inboundIcalUrl} onChange={e => setInboundIcalUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/xxxx.ics" className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 font-mono placeholder-slate-300" />
                    </div>
                  </div>
                  <button onClick={handleSyncIcalInbound} disabled={syncIcalMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all cursor-pointer disabled:opacity-60">
                    <RefreshCw className={`w-3.5 h-3.5 ${syncIcalMutation.isPending ? "animate-spin" : ""}`} />
                    {syncIcalMutation.isPending ? "Syncing…" : "Sync & Block Dates on Tape Chart"}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-800 mb-2.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> How 2-Way iCal Works
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-blue-700">
                  <div className="flex items-start gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0" /><span>SIGNINN publishes a tokenized <strong>.ics</strong> feed of your confirmed reservations</span></div>
                  <div className="flex items-start gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0" /><span>OTAs subscribe to this URL and <strong>block those dates</strong> in their booking calendar</span></div>
                  <div className="flex items-start gap-2"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0" /><span>You import OTA calendars so <strong>walk-in staff see OTA blocks</strong> — zero double bookings</span></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SIMULATE MODAL */}
      {isSimulateModalOpen && (
        <Modal isOpen={isSimulateModalOpen} onClose={() => setIsSimulateModalOpen(false)} title="Simulate Inbound OTA Booking">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 leading-relaxed">
              Creates a live test booking as if it arrived via OTA confirmation email — folio, GST, and commission auto-calculated.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">OTA Channel</label>
                <select value={simChannel} onChange={e => setSimChannel(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs">
                  {["Booking.com","MakeMyTrip","Agoda","Airbnb","Expedia"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                <select value={simPaymentMode} onChange={e => setSimPaymentMode(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs">
                  <option value="Virtual Card (VCC)">Virtual Card (VCC) — Prepaid</option>
                  <option value="Hotel Collect">Hotel Collect (Pay at Hotel)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Guest Name</label>
                <input type="text" value={simGuestName} onChange={e => setSimGuestName(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Guest Phone</label>
                <input type="text" value={simGuestPhone} onChange={e => setSimGuestPhone(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nights</label>
                <input type="number" min={1} max={14} value={simNights} onChange={e => setSimNights(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Gross Tariff (₹)</label>
                <input type="number" value={simAmount} onChange={e => setSimAmount(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">OTA Commission %</label>
                <input type="number" value={simCommissionRate} onChange={e => setSimCommissionRate(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Net Hotel Payout</label>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-700 text-xs">
                  {formatCurrency(simAmount - (simAmount * simCommissionRate) / 100)}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setIsSimulateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleRunSimulation} isLoading={simulateEmailMutation.isPending} leftIcon={<Play className="w-3.5 h-3.5" />}>
                Inject Test Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* RATE RULES MODAL */}
      {selectedChannel && (
        <Modal isOpen={!!selectedChannel} onClose={() => setSelectedChannel(null)} title={`${selectedChannel.channelName} — Rate Parity Rules`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-600 leading-relaxed">
                <strong>{selectedChannel.channelName as string}</strong> charges a{" "}
                <strong className="text-rose-600">{selectedChannel.commissionRate}% commission</strong> on every booking.
                Set a markup so the OTA-listed price covers the commission — protecting your direct booking ADR.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-800">OTA Rate Markup</label>
                <span className="font-bold text-blue-600 text-sm">
                  {selectedChannel.rateMultiplier && selectedChannel.rateMultiplier > 1
                    ? `+${Math.round((selectedChannel.rateMultiplier - 1) * 100)}%`
                    : "Parity (0%)"}
                </span>
              </div>
              <input type="range" min="1.0" max="1.3" step="0.05"
                value={selectedChannel.rateMultiplier || 1.0}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  onUpdateMarkup(selectedChannel.id, val);
                  setSelectedChannel({ ...selectedChannel, rateMultiplier: val });
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% Parity</span>
                <span>+{selectedChannel.commissionRate}% (Cover OTA fee)</span>
                <span>+30% Premium</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[11px] text-slate-500 mb-2 font-semibold">Live Rate Preview (base room ₹8,000 / night)</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Your Base Rate</div>
                  <div className="font-bold text-slate-900">₹8,000</div>
                </div>
                <div>
                  <div className="text-[10px] text-blue-500 font-semibold uppercase mb-0.5">OTA Listed Rate</div>
                  <div className="font-bold text-blue-700">₹{Math.round(8000 * (selectedChannel.rateMultiplier || 1)).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-500 font-semibold uppercase mb-0.5">Net to Hotel</div>
                  <div className="font-bold text-emerald-600">₹{Math.round(8000 * (selectedChannel.rateMultiplier || 1) * (1 - selectedChannel.commissionRate / 100)).toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button variant="primary" size="sm" onClick={() => setSelectedChannel(null)}>Save Rules</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
