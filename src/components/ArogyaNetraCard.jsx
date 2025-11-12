import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FaIdCard, FaDownload, FaSpinner } from 'react-icons/fa';
import { getCardId } from '../services/operations/authAPI';

const ArogyaNetraCard = () => {
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const [cardId, setCardId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get or generate card ID from the server
  const fetchCardId = () => {
    dispatch(getCardId(
      (id) => {
        setCardId(id);
        generateCard(id, new Date());
      },
      setIssueDate,
      setIsLoading
    ));
  }; 

  // Generate the card on the canvas
  const generateCard = async (id, date) => {
    if (!canvasRef.current || !user) return;

    setIsGenerating(true);
    console.log("Generating card for user:", user.firstName, user.lastName);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 600);

    // Blue header
    ctx.fillStyle = '#0047AB';
    ctx.fillRect(0, 0, 1000, 100);

    // Card border
    ctx.strokeStyle = '#0047AB';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, 1000, 600);

    // Draw the static parts of the card immediately
    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('AROGYA MITR CARD', 120, 60);

    ctx.font = '16px Arial';
    ctx.fillText('Government of India | Ministry of Health and Family Welfare', 120, 85);

    // Card details
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Personal Details', 300, 150);

    ctx.font = '20px Arial';
    ctx.fillText(`Name: ${user.firstName} ${user.lastName}`, 300, 190);
    ctx.fillText(`Card ID: ${id}`, 300, 230);

    // Mask Aadhar number if available
    if (user.aadharNumber) {
      const aadharLastDigits = user.aadharNumber.replace(/\s/g, '').slice(-4);
      ctx.fillText(`Aadhar: XXXX XXXX ${aadharLastDigits}`, 300, 270);
    } else {
      ctx.fillText(`Aadhar: XXXX XXXX XXXX`, 300, 270);
    }

    ctx.fillText(`Mobile: ${user.mobile_no}`, 300, 310);
    ctx.fillText(`Email: ${user.email}`, 300, 350);

    // Issue date
    const formattedDate = new Date(date).toLocaleDateString();
    ctx.fillText(`Issue Date: ${formattedDate}`, 300, 390);

    // QR Code placeholder
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(750, 150, 200, 200);
    ctx.font = '16px Arial';
    ctx.fillText('Scan QR Code', 790, 370);
    ctx.fillText('for verification', 790, 390);

    // Footer
    ctx.fillStyle = '#0047AB';
    ctx.fillRect(0, 500, 1000, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('This card is issued by the Government of India and is valid throughout the country.', 50, 540);
    ctx.fillText('The cardholder is entitled to access healthcare services under the National Health Program.', 50, 570);

    // Draw placeholder for user image first
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(50, 150, 200, 200);
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(user.firstName.charAt(0), 130, 250);

    // Load images asynchronously
    const loadImages = async () => {
      try {
        // Try to load the emblem
        const emblemImage = new Image();
        emblemImage.crossOrigin = "Anonymous";

        const emblemPromise = new Promise((resolve, reject) => {
          emblemImage.onload = () => {
            ctx.drawImage(emblemImage, 30, 20, 60, 60);
            resolve();
          };
          emblemImage.onerror = () => {
            console.log("Failed to load emblem image");
            // Just resolve anyway, we already have a placeholder
            resolve();
          };
        });

        emblemImage.src = 'https://res.cloudinary.com/dyg2kv4z4/image/upload/v1760036497/Med1plus_nbuahc.png';

        // Try to load the user image
        const userImage = new Image();
        userImage.crossOrigin = "Anonymous";

        const userImagePromise = new Promise((resolve, reject) => {
          userImage.onload = () => {
            // Clear the placeholder
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(50, 150, 200, 200);
            // Draw the actual image
            ctx.drawImage(userImage, 50, 150, 200, 200);
            resolve();
          };
          userImage.onerror = () => {
            console.log("Failed to load user image");
            // Just resolve anyway, we already have a placeholder
            resolve();
          };
        });

        // Use a default avatar if no image is provided
        const imageUrl = user.image || `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`;
        console.log("Loading user image from:", imageUrl);
        userImage.src = imageUrl;

        // Wait for both images to load (or fail)
        await Promise.all([emblemPromise, userImagePromise]);

      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Start loading images
    loadImages();
  };

  // Download the card as an image
  const downloadCard = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `ArogyaNetraCard_${cardId}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initialize the card when the component mounts
  useEffect(() => {
    if (user && user.accountType === 'User') {
      console.log("User data available, fetching card ID:", user);
      fetchCardId();
    } else {
      console.log("User data not available or not a regular user");
    }
  }, [user]);

  // Debug user data
  useEffect(() => {
    console.log("Current user data:", user);
  }, []);

  if (!user || user.accountType !== 'User') {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-200">
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 flex items-center">
            <FaIdCard className="mr-2" /> Your Arogya Netra Card
          </h2>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
              <span className="ml-2 text-gray-600">Loading your card...</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-4 md:mb-0 md:pr-4 relative">
                <canvas 
                  ref={canvasRef} 
                  width={1000} 
                  height={600} 
                  className="w-full rounded-lg shadow-md border border-gray-200"
                />
                {isGenerating && (
                  <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 rounded-lg">
                    <FaSpinner className="animate-spin text-blue-600 text-3xl" />
                    <span className="ml-2 text-gray-800 font-medium">Generating card...</span>
                  </div>
                )}
              </div>
              
              <div className="md:w-1/3 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-blue-800 mb-3">Card Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Card ID:</span>
                    <span className="font-medium">{cardId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Issue Date:</span>
                    <span className="font-medium">{issueDate}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    This card can be used to access healthcare services across all hospitals and registered private facilities.
                  </p>
                </div>
                
                <div className="mt-4">
                  <button 
                    onClick={downloadCard}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400"
                  >
                    <FaDownload className="mr-2" /> Download Card
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

export default ArogyaNetraCard;