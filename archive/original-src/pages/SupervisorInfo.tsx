import { SupervisorList } from '../components/supervisors/SupervisorList';
import { SupervisorStats } from '../components/supervisors/SupervisorStats';

export function SupervisorInfo() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Supervisor Information</h1>
        <p className="mt-2 text-gray-600">Learn about our faculty members and their research interests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SupervisorList />
        </div>
        <div>
          <SupervisorStats />
        </div>
      </div>
    </div>
  );
}