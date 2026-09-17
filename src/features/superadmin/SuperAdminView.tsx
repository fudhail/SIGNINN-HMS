import React, { useState } from 'react';
import {
  Building,
  Shield,
  Users,
  CreditCard,
  Layers,
  ArrowRight,
  Search,
  Plus,
  Activity,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Lock,
  ChevronRight,
  Filter,
  Check,
  Settings,
} from 'lucide-react';
import { Tenant, TenantPlan, TenantStatus, PlatformMetrics } from '../../types';
import { mockOtaGateways, PlatformOtaGateway } from '../../mocks/mockTenants';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export interface SuperAdminViewProps {
  tenants: Tenant[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onEnterTenant?: (tenant: Tenant) => void;
  onProvisionTenant: (tenantData: Omit<Tenant, 'id' | 'joinedDate' | 'renewalDate' | 'monthlyGmv' | 'monthlyBookings'>) => void;
  onUpdateTenantStatus: (tenantId: string, status: TenantStatus) => void;
  onUpdateTenantPlan: (tenantId: string, plan: TenantPlan) => void;
  onUpdateTenantFeatures?: (tenantId: string, features: Partial<Tenant['features']>) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  tenants,
  currentTenantId,
  onSelectTenant,
  onEnterTenant,
  onProvisionTenant,
  onUpdateTenantStatus,
  onUpdateTenantPlan,
  onUpdateTenantFeatures,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tenants' | 'gateways' | 'plans' | 'audit'>('tenants');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedTenantForPlan, setSelectedTenantForPlan] = useState<Tenant | null>(null);

  // New Tenant Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formOwnerPhone, setFormOwnerPhone] = useState('');
  const [formPlan, setFormPlan] = useState<TenantPlan>('Professional');
  const [formMaxRooms, setFormMaxRooms] = useState(40);
  const [formBillingCycle, setFormBillingCycle] = useState<'Monthly' | 'Annual'>('Monthly');
  const [formOtaSync, setFormOtaSync] = useState(true);
  const [formDirectBooking, setFormDirectBooking] = useState(true);
  const [formWhatsapp, setFormWhatsapp] = useState(true);

  // Aggregated platform stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'Active').length;
  const totalRoomsManaged = tenants.reduce((sum, t) => sum + t.totalRoomsActive, 0);
  const totalMrr = tenants.reduce((sum, t) => sum + (t.status === 'Active' ? t.mrr : 0), 0);
  const totalArr = totalMrr * 12;
  const totalPlatformGmv = tenants.reduce((sum, t) => sum + t.monthlyGmv, 0);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || t.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug || !formOwnerEmail) {
      showToast({ title: 'Missing Fields', description: 'Please fill in required fields.', type: 'error' });
      return;
    }

    const mrr = formPlan === 'Starter' ? 2499 : formPlan === 'Professional' ? 5999 : 12999;

    onProvisionTenant({
      name: formName,
      slug: formSlug.toLowerCase().trim(),
      subdomain: `${formSlug.toLowerCase().trim()}.signinn.com`,
      ownerName: formOwnerName,
      ownerEmail: formOwnerEmail,
      ownerPhone: formOwnerPhone || '+91 98000 00000',
      plan: formPlan,
      status: 'Active',
      billingCycle: formBillingCycle,
      mrr,
      maxRooms: Number(formMaxRooms),
      totalRoomsActive: Math.min(Number(formMaxRooms), 20),
      propertiesCount: 1,
      primaryPropertyId: 'prop-1',
      features: {
        otaChannelManager: formOtaSync,
        directBookingEngine: formDirectBooking,
        whatsappAutomations: formWhatsapp,
        multiProperty: formPlan === 'Enterprise',
        advancedAnalytics: formPlan !== 'Starter',
      },
    });

    showToast({
      title: 'Hotel Client Provisioned',
      description: `${formName} created with subdomain ${formSlug}.signinn.com`,
      type: 'success',
    });

    setIsProvisionModalOpen(false);
    setFormName('');
    setFormSlug('');
    setFormOwnerName('');
    setFormOwnerEmail('');
  };

  const handleAutoSlug = (name: string) => {
    setFormName(name);
    if (!formSlug || formSlug === formName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setFormSlug(name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Platform HQ Banner */}
      <div className="bg-gradient-to-r from-[#0d1526] via-[#131d33] to-[#1e293b] rounded-2xl p-6 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-purple-400" /> SIGNINN Platform HQ
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Multi-Tenant Architecture
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Hotel Clients & Platform Administration
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Global control center for SIGNINN HMS. Manage client hotel organizations, SaaS subscription tiers,
              subdomains, tenant provisioning, and two-way OTA sync infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsProvisionModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Provision New Hotel
            </Button>
          </div>
        </div>

        {/* Global Platform KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
              Active Tenants
              <Building className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {activeTenants} <span className="text-xs font-normal text-slate-400">/ {totalTenants} hotels</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 100% Platform Uptime
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
              Rooms Managed
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {totalRoomsManaged}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
              Across active client racks
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
              Monthly ARR / MRR
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {formatCurrency(totalMrr)} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
              ARR: {formatCurrency(totalArr)}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
              Client Hotel GMV
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              ₹{(totalPlatformGmv / 100000).toFixed(1)} Lakhs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
              Processed this month
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
              OTA Sync Health
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300 mt-1">
              99.84%
            </div>
            <div className="text-[10px] text-purple-300/80 mt-0.5 font-normal">
              5 Gateways Connected
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'tenants'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building className="w-4 h-4" />
          Hotel Clients ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'gateways'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Server className="w-4 h-4" />
          OTA Gateway Health (5)
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'plans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Subscription Plans & Pricing
        </button>
      </div>

      {/* Tab 1: Tenants Directory */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hotel name, subdomain, or owner..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span>Plan:</span>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-md py-1 px-2 focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-md py-1 px-2 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                  <option value="Past Due">Past Due</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50/80 text-[10px] uppercase font-semibold text-gray-500 tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Hotel Organization / Tenant</th>
                    <th className="py-3 px-4">Subdomain</th>
                    <th className="py-3 px-4">Owner & Contact</th>
                    <th className="py-3 px-4">Plan & Billing</th>
                    <th className="py-3 px-4 text-center">Rooms Quota</th>
                    <th className="py-3 px-4">Monthly GMV</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTenants.map((t) => {
                    const isCurrent = t.id === currentTenantId;
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-gray-50/70 transition-colors ${
                          isCurrent ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#172033] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-950">{t.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                    Current
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                Client since {new Date(t.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600 font-mono text-[11px] bg-gray-50 px-2 py-1 rounded border border-gray-100 w-fit">
                            <span>{t.subdomain}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{t.ownerName}</div>
                          <div className="text-[10px] text-gray-500">{t.ownerEmail}</div>
                          <div className="text-[10px] text-gray-400">{t.ownerPhone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.plan === 'Enterprise'
                                  ? 'bg-purple-100 text-purple-800'
                                  : t.plan === 'Professional'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {t.plan}
                            </span>
                            <span className="text-[10px] text-gray-400">({t.billingCycle})</span>
                          </div>
                          <div className="text-[11px] font-semibold text-gray-900 mt-0.5">
                            {formatCurrency(t.mrr)}<span className="text-[9px] text-gray-400 font-normal">/mo</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="font-semibold text-gray-900">
                            {t.totalRoomsActive} <span className="text-gray-400 font-normal">/ {t.maxRooms}</span>
                          </div>
                          <div className="w-16 mx-auto bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, (t.totalRoomsActive / t.maxRooms) * 100)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {formatCurrency(t.monthlyGmv)}
                          <div className="text-[10px] text-gray-400 font-normal">{t.monthlyBookings} stays this month</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                              t.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : t.status === 'Trial'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : t.status === 'Past Due'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.status === 'Active'
                                  ? 'bg-emerald-500'
                                  : t.status === 'Trial'
                                  ? 'bg-blue-500'
                                  : t.status === 'Past Due'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {t.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status === 'Suspended' ? (
                              <button
                                onClick={() => {
                                  onUpdateTenantStatus(t.id, 'Active');
                                  showToast({
                                    title: 'Hotel Reactivated',
                                    description: `${t.name} has been reinstated to Active status.`,
                                    type: 'success',
                                  });
                                }}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="Reactivate suspended client hotel"
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  onUpdateTenantStatus(t.id, 'Suspended');
                                  showToast({
                                    title: 'Hotel Suspended',
                                    description: `${t.name} operational access has been suspended.`,
                                    type: 'warning',
                                  });
                                }}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                title="Suspend hotel operations (non-payment/policy)"
                              >
                                Suspend
                              </button>
                            )}

                            <Button
                              size="xs"
                              variant={isCurrent ? 'outline' : 'primary'}
                              onClick={() => {
                                if (onSelectTenant) {
                                  onSelectTenant(t.id);
                                } else if (onEnterTenant) {
                                  onEnterTenant(t);
                                }
                                showToast({
                                  title: `Switched to ${t.name}`,
                                  description: `You are now operating inside tenant ${t.slug}.signinn.com`,
                                  type: 'info',
                                });
                              }}
                              leftIcon={<ArrowRight className="w-3 h-3" />}
                            >
                              {isCurrent ? 'Active Tenant' : 'Enter HMS'}
                            </Button>

                            <button
                              onClick={() => setSelectedTenantForPlan(t)}
                              title="Manage Plan, Status & Feature Toggles"
                              className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <Settings className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTenants.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium">No hotel clients matching criteria</p>
                <p className="text-[11px] text-gray-400 mt-1">Try clearing filters or search query</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: OTA Gateway Health */}
      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-950">Global OTA Distribution Connectivity</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Centralized gateway connections routing rates, availability, and bookings between global channels and all hotel tenants.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockOtaGateways.map((gw) => (
              <div key={gw.code} className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{gw.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">Gateway Protocol: {gw.code}</span>
                  </div>
                  <Badge variant="status" status="Connected" size="sm" dot />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Avg Response Latency</span>
                    <span className="font-mono font-semibold text-gray-900">{gw.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">24h Sync Events</span>
                    <span className="font-semibold text-gray-900">{gw.syncs24h.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Delivery Success Rate</span>
                    <span className="font-semibold text-emerald-600">{gw.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Tenants Connected</span>
                    <span className="font-semibold text-blue-600">{gw.tenantsConnected} clients</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Parity Integrity
                  </span>
                  <button
                    onClick={() => {
                      showToast({
                        title: `${gw.code} Gateway Pinged`,
                        description: `Healthcheck latency: ${gw.latencyMs}ms. TLS 1.3 certificate valid.`,
                        type: 'info',
                      });
                    }}
                    className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Test Ping
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Subscription Plans & Pricing */}
      {activeTab === 'plans' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-950">SIGNINN HMS SaaS Subscription Tiers</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Transparent, scalable pricing tailored for independent hotels, boutique stays, and hospitality chains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                    Starter
                  </span>
                  <span className="text-xs text-gray-400">Independent Hotels</span>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-gray-950">₹2,499</div>
                  <div className="text-xs text-gray-500">per property / month billed annually</div>
                </div>

                <div className="text-xs text-gray-600 space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>25 rooms</strong> capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Interactive Tape Chart & Room Rack</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Front Desk Check-in / Check-out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Indian GST Billing (SAC 996311)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct Booking Engine</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-[11px] text-gray-500 mb-2">
                  Active Tenants on this plan: <strong>{tenants.filter((t) => t.plan === 'Starter').length}</strong>
                </div>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl border-2 border-blue-600 p-5 shadow-sm flex flex-col justify-between relative">
              <span className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                Most Popular
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    Professional
                  </span>
                  <span className="text-xs text-blue-600 font-medium">Boutique & Mid-Scale</span>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-gray-950">₹5,999</div>
                  <div className="text-xs text-gray-500">per property / month billed annually</div>
                </div>

                <div className="text-xs text-gray-600 space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Up to <strong>60 rooms</strong> capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span><strong>OTA Channel Manager</strong> (Booking.com, MMT, Agoda)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>WhatsApp Guest Automations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Housekeeping Mobile Turnover Board</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Manager Daily Flash & RevPAR Analytics</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-[11px] text-gray-500 mb-2">
                  Active Tenants on this plan: <strong>{tenants.filter((t) => t.plan === 'Professional').length}</strong>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                    Enterprise
                  </span>
                  <span className="text-xs text-gray-400">Hotel Chains & Resorts</span>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-gray-950">₹12,999</div>
                  <div className="text-xs text-gray-500">per property / month billed annually</div>
                </div>

                <div className="text-xs text-gray-600 space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>Unlimited rooms</strong> & multi-property</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Multi-Property Portfolio Group Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Custom Subdomain & White-Label</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Form-C Bureau of Immigration Logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Dedicated Account Manager & 24/7 Phone SLA</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-[11px] text-gray-500 mb-2">
                  Active Tenants on this plan: <strong>{tenants.filter((t) => t.plan === 'Enterprise').length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision New Tenant Modal */}
      {isProvisionModalOpen && (
        <Modal
          isOpen={isProvisionModalOpen}
          onClose={() => setIsProvisionModalOpen(false)}
          title="Provision New Hotel Tenant (SaaS Client)"
          size="lg"
        >
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <strong>Multi-Tenancy Provisioning:</strong> This will create a separate tenant database sandbox,
              subdomain endpoint (e.g. <code>client.signinn.com</code>), and assign the property owner credentials.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hotel Organization / Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleAutoSlug(e.target.value)}
                  placeholder="e.g. Whispering Palms Luxury Resort"
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subdomain Slug *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="whisperingpalms"
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                  <span className="px-2.5 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-xs text-gray-500 font-mono">
                    .signinn.com
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Owner / GM Name *
                </label>
                <input
                  type="text"
                  required
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  placeholder="e.g. Suresh Varma"
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Owner Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formOwnerEmail}
                  onChange={(e) => setFormOwnerEmail(e.target.value)}
                  placeholder="suresh@whisperingpalms.com"
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formOwnerPhone}
                  onChange={(e) => setFormOwnerPhone(e.target.value)}
                  placeholder="+91 98470 55443"
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value as TenantPlan)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option value="Starter">Starter (₹2,499/mo)</option>
                  <option value="Professional">Professional (₹5,999/mo)</option>
                  <option value="Enterprise">Enterprise (₹12,999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Room Quota
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={formMaxRooms}
                  onChange={(e) => setFormMaxRooms(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={formBillingCycle}
                  onChange={(e) => setFormBillingCycle(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option value="Monthly">Monthly Recurring</option>
                  <option value="Annual">Annual (15% Pre-pay discount)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Enabled Operational Modules
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formOtaSync}
                    onChange={(e) => setFormOtaSync(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>OTA Channel Manager</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formDirectBooking}
                    onChange={(e) => setFormDirectBooking(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Direct Booking Engine</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>WhatsApp Automations</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsProvisionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Provision Hotel Tenant
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Tenant Plan & Status Management Modal */}
      {selectedTenantForPlan && (
        <Modal
          isOpen={!!selectedTenantForPlan}
          onClose={() => setSelectedTenantForPlan(null)}
          title={`Manage Tenant: ${selectedTenantForPlan.name}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subdomain:</span>
                <span className="font-mono font-medium">{selectedTenantForPlan.subdomain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Plan:</span>
                <span className="font-semibold text-blue-700">{selectedTenantForPlan.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Status:</span>
                <span className="font-semibold">{selectedTenantForPlan.status}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Change Subscription Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Starter', 'Professional', 'Enterprise'] as TenantPlan[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onUpdateTenantPlan(selectedTenantForPlan.id, p);
                      setSelectedTenantForPlan({ ...selectedTenantForPlan, plan: p });
                      showToast({ title: 'Plan Updated', description: `Switched to ${p}`, type: 'success' });
                    }}
                    className={`p-2 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                      selectedTenantForPlan.plan === p
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Account Suspension / Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newStatus = selectedTenantForPlan.status === 'Active' ? 'Suspended' : 'Active';
                    onUpdateTenantStatus(selectedTenantForPlan.id, newStatus);
                    setSelectedTenantForPlan({ ...selectedTenantForPlan, status: newStatus });
                    showToast({
                      title: `Tenant Status Changed`,
                      description: `Set to ${newStatus}`,
                      type: newStatus === 'Active' ? 'success' : 'warning',
                    });
                  }}
                  className={`p-2 rounded-lg border font-medium cursor-pointer transition-colors ${
                    selectedTenantForPlan.status === 'Active'
                      ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {selectedTenantForPlan.status === 'Active' ? 'Suspend Tenant Account' : 'Reactivate Tenant'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTenant) {
                      onSelectTenant(selectedTenantForPlan.id);
                    } else if (onEnterTenant) {
                      onEnterTenant(selectedTenantForPlan);
                    }
                    setSelectedTenantForPlan(null);
                    showToast({
                      title: `Logged into ${selectedTenantForPlan.name}`,
                      description: 'Super Admin Impersonation Active',
                      type: 'info',
                    });
                  }}
                  className="p-2 rounded-lg border border-blue-600 bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Enter This Tenant
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block font-semibold text-gray-800">Feature Access Toggles</label>
                  <p className="text-[10px] text-gray-500">Turn modules ON or OFF specifically for this client hotel</p>
                </div>
              </div>
              <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {[
                  { key: 'otaChannelManager', label: 'OTA Channel Manager', desc: 'Booking.com, MMT, Agoda 2-way sync' },
                  { key: 'directBookingEngine', label: 'Direct Booking Engine', desc: 'Direct guest booking engine & widget' },
                  { key: 'whatsappAutomations', label: 'WhatsApp Automations', desc: 'Automated pre-arrival & folio notifications' },
                  { key: 'advancedAnalytics', label: 'Advanced P&L Analytics', desc: 'Managerial & tax revenue reporting' },
                  { key: 'multiProperty', label: 'Multi-Property Switching', desc: 'Enterprise portfolio view' },
                ].map((feat) => {
                  const isEnabled = !!(selectedTenantForPlan.features as any)?.[feat.key];
                  return (
                    <div key={feat.key} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-white transition-colors">
                      <div>
                        <span className="font-semibold text-gray-900 text-xs">{feat.label}</span>
                        <p className="text-[10px] text-gray-500">{feat.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedFeatures = {
                            ...selectedTenantForPlan.features,
                            [feat.key]: !isEnabled,
                          };
                          onUpdateTenantFeatures?.(selectedTenantForPlan.id, updatedFeatures);
                          setSelectedTenantForPlan({
                            ...selectedTenantForPlan,
                            features: updatedFeatures,
                          });
                          showToast({
                            title: `Module ${!isEnabled ? 'Enabled' : 'Disabled'}`,
                            description: `${feat.label} is now ${!isEnabled ? 'active' : 'inactive'} for ${selectedTenantForPlan.name}`,
                            type: !isEnabled ? 'success' : 'warning',
                          });
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="xs" variant="outline" onClick={() => setSelectedTenantForPlan(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
