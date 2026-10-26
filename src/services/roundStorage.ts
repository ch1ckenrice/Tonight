import type {RecentRound, StoredRound} from "../types/round";

const ACTIVE_ROUND_KEY = 'tonight-active-round'
const RECENT_ROUND_KEY = 'tonight-recent-round'

export function saveStoredRound(round: StoredRound): void {
    localStorage.setItem(ACTIVE_ROUND_KEY,JSON.stringify(round))
}
export function getStoredRound(): StoredRound | null {
    const storedRound = localStorage.getItem(ACTIVE_ROUND_KEY)
    try {
        if(storedRound === null) {
            return null;
        }
        return JSON.parse(storedRound) as StoredRound
    } catch (error) {
        console.error(error)
        return null
    }
}
export function clearStoredRound(): void {
    localStorage.removeItem(ACTIVE_ROUND_KEY)
}

export function saveRecentRound(round: RecentRound): void {
    localStorage.setItem(RECENT_ROUND_KEY,JSON.stringify(round))
}

export function getRecentRound(): RecentRound | null {
    const storedRecentRound = localStorage.getItem(RECENT_ROUND_KEY)
    try {
        if(storedRecentRound === null) {
            return null;
        }
        return JSON.parse(storedRecentRound) as RecentRound
    }
    catch(error) {
        console.error(error)
        return null
    }
}

