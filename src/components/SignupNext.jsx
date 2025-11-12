import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../services/operations/authAPI';
import { useDispatch, useSelector } from 'react-redux';
import { Document, Page } from 'react-pdf';
import Webcam from 'react-webcam';
import {
  FaIdCard,
  FaCamera,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaArrowLeft,
  FaExclamationTriangle,
  FaSpinner,
  FaFilePdf,
  FaFileImage
} from 'react-icons/fa';
import GridPattern from './GridPattern';

// PDF.js worker is configured in pdfWorker.js and imported in main.jsx

const SignupNext = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signupData } = useSelector((state) => state.auth);
  const [filePreview, setFilePreview] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [file, setFile] = useState(null);
  const [imageCaptured, setImageCaptured] = useState(null);
  const [face, setFace] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    // Check if user data exists, if not redirect to signup
    if (!signupData || !signupData.firstName) {
      navigate('/signup');
    }

    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setCameraPermission('granted');
      })
      .catch(() => {
        setCameraPermission('denied');
      });
  }, [signupData, navigate]);

  // Clean up file preview URLs when component unmounts or when file changes
  useEffect(() => {
    return () => {
      // Revoke the object URL to avoid memory leaks
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordCriteria({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      });
      return;
    }

    // Check criteria
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    setPasswordCriteria(criteria);

    // Calculate strength
    const metCriteria = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength(metCriteria * 20); // 20% for each criteria
  }, [password]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(selectedFile.type)) {
        setErrors({
          ...errors,
          file: 'Please upload a valid PDF or image file (JPG, JPEG, PNG)'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          file: 'File size should not exceed 5MB'
        });
        return;
      }

      setFile(selectedFile);
      setErrors({ ...errors, file: '' });

      // Generate preview - always create a preview URL regardless of file type
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);

      // Log for debugging
      console.log('File preview URL created:', previewUrl);
      console.log('File type:', selectedFile.type);
    }
  };

  const handleFileReset = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate Aadhaar file
    if (!file) {
      newErrors.file = 'Please upload your Aadhaar card';
    }

    // Validate face image
    if (!face) {
      newErrors.face = 'Please capture your image for verification';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (passwordStrength < 60) {
      newErrors.password = 'Password is too weak. Please meet at least 3 criteria.';
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { firstName, lastName, email, mobile_no, userType } = signupData;

      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('mobile_no', mobile_no);
      formData.append('userType', userType);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('aadharFile', file);

      if (face) {
        formData.append('webcamImage', face);
      }

      await dispatch(signUp(formData, navigate));
    } catch (error) {
      console.error('Error during signup:', error);
      setErrors({
        ...errors,
        general: 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureClick = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImageCaptured(imageSrc);

      // Convert data URL to File object
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          setFace(new File([blob], 'captured.png', { type: 'image/png' }));
          setErrors({ ...errors, face: '' });
        })
        .catch((error) => {
          console.error('Error capturing image:', error);
          setErrors({
            ...errors,
            face: 'Failed to capture image. Please try again.'
          });
        });
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 20) return 'Very Weak';
    if (passwordStrength <= 40) return 'Weak';
    if (passwordStrength <= 60) return 'Medium';
    if (passwordStrength <= 80) return 'Strong';
    return 'Very Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 20) return 'bg-red-500';
    if (passwordStrength <= 40) return 'bg-orange-500';
    if (passwordStrength <= 60) return 'bg-yellow-500';
    if (passwordStrength <= 80) return 'bg-green-500';
    return 'bg-green-600';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
        Smart Health Records System
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
            onClick={() => navigate('/signup')}
            className="ml-auto flex items-center text-blue-800 hover:text-blue-600"
          >
            <FaArrowLeft className="mr-1" /> Back to Previous Step
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
          className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl z-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Registration Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
                  1
                </div>
                <span className="text-xs mt-1">Account</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-blue-600"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
                  2
                </div>
                <span className="text-xs mt-1">Verify</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-blue-600"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
                  3
                </div>
                <span className="text-xs mt-1">Complete</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl mb-6 text-center text-blue-900 font-bold">
            Complete Your Registration
          </h2>

          {errors.general && (
            <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-md flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <p>{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleOnSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 p-4 bg-blue-50 rounded-md text-sm text-blue-800 flex items-start mb-2">
              <FaInfoCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
              <p>
                Please complete your registration by uploading your Aadhaar card, capturing your photo for facial recognition, and setting a secure password.
              </p>
            </div>

            {/* Left Column - Document Upload */}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                  <FaIdCard className="mr-2 text-blue-600" /> Upload Aadhaar Card
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf, .jpg, .jpeg, .png"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                    id="aadhaar-upload"
                  />
                  {!file ? (
                    <label htmlFor="aadhaar-upload" className="cursor-pointer">
                      <div className="text-gray-500 flex flex-col items-center">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="text-sm">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, JPEG, or PNG (Max 5MB)</p>
                      </div>
                    </label>
                  ) : (
                    <div className="relative">
                      {filePreview && (
                        <div className="mb-2">
                          {file.type === 'application/pdf' ? (
                            <div className="pdf-preview h-40 overflow-hidden border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center">
                              <Document
                                file={file}
                                onLoadSuccess={() => console.log('PDF loaded successfully')}
                                onLoadError={(error) => console.error('PDF load error:', error)}
                                loading={
                                  <div className="flex flex-col items-center justify-center text-blue-600">
                                    <FaSpinner className="animate-spin text-xl mb-2" />
                                    <span className="text-xs">Loading PDF...</span>
                                  </div>
                                }
                                error={
                                  <div className="flex flex-col items-center justify-center text-red-600">
                                    <FaExclamationTriangle className="text-xl mb-2" />
                                    <span className="text-xs">Failed to load PDF</span>
                                  </div>
                                }
                              >
                                <Page
                                  pageNumber={1}
                                  width={150}
                                  renderAnnotationLayer={false}
                                  renderTextLayer={false}
                                />
                              </Document>
                              <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-br">
                                <FaFilePdf className="inline mr-1" /> PDF
                              </div>
                            </div>
                          ) : (
                            <div className="image-preview border border-gray-200 rounded-md p-2 bg-white relative">
                              <img
                                src={filePreview}
                                alt="Aadhaar Preview"
                                className="max-h-40 mx-auto object-contain"
                                onLoad={() => console.log('Image loaded successfully')}
                                onError={(e) => console.error('Image load error:', e)}
                              />
                              <div className="absolute top-0 left-0 bg-green-600 text-white text-xs px-2 py-1 rounded-br">
                                <FaFileImage className="inline mr-1" /> Image
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 truncate">{file.name}</p>
                      <div className="flex justify-center mt-2">
                        <button
                          type="button"
                          onClick={handleFileReset}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center px-3 py-1 border border-red-200 rounded-md hover:bg-red-50"
                        >
                          <FaTimes className="mr-1" /> Remove File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="text-red-500 text-xs mt-1">{errors.file}</p>
                )}
              </div>

              {/* Password Fields */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className={`w-full pl-3 pr-10 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </div>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}

                {/* Password strength meter */}
                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs ${
                        passwordStrength <= 40 ? 'text-red-500' :
                        passwordStrength <= 60 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>

                    {/* Password criteria */}
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <div className={`text-xs flex items-center ${passwordCriteria.length ? 'text-green-500' : 'text-gray-500'}`}>
                        {passwordCriteria.length ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        At least 8 characters
                      </div>
                      <div className={`text-xs flex items-center ${passwordCriteria.uppercase ? 'text-green-500' : 'text-gray-500'}`}>
                        {passwordCriteria.uppercase ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        Uppercase letter
                      </div>
                      <div className={`text-xs flex items-center ${passwordCriteria.lowercase ? 'text-green-500' : 'text-gray-500'}`}>
                        {passwordCriteria.lowercase ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        Lowercase letter
                      </div>
                      <div className={`text-xs flex items-center ${passwordCriteria.number ? 'text-green-500' : 'text-gray-500'}`}>
                        {passwordCriteria.number ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        Number
                      </div>
                      <div className={`text-xs flex items-center ${passwordCriteria.special ? 'text-green-500' : 'text-gray-500'}`}>
                        {passwordCriteria.special ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                        Special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full pl-3 pr-10 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
                {password && confirmPassword && password === confirmPassword && (
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <FaCheck className="mr-1" /> Passwords match
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Webcam Capture */}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                  <FaCamera className="mr-2 text-blue-600" /> Capture Your Photo
                </label>

                {cameraPermission === 'pending' && (
                  <div className="border rounded-lg p-4 text-center bg-gray-50 flex flex-col items-center justify-center h-48">
                    <FaSpinner className="animate-spin text-blue-500 text-2xl mb-2" />
                    <p className="text-gray-600 text-sm">Requesting camera access...</p>
                  </div>
                )}

                {cameraPermission === 'denied' && (
                  <div className="border rounded-lg p-4 text-center bg-red-50 flex flex-col items-center justify-center h-48">
                    <FaExclamationTriangle className="text-red-500 text-2xl mb-2" />
                    <p className="text-red-700 text-sm">Camera access denied</p>
                    <p className="text-red-600 text-xs mt-1">Please allow camera access in your browser settings to continue.</p>
                  </div>
                )}

                {cameraPermission === 'granted' && (
                  <div className="border rounded-lg overflow-hidden">
                    {!imageCaptured ? (
                      <>
                        <Webcam
                          audio={false}
                          screenshotFormat="image/jpeg"
                          width="100%"
                          height="auto"
                          videoConstraints={{
                            facingMode: "user"
                          }}
                          ref={webcamRef}
                          onUserMedia={() => setIsCameraReady(true)}
                          onUserMediaError={() => {
                            setCameraPermission('denied');
                            setIsCameraReady(false);
                          }}
                          className="rounded-t-lg"
                        />
                        <div className="p-3 bg-gray-50 flex justify-center">
                          <button
                            type="button"
                            onClick={handleCaptureClick}
                            disabled={!isCameraReady}
                            className={`flex items-center px-4 py-2 rounded-md ${
                              isCameraReady
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <FaCamera className="mr-2" /> Capture Photo
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="relative">
                        <img
                          src={imageCaptured}
                          alt="Captured"
                          className="w-full rounded-t-lg"
                        />
                        <div className="p-3 bg-gray-50 flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setImageCaptured(null);
                              setFace(null);
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FaCamera className="mr-1" /> Retake
                          </button>
                          <div className="flex items-center text-green-600">
                            <FaCheck className="mr-1" /> Photo captured
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {errors.face && (
                  <p className="text-red-500 text-xs mt-1">{errors.face}</p>
                )}

                <div className="mt-2 p-3 bg-yellow-50 rounded-md text-xs text-yellow-800 flex items-start">
                  <FaInfoCircle className="text-yellow-600 mt-1 mr-2 flex-shrink-0" />
                  <p>
                    Your photo will be used for facial recognition to securely access your medical records. Please ensure your face is clearly visible and well-lit.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button - Full Width */}
            <div className="md:col-span-2 mt-4">
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
                    Processing...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </motion.button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By completing registration, you agree to our <a href="#" className="text-blue-600">Terms of Service</a> and <a href="#" className="text-blue-600">Privacy Policy</a>.
              </p>
            </div>
          </form>
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

export default SignupNext;
