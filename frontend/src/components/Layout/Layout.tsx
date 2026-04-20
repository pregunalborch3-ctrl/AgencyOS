import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="md:ml-[60px] min-h-screen flex flex-col pb-[57px] md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
