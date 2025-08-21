import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FaIdCard, FaDownload, FaSpinner, FaUser, FaQrcode, FaSync, FaShieldAlt, FaCalendarAlt, 
         FaInfoCircle, FaHospital, FaPhone, FaEnvelope, FaHeartbeat, FaAllergies } from 'react-icons/fa';
import axios from 'axios';
import QRCode from './QRCode';
import '../styles/CardFlip.css';
import { setUser } from '../slices/profileSlice';
import html2canvas from 'html2canvas';

const CompactArogyaNetraCard = () => {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [cardId, setCardId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrValue, setQrValue] = useState('');

  // Get or generate card ID from the server
  const fetchCardId = async () => {
    try {
      setIsLoading(true);
      const token = JSON.parse(localStorage.getItem("token"));
      
      const response = await axios.post(
        "http://localhost:5000/api/v1/auth/getArogyaNetraCardId",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log("Card ID response:", response.data);
      
      if (response.data.success) {
        setCardId(response.data.cardDetails.cardId);
        setIssueDate(new Date(response.data.cardDetails.issueDate).toLocaleDateString());
        toast.success("Card ID generated successfully");
      } else {
        toast.error("Failed to get card ID");
      }
    } catch (error) {
      console.error("Error getting card ID:", error);
      toast.error("Error getting card ID: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize the card when the component mounts
  useEffect(() => {
    const initializeCard = async () => {
      if (!user || !token) {
        console.log("No user or token available yet");
        setIsLoading(false);
        return;
      }

      if (user.accountType !== 'User') {
        console.log("Not a regular user");
        setIsLoading(false);
        return;
      }

      console.log("User data available, checking for card ID:", user);
      setIsLoading(true);

      try {
        // First, check if the user object already has card details
        if (user.arogyaNetraCard && user.arogyaNetraCard.cardId) {
          console.log("User already has a card ID in Redux store:", user.arogyaNetraCard.cardId);
          setCardId(user.arogyaNetraCard.cardId);
          setIssueDate(new Date(user.arogyaNetraCard.issueDate).toLocaleDateString());
          setIsLoading(false);
          return;
        }

        // If not in Redux, try to get the latest user data from the server
        const userResponse = await axios.get(
          'http://localhost:5000/api/v1/auth/getUserDetails',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (userResponse.data.success) {
          const userData = userResponse.data.data;
          console.log("Got fresh user data from server:", userData);

          // Update Redux store with latest user data
          dispatch(setUser(userData));
          localStorage.setItem("user", JSON.stringify(userData));

          // Check if the fresh data has card details
          if (userData.arogyaNetraCard && userData.arogyaNetraCard.cardId) {
            console.log("User has a card ID from server:", userData.arogyaNetraCard.cardId);
            setCardId(userData.arogyaNetraCard.cardId);
            setIssueDate(new Date(userData.arogyaNetraCard.issueDate).toLocaleDateString());
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error initializing card:", error);
        toast.error("Failed to load card data");
        setIsLoading(false);
      }
    };

    initializeCard();
  }, [user, token, dispatch]);

  // Generate QR code value when card ID is available
  useEffect(() => {
    if (cardId && user) {
      console.log("Generating QR code with user data:", user);

      // Create a data object to encode in the QR code
      const qrData = {
        cardId,
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        issueDate,
        timestamp: new Date().getTime()
      };

      // Convert to JSON string
      setQrValue(qrData);
    }
  }, [cardId, user, issueDate]);

  if (!user || user.accountType !== 'User') {
    return null;
  }

  // Format Aadhar number for display
  const formatAadhar = () => {
    if (!user.aadharNumber) return "XXXX XXXX XXXX";
    const aadhar = user.aadharNumber.replace(/\s/g, '');
    const lastFour = aadhar.slice(-4);
    return `XXXX XXXX ${lastFour}`;
  };

  // Function to handle card download
  const handleDownload = async () => {
    try {
      // First, render each side separately
      const renderSide = async (card, options = {}) => {
        const container = document.createElement('div');
        container.style.cssText = `
          width: 800px;
          height: 280px;
          position: fixed;
          left: -9999px;
          top: 0;
          background: white;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        `;
        
        // Clone the card
        const cardClone = card.cloneNode(true);
        cardClone.style.cssText = `
          position: static;
          transform: none;
          visibility: visible;
          opacity: 1;
          width: 100%;
          height: 100%;
        `;
  
        // Fix all gradient elements
        cardClone.querySelectorAll('[class*="bg-gradient"]').forEach(el => {
          el.style.background = 'linear-gradient(to right, #2563eb, #1e40af)';
        });
  
        // Fix absolute positioned elements
        cardClone.querySelectorAll('.absolute').forEach(el => {
          if (el.classList.contains('bottom-0')) {
            el.style.position = 'absolute';
            el.style.bottom = '0';
            el.style.left = '0';
            el.style.width = '100%';
          }
        });
  
        container.appendChild(cardClone);
        document.body.appendChild(container);
  
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          ...options
        });
  
        document.body.removeChild(container);
        return canvas;
      };
  
      // Render front and back sides
      const frontCanvas = await renderSide(document.querySelector('.card-front'));
      const backCanvas = await renderSide(document.querySelector('.card-back'));
  
      // Create a combined canvas
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      
      // Set dimensions for the combined canvas
      finalCanvas.width = 800;
      finalCanvas.height = 600; // Height for both cards plus spacing
  
      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  
      // Draw the cards
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + 40); // Add 40px spacing
  
      // Convert to image and download
      const link = document.createElement('a');
      link.download = `ArogyaNetraCard_${cardId}.png`;
      link.href = finalCanvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      toast.success("Card downloaded successfully");
  
    } catch (error) {
      console.error("Error downloading card:", error);
      toast.error("Failed to download card");
    }
  };

  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-200">
        <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-800 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white flex items-center">
              <FaIdCard className="mr-1" /> Arogya Netra Card
            </h2>
            {!isLoading && (
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="text-white bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded-full text-xs flex items-center transition-all duration-300"
              >
                <FaSync className="mr-1 text-xs" /> Flip
              </button>
            )}
          </div>
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <FaSpinner className="animate-spin text-blue-600 text-xl" />
              <span className="ml-2 text-gray-600 text-sm">Loading your card...</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start">
              {/* Card with flip effect */}
              <div className="w-full perspective-1000">
                <div className={`relative w-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ height: '280px' }}>

                  {/* Front of Card */}
                  <div className={`card-front absolute w-full h-full backface-hidden ${isFlipped ? 'invisible' : ''} bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md border border-blue-200 overflow-hidden transition-all duration-500`}>
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 shadow-sm">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                            alt="National Emblem"
                            className="w-6 h-6"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">AROGYA NETRA CARD</h3>
                          <p className="text-xs">Government of India | Ministry of Health</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-2 flex">
                      {/* Left Column - User Image */}
                      <div className="w-1/4 flex flex-col items-center">
                        <div className="mb-1">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-300 shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                              <FaUser className="text-blue-500 text-xl" />
                            </div>
                          )}
                        </div>
                        <div className="text-center mt-1">
                          <div className="inline-block bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                            <FaShieldAlt className="inline mr-0.5 text-xs" /> Verified
                          </div>
                        </div>
                      </div>

                      {/* Right Column - User Details */}
                      <div className="w-3/4 pl-2">
                        <h4 className="font-bold text-sm text-blue-800 mb-1 flex items-center">
                          <FaUser className="mr-1 text-xs text-blue-600" /> Personal Details
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="grid grid-cols-3 border-b border-gray-200 pb-1">
                            <span className="font-medium text-gray-600 col-span-1">Name:</span>
                            <span className="font-semibold text-gray-900 col-span-2">{user.firstName} {user.lastName}</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-gray-200 pb-1">
                            <span className="font-medium text-gray-600 col-span-1">Arogya ID:</span>
                            <span className="font-semibold text-blue-700 col-span-2">{cardId}</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-gray-200 pb-1">
                            <span className="font-medium text-gray-600 col-span-1">Aadhar:</span>
                            <span className="font-semibold text-gray-900 col-span-2">{formatAadhar()}</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-gray-200 pb-1">
                            <span className="font-medium text-gray-600 col-span-1">Mobile:</span>
                            <span className="font-semibold text-gray-900 col-span-2">{user.mobile_no}</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-gray-200 pb-1">
                            <span className="font-medium text-gray-600 col-span-1">Email:</span>
                            <span className="font-semibold text-gray-900 col-span-2 truncate">{user.email}</span>
                          </div>
                          <div className="grid grid-cols-3 border-b border-gray-200 pb-1">
                            <span className="font-medium text-gray-600 col-span-1">DOB:</span>
                            <span className="font-semibold text-gray-900 col-span-2">
                              {user.additionalDetails?.dateOfBirth 
                                ? new Date(user.additionalDetails.dateOfBirth).toLocaleDateString() 
                                : 'Not specified'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3">
                            <span className="font-medium text-gray-600 col-span-1">Issue Date:</span>
                            <span className="font-semibold text-gray-900 col-span-2 flex items-center">
                              <FaCalendarAlt className="mr-1 text-xs text-blue-600" /> {issueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="absolute bottom-0 w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white p-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <p>Valid throughout India for healthcare services</p>
                        <div className="flex items-center">
                          <FaInfoCircle className="mr-1 text-xs" /> Flip for more
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div className={`card-back absolute w-full h-full backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''} bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md border border-blue-200 overflow-hidden transition-all duration-500`}>
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold">HEALTHCARE INFORMATION</h3>
                        <div className="text-xs bg-blue-600 px-1.5 py-0.5 rounded-full">
                          <FaShieldAlt className="inline mr-0.5 text-xs" /> Secure
                        </div>
                      </div>
                    </div>

                    {/* Card Body - Two Column Layout */}
                    <div className="p-2 grid grid-cols-2 gap-2">
                      {/* Medical Information */}
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-1 text-xs flex items-center">
                          <FaUser className="mr-1 text-xs" /> Medical Information
                        </h4>
                        <div className="space-y-1 text-xs">
                          {user?.additionalDetails && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Blood Group:</span>
                                <span className="font-medium">{user.additionalDetails.bloodGroup || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Gender:</span>
                                <span className="font-medium">{user.additionalDetails.gender || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Height:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.height 
                                    ? `${user.additionalDetails.height} cm` 
                                    : 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Weight:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.weight 
                                    ? `${user.additionalDetails.weight} kg` 
                                    : 'Not specified'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Emergency Contact Info */}
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-1 text-xs flex items-center">
                          <FaHospital className="mr-1 text-xs" /> Emergency Contact
                        </h4>
                        <div className="space-y-1 text-xs">
                          {user?.additionalDetails?.emergencyContact ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium truncate max-w-[120px]">
                                  {user.additionalDetails.emergencyContact.name || 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Relation:</span>
                                <span className="font-medium truncate max-w-[120px]">
                                  {user.additionalDetails.emergencyContact.relationship || 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.emergencyContact.phone || 'Not specified'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500 text-xs">No emergency contact available</p>
                          )}
                        </div>
                      </div>

                      {/* Medical Conditions */}
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-1 text-xs flex items-center">
                          <FaHeartbeat className="mr-1 text-xs" /> Medical Conditions
                        </h4>
                        <div className="text-xs">
                          {user?.additionalDetails?.medicalConditions && 
                           user.additionalDetails.medicalConditions.length > 0 ? (
                            <div className="max-h-[60px] overflow-y-auto">
                              <ul className="list-disc list-inside">
                                {user.additionalDetails.medicalConditions.map((condition, index) => (
                                  <li key={index} className="text-gray-700 truncate">{condition}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-gray-500">No medical conditions recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Allergies & Medications */}
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-1 text-xs flex items-center">
                          <FaAllergies className="mr-1 text-xs" /> Allergies & Medications
                        </h4>
                        <div className="text-xs">
                          <div className="mb-1">
                            <span className="font-medium text-gray-600">Allergies:</span>
                            {user?.additionalDetails?.allergies && 
                             user.additionalDetails.allergies.length > 0 ? (
                              <span className="text-gray-700 ml-1 truncate block">
                                {user.additionalDetails.allergies.join(', ')}
                              </span>
                            ) : (
                              <span className="text-gray-500 ml-1">None recorded</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Medications:</span>
                            {user?.additionalDetails?.medications && 
                             user.additionalDetails.medications.length > 0 ? (
                              <span className="text-gray-700 ml-1 truncate block">
                                {user.additionalDetails.medications.join(', ')}
                              </span>
                            ) : (
                              <span className="text-gray-500 ml-1">None recorded</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="absolute bottom-0 w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white p-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FaPhone className="mr-1 text-xs" /> Emergency: 108
                        </div>
                        <div className="flex items-center">
                          <FaInfoCircle className="mr-1 text-xs" /> Flip for personal details
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Card Actions */}
        {!isLoading && (
          <div className="p-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="text-xs">
                <span className="text-gray-500">ID: </span>
                <span className="font-medium text-blue-700">{cardId}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">Issued: </span>
                <span className="font-medium">{issueDate}</span>
              </div>
              <div className="text-xs">
                <span className="font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Active</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center hover:bg-blue-700 transition-colors"
              >
                <FaDownload className="mr-1 text-xs" /> Download
              </button>
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-gray-100 text-blue-700 px-2 py-1 rounded text-xs flex items-center hover:bg-gray-200 transition-colors border border-gray-300"
              >
                <FaSync className="mr-1 text-xs" /> Flip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactArogyaNetraCard;