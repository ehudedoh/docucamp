import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import InstallPrompt from '../common/InstallPrompt.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  )
}