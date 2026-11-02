import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureAnonymousUser } from './services/auth.ts'
import { StartupError } from './components/StartupError.tsx'

async function startApp() {
    try {
        await ensureAnonymousUser()
    } catch (error) {
        console.error('Could not create anonymous user:', error)

        createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <StartupError />
            </StrictMode>,
        )
        return
    }

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    )
}

void startApp()
