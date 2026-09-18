import React, { useState } from 'react';
import {
  DoorOpen,
  LogOut,
  Users,
  Search,
  BedDouble,
  Clock,
  Sparkles,
  CreditCard,
  UserPlus,
  ArrowRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Reservation, Room } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';

export interface FrontDeskViewProps {
  reservations: Reservation[];
  rooms: Room[];
  onOpenCheckIn: (resId: string) => void;
  onOpenCheckOut: (resId: string) => void;
  onOpenReservationDetail: (resId: string) => void;
  onOpenWalkIn: () => void;
  onOpenNewReservation: () => void;
}

export const FrontDeskView: React.FC<FrontDeskViewProps> = ({
  reservations,
  rooms,
  onOpenCheckIn,
  onOpenCheckOut,
  onOpenReservationDetail,
  onOpenWalkIn,
  onOpenNewReservation,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'arrivals' | 'departures' | 'inhouse' | 'roomrack'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = '2026-09-16';

  const arrivals = reservations.filter((r) => r.checkInDate === today && r.status !== 'Cancelled');
  const checkedInArrivals = arrivals.filter((r) => r.status === 'Checked In').length;

  const departures = reservations.filter((r) => r.checkOutDate === today && r.status !== 'Cancelled');
  const completedDepartures = departures.filter((r) => r.status === 'Checked Out').length;

  const inHouse = reservations.filter((r) => r.status === 'Checked In');

  // Filter lists based on search
  const matchesSearch = (r: Reservation) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.refCode.toLowerCase().includes(q) ||
      `${r.guest.firstName} ${r.guest.lastName}`.toLowerCase().includes(q) ||
      (r.roomNumber && r.roomNumber.includes(q)) ||
      r.guest.phone.includes(q)
    );
  };

  const filteredArrivals = arrivals.filter(matchesSearch);
  const filteredDepartures = departures.filter(matchesSearch);
  const filteredInHouse = inHouse.filter(matchesSearch);

  return (
    <div className="space-y-5">
      {/* Front Desk Header & Status Counters */}
      <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
              Front Desk Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              Shift Operations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time guest arrivals, departures, room assignments, and express walk-in handling.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenWalkIn}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            Express Walk-in
          </button>
          <button
            onClick={onOpenNewReservation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <DoorOpen className="w-4 h-4" />
            New Reservation
          </button>
        </div>
      </div>

      {/* Counter Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Arrivals Today</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{arrivals.length}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({checkedInArrivals} in / {arrivals.length - checkedInArrivals} due)
            </span>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Departures Today</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{departures.length}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({completedDepartures} out / {departures.length - completedDepartures} pending)
            </span>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Current In-House</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{inHouse.length}</span>
            <span className="text-xs text-slate-500 font-medium">active occupied rooms</span>
          </div>
        </div>

        <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ready Clean Rooms</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-800">
              {rooms.filter((r) => r.occupancyStatus === 'Vacant' && r.housekeepingStatus === 'Ready').length}
            </span>
            <span className="text-xs text-slate-500 font-medium">available to sell</span>
          </div>
        </div>
      </div>

      {/* Search & Tabs Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 p-3.5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <Tabs
          variant="segmented"
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
          tabs={[
            { id: 'all', label: 'Split Workspace' },
            { id: 'arrivals', label: 'Arrivals', count: arrivals.length },
            { id: 'departures', label: 'Departures', count: departures.length },
            { id: 'inhouse', label: 'In-House Guests', count: inHouse.length },
            { id: 'roomrack', label: 'Live Room Rack' },
          ]}
        />

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search guest, room #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-9 pl-9 pr-3 bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl text-slate-800 placeholder:text-slate-400 font-medium outline-none focus:border-blue-600 w-full sm:w-64 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* View 1: Split Workspace (Arrivals on Left, Departures on Right) */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arrivals Column */}
          <div className="bg-white/95 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Today's Expected Arrivals
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                {checkedInArrivals}/{arrivals.length} Processed
              </span>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[550px]">
              {filteredArrivals.map((res) => (
                <div
                  key={res.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onOpenReservationDetail(res.id)}
                        className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {res.guest.firstName} {res.guest.lastName}
                      </button>
                      <Badge variant="channel" channel={res.bookingSource} size="sm" />
                      {res.guest.vipStatus && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          VIP
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-gray-600">{res.refCode}</span>
                      <span>•</span>
                      <span>{res.roomTypeName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3" /> ETA {res.eta || '14:00'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-900">
                        Room {res.roomNumber || '⚠️ Unassigned'}
                      </span>
                      <span>•</span>
                      <span className={res.balanceAmount > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                        {res.balanceAmount > 0 ? `Due ${formatCurrency(res.balanceAmount)}` : 'Paid'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {res.status === 'Checked In' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> In-House
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => onOpenCheckIn(res.id)}
                        leftIcon={<DoorOpen className="w-3 h-3" />}
                      >
                        Check-in
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onOpenReservationDetail(res.id)}
                      className="text-[11px] text-gray-500"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Departures Column */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-orange-50/50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Today's Departures & Settlements
                </h3>
              </div>
              <span className="text-xs font-medium text-orange-700">
                {completedDepartures}/{departures.length} Cleared
              </span>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[550px]">
              {filteredDepartures.map((res) => (
                <div
                  key={res.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onOpenReservationDetail(res.id)}
                        className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {res.guest.firstName} {res.guest.lastName}
                      </button>
                      <span className="text-xs font-semibold text-gray-800">Room {res.roomNumber}</span>
                      {res.specialRequests?.includes('Late checkout') && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          Late 14:00
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-500 mt-1">
                      {res.nights} nights • Ref {res.refCode} • {res.roomTypeName}
                    </div>

                    <div className="mt-2 text-xs">
                      {res.balanceAmount > 0 ? (
                        <span className="text-red-600 font-bold">
                          Balance Due: {formatCurrency(res.balanceAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Folio Settled (₹0)</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {res.status === 'Checked Out' ? (
                      <span className="text-xs font-medium text-gray-400 px-2.5 py-1 rounded bg-gray-100">
                        Departed
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onOpenCheckOut(res.id)}
                        leftIcon={<LogOut className="w-3 h-3 text-orange-600" />}
                      >
                        Check-out
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onOpenReservationDetail(res.id)}
                      className="text-[11px] text-gray-500"
                    >
                      Folio Bill
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View 2: Live Room Rack View */}
      {(activeTab === 'roomrack' || activeTab === 'inhouse') && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {activeTab === 'inhouse' ? 'Currently Occupied In-House Rooms' : '30-Room Live Room Rack'}
            </h3>
            <span className="text-xs text-gray-500">Click any occupied room for quick folio / departure</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {rooms
              .filter((r) => activeTab !== 'inhouse' || r.occupancyStatus === 'Occupied')
              .map((room) => {
                const isOccupied = room.occupancyStatus === 'Occupied';
                const isDirty = room.housekeepingStatus === 'Dirty';
                const isMaintenance = room.maintenanceStatus !== 'Operational';

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (room.currentReservationId) {
                        onOpenReservationDetail(room.currentReservationId);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isMaintenance
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : isOccupied
                        ? 'bg-blue-50/80 border-blue-200 text-blue-950 hover:border-blue-300'
                        : isDirty
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950 hover:border-rose-300'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{room.roomNumber}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOccupied
                            ? 'bg-blue-600'
                            : isDirty
                            ? 'bg-rose-500'
                            : isMaintenance
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="text-[10px] text-gray-500 truncate mt-1">
                      {room.roomTypeName}
                    </div>

                    <div className="mt-2 text-xs font-semibold truncate">
                      {isOccupied ? (
                        <span className="text-blue-900">{room.currentGuestName}</span>
                      ) : isDirty ? (
                        <span className="text-rose-700">Needs Cleaning</span>
                      ) : isMaintenance ? (
                        <span className="text-amber-800">Under Repair</span>
                      ) : (
                        <span className="text-emerald-700">Ready to Sell</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
