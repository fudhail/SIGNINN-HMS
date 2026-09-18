import React from 'react';
import {
  BedDouble,
  DoorOpen,
  LogOut,
  Users,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Radio,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatWidget } from '../../components/ui/StatWidget';
import { PerformanceChart } from '../../components/charts/PerformanceChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { Reservation, Room, Property } from '../../types';
import { DollarSign } from 'lucide-react';

export interface DashboardViewProps {
  property: Property | null;
  reservations: Reservation[];
  rooms: Room[];
  onNavigate: (viewId: string) => void;
  onOpenReservationDetail: (resId: string) => void;
  onOpenCheckIn: (resId?: string) => void;
  onOpenCheckOut: (resId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  property,
  reservations,
  rooms,
  onNavigate,
  onOpenReservationDetail,
  onOpenCheckIn,
  onOpenCheckOut,
}) => {
  const today = '2026-09-16';

  const arrivalsToday = reservations.filter((r) => r.checkInDate === today && r.status !== 'Cancelled');
  const departuresToday = reservations.filter((r) => r.checkOutDate === today && r.status !== 'Checked Out');
  const inHouseReservations = reservations.filter((r) => r.status === 'Checked In');

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.occupancyStatus === 'Occupied').length;
  const dirtyRooms = rooms.filter((r) => r.housekeepingStatus === 'Dirty').length;
  const readyRooms = rooms.filter((r) => r.housekeepingStatus === 'Ready' || r.housekeepingStatus === 'Inspected').length;
  const maintenanceRooms = rooms.filter((r) => r.maintenanceStatus !== 'Operational').length;
  const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const pendingPayments = reservations
    .filter((r) => r.balanceAmount > 0 && r.status !== 'Cancelled')
    .reduce((acc, r) => acc + r.balanceAmount, 0);

  const unassignedArrivals = arrivalsToday.filter((r) => !r.roomId);

  return (
    <div className="space-y-6">
      {/* Action-Oriented Header Card */}
      <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                Good morning, {property ? property.name : 'SIGNINN Portfolio'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Operations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Wednesday, 16 Sep 2026 • Here's what requires your front-desk and housekeeping attention today.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigate('frontdesk')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <DoorOpen className="w-4 h-4 text-blue-600" />
              Front Desk
            </button>
            <button
              onClick={() => onNavigate('reservations')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              Tape Chart
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Cards with Trend Indicators & Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Total Revenue (Today)"
          value={formatCurrency(84500)}
          subtitle="Realized room & F&B"
          trend={{ value: '+14.8%', isPositive: true, label: 'vs last week' }}
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
          sparkline={[58, 62, 74, 69, 81, 78, 85]}
          onClick={() => onNavigate('reports')}
        />
        <StatWidget
          title="Occupancy Rate"
          value={`${occupancyPercentage}%`}
          subtitle={`${occupiedRooms} of ${totalRooms} rooms occupied`}
          trend={{ value: '+5.2%', isPositive: true, label: 'above compset' }}
          icon={<BedDouble className="w-5 h-5 text-blue-600" />}
          accentColor="blue"
          sparkline={[70, 72, 78, 75, 80, 82, 84]}
          onClick={() => onNavigate('rooms')}
        />
        <StatWidget
          title="Active In-House Guests"
          value={inHouseReservations.length * 2 + 12}
          subtitle={`${inHouseReservations.length} active registered folios`}
          trend={{ value: '+8.4%', isPositive: true, label: 'high season' }}
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          sparkline={[38, 44, 49, 46, 54, 59, 64]}
          onClick={() => onNavigate('guests')}
        />
        <StatWidget
          title="Pending Tasks"
          value="7"
          subtitle="Front desk & housekeeping items"
          trend={{ value: '-3 tasks', isPositive: true, label: 'cleared today' }}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          accentColor="amber"
          sparkline={[12, 11, 10, 9, 8, 8, 7]}
          onClick={() => onNavigate('frontdesk')}
        />
      </div>

      {/* Central Data Visualization Area */}
      <PerformanceChart />

      {/* Secondary Operational Quick-Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          title="Arrivals Today"
          value={arrivalsToday.length}
          subtitle="4 check-ins expected"
          icon={<DoorOpen className="w-4 h-4 text-blue-500" />}
          onClick={() => onNavigate('frontdesk')}
        />
        <StatCard
          title="Departures Today"
          value={departuresToday.length}
          subtitle="2 check-outs scheduled"
          icon={<LogOut className="w-4 h-4 text-orange-500" />}
          onClick={() => onNavigate('frontdesk')}
        />
        <StatCard
          title="Ready Rooms"
          value={readyRooms}
          subtitle="Vacant, clean & inspected"
          variant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          onClick={() => onNavigate('rooms')}
        />
        <StatCard
          title="Pending Folio Balances"
          value={formatCurrency(pendingPayments)}
          subtitle="Outstanding balances"
          icon={<CreditCard className="w-4 h-4 text-amber-500" />}
          onClick={() => onNavigate('folios')}
        />
      </div>

      {/* Action Center (High-priority triage items) */}
      <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Operational Action Center
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">6 tasks requiring team resolution</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Triage card 1: Dirty Rooms / Housekeeping */}
          <div
            onClick={() => onNavigate('housekeeping')}
            className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white hover:bg-amber-50/80 cursor-pointer transition-all hover:shadow-xs group flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-800 shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">4 Rooms Waiting for Housekeeping</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                Room 105 & 204 require turnover before 15:00 VIP arrivals.
              </p>
            </div>
          </div>

          {/* Triage card 2: Unassigned arrival */}
          <div
            onClick={() => onNavigate('frontdesk')}
            className="p-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-white hover:bg-blue-50/80 cursor-pointer transition-all hover:shadow-xs group flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-blue-100/80 text-blue-800 shrink-0 shadow-2xs">
              <BedDouble className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">1 Arrival Without Assigned Room</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                RES-8935 (Harish Kumar, Walk-in) arriving ~13:00. Assign Deluxe King.
              </p>
            </div>
          </div>

          {/* Triage card 3: OTA Sync Issue */}
          <div
            onClick={() => onNavigate('channels')}
            className="p-4 rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 to-white hover:bg-rose-50/80 cursor-pointer transition-all hover:shadow-xs group flex items-start gap-3"
          >
            <div className="p-2.5 rounded-xl bg-rose-100/80 text-rose-800 shrink-0 shadow-2xs">
              <Radio className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Airbnb Rate Mapping Disparity</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                Heritage Courtyard rate unmapped. Click to run Auto-Map.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Operational Two-Column Grid: Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Arrivals */}
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <DoorOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Today's Arrivals ({arrivalsToday.length})</h3>
            </div>
            <button
              onClick={() => onNavigate('frontdesk')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View in Front Desk <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100 overflow-x-auto flex-1">
            {arrivalsToday.map((res) => (
              <div
                key={res.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900">
                      {res.guest.firstName} {res.guest.lastName}
                    </span>
                    <Badge variant="channel" channel={res.bookingSource} size="sm" />
                    {res.guest.vipStatus && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-3">
                    <span>{res.refCode}</span>
                    <span>•</span>
                    <span className="font-medium text-gray-700">{res.roomTypeName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" /> ETA {res.eta || '14:00'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-900">
                      Room {res.roomNumber || 'Unassigned'}
                    </div>
                    <div className="text-[10px]">
                      {res.balanceAmount > 0 ? (
                        <span className="text-amber-600 font-medium">
                          Due {formatCurrency(res.balanceAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Paid in Full</span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="xs"
                    variant={res.status === 'Checked In' ? 'outline' : 'secondary'}
                    onClick={() => {
                      if (res.status === 'Checked In') {
                        onOpenReservationDetail(res.id);
                      } else {
                        onOpenCheckIn(res.id);
                      }
                    }}
                  >
                    {res.status === 'Checked In' ? 'View' : 'Check-in'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Departures */}
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Today's Departures ({departuresToday.length})</h3>
            </div>
            <button
              onClick={() => onNavigate('frontdesk')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View in Front Desk <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100 overflow-x-auto flex-1">
            {departuresToday.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">All departures cleared today</div>
            ) : (
              departuresToday.map((res) => (
                <div
                  key={res.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">
                        {res.guest.firstName} {res.guest.lastName}
                      </span>
                      <span className="text-xs text-gray-500">Room {res.roomNumber}</span>
                      {res.specialRequests?.includes('Late checkout') && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                          Late Checkout
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Stayed {res.nights} nights • {res.refCode}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-900">
                        {res.balanceAmount > 0 ? (
                          <span className="text-red-600">Due {formatCurrency(res.balanceAmount)}</span>
                        ) : (
                          <span className="text-emerald-600">Balance ₹0</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">Folio open</div>
                    </div>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onOpenCheckOut(res.id)}
                    >
                      Check-out
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operational Breakdown Strip: Channel Share, Revenue Summary & Room Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Booking Channel Distribution */}
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Channel Distribution</h4>
            <span className="text-[11px] text-slate-400 font-medium">Past 30 days</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Direct Website', share: 38, revenue: '₹4,12,000', color: 'bg-emerald-500' },
              { name: 'Booking.com', share: 29, revenue: '₹3,18,000', color: 'bg-blue-600' },
              { name: 'MakeMyTrip', share: 18, revenue: '₹1,95,000', color: 'bg-red-500' },
              { name: 'Agoda & Expedia', share: 10, revenue: '₹1,08,000', color: 'bg-sky-500' },
              { name: 'Walk-in / Direct', share: 5, revenue: '₹54,000', color: 'bg-purple-500' },
            ].map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{c.name}</span>
                  <span className="text-slate-900 font-bold">{c.share}% ({c.revenue})</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full transition-all duration-300`} style={{ width: `${c.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Status Breakdown */}
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Housekeeping & Rooms</h4>
            <button
              onClick={() => onNavigate('rooms')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Room Rack →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
              <span className="text-emerald-800 font-medium block text-xs">Ready to Sell</span>
              <span className="text-2xl font-extrabold text-emerald-950 mt-1 block">{readyRooms}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
              <span className="text-rose-800 font-medium block text-xs">Dirty / Turnover</span>
              <span className="text-2xl font-extrabold text-rose-950 mt-1 block">{dirtyRooms}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70">
              <span className="text-blue-800 font-medium block text-xs">Occupied In-house</span>
              <span className="text-2xl font-extrabold text-blue-950 mt-1 block">{occupiedRooms}</span>
            </div>
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/70">
              <span className="text-orange-800 font-medium block text-xs">Maintenance / Out</span>
              <span className="text-2xl font-extrabold text-orange-950 mt-1 block">{maintenanceRooms}</span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Average turnaround time:</span>
            <span className="font-bold text-slate-900">32 minutes</span>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Financial Summary</h4>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" /> +12% vs LY
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Today's Realized Revenue:</span>
                <span className="text-sm font-extrabold text-slate-900">{formatCurrency(84500)}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Average Daily Rate (ADR):</span>
                <span className="font-bold text-slate-900">{formatCurrency(4850)}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">RevPAR (Per Available Room):</span>
                <span className="font-bold text-slate-900">{formatCurrency(3977)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Collections Pending:</span>
                <span className="font-bold text-amber-600">{formatCurrency(pendingPayments)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs font-semibold"
              onClick={() => onNavigate('reports')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Full Revenue Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
