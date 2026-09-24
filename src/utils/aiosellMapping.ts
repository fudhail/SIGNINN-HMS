import type { RoomType } from '../types';

interface MappedRoom {
  room_id: string;
  room_name: string;
  rateplans?: Array<{ rateplan_id: string }>;
}

export function mappedAiosellRoom(mappingResult: any, roomType: RoomType): MappedRoom {
  if (!mappingResult?.success || !Array.isArray(mappingResult.data?.rooms)) {
    throw new Error('Aiosell property mapping is unavailable. Verify the connection first.');
  }
  const matches = mappingResult.data.rooms.filter((room: MappedRoom) =>
    room.room_id?.toLowerCase() === roomType.code.toLowerCase() ||
    room.room_name?.toLowerCase() === roomType.name.toLowerCase()
  );
  if (matches.length !== 1) {
    throw new Error(`Map room type ${roomType.name} to one Aiosell room before pushing.`);
  }
  return matches[0];
}
