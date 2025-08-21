import React from 'react';
import { FaUserInjured, FaFileAlt, FaClipboardCheck } from 'react-icons/fa';

const StatsCard = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <FaUserInjured className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Patients Scanned</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.patientsScanned}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <FaFileAlt className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Documents Accessed</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.documentsAccessed}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full mr-4">
            <FaClipboardCheck className="text-yellow-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Approvals</p>
            <h3 className="text-xl font-bold text-gray-800">{stats.pendingApprovals}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;