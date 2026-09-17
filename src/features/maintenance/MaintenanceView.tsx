import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Filter,
} from 'lucide-react';
import { MaintenanceTicket, Room } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export interface MaintenanceViewProps {
  tickets: MaintenanceTicket[];
  rooms: Room[];
  onAddTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'createdAt'>) => void;
  onUpdateTicketStatus: (ticketId: string, status: MaintenanceTicket['status']) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  tickets,
  rooms,
  onAddTicket,
  onUpdateTicketStatus,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Form states
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceTicket['category']>('Air Conditioning');
  const [severity, setSeverity] = useState<MaintenanceTicket['severity']>('Medium');
  const [isRoomBlocked, setIsRoomBlocked] = useState(true);
  const [assignedTo, setAssignedTo] = useState('Harish Varma (Engineering)');

  const filteredTickets = tickets.filter((t) => {
    if (filterSeverity !== 'all' && t.severity !== filterSeverity) return false;
    return true;
  });

  const handleCreate = () => {
    if (!title) {
      showToast({ title: 'Title Required', description: 'Please enter a ticket title.', type: 'error' });
      return;
    }
    const room = rooms.find((r) => r.id === roomId);
    onAddTicket({
      roomId: room?.id || 'r-1',
      roomNumber: room?.roomNumber || '101',
      title,
      category,
      severity,
      status: 'Open',
      reportedBy: 'Front Desk Duty Manager',
      assignedTo,
      isRoomBlocked,
      estimatedHours: 4,
    });
    showToast({
      title: 'Ticket Logged',
      description: `Maintenance order generated for Room ${room?.roomNumber}.`,
      type: 'success',
    });
    setIsModalOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              Maintenance & Room Blocks
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track repairs, manage engineering tickets, and control Out-of-Order room inventory locks.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Maintenance Ticket
        </Button>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">Open Tickets ({filteredTickets.length})</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Filter Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="h-7 px-2 bg-white border border-gray-200 rounded text-gray-700 outline-none"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTickets.map((t) => (
            <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-900">Room {t.roomNumber}</span>
                  <span className="text-xs font-semibold text-gray-700">• {t.title}</span>
                  <Badge variant="status" status={t.status} size="sm" />
                  {t.isRoomBlocked && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      Room Blocked (OOO)
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-3">
                  <span>Category: <strong>{t.category}</strong></span>
                  <span>•</span>
                  <span>Assigned to: <strong>{t.assignedTo}</strong></span>
                  <span>•</span>
                  <span>Reported on {new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.status !== 'Resolved' ? (
                  <Button
                    size="xs"
                    variant="success"
                    onClick={() => {
                      onUpdateTicketStatus(t.id, 'Resolved');
                      showToast({
                        title: 'Ticket Resolved',
                        description: `Room ${t.roomNumber} repair completed and released to service.`,
                        type: 'success',
                      });
                    }}
                    leftIcon={<CheckCircle2 className="w-3 h-3" />}
                  >
                    Resolve & Release Room
                  </Button>
                ) : (
                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        title="Create Maintenance Order"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Target Room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={rooms.map((r) => ({
              value: r.id,
              label: `Room ${r.roomNumber} (${r.roomTypeName}) - Floor ${r.floor}`,
            }))}
          />

          <Input
            label="Issue Summary *"
            placeholder="e.g. Master AC not cooling, fan whistling"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Trade Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: 'Air Conditioning', label: 'Air Conditioning (HVAC)' },
                { value: 'Plumbing', label: 'Plumbing / Water' },
                { value: 'Electrical', label: 'Electrical / Lighting' },
                { value: 'Carpentry', label: 'Furniture / Carpentry' },
                { value: 'Door Locks', label: 'Keycard Locks' },
                { value: 'Painting', label: 'Civil / Painting' },
              ]}
            />

            <Select
              label="Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              options={[
                { value: 'Critical', label: 'Critical (Take room out)' },
                { value: 'High', label: 'High Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'Low', label: 'Low Priority' },
              ]}
            />
          </div>

          <label className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={isRoomBlocked}
              onChange={(e) => setIsRoomBlocked(e.target.checked)}
              className="rounded border-gray-300 text-amber-600"
            />
            <span className="font-semibold text-amber-900">
              Block Room Inventory (Lock room out-of-order from OTAs)
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
};
