import React from 'react';
import {
  FaFilePdf,
  FaFileImage,
  FaEye,
  FaIdCard,
  FaInfoCircle,
  FaUserMd,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaIdBadge,
  FaFileAlt,
  FaHistory,
  FaHeartbeat,
  FaPrescriptionBottleAlt,
  FaAllergies,
  FaWeight,
  FaRulerVertical
} from 'react-icons/fa';

const PatientDetails = ({ userDetails, calculateAge, onViewMedicalHistory }) => {
  console.log(userDetails)
  if (!userDetails) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
        <FaIdCard className="text-gray-400 text-5xl mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Patient Selected</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Use one of the identification methods on the left to retrieve patient data
        </p>
        <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 max-w-md">
          <FaInfoCircle className="inline mr-1" />
          Patient data is protected under the Digital Information Security in Healthcare Act
        </div>
      </div>
    );
  }

  // Mock data for demonstration purposes
  const medicalInfo = {
    bloodGroup: userDetails.additionalDetails?.bloodGroup || 'O+',
    height: userDetails.additionalDetails?.height || '172 cm',
    weight: userDetails.additionalDetails?.weight || '68 kg',
    allergies: userDetails.additionalDetails?.allergies || ['Penicillin', 'Pollen'],
    chronicConditions: userDetails.medicalConditions || ['Hypertension'],
    medications: userDetails.additionalDetails.medications || [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
      { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily' }
    ],
    recentVisits: userDetails.recentVisits || [
      { date: '15 May 2023', reason: 'Regular checkup', doctor: 'Dr. Sharma' },
      { date: '3 Feb 2023', reason: 'Fever and cold', doctor: 'Dr. Patel' }
    ]
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Patient Header */}
      <div className="flex items-center mb-6">
        <div className="relative">
          <img
            src={userDetails.image}
            alt="User"
            className="w-20 h-20 rounded-full border-2 border-blue-100 mr-4 object-cover"
          />
          <div className="absolute bottom-0 right-3 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{userDetails.firstName} {userDetails.lastName}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <FaIdBadge className="mr-1" /> {userDetails.arogyaNetraCard?.cardId || 'AN-123456-7890'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FaUserMd className="mr-1" /> Active Patient
            </span>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-start">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <FaEnvelope className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium">{userDetails.email || 'patient@example.com'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <FaPhone className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium">{userDetails.mobile_no || '+91 98765 43210'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <FaIdCard className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Aadhar Number</p>
            <p className="text-sm font-medium">
              {userDetails.aadharNumber ?
                `XXXX XXXX ${userDetails.aadharNumber.slice(-4)}` :
                'XXXX XXXX 1234'}
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <FaCalendarAlt className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Date of Birth</p>
            <p className="text-sm font-medium">
              {userDetails.additionalDetails?.dateOfBirth || userDetails.dateOfBirth || '15 Aug 1985'}
              {(userDetails.additionalDetails?.dateOfBirth || userDetails.dateOfBirth) &&
                ` (${calculateAge(userDetails.additionalDetails?.dateOfBirth || userDetails.dateOfBirth)} years)`}
            </p>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="mb-6">
        <h4 className="text-md font-semibold mb-3 flex items-center text-gray-700">
          <FaHeartbeat className="mr-2 text-red-500" /> Medical Information
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Blood Group:</span>
              <span className="text-sm font-medium ml-1">{medicalInfo.bloodGroup}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Height:</span>
              <span className="text-sm font-medium ml-1">{medicalInfo.height}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Weight:</span>
              <span className="text-sm font-medium ml-1">{medicalInfo.weight}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Allergies:</span>
              <span className="text-sm font-medium ml-1">{medicalInfo.allergies.join(', ')}</span>
            </div>
          </div>

          <div className="mb-3">
            <h5 className="text-sm font-medium mb-2 flex items-center">
              <FaPrescriptionBottleAlt className="mr-1 text-blue-500" /> Current Medications
            </h5>
            <div className="space-y-1">
              {medicalInfo.medications.map((med, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border border-gray-100">
                  <span className="font-medium">{med}</span>
                </div>
              ))}
            </div>
          </div>

          {/* <div>
            <h5 className="text-sm font-medium mb-2 flex items-center">
              <FaHistory className="mr-1 text-blue-500" /> Recent Visits
            </h5>
            <div className="space-y-1">
              {medicalInfo.recentVisits.map((visit, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border border-gray-100 flex justify-between">
                  <span>{visit.date} - {visit.reason}</span>
                  <span className="text-blue-600">{visit.doctor}</span>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>

      {/* Documents */}
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-3 flex items-center text-gray-700">
          <FaFileAlt className="mr-2 text-blue-500" /> Medical Documents
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {userDetails.documents && userDetails.documents.length > 0 ? (
            userDetails.documents.map((doc, index) => (
              <div className="bg-gray-50 p-2 rounded-md flex items-center justify-between" key={index}>
                <div className="flex items-center">
                  {doc.fileType === 'pdf' ? (
                    <FaFilePdf className="text-red-500 mr-2" />
                  ) : (
                    <FaFileImage className="text-blue-500 mr-2" />
                  )}
                  <span className="text-sm truncate max-w-xs">{doc.fileName}</span>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEye />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FaFilePdf className="text-red-500 mr-2" />
                  <span className="text-sm">Blood Test Results.pdf</span>
                </div>
                <FaEye className="text-blue-600" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FaFileImage className="text-blue-500 mr-2" />
                  <span className="text-sm">Chest X-Ray.jpg</span>
                </div>
                <FaEye className="text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaFilePdf className="text-red-500 mr-2" />
                  <span className="text-sm">Prescription - 12 May 2023.pdf</span>
                </div>
                <FaEye className="text-blue-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <div className="mt-6 flex justify-end">
        <button
          onClick={onViewMedicalHistory}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          View Complete Medical History
        </button>
      </div> */}
    </div>
  );
};

export default PatientDetails;