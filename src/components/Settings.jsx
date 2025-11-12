import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaBars, FaUserCircle, FaKey, FaTrashAlt, FaCamera, FaSignOutAlt,
  FaChevronRight, FaChevronDown, FaChevronUp, FaShieldAlt, FaUserEdit,
  FaExclamationTriangle
} from 'react-icons/fa';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { 
  RiDashboardLine, RiFileListLine, RiSettings4Line, RiLogoutBoxLine,
  RiUserLine, RiLockLine, RiDeleteBin7Line, RiImageLine, RiShieldLine
} from 'react-icons/ri';
import { FiPackage, FiUser, FiMail, FiPhone, FiCalendar, FiInfo } from 'react-icons/fi';
import { logout } from '../services/operations/authAPI';
import { updateProfile, updateDisplayPicture, deleteProfile } from '../services/operations/SettingsAPI';
import { useForm, Controller } from 'react-hook-form';
import { CircularProgress, TextField, Tooltip, Avatar, Badge } from '@mui/material';
import { format } from 'date-fns';

// Custom validation functions
const validateFirstName = (value) => {
  if (!value) return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return true;
};

const validateLastName = (value) => {
  if (!value) return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return true;
};

const validateContactNumber = (value) => {
  const regex = /^[0-9]{10,12}$/;
  if (!value) return 'Phone number is required';
  if (!regex.test(value)) return 'Phone number must be between 10-12 digits';
  return true;
};

const validateDateOfBirth = (value) => {
  if (value && new Date(value) > new Date()) return 'Date cannot be in the future';
  return true;
};

const validateGender = (value) => {
  if (!value) return 'Gender is required';
  return true;
};

const validateAbout = (value) => {
  if (value.length > 250) return 'About must be less than 250 characters';
  return true;
};

const validateCurrentPassword = (value) => {
  if (!value) return 'Current password is required';
  return true;
};

const validateNewPassword = (value) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!value) return 'New password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!regex.test(value)) return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  return true;
};

const validateConfirmPassword = (value, newPassword) => {
  if (value !== newPassword) return 'Passwords must match';
  return true;
};

// Tab components
const TabItem = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 shadow-md transform scale-105'
          : 'text-gray-600 hover:bg-gray-50 hover:scale-102'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
        active ? 'bg-indigo-100 shadow-inner' : 'bg-gray-100'
      }`}>
        {icon}
      </div>
      <span className={`font-medium transition-all duration-300 ${active ? 'text-indigo-700' : ''}`}>{label}</span>
      {active && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-auto"
        >
          <FaChevronRight className="text-indigo-500" />
        </motion.div>
      )}
    </button>
  );
};

// Main Settings Component
const Settings = () => {
  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewSource, setPreviewSource] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  
  // Hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  // Form setup
  const { 
    control: profileControl, 
    handleSubmit: handleProfileSubmit, 
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      contactNumber: user?.mobile_no || '',
      dateOfBirth: user?.additionalDetails?.dateOfBirth || '',
      gender: user?.additionalDetails?.gender || 'Prefer not to say',
      about: user?.additionalDetails?.about || ''
    }
  });

  const { 
    control: passwordControl, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        contactNumber: user?.mobile_no || '',
        dateOfBirth: user?.additionalDetails?.dateOfBirth || '',
        gender: user?.additionalDetails?.gender || 'Prefer not to say',
        about: user?.additionalDetails?.about || ''
      });
    }
  }, [user, resetProfile]);

  // Sidebar toggle handlers
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnClickOutside = useCallback((e) => {
    if (sidebarOpen && !e.target.closest('.sidebar')) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen]);

  // Logout handler
  const logoutHandler = async () => {
    dispatch(logout(navigate));
    toast.success("Logged out successfully");
  };

  // Profile picture handlers
  const handleFileClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      previewFile(file);
    }
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPreviewSource(reader.result);
    };
  };

  const handleFileUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("displayPicture", imageFile);
      await dispatch(updateDisplayPicture(token, formData, navigate));
      toast.success("Profile picture updated successfully");
      setImageFile(null);
    } catch (error) {
      toast.error("Failed to update profile picture");
      console.error("Error updating profile picture:", error);
    } finally {
      setLoading(false);
    }
  };

  // Form submission handlers
  const onProfileSubmit = async (data) => {
    const profileValidationErrors = {
      firstName: validateFirstName(data.firstName),
      lastName: validateLastName(data.lastName),
      contactNumber: validateContactNumber(data.contactNumber),
      dateOfBirth: validateDateOfBirth(data.dateOfBirth),
      gender: validateGender(data.gender),
      about: validateAbout(data.about),
    };

    if (Object.values(profileValidationErrors).some((error) => error !== true)) {
      toast.error("Please fix the validation errors");
      return;
    }

    setSavingProfile(true);
    try {
      await dispatch(updateProfile(token, data, navigate));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    const passwordValidationErrors = {
      currentPassword: validateCurrentPassword(data.currentPassword),
      newPassword: validateNewPassword(data.newPassword),
      confirmPassword: validateConfirmPassword(data.confirmPassword, data.newPassword),
    };

    if (Object.values(passwordValidationErrors).some((error) => error !== true)) {
      toast.error("Please fix the validation errors");
      return;
    }

    setSavingPassword(true);
    try {
      // Implement password update logic here
      toast.success("Password updated successfully");
      resetPassword();
    } catch (error) {
      toast.error("Failed to update password");
      console.error("Error updating password:", error);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await dispatch(deleteProfile(token));
      setDeleteModalOpen(false);
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error("Failed to delete account");
      console.error("Error deleting account:", error);
    }
  };

  // Gender options
  const genderOptions = ["Male", "Female", "Prefer not to say", "Other"];

  return (
    <div onClick={closeSidebarOnClickOutside} className="min-h-screen bg-gray-50 flex flex-col">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
      </div>

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
                <h1 className="text-xl font-bold text-blue-900">Medi1Plus</h1>
                <p className="text-xs text-gray-600">Medical Health Records System</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 mr-2">
              {user?.firstName?.charAt(0) || <FaUser />}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {user?.accountType === 'User' ? 'Citizen' : 'Healthcare Provider'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Sidebar - Desktop (always visible) */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="mb-6">
              <p className="text-xs uppercase text-gray-500 font-medium mb-2">Settings</p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                    activeTab === 'profile' ? 'text-blue-800 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RiUserLine className="mr-3" /> Profile
                </button>
                <button
                  onClick={() => setActiveTab('picture')}
                  className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                    activeTab === 'picture' ? 'text-blue-800 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RiImageLine className="mr-3" /> Profile Picture
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                    activeTab === 'password' ? 'text-blue-800 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RiLockLine className="mr-3" /> Password
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                    activeTab === 'delete' ? 'text-red-600 bg-red-50' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <RiDeleteBin7Line className="mr-3" /> Delete Account
                </button>
              </nav>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-xs text-blue-700 mb-3">
                Contact our support team for assistance with your account settings.
              </p>
              <a
                href="mailto:support@medisecure.gov.in"
                className="text-xs text-white bg-blue-700 px-3 py-1.5 rounded inline-block hover:bg-blue-800"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar - Mobile (toggleable) */}
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
                  <div className="mb-6">
                    <p className="text-xs uppercase text-gray-500 font-medium mb-2">Settings</p>
                    <nav className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          toggleSidebar();
                        }}
                        className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                          activeTab === 'profile' ? 'text-blue-800 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <RiUserLine className="mr-3" /> Profile
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('picture');
                          toggleSidebar();
                        }}
                        className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                          activeTab === 'picture' ? 'text-blue-800 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <RiImageLine className="mr-3" /> Profile Picture
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('password');
                          toggleSidebar();
                        }}
                        className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                          activeTab === 'password' ? 'text-blue-800 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <RiLockLine className="mr-3" /> Password
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('delete');
                          toggleSidebar();
                        }}
                        className={`flex items-center w-full px-4 py-2.5 rounded-md font-medium ${
                          activeTab === 'delete' ? 'text-red-600 bg-red-50' : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <RiDeleteBin7Line className="mr-3" /> Delete Account
                      </button>
                    </nav>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Account Settings
                </h1>
                <p className="text-gray-600">
                  Manage your profile and account preferences
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                {activeTab === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                      <p className="text-sm text-gray-600 mt-1">Update your personal information</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
                      <div className="flex items-start">
                        <FiInfo className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p className="ml-3 text-blue-700 text-sm">
                          Keep your profile information up to date to enhance your experience with MediSecure.
                        </p>
                      </div>
                    </div>
                    {/* Profile Form */}
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                          <Controller
                            name="firstName"
                            control={profileControl}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiUser className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    {...field}
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                      profileErrors.firstName ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="Enter your first name"
                                  />
                                </div>
                                {profileErrors.firstName && (
                                  <p className="text-red-500 text-xs mt-1">{profileErrors.firstName.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <Controller
                            name="lastName"
                            control={profileControl}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiUser className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    {...field}
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                      profileErrors.lastName ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="Enter your last name"
                                  />
                                </div>
                                {profileErrors.lastName && (
                                  <p className="text-red-500 text-xs mt-1">{profileErrors.lastName.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        {/* Contact Number */}
                        <div>
                          <Controller
                            name="contactNumber"
                            control={profileControl}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiPhone className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    {...field}
                                    type="tel"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                      profileErrors.contactNumber ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="Enter your phone number"
                                  />
                                </div>
                                {profileErrors.contactNumber && (
                                  <p className="text-red-500 text-xs mt-1">{profileErrors.contactNumber.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <Controller
                            name="dateOfBirth"
                            control={profileControl}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiCalendar className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    {...field}
                                    type="date"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                      profileErrors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    max={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                                {profileErrors.dateOfBirth && (
                                  <p className="text-red-500 text-xs mt-1">{profileErrors.dateOfBirth.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <Controller
                            name="gender"
                            control={profileControl}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiUser className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <select
                                    {...field}
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                      profileErrors.gender ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none`}
                                  >
                                    {genderOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <FaChevronDown className="h-4 w-4" />
                                  </div>
                                </div>
                                {profileErrors.gender && (
                                  <p className="text-red-500 text-xs mt-1">{profileErrors.gender.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        {/* About */}
                        <div className="md:col-span-2">
                          <Controller
                            name="about"
                            control={profileControl}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">About</label>
                                <div className="relative">
                                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                    <FiInfo className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <textarea
                                    {...field}
                                    rows={4}
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                      profileErrors.about ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    placeholder="Tell us a bit about yourself"
                                  />
                                </div>
                                <div className="flex justify-between">
                                  {profileErrors.about ? (
                                    <p className="text-red-500 text-xs mt-1">{profileErrors.about.message}</p>
                                  ) : (
                                    <p className="text-gray-500 text-xs mt-1">Max 250 characters</p>
                                  )}
                                  <p className="text-gray-500 text-xs mt-1">{field.value?.length || 0}/250</p>
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => resetProfile()}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all font-medium"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={savingProfile}
                          className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {savingProfile ? (
                            <>
                              <CircularProgress size={16} thickness={5} color="inherit" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Changes</span>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
                {activeTab === 'picture' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
                      <p className="text-sm text-gray-600 mt-1">Update your profile photo</p>
                    </div>

                    {/* Profile Picture Form */}
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                      <div className="mb-8 relative">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-white shadow-xl relative group"
                        >
                          <img
                            src={previewSource || user?.image || "https://ui-avatars.com/api/?name=" + (user?.firstName || "User") + "&background=4F46E5&color=fff"}
                            alt={user?.firstName || "User"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <p className="text-white text-sm font-medium">Change Picture</p>
                          </div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute bottom-0 right-0"
                        >
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-3 rounded-full cursor-pointer shadow-lg hover:shadow-indigo-200/50 transition-all"
                            onClick={handleFileClick}
                          >
                            <FaCamera size={18} />
                          </div>
                        </motion.div>
                      </div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/gif, image/jpeg"
                      />
                      
                      <div className="space-y-3 text-center mt-4">
                        <p className="text-indigo-700 font-medium">Click on the camera icon to select a new profile picture</p>
                        <div className="bg-indigo-100 p-3 rounded-xl inline-flex items-center gap-2 text-indigo-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">Recommended: Square image, at least 300x300 pixels</span>
                        </div>
                      </div>
                      
                      {imageFile && (
                        <div className="mt-6 flex flex-col items-center">
                          <p className="text-gray-700 mb-2">Selected: {imageFile.name}</p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFileUpload}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {loading ? (
                              <>
                                <CircularProgress size={16} thickness={5} color="inherit" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <FaCamera size={16} />
                                <span>Upload Picture</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                {activeTab === 'password' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                      <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
                    </div>

                    {/* Password Form */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
                      <div className="flex items-start">
                        <FaShieldAlt className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Secure Your Account</h3>
                          <p className="text-blue-700 text-sm mt-1">
                            A strong password helps protect your account from unauthorized access.
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Password Form */}
                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-8">
                      {/* Current Password */}
                      <div>
                        <Controller
                          name="currentPassword"
                          control={passwordControl}
                          render={({ field }) => (
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">Current Password</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FaKey className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  {...field}
                                  type={showCurrentPassword ? "text" : "password"}
                                  className={`block w-full pl-10 pr-10 py-2 border ${
                                    passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                                  } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                  placeholder="Enter your current password"
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? (
                                    <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              {passwordErrors.currentPassword && (
                                <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </div>

                      {/* New Password */}
                      <div>
                        <Controller
                          name="newPassword"
                          control={passwordControl}
                          render={({ field }) => (
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">New Password</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FaKey className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  {...field}
                                  type={showNewPassword ? "text" : "password"}
                                  className={`block w-full pl-10 pr-10 py-2 border ${
                                    passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                                  } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                  placeholder="Enter your new password"
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              {passwordErrors.newPassword && (
                                <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <Controller
                          name="confirmPassword"
                          control={passwordControl}
                          render={({ field }) => (
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FaKey className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  className={`block w-full pl-10 pr-10 py-2 border ${
                                    passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                  } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                  placeholder="Confirm your new password"
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              {passwordErrors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <FaShieldAlt className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">Password Requirements</h3>
                              <div className="mt-2 text-sm text-blue-700 space-y-1">
                                <p>Your password must:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Be at least 8 characters long</li>
                                  <li>Include at least one uppercase letter</li>
                                  <li>Include at least one lowercase letter</li>
                                  <li>Include at least one number</li>
                                  <li>Include at least one special character</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => resetPassword()}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all font-medium"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={savingPassword}
                          className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {savingPassword ? (
                            <>
                              <CircularProgress size={16} thickness={5} color="inherit" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <span>Update Password</span>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
                {activeTab === 'delete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
                      <p className="text-sm text-gray-600 mt-1">Permanently remove your account and all data</p>
                    </div>

                    {/* Delete Account Warning */}
                    <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-lg mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FaTrashAlt className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-base font-medium text-red-800">Delete Your Account</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>This action is permanent and cannot be undone. All your data will be permanently removed.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">What happens when you delete your account?</h3>
                      
                      <ul className="space-y-4 mb-6">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-xs">1</span>
                            </div>
                          </div>
                          <p className="ml-3 text-gray-600">Your profile and personal information will be permanently deleted</p>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-xs">2</span>
                            </div>
                          </div>
                          <p className="ml-3 text-gray-600">Your order history will be removed from our system</p>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-xs">3</span>
                            </div>
                          </div>
                          <p className="ml-3 text-gray-600">You will lose access to all your account data and services</p>
                        </li>
                      </ul>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setDeleteModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        <FaTrashAlt className="h-4 w-4" />
                        <span>Delete My Account</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

        {/* Delete Account Confirmation Modal */}
        <AnimatePresence>
          {deleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-pink-100 mb-6 shadow-inner"
                  >
                    <FaTrashAlt className="h-10 w-10 text-red-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Account Deletion</h3>
                  <p className="mt-2 text-gray-600 max-w-sm mx-auto">
                    This action <span className="font-semibold text-red-600">cannot be undone</span>. Are you absolutely sure you want to permanently delete your account?
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 p-5 mb-8 rounded-lg shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <FaExclamationTriangle className="h-6 w-6 text-red-500" />
                      </motion.div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-semibold text-red-800 mb-1">Warning</h4>
                      <p className="text-sm text-red-700 leading-relaxed">
                        All your data, including profile information, order history, and preferences will be <span className="font-bold underline">permanently deleted</span> and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all font-medium"
                  >
                    Keep My Account
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <FaTrashAlt className="h-4 w-4" />
                    <span>Yes, Delete My Account</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add CSS animations using standard style tag */}
        <style>
          {`
          /* Custom Scrollbar */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            transition: all 0.3s;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Animations */
          @keyframes gradient-x {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes fade-in {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes float {
            0% {
              transform: translateY(0px) translateX(0px);
            }
            25% {
              transform: translateY(-10px) translateX(10px);
            }
            50% {
              transform: translateY(0px) translateX(0px);
            }
            75% {
              transform: translateY(10px) translateX(-10px);
            }
            100% {
              transform: translateY(0px) translateX(0px);
            }
          }

          @keyframes pulse-glow {
            0% {
              box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }

          @keyframes blob {
            0% {
              transform: scale(1);
            }
            33% {
              transform: scale(1.1);
            }
            66% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
            }
          }

          /* Animation classes */
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 15s ease infinite;
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animate-pulse-glow {
            animation: pulse-glow 2s infinite;
          }

          .animate-shimmer {
            background: linear-gradient(90deg,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.8) 50%,
              rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }

          /* Animation delays */
          .animation-delay-100 {
            animation-delay: 0.1s;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
          }

          .animation-delay-300 {
            animation-delay: 0.3s;
          }
          
          .animation-delay-500 {
            animation-delay: 0.5s;
          }
          
          .animation-delay-700 {
            animation-delay: 0.7s;
          }
          
          .animation-delay-1000 {
            animation-delay: 1s;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-3000 {
            animation-delay: 3s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }
          
          .animation-delay-5000 {
            animation-delay: 5s;
          }
          `}
        </style>

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

export default Settings;