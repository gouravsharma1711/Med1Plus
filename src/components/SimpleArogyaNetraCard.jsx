import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FaIdCard, FaDownload, FaSpinner, FaUser, FaQrcode, FaSync, FaShieldAlt, FaCalendarAlt, FaInfoCircle, FaHospital, FaPhone, FaEnvelope, FaInfo, FaTint, FaMapMarkedAlt, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import QRCode from './QRCode';
import '../styles/CardFlip.css';
import { setUser } from '../slices/profileSlice';
import html2canvas from 'html2canvas';

const SimpleArogyaNetraCard = () => {
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

        // If still no card, check if profile is complete before trying to generate a card
        // const profileResponse = await axios.get(
        //   'http://localhost:5000/api/v1/auth/checkProfileCompletion',
        //   {
        //     headers: {
        //       Authorization: `Bearer ${token}`,
        //     },
        //   }
        // );

        // if (profileResponse.data.success && profileResponse.data.isComplete) {
        //   console.log("Profile is complete, generating card...");
        //   await fetchCardId();

        //   // After generating card, get updated user data
        //   const updatedUserResponse = await axios.get(
        //     'http://localhost:5000/api/v1/auth/getUserDetails',
        //     {
        //       headers: {
        //         Authorization: `Bearer ${token}`,
        //       },
        //     }
        //   );

        //   if (updatedUserResponse.data.success) {
        //     // Update Redux store with latest user data including card
        //     dispatch(setUser(updatedUserResponse.data.data));
        //     localStorage.setItem("user", JSON.stringify(updatedUserResponse.data.data));
        //   }
        // } else {
        //   console.log("Profile is not complete, cannot generate card yet");
        //   setIsLoading(false);
        //   toast.error("Please complete your profile to generate your Arogya Netra Card");
        // }
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

  // Debug user data
  useEffect(() => {
    if (user) {
      console.log("User data in SimpleArogyaNetraCard:", user);
      console.log("User additionalDetails:", user.additionalDetails);
    }
  }, [user]);

  // Debug user data
  useEffect(() => {
    console.log("Current user data:", user);
  }, []);

  // Add this debug log to check the data structure
  useEffect(() => {
    if (user?.additionalDetails) {
      console.log("Additional Details:", user.additionalDetails);
    }
  }, [user]);

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
          height: 400px;
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
      finalCanvas.height = 840; // Height for both cards plus spacing
  
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
    <div className="mb-8 ">
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-200">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <FaIdCard className="mr-2" /> Your Arogya Netra Card
            </h2>
            {!isLoading && (
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-full text-sm flex items-center transition-all duration-300"
              >
                <FaSync className="mr-1" /> Flip Card
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
              <span className="ml-2 text-gray-600">Loading your card...</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start">
              {/* Card with flip effect */}
              <div className="md:w-2/3 mb-4 md:mb-0 md:pr-4 perspective-1000">
                <div className={`relative w-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ height: '400px' }}>

                  {/* Front of Card */}
                  <div className={`card-front absolute w-full h-full backface-hidden ${isFlipped ? 'invisible' : ''} bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border border-blue-200 overflow-hidden transition-all duration-500`}>
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 shadow-md">
                          <img
                            src="https://res.cloudinary.com/dyg2kv4z4/image/upload/v1760036497/Med1plus_nbuahc.png"
                            alt="National Emblem"
                            className=""
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">AROGYA NETRA CARD</h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex flex-row gap-4 items-center justify-center">
                      <div className="bg-white rounded-lg shadow-md mb-4">
                      {user.image ? (
                            <img
                              src={user.image}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-60 h-40 object-cover rounded-lg border border-gray-300 shadow-md"
                            />
                          ) : (
                            <div className="w-52 h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-md">
                              <FaUser className="text-blue-500 text-4xl" />
                            </div>
                          )}
                      </div>

                      {/* Emergency Contact Info */}
                      <div className="w-full bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <FaUser className="mr-2" /> Personal Information
                        </h4>
                        <div className="space-y-2 text-sm">
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Arogya ID:</span>
                                <span className="font-medium">
                                  {cardId}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">
                                {user.firstName} {user.lastName}
                                </span>
                              </div>
                              {/* <div className="flex justify-between">
                                <span className="text-gray-600">Aadhar Number:</span>
                                <span className="font-medium">
                                  {formatAadhar()}
                                </span>
                              </div> */}
                              {/* <div className="flex justify-between">
                                <span className="text-gray-600">Mobile Number:</span>
                                <span className="font-medium">
                                  {user.mobile_no}
                                </span>
                              </div> */}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Age:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.dateOfBirth ? `
                                    ${Math.floor((new Date() - new Date(user.additionalDetails.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} yrs`
                                    : 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Gender:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.gender}
                                </span>
                              </div>
                              {/* <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">
                                  {user.email}
                                </span>
                              </div> */}
                              {/* <div className="flex justify-between">
                                <span className="text-gray-600">Issue Date:</span>
                                <span className="font-medium">
                                  {issueDate}
                                </span>
                              </div> */}
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <div className="flex items-center">
                                  <FaTint className="text-blue-600 mr-2" />
                                  <span>Blood Group: {user.additionalDetails.bloodGroup}</span>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <div className="flex items-center">
                                  <FaMapMarkerAlt className="text-blue-600 mr-2" />
                                  <span>Address: {user.additionalDetails.address.street} {", "}
                                  {user.additionalDetails.address.city} {", "}
                                  {user.additionalDetails.address.state} {" - "}
                                  {user.additionalDetails.address.pincode} {", "}
                                    {user.additionalDetails.address.country}</span>
                                </div>
                              </div>
                            </>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="absolute bottom-0 w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <p>Valid throughout India for healthcare services</p>
                        <div className="flex items-center">
                          <FaInfoCircle className="mr-1" /> Flip card for more info
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div className={`card-back absolute w-full h-full backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''} bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border border-blue-200 overflow-hidden transition-all duration-500`}>
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">HEALTHCARE INFORMATION</h3>
                        <div className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                          <FaShieldAlt className="inline mr-1" /> Secure
                        </div>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="p-4 flex flex-row gap-4 items-center justify-center">
                      <div className="bg-white p-3 rounded-lg shadow-md mb-4">
                        {qrValue ? (
                          <div className="relative">
                            <div className="qr-code-container p-2 border-2 border-blue-200 rounded-lg">
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 rounded-full"></div>
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full"></div>
                              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-600 rounded-full"></div>
                              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-600 rounded-full"></div>

                              <div className="p-2 bg-white">
                                <QRCode
                                  value={qrValue}
                                  size={150}
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                                alt="Watermark"
                                className="w-16 h-16"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-150 h-150 bg-gray-100 rounded flex items-center justify-center">
                            <FaQrcode className="text-gray-400 text-5xl" />
                          </div>
                        )}
                      </div>

                      {/* Medical Information */}
                      {/* <div className="w-full bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <FaUser className="mr-2" /> Medical Information
                        </h4>
                        <div className="space-y-2 text-sm">
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
                                <span className="text-gray-600">Date of Birth:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.dateOfBirth 
                                    ? new Date(user.additionalDetails.dateOfBirth).toLocaleDateString() 
                                    : 'Not specified'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div> */}

                      {/* Emergency Contact Info */}
                      <div className="w-full bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <FaHospital className="mr-2" /> Emergency Contact
                        </h4>
                        <div className="space-y-2 text-sm">
                          {user?.additionalDetails?.emergencyContact ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">
                                  {user.additionalDetails.emergencyContact.name || 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Relationship:</span>
                                <span className="font-medium">
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
                            <p className="text-gray-500 text-sm">No emergency contact information available</p>
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="flex items-center">
                              <FaPhone className="text-blue-600 mr-2" />
                              <span>Emergency : 108</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <FaEnvelope className="text-blue-600 mr-2" />
                              <span>Health Helpline : 1800-180-1104</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="absolute bottom-0 w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <p>National Health Authority</p>
                        <div className="flex items-center">
                          <FaInfoCircle className="mr-1" /> Flip card for personal details
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Information Panel */}
              <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-md">
                <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                  <FaIdCard className="mr-2" /> Card Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                    <span className="text-gray-600 text-sm">Arogya ID:</span>
                    <span className="font-medium text-blue-700">{cardId}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                    <span className="text-gray-600 text-sm">Issue Date:</span>
                    <span className="font-medium">{issueDate}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                    <span className="text-gray-600 text-sm">Status:</span>
                    <span className="font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs">Active</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
                    <h4 className="font-semibold text-blue-800 mb-2 text-sm flex items-center">
                      <FaInfoCircle className="mr-2 text-blue-600" /> About Your Card
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Your Arogya Netra Card provides access to healthcare services across all government hospitals and registered private facilities. Present this card when seeking medical attention to access your digital health records.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleDownload}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors duration-300 shadow-md"
                  >
                    <FaDownload className="mr-2" /> Download Card
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full bg-gray-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors duration-300 border border-blue-200"
                  >
                    <FaSync className="mr-2" /> Flip Card
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleArogyaNetraCard;