import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Radio, 
  Calendar, 
  Trophy,
  BarChart3,
  Gamepad2,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store/appStore';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Market', href: '/market', icon: TrendingUp },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'Live Race', href: '/live', icon: Radio },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Games', href: '/games', icon: Gamepad2 },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:block bg-dark-900/80 backdrop-blur-lg border-b border-dark-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F1</span>
              </div>
              <span className="text-white font-bold text-xl">PlayStock</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-dark-400">
                  ${user?.balance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden bg-dark-900/80 backdrop-blur-lg border-b border-dark-800 sticky top-0 z-50">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F1</span>
              </div>
              <span className="text-white font-bold">PlayStock</span>
            </Link>

            {/* User Balance */}
            <div className="text-right mr-2">
              <p className="text-xs text-dark-400">${user?.balance.toLocaleString()}</p>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-dark-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-dark-800 bg-dark-900">
            <div className="px-2 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-dark-800"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
