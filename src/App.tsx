import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { PageState } from './components/PageState.tsx'

const HomePage = lazy(() => import('./pages/HomePage'))
const SetupPage = lazy(() => import('./pages/SetupPage'))
const ChoosePage = lazy(() =>
    import('./pages/ChoosePage').then((module) => ({ default: module.ChoosePage })),
)
const OnlineCreateRoom = lazy(() =>
    import('./pages/OnlineCreatePage').then((module) => ({ default: module.OnlineCreateRoom })),
)
const OnlineRoomPage = lazy(() =>
    import('./pages/OnlineRoomPage').then((module) => ({ default: module.OnlineRoomPage })),
)
const OnlineRoomSetupPage = lazy(() =>
    import('./pages/OnlineRoomSetupPage').then((module) => ({ default: module.OnlineRoomSetupPage })),
)
const OnlineChoosePage = lazy(() =>
    import('./pages/OnlineChoosePage').then((module) => ({ default: module.OnlineChoosePage })),
)
const OnlineResultsPage = lazy(() =>
    import('./pages/OnlineResultsPage').then((module) => ({ default: module.OnlineResultsPage })),
)

function App() {
  return (
      <HashRouter>
        <Suspense fallback={<PageState eyebrow="TONIGHT" title="Loading..." isLoading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/choose" element={<ChoosePage />} />
            <Route path="/room/new" element={<OnlineCreateRoom />} />
            <Route path="/room/:roomId" element={<OnlineRoomPage />} />
            <Route path="/room/:roomId/setup" element={<OnlineRoomSetupPage />} />
            <Route path="/room/:roomId/choose" element={<OnlineChoosePage />} />
            <Route path="/room/:roomId/results" element={<OnlineResultsPage/>}/>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
  )
}

export default App
