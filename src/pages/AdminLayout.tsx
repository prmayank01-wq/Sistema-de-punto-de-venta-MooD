import { Outlet, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  const user = useStore(state => state.user);

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-theme-2 p-8">
        <Outlet />
      </main>
    </div>
  );
}
