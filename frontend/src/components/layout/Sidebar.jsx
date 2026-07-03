import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Box,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const dispatch = useDispatch();

  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/app/dashboard' },
    { icon: ShoppingCart, label: 'Sales', path: '/app/sales' },
    { icon: DollarSign, label: 'Expenses', path: '/app/expenses' },
    { icon: Box, label: 'Products', path: '/app/products' },
    { icon: ShoppingCart, label: 'Inventory', path: '/app/inventory' },
    { icon: Users, label: 'Customers', path: '/app/customers' },
    { icon: Users, label: 'SACCO', path: '/app/sacco' },
    { icon: BarChart3, label: 'Reports', path: '/app/reports' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/home';
  };


  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transition-all duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">OptiBiz</h1>
          <p className="text-gray-400 text-sm">Business Management</p>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-800 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-gray-300 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Close sidebar on mobile when navigating */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
