import React, { useState } from 'react';
import { FaSearch, FaSpinner, FaEye } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const SearchPatient = ({ setUserDetails, calculateAge }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      // Check if the search query looks like an Arogya Netra Card ID (AN-xxxxxx-xxxx format)
      const isCardIdSearch = /^AN-\d{6}-\d{4}$/.test(searchQuery);

      if (isCardIdSearch) {
        // Search by Arogya Netra Card ID
        const token = JSON.parse(localStorage.getItem("token"));
        const response = await axios.get(
          `http://localhost:5000/api/v1/auth/getUserByCardId/${searchQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          const patient = response.data.user;

          // Format the patient data for display
          const formattedPatient = {
            id: patient._id,
            name: `${patient.firstName} ${patient.lastName}`,
            aadharNumber: `XXXX XXXX ${patient.aadharNumber.slice(-4)}`,
            cardId: patient.arogyaNetraCard.cardId,
            age: calculateAge(patient.additionalDetails?.dateOfBirth) || 'N/A',
            email: patient.email,
            mobile: patient.mobile_no,
            image: patient.image,
            fullData: patient // Store the full data for later use
          };

          setSearchResults([formattedPatient]);
          toast.success('Patient found by Arogya Netra Card ID');
          setUserDetails(patient);
        } else {
          setSearchResults([]);
          toast.error('No patient found with this Arogya Netra Card ID');
        }
      } else {
        // For demo purposes, use mock data for other searches
        // In a real app, this would be an API call to search by name, etc.
        setTimeout(() => {
          const results = [
            {
              id: 101,
              name: 'Vikram Singh',
              aadharNumber: 'XXXX-XXXX-7890',
              cardId: 'AN-123456-7890',
              age: 45,
              email: 'vikram.singh@example.com',
              mobile: '9876543210',
              firstName: 'Vikram',
              lastName: 'Singh',
              image: 'https://randomuser.me/api/portraits/men/45.jpg'
            },
            {
              id: 102,
              name: 'Neha Gupta',
              aadharNumber: 'XXXX-XXXX-5678',
              cardId: 'AN-234567-5678',
              age: 32,
              email: 'neha.gupta@example.com',
              mobile: '8765432109',
              firstName: 'Neha',
              lastName: 'Gupta',
              image: 'https://randomuser.me/api/portraits/women/32.jpg'
            },
            {
              id: 103,
              name: 'Rajesh Kumar',
              aadharNumber: 'XXXX-XXXX-1234',
              cardId: 'AN-345678-1234',
              age: 58,
              email: 'rajesh.kumar@example.com',
              mobile: '7654321098',
              firstName: 'Rajesh',
              lastName: 'Kumar',
              image: 'https://randomuser.me/api/portraits/men/58.jpg'
            }
          ].filter(patient =>
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.aadharNumber.includes(searchQuery) ||
            patient.cardId.includes(searchQuery)
          );

          setSearchResults(results);
          toast.success(`Found ${results.length} patients matching your search`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Error searching for patients: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    // Create a user-like object from the search result
    const userObject = {
      _id: patient.id,
      firstName: patient.firstName || patient.name.split(' ')[0],
      lastName: patient.lastName || patient.name.split(' ')[1] || '',
      email: patient.email,
      mobile_no: patient.mobile,
      aadharNumber: patient.aadharNumber,
      image: patient.image,
      arogyaNetraCard: {
        cardId: patient.cardId
      },
      additionalDetails: {
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - patient.age))
      }
    };

    setUserDetails(patient.fullData || userObject);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Arogya Netra Card ID (AN-xxxxxx-xxxx)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-r-md font-medium hover:bg-blue-700"
            disabled={isSearching}
          >
            {isSearching ? (
              <FaSpinner className="animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {searchResults.length > 0 ? (
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {searchResults.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={patient.image || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                          alt=""
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {patient.cardId}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleSelectPatient(patient)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <FaEye className="mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : searchQuery && !isSearching ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
          <FaSearch className="mx-auto text-gray-400 text-xl mb-2" />
          <p className="text-gray-500 text-sm">No results found</p>
        </div>
      ) : null}
    </div>
  );
};

export default SearchPatient;