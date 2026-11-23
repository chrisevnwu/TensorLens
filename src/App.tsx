import './styles/globals.css'
import { HashRouter, Route, Routes } from 'react-router-dom'
import AppHeader from './components/layout/AppHeader'
import HomePage from './pages/HomePage'
import LabPage from './pages/LabPage'
import './components/layout/navigation.css'

export default function App() {
  return (
    <HashRouter>
      <AppHeader />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="labs/:labId" element={<LabPage />} />
        <Route path="*" element={<LabPage />} />
      </Routes>
    </HashRouter>
  )
}
