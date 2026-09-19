import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Calendar,
  CreditCard,
  Wrench,
  Check,
} from 'lucide-react';
import { OperationalNotification } from '../../types';
import {
  useRoomsQuery,
  useReservationsQuery,
  useMaintenanceTicketsQuery,
  useFoliosQuery,
} from '../../services/api/queries';
import { useAppStore } from '../../stores/useAppStore';

export interface NotificationCenterProps {
  onNavigate: (viewId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const currentProperty = useAppStore((state) => state.currentProperty);
  const { data: rooms = [] } = useRoomsQuery(currentProperty?.id);
  const { data: reservations = [] } = useReservationsQuery(currentProperty?.id);
  const { data: maintenanceTickets = [] } = useMaintenanceTicketsQuery();
  const { data: folios = [] } = useFoliosQuery();

  const today = new Date().toISOString().split('T')[0];

  const notifications: OperationalNotification[] = React.useMemo(() => {
    const list: OperationalNotification[] = [];

    // 1. Pending Arrivals
    const pendingArrivals = reservations.filter(
      (r) => r.checkInDate === today && r.status === 'Confirmed'
    );
    if (pendingArrivals.length > 0) {
      list.push({
        id: 'notif-arrivals',
        title: `${pendingArrivals.length} Arrival(s) Pending Check-In`,
        message: `${pendingArrivals.slice(0, 3).map((r) => r.guest.firstName).join(', ')} arriving today. Front desk verification pending.`,
        type: 'reservation',
        timestamp: 'Today',
        read: readIds.has('notif-arrivals'),
        link: 'frontdesk',
      });
    }

    // 2. Dirty Rooms requiring Housekeeping
    const dirtyRooms = rooms.filter((r) => r.housekeepingStatus === 'Dirty');
    if (dirtyRooms.length > 0) {
      list.push({
        id: 'notif-hsk',
        title: `${dirtyRooms.length} Room(s) Queued for Housekeeping`,
        message: `Rooms ${dirtyRooms.slice(0, 4).map((r) => r.roomNumber).join(', ')} turnover clean required.`,
        type: 'housekeeping',
        timestamp: 'Live',
        read: readIds.has('notif-hsk'),
        link: 'housekeeping',
      });
    }

    // 3. Open Maintenance Tickets
    const openTickets = maintenanceTickets.filter((t) => t.status !== 'Resolved');
    if (openTickets.length > 0) {
      list.push({
        id: 'notif-mnt',
        title: `${openTickets.length} Active Maintenance Ticket(s)`,
        message: `${openTickets[0].title} (Room ${openTickets[0].roomNumber})`,
        type: 'maintenance',
        timestamp: 'Active',
        read: readIds.has('notif-mnt'),
        link: 'maintenance',
      });
    }

    // 4. Unsettled Balances
    const pendingFolios = folios.filter((f) => f.status === 'Open' && f.balance > 0);
    if (pendingFolios.length > 0) {
      const totalOutstanding = pendingFolios.reduce((acc, f) => acc + f.balance, 0);
      list.push({
        id: 'notif-folio',
        title: `${pendingFolios.length} Open Folio(s) with Balance`,
        message: `Total pending receivable balance across folios is INR ${totalOutstanding.toLocaleString('en-IN')}`,
        type: 'payment_due',
        timestamp: 'Live',
        read: readIds.has('notif-folio'),
        link: 'folios',
      });
    }

    return list;
  }, [rooms, reservations, maintenanceTickets, folios, today, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const getIcon = (type: OperationalNotification['type']) => {
    switch (type) {
      case 'reservation':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'ota_failure':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'payment_due':
        return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'housekeeping':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Operational Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No notifications</div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      if (item.link) {
                        onNavigate(item.link);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      item.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200/60 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-semibold text-gray-900 truncate">{item.title}</h5>
                        <span className="text-[10px] text-gray-400 shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-500">
              Operational system logs & automated OTA alerts
            </div>
          </div>
        </>
      )}
    </div>
  );
};
