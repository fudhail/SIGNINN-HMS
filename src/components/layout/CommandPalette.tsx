import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  UserPlus,
  ArrowRight,
  BedDouble,
  CreditCard,
  Sparkles,
  Layers,
  FileText,
  DoorOpen,
  X,
  Radio,
  Database,
} from 'lucide-react';
import {
  useReservationsQuery,
  useRoomsQuery,
  useGuestsQuery,
} from '../../services/api/queries';
import { useAppStore } from '../../stores/useAppStore';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  onSelectReservation?: (resId: string) => void;
  onOpenCheckIn?: () => void;
  onOpenWalkIn?: () => void;
  onOpenNewReservation?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectReservation,
  onOpenCheckIn,
  onOpenWalkIn,
  onOpenNewReservation,
}) => {
  const [query, setQuery] = useState('');

  const currentProperty = useAppStore((state) => state.currentProperty);
  const { data: reservations = [] } = useReservationsQuery(currentProperty?.id);
  const { data: rooms = [] } = useRoomsQuery(currentProperty?.id);
  const { data: guests = [] } = useGuestsQuery();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Quick Action Items
  const quickActions = [
    {
      id: 'act-new-res',
      label: 'New Reservation',
      category: 'Action',
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      run: () => {
        onClose();
        if (onOpenNewReservation) onOpenNewReservation();
      },
    },
    {
      id: 'act-walk-in',
      label: 'Express Walk-in Check-in',
      category: 'Action',
      icon: <UserPlus className="w-4 h-4 text-emerald-600" />,
      run: () => {
        onClose();
        if (onOpenWalkIn) onOpenWalkIn();
      },
    },
    {
      id: 'act-checkin',
      label: 'Guest Check-in Flow',
      category: 'Action',
      icon: <DoorOpen className="w-4 h-4 text-purple-600" />,
      run: () => {
        onClose();
        if (onOpenCheckIn) onOpenCheckIn();
      },
    },
    {
      id: 'act-nav-cal',
      label: 'Open Reservation Calendar',
      category: 'Navigate',
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      run: () => {
        onClose();
        onNavigate('reservations');
      },
    },
    {
      id: 'act-nav-records',
      label: 'Master Records Explorer & Data Management',
      category: 'Navigate',
      icon: <Database className="w-4 h-4 text-emerald-600" />,
      run: () => {
        onClose();
        onNavigate('records');
      },
    },
    {
      id: 'act-nav-hk',
      label: 'Open Housekeeping Tasks',
      category: 'Navigate',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      run: () => {
        onClose();
        onNavigate('housekeeping');
      },
    },
    {
      id: 'act-nav-channels',
      label: 'Open OTA Channel Manager',
      category: 'Navigate',
      icon: <Radio className="w-4 h-4 text-sky-500" />,
      run: () => {
        onClose();
        onNavigate('channels');
      },
    },
    {
      id: 'act-nav-folios',
      label: 'View Folios & Billing',
      category: 'Navigate',
      icon: <CreditCard className="w-4 h-4 text-indigo-500" />,
      run: () => {
        onClose();
        onNavigate('folios');
      },
    },
  ];

  // Filtered reservations from live DB query
  const matchedReservations = reservations.filter((r) =>
    cleanQuery === ''
      ? false
      : (r.refCode && r.refCode.toLowerCase().includes(cleanQuery)) ||
        (r.guest?.firstName && r.guest.firstName.toLowerCase().includes(cleanQuery)) ||
        (r.guest?.lastName && r.guest.lastName.toLowerCase().includes(cleanQuery)) ||
        (r.roomNumber && r.roomNumber.includes(cleanQuery))
  ).slice(0, 4);

  // Filtered rooms from live DB query
  const matchedRooms = rooms.filter((rm) =>
    cleanQuery === ''
      ? false
      : (rm.roomNumber && rm.roomNumber.includes(cleanQuery)) ||
        (rm.roomTypeName && rm.roomTypeName.toLowerCase().includes(cleanQuery)) ||
        (rm.currentGuestName && rm.currentGuestName.toLowerCase().includes(cleanQuery))
  ).slice(0, 3);

  // Filtered guests from live DB query
  const matchedGuests = guests.filter((g) =>
    cleanQuery === ''
      ? false
      : `${g.firstName} ${g.lastName}`.toLowerCase().includes(cleanQuery) ||
        (g.email && g.email.toLowerCase().includes(cleanQuery)) ||
        (g.phone && g.phone.includes(cleanQuery))
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#172033]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, guest name, reservation reference, or room number..."
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent border-none outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Matched Reservations */}
          {matchedReservations.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Reservations
              </div>
              <div className="mt-1 space-y-1">
                {matchedReservations.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      onClose();
                      onNavigate('reservations');
                      if (onSelectReservation) onSelectReservation(res.id);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer group text-xs text-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-semibold text-gray-900">{res.refCode}</span>
                        <span className="text-gray-500 ml-2 font-normal">
                          {res.guest.firstName} {res.guest.lastName}
                        </span>
                        <span className="text-gray-400 ml-2">
                          (Room {res.roomNumber || 'Unassigned'})
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 group-hover:text-blue-600 flex items-center gap-1">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Rooms */}
          {matchedRooms.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Rooms
              </div>
              <div className="mt-1 space-y-1">
                {matchedRooms.map((rm) => (
                  <div
                    key={rm.id}
                    onClick={() => {
                      onClose();
                      onNavigate('rooms');
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer group text-xs text-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <BedDouble className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-semibold text-gray-900">Room {rm.roomNumber}</span>
                        <span className="text-gray-500 ml-2 font-normal">{rm.roomTypeName}</span>
                        {rm.currentGuestName && (
                          <span className="text-blue-600 ml-2">({rm.currentGuestName})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 group-hover:text-blue-600 flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Guests */}
          {matchedGuests.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Guests
              </div>
              <div className="mt-1 space-y-1">
                {matchedGuests.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      onClose();
                      onNavigate('guests');
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer group text-xs text-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[10px] text-gray-600">
                        {g.firstName[0]}
                        {g.lastName[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {g.firstName} {g.lastName}
                        </span>
                        <span className="text-gray-400 ml-2">{g.phone}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 group-hover:text-blue-600 flex items-center gap-1">
                      Profile <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions / Navigation */}
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {cleanQuery ? 'Actions & Destinations' : 'Suggested Actions'}
            </div>
            <div className="mt-1 space-y-1">
              {quickActions
                .filter((a) => cleanQuery === '' || a.label.toLowerCase().includes(cleanQuery))
                .map((action) => (
                  <div
                    key={action.id}
                    onClick={action.run}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer group text-xs text-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {action.icon}
                      <span className="font-medium text-gray-900">{action.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      {action.category}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Search guests, rooms, reservations, or run quick actions</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">
              ↑
            </kbd>
            <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">
              ↓
            </kbd>
            to navigate
          </span>
        </div>
      </div>
    </div>
  );
};
