import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { FaCamera, FaSearch, FaSpinner, FaRedo, FaDatabase } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const FaceScan = ({ setUserDetails, calculateAge }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRetake, setIsRetake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [webcamReady, setWebcamReady] = useState(false);
  const [preloading, setPreloading] = useState(false);

  // Preload user images when component mounts to improve performance
  useEffect(() => {
    const preloadUserImages = async () => {
      try {
        setPreloading(true);
        const response = await axios.get('http://localhost:5000/api/v1/preload-user-images');
        console.log('Preloaded user images:', response.data);
        if (response.data.success) {
          toast.success(`Preloaded ${response.data.loadedCount} user images for faster recognition`);
        }
      } catch (error) {
        console.error('Error preloading user images:', error);
        // Don't show error to user as this is a background optimization
      } finally {
        setPreloading(false);
      }
    };

    preloadUserImages();
  }, []);

  // Check if webcam is ready
  useEffect(() => {
    const checkWebcamReady = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        setWebcamReady(true);
        clearInterval(checkWebcamReady);
      }
    }, 500);

    return () => clearInterval(checkWebcamReady);
  }, []);

  // Capture the image from the webcam with improved quality
  const captureImage = () => {
    if (!webcamRef.current) {
      toast.error("Webcam not available");
      return;
    }

    try {
      // Capture at highest possible quality
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1280,
        height: 720
      });

      if (!imageSrc) {
        toast.error("Failed to capture image");
        return;
      }

      setCapturedImage(imageSrc);
      setErrorMessage('');

      // Convert to file
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "captured.png", { type: "image/png" });
          setPhoto(file);
          toast.success("Image captured successfully");
        })
        .catch(err => {
          console.error("Error processing captured image:", err);
          toast.error("Failed to process captured image");
        });

      setIsRetake(true); // After capture, allow retaking
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Failed to capture image from webcam");
    }
  };

  // Retake the image
  const retakeImage = () => {
    setCapturedImage(null);
    setPhoto(null);
    setIsRetake(false);
    setErrorMessage('');
  };

  // Send the captured image to the backend with improved error handling and timeout management
  const sendImageToServer = async () => {
    if (!photo) {
      toast.error("No image captured. Please capture your face first.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('photo', photo);

    // Create a cancel token for the request
    const source = axios.CancelToken.source();

    // Set a longer timeout (60 seconds)
    const TIMEOUT = 60000;

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        source.cancel('Request took too long');
        reject(new Error('Request timeout - server is taking too long to process the image'));
      }, TIMEOUT);
    });

    try {
      toast.loading('Scanning face...', { id: 'faceScan' });

      // Race between the actual request and the timeout
      const response = await Promise.race([
        axios.post('http://localhost:5000/api/v1/recognize', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          cancelToken: source.token
        }),
        timeoutPromise
      ]);

      toast.dismiss('faceScan');

      if (response.data.success === false) {
        setErrorMessage(response.data.message || 'Face recognition failed');
        toast.error(response.data.message || 'Face recognition failed');
        return;
      }

      console.log(response.data.user)
      setUserDetails(response.data.user); // Save the user data from the response
      toast.success('Face Detected and User Found!');
    } catch (error) {
      toast.dismiss('faceScan');
      console.error('Error during face recognition:', error);

      let errorMsg = 'Error during face recognition';

      if (axios.isCancel(error)) {
        // Request was cancelled due to timeout
        errorMsg = 'The server is taking too long to respond. This might be due to high server load or slow processing. Please try again.';
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMsg = error.response.data.message || error.response.data || errorMsg;
        console.log('Server response:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMsg = 'No response from server. Please check your connection.';
      } else if (error.message.includes('timeout')) {
        // Specific timeout error handling
        errorMsg = 'The face recognition process is taking longer than expected. Please try again or use a clearer image.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMsg = error.message || errorMsg;
      }

      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Preloading indicator */}
      {preloading && (
        <div className="bg-indigo-50 p-3 rounded-lg mb-4 text-sm text-indigo-800 flex items-center">
          <FaDatabase className="mr-2 animate-pulse" />
          <span>Optimizing face recognition system... This will improve recognition speed.</span>
        </div>
      )}

      {/* Instructions for better user experience */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800">
        <h3 className="font-bold mb-2">For best face recognition results:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ensure your face is well-lit and clearly visible</li>
          <li>Look directly at the camera</li>
          <li>Remove glasses, hats, or other face coverings</li>
          <li>Keep a neutral expression</li>
          <li>Hold still while capturing your image</li>
        </ul>
      </div>

      {/* Webcam/Image container with improved styling */}
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md mb-4 relative">
        {!capturedImage ? (
          <>
            {!webcamReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                <span className="ml-2 text-gray-700">Initializing camera...</span>
              </div>
            )}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              height="100%"
              videoConstraints={{
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              className="w-full h-72 object-cover"
            />
            {/* Face position guide overlay */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-blue-400 rounded-full opacity-50 pointer-events-none"></div>
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-72 object-cover"
          />
        )}
      </div>

      {/* Error message display */}
      {errorMessage && (
        <div className="bg-red-50 p-3 rounded-md mb-4 text-red-700 text-sm">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center space-x-4">
        <motion.button
          className={`px-6 py-2.5 rounded-md font-medium flex items-center ${
            isRetake ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'
          }`}
          onClick={isRetake ? retakeImage : captureImage}
          disabled={loading || !webcamReady}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isRetake ? <FaRedo className="mr-2" /> : <FaCamera className="mr-2" />}
          {isRetake ? "Retake Image" : "Capture Image"}
        </motion.button>

        {capturedImage && (
          <motion.button
            className={`px-6 py-2.5 rounded-md font-medium flex items-center ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            onClick={sendImageToServer}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Scanning...
              </>
            ) : (
              <>
                <FaSearch className="mr-2" />
                Scan Face
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default FaceScan;