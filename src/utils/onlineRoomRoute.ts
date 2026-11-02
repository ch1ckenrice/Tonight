import type { OnlineRoom } from '../types/onlineRoom'

export function getOnlineRoomRoute(room: Pick<OnlineRoom, 'id' | 'status'>): string {
    switch (room.status) {
        case 'choosing':
            return `/room/${room.id}/choose`
        case 'results':
            return `/room/${room.id}/results`
        case 'lobby':
        default:
            return `/room/${room.id}`
    }
}
