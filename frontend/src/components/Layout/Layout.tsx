import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Footer from '../Footer'
import TrialBanner from '../TrialBanner'
import TrialExpiredModal from '../TrialExpiredModal'

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="md:ml-[210px] min-h-screen flex flex-col pb-[57px] md:pb-0">
        <TrialBanner />
        <Outlet />
        <Footer />
      </main>
      <TrialExpiredModal />
    </div>
  )
}
