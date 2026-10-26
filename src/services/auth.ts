import { supabase } from './supabase'

export async function ensureAnonymousUser() {
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
        throw sessionError
    }

    if (session?.user) {
        return session.user
    }

    const {
        data: { user: newUser },
        error: signInError,
    } = await supabase.auth.signInAnonymously()

    if (signInError) {
        throw signInError
    }

    if (!newUser) {
        throw new Error('Anonymous user was not created')
    }

    return newUser
}