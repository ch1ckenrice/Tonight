import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureAnonymousUser } from './services/auth.ts'

async function startApp() {
    try {
        const user = await ensureAnonymousUser()

        console.log('Anonymous user:', user.id)
    } catch (error) {
        console.error('Could not create anonymous user:', error)
    }

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    )
}

void startApp()