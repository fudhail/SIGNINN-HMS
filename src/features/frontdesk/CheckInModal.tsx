import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Reservation, Room } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';
import {
  DoorOpen,
  CheckCircle2,
  UploadCloud,
  CreditCard,
  Key,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

export interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  rooms: Room[];
  onCompleteCheckIn: (resId: string, roomId: string, advancePaid: number) => Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  reservation,
  rooms,
  onCompleteCheckIn,
}) => {
  const { showToast } = useToast();
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [keyNumber, setKeyNumber] = useState('101-A');
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [kycVerified, setKycVerified] = useState(true);
  const [grcSigned, setGrcSigned] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto pick room if reservation already assigned or first clean matching room
  React.useEffect(() => {
    if (reservation) {
      if (reservation.roomId) {
        setSelectedRoomId(reservation.roomId);
        const rm = rooms.find((r) => r.id === reservation.roomId);
        if (rm) setKeyNumber(`${rm.roomNumber}-A`);
      } else {
        const candidate = rooms.find(
          (r) =>
            r.roomTypeId === reservation.roomTypeId &&
            r.occupancyStatus === 'Vacant' &&
            (r.housekeepingStatus === 'Ready' || r.housekeepingStatus === 'Inspected')
        );
        if (candidate) {
          setSelectedRoomId(candidate.id);
          setKeyNumber(`${candidate.roomNumber}-A`);
        }
      }
      setCollectedAmount(reservation.balanceAmount);
    }
  }, [reservation, rooms]);

  if (!reservation) return null;

  const handleFinish = async () => {
    if (!selectedRoomId) {
      showToast({
        title: 'Room Required',
        description: 'Please select a clean room to assign before completing check-in.',
        type: 'error',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onCompleteCheckIn(reservation.id, selectedRoomId, collectedAmount);
      showToast({
        title: 'Guest Successfully Checked In',
        description: `${reservation.guest.firstName} ${reservation.guest.lastName} checked in. Key #${keyNumber} issued.`,
        type: 'success',
      });
      onClose();
    } catch (e) {
      showToast({
        title: 'Check-in Failed',
        description: 'Could not complete check-in operation.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean / Ready rooms for this category
  const matchingCleanRooms = rooms.filter(
    (r) =>
      r.roomTypeId === reservation.roomTypeId &&
      r.occupancyStatus === 'Vacant' &&
      (r.housekeepingStatus === 'Ready' || r.housekeepingStatus === 'Inspected')
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title="Guest Check-in Verification"
      description={`Ref: ${reservation.refCode} • ${reservation.roomTypeName} • ${reservation.nights} Night(s)`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleFinish}
            isLoading={isProcessing}
            leftIcon={<DoorOpen className="w-3.5 h-3.5" />}
          >
            Complete Check-in & Hand Key
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step 1: Guest Identity & KYC */}
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Guest Details
              </span>
              <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                {reservation.guest.firstName} {reservation.guest.lastName}
              </h4>
              <p className="text-xs text-gray-500">
                {reservation.guest.phone} • {reservation.guest.email}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-700">
                KYC: {reservation.guest.idType}
              </span>
              <p className="text-[11px] font-mono text-gray-500">{reservation.guest.idNumber}</p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={kycVerified}
                onChange={(e) => setKycVerified(e.target.checked)}
                className="rounded text-blue-600 border-gray-300"
              />
              <span>Physical ID Verified & Xerox Stored</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={grcSigned}
                onChange={(e) => setGrcSigned(e.target.checked)}
                className="rounded text-blue-600 border-gray-300"
              />
              <span>Digital GRC Registration Card Signed</span>
            </label>
          </div>
        </div>

        {/* Step 2: Room Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
            <span>Assign Clean Room *</span>
            <span className="text-[11px] text-emerald-700 font-normal">
              {matchingCleanRooms.length} clean room(s) available
            </span>
          </label>

          <select
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value);
              const rm = rooms.find((r) => r.id === e.target.value);
              if (rm) setKeyNumber(`${rm.roomNumber}-A`);
            }}
            className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900 outline-none focus:border-blue-600"
          >
            <option value="" disabled>
              Select a vacant, clean room...
            </option>
            {rooms
              .filter((r) => r.roomTypeId === reservation.roomTypeId && r.occupancyStatus === 'Vacant')
              .map((rm) => (
                <option key={rm.id} value={rm.id}>
                  Room {rm.roomNumber} (Floor {rm.floor}) — [{rm.housekeepingStatus}]
                </option>
              ))}
          </select>
        </div>

        {/* Step 3: RFID Key / Key Card */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Key Card / Key ID"
            value={keyNumber}
            onChange={(e) => setKeyNumber(e.target.value)}
            leftIcon={<Key className="w-3.5 h-3.5 text-gray-400" />}
          />
          <Input
            label="ETA / Arrival Timestamp"
            defaultValue="14:15 (Now)"
            disabled
          />
        </div>

        {/* Step 4: Advance / Balance Collection */}
        <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">Payment Collection</span>
            <span className="text-xs font-semibold text-amber-700">
              Outstanding Balance: {formatCurrency(reservation.balanceAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              label="Collect Amount Now (₹)"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
            />
            <Select
              label="Payment Mode"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'UPI', label: 'UPI / QR / GPay' },
                { value: 'Credit Card', label: 'Credit Card (EDC Machine)' },
                { value: 'Cash', label: 'Cash at Front Desk' },
                { value: 'Corporate', label: 'Bill to Company' },
              ]}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
