import React, { useState, useMemo } from 'react';
import {
  BedDouble,
  Grid,
  List,
  Sparkles,
  Wrench,
  UserPlus,
  History,
  Filter,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
} from 'lucide-react';
import { Room, RoomType } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { RoomStatusIndicator } from '../../components/domain';

export interface RoomManagementViewProps {
  rooms: Room[];
  roomTypes: RoomType[];
  onUpdateHousekeepingStatus: (roomId: string, status: Room['housekeepingStatus']) => Promise<void>;
  onUpdateMaintenanceStatus: (roomId: string, status: Room['maintenanceStatus']) => Promise<void>;
  onOpenWalkInForRoom: (roomId: string) => void;
  onOpenReservationDetail?: (resId: string) => void;
}

export const RoomManagementView: React.FC<RoomManagementViewProps> = ({
  rooms,
  roomTypes,
  onUpdateHousekeepingStatus,
  onUpdateMaintenanceStatus,
  onOpenWalkInForRoom,
  onOpenReservationDetail,
}) => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHKStatus, setSelectedHKStatus] = useState<string>('all');
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>('all');

  const availableFloors = useMemo(() => {
    return Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((r) => {
        if (selectedFloor !== 'all' && r.floor.toString() !== selectedFloor) return false;
        if (selectedType !== 'all' && r.roomTypeId !== selectedType) return false;
        if (selectedHKStatus !== 'all' && r.housekeepingStatus !== selectedHKStatus) return false;
        if (selectedOccupancy !== 'all' && r.occupancyStatus !== selectedOccupancy) return false;
        return true;
      })
      .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
  }, [rooms, selectedFloor, selectedType, selectedHKStatus, selectedOccupancy]);

  const handleMarkClean = async (roomId: string, roomNumber: string) => {
    await onUpdateHousekeepingStatus(roomId, 'Ready');
    showToast({
      title: 'Room Cleaned & Ready',
      description: `Room ${roomNumber} updated to Ready status.`,
      type: 'success',
    });
  };

  const handleMarkDirty = async (roomId: string, roomNumber: string) => {
    await onUpdateHousekeepingStatus(roomId, 'Dirty');
    showToast({
      title: 'Room Marked Dirty',
      description: `Turnover requested for Room ${roomNumber}.`,
      type: 'info',
    });
  };

  const handleToggleMaintenance = async (room: Room) => {
    const newStatus = room.maintenanceStatus === 'Operational' ? 'Out of Order' : 'Operational';
    await onUpdateMaintenanceStatus(room.id, newStatus);
    showToast({
      title: 'Maintenance Status Updated',
      description: `Room ${room.roomNumber} is now ${newStatus}.`,
      type: newStatus === 'Operational' ? 'success' : 'warning',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
            Room Inventory & Room Rack
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Physical room rack monitoring {rooms.length} rooms across {availableFloors.length} floors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Grid Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Detailed Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 flex-wrap text-xs">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400" /> Filters:
        </span>

        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Floors</option>
          {availableFloors.map((floor) => (
            <option key={floor} value={floor.toString()}>
              Floor {floor}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Room Types</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>

        <select
          value={selectedHKStatus}
          onChange={(e) => setSelectedHKStatus(e.target.value)}
          className="h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Cleaning States</option>
          <option value="Ready">Ready / Inspected</option>
          <option value="Dirty">Dirty Turnover</option>
          <option value="In Progress">Cleaning In Progress</option>
        </select>

        <select
          value={selectedOccupancy}
          onChange={(e) => setSelectedOccupancy(e.target.value)}
          className="h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Occupancy States</option>
          <option value="Vacant">Vacant</option>
          <option value="Occupied">Occupied In-House</option>
        </select>

        <div className="ml-auto text-gray-500">
          Showing <strong>{filteredRooms.length}</strong> of {rooms.length} rooms
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredRooms.map((room) => {
            const isOccupied = room.occupancyStatus === 'Occupied';
            const isDirty = room.housekeepingStatus === 'Dirty';
            const isOutOfOrder = room.maintenanceStatus !== 'Operational';

            return (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-bold text-gray-950">Room {room.roomNumber}</span>
                      <span className="text-[11px] text-gray-500 block truncate max-w-[130px]">
                        {room.roomTypeName}
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[10px] text-gray-400 block">Fl {room.floor}</span>
                      <RoomStatusIndicator
                        occupancy={room.occupancyStatus}
                        housekeeping={room.housekeepingStatus}
                        size="xs"
                        variant="stacked"
                      />
                    </div>
                  </div>

                  <div className="mt-3 py-2 border-t border-b border-gray-100 min-h-[44px]">
                    {isOccupied ? (
                      <div>
                        <span className="text-[10px] text-blue-600 font-semibold block uppercase tracking-wider">
                          Occupied In-House
                        </span>
                        <span className="text-xs font-bold text-gray-900 truncate block">
                          {room.currentGuestName}
                        </span>
                      </div>
                    ) : isOutOfOrder ? (
                      <div className="text-amber-800 text-xs font-semibold flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" /> Out of Order
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] text-emerald-700 font-semibold block uppercase tracking-wider">
                          Vacant
                        </span>
                        <span className="text-xs text-gray-500">Ready for guest allocation</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Quick Operational Actions */}
                <div className="mt-3 pt-2 flex items-center justify-between gap-1.5 text-xs">
                  {isDirty ? (
                    <button
                      onClick={() => handleMarkClean(room.id, room.roomNumber)}
                      className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Mark Clean
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkDirty(room.id, room.roomNumber)}
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Turnover
                    </button>
                  )}

                  {!isOccupied && !isOutOfOrder && room.housekeepingStatus === 'Ready' && (
                    <button
                      onClick={() => onOpenWalkInForRoom(room.id)}
                      className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Walk-in
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleMaintenance(room)}
                    className="p-1 text-gray-400 hover:text-amber-700 rounded hover:bg-gray-100 cursor-pointer ml-auto"
                    title={isOutOfOrder ? 'Set In Service' : 'Put Under Maintenance'}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                <th className="p-3">Room #</th>
                <th className="p-3">Type</th>
                <th className="p-3">Floor</th>
                <th className="p-3" colSpan={2}>Status & Housekeeping</th>
                <th className="p-3">Current Resident</th>
                <th className="p-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-bold text-gray-950">{room.roomNumber}</td>
                  <td className="p-3 text-gray-700">{room.roomTypeName}</td>
                  <td className="p-3 text-gray-500">Floor {room.floor}</td>
                  <td className="p-3" colSpan={2}>
                    <RoomStatusIndicator
                      occupancy={room.occupancyStatus}
                      housekeeping={room.housekeepingStatus}
                      size="sm"
                      variant="split"
                    />
                  </td>
                  <td className="p-3 text-gray-800 font-medium">
                    {room.currentGuestName || '—'}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {room.housekeepingStatus === 'Dirty' ? (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleMarkClean(room.id, room.roomNumber)}
                      >
                        Clean
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleMarkDirty(room.id, room.roomNumber)}
                      >
                        Dirty
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
