import { Router, RouterProvider, Route, RootRoute, Outlet } from '@tanstack/react-router';
import { useLocation } from '@tanstack/react-router'; // or 'react-router-dom'
import { Navbar } from './components/Navbar';
import { FacultyNavbar } from './components/FacultyNavbar'; // Import FacultyNavbar
import { Dashboard } from './pages/Dashboard';
import { ThesisPapers } from './pages/ThesisPapers';
import { AcademicProjects } from './pages/AcademicProjects';
import { SupervisorInfo } from './pages/SupervisorInfo';
import { Profile } from './pages/Profile';
import { FacultyProfile } from './pages/FacultyProfile';
import Login from './pages/Login';

const Root = () => {
  const location = useLocation();

  // Determine which navbar to show based on the current path
  const showNavbar = location.pathname !== '/';
  const showFacultyNavbar = location.pathname === '/faculty-profile';

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && !showFacultyNavbar && <Navbar />} {/* Conditionally render Navbar */}
      {showFacultyNavbar && <FacultyNavbar />} {/* Conditionally render FacultyNavbar */}
      <main>
        <Outlet /> {/* Renders the current page component */}
      </main>
    </div>
  );
};

// RootRoute definition
const rootRoute = new RootRoute({
  component: Root, // Use the updated Root component here
});

// Create individual routes
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Login,
});
const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
});
const thesisRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/thesis',
  component: ThesisPapers,
});

const projectsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: AcademicProjects,
});

const supervisorsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/supervisors',
  component: SupervisorInfo,
});

const profileRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: Profile,
});

const facultyProfileRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/faculty-profile',
  component: FacultyProfile,
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  indexRoute,
  thesisRoute,
  projectsRoute,
  supervisorsRoute,
  profileRoute,
  dashboardRoute,
  facultyProfileRoute,
]);

const router = new Router({ routeTree });

// App component
export default function App() {
  return <RouterProvider router={router} />;
}