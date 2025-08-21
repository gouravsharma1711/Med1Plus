import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaUserMd,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaTimes
} from 'react-icons/fa';

const Sidebar = ({ sidebarOpen, toggleSidebar, logoutHandler, isMobile = false }) => {
  const sidebarContent = (
    <>
      <div className="mb-6">
        <p className="text-xs uppercase text-gray-500 font-medium mb-2">Main Menu</p>
        <nav className="space-y-1">
          <Link to="/professional-dashboard" className="flex items-center px-4 py-2.5 text-blue-800 bg-blue-50 rounded-md font-medium">
            <FaHome className="mr-3" /> Dashboard
          </Link>
        </nav>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase text-gray-500 font-medium mb-2">Account</p>
        <nav className="space-y-1">
          <Link to="/my-profile" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
            <FaUserMd className="mr-3" /> My Profile
          </Link>
          <Link to="#" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
            <FaCog className="mr-3" /> Settings
          </Link>
          <Link to="#" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
            <FaQuestionCircle className="mr-3" /> Help & Support
          </Link>
          <button
            onClick={logoutHandler}
            className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
          >
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </nav>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
        <p className="text-xs text-blue-700 mb-3">
          Contact our support team for assistance with the professional portal.
        </p>
        <a
          href="mailto:support@medisecure.gov.in"
          className="text-xs text-white bg-blue-700 px-3 py-1.5 rounded inline-block hover:bg-blue-800"
        >
          Contact Support
        </a>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50" onClick={toggleSidebar}></div>
            <motion.div
              className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                    alt="National Emblem"
                    className="h-8 mr-2"
                  />
                  <h2 className="text-lg font-bold text-blue-900">MediSecure</h2>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4">
                {sidebarContent}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        {sidebarContent}
      </div>
    </div>
  );
};

export default Sidebar;