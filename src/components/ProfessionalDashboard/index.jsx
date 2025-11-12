import React, { useState, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/operations/authAPI';
import { FaCamera, FaSearch, FaQrcode, FaIdCard, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Import components
import Header from './Header';
import Sidebar from './Sidebar';
import PatientDetails from './PatientDetails';

// Lazy load components to improve performance
const FaceScan = lazy(() => import('./FaceScan'));
const QRScan = lazy(() => import('./QRScan'));
const SearchPatient = lazy(() => import('./SearchPatient'));
const MedicalHistory = lazy(() => import('./MedicalHistory'));

// Loading component
const LoadingComponent = () => (
  <div className="flex justify-center items-center h-64">
    <FaSpinner className="animate-spin text-blue-600 text-3xl" />
  </div>
);

const ProfessionalDashboard = () => {
  // State
  const [userDetails, setUserDetails] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('facescan');
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New patient record uploaded', read: false, date: '2 hours ago' },
    { id: 2, text: 'Dr. Gupta requested access to patient #12458', read: false, date: '1 day ago' },
    { id: 3, text: 'System maintenance scheduled for tonight', read: true, date: '3 days ago' }
  ]);

  // Redux
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handlers
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnClickOutside = (e) => {
    if (sidebarOpen && !e.target.closest('.sidebar')) {
      setSidebarOpen(false);
    }
  };

  const logoutHandler = async () => {
    dispatch(logout(navigate));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Handle view medical history
  const handleViewMedicalHistory = () => {
    setShowMedicalHistory(true);
  };

  const handleBackToPatientDetails = () => {
    setShowMedicalHistory(false);
  };

  // Scan method options
  const scanOptions = [
    { id: 'facescan', icon: <FaCamera size={24} />, title: 'Face Scan', description: 'Scan patient face for identification' },
    { id: 'qrscan', icon: <FaQrcode size={24} />, title: 'QR Scan', description: 'Scan Arogya Netra Card QR code' },
    { id: 'search', icon: <FaSearch size={24} />, title: 'Search by ID', description: 'Search using Arogya Netra Card ID' }
  ];

  // Memoize the active component to prevent unnecessary re-renders
  const renderActiveComponent = () => {
    return (
      <Suspense fallback={<LoadingComponent />}>
        {activeTab === 'facescan' && (
          <FaceScan
            setUserDetails={setUserDetails}
            calculateAge={calculateAge}
          />
        )}

        {activeTab === 'qrscan' && (
          <QRScan
            setUserDetails={setUserDetails}
            calculateAge={calculateAge}
          />
        )}

        {activeTab === 'search' && (
          <SearchPatient
            setUserDetails={setUserDetails}
            calculateAge={calculateAge}
          />
        )}
      </Suspense>
    );
  };

  return (
    <div onClick={closeSidebarOnClickOutside} className="min-h-screen bg-gray-50 flex flex-col">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
        Smart Healthcare System
      </div>

      {/* Header */}
      <Header
        toggleSidebar={toggleSidebar}
        user={user}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
      />

      <div className="flex flex-grow">
        {/* Sidebar - Desktop */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          logoutHandler={logoutHandler}
        />

        {/* Sidebar - Mobile */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          logoutHandler={logoutHandler}
          isMobile={true}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.firstName ? `Dr. ${user.firstName}` : 'Doctor'}
              </h1>
              <p className="text-gray-600">
                Access and manage patient records securely with MediSecure
              </p>
            </div>

            {/* Main Dashboard Content */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side - Scan Options */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Patient Identification</h2>
                    <p className="text-sm text-gray-600 mt-1">Select a method to identify patients</p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {scanOptions.map((option) => (
                      <motion.div
                        key={option.id}
                        className={`p-4 cursor-pointer ${activeTab === option.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => setActiveTab(option.id)}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <div className={`p-3 rounded-full mr-4 ${activeTab === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-medium ${activeTab === option.id ? 'text-blue-700' : 'text-gray-800'}`}>
                              {option.title}
                            </h3>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                          {activeTab === option.id && (
                            <FaArrowRight className="text-blue-600" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Current Scan Method */}
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    {renderActiveComponent()}
                  </div>
                </div>
              </div>

              {/* Right Side - Patient Details or Medical History */}
              <div className="lg:w-2/3">
                <AnimatePresence mode="wait">
                  {showMedicalHistory && userDetails ? (
                    <motion.div
                      key="medical-history"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <Suspense fallback={<LoadingComponent />}>
                        <MedicalHistory
                          userDetails={userDetails}
                          calculateAge={calculateAge}
                          onBack={handleBackToPatientDetails}
                        />
                      </Suspense>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="patient-details"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {userDetails
                            ? `Viewing details for ${userDetails.firstName} ${userDetails.lastName}`
                            : 'Use the identification methods on the left to retrieve patient data'}
                        </p>
                      </div>
                      <div className="p-6">
                        <PatientDetails
                          userDetails={userDetails}
                          calculateAge={calculateAge}
                          onViewMedicalHistory={handleViewMedicalHistory}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-white py-4 text-center text-sm mt-auto">
        <p>© {new Date().getFullYear()} MediSecure. All rights reserved. Government of India.</p>
        <p className="mt-1">
          <a href="#" className="text-gray-400 hover:text-white mx-2">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-white mx-2">Terms of Use</a>
          <a href="#" className="text-gray-400 hover:text-white mx-2">Accessibility</a>
        </p>
      </footer>
    </div>
  );
};

export default ProfessionalDashboard;