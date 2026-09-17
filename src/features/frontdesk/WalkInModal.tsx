import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Room, Reservation } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';
import { UserPlus, Zap, Check } from 'lucide-react';

export interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onCompleteWalkIn: (data: Partial<Reservation>) => Promise<Reservation>;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onCompleteWalkIn,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ready clean rooms only
  const cleanRooms = rooms.filter(
    (r) =>
      r.occupancyStatus === 'Vacant' &&
      (r.housekeepingStatus === 'Ready' || r.housekeepingStatus === 'Inspected')
  );

  const [selectedRoomId, setSelectedRoomId] = useState(cleanRooms[0]?.id || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [nights, setNights] = useState(1);
  const [ratePerNight, setRatePerNight] = useState(4500);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const selectedRoom = cleanRooms.find((r) => r.id === selectedRoomId) || cleanRooms[0];
  const totalAmount = ratePerNight * nights;

  const handleSubmit = async () => {
    if (!firstName || !phone || !selectedRoomId) {
      showToast({
        title: 'Required Details Missing',
        description: 'Please select a room and enter guest name and phone.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const today = '2026-09-16';
      const checkOut = new Date(Date.now() + 86400000 * nights).toISOString().split('T')[0];

      await onCompleteWalkIn({
        guest: {
          id: `guest-${Date.now()}`,
          firstName,
          lastName: lastName || 'Guest',
          email: `${firstName.toLowerCase()}@walkin.guest`,
          phone,
          idType: 'Aadhaar',
          idNumber: 'WALK-IN-DESK',
          nationality: 'Indian',
          vipStatus: false,
          lifetimeStays: 1,
          lifetimeRevenue: totalAmount,
          preferences: [],
        },
        roomId: selectedRoom?.id,
        roomNumber: selectedRoom?.roomNumber,
        roomTypeId: selectedRoom?.roomTypeId,
        roomTypeName: selectedRoom?.roomTypeName,
        checkInDate: today,
        checkOutDate: checkOut,
        nights,
        adults: 2,
        children: 0,
        status: 'Checked In', // Direct active stay
        bookingSource: 'Direct Walk-in',
        totalAmount,
        paidAmount: totalAmount, // Paid upfront
        ratePlanCode: 'WALKIN-EP',
      });

      showToast({
        title: 'Express Walk-in Complete',
        description: `Room ${selectedRoom?.roomNumber} checked in for ${firstName}. Payment received.`,
        type: 'success',
      });
      onClose();
    } catch (e) {
      showToast({
        title: 'Walk-in Failed',
        description: 'Could not process instant check-in.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="60-Second Express Walk-in"
      description="Rapid front desk check-in for immediate arrivals"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Zap className="w-3.5 h-3.5" />}
          >
            Check-in Immediately
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Room select */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Available Ready Room ({cleanRooms.length} vacant & clean) *
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900 outline-none focus:border-blue-600 font-medium"
          >
            {cleanRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} — {r.roomTypeName} (Floor {r.floor})
              </option>
            ))}
          </select>
        </div>

        {/* Guest Name & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name *"
            placeholder="e.g. Anand"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />
          <Input
            label="Last Name"
            placeholder="e.g. Nair"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Input
          label="Mobile Phone *"
          placeholder="+91 98470 12345"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* Duration & Agreed rate */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min="1"
            max="14"
            label="Nights"
            value={nights}
            onChange={(e) => setNights(parseInt(e.target.value) || 1)}
          />
          <Input
            type="number"
            step="100"
            label="Rate / Night (₹)"
            value={ratePerNight}
            onChange={(e) => setRatePerNight(parseFloat(e.target.value) || 4000)}
          />
        </div>

        {/* Payment mode & Total banner */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800">Total Upfront Amount</span>
            <div className="text-base font-bold text-emerald-950">{formatCurrency(totalAmount)}</div>
          </div>

          <div className="w-40">
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'UPI', label: 'UPI QR' },
                { value: 'Card', label: 'Card POS' },
                { value: 'Cash', label: 'Cash' },
              ]}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
