import type {StoredRound} from "../types/round";

const tonightActiveRound = 'ACTIVE_ROUND_KEY'

export function saveStoredRound(round: StoredRound): void {
    localStorage.setItem(tonightActiveRound,JSON.stringify(round))
}
export function getStoredRound(): StoredRound | null {
    const storedRound = localStorage.getItem(tonightActiveRound)
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
    localStorage.removeItem(tonightActiveRound)
}

