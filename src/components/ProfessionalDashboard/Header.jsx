import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaBell, FaUserMd } from 'react-icons/fa';

const Header = ({ 
  toggleSidebar, 
  user, 
  notifications, 
  showNotifications, 
  setShowNotifications, 
  markAllNotificationsAsRead 
}) => {
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-md py-3 sticky top-0 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 text-blue-800 p-2 rounded-md hover:bg-blue-50 lg:hidden"
          >
            <FaBars />
          </button>

          <Link to="/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dyg2kv4z4/image/upload/v1760036497/Med1plus_nbuahc.png"
              alt="National Emblem"
              className="h-10 mr-3"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-900">Med1Plus</h1>
              <p className="text-xs text-gray-600">Healthcare Professional Portal</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              className="p-2 text-blue-800 hover:bg-blue-50 rounded-full relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                    <h3 className="font-medium text-blue-800">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="text-sm text-gray-800">{notification.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                    <Link to="#" className="text-xs text-blue-600 hover:text-blue-800">
                      View all notifications
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 mr-2">
              {user?.firstName?.charAt(0) || <FaUserMd />}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">
                {user?.firstName ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.specialization || 'Healthcare Professional'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;