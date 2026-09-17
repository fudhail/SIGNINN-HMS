import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BedDouble,
  Receipt,
  Globe,
  Rocket,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';

export interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states
  const [hotelName, setHotelName] = useState('APKA INN');
  const [city, setCity] = useState('Kochi, Kerala');
  const [totalRooms, setTotalRooms] = useState(30);

  const [deluxeRate, setDeluxeRate] = useState(4500);
  const [suiteRate, setSuiteRate] = useState(7800);

  const [gstin, setGstin] = useState('32AABCS1429B1Z8');
  const [selectedOTAs, setSelectedOTAs] = useState<string[]>(['Booking.com', 'MakeMyTrip']);

  const toggleOTA = (ota: string) => {
    setSelectedOTAs((prev) =>
      prev.includes(ota) ? prev.filter((o) => o !== ota) : [...prev, ota]
    );
  };

  const handleFinish = () => {
    showToast({
      title: 'Setup Completed Successfully!',
      description: `${hotelName} is provisioned with 30 rooms and ready for front desk operations.`,
      type: 'success',
    });
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto my-6 bg-white rounded-2xl border border-gray-200 shadow-md p-6 sm:p-8 space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            SIGNINN HMS Setup Wizard
          </span>
          <h2 className="text-xl font-bold text-gray-950">Configure Your Hotel in 3 Minutes</h2>
        </div>
        <span className="text-xs font-bold text-gray-500">Step {step} of 5</span>
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-between items-center gap-2">
        {['Property', 'Room Types', 'Numbering', 'GST Tax', 'Channels'].map((lbl, idx) => (
          <div
            key={lbl}
            className={`flex-1 text-center pb-2 border-b-2 text-xs font-semibold ${
              step === idx + 1
                ? 'border-blue-600 text-blue-600 font-bold'
                : step > idx + 1
                ? 'border-emerald-500 text-emerald-700'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            {lbl}
          </div>
        ))}
      </div>

      {/* Step 1: Property Basics */}
      {step === 1 && (
        <div className="space-y-4 text-xs">
          <Input
            label="Hotel / Property Name *"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location / City *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              type="number"
              label="Total Room Capacity"
              value={totalRooms}
              onChange={(e) => setTotalRooms(parseInt(e.target.value) || 30)}
            />
          </div>
          <p className="text-gray-500 text-[11px]">
            SIGNINN will automatically set up default currency (INR ₹) and Indian Standard Time (IST).
          </p>
        </div>
      )}

      {/* Step 2: Room Types */}
      {step === 2 && (
        <div className="space-y-4 text-xs">
          <p className="text-gray-600">Define initial room categories and default base tariff rates:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <strong className="text-gray-900 block">Deluxe Room (Standard)</strong>
              <Input
                type="number"
                label="Base Rate (₹/night)"
                value={deluxeRate}
                onChange={(e) => setDeluxeRate(parseFloat(e.target.value) || 4500)}
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <strong className="text-gray-900 block">Executive Suite (Premium)</strong>
              <Input
                type="number"
                label="Base Rate (₹/night)"
                value={suiteRate}
                onChange={(e) => setSuiteRate(parseFloat(e.target.value) || 7800)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Room Numbering */}
      {step === 3 && (
        <div className="space-y-3 text-xs">
          <p className="text-gray-600">Auto-generating 30 physical room rack identifiers:</p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 font-mono text-[11px]">
            <div>• Floor 1: Rooms 101, 102, 103, 104, 105, 106, 107, 108, 109, 110</div>
            <div>• Floor 2: Rooms 201, 202, 203, 204, 205, 206, 207, 208, 209, 210</div>
            <div>• Floor 3: Rooms 301, 302, 303, 304, 305, 306, 307, 308, 309, 310</div>
          </div>
          <span className="text-emerald-700 font-semibold block text-[11px]">
            ✓ 30 Rooms validated with zero numbering conflicts.
          </span>
        </div>
      )}

      {/* Step 4: Tax Setup */}
      {step === 4 && (
        <div className="space-y-3 text-xs">
          <Input
            label="GSTIN Number *"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            className="font-mono"
          />
          <div className="p-3 bg-blue-50/50 rounded-lg text-blue-900">
            <strong>Standard SAC 996311 configured:</strong> 12% GST applied automatically to rooms
            below ₹7,500 and 18% applied for luxury suites.
          </div>
        </div>
      )}

      {/* Step 5: Channels */}
      {step === 5 && (
        <div className="space-y-3 text-xs">
          <p className="text-gray-600">Select which OTAs you want to connect for two-way inventory sync:</p>
          <div className="grid grid-cols-2 gap-3">
            {['Booking.com', 'MakeMyTrip', 'Goibibo', 'Agoda', 'Airbnb'].map((ota) => (
              <label
                key={ota}
                onClick={() => toggleOTA(ota)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedOTAs.includes(ota)
                    ? 'bg-blue-50/70 border-blue-500 font-bold text-blue-900'
                    : 'bg-white border-gray-200'
                }`}
              >
                <span>{ota}</span>
                {selectedOTAs.includes(ota) && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        {step > 1 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStep((s) => (s - 1) as any)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setStep((s) => (s + 1) as any)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Next Step
          </Button>
        ) : (
          <Button
            size="sm"
            variant="success"
            onClick={handleFinish}
            leftIcon={<Rocket className="w-3.5 h-3.5" />}
          >
            Launch SIGNINN HMS
          </Button>
        )}
      </div>
    </div>
  );
};
