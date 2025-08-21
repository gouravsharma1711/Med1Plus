import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  FaSearch,
  FaTimes,
  FaBars,
  FaFilter,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaFolder,
  FaHome,
  FaClipboardList,
  FaFileUpload,
  FaUser,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaShareAlt,
  FaTrashAlt,
  FaInfoCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserDetails } from '../services/operations/profileAPI';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/operations/authAPI';
import GridPattern from './GridPattern';
import axios from 'axios';

const UserDocuments = () => {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [documentsByCategory, setDocumentsByCategory] = useState({});
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('category'); // Default to category view
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Months array for filter dropdown
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Years array for filter dropdown (current year and 4 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Document categories
  const categories = [
    { id: 'all', name: 'All Documents', icon: <FaFolder /> },
    { id: 'prescription', name: 'Prescriptions', icon: <FaFilePdf /> },
    { id: 'medical_report', name: 'Medical Reports', icon: <FaFileAlt /> },
    { id: 'lab_result', name: 'Lab Results', icon: <FaFileImage /> },
    { id: 'other', name: 'Other Documents', icon: <FaFileAlt /> }
  ];

  useEffect(() => {
    const fetchUserDocuments = async () => {
      setLoading(true);
      try {
        // Fetch documents directly from API to get the categorized documents
        const response = await axios.get(
          `http://localhost:5000/api/v1/user/get-documents/${user?._id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (response.data) {
          setDocuments(response.data.documents || []);
          setFilteredDocuments(response.data.documents || []);

          // Set documents by category if available from API
          if (response.data.documentsByCategory) {
            setDocumentsByCategory(response.data.documentsByCategory);
          } else {
            // Organize documents by category manually if not provided by API
            const docsByCategory = {
              prescription: [],
              medical_report: [],
              lab_result: [],
              other: []
            };

            (response.data.documents || []).forEach(doc => {
              const category = doc.category || 'other';
              if (docsByCategory[category]) {
                docsByCategory[category].push(doc);
              } else {
                docsByCategory.other.push(doc);
              }
            });

            setDocumentsByCategory(docsByCategory);
          }
        } else if (user?.documents) {
          // Fallback to user documents from Redux if API fails
          setDocuments(user.documents);
          setFilteredDocuments(user.documents);

          // Organize documents by category
          const docsByCategory = {
            prescription: [],
            medical_report: [],
            lab_result: [],
            other: []
          };

          user.documents.forEach(doc => {
            const category = doc.category || 'other';
            if (docsByCategory[category]) {
              docsByCategory[category].push(doc);
            } else {
              docsByCategory.other.push(doc);
            }
          });

          setDocumentsByCategory(docsByCategory);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');

        // Fallback to user documents from Redux if API fails
        if (user?.documents) {
          setDocuments(user.documents);
          setFilteredDocuments(user.documents);

          // Organize documents by category
          const docsByCategory = {
            prescription: [],
            medical_report: [],
            lab_result: [],
            other: []
          };

          user.documents.forEach(doc => {
            const category = doc.category || 'other';
            if (docsByCategory[category]) {
              docsByCategory[category].push(doc);
            } else {
              docsByCategory.other.push(doc);
            }
          });

          setDocumentsByCategory(docsByCategory);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchUserDocuments();
    }
  }, [user, token, dispatch, navigate]);

  useEffect(() => {
    if (documents.length > 0) {
      filterAndSortDocuments();
    }
  }, [searchTerm, filterType, categoryFilter, dateFilter, monthFilter, yearFilter, sortBy, sortOrder, documents]);

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter((doc) =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((doc) => doc.fileType.startsWith(filterType));
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      filtered = filtered.filter(
        (doc) => {
          const docDate = new Date(doc.uploadedAt);
          return docDate.getDate() === selectedDate.getDate() &&
                 docDate.getMonth() === selectedDate.getMonth() &&
                 docDate.getFullYear() === selectedDate.getFullYear();
        }
      );
    }

    if (monthFilter !== 'all') {
      filtered = filtered.filter((doc) => {
        const docMonth = new Date(doc.uploadedAt).getMonth();
        return docMonth === parseInt(monthFilter) - 1;
      });
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter((doc) => {
        const docYear = new Date(doc.uploadedAt).getFullYear();
        return docYear === parseInt(yearFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.uploadedAt);
        const dateB = new Date(b.uploadedAt);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.fileName.localeCompare(b.fileName)
          : b.fileName.localeCompare(a.fileName);
      } else if (sortBy === 'type') {
        return sortOrder === 'asc'
          ? a.fileType.localeCompare(b.fileType)
          : b.fileType.localeCompare(a.fileType);
      } else if (sortBy === 'category') {
        return sortOrder === 'asc'
          ? (a.category || 'other').localeCompare(b.category || 'other')
          : (b.category || 'other').localeCompare(a.category || 'other');
      }
      return 0;
    });

    setFilteredDocuments(filtered);
    updateAppliedFilters();

    // Also update documents by category for filtered results
    const filteredByCategory = {
      prescription: [],
      medical_report: [],
      lab_result: [],
      other: []
    };

    filtered.forEach(doc => {
      const category = doc.category || 'other';
      if (filteredByCategory[category]) {
        filteredByCategory[category].push(doc);
      } else {
        filteredByCategory.other.push(doc);
      }
    });

    setDocumentsByCategory(filteredByCategory);
  };

  const updateAppliedFilters = () => {
    let filters = [];
    if (searchTerm) filters.push({ type: 'search', label: `Search: ${searchTerm}` });
    if (filterType !== 'all') filters.push({ type: 'type', label: `Type: ${filterType === 'image' ? 'Images' : filterType === 'application/pdf' ? 'PDFs' : filterType}` });
    if (categoryFilter !== 'all') {
      const categoryName = categories.find(c => c.id === categoryFilter)?.name;
      filters.push({ type: 'category', label: `Category: ${categoryName}` });
    }
    if (dateFilter) filters.push({ type: 'date', label: `Date: ${dateFilter.toLocaleDateString()}` });
    if (monthFilter !== 'all') {
      const monthName = months.find(m => m.value === monthFilter)?.label;
      filters.push({ type: 'month', label: `Month: ${monthName}` });
    }
    if (yearFilter !== 'all') filters.push({ type: 'year', label: `Year: ${yearFilter}` });

    setAppliedFilters(filters);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterType = (type) => {
    setFilterType(type);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
  };

  const handleDateFilter = (date) => {
    setDateFilter(date);
  };

  const handleMonthFilter = (month) => {
    setMonthFilter(month);
  };

  const handleYearFilter = (year) => {
    setYearFilter(year);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setCategoryFilter('all');
    setDateFilter(null);
    setMonthFilter('all');
    setYearFilter('all');
    setAppliedFilters([]);
  };

  const removeFilter = (filterToRemove) => {
    if (filterToRemove.type === 'search') setSearchTerm('');
    if (filterToRemove.type === 'type') setFilterType('all');
    if (filterToRemove.type === 'category') setCategoryFilter('all');
    if (filterToRemove.type === 'date') setDateFilter(null);
    if (filterToRemove.type === 'month') setMonthFilter('all');
    if (filterToRemove.type === 'year') setYearFilter('all');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleOpenFile = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Downloading document...');
  
      // Fetch the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
  
      // Get the blob data
      const blob = await response.blob();
  
      // Create object URL
      const url = window.URL.createObjectURL(blob);
  
      // Create temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document'; // Fallback filename if none provided
      
      // Append to document, click and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup object URL
      window.URL.revokeObjectURL(url);
  
      // Show success toast
      toast.dismiss(loadingToast);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleShareFile = (doc) => {
    // In a real application, this would open a sharing dialog
    // For now, we'll just copy the URL to clipboard
    navigator.clipboard.writeText(doc.fileUrl)
      .then(() => {
        toast.success('Document link copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  const showDocumentDetail = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentDetails(true);
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

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <FaFilePdf className="text-red-500" />;
    } else if (fileType.startsWith('image/')) {
      return <FaFileImage className="text-blue-500" />;
    } else {
      return <FaFileAlt className="text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div onClick={closeSidebarOnClickOutside} className="min-h-screen bg-gray-50 flex flex-col">
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
      </header>

      <div className="flex flex-grow">
        {/* Sidebar - Desktop (always visible) */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="mb-6">
              <p className="text-xs uppercase text-gray-500 font-medium mb-2">Main Menu</p>
              <nav className="space-y-1">
                <Link to="/user-dashboard" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                  <FaHome className="mr-3" /> Dashboard
                </Link>
                <Link to="/view-documents" className="flex items-center px-4 py-2.5 text-blue-800 bg-blue-50 rounded-md font-medium">
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
              <h3 className="text-sm font-medium text-blue-800 mb-2">Document Security</h3>
              <p className="text-xs text-blue-700 mb-3">
                Your medical documents are encrypted and securely stored. Only you and authorized healthcare providers can access them.
              </p>
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
                      <Link to="/user-dashboard" className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md">
                        <FaHome className="mr-3" /> Dashboard
                      </Link>
                      <Link to="/view-documents" className="flex items-center px-4 py-2.5 text-blue-800 bg-blue-50 rounded-md font-medium">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
                <p className="text-gray-600">
                  View and manage your medical records
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex items-center">
                <Link
                  to="/upload"
                  className="bg-blue-700 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-800"
                >
                  <FaFileUpload className="mr-2" /> Upload New Documents
                </Link>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className="px-3 py-2 border border-gray-300 rounded-md flex items-center hover:bg-gray-50"
                  >
                    <FaFilter className="mr-2 text-gray-500" /> Filters
                    {appliedFilters.length > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {appliedFilters.length}
                      </span>
                    )}
                  </button>

                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <button
                      onClick={() => setViewMode('category')}
                      className={`px-3 py-2 ${viewMode === 'category' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                      title="Category View"
                    >
                      <FaFolder className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                      title="Grid View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                      title="List View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={toggleSortOrder}
                      className="px-3 py-2 border border-gray-300 rounded-md flex items-center hover:bg-gray-50"
                      title={`Sort by ${sortBy} (${sortOrder === 'asc' ? 'ascending' : 'descending'})`}
                    >
                      {sortOrder === 'asc' ? <FaSortAmountUp className="text-gray-500" /> : <FaSortAmountDown className="text-gray-500" />}
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
                      <div className="py-1">
                        <button
                          onClick={() => setSortBy('date')}
                          className={`block px-4 py-2 text-sm ${sortBy === 'date' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} hover:bg-gray-100 w-full text-left`}
                        >
                          Date
                        </button>
                        <button
                          onClick={() => setSortBy('name')}
                          className={`block px-4 py-2 text-sm ${sortBy === 'name' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} hover:bg-gray-100 w-full text-left`}
                        >
                          Name
                        </button>
                        <button
                          onClick={() => setSortBy('type')}
                          className={`block px-4 py-2 text-sm ${sortBy === 'type' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} hover:bg-gray-100 w-full text-left`}
                        >
                          Type
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilterPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                          <select
                            value={filterType}
                            onChange={(e) => handleFilterType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All File Types</option>
                            <option value="application/pdf">PDF Files</option>
                            <option value="image">Image Files</option>
                            <option value="application/msword">Document Files</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Document Category</label>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                              <button
                                key={category.id}
                                onClick={() => handleCategoryFilter(category.id)}
                                className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                                  categoryFilter === category.id
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                <span className="mr-1.5">{category.icon}</span>
                                {category.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                          <select
                            value={monthFilter}
                            onChange={(e) => handleMonthFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Months</option>
                            {months.map(month => (
                              <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <select
                            value={yearFilter}
                            onChange={(e) => handleYearFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Years</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Applied Filters */}
              {appliedFilters.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 flex flex-wrap gap-2">
                  {appliedFilters.map((filter, index) => (
                    <div
                      key={index}
                      className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        filter.type === 'search' ? 'bg-orange-100 text-orange-800' :
                        filter.type === 'type' ? 'bg-green-100 text-green-800' :
                        filter.type === 'date' ? 'bg-blue-100 text-blue-800' :
                        filter.type === 'month' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {filter.label}
                      <button
                        onClick={() => removeFilter(filter)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mb-6">
                <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error Loading Documents</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => dispatch(getUserDetails(token, navigate))}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* No Documents State */}
            {!loading && !error && filteredDocuments.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FaFolder className="text-blue-500 text-2xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {appliedFilters.length > 0
                    ? "No documents match your current filters. Try adjusting your search criteria."
                    : "You haven't uploaded any documents yet. Start by uploading your medical records."}
                </p>
                {appliedFilters.length > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link
                    to="/upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Upload Documents
                  </Link>
                )}
              </div>
            )}

            {/* Documents Display - Category View */}
            {!loading && !error && filteredDocuments.length > 0 && viewMode === 'category' && (
              <div className="space-y-8">
                {Object.entries(documentsByCategory).map(([category, docs]) =>
                  docs.length > 0 ? (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              {categories.find(c => c.id === category)?.icon || <FaFolder />}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {categories.find(c => c.id === category)?.name || 'Other Documents'}
                            </h3>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {docs.length} {docs.length === 1 ? 'document' : 'documents'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {docs.map((doc) => (
                          <motion.div
                            key={doc._id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            whileHover={{ y: -3 }}
                          >
                            <div className="p-3 border-b border-gray-100">
                              <div className="flex items-start">
                                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                  {getFileIcon(doc.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                                    {doc.fileName}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-2 bg-gray-50 flex justify-between">
                              <button
                                onClick={() => handleOpenFile(doc.fileUrl)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleDownloadFile(doc.fileUrl, doc.fileName)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              <button
                                onClick={() => showDocumentDetail(doc)}
                                className="text-gray-600 hover:text-gray-800 p-1"
                                title="Details"
                              >
                                <FaInfoCircle />
                              </button>
                              <button
                                onClick={() => handleShareFile(doc)}
                                className="text-purple-600 hover:text-purple-800 p-1"
                                title="Share"
                              >
                                <FaShareAlt />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : null
                )}
              </div>
            )}

            {/* Documents Display - Grid View */}
            {!loading && !error && filteredDocuments.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(doc.uploadedAt)}
                          </p>
                          {doc.category && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {categories.find(c => c.id === doc.category)?.name || 'Other'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 flex justify-between">
                      <button
                        onClick={() => handleOpenFile(doc.fileUrl)}
                        className="text-blue-600 hover:text-blue-800 p-1.5"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(doc.fileUrl, doc.fileName)}
                        className="text-green-600 hover:text-green-800 p-1.5"
                        title="Download"
                      >
                        <FaDownload />
                      </button>
                      <button
                        onClick={() => showDocumentDetail(doc)}
                        className="text-gray-600 hover:text-gray-800 p-1.5"
                        title="Details"
                      >
                        <FaInfoCircle />
                      </button>
                      <button
                        onClick={() => handleShareFile(doc)}
                        className="text-purple-600 hover:text-purple-800 p-1.5"
                        title="Share"
                      >
                        <FaShareAlt />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Documents Display - List View */}
            {!loading && !error && filteredDocuments.length > 0 && viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDocuments.map((doc) => (
                      <motion.tr
                        key={doc.id}
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-50 rounded-lg">
                              {getFileIcon(doc.fileType)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={doc.fileName}>
                                {doc.fileName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {doc.fileType.split('/')[1]?.toUpperCase() || doc.fileType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {categories.find(c => c.id === (doc.category || 'other'))?.name || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(doc.uploadedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleOpenFile(doc.fileUrl)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(doc.fileUrl, doc.fileName)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Download"
                            >
                              <FaDownload />
                            </button>
                            <button
                              onClick={() => showDocumentDetail(doc)}
                              className="text-gray-600 hover:text-gray-800 p-1"
                              title="Details"
                            >
                              <FaInfoCircle />
                            </button>
                            <button
                              onClick={() => handleShareFile(doc)}
                              className="text-purple-600 hover:text-purple-800 p-1"
                              title="Share"
                            >
                              <FaShareAlt />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document Details Modal */}
            <AnimatePresence>
              {showDocumentDetails && selectedDocument && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDocumentDetails(false)}
                >
                  <motion.div
                    className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
                        <button
                          onClick={() => setShowDocumentDetails(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">File Name</p>
                          <p className="text-sm font-medium text-gray-900">{selectedDocument.fileName}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">File Type</p>
                          <p className="text-sm font-medium text-gray-900">{selectedDocument.fileType}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="text-sm font-medium text-gray-900">
                            {categories.find(c => c.id === (selectedDocument.category || 'other'))?.name || 'Other Documents'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Upload Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(selectedDocument.uploadedAt)}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">File Size</p>
                          <p className="text-sm font-medium text-gray-900">{selectedDocument.fileSize || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                      <button
                        onClick={() => handleOpenFile(selectedDocument.fileUrl)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        View Document
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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

export default UserDocuments;
