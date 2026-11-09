import { DashboardStats } from '../components/DashboardStats';
import { useSearch } from '@tanstack/react-router';

export function Dashboard() {
  const search = useSearch({ from: '/dashboard' });
  const studentId = search.email;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to the CUET CSE Thesis Portal</p>
        <p>{studentId}</p>
      </div>
      
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Total Theses</h3>
          <p className="text-3xl font-bold mt-2">156</p>
        </div>
        <div className="bg-emerald-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Active Projects</h3>
          <p className="text-3xl font-bold mt-2">42</p>
        </div>
        <div className="bg-amber-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Supervisors</h3>
          <p className="text-3xl font-bold mt-2">24</p>
        </div>
      </div> */}

      <DashboardStats />
    </div>
  );
}