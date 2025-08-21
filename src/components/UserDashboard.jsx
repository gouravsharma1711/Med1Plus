import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBars,
  FaSearch,
  FaFilter,
  FaTimes,
  FaTrashAlt,
  FaEye,
  FaUser,
  FaFileUpload,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaSignOutAlt,
  FaClipboardList,
  FaCog,
  FaHome,
  FaBell,
  FaQuestionCircle,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaChartLine,
  FaCalendarAlt,
  FaUserMd,
  FaIdCard,
  FaFileDownload,
  FaHeartbeat,
  FaWeight,
  FaRulerVertical,
  FaMapMarkerAlt,
  FaPhone,
  FaUserFriends,
  FaAllergies,
  FaPills,
  FaNotesMedical,
  FaSync
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/operations/authAPI';
import toast from 'react-hot-toast';
import GridPattern from './GridPattern';
import CompactArogyaNetraCard from './CompactArogyaNetraCard';
import SimpleArogyaNetraCard from './SimpleArogyaNetraCard';

const UserDashboard = () => {
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [fileCategories, setFileCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your recent lab results are available', read: false, date: '2 hours ago' },
    { id: 2, text: 'Appointment reminder: Dr. Smith on 15th June', read: false, date: '1 day ago' },
    { id: 3, text: 'Your prescription has been renewed', read: true, date: '3 days ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    documentsUploaded: 0,
    lastUpload: 'Never',
    upcomingAppointments: 1
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [userDocuments, setUserDocuments] = useState([]);
  const [reportSummary, setReportSummary] = useState({
    loading: false,
    data: null,
    error: null,
    lastUpdated: null
  });

  // First-time login modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    height: '',
    weight: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalConditions: [],
    allergies: [],
    medications: []
  });
  const [profileFormStep, setProfileFormStep] = useState(1);
  const [profileFormErrors, setProfileFormErrors] = useState({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  // Check if user needs to complete profile
  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user?._id || !token) return;

      try {
        const response = await axios.get(
          `http://localhost:5000/api/v1/auth/check-profile-status`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (response.data.needsProfileCompletion && user.accountType === 'User') {
          setShowProfileModal(true);

          // Pre-fill form with any existing data
          if (response.data.profile) {
            const profile = response.data.profile;
            setProfileFormData(prevData => ({
              ...prevData,
              gender: profile.gender || '',
              dateOfBirth: profile.dateOfBirth || '',
              bloodGroup: profile.bloodGroup || '',
              height: profile.height || '',
              weight: profile.weight || '',
              address: {
                street: profile.address?.street || '',
                city: profile.address?.city || '',
                state: profile.address?.state || '',
                pincode: profile.address?.pincode || '',
                country: profile.address?.country || 'India'
              },
              emergencyContact: {
                name: profile.emergencyContact?.name || '',
                relationship: profile.emergencyContact?.relationship || '',
                phone: profile.emergencyContact?.phone || ''
              },
              medicalConditions: profile.medicalConditions || [],
              allergies: profile.allergies || [],
              medications: profile.medications || []
            }));
          }
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
      }
    };

    checkProfileStatus();
  }, [user, token]);

  // Function to fetch report summary
  const fetchReportSummary = async () => {
    if (!user?._id || !token) return;

    setReportSummary(prev => ({ ...prev, loading: true, error: null }));

    console.log(user._id)

    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/user/get-report-summary/${user._id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.summary) {
        setReportSummary({
          loading: false,
          data: response.data.summary,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        setReportSummary({
          loading: false,
          data: null,
          error: "No summary data available",
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching report summary:', error);
      setReportSummary({
        loading: false,
        data: null,
        error: error.response?.data?.message || "Failed to fetch report summary",
        lastUpdated: new Date()
      });
    }
  };

  // Fetch user documents and report summary
  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (!user?._id || !token) return;

      try {
        const fetchUpdatedDocuments = async () => {
          const response = await axios.get(
            `http://localhost:5000/api/v1/user/get-documents/${user._id}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            }
          );
          return response;
        };

        const response = await fetchUpdatedDocuments();

        console.log("API Response:", response.data);

        if (response.data && response.data.documents) {
          const docs = response.data.documents || [];
          setUserDocuments(docs);

          // Update stats
          setStats(prev => ({
            ...prev,
            documentsUploaded: docs.length,
            lastUpload: docs.length > 0 ? formatTimeAgo(new Date(docs[0].uploadedAt)) : 'Never'
          }));

          // Update recent activities with actual document uploads
          try {
            const recentDocs = [...docs]
              .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
              .slice(0, 3);

            const newActivities = recentDocs.map(doc => ({
              id: doc._id || Date.now(),
              type: 'upload',
              text: `${doc.fileName || doc.originalname || 'Document'} uploaded`,
              date: formatTimeAgo(new Date(doc.uploadedAt || doc.createdAt || Date.now())),
              category: doc.category || 'other',
              fileType: doc.fileType || doc.mimetype || 'application/octet-stream'
            }));

            setRecentActivities(newActivities);
          } catch (err) {
            console.error("Error processing document data:", err);
            // Fallback to empty activities if there's an error
            setRecentActivities([]);
          }

          // Fetch report summary if there are documents
          if (docs.length > 0) {
            fetchReportSummary();
          }
        } else {
          console.warn("No documents found in API response");
          setUserDocuments([]);
          setRecentActivities([]);
        }
      } catch (error) {
        console.error('Error fetching user documents:', error);
      }
    };

    fetchUserDocuments();
  }, [user, token]);

  // Handle file drop event
  const onDrop = (acceptedFiles) => {
    // Validate files (max 5 files, max 10MB each)
    const validFiles = [];
    const invalidFiles = [];

    acceptedFiles.forEach(file => {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        validFiles.push(file);
      } else {
        invalidFiles.push({ name: file.name, reason: 'File size exceeds 10MB limit' });
      }
    });

    if (invalidFiles.length > 0) {
      setMessage(`${invalidFiles.length} file(s) couldn't be added: ${invalidFiles.map(f => f.name).join(', ')}`);
      setMessageType('error');
    }

    if (validFiles.length > 0) {
      // Update the state with the new files
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      // Generate file previews
      setFilePreviews((prevPreviews) => [
        ...prevPreviews,
        ...validFiles.map((file) => URL.createObjectURL(file)),
      ]);
      // Initialize empty categories for new files
      setFileCategories(prevCategories => [
        ...prevCategories,
        ...Array(validFiles.length).fill("")
      ]);

      setMessage(`${validFiles.length} file(s) added successfully`);
      setMessageType('success');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
  });

  // Remove file from the list
  const removeFile = (index) => {
    setFiles(files.filter((_, fileIndex) => fileIndex !== index));
    setFilePreviews(filePreviews.filter((_, fileIndex) => fileIndex !== index));
    setFileCategories(prevCategories => prevCategories.filter((_, i) => i !== index));
  };

  // Handle category selection for a file
  const handleCategoryChange = (index, category) => {
    setFileCategories(prevCategories => {
      const newCategories = [...prevCategories];
      newCategories[index] = category;
      return newCategories;
    });
  };

  // Open full preview in a new tab
  const openFullPreview = (index) => {
    const file = files[index];
    const previewUrl = filePreviews[index];

    if (file.type.startsWith('image/')) {
      // For image files, open in a new tab
      const newWindow = window.open();
      newWindow.document.write('<img src="' + previewUrl + '" width="100%" />');
    } else if (file.type === 'application/pdf') {
      // For PDFs, open in a new tab
      window.open(previewUrl, '_blank');
    }
  };

  // Get file icon based on file object
  const getFileIcon = (file) => {
    if (!file) return <FaFileAlt className="text-gray-500" />;

    const fileType = file.type || file.fileType || file.mimetype || '';
    return getFileIconByType(fileType);
  };

  // Get file icon based on file type string
  const getFileIconByType = (fileType) => {
    if (!fileType) return <FaFileAlt className="text-gray-500" />;

    if (fileType === 'application/pdf') {
      return <FaFilePdf className="text-red-500" />;
    } else if (fileType.startsWith('image/')) {
      return <FaFileImage className="text-blue-500" />;
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
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

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };

  const uploadHandler = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setMessage("Please select at least one file to upload.");
      setMessageType('error');
      return;
    }

    // Check if all files have categories assigned
    const missingCategories = files.some((_, index) => !fileCategories[index]);
    if (missingCategories) {
      setMessage("Please assign a category to all files before uploading.");
      setMessageType('error');
      return;
    }

    // Send multiple files to the backend
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file); // Append each file with 'files' key
      formData.append('categories', fileCategories[index] || 'other'); // Append category for each file
    });

    try {
      setUploading(true);
      setUploadProgress(0);

      await axios.post(
        `http://localhost:5000/api/v1/user/upload/${user._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      // Simulate completion for better UX
      setTimeout(() => {
        setUploadProgress(100);
        setTimeout(async () => {
          setUploading(false);
          setUploadProgress(0);
          setFiles([]);
          setFilePreviews([]);
          setFileCategories([]);
          setMessage("Files uploaded successfully!");
          setMessageType('success');
          toast.success("Files uploaded successfully!");

          // Fetch updated documents to get the latest data
          const fetchUpdatedDocuments = async () => {
            try {
              const response = await axios.get(
                `http://localhost:5000/api/v1/user/get-documents/${user._id}`,
                {
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                }
              );

              if (response.data) {
                const docs = response.data.documents || [];
                setUserDocuments(docs);

                // Update stats with real data
                setStats(prev => ({
                  ...prev,
                  documentsUploaded: docs.length,
                  lastUpload: 'Just now'
                }));

                console.log("Updated documents after upload:", docs);

                let newActivities = [];

                try {
                  // Get the newly uploaded documents (should be the most recent ones)
                  const newlyUploaded = [...docs]
                    .sort((a, b) => new Date(b.uploadedAt || b.createdAt || Date.now()) -
                                    new Date(a.uploadedAt || a.createdAt || Date.now()))
                    .slice(0, files.length);

                  // Create activities for each newly uploaded document
                  newActivities = newlyUploaded.map(doc => ({
                    id: doc._id || Date.now() + Math.random(),
                    type: 'upload',
                    text: `${doc.fileName || doc.originalname || 'Document'} uploaded`,
                    date: 'Just now',
                    category: doc.category || 'other',
                    fileType: doc.fileType || doc.mimetype || files.find(f =>
                      f.name === (doc.fileName || doc.originalname))?.type || 'application/octet-stream'
                  }));

                  console.log("New activities created:", newActivities);
                } catch (err) {
                  console.error("Error creating activities from uploaded documents:", err);

                  // Fallback to generic activities if there's an error
                  newActivities = files.map((file, index) => ({
                    id: Date.now() + index,
                    type: 'upload',
                    text: `${file.name} uploaded`,
                    date: 'Just now',
                    fileType: file.type
                  }));
                }

                // Update recent activities with the new ones at the top
                setRecentActivities([...newActivities, ...recentActivities].slice(0, 5));
              }
            } catch (error) {
              console.error('Error fetching updated documents:', error);

              // Fallback to basic update if fetch fails
              setStats(prev => ({
                ...prev,
                documentsUploaded: prev.documentsUploaded + files.length,
                lastUpload: 'Just now'
              }));

              // Add generic activity
              const newActivity = {
                id: Date.now(),
                type: 'upload',
                text: `${files.length} document(s) uploaded`,
                date: 'Just now'
              };
              setRecentActivities([newActivity, ...recentActivities].slice(0, 4));
            }
          };

          await fetchUpdatedDocuments();

          // Refresh report summary after upload
          if (userDocuments.length > 0) {
            fetchReportSummary();
          }
        }, 500);
      }, 500);

    } catch (error) {
      console.error('Error uploading files:', error);
      setUploading(false);
      setMessage("File upload failed. Please try again.");
      setMessageType('error');
      toast.error("File upload failed");
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnClickOutside = (e) => {
    if (sidebarOpen && !e.target.closest('.sidebar')) {
      setSidebarOpen(false);
    }
  };

  const logoutHandler = async () => {
    dispatch(logout(navigate));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Handle profile form input changes
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects (address and emergency contact)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field if it exists
    if (profileFormErrors[name]) {
      setProfileFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle array inputs (medical conditions, allergies, medications)
  const handleArrayInputChange = (field, value) => {
    // Split by commas and trim whitespace
    const items = value.split(',').map(item => item.trim()).filter(item => item);

    setProfileFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  // Validate form data for the current step
  const validateProfileForm = (step) => {
    const errors = {};

    if (step === 1) {
      if (!profileFormData.gender) errors.gender = 'Gender is required';
      if (!profileFormData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!profileFormData.bloodGroup) errors.bloodGroup = 'Blood group is required';
    } else if (step === 2) {
      if (!profileFormData.address.city) errors['address.city'] = 'City is required';
      if (!profileFormData.address.state) errors['address.state'] = 'State is required';
    } else if (step === 3) {
      if (!profileFormData.emergencyContact.name) errors['emergencyContact.name'] = 'Emergency contact name is required';
      if (!profileFormData.emergencyContact.phone) errors['emergencyContact.phone'] = 'Emergency contact phone is required';
    }

    setProfileFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step in the form
  const handleNextStep = () => {
    if (validateProfileForm(profileFormStep)) {
      setProfileFormStep(prev => prev + 1);
    }
  };

  // Handle previous step in the form
  const handlePrevStep = () => {
    setProfileFormStep(prev => Math.max(prev - 1, 1));
  };

  // Submit profile form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Validate the current step
    if (!validateProfileForm(profileFormStep)) {
      return;
    }

    setIsSubmittingProfile(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/v1/user/update-medical-profile',
        profileFormData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setShowProfileModal(false);
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return (
    <div onClick={closeSidebarOnClickOutside} className="min-h-screen bg-gray-50 flex flex-col">
      {/* Report Summary Modal */}
      <AnimatePresence>
        {showReportModal && reportSummary.data && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="p-6 bg-blue-700 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold">Medical Report Analysis</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {reportSummary.data.healthIssues && reportSummary.data.healthIssues.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Detected Health Issues</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Disease/Risk
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Severity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Possible Causes
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Suggested Precautions/Treatment
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportSummary.data.healthIssues.map((issue, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {issue.disease}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${issue.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                                    issue.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'}`}>
                                  {issue.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {issue.causes}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {issue.treatment}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-md mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaCheck className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">No Health Issues Detected</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Based on the analyzed reports, no significant health issues were detected.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3>
                  <p className="text-gray-700">
                    {reportSummary.data.summary || "Your medical reports have been analyzed."}
                  </p>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  <p className="font-medium">Important Note:</p>
                  <p>This analysis is generated by AI and should not replace professional medical advice. Always consult with your healthcare provider for proper diagnosis and treatment.</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => fetchReportSummary()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  disabled={reportSummary.loading}
                >
                  {reportSummary.loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <FaSync className="mr-2" />
                      Refresh Analysis
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-time Login Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="p-6 bg-blue-700 text-white">
                <h2 className="text-2xl font-bold">Complete Your Medical Profile</h2>
                <p className="mt-2 text-blue-100">
                  Please provide your medical information to access the dashboard. This information will help healthcare providers better serve you.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6">
                {/* Step 1: Basic Medical Information */}
                {profileFormStep === 1 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaUser className="mr-2 text-blue-600" /> Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="gender"
                          value={profileFormData.gender}
                          onChange={handleProfileInputChange}
                          className={`w-full p-2 border rounded-md ${
                            profileFormErrors.gender ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {profileFormErrors.gender && (
                          <p className="mt-1 text-sm text-red-500">{profileFormErrors.gender}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profileFormData.dateOfBirth}
                          onChange={handleProfileInputChange}
                          className={`w-full p-2 border rounded-md ${
                            profileFormErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {profileFormErrors.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-500">{profileFormErrors.dateOfBirth}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blood Group <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="bloodGroup"
                          value={profileFormData.bloodGroup}
                          onChange={handleProfileInputChange}
                          className={`w-full p-2 border rounded-md ${
                            profileFormErrors.bloodGroup ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                        {profileFormErrors.bloodGroup && (
                          <p className="mt-1 text-sm text-red-500">{profileFormErrors.bloodGroup}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={profileFormData.height}
                          onChange={handleProfileInputChange}
                          placeholder="Height in cm"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          name="weight"
                          value={profileFormData.weight}
                          onChange={handleProfileInputChange}
                          placeholder="Weight in kg"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Address Information */}
                {profileFormStep === 2 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-600" /> Address Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={profileFormData.address.street}
                        onChange={handleProfileInputChange}
                        placeholder="Street address"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={profileFormData.address.city}
                          onChange={handleProfileInputChange}
                          placeholder="City"
                          className={`w-full p-2 border rounded-md ${
                            profileFormErrors['address.city'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {profileFormErrors['address.city'] && (
                          <p className="mt-1 text-sm text-red-500">{profileFormErrors['address.city']}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address.state"
                          value={profileFormData.address.state}
                          onChange={handleProfileInputChange}
                          placeholder="State"
                          className={`w-full p-2 border rounded-md ${
                            profileFormErrors['address.state'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {profileFormErrors['address.state'] && (
                          <p className="mt-1 text-sm text-red-500">{profileFormErrors['address.state']}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="address.pincode"
                          value={profileFormData.address.pincode}
                          onChange={handleProfileInputChange}
                          placeholder="Pincode"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          name="address.country"
                          value={profileFormData.address.country}
                          onChange={handleProfileInputChange}
                          placeholder="Country"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          readOnly
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Emergency Contact and Medical Conditions */}
                {profileFormStep === 3 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaPhone className="mr-2 text-blue-600" /> Emergency Contact
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="emergencyContact.name"
                          value={profileFormData.emergencyContact.name}
                          onChange={handleProfileInputChange}
                          placeholder="Emergency contact name"
                          className={`w-full p-2 border rounded-md ${
                            profileFormErrors['emergencyContact.name'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {profileFormErrors['emergencyContact.name'] && (
                          <p className="mt-1 text-sm text-red-500">{profileFormErrors['emergencyContact.name']}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship
                        </label>
                        <input
                          type="text"
                          name="emergencyContact.relationship"
                          value={profileFormData.emergencyContact.relationship}
                          onChange={handleProfileInputChange}
                          placeholder="Relationship to you"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="emergencyContact.phone"
                        value={profileFormData.emergencyContact.phone}
                        onChange={handleProfileInputChange}
                        placeholder="Emergency contact phone"
                        className={`w-full p-2 border rounded-md ${
                          profileFormErrors['emergencyContact.phone'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {profileFormErrors['emergencyContact.phone'] && (
                        <p className="mt-1 text-sm text-red-500">{profileFormErrors['emergencyContact.phone']}</p>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4 flex items-center">
                      <FaNotesMedical className="mr-2 text-blue-600" /> Medical Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medical Conditions (separate with commas)
                      </label>
                      <textarea
                        value={profileFormData.medicalConditions.join(', ')}
                        onChange={(e) => handleArrayInputChange('medicalConditions', e.target.value)}
                        placeholder="E.g. Diabetes, Hypertension, Asthma"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergies (separate with commas)
                      </label>
                      <textarea
                        value={profileFormData.allergies.join(', ')}
                        onChange={(e) => handleArrayInputChange('allergies', e.target.value)}
                        placeholder="E.g. Penicillin, Peanuts, Dust"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Medications (separate with commas)
                      </label>
                      <textarea
                        value={profileFormData.medications.join(', ')}
                        onChange={(e) => handleArrayInputChange('medications', e.target.value)}
                        placeholder="E.g. Metformin, Lisinopril, Albuterol"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="2"
                      />
                    </div>
                  </motion.div>
                )}

                <div className="mt-8 flex justify-between">
                  {profileFormStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Previous
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {profileFormStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      {isSubmittingProfile ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2" />
                          Complete Profile
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
                Your information is protected and will only be shared with authorized healthcare providers.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
        Government of India | Ministry of Health and Family Welfare
      </div>

      <header className="bg-white shadow-md py-3 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="mr-4 text-blue-800 p-2 rounded-md hover:bg-blue-50 lg:hidden"
            >
              <FaBars />
            </button>

            <Link to="/" className="flex items-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="National Emblem"
                className="h-10 mr-3"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-900">MediSecure</h1>
                <p className="text-xs text-gray-600">National Health Records System</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                className="p-2 text-blue-800 hover:bg-blue-50 rounded-full relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaBell />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                      <h3 className="font-medium text-blue-800">Notifications</h3>
                      {unreadNotificationsCount > 0 && (
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={markAllNotificationsAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-start">
                              <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                              <div>
                                <p className="text-sm text-gray-800">{notification.text}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                      <Link to="#" className="text-xs text-blue-600 hover:text-blue-800">
                        View all notifications
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 mr-2">
                {user?.firstName?.charAt(0) || <FaUser />}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.accountType === 'User' ? 'Citizen' : 'Healthcare Provider'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Sidebar - Desktop (always visible) */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="mb-6">
              <p className="text-xs uppercase text-gray-500 font-medium mb-2">Main Menu</p>
              <nav className="space-y-1">
                <Link to="/user-dashboard" className="flex items-center px-4 py-2.5 text-blue-800 bg-blue-50 rounded-md font-medium">
                  <FaHome className="mr-3" /> Dashboard
                </Link>
                <Link to="/view-documents" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                  <FaClipboardList className="mr-3" /> My Documents
                </Link>
                <Link to="/upload" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                  <FaFileUpload className="mr-3" /> Upload Documents
                </Link>
              </nav>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase text-gray-500 font-medium mb-2">Account</p>
              <nav className="space-y-1">
                <Link to="/my-profile" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                  <FaUser className="mr-3" /> My Profile
                </Link>
                <Link to="#" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                  <FaCog className="mr-3" /> Settings
                </Link>
                <Link to="#" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                  <FaQuestionCircle className="mr-3" /> Help & Support
                </Link>
                <button
                  onClick={logoutHandler}
                  className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <FaSignOutAlt className="mr-3" /> Logout
                </button>
              </nav>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-xs text-blue-700 mb-3">
                Contact our support team for assistance with your medical records.
              </p>
              <a
                href="mailto:support@medisecure.gov.in"
                className="text-xs text-white bg-blue-700 px-3 py-1.5 rounded inline-block hover:bg-blue-800"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar - Mobile (toggleable) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="sidebar fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-gray-900 bg-opacity-50" onClick={toggleSidebar}></div>
              <motion.div
                className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                      alt="National Emblem"
                      className="h-8 mr-2"
                    />
                    <h2 className="text-lg font-bold text-blue-900">MediSecure</h2>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="p-4">
                  <div className="mb-6">
                    <p className="text-xs uppercase text-gray-500 font-medium mb-2">Main Menu</p>
                    <nav className="space-y-1">
                      <Link to="/user-dashboard" className="flex items-center px-4 py-2.5 text-blue-800 bg-blue-50 rounded-md font-medium">
                        <FaHome className="mr-3" /> Dashboard
                      </Link>
                      <Link to="/view-documents" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                        <FaClipboardList className="mr-3" /> My Documents
                      </Link>
                      <Link to="/upload" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                        <FaFileUpload className="mr-3" /> Upload Documents
                      </Link>
                    </nav>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs uppercase text-gray-500 font-medium mb-2">Account</p>
                    <nav className="space-y-1">
                      <Link to="/my-profile" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                        <FaUser className="mr-3" /> My Profile
                      </Link>
                      <Link to="#" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                        <FaCog className="mr-3" /> Settings
                      </Link>
                      <Link to="#" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                        <FaQuestionCircle className="mr-3" /> Help & Support
                      </Link>
                      <button
                        onClick={logoutHandler}
                        className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <FaSignOutAlt className="mr-3" /> Logout
                      </button>
                    </nav>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'User'}
              </h1>
              <p className="text-gray-600">
                Manage your health records securely with MediSecure
              </p>
            </div>

            {/* Arogya Netra Card Section - Client-side rendering */}
            {user?.accountType === 'User' && <SimpleArogyaNetraCard />}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Documents Uploaded</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.documentsUploaded}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.documentsUploaded > 0
                        ? `Last upload: ${stats.lastUpload}`
                        : 'No documents uploaded yet'}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <FaFileAlt />
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    to="/upload"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaFileUpload className="mr-1" /> Upload new documents
                  </Link>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Report Summary</p>
                    {reportSummary.loading ? (
                      <div className="flex items-center mt-2">
                        <FaSpinner className="animate-spin text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">Analyzing reports...</span>
                      </div>
                    ) : reportSummary.error ? (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">No summary available</p>
                        <p className="text-xs text-gray-500 mt-1">Upload medical reports for analysis</p>
                      </div>
                    ) : reportSummary.data ? (
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-md font-semibold text-gray-900">Health Status</h3>
                          {reportSummary.data.healthStatus && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              reportSummary.data.healthStatus === 'Good' ? 'bg-green-100 text-green-800' :
                              reportSummary.data.healthStatus === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                              reportSummary.data.healthStatus === 'Poor' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {reportSummary.data.healthStatus || 'Analyzed'}
                            </span>
                          )}
                        </div>
                        <div
                          className="mt-2 max-h-20 overflow-y-auto text-sm text-gray-700 cursor-pointer hover:text-blue-600"
                          onClick={() => setShowReportModal(true)}
                        >
                          {reportSummary.data.summary || "Your medical reports have been analyzed."}
                          <p className="text-xs text-blue-500 mt-1">(Click to view full report)</p>
                        </div>
                        {reportSummary.lastUpdated && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last updated: {formatTimeAgo(reportSummary.lastUpdated)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">No summary available</p>
                        <p className="text-xs text-gray-500 mt-1">Upload medical reports for analysis</p>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${
                    reportSummary.loading ? 'bg-blue-100 text-blue-600' :
                    reportSummary.error ? 'bg-gray-100 text-gray-600' :
                    reportSummary.data?.healthStatus === 'Good' ? 'bg-green-100 text-green-600' :
                    reportSummary.data?.healthStatus === 'Fair' ? 'bg-yellow-100 text-yellow-600' :
                    reportSummary.data?.healthStatus === 'Poor' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {reportSummary.loading ? <FaSpinner className="animate-spin" /> :
                     reportSummary.error ? <FaExclamationTriangle /> :
                     <FaHeartbeat />}
                  </div>
                </div>
                <div className="mt-4">
                  {reportSummary.data && (
                    <button
                      onClick={() => fetchReportSummary()}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center mr-4"
                      disabled={reportSummary.loading}
                    >
                      <FaSync className={`mr-1 ${reportSummary.loading ? 'animate-spin' : ''}`} />
                      Refresh analysis
                    </button>
                  )}
                  {!reportSummary.data && (
                    <Link
                      to="/upload"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FaFileUpload className="mr-1" /> Upload medical reports
                    </Link>
                  )}
                </div>
              </div>

              {/* <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Appointments</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingAppointments}</h3>
                    <p className="text-xs text-gray-500 mt-1">Next: Dr. Smith on 15th June</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <FaCalendarAlt />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Health Status</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">Good</h3>
                    <p className="text-xs text-gray-500 mt-1">Last checkup: 3 months ago</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <FaChartLine />
                  </div>
                </div>
              </div> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Documents Section */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upload Medical Documents
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload your medical records, prescriptions, and test reports securely
                  </p>
                </div>

                <div className="p-6">
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

                  {/* File Drop Area */}
                  <div
                    {...getRootProps()}
                    className={`border-2 cursor-pointer border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input {...getInputProps()} />

                    <FaFileUpload className="mx-auto text-4xl text-blue-500 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Drag & Drop Files Here
                    </h3>
                    <p className="text-gray-500 mb-2">
                      or <span className="text-blue-600 font-medium">browse files</span> from your computer
                    </p>
                    <p className="text-xs text-gray-400">
                      Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                    </p>
                  </div>

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
                              <div className="flex items-center">
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
                              <div className="flex items-center">
                                {file.type.startsWith('image/') && (
                                  <button
                                    type="button"
                                    onClick={() => openFullPreview(index)}
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
                      onClick={uploadHandler}
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
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {recentActivities.length > 0 ? (
                    recentActivities.map(activity => (
                      <div key={activity.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-full mr-3 ${
                            activity.type === 'upload' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'view' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activity.type === 'upload' ? (
                              activity.fileType ? getFileIconByType(activity.fileType) : <FaFileUpload />
                            ) : activity.type === 'view' ? <FaEye /> :
                              <FaCalendarAlt />}
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm text-gray-800">{activity.text}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                              {activity.category && (
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                  {activity.category === 'prescription' ? 'Prescription' :
                                   activity.category === 'medical_report' ? 'Medical Report' :
                                   activity.category === 'lab_result' ? 'Lab Result' :
                                   activity.category === 'other' ? 'Other' :
                                   activity.category}
                                </span>
                              )}
                            </div>
                          </div>
                          {activity.type === 'upload' && (
                            <Link
                              to="/view-documents"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              title="View Document"
                            >
                              <FaEye />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                        <FaFileAlt className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">No documents uploaded yet</p>
                      <Link
                        to="/upload"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Upload your first document
                      </Link>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 text-center">
                  <Link to="/view-documents" className="text-sm text-blue-600 hover:text-blue-800">
                    View All Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
