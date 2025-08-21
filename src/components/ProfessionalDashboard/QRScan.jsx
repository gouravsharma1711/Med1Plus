import React, { useRef, useEffect, useState } from 'react';
import { FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';
import { useSelector } from 'react-redux';

const QRScan = ({ setUserDetails, calculateAge }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrResult, setQrResult] = useState(null);
  const [qrError, setQrError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const {token} = useSelector((state)=>state.auth)

  // Handle QR scan result
  const handleQrScan = async (data) => {
    if (data && scanning) {
      console.log(data)
      setQrResult(data);
      setScanning(false);
      setLoading(true);

      try {
        const token = JSON.parse(localStorage.getItem("token"));
        const response = await axios.get(
          `http://localhost:5000/api/v1/auth/getUserByCardId/${data}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          const patient = response.data.user;
          setUserDetails(patient);
          toast.success('Patient found by QR code');
        } else {
          toast.error('No patient found with this QR code');
          setQrError('No patient found with this QR code');
          setTimeout(() => {
            setScanning(true);
            setQrResult(null);
            setQrError("");
          }, 3000);
        }
      } catch (error) {
        console.error('Error scanning QR code:', error);
        toast.error('Error during QR code scan');
        setQrError('Error during QR code scan: ' + (error.response?.data?.message || error.message));
        setTimeout(() => {
          setScanning(true);
          setQrResult(null);
          setQrError("");
        }, 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setQrError("Error accessing webcam: " + err.message);
        toast.error("Could not access camera");
      }
    };

    const scanQRCode = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const context = canvas.getContext('2d');

      const scan = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && scanning) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);

          if (code) {
            handleQrScan(code.data);
          }
        }
        requestAnimationFrame(scan);
      };

      scan();
    };

    initWebcam();
    scanQRCode();

    return () => {
      const stream = videoRef.current?.srcObject;
      const tracks = stream?.getTracks();
      tracks?.forEach(track => track.stop());
    };
  }, [scanning]);

  return (
    <div>
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md mb-4 relative" style={{ height: '300px' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        ></video>
        <canvas ref={canvasRef} className="hidden"></canvas>

        {/* QR Code scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-2 border-white border-dashed"></div>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Position the QR code within the frame to scan
        </p>
        {qrResult && (
          <div className="mt-2 text-sm text-green-600">
            <FaCheck className="inline mr-1" /> QR Code detected: {qrResult.substring(0, 20)}...
          </div>
        )}
        {qrError && (
          <div className="mt-2 text-sm text-red-600">
            <FaExclamationTriangle className="inline mr-1" /> {qrError}
          </div>
        )}
        {loading && (
          <div className="mt-2 text-sm text-blue-600">
            <FaSpinner className="inline mr-1 animate-spin" /> Processing QR code...
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScan;