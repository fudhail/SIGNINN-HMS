import { ChannelConfig, ChannelMapping, SyncHealthLog } from '../types';
import { simulateLatency } from './latency';
import { mockChannels, mockChannelMappings, mockSyncHealthLogs } from '../mocks/mockData';

export interface ChannelService {
  getChannels(): Promise<ChannelConfig[]>;
  toggleChannel(channelId: string, active: boolean): Promise<ChannelConfig>;
  getChannelMappings(): Promise<ChannelMapping[]>;
  updateMapping(id: string, updates: Partial<ChannelMapping>): Promise<ChannelMapping>;
  getSyncHealthLogs(): Promise<SyncHealthLog[]>;
  triggerSync(channelId?: string): Promise<SyncHealthLog>;
}

let localChannels: ChannelConfig[] = [...mockChannels];
let localMappings: ChannelMapping[] = [...mockChannelMappings];
let localSyncLogs: SyncHealthLog[] = [...mockSyncHealthLogs];

export const channelService: ChannelService = {
  async getChannels(): Promise<ChannelConfig[]> {
    await simulateLatency(250, 500);
    return [...localChannels];
  },

  async toggleChannel(channelId: string, active: boolean): Promise<ChannelConfig> {
    await simulateLatency(300, 600);
    const idx = localChannels.findIndex((c) => c.id === channelId);
    if (idx === -1) throw new Error(`Channel ${channelId} not found`);

    const updated = {
      ...localChannels[idx],
      status: active ? ('Connected' as const) : ('Disconnected' as const),
      lastSync: new Date().toISOString(),
    };
    localChannels[idx] = updated;
    return updated;
  },

  async getChannelMappings(): Promise<ChannelMapping[]> {
    await simulateLatency(250, 500);
    return [...localMappings];
  },

  async updateMapping(id: string, updates: Partial<ChannelMapping>): Promise<ChannelMapping> {
    await simulateLatency(250, 500);
    const idx = localMappings.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Channel mapping ${id} not found`);

    const updated = {
      ...localMappings[idx],
      ...updates,
    };
    localMappings[idx] = updated;
    return updated;
  },

  async getSyncHealthLogs(): Promise<SyncHealthLog[]> {
    await simulateLatency(200, 450);
    return [...localSyncLogs];
  },

  async triggerSync(channelId?: string): Promise<SyncHealthLog> {
    await simulateLatency(400, 800);
    const channelName = channelId
      ? localChannels.find((c) => c.id === channelId)?.channelName || 'All Channels'
      : 'All Channels';

    const newLog: SyncHealthLog = {
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      channel: channelName,
      objectType: 'Rate update',
      status: 'Success',
      retryCount: 0,
      actionRequired: undefined,
    };

    localSyncLogs = [newLog, ...localSyncLogs];

    // Also update channel last sync
    if (channelId) {
      const idx = localChannels.findIndex((c) => c.id === channelId);
      if (idx !== -1) {
        localChannels[idx] = {
          ...localChannels[idx],
          lastSync: new Date().toISOString(),
          errorCount: 0,
        };
      }
    }

    return newLog;
  },
};
