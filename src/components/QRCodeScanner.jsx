import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  FaQrcode,
  FaUser,
  FaSpinner,
  FaArrowLeft,
  FaIdCard,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaUserMd,
  FaHospital,
  FaFileMedical,
  FaCalendarAlt,
  FaTint,
  FaWeight,
  FaRulerVertical
} from 'react-icons/fa';

const QRCodeScanner = () => {
  const [scanning, setScanning] = useState(true);
  const [scannedData, setScannedData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const navigate = useNavigate();

  // Check if user is a healthcare professional
  useEffect(() => {
    if (user && user.accountType !== 'Doctor' && user.accountType !== 'Admin') {
      toast.error('Only healthcare professionals can access this feature');
      navigate('/');
    }
  }, [user, navigate]);

  const handleScan = async (data) => {
    if (data && scanning) {
      console.log("QR code scanned:", data);
      setScanning(false);
  
      try {
        // Handle different QR reader library formats
        const qrText = data.text || data;
        setScannedData(qrText);
  
        let parsedData;
        // First try to parse as JSON
        try {
          parsedData = JSON.parse(qrText);
        } catch {
          // If not JSON, check if it's a valid Arogya Netra Card ID format
          if (qrText.startsWith('AN-') && qrText.split('-').length === 3) {
            parsedData = {
              cardId: qrText,
              timestamp: new Date().getTime()
            };
          } else {
            throw new Error('Invalid QR code format');
          }
        }
  
        // Verify the QR code data
        if (parsedData.cardId) {
          verifyQrCode(JSON.stringify(parsedData));
        } else {
          setError('Invalid QR code format');
          setTimeout(resetScanner, 3000);
        }
      } catch (error) {
        console.error('Error parsing QR data:', error);
        setError('Invalid QR code format. Please scan a valid Arogya Netra Card QR code.');
        setTimeout(resetScanner, 3000);
      }
    }
  };

  const handleScanError = (error) => {
    console.error('QR scan error:', error);
    toast.error('Error scanning QR code: ' + error.message);
  };

  const verifyQrCode = async (qrData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/v1/auth/verifyCardAndGetUserData',
        { qrData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setUserData(response.data.data);
        toast.success('Patient data retrieved successfully');
      } else {
        setError(response.data.message || 'Failed to verify QR code');
      }
    } catch (error) {
      console.error('Error verifying QR code:', error);
      setError(error.response?.data?.message || 'Failed to verify QR code');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setScannedData(null);
    setUserData(null);
    setError(null);
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
            <h1 className="text-2xl font-bold flex items-center">
              <FaQrcode className="mr-2" /> QR Code Scanner
            </h1>
            <p className="mt-2 text-purple-100">
              Scan a patient's Arogya Netra Card QR code to access their medical information
            </p>
          </div>
          
          <div className="p-6">
            {scanning ? (
              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-purple-800 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    Position the QR code within the scanner frame
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="relative rounded-lg overflow-hidden border-4 border-purple-500">
                    <Scanner
                      onScan={(detected) => {
                        // detected: IDetectedBarcode[]
                        if (!detected || !detected.length || !scanning) return;
                        const first = detected[0];
                        handleScan({ text: first.rawValue });
                      }}
                      components={{
                        finder: () => (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-white border-dashed"></div>
                          </div>
                        )
                      }}
                      styles={{
                        container: { width: '100%' },
                        video: { objectFit: 'cover' }
                      }}
                      constraints={{
                        facingMode: 'environment'
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-white border-dashed pointer-events-none"></div>
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-600">
                    If scanning doesn't work, try adjusting lighting or distance
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-purple-600 text-4xl mb-4" />
                    <p className="text-gray-600">Verifying QR code and retrieving patient data...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <FaExclamationTriangle className="text-red-500 text-4xl mb-4 mx-auto" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">QR Code Verification Failed</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={resetScanner}
                      className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : userData ? (
                  <div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
                      <FaCheck className="text-green-500 mr-2" />
                      <p className="text-green-800">QR code verified successfully</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Patient Header */}
                      <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {userData.user.image ? (
                              <img
                                src={userData.user.image}
                                alt={`${userData.user.firstName} ${userData.user.lastName}`}
                                className="w-16 h-16 rounded-full object-cover border border-gray-300"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                <FaUser className="text-purple-500 text-2xl" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                              {userData.user.firstName} {userData.user.lastName}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center">
                                <FaIdCard className="mr-1" /> {userData.user.arogyaNetraCard?.cardId || 'No Card ID'}
                              </span>
                              {userData.profile.gender && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {userData.profile.gender}
                                </span>
                              )}
                              {userData.profile.age && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  {userData.profile.age} years
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Patient Details */}
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Contact Information */}
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                              <FaUser className="mr-2 text-purple-500" /> Contact Information
                            </h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{userData.user.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mobile:</span>
                                <span className="font-medium">{userData.user.mobile_no}</span>
                              </div>
                              {userData.profile.address && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Location:</span>
                                  <span className="font-medium">
                                    {userData.profile.address.city}, {userData.profile.address.state}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Medical Information */}
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                              <FaFileMedical className="mr-2 text-purple-500" /> Medical Information
                            </h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Blood Group:</span>
                                <span className="font-medium">{userData.additionalDetails?.bloodGroup || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Height:</span>
                                <span className="font-medium">{userData.additionalDetails?.height ? `${userData.additionalDetails?.height} cm` : 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Weight:</span>
                                <span className="font-medium">{userData.additionalDetails?.weight ? `${userData.additionalDetails?.weight} kg` : 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Emergency Contact */}
                          {userData.profile.emergencyContact && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                <FaUserMd className="mr-2 text-purple-500" /> Emergency Contact
                              </h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Name:</span>
                                  <span className="font-medium">{userData.additionalDetails?.emergencyContact.name}</span>
                                </div>
                                {userData.profile.emergencyContact.relationship && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Relationship:</span>
                                    <span className="font-medium">{userData.additionalDetails?.emergencyContact.relationship}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="font-medium">{userData.additionalDetails?.emergencyContact.phone}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Allergies */}
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                              <FaExclamationTriangle className="mr-2 text-purple-500" /> Allergies
                            </h3>
                            {userData.additionalDetails?.allergies && userData.additionalDetails?.allergies.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {userData.additionalDetails?.allergies.map((allergy, index) => (
                                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No known allergies</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Additional Information */}
                        {userData.additionalDetails?.about && (
                          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                              <FaInfoCircle className="mr-2 text-purple-500" /> Additional Information
                            </h3>
                            <p className="text-gray-700">{userData.profile.about}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={resetScanner}
                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 flex items-center"
                      >
                        <FaQrcode className="mr-2" /> Scan Another
                      </button>
                      
                      <button
                        onClick={() => navigate('/professional-dashboard')}
                        className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 flex items-center"
                      >
                        View Dashboard
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => navigate('/professional-dashboard')}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="flex items-center">
            <FaInfoCircle className="mr-2" />
            <strong>Note:</strong> Patient data access is logged and monitored for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;