import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  User,
  Check,
  Filter,
  Flame,
  Wrench,
  Package,
  Plus,
  Minus,
  CheckCheck,
  AlertTriangle,
  UploadCloud,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { HousekeepingTask, Room } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export interface HousekeepingViewProps {
  tasks: HousekeepingTask[];
  onToggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: HousekeepingTask['status']) => Promise<void>;
  onReportMaintenance?: (roomNumber: string, issue: string, priority: 'Low' | 'Medium' | 'Urgent') => Promise<void>;
}

interface RoomAmenityItem {
  id: string;
  name: string;
  target: number;
  stocked: number;
}

export const HousekeepingView: React.FC<HousekeepingViewProps> = ({
  tasks,
  onToggleChecklistItem,
  onUpdateTaskStatus,
  onReportMaintenance,
}) => {
  const { showToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Dirty' | 'In Progress' | 'Clean' | 'Inspected'>('All');
  const [selectedStaff, setSelectedStaff] = useState<string>('All');

  // Maintenance Flagging Modal State
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [targetRoomNumber, setTargetRoomNumber] = useState('');
  const [defectCategory, setDefectCategory] = useState('AC / HVAC Cooling');
  const [defectPriority, setDefectPriority] = useState<'Low' | 'Medium' | 'Urgent'>('Medium');
  const [defectNotes, setDefectNotes] = useState('');
  const [hasSimulatedPhoto, setHasSimulatedPhoto] = useState(false);

  // Linen & Inventory tracking state (keyed by task.id)
  const [amenitiesByTask, setAmenitiesByTask] = useState<Record<string, RoomAmenityItem[]>>(() => {
    const initial: Record<string, RoomAmenityItem[]> = {};
    tasks.forEach((t) => {
      initial[t.id] = [
        { id: 'bath-towels', name: 'Bath Towels', target: 2, stocked: 2 },
        { id: 'hand-towels', name: 'Hand Towels', target: 2, stocked: 2 },
        { id: 'water-bottles', name: 'Water Bottles (500ml)', target: 2, stocked: 2 },
        { id: 'dental-kits', name: 'Dental / Vanity Kit', target: 1, stocked: 1 },
      ];
    });
    return initial;
  });

  const [expandedInventoryTask, setExpandedInventoryTask] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
    if (selectedStaff !== 'All' && t.assignedStaff !== selectedStaff) return false;
    return true;
  });

  const dirtyCount = tasks.filter((t) => t.status === 'Dirty').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Cleaning').length;
  const cleanCount = tasks.filter((t) => t.status === 'Clean').length;
  const inspectedCount = tasks.filter((t) => t.status === 'Inspected').length;

  const handleStatusChange = async (taskId: string, roomNum: string, newStatus: HousekeepingTask['status']) => {
    await onUpdateTaskStatus(taskId, newStatus);
    showToast({
      title: `Room ${roomNum} Updated`,
      description: `Housekeeping status transitioned to ${newStatus}.`,
      type: newStatus === 'Clean' || newStatus === 'Inspected' ? 'success' : 'info',
    });
  };

  const handleOpenMaintenanceModal = (roomNumber: string) => {
    setTargetRoomNumber(roomNumber);
    setDefectNotes('');
    setHasSimulatedPhoto(false);
    setDefectPriority('Medium');
    setMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async () => {
    if (!defectNotes) {
      showToast({
        title: 'Notes Required',
        description: 'Please describe the maintenance issue.',
        type: 'error',
      });
      return;
    }

    if (onReportMaintenance) {
      await onReportMaintenance(targetRoomNumber, `${defectCategory}: ${defectNotes}`, defectPriority);
    }

    showToast({
      title: 'Maintenance Defect Reported',
      description: `Room ${targetRoomNumber} flagged as Under Maintenance (${defectPriority} priority).`,
      type: 'warning',
    });

    setMaintenanceModalOpen(false);
  };

  const handleAdjustAmenity = (taskId: string, amenityId: string, delta: number) => {
    setAmenitiesByTask((prev) => {
      const current = prev[taskId] || [];
      const updated = current.map((item) => {
        if (item.id === amenityId) {
          const newQty = Math.max(0, Math.min(item.target + 4, item.stocked + delta));
          return { ...item, stocked: newQty };
        }
        return item;
      });
      return { ...prev, [taskId]: updated };
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Mobile-friendly operations header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-bold text-gray-950 font-sans">
              Housekeeping App
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
              Mobile Duty Roster
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Touch-friendly room cleaning checklists, consumable replenishment, and rapid maintenance reporting.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              selectedStatus === 'All' ? 'bg-[#172033] text-white border-[#172033]' : 'bg-gray-50 text-gray-700'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedStatus('Dirty')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              selectedStatus === 'Dirty' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            Dirty ({dirtyCount})
          </button>
          <button
            onClick={() => setSelectedStatus('In Progress')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              selectedStatus === 'In Progress' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setSelectedStatus('Clean')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              selectedStatus === 'Clean' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            Clean ({cleanCount})
          </button>
          <button
            onClick={() => setSelectedStatus('Inspected')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              selectedStatus === 'Inspected' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            Inspected ({inspectedCount})
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const completedCount = task.checklist.filter((i) => i.done).length;
          const totalCount = task.checklist.length;
          const progressPercent = Math.round((completedCount / totalCount) * 100);
          const amenities = amenitiesByTask[task.id] || [];
          const isInventoryExpanded = expandedInventoryTask === task.id;

          return (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-gray-300 transition-all space-y-3"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center font-bold text-gray-950 shrink-0">
                    <span className="text-[10px] text-gray-400 font-normal leading-tight">ROOM</span>
                    <span className="text-base font-extrabold text-gray-900 leading-tight">
                      {task.roomNumber}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">{task.roomTypeName}</span>
                      {task.priority === 'High' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-600" /> VIP Arrival Priority
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                      <User className="w-3 h-3 text-gray-400" /> Assigned: <strong>{task.assignedStaff}</strong>
                      <span>•</span>
                      <span>Target: {task.estimatedMinutes}m</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge variant="status" status={task.status} size="md" dot />
                  <span className="text-[10px] text-gray-400">
                    {completedCount} of {totalCount} cleaning points
                  </span>
                </div>
              </div>

              {/* Fast Status Pipeline Controls */}
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                  Fast Transition:
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                  {(['Dirty', 'Cleaning', 'Clean', 'Inspected'] as const).map((st) => {
                    const isActive = task.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(task.id, task.roomNumber, st)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? st === 'Clean'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : st === 'Inspected'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : st === 'Cleaning'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cleaning Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Touch Checklist Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {task.checklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleChecklistItem(task.id, item.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      item.done
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                        : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        item.done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Linen & Consumables Replenishment Collapsible Section */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/40">
                <button
                  type="button"
                  onClick={() => setExpandedInventoryTask(isInventoryExpanded ? null : task.id)}
                  className="w-full p-2.5 flex items-center justify-between text-xs font-semibold text-gray-800 hover:bg-gray-100/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>Linen & Consumable Replenishment</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      ({amenities.filter((a) => a.stocked >= a.target).length}/{amenities.length} restocked)
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      isInventoryExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isInventoryExpanded && (
                  <div className="p-3 bg-white border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {amenities.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50/60"
                      >
                        <div>
                          <span className="font-semibold text-gray-800 block">{item.name}</span>
                          <span className="text-[10px] text-gray-400">Target standard: {item.target} units</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustAmenity(task.id, item.id, -1)}
                            className="w-6 h-6 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-gray-900 font-mono">
                            {item.stocked}
                          </span>
                          <button
                            onClick={() => handleAdjustAmenity(task.id, item.id, 1)}
                            className="w-6 h-6 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions: Flag Maintenance & Photo */}
              <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {task.notes ? (
                  <p className="text-xs text-amber-800 bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-200/60">
                    <strong>Note:</strong> {task.notes}
                  </p>
                ) : (
                  <span className="text-[11px] text-gray-400">Routine room turnover</span>
                )}

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Maintenance Flagging Trigger */}
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-amber-800 border-amber-300 hover:bg-amber-50"
                    leftIcon={<Wrench className="w-3 h-3 text-amber-600" />}
                    onClick={() => handleOpenMaintenanceModal(task.roomNumber)}
                  >
                    Report Defect
                  </Button>

                  {/* Photo attachment simulation */}
                  <button
                    onClick={() =>
                      showToast({
                        title: 'Inspection Photo Attached',
                        description: `Snapshot saved to audit log for Room ${task.roomNumber}.`,
                        type: 'info',
                      })
                    }
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    title="Attach Inspection Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Maintenance Defect Modal */}
      <Modal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        title={`Report Maintenance Issue — Room ${targetRoomNumber}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setMaintenanceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMaintenance}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Log Maintenance Defect
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Issue Category</label>
            <select
              value={defectCategory}
              onChange={(e) => setDefectCategory(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-blue-600"
            >
              <option value="AC / HVAC Cooling">AC / HVAC Cooling & Thermostat</option>
              <option value="Plumbing & Hot Water">Plumbing, Geyser & Water Pressure</option>
              <option value="Electrical & Lighting">Electrical, Sockets & Lighting</option>
              <option value="Door Lock & Keycard">Door Lock, Keycard & Safe</option>
              <option value="Furniture & Fixtures">Furniture, TV or Bed Frame</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Urgency / Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'Urgent'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDefectPriority(lvl)}
                  className={`p-2 rounded-lg border text-center font-bold text-xs transition-colors cursor-pointer ${
                    defectPriority === lvl
                      ? lvl === 'Urgent'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Defect Description</label>
            <textarea
              rows={3}
              value={defectNotes}
              onChange={(e) => setDefectNotes(e.target.value)}
              placeholder="e.g. Geyser is tripping electrical breaker when turned on..."
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-800 outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {/* Photo attachment simulation */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Photo Evidence (Simulated)</label>
            <div
              onClick={() => setHasSimulatedPhoto(!hasSimulatedPhoto)}
              className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            >
              {hasSimulatedPhoto ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>evidence_photo_rm_{targetRoomNumber}.jpg attached (Click to remove)</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <UploadCloud className="w-4 h-4 text-gray-400" />
                  <span>Click to attach photo snapshot from mobile camera</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
