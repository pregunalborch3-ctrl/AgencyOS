import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="ml-[60px] min-h-screen flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
