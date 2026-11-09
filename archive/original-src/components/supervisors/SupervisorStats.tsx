import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const expertiseData = [
  { name: 'Machine Learning', value: 8 },
  { name: 'Network Security', value: 6 },
  { name: 'Computer Vision', value: 4 },
  { name: 'Blockchain', value: 3 },
  { name: 'IoT', value: 3 },
];

const COLORS = ['#4f46e5', '#059669', '#0891b2', '#7c3aed', '#db2777'];

export function SupervisorStats() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Expertise Distribution</h2>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expertiseData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {expertiseData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total Supervisors</p>
            <p className="text-xl font-semibold">24</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Active Projects</p>
            <p className="text-xl font-semibold">42</p>
          </div>
        </div>
      </div>
    </div>
  );
}