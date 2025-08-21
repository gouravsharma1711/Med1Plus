import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { sendOtp } from '../services/operations/authAPI';
import { setSignupData } from '../slices/authSlice';
import { FaUser, FaUserMd, FaEnvelope, FaPhone, FaWhatsapp, FaIdCard, FaArrowLeft, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import GridPattern from './GridPattern';

const SignupUser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1); // Track registration steps
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile_no: '',
    email: '',
    contactType: 'email',
    userType: 'User',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [resend, setResend] = useState(false);
  const [otp, setOtp] = useState('');
  const [ans, setAns] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const { firstName, lastName, mobile_no, email, contactType, userType } = formData;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // OTP timer countdown
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Mobile number validation
    if (!mobile_no.trim()) {
      newErrors.mobile_no = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile_no)) {
      newErrors.mobile_no = 'Mobile number must be 10 digits';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const otpHandler = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        ...formData,
        userType,
      };

      dispatch(setSignupData(signupData));

      // Send OTP via the selected contact method
      const contactValue = contactType === 'email' ? formData.email : formData.mobile_no;

      await dispatch(sendOtp(
        setAns,
        contactType,
        contactValue,
        navigate
      ));

      setOtp('');
      setResend(true);
      setOtpSent(true);
      setOtpTimer(120); // 2 minutes countdown
      setStep(2); // Move to OTP verification step
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrors({
        ...errors,
        general: 'Failed to send OTP. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = () => {
    if (!otp.trim()) {
      setErrors({
        ...errors,
        otp: 'Please enter the OTP sent to you',
      });
      return;
    }

    if (otp === ans) {
      navigate(`/signup/next`);
    } else {
      setErrors({
        ...errors,
        otp: 'Incorrect OTP. Please try again.',
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
        Government of India | Ministry of Health and Family Welfare
      </div>

      <header className="bg-white shadow-md py-3">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="National Emblem"
              className="h-12 mr-3"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-900">MediSecure</h1>
              <p className="text-xs text-gray-600">National Health Records System</p>
            </div>
          </Link>

          <button
            onClick={() => navigate('/')}
            className="ml-auto flex items-center text-blue-800 hover:text-blue-600"
          >
            <FaArrowLeft className="mr-1" /> Back to Home
          </button>
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

        <motion.div
          className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Registration Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <span className="text-xs mt-1">Account</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <span className="text-xs mt-1">Verify</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
                <span className="text-xs mt-1">Complete</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl mb-6 text-center text-blue-900 font-bold">
            {step === 1 ? 'Create Your Account' : 'Verify Your Identity'}
          </h2>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-center">
              <FaExclamationCircle className="mr-2" />
              <p>{errors.general}</p>
            </div>
          )}

          <form onSubmit={otpHandler}>
            {step === 1 && (
              <>
                {/* User Type Selection */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Register as:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData((prevData) => ({ ...prevData, userType: 'User' }))}
                      className={`flex items-center justify-center p-4 rounded-md border-2 ${
                        userType === 'User'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      <FaUser className="mr-2" />
                      <span>Citizen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prevData) => ({ ...prevData, userType: 'Doctor' }))}
                      className={`flex items-center justify-center p-4 rounded-md border-2 ${
                        userType === 'Doctor'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      <FaUserMd className="mr-2" />
                      <span>Healthcare Provider</span>
                    </button>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={firstName}
                      onChange={handleOnChange}
                      placeholder="Enter your first name"
                      className={`w-full pl-10 pr-3 py-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={lastName}
                      onChange={handleOnChange}
                      placeholder="Enter your last name"
                      className={`w-full pl-10 pr-3 py-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobile_no">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400" />
                    </div>
                    <input
                      id="mobile_no"
                      type="text"
                      name="mobile_no"
                      value={mobile_no}
                      onChange={handleOnChange}
                      placeholder="Enter your 10-digit mobile number"
                      className={`w-full pl-10 pr-3 py-3 border ${errors.mobile_no ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.mobile_no && (
                    <p className="text-red-500 text-xs mt-1">{errors.mobile_no}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleOnChange}
                      placeholder="Enter your email address"
                      className={`w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* OTP Method Selection */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Verification Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer ${
                        contactType === 'email'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-gray-300 text-gray-600'
                      }`}
                      onClick={() => setFormData((prevData) => ({ ...prevData, contactType: 'email' }))}
                    >
                      <FaEnvelope className="text-xl mb-1" />
                      <span className="text-xs">Email</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer ${
                        contactType === 'sms'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-gray-300 text-gray-600'
                      }`}
                      onClick={() => setFormData((prevData) => ({ ...prevData, contactType: 'sms' }))}
                    >
                      <FaPhone className="text-xl mb-1" />
                      <span className="text-xs">SMS</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer ${
                        contactType === 'whatsapp'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-gray-300 text-gray-600'
                      }`}
                      onClick={() => setFormData((prevData) => ({ ...prevData, contactType: 'whatsapp' }))}
                    >
                      <FaWhatsapp className="text-xl mb-1" />
                      <span className="text-xs">WhatsApp</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-3 bg-blue-50 rounded-md text-sm text-blue-800 flex items-start">
                  <FaInfoCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <p>
                    By proceeding, you agree to our <a href="#" className="text-blue-600 underline">Terms of Service</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a>. Your information will be securely stored in accordance with government regulations.
                  </p>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-blue-800 text-white py-3 rounded-md font-medium flex justify-center items-center"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    'Continue'
                  )}
                </motion.button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6 p-4 bg-green-50 rounded-md text-center">
                  <FaCheckCircle className="text-green-600 text-3xl mx-auto mb-2" />
                  <p className="text-green-800">
                    A verification code has been sent to your {contactType === 'email' ? 'email address' : 'mobile number'}.
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {contactType === 'email'
                      ? `${email.substring(0, 3)}...${email.substring(email.indexOf('@'))}`
                      : `+91 XXXXX ${mobile_no.substring(mobile_no.length - 4)}`}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaIdCard className="text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      name="otp"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        if (errors.otp) setErrors({ ...errors, otp: '' });
                      }}
                      placeholder="Enter 6-digit code"
                      className={`w-full pl-10 pr-3 py-3 border ${errors.otp ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      maxLength={6}
                    />
                  </div>
                  {errors.otp && (
                    <p className="text-red-500 text-xs mt-1">{errors.otp}</p>
                  )}
                </div>

                {otpTimer > 0 && (
                  <p className="text-center text-sm text-gray-600 mb-4">
                    Resend code in {formatTime(otpTimer)}
                  </p>
                )}

                <div className="flex gap-4 mb-6">
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-blue-800 text-blue-800 py-3 rounded-md font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleOtpVerify}
                    className="flex-1 bg-blue-800 text-white py-3 rounded-md font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Verify
                  </motion.button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={otpHandler}
                    disabled={otpTimer > 0 || loading}
                    className={`text-blue-600 text-sm ${otpTimer > 0 || loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-800'}`}
                  >
                    {loading ? 'Sending...' : 'Resend verification code'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="bg-gray-800 text-white py-4 text-center text-sm">
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

export default SignupUser;
