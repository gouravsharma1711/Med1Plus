import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../services/operations/authAPI';
import { useDispatch } from 'react-redux';
import { FaUserAlt, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle, FaArrowLeft, FaQuestionCircle } from 'react-icons/fa';
import GridPattern from './GridPattern';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Handle account lockout timer
  useEffect(() => {
    let interval;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLocked) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await dispatch(login(email, password, navigate));
      // Reset attempts on successful login
      setLoginAttempts(0);
    } catch (error) {
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock account after 3 failed attempts
      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockTimer(30); // Lock for 30 seconds
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formatLockTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
        Smart Healthcare System
      </div>

      <header className="bg-white shadow-md py-3">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dyg2kv4z4/image/upload/v1760036497/Med1plus_nbuahc.png"
              alt="National Emblem"
              className="h-12 mr-3"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-900">Med1Plus</h1>
              <p className="text-xs text-gray-600">Smart Health Records System</p>
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
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUserAlt className="text-blue-800 text-2xl" />
            </div>
          </div>

          <h2 className="text-2xl mb-6 text-center text-blue-900 font-bold">Citizen Login</h2>

          {isLocked && (
            <motion.div
              className="mb-6 p-3 bg-red-100 text-red-800 rounded-md flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FaExclamationTriangle className="mr-2" />
              <div>
                <p className="font-semibold">Account temporarily locked</p>
                <p className="text-sm">Too many failed attempts. Please try again in {formatLockTime(lockTimer)}.</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserAlt className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-3 py-3 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  disabled={isLocked || loading}
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-3 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  disabled={isLocked || loading}
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </div>
              </div>
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Forgot password?
                </a>
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full bg-blue-800 text-white py-3 rounded-md font-medium flex justify-center items-center"
              disabled={isLocked || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging In...
                </>
              ) : (
                'Login'
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Register Now
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center text-gray-500 text-sm">
              <FaQuestionCircle className="mr-2" />
              <span>Need help? Contact our support at <a href="mailto:support@medisecure.gov.in" className="text-blue-600">support@medisecure.gov.in</a></span>
            </div>
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

export default LoginPage;
