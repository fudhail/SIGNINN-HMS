import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { ChannelConnection } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export interface ChannelsViewProps {
  channels: ChannelConnection[];
  onForceSync: () => Promise<void>;
  onToggleChannelStatus: (channelId: string) => Promise<void>;
  onUpdateMarkup: (channelId: string, markupPercent: number) => Promise<void>;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels,
  onForceSync,
  onToggleChannelStatus,
  onUpdateMarkup,
}) => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelConnection | null>(null);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await onForceSync();
      showToast({
        title: 'Two-Way Sync Completed',
        description: 'Rates, inventory, and bookings refreshed across Booking.com, MMT, and Agoda.',
        type: 'success',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalOTARevenue = channels.reduce((acc, c) => acc + c.revenueThisMonth, 0);
  const totalCommission = channels.reduce(
    (acc, c) => acc + (c.revenueThisMonth * c.commissionRate) / 100,
    0
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              OTA Channel Manager
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live 2-Way Sync
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time automated inventory distribution and rate parity controls for online travel agencies.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSyncAll}
          isLoading={isSyncing}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
        >
          Force Sync All Channels
        </Button>
      </div>

      {/* Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            OTA Monthly Revenue
          </span>
          <span className="text-xl font-bold text-gray-950 mt-1 block">
            {formatCurrency(totalOTARevenue)}
          </span>
          <span className="text-[11px] text-gray-500">From 5 connected portals</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider block">
            Est. Commission Payable
          </span>
          <span className="text-xl font-bold text-rose-700 mt-1 block">
            {formatCurrency(totalCommission)}
          </span>
          <span className="text-[11px] text-rose-600 font-medium">Avg ~16.8% take rate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Channel Net ADR
          </span>
          <span className="text-xl font-bold text-emerald-800 mt-1 block">
            ₹4,420
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">+8% via Smart Markup rules</span>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{ch.channelName}</h4>
                  <span className="text-[11px] text-gray-400">
                    Last synced {ch.lastSync}
                  </span>
                </div>

                <Badge variant="status" status={ch.status} size="sm" dot />
              </div>

              <div className="mt-3 py-2.5 border-t border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Commission</span>
                  <span className="font-bold text-gray-900">{ch.commissionRate}%</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Price Markup</span>
                  <span className="font-bold text-blue-700">+{ch.rateMultiplier}%</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Bookings (MTD)</span>
                  <span className="font-semibold text-gray-800">{ch.bookingsThisMonth} stays</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Revenue (MTD)</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(ch.revenueThisMonth)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                {ch.activeListings} rooms mapped
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setSelectedChannel(ch)}
                  leftIcon={<Sliders className="w-3 h-3" />}
                >
                  Configure
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Channel Configuration Modal */}
      {selectedChannel && (
        <Modal
          isOpen={!!selectedChannel}
          onClose={() => setSelectedChannel(null)}
          maxWidth="md"
          title={`${selectedChannel.channelName} Mapping & Rate Rules`}
          description="Adjust markup percentages to offset OTA commissions and manage channel connectivity."
          footer={
            <Button variant="primary" size="sm" onClick={() => setSelectedChannel(null)}>
              Save Configuration
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="font-bold text-blue-950 block">Commission Offset Rule</span>
              <p className="text-blue-800 mt-0.5">
                {selectedChannel.channelName} charges {selectedChannel.commissionRate}% commission. You
                have set a +{selectedChannel.rateMultiplier}% rate markup on this channel so your net
                revenue matches direct walk-in rates.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Rate Markup Percentage (+%)
              </label>
              <input
                type="number"
                value={selectedChannel.rateMultiplier}
                onChange={(e) =>
                  onUpdateMarkup(selectedChannel.id, parseFloat(e.target.value) || 0)
                }
                className="w-full h-8 px-3 rounded-lg border border-gray-300 text-xs font-bold text-gray-900"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900 block">Room Category Mapping</span>
              <div className="space-y-1.5">
                <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span>Deluxe Room (SIGNINN)</span>
                  <span className="font-mono text-gray-500">→ "Deluxe King City View"</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span>Executive Suite (SIGNINN)</span>
                  <span className="font-mono text-gray-500">→ "Executive Suite 1 King Bed"</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
