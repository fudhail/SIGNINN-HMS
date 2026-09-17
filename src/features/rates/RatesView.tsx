import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Sliders,
  Sparkles,
  TrendingUp,
  Percent,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { RatePlan, RoomType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export interface RatesViewProps {
  ratePlans: RatePlan[];
  roomTypes: RoomType[];
  onUpdateRatePlan: (plan: RatePlan) => Promise<void>;
}

export const RatesView: React.FC<RatesViewProps> = ({
  ratePlans,
  roomTypes,
  onUpdateRatePlan,
}) => {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState(10);

  // Dynamic pricing sample dates matrix
  const dates = ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'];

  const handleApplyBulk = () => {
    showToast({
      title: 'Bulk Yield Surge Applied',
      description: `All BAR rates updated by +${bulkPercent}% for the selected date window.`,
      type: 'success',
    });
    setIsBulkUpdateOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              Rates & Yield Pricing Manager
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Dynamic pricing rules, meal plan packages, corporate tariff slabs, and rate matrices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkUpdateOpen(true)}
            leftIcon={<TrendingUp className="w-3.5 h-3.5 text-blue-600" />}
          >
            Bulk Rate Surge (+%)
          </Button>
        </div>
      </div>

      {/* Rate Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ratePlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-gray-400 block">{plan.code}</span>
                  <h4 className="text-sm font-bold text-gray-900 mt-0.5">{plan.name}</h4>
                </div>
                <Badge variant="status" status={plan.status} size="sm" />
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Meal Plan:</span>
                  <span className="font-semibold text-gray-900">{plan.mealPlan}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cancellation:</span>
                  <span className="text-gray-900 truncate max-w-[170px]">{plan.cancellationPolicy}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pricing Rule:</span>
                  <span className="font-bold text-purple-700">
                    {plan.markupPercent > 0
                      ? `+${plan.markupPercent}% on Base`
                      : plan.discountPercent > 0
                      ? `-${plan.discountPercent}% Discount`
                      : 'Standard Base Rate'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Min Stay: {plan.minNights} night(s)</span>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setSelectedPlan(plan)}
                leftIcon={<Sliders className="w-3 h-3" />}
              >
                Edit Plan
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Date x Room Type Live Pricing Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              7-Day Rate & Yield Matrix (BAR Room Only)
            </h3>
            <p className="text-[11px] text-gray-500">Live baseline tariffs pushed to OTAs and direct engine</p>
          </div>

          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Parity Maintained across Portals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/50 text-gray-600 uppercase text-[10px]">
                <th className="p-3 sticky left-0 bg-gray-100 z-10 w-44">Room Category</th>
                {dates.map((d) => (
                  <th key={d} className="p-3 text-center min-w-[100px]">
                    <div className="font-bold text-gray-900">
                      {new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-[10px] text-gray-400">{d.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roomTypes.map((rt) => (
                <tr key={rt.id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                    <div>{rt.name}</div>
                    <span className="text-[10px] text-gray-400 font-normal">{rt.totalInventory} rooms total</span>
                  </td>
                  {dates.map((d, idx) => {
                    const isWeekend = idx === 3 || idx === 4; // Fri/Sat surcharge
                    const rate = isWeekend ? rt.basePrice + 800 : rt.basePrice;
                    return (
                      <td key={d} className="p-3 text-center">
                        <input
                          type="text"
                          defaultValue={`₹${rate}`}
                          className="w-20 text-center text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded py-1 hover:border-blue-500 focus:border-blue-600 outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Rate Surge Modal */}
      <Modal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        maxWidth="md"
        title="Apply Dynamic Bulk Rate Surge"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsBulkUpdateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyBulk}>
              Apply Rate Surge
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-gray-600">
            Increase or decrease all room tariffs across the calendar based on high demand or festival weekends.
          </p>

          <Input
            type="number"
            label="Rate Adjustment Percentage (+%)"
            value={bulkPercent}
            onChange={(e) => setBulkPercent(parseFloat(e.target.value) || 0)}
          />

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-blue-900">
            <strong>Yield Rule Active:</strong> Applying a +{bulkPercent}% increase to Deluxe Room will
            adjust rates from ₹4,500 to {formatCurrency(Math.round(4500 * (1 + bulkPercent / 100)))}.
          </div>
        </div>
      </Modal>
    </div>
  );
};
