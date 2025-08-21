import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileModal from '../components/ProfileModal';
import { FaSpinner, FaIdCard, FaUser } from 'react-icons/fa';
import GridPattern from '../components/GridPattern';

const CompleteProfile = () => {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is logged in
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // Only show for regular users
    if (user.accountType !== 'User') {
      navigate('/login');
      return;
    }

    // Check if user already has a complete profile
    const hasCompleteProfile = user.additionalDetails &&
                              user.additionalDetails.isProfileComplete === true;

    // If user has a complete profile, redirect to dashboard
    if (hasCompleteProfile) {
      navigate('/user-dashboard');
      return;
    }

    // Show loading for a brief moment to ensure smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowModal(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, token, navigate]);

  // If user closes the modal, redirect to appropriate page
  const handleCloseModal = () => {
    setShowModal(false);

    // If user has a partial profile, redirect to dashboard
    // Otherwise, redirect to login
    if (user && user.additionalDetails) {
      navigate('/user-dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
        Government of India | Ministry of Health and Family Welfare
      </div>

      <header className="bg-white shadow-md py-3">
        <div className="container mx-auto px-4 flex items-center">
          <div className="flex items-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="National Emblem"
              className="h-12 mr-3"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-900">MediSecure</h1>
              <p className="text-xs text-gray-600">National Health Records System</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 z-0">
          <GridPattern
            width={40}
            height={40}
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth={1}
          />
        </div>

        <div className="absolute top-0 left-0 w-full h-32 bg-blue-800 transform -skew-y-2 origin-top-left z-0"></div>

        {isLoading ? (
          <motion.div
            className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10 relative text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Preparing Your Profile</h2>
            <p className="text-gray-600">
              Please wait while we set up your health profile...
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10 relative text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaIdCard className="text-blue-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {user.additionalDetails ? 'Update Your Profile' : 'Complete Your Profile'}
            </h2>
            <p className="text-gray-600 mb-6">
              {user.additionalDetails
                ? 'Please update your medical profile to ensure your information is current.'
                : 'You\'re almost there! Complete your medical profile to access your dashboard and generate your Arogya Netra Card.'}
            </p>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
                <FaUser />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              {user.additionalDetails ? 'Update Profile Now' : 'Complete Profile Now'}
            </button>
          </motion.div>
        )}
      </div>

      <footer className="bg-gray-800 text-white py-4 text-center text-sm">
        <p>© {new Date().getFullYear()} MediSecure. All rights reserved. Government of India.</p>
        <p className="mt-1">
          <a href="#" className="text-gray-400 hover:text-white mx-2">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-white mx-2">Terms of Use</a>
          <a href="#" className="text-gray-400 hover:text-white mx-2">Accessibility</a>
        </p>
      </footer>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
        token={token} 
        userData={user} 
      />
    </div>
  );
};

export default CompleteProfile;