import React, { useState } from 'react';
import {
  CalendarCheck2,
  Ban,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { RoomType, Room } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export interface AvailabilityViewProps {
  roomTypes: RoomType[];
  rooms: Room[];
}

export const AvailabilityView: React.FC<AvailabilityViewProps> = ({ roomTypes, rooms }) => {
  const { showToast } = useToast();
  const dates = [
    { date: '2026-09-16', day: 'Wed', isPeak: false },
    { date: '2026-09-17', day: 'Thu', isPeak: false },
    { date: '2026-09-18', day: 'Fri', isPeak: true },
    { date: '2026-09-19', day: 'Sat', isPeak: true },
    { date: '2026-09-20', day: 'Sun', isPeak: true },
    { date: '2026-09-21', day: 'Mon', isPeak: false },
    { date: '2026-09-22', day: 'Tue', isPeak: false },
  ];

  // Stop sell state per room type & date key
  const [stopSells, setStopSells] = useState<Record<string, boolean>>({
    'rt-3-2026-09-19': true, // Presidential suite sold out / stop sell on Saturday
  });

  const [minStays, setMinStays] = useState<Record<string, number>>({
    'rt-1-2026-09-18': 2,
    'rt-1-2026-09-19': 2,
  });

  const toggleStopSell = (key: string) => {
    setStopSells((prev) => {
      const next = !prev[key];
      showToast({
        title: next ? 'Stop Sell Applied' : 'Channel Inventory Opened',
        description: next ? 'OTA booking engines blocked for this date.' : 'Rooms open for sale.',
        type: next ? 'warning' : 'success',
      });
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              Availability & Restrictions Grid
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time channel distribution inventory controls, stop-sells, and minimum stay rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Open
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Min Stay
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Stop Sell
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                <th className="p-3 sticky left-0 bg-gray-50 z-10 w-44">Room Type</th>
                {dates.map((d) => (
                  <th key={d.date} className="p-3 text-center min-w-[120px]">
                    <div className="font-bold text-gray-900">{d.day}</div>
                    <div className="text-[10px] text-gray-400">{d.date.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roomTypes.map((rt) => {
                const totalInType = rt.totalInventory;
                return (
                  <tr key={rt.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                      <div>{rt.name}</div>
                      <span className="text-[10px] text-gray-400 font-normal">Cap: {totalInType} rooms</span>
                    </td>

                    {dates.map((d) => {
                      const key = `${rt.id}-${d.date}`;
                      const isStopSell = !!stopSells[key];
                      const minStay = minStays[key] || 1;
                      const availableRooms = isStopSell ? 0 : Math.max(1, totalInType - (d.isPeak ? 6 : 3));

                      return (
                        <td key={d.date} className="p-3 text-center">
                          <div
                            className={`p-2 rounded-lg border transition-all ${
                              isStopSell
                                ? 'bg-rose-50 border-rose-200 text-rose-950'
                                : minStay > 1
                                ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                                : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            }`}
                          >
                            <div className="text-base font-extrabold">
                              {isStopSell ? '0' : availableRooms}
                              <span className="text-[10px] font-normal text-gray-400">/{totalInType}</span>
                            </div>

                            <div className="mt-1 flex items-center justify-center gap-1">
                              {minStay > 1 && (
                                <span className="text-[9px] px-1 py-0.2 bg-amber-200 text-amber-900 font-bold rounded">
                                  Min {minStay}N
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => toggleStopSell(key)}
                              className="mt-2 w-full text-[10px] font-bold py-0.5 rounded cursor-pointer transition-colors bg-white/80 hover:bg-white shadow-2xs border border-gray-200"
                            >
                              {isStopSell ? 'Open Sales' : 'Stop Sell'}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
