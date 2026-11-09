import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { db } from '../components/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';

const supervisionData = [
  { name: 'Mir. Md. Saki Kowsar', theses: 12 },
  { name: 'Dr. Muhammad Ibrahim Khan', theses: 8 },
  { name: 'Dr. Kaushik Deb', theses: 7 },
  { name: 'Dr. Mohammed Moshiul Hoque', theses: 5 },
  { name: 'Dr. Dr. Asaduzzaman', theses: 5 },
  { name: 'Dr. Mohammed Moshiul Hoque', theses: 5 },
];

const COLORS = ['#4f46e5', '#059669', '#0891b2', '#7c3aed', '#db2777'];

export function DashboardStats() {
  const [totalTheses, setTotalTheses] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [supervisors, setSupervisors] = useState(0);
  const [topicData, setTopicData] = useState<{ name: string; count: number }[]>([]);
  const [supervisionData, setSupervisionData] = useState<{ name: string; theses: number }[]>([]);
  const [expertiseData, setExpertiseData] = useState<{ name: string; value: number }[]>([]);
  // const [expertiseData, setExpertiseData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Dashboard'));
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          setTotalTheses(data['Total Theses'] || 0);
          setActiveProjects(data['Active Projects'] || 0);
          setSupervisors(data['Supervisors'] || 0);
        });

        const topicDoc = await getDoc(doc(db, 'PopularTopic', 'Original'));
        if (topicDoc.exists()) {
          const topics = topicDoc.data();
          const sortedTopics = Object.entries(topics)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          setTopicData(sortedTopics);
        }

        const supDoc = await getDoc(doc(db, 'SupervisorDistribution', 'Original'));
        if (supDoc.exists()) {
          const supData = supDoc.data();
          const sortedSupData = Object.entries(supData)
            .map(([name, theses]) => ({ name, theses }))
            .sort((a, b) => b.theses - a.theses)
            .slice(0, 5);
          setSupervisionData(sortedSupData);
        }

        const expDoc = await getDoc(doc(db, 'Expertise', 'Original'));
        if (expDoc.exists()) {
          const expData = expDoc.data();
          const sortedExpData = Object.entries(expData)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          setExpertiseData(sortedExpData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={50} color="#4f46e5" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-semibold">Total Theses</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{totalTheses}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            <h3 className="text-lg font-semibold">Active Projects</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{activeProjects}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 text-amber-900 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-amber-600" />
            <h3 className="text-lg font-semibold">Supervisors</h3>
          </div>
          <p className="text-3xl font-bold text-amber-700">{supervisors}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Popular Thesis Topics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topicData}
                margin={{ top: 5, right: 30, left: 40, bottom: 25 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Supervision Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supervisionData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                layout="vertical"
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="theses" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Supervisor Expertise</h3>
          <div className="flex items-start gap-8">
            <div className="h-64 flex-1">
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 pt-8">
              {expertiseData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-gray-600">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Theses</span>
              <span className="font-semibold">{totalTheses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Supervisors</span>
              <span className="font-semibold">{supervisors}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Reviews</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month's Submissions</span>
              <span className="font-semibold">2</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}