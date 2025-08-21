import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUser } from '../slices/profileSlice';
import { 
  FaUser, 
  FaMapMarkerAlt, 
  FaUserFriends, 
  FaNotesMedical, 
  FaSpinner, 
  FaCheck, 
  FaInfoCircle 
} from 'react-icons/fa';

const ProfileModal = ({ isOpen, onClose, token, userData }) => {
  const [profileFormStep, setProfileFormStep] = useState(1);
  const [profileFormErrors, setProfileFormErrors] = useState({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
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

  // Initialize form with existing user data if available
  useEffect(() => {
    if (userData && userData.additionalDetails) {
      const profile = userData.additionalDetails;

      // Create a new form data object with existing profile data
      const initialFormData = {
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
      };

      // Update form data state
      setProfileFormData(initialFormData);
    }
  }, [userData]);

  // If profile is complete and this is not an explicit update, close the modal
  useEffect(() => {
    if (userData?.additionalDetails?.isProfileComplete && !isOpen) {
      onClose();
    }
  }, [userData, isOpen, onClose]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

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
        'http://localhost:5000/api/v1/auth/update-medical-profile',
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

        // Check if card was generated or already exists
        if (response.data.cardDetails) {
          // If this is a new card, show a success message
          if (!userData.arogyaNetraCard || !userData.arogyaNetraCard.cardId) {
            toast.success('Your Arogya Netra Card has been generated!');
          }

          // Refresh user data to get the updated profile and card
          try {
            const userResponse = await axios.get(
              'http://localhost:5000/api/v1/auth/getUserDetails',
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                }
              }
            );

            if (userResponse.data.success) {
              // Update Redux store with latest user data including card
              dispatch(setUser(userResponse.data.data));
              localStorage.setItem("user", JSON.stringify(userResponse.data.data));
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        }

        // Close the modal and navigate to dashboard
        onClose();
        navigate('/user-dashboard');
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

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed overflow-y-scroll inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
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
          <h2 className="text-2xl font-bold">
            {userData?.additionalDetails?.isProfileComplete ? 'Update Your Medical Profile' : 'Complete Your Medical Profile'}
          </h2>
          <p className="mt-2 text-blue-100">
            {userData?.additionalDetails?.isProfileComplete
              ? 'Please update your medical information as needed. Keeping your profile current ensures healthcare providers can better serve you.'
              : 'Please provide your medical information to access the dashboard. This information will help healthcare providers better serve you.'}
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
                    placeholder="Height in centimeters"
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
                    placeholder="Weight in kilograms"
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
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={profileFormData.address.pincode}
                    onChange={handleProfileInputChange}
                    placeholder="PIN code"
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
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Emergency Contact and Medical Information */}
          {profileFormStep === 3 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUserFriends className="mr-2 text-blue-600" /> Emergency Contact
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={profileFormData.emergencyContact.name}
                  onChange={handleProfileInputChange}
                  placeholder="Full name"
                  className={`w-full p-2 border rounded-md ${
                    profileFormErrors['emergencyContact.name'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {profileFormErrors['emergencyContact.name'] && (
                  <p className="mt-1 text-sm text-red-500">{profileFormErrors['emergencyContact.name']}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={profileFormData.emergencyContact.relationship}
                    onChange={handleProfileInputChange}
                    placeholder="E.g. Spouse, Parent, Child"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={profileFormData.emergencyContact.phone}
                    onChange={handleProfileInputChange}
                    placeholder="10-digit mobile number"
                    className={`w-full p-2 border rounded-md ${
                      profileFormErrors['emergencyContact.phone'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {profileFormErrors['emergencyContact.phone'] && (
                    <p className="mt-1 text-sm text-red-500">{profileFormErrors['emergencyContact.phone']}</p>
                  )}
                </div>
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
                    {userData?.additionalDetails?.isProfileComplete ? 'Update Profile' : 'Complete Profile'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center">
            <FaInfoCircle className="text-blue-500 mr-2" />
            Your information is protected and will only be shared with authorized healthcare providers.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileModal;