import { GraduationCap, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';

export function FacultyNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('facultyId');
    navigate({ to: '/' });
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">CUET CSE Faculty Portal</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
              activeProps={{ className: 'text-indigo-600 bg-indigo-50' }}
            >
              <User className="h-4 w-4 mr-1" />
              Profile
            </Link>
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
