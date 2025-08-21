import React, { useState } from 'react';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaFilePdf, 
  FaFileImage, 
  FaDownload, 
  FaEye, 
  FaPrint, 
  FaHeartbeat, 
  FaFileMedical, 
  FaHistory, 
  FaUserMd, 
  FaHospital, 
  FaAllergies, 
  FaPrescriptionBottleAlt, 
  FaWeight, 
  FaRulerVertical, 
  FaVial, 
  FaLungs, 
  FaChartLine, 
  FaFilter, 
  FaSearch,
  FaExclamationTriangle
} from 'react-icons/fa';

const MedicalHistory = ({ userDetails, calculateAge, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  const patientInfo = {
    name: `${userDetails?.firstName || 'John'} ${userDetails?.lastName || 'Doe'}`,
    id: userDetails?._id || 'AN-123456-7890',
    dob: userDetails?.additionalDetails?.dateOfBirth || '15-08-1985',
    age: calculateAge(userDetails?.additionalDetails?.dateOfBirth) || 38,
    gender: userDetails?.additionalDetails?.gender || 'Male',
    bloodGroup: userDetails?.additionalDetails?.bloodGroup || 'O+',
    height: userDetails?.additionalDetails?.height || '172 cm',
    weight: userDetails?.additionalDetails?.weight || '68 kg',
    bmi: userDetails?.bmi || '23.0',
    allergies: userDetails?.additionalDetails?.allergies || ['Penicillin', 'Pollen', 'Shellfish'],
    chronicConditions: userDetails?.additionalDetails?.medicalConditions || ['Hypertension', 'Type 2 Diabetes'],
    emergencyContact: userDetails?.additionalDetails?.emergencyContact || {
      name: 'Priya Sharma',
      relation: 'Spouse',
      phone: '+91 98765 43210'
    },
    image: userDetails?.image || 'https://randomuser.me/api/portraits/men/32.jpg'
  };

  // Mock medical timeline data
  const medicalTimeline = [
    {
      id: 1,
      date: '12 Jun 2023',
      type: 'consultation',
      title: 'Regular Checkup',
      doctor: 'Dr. Rajesh Sharma',
      specialty: 'General Physician',
      hospital: 'City General Hospital',
      notes: 'Patient reported mild headaches and fatigue. Blood pressure slightly elevated at 140/90 mmHg. Recommended lifestyle changes and follow-up in 2 weeks.',
      vitals: {
        bp: '140/90 mmHg',
        pulse: '78 bpm',
        temp: '98.6°F',
        spo2: '98%'
      },
      prescriptions: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
        { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed for headache', duration: 'PRN' }
      ],
      documents: [
        { name: 'Prescription - 12 Jun 2023.pdf', type: 'pdf' },
        { name: 'Blood Pressure Chart.jpg', type: 'image' }
      ],
      followUp: '26 Jun 2023'
    },
    {
      id: 2,
      date: '15 May 2023',
      type: 'lab',
      title: 'Blood Test',
      doctor: 'Dr. Meera Patel',
      specialty: 'Pathologist',
      hospital: 'MediLab Diagnostics',
      notes: 'Complete blood count and lipid profile. Cholesterol levels slightly elevated.',
      results: [
        { name: 'Total Cholesterol', value: '210 mg/dL', normal: '< 200 mg/dL', status: 'high' },
        { name: 'HDL', value: '45 mg/dL', normal: '> 40 mg/dL', status: 'normal' },
        { name: 'LDL', value: '130 mg/dL', normal: '< 100 mg/dL', status: 'high' },
        { name: 'Triglycerides', value: '150 mg/dL', normal: '< 150 mg/dL', status: 'normal' },
        { name: 'Hemoglobin', value: '14.5 g/dL', normal: '13.5-17.5 g/dL', status: 'normal' }
      ],
      documents: [
        { name: 'Blood Test Results - 15 May 2023.pdf', type: 'pdf' }
      ]
    },
    {
      id: 3,
      date: '03 Feb 2023',
      type: 'consultation',
      title: 'Fever and Cold',
      doctor: 'Dr. Vikram Singh',
      specialty: 'General Physician',
      hospital: 'Community Health Center',
      notes: 'Patient presented with fever (101°F), runny nose, and sore throat for 3 days. Diagnosed with viral upper respiratory infection.',
      vitals: {
        bp: '120/80 mmHg',
        pulse: '88 bpm',
        temp: '101°F',
        spo2: '97%'
      },
      prescriptions: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: '5 days' },
        { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '5 days' },
        { name: 'Throat Lozenges', dosage: '1 lozenge', frequency: 'Every 3-4 hours', duration: 'As needed' }
      ],
      documents: [
        { name: 'Prescription - 03 Feb 2023.pdf', type: 'pdf' }
      ],
      followUp: 'As needed'
    },
    {
      id: 4,
      date: '10 Dec 2022',
      type: 'imaging',
      title: 'Chest X-Ray',
      doctor: 'Dr. Ananya Gupta',
      specialty: 'Radiologist',
      hospital: 'City General Hospital',
      notes: 'Routine chest X-ray as part of annual health checkup. No significant findings.',
      results: 'Normal chest X-ray. Heart size normal. Lung fields clear. No evidence of active disease.',
      documents: [
        { name: 'Chest X-Ray Report - 10 Dec 2022.pdf', type: 'pdf' },
        { name: 'Chest X-Ray Image.jpg', type: 'image' }
      ]
    },
    {
      id: 5,
      date: '05 Nov 2022',
      type: 'consultation',
      title: 'Annual Health Checkup',
      doctor: 'Dr. Rajesh Sharma',
      specialty: 'General Physician',
      hospital: 'City General Hospital',
      notes: 'Comprehensive annual health assessment. Patient in good health overall. Advised regular exercise and dietary modifications to address slightly elevated cholesterol.',
      vitals: {
        bp: '130/85 mmHg',
        pulse: '72 bpm',
        temp: '98.4°F',
        spo2: '99%'
      },
      prescriptions: [],
      documents: [
        { name: 'Annual Health Report - 05 Nov 2022.pdf', type: 'pdf' }
      ],
      followUp: 'One year'
    }
  ];

  // Filter timeline based on selected filter and search query
  const filteredTimeline = medicalTimeline
    .filter(item => {
      if (timelineFilter === 'all') return true;
      return item.type === timelineFilter;
    })
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.doctor.toLowerCase().includes(query) ||
        item.hospital.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    });

  // Mock data for medical metrics
  const medicalMetrics = {
    bloodPressure: [
      { date: '12 Jun 2023', value: '140/90' },
      { date: '05 Nov 2022', value: '130/85' },
      { date: '03 Feb 2023', value: '120/80' },
      { date: '10 Aug 2022', value: '135/88' },
      { date: '15 May 2022', value: '125/82' }
    ],
    bloodSugar: [
      { date: '12 Jun 2023', value: '110 mg/dL' },
      { date: '05 Nov 2022', value: '105 mg/dL' },
      { date: '10 Aug 2022', value: '115 mg/dL' },
      { date: '15 May 2022', value: '108 mg/dL' }
    ],
    weight: [
      { date: '12 Jun 2023', value: '68 kg' },
      { date: '05 Nov 2022', value: '70 kg' },
      { date: '10 Aug 2022', value: '71 kg' },
      { date: '15 May 2022', value: '72 kg' }
    ]
  };

  // Mock data for medications
  const medications = [
    {
      name: 'Amlodipine',
      dosage: '5mg',
      frequency: 'Once daily',
      startDate: '12 Jun 2023',
      endDate: '12 Jul 2023',
      purpose: 'Blood pressure control',
      prescribedBy: 'Dr. Rajesh Sharma',
      status: 'active'
    },
    {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: '05 Nov 2022',
      endDate: 'Ongoing',
      purpose: 'Diabetes management',
      prescribedBy: 'Dr. Rajesh Sharma',
      status: 'active'
    },
    {
      name: 'Atorvastatin',
      dosage: '10mg',
      frequency: 'Once daily at night',
      startDate: '05 Nov 2022',
      endDate: 'Ongoing',
      purpose: 'Cholesterol management',
      prescribedBy: 'Dr. Rajesh Sharma',
      status: 'active'
    },
    {
      name: 'Cetirizine',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: '03 Feb 2023',
      endDate: '08 Feb 2023',
      purpose: 'Allergy relief',
      prescribedBy: 'Dr. Vikram Singh',
      status: 'completed'
    }
  ];

  // Mock data for allergies and immunizations
  const allergiesAndImmunizations = {
    allergies: [
      { allergen: 'Penicillin', severity: 'Severe', reaction: 'Rash, difficulty breathing', noted: '10 Jun 2020' },
      { allergen: 'Pollen', severity: 'Moderate', reaction: 'Sneezing, watery eyes', noted: '15 Mar 2019' },
      { allergen: 'Shellfish', severity: 'Severe', reaction: 'Hives, swelling', noted: '22 Sep 2018' }
    ],
    immunizations: [
      { vaccine: 'COVID-19 (Covishield)', date: '15 Apr 2021', dose: '1st dose' },
      { vaccine: 'COVID-19 (Covishield)', date: '10 Jul 2021', dose: '2nd dose' },
      { vaccine: 'COVID-19 (Covishield)', date: '20 Jan 2022', dose: 'Booster' },
      { vaccine: 'Influenza', date: '05 Nov 2022', dose: 'Annual' },
      { vaccine: 'Tetanus', date: '12 Aug 2019', dose: 'Booster' }
    ]
  };

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <FaHeartbeat className="mr-2" /> Vital Statistics
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Blood Pressure:</span>
                    <span className="text-xs font-medium">{medicalMetrics.bloodPressure[0].value} mmHg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Blood Sugar (Fasting):</span>
                    <span className="text-xs font-medium">{medicalMetrics.bloodSugar[0].value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Height:</span>
                    <span className="text-xs font-medium">{patientInfo.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Weight:</span>
                    <span className="text-xs font-medium">{patientInfo.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">BMI:</span>
                    <span className="text-xs font-medium">{patientInfo.bmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Blood Group:</span>
                    <span className="text-xs font-medium">{patientInfo.bloodGroup}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                  <FaPrescriptionBottleAlt className="mr-2" /> Current Medications
                </h3>
                <div className="space-y-2">
                  {medications
                    .filter(med => med.status === 'active')
                    .slice(0, 3)
                    .map((med, index) => (
                      <div key={index} className="bg-white p-2 rounded text-xs">
                        <div className="font-medium text-green-700">{med.name} {med.dosage}</div>
                        <div className="text-gray-600">{med.frequency}</div>
                      </div>
                    ))}
                  {medications.filter(med => med.status === 'active').length > 3 && (
                    <div className="text-xs text-green-700 font-medium text-center mt-2">
                      + {medications.filter(med => med.status === 'active').length - 3} more medications
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                  <FaAllergies className="mr-2" /> Allergies & Warnings
                </h3>
                <div className="space-y-2">
                  {allergiesAndImmunizations.allergies.map((allergy, index) => (
                    <div key={index} className="bg-white p-2 rounded text-xs">
                      <div className="font-medium text-red-700">{allergy.allergen}</div>
                      <div className="text-gray-600">Severity: {allergy.severity}</div>
                    </div>
                  ))}
                  {patientInfo.chronicConditions.length > 0 && (
                    <div className="bg-yellow-50 p-2 rounded text-xs mt-2">
                      <div className="font-medium text-yellow-700 flex items-center">
                        <FaExclamationTriangle className="mr-1" /> Chronic Conditions
                      </div>
                      <div className="text-gray-600">{patientInfo.chronicConditions.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3 text-gray-800 flex items-center">
                <FaHistory className="mr-2 text-blue-600" /> Recent Medical Events
              </h3>
              <div className="space-y-4">
                {medicalTimeline.slice(0, 3).map((event) => (
                  <div key={event.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full mr-3 ${
                        event.type === 'consultation' ? 'bg-blue-100 text-blue-600' :
                        event.type === 'lab' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {event.type === 'consultation' ? <FaUserMd /> :
                         event.type === 'lab' ? <FaVial /> :
                         <FaLungs />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-800">{event.title}</h4>
                          <span className="text-xs text-gray-500 flex items-center">
                            <FaCalendarAlt className="mr-1" /> {event.date}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.doctor} • {event.hospital}</p>
                        <p className="text-xs text-gray-500 mt-2">{event.notes}</p>
                        
                        {event.documents && event.documents.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {event.documents.map((doc, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                {doc.type === 'pdf' ? <FaFilePdf className="mr-1 text-red-500" /> : <FaFileImage className="mr-1 text-blue-500" />}
                                {doc.name.length > 20 ? doc.name.substring(0, 20) + '...' : doc.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800"
                >
                  View Full Medical Timeline
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-semibold mb-3 text-gray-800 flex items-center">
                  <FaChartLine className="mr-2 text-blue-600" /> Health Trends
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Blood Pressure (mmHg)</h4>
                    <div className="h-24 bg-gray-50 rounded-lg p-2 flex items-end">
                      {medicalMetrics.bloodPressure.slice(0, 5).reverse().map((reading, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex justify-center">
                            <div 
                              className="w-4/5 bg-blue-500 rounded-t" 
                              style={{ 
                                height: `${parseInt(reading.value.split('/')[0]) / 2}px`,
                                maxHeight: '80px'
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{reading.date.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Weight (kg)</h4>
                    <div className="h-24 bg-gray-50 rounded-lg p-2 flex items-end">
                      {medicalMetrics.weight.slice(0, 5).reverse().map((reading, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex justify-center">
                            <div 
                              className="w-4/5 bg-green-500 rounded-t" 
                              style={{ 
                                height: `${parseInt(reading.value) - 50}px`,
                                maxHeight: '80px'
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{reading.date.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-3 text-gray-800 flex items-center">
                  <FaFileMedical className="mr-2 text-blue-600" /> Important Documents
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FaFilePdf className="text-red-500 mr-2" />
                        <span className="text-sm">Complete Health Report.pdf</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                        <button className="text-green-600 hover:text-green-800"><FaDownload /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FaFilePdf className="text-red-500 mr-2" />
                        <span className="text-sm">Diabetes Management Plan.pdf</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                        <button className="text-green-600 hover:text-green-800"><FaDownload /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FaFileImage className="text-blue-500 mr-2" />
                        <span className="text-sm">Latest ECG Report.jpg</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                        <button className="text-green-600 hover:text-green-800"><FaDownload /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FaFilePdf className="text-red-500 mr-2" />
                        <span className="text-sm">Immunization Record.pdf</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                        <button className="text-green-600 hover:text-green-800"><FaDownload /></button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                      View All Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <select 
                  className="border border-gray-300 rounded-md text-sm p-2"
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="consultation">Consultations</option>
                  <option value="lab">Lab Tests</option>
                  <option value="imaging">Imaging</option>
                </select>
                <button className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <FaFilter />
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medical records..."
                  className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-6">
              {filteredTimeline.length > 0 ? (
                filteredTimeline.map((event) => (
                  <div key={event.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className={`p-3 rounded-full ${
                          event.type === 'consultation' ? 'bg-blue-100 text-blue-600' :
                          event.type === 'lab' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {event.type === 'consultation' ? <FaUserMd size={20} /> :
                           event.type === 'lab' ? <FaVial size={20} /> :
                           <FaLungs size={20} />}
                        </div>
                        <div className="w-px h-full bg-gray-200 my-2"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800 text-lg">{event.title}</h4>
                            <p className="text-sm text-gray-600">{event.doctor} • {event.hospital}</p>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-2 md:mt-0">
                            <FaCalendarAlt className="mr-1" /> {event.date}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Notes</h5>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{event.notes}</p>
                        </div>
                        
                        {event.vitals && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Vital Signs</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-500">Blood Pressure</div>
                                <div className="text-sm font-medium">{event.vitals.bp}</div>
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-500">Pulse</div>
                                <div className="text-sm font-medium">{event.vitals.pulse}</div>
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-500">Temperature</div>
                                <div className="text-sm font-medium">{event.vitals.temp}</div>
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-500">SpO2</div>
                                <div className="text-sm font-medium">{event.vitals.spo2}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {event.results && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Results</h5>
                            {Array.isArray(event.results) ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Range</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {event.results.map((result, idx) => (
                                      <tr key={idx}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{result.name}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{result.value}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{result.normal}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                            result.status === 'high' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {result.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{event.results}</p>
                            )}
                          </div>
                        )}
                        
                        {event.prescriptions && event.prescriptions.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Prescriptions</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {event.prescriptions.map((prescription, idx) => (
                                <div key={idx} className="bg-green-50 p-3 rounded">
                                  <div className="font-medium text-green-800">{prescription.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {prescription.dosage} • {prescription.frequency}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Duration: {prescription.duration}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {event.documents && event.documents.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Documents</h5>
                            <div className="flex flex-wrap gap-2">
                              {event.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                                  {doc.type === 'pdf' ? (
                                    <FaFilePdf className="text-red-500 mr-2" />
                                  ) : (
                                    <FaFileImage className="text-blue-500 mr-2" />
                                  )}
                                  <span className="text-sm text-gray-700">{doc.name}</span>
                                  <div className="ml-2 flex space-x-1">
                                    <button className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                                    <button className="text-green-600 hover:text-green-800"><FaDownload /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {event.followUp && (
                          <div className="mt-4 bg-yellow-50 p-3 rounded-lg flex items-center">
                            <FaCalendarAlt className="text-yellow-600 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-yellow-800">Follow-up</div>
                              <div className="text-xs text-gray-600">{event.followUp}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <FaSearch className="mx-auto text-gray-400 text-3xl mb-3" />
                  <h3 className="text-lg font-medium text-gray-700">No medical records found</h3>
                  <p className="text-gray-500 mt-1">Try changing your search criteria</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'medications':
        return (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Current Medications</h3>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md flex items-center">
                  <FaPrint className="mr-1" /> Print Medication List
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescribed By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medications
                      .filter(med => med.status === 'active')
                      .map((medication, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{medication.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.dosage}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.frequency}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.purpose}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.prescribedBy}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.startDate}</div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Medication History</h3>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medications
                      .filter(med => med.status === 'completed')
                      .map((medication, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{medication.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.dosage}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.frequency}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.purpose}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{medication.startDate} to {medication.endDate}</div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'allergies':
        return (
          <div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Allergies</h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allergen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reaction</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Noted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allergiesAndImmunizations.allergies.map((allergy, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{allergy.allergen}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            allergy.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                            allergy.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {allergy.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{allergy.reaction}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{allergy.noted}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Immunization History</h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dose</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allergiesAndImmunizations.immunizations.map((immunization, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{immunization.vaccine}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{immunization.date}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{immunization.dose}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="mr-3 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Complete Medical History</h2>
            <p className="text-sm text-gray-600">
              {patientInfo.name} • {patientInfo.gender}, {patientInfo.age} years • ID: {patientInfo.id}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md mr-2">
            <FaPrint className="mr-1" /> Print
          </button>
          <button className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md">
            <FaDownload className="mr-1" /> Export
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 mb-2 ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 mb-2 ${
              activeTab === 'timeline' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            Medical Timeline
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 mb-2 ${
              activeTab === 'medications' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('medications')}
          >
            Medications
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 mb-2 ${
              activeTab === 'allergies' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('allergies')}
          >
            Allergies & Immunizations
          </button>
        </div>
      </div>

      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MedicalHistory;