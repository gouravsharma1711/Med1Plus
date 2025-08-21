import React from 'react';
import { FaUserInjured, FaCalendarAlt, FaStethoscope } from 'react-icons/fa';

const RecentPatients = ({ recentPatients }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {recentPatients.map((patient) => (
          <div key={patient.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <img
                src={patient.image}
                alt={patient.name}
                className="w-12 h-12 rounded-full mr-4 object-cover border border-gray-200"
              />
              <div className="flex-1">
                <h3 className="text-md font-medium text-gray-800">{patient.name}</h3>
                <div className="flex flex-wrap text-xs text-gray-500 mt-1">
                  <span className="flex items-center mr-3">
                    <FaUserInjured className="mr-1" /> {patient.age} years
                  </span>
                  <span className="flex items-center mr-3">
                    <FaCalendarAlt className="mr-1" /> {patient.lastVisit}
                  </span>
                  <span className="flex items-center">
                    <FaStethoscope className="mr-1" /> {patient.condition}
                  </span>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentPatients;