import { BookOpen, GraduationCap, Home, Layout, User, Users, LogOut } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';

const navItems = [
  { name: 'Dashboard', icon: Home, path: '/dashboard' },
  { name: 'Thesis Papers', icon: BookOpen, path: '/thesis' },
  { name: 'Academic Projects', icon: Layout, path: '/projects' },
  { name: 'Supervisor Information', icon: Users, path: '/supervisors' },
  { name: 'Profile', icon: User, path: '/profile' },
  // { name: 'Faculty', icon: User, path: '/faculty-profile' },
];

export function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
  
    console.log('Logging out...');
    localStorage.removeItem('studentId');
    navigate({ to: '/' }); 
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">CUET CSE Thesis Portal</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
                  activeProps={{ className: 'text-indigo-600 bg-indigo-50' }}
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
