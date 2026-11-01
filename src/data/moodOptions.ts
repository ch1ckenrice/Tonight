import type {Mood} from "../types/session.ts";

export const moodOptions: {
    value: Mood
    title: string
    description: string
}[] = [
    {
        value: 'easy',
        title: 'Easy watch',
        description: 'Light, warm and effortless.',
    },
    {
        value: 'fun',
        title: 'Make us laugh',
        description: 'Something playful and entertaining.',
    },
    {
        value: 'tense',
        title: 'Keep us hooked',
        description: 'Suspense, mystery or high stakes.',
    },
    {
        value: 'thoughtful',
        title: 'Give us something to think about',
        description: 'Emotional, ambitious or meaningful.',
    },

]