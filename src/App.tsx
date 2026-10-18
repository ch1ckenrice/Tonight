import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import { ChoosePage } from './pages/ChoosePage'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/choose" element={<ChoosePage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App