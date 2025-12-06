import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  PhotoIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  CloudArrowUpIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'All Images', href: '/images', icon: PhotoIcon },
  { name: 'People', href: '/people', icon: UserGroupIcon },
  { name: 'Unidentified', href: '/unidentified', icon: QuestionMarkCircleIcon },
  { name: 'Upload', href: '/upload', icon: CloudArrowUpIcon },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-500">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-dark-400 border-r border-dark-100 lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-6 border-b border-dark-100">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-gradient">Image Organizer</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-dark-300 hover:text-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-400 border-r border-dark-100">
          <div className="flex h-16 items-center px-6 border-b border-dark-100">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gradient">Image Organizer</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-dark-300 hover:text-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-dark-100">
            <div className="px-4 py-3 rounded-lg bg-dark-300">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Powered by
              </p>
              <p className="text-sm font-medium text-gray-300">
                AI Face Recognition
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-dark-400/95 backdrop-blur-sm border-b border-dark-100 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gradient">Image Organizer</span>
          </Link>
        </div>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem-3rem)] lg:min-h-[calc(100vh-3rem)]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-8"
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="h-12 flex items-center justify-center gap-6 border-t border-dark-100 bg-dark-400/50">
          <a
            href="https://github.com/CrimsonREwind/image-organizer-web-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-400 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            v1
          </a>
          <span className="text-gray-600">|</span>
          <a
            href="https://github.com/CrimsonREwind/Image-Organizer-AI-Face-Recognition"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-400 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            v2
          </a>
        </footer>
      </div>
    </div>
  );
}
