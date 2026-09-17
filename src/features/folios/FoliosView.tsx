import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  CreditCard,
  Printer,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';
import { Folio, FolioItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { PaymentBadge } from '../../components/domain';

export interface FoliosViewProps {
  folios: Folio[];
  onAddCharge: (folioId: string, item: Omit<FolioItem, 'id' | 'folioId'>) => Promise<void>;
  onRecordPayment: (folioId: string, amount: number, method: string, ref: string) => Promise<void>;
  onOpenReservationDetail?: (resId: string) => void;
}

export const FoliosView: React.FC<FoliosViewProps> = ({
  folios,
  onAddCharge,
  onRecordPayment,
  onOpenReservationDetail,
}) => {
  const { showToast } = useToast();
  const [selectedFolioId, setSelectedFolioId] = useState<string>(folios[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Charge modal state
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeCategory, setChargeCategory] = useState<FolioItem['category']>('F&B');
  const [chargeAmount, setChargeAmount] = useState<number>(450);

  // Record Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('UPI-TXN-');

  const selectedFolio = folios.find((f) => f.id === selectedFolioId) || folios[0];

  const handleCreateCharge = async () => {
    if (!chargeDescription || chargeAmount <= 0) {
      showToast({ title: 'Invalid Charge', description: 'Enter description and valid amount.', type: 'error' });
      return;
    }
    await onAddCharge(selectedFolio.id, {
      date: new Date().toISOString().split('T')[0],
      description: chargeDescription,
      category: chargeCategory,
      amount: chargeAmount,
      type: 'Charge',
      addedBy: 'Front Desk Operator',
    });
    showToast({
      title: 'Charge Posted',
      description: `₹${chargeAmount} posted to Room ${selectedFolio.roomNumber || 'Folio'}.`,
      type: 'success',
    });
    setIsChargeModalOpen(false);
    setChargeDescription('');
  };

  const handleCreatePayment = async () => {
    if (payAmount <= 0) {
      showToast({ title: 'Invalid Payment', description: 'Enter valid positive payment amount.', type: 'error' });
      return;
    }
    await onRecordPayment(selectedFolio.id, payAmount, payMethod, payRef + Math.floor(Math.random() * 10000));
    showToast({
      title: 'Payment Credited',
      description: `₹${payAmount} credited to ${selectedFolio.reservationRef} via ${payMethod}.`,
      type: 'success',
    });
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              Folios & Financial Ledger
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time multi-folio billing ledger, split room charges, dining add-ons, and payment settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              showToast({
                title: 'Print Folio Statement',
                description: `Generating legal invoice PDF for ${selectedFolio?.guestName}...`,
                type: 'info',
              });
            }}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Statement
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPayAmount(selectedFolio?.balance || 0);
              setIsPaymentModalOpen(true);
            }}
            leftIcon={<CreditCard className="w-3.5 h-3.5 text-blue-600" />}
          >
            Record Payment
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsChargeModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Charge
          </Button>
        </div>
      </div>

      {/* Main Folio Workspace: Master/Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Folio Selector */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-2xs p-3 space-y-2">
          <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Active Stay Folios ({folios.length})
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {folios.map((folio) => {
              const isSelected = folio.id === selectedFolio?.id;
              return (
                <div
                  key={folio.id}
                  onClick={() => setSelectedFolioId(folio.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-blue-950 shadow-2xs'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{folio.guestName}</span>
                    <PaymentBadge
                      status={folio.balance <= 0 ? 'Paid' : folio.totalPayments > 0 ? 'Partially Paid' : 'Unpaid'}
                      size="xs"
                    />
                  </div>

                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Room {folio.roomNumber || 'Unassigned'} • {folio.reservationRef}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Balance Due:</span>
                    <span
                      className={`font-bold ${
                        folio.balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {folio.balance > 0 ? formatCurrency(folio.balance) : 'Paid in Full'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Folio Detailed Ledger */}
        <div className="lg:col-span-8 space-y-4">
          {selectedFolio ? (
            <>
              {/* Folio Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Total Charges
                  </span>
                  <span className="text-sm font-bold text-gray-950 mt-0.5 block">
                    {formatCurrency(selectedFolio.totalCharges)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Payments Credited
                  </span>
                  <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                    - {formatCurrency(selectedFolio.totalPayments)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Taxes Included (GST)
                  </span>
                  <span className="text-sm font-semibold text-gray-700 mt-0.5 block">
                    {formatCurrency(selectedFolio.totalTaxes)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Net Outstanding
                  </span>
                  <span
                    className={`text-sm font-extrabold mt-0.5 block ${
                      selectedFolio.balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(selectedFolio.balance)}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">
                    Line Item Transactions ({selectedFolio.items.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="xs" variant="outline" onClick={() => setIsChargeModalOpen(true)}>
                      + Add Item
                    </Button>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] bg-gray-50/50">
                      <th className="p-3">Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedFolio.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-600">{item.date}</td>
                        <td className="p-3 font-medium text-gray-900">
                          {item.description}
                          {item.reference && (
                            <span className="block text-[10px] text-gray-400 font-mono">
                              Ref: {item.reference}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-600">{item.category}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.type === 'Payment'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.type === 'Discount'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-950">
                          {item.type === 'Payment' || item.type === 'Discount'
                            ? `- ${formatCurrency(item.amount)}`
                            : formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-gray-500">No folio selected.</div>
          )}
        </div>
      </div>

      {/* Add Charge Modal */}
      <Modal
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
        maxWidth="md"
        title="Post Charge to Folio"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsChargeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateCharge}>
              Post Charge
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Charge Category"
            value={chargeCategory}
            onChange={(e) => setChargeCategory(e.target.value as any)}
            options={[
              { value: 'F&B', label: 'Food & Beverage / Restaurant' },
              { value: 'Room Service', label: 'In-Room Dining' },
              { value: 'Minibar', label: 'Minibar Consumption' },
              { value: 'Laundry', label: 'Dry Cleaning / Laundry' },
              { value: 'Spa', label: 'Ayurvedic Spa Treatment' },
              { value: 'Misc', label: 'Late Checkout / Miscellaneous' },
            ]}
          />

          <Input
            label="Item Description *"
            placeholder="e.g. Malabar Fish Curry + Parotta"
            value={chargeDescription}
            onChange={(e) => setChargeDescription(e.target.value)}
          />

          <Input
            type="number"
            label="Total Amount (₹) *"
            value={chargeAmount}
            onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
          />
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        maxWidth="md"
        title="Record Payment Receipt"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreatePayment}>
              Save Payment
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            type="number"
            label="Amount (₹) *"
            value={payAmount}
            onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
          />

          <Select
            label="Payment Instrument"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            options={[
              { value: 'UPI', label: 'UPI / PhonePe / GPay QR' },
              { value: 'Credit Card', label: 'Credit / Debit Card' },
              { value: 'Cash', label: 'Cash at Counter' },
              { value: 'Bank Transfer', label: 'Bank Transfer / NEFT' },
            ]}
          />

          <Input
            label="Transaction Reference / Note"
            placeholder="e.g. UPI-TXN-902348"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
