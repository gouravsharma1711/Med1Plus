import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaFileUpload,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaTrashAlt,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaArrowLeft,
  FaSpinner,
  FaEye
} from 'react-icons/fa';
import GridPattern from './GridPattern';

const FileUpload = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  const [files, setFiles] = useState([]);
  const [fileCategories, setFileCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileTypes, setFileTypes] = useState({
    pdf: true,
    image: true,
    doc: true
  });

  const fileInputRef = useRef(null);

  // Reset message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle file selection
  const onFileChange = (e) => {
    const selectedFiles = e.target.files;
    handleFiles(selectedFiles);
  };

  // Handle files from both input and drop
  const handleFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles = [];
    const invalidFiles = [];

    // Validate file types
    newFiles.forEach(file => {
      const fileType = file.type;

      if (
        (fileTypes.pdf && fileType === 'application/pdf') ||
        (fileTypes.image && fileType.startsWith('image/')) ||
        (fileTypes.doc && (
          fileType === 'application/msword' ||
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ))
      ) {
        // Check file size (max 10MB)
        if (file.size <= 10 * 1024 * 1024) {
          validFiles.push(file);
        } else {
          invalidFiles.push({ name: file.name, reason: 'File size exceeds 10MB limit' });
        }
      } else {
        invalidFiles.push({ name: file.name, reason: 'File type not supported' });
      }
    });

    if (invalidFiles.length > 0) {
      setMessage(`${invalidFiles.length} file(s) couldn't be added: ${invalidFiles.map(f => f.name).join(', ')}`);
      setMessageType('error');
    }

    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      setMessage(`${validFiles.length} file(s) added successfully`);
      setMessageType('success');
    }
  };

  // Handle file removal
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setFileCategories(prevCategories => prevCategories.filter((_, i) => i !== index));
  };

  // Handle file upload
  const onFileUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one file to upload.");
      setMessageType('error');
      return;
    }

    // Check if all files have categories assigned
    const missingCategories = fileCategories.some(category => !category);
    if (missingCategories) {
      setMessage("Please assign a category to all files before uploading.");
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("files", file);
      formData.append("categories", fileCategories[index] || "other");
    });

    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await axios.post(
        `http://localhost:5000/api/v1/user/upload/${user._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      setMessage("Files uploaded successfully!");
      setMessageType('success');
      setFiles([]);

      // Simulate completion for better UX
      setTimeout(() => {
        setUploadProgress(100);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      }, 500);

    } catch (error) {
      console.error("Upload error:", error);
      setMessage(error.response?.data?.message || "File upload failed. Please try again.");
      setMessageType('error');
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return <FaFilePdf className="text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <FaFileImage className="text-blue-500" />;
    } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FaFileAlt className="text-blue-700" />;
    }
    return <FaFileAlt className="text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Preview file
  const previewFile = (file) => {
    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      window.open(url, '_blank');
    } else if (file.type === 'application/pdf') {
      // For PDFs, open in a new tab
      window.open(url, '_blank');
    } else {
      alert('Preview is only available for image and PDF files');
    }
  };

  // Toggle file type filter
  const toggleFileType = (type) => {
    setFileTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Handle category selection for a file
  const handleCategoryChange = (index, category) => {
    setFileCategories(prevCategories => {
      const newCategories = [...prevCategories];
      newCategories[index] = category;
      return newCategories;
    });
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
            onClick={() => navigate('/user-dashboard')}
            className="ml-auto flex items-center text-blue-800 hover:text-blue-600"
          >
            <FaArrowLeft className="mr-1" /> Back to Dashboard
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

        <motion.div
          className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl z-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-blue-900">Upload Medical Documents</h1>
            <p className="text-gray-600 mt-2">
              Upload your medical records, prescriptions, and test reports securely
            </p>
          </div>

          {/* File Type Filters */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">File Types:</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleFileType('pdf')}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                  fileTypes.pdf
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <FaFilePdf className={`mr-1 ${fileTypes.pdf ? 'text-red-500' : 'text-gray-400'}`} />
                PDF Files {fileTypes.pdf ? '✓' : ''}
              </button>
              <button
                onClick={() => toggleFileType('image')}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                  fileTypes.image
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <FaFileImage className={`mr-1 ${fileTypes.image ? 'text-blue-500' : 'text-gray-400'}`} />
                Image Files {fileTypes.image ? '✓' : ''}
              </button>
              <button
                onClick={() => toggleFileType('doc')}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                  fileTypes.doc
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <FaFileAlt className={`mr-1 ${fileTypes.doc ? 'text-blue-700' : 'text-gray-400'}`} />
                Document Files {fileTypes.doc ? '✓' : ''}
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              onChange={onFileChange}
              className="hidden"
              ref={fileInputRef}
              accept={`${fileTypes.pdf ? '.pdf,' : ''}${fileTypes.image ? 'image/*,' : ''}${fileTypes.doc ? '.doc,.docx' : ''}`}
            />

            <FaFileUpload className="mx-auto text-4xl text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Drag & Drop Files Here
            </h3>
            <p className="text-gray-500 mb-4">
              or <button
                type="button"
                className="text-blue-600 font-medium hover:text-blue-800"
                onClick={() => fileInputRef.current.click()}
              >
                browse files
              </button> from your computer
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: {fileTypes.pdf ? 'PDF, ' : ''}{fileTypes.image ? 'JPG, PNG, GIF, ' : ''}{fileTypes.doc ? 'DOC, DOCX' : ''}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Maximum file size: 10MB
            </p>
          </div>

          {/* Message Display */}
          <AnimatePresence>
            {message && (
              <motion.div
                className={`mb-6 p-3 rounded-md flex items-center ${
                  messageType === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {messageType === 'error' ? (
                  <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                ) : (
                  <FaCheck className="mr-2 flex-shrink-0" />
                )}
                <p>{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Selected Files ({files.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center flex-grow">
                        <div className="mr-3 text-xl">
                          {getFileIcon(file)}
                        </div>
                        <div className="overflow-hidden flex-grow">
                          <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>

                          {/* Document Category Selection */}
                          <div className="mt-2">
                            <label className="text-xs font-medium text-gray-600 block mb-1">
                              Document Category:
                            </label>
                            <select
                              value={fileCategories[index] || ""}
                              onChange={(e) => handleCategoryChange(index, e.target.value)}
                              className={`text-xs border rounded p-1 w-full max-w-xs ${
                                !fileCategories[index] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            >
                              <option value="" disabled>Select a category</option>
                              <option value="prescription">Prescription</option>
                              <option value="medical_report">Medical Report</option>
                              <option value="lab_result">Lab Result</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center ml-4">
                        {(file.type.startsWith('image/') || file.type === 'application/pdf') && (
                          <button
                            type="button"
                            onClick={() => previewFile(file)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Preview"
                          >
                            <FaEye />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1 ml-2"
                          title="Remove"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={onFileUpload}
              disabled={uploading || files.length === 0}
              className={`px-6 py-3 rounded-md font-medium flex items-center ${
                uploading || files.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-700 text-white hover:bg-blue-800'
              }`}
              whileHover={uploading || files.length === 0 ? {} : { scale: 1.02 }}
              whileTap={uploading || files.length === 0 ? {} : { scale: 0.98 }}
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaFileUpload className="mr-2" />
                  Upload {files.length > 0 ? `${files.length} Files` : 'Files'}
                </>
              )}
            </motion.button>
          </div>

          {/* Information Note */}
          <div className="mt-8 p-4 bg-blue-50 rounded-md text-sm text-blue-800 flex items-start">
            <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Important Information</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>All uploaded documents are encrypted and securely stored</li>
                <li>Please categorize your documents correctly for better organization</li>
                <li>Only authorized healthcare providers can access your documents</li>
                <li>You can view and manage your uploaded documents in the "View Documents" section</li>
                <li>For assistance, please contact our support team at support@medisecure.gov.in</li>
              </ul>
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

export default FileUpload;

