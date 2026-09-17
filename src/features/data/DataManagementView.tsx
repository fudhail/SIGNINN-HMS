import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Download,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  Calendar,
  CreditCard,
  Building,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Mail,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { Reservation, Room, Guest, BookingSource, ReservationStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';

export interface DataManagementViewProps {
  reservations: Reservation[];
  rooms: Room[];
  onOpenReservationDetail: (resId: string) => void;
  onOpenNewReservation: () => void;
  onOpenCheckIn: (resId?: string) => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  reservations,
  rooms,
  onOpenReservationDetail,
  onOpenNewReservation,
  onOpenCheckIn,
}) => {
  const { showToast } = useToast();

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'checkIn' | 'guest' | 'amount' | 'status'>('checkIn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Extract unique room types for filter
  const roomTypes = useMemo(() => {
    const set = new Set(reservations.map((r) => r.roomTypeName));
    return Array.from(set);
  }, [reservations]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return reservations
      .filter((r) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchGuest = `${r.guest.firstName} ${r.guest.lastName}`.toLowerCase().includes(q);
          const matchRef = r.refCode.toLowerCase().includes(q);
          const matchRoom = (r.roomNumber || '').toLowerCase().includes(q);
          const matchEmail = (r.guest.email || '').toLowerCase().includes(q);
          if (!matchGuest && !matchRef && !matchRoom && !matchEmail) return false;
        }

        // Status filter
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

        // Source filter
        if (sourceFilter !== 'ALL' && r.bookingSource !== sourceFilter) return false;

        // Room Type filter
        if (roomTypeFilter !== 'ALL' && r.roomTypeName !== roomTypeFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'checkIn') comp = a.checkInDate.localeCompare(b.checkInDate);
        if (sortBy === 'guest') comp = `${a.guest.firstName} ${a.guest.lastName}`.localeCompare(`${b.guest.firstName} ${b.guest.lastName}`);
        if (sortBy === 'amount') comp = a.totalAmount - b.totalAmount;
        if (sortBy === 'status') comp = a.status.localeCompare(b.status);
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [reservations, searchQuery, statusFilter, sourceFilter, roomTypeFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRecords.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ['Ref Code', 'Guest Name', 'Email', 'Room Type', 'Room Number', 'Check In', 'Check Out', 'Total Amount', 'Balance', 'Status', 'Source'];
    const rows = filteredRecords.map((r) => [
      r.refCode,
      `"${r.guest.firstName} ${r.guest.lastName}"`,
      r.guest.email || '',
      `"${r.roomTypeName}"`,
      r.roomNumber || 'Unassigned',
      r.checkInDate,
      r.checkOutDate,
      r.totalAmount,
      r.balanceAmount,
      r.status,
      r.bookingSource,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIGNINN-Records-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      title: 'Records Exported',
      description: `Downloaded CSV with ${filteredRecords.length} records.`,
      type: 'success',
    });
  };

  const simulateRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast({
        title: 'Records Synchronized',
        description: 'Refreshed with cloud database.',
        type: 'info',
      });
    }, 450);
  };

  const totalFilteredValue = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/85 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              Master Record Explorer
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filteredRecords.length} Records
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Search, filter, inspect, and export all guest folios, bookings, and room inventory records across properties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateRefresh}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewReservation}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Record
          </Button>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/85 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, ref code, room, email..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View mode toggle + Quick metrics */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500 pr-2 border-r border-gray-200">
              <span>Total Value: <strong className="text-gray-900 font-semibold">{formatCurrency(totalFilteredValue)}</strong></span>
            </div>

            {/* Layout Toggle (Table vs Cards) */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-medium border border-gray-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Data Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Interactive Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Strip */}
        <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked In">Checked In</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Channels</option>
            <option value="Direct">Direct Website</option>
            <option value="Booking.com">Booking.com</option>
            <option value="MakeMyTrip">MakeMyTrip</option>
            <option value="Agoda">Agoda</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Expedia">Expedia</option>
            <option value="Walk-in">Walk-in</option>
          </select>

          {/* Room type filter */}
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Room Types</option>
            {roomTypes.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>

          {/* Sort By filter */}
          <div className="ml-auto flex items-center gap-1 text-xs">
            <span className="text-gray-400">Sort:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [any, any];
                setSortBy(by);
                setSortOrder(order);
              }}
              className="text-xs py-1 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="checkIn-asc">Check-In (Soonest)</option>
              <option value="checkIn-desc">Check-In (Latest)</option>
              <option value="guest-asc">Guest Name (A-Z)</option>
              <option value="amount-desc">Amount (Highest)</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-900 text-white px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-indigo-700 px-2 py-0.5 rounded-md">
              {selectedIds.length} Selected
            </span>
            <span>of {filteredRecords.length} records</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                showToast({
                  title: 'Print Queue Ready',
                  description: `Generated registration cards for ${selectedIds.length} reservations.`,
                  type: 'info',
                });
              }}
              className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Cards
            </button>
            <button
              onClick={() => {
                showToast({
                  title: 'Dispatched Confirmation SMS',
                  description: `Sent check-in reminders to ${selectedIds.length} guests.`,
                  type: 'success',
                });
              }}
              className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" /> Message Guests
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-indigo-300 hover:text-white transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Records Content Area */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/85 p-12 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">No records match your filters</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or clearing active status and channel filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setSourceFilter('ALL');
              setRoomTypeFilter('ALL');
            }}
            className="mt-4"
          >
            Reset All Filters
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* CLEAN DATA TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200/85 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="p-3.5 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </th>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Guest Name</th>
                  <th className="p-3.5">Room & Type</th>
                  <th className="p-3.5">Stay Dates</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Folio Total</th>
                  <th className="p-3.5 text-right">Balance</th>
                  <th className="p-3.5 pr-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredRecords.map((res) => {
                  const isSelected = selectedIds.includes(res.id);
                  return (
                    <tr
                      key={res.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(res.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5 font-mono font-semibold text-gray-900">
                        <button
                          onClick={() => onOpenReservationDetail(res.id)}
                          className="hover:text-indigo-600 hover:underline cursor-pointer"
                        >
                          {res.refCode}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900">
                          {res.guest.firstName} {res.guest.lastName}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                          {res.guest.email || res.guest.phone || 'No direct contact'}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-gray-900">
                          {res.roomNumber ? `Room ${res.roomNumber}` : 'Unassigned'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[140px]">
                          {res.roomTypeName}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-gray-900">
                          {formatDate(res.checkInDate)} → {formatDate(res.checkOutDate)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {res.nights} {res.nights === 1 ? 'night' : 'nights'} • {res.adults}A, {res.children}C
                        </div>
                      </td>

                      <td className="p-3.5">
                        <Badge variant="channel" channel={res.bookingSource} size="sm" />
                      </td>

                      <td className="p-3.5">
                        <Badge variant="status" status={res.status} size="sm" />
                      </td>

                      <td className="p-3.5 text-right font-semibold text-gray-900">
                        {formatCurrency(res.totalAmount)}
                      </td>

                      <td className="p-3.5 text-right">
                        {res.balanceAmount > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            {formatCurrency(res.balanceAmount)}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700 text-[11px]">
                            Settled (₹0)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenReservationDetail(res.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Inspect Record Folio"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {res.status === 'Confirmed' && (
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => onOpenCheckIn(res.id)}
                            >
                              Check-in
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table pagination footer */}
          <div className="p-3.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredRecords.length} of {reservations.length} records in system
            </span>
            <span className="text-[11px] text-gray-400">
              Page 1 of 1 • Multi-tenant live sync active
            </span>
          </div>
        </div>
      ) : (
        /* INTERACTIVE CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((res) => {
            const isSelected = selectedIds.includes(res.id);
            return (
              <div
                key={res.id}
                onClick={() => onOpenReservationDetail(res.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-md'
                    : 'border-gray-200/85 bg-white hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {/* Top strip */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {res.refCode}
                      </span>
                      <Badge variant="status" status={res.status} size="xs" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-950 mt-1">
                      {res.guest.firstName} {res.guest.lastName}
                    </h4>
                  </div>

                  <Badge variant="channel" channel={res.bookingSource} size="xs" />
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Room:</span>
                    <span className="font-semibold text-gray-900">
                      {res.roomNumber ? `Room ${res.roomNumber}` : 'Unassigned'} • {res.roomTypeName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Stay:</span>
                    <span className="font-medium text-gray-800">
                      {res.checkInDate} to {res.checkOutDate} ({res.nights}n)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-gray-400">Folio Balance:</span>
                    <span className="text-xs">
                      {res.balanceAmount > 0 ? (
                        <span className="font-bold text-amber-700">Due {formatCurrency(res.balanceAmount)}</span>
                      ) : (
                        <span className="font-semibold text-emerald-700">Paid in Full</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-950">
                    {formatCurrency(res.totalAmount)}
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReservationDetail(res.id);
                    }}
                  >
                    View Folio
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
