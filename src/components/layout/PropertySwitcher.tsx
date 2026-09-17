import React, { useState } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { mockProperties } from '../../mocks/mockData';
import { Property } from '../../types';

export interface PropertySwitcherProps {
  currentProperty: Property | null; // null represents "All Properties"
  onSelectProperty: (property: Property | null) => void;
  onOpenOnboarding?: () => void;
}

export const PropertySwitcher: React.FC<PropertySwitcherProps> = ({
  currentProperty,
  onSelectProperty,
  onOpenOnboarding,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 transition-all cursor-pointer shadow-2xs group text-left"
        aria-label="Select Property"
      >
        <div className="w-6 h-6 rounded-md bg-[#172033] flex items-center justify-center text-white shrink-0">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex flex-col min-w-0 pr-1 max-w-[90px] sm:max-w-[160px] md:max-w-[220px]">
          <span className="text-xs font-semibold text-gray-900 truncate leading-tight">
            {currentProperty ? currentProperty.name : 'All Properties'}
          </span>
          <span className="text-[10px] text-gray-500 truncate leading-tight hidden sm:block">
            {currentProperty ? `${currentProperty.city} • ${currentProperty.totalRooms} Rooms` : '4 Properties Active'}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-68 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              SIGNINN Multi-Property Portfolio
            </div>

            <div className="py-1">
              {/* All Properties option */}
              <button
                onClick={() => {
                  onSelectProperty(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 cursor-pointer ${
                  currentProperty === null ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                    ★
                  </div>
                  <div>
                    <div className="font-medium">All Properties (Portfolio View)</div>
                    <div className="text-[10px] text-gray-400 font-normal">Consolidated metrics & reporting</div>
                  </div>
                </div>
                {currentProperty === null && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>

              <div className="h-px bg-gray-100 my-1" />

              {/* Individual properties */}
              {mockProperties.map((prop) => {
                const isSelected = currentProperty?.id === prop.id;
                return (
                  <button
                    key={prop.id}
                    onClick={() => {
                      onSelectProperty(prop);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {prop.code}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{prop.name}</div>
                        <div className="text-[10px] text-gray-400 font-normal truncate">
                          {prop.city}, {prop.state} • {prop.totalRooms} rooms
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {onOpenOnboarding && (
              <div className="p-1.5 border-t border-gray-100 bg-gray-50/60">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenOnboarding();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard New Property</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
