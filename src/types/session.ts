export type WatchMode = 'solo' | 'group'

export type Mood = 'easy' | 'fun' | 'tense' | 'thoughtful'

export type Participant = {
    id: string
    name: string
}

export type TonightSession = {
    watchMode: WatchMode
    hostName: string
    friends: Participant[]
    mood: Mood
}