import { HashRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import { ChoosePage } from './pages/ChoosePage'
import {OnlineCreateRoom} from "./pages/OnlineCreatePage.tsx";
import {OnlineRoomPage} from "./pages/OnlineRoomPage.tsx";
import {OnlineRoomSetupPage} from "./pages/OnlineRoomSetupPage.tsx";
import {OnlineChoosePage} from "./pages/OnlineChoosePage.tsx";
import {OnlineResultsPage} from "./pages/OnlineResultsPage.tsx";

function App() {
  return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/choose" element={<ChoosePage />} />
          <Route path="/room/new" element={<OnlineCreateRoom />} />
          <Route path="/room/:roomId" element={<OnlineRoomPage />} />
          <Route path="/room/:roomId/setup" element={<OnlineRoomSetupPage />} />
          <Route path="/room/:roomId/choose" element={<OnlineChoosePage />} />
          <Route path="/room/:roomId/results" element={<OnlineResultsPage/>}/>
        </Routes>
      </HashRouter>
  )
}

export default App