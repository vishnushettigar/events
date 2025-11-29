import React, { useState, useEffect, useRef, memo } from 'react';
import { eventAPI, reportAPI } from '../utils/api';
import TempleManagement from '../components/TempleManagement.jsx';
import Schedule from '../components/Schedule.jsx';
import Results from '../components/Results.jsx';
import Champions from '../components/Champions.jsx';
import UpdateTeamResult from '../components/UpdateTeamResult.jsx';
import UpdateIndividualResult from '../components/UpdateIndividualResult.jsx';

const StaffPanel = () => {
  const [activeTab, setActiveTab] = useState('update-results');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success', 'error', 'info', 'confirm'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalDetails, setModalDetails] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null); // Store pending update data




  const tabs = [
    { id: 'update-results', name: 'Individual', endpoint: '/api/events/participant-data' },
    { id: 'teams', name: 'Teams', endpoint: '/api/events/team-events' },
    { id: 'champions', name: 'Champions', endpoint: '/api/users/champions' },
    { id: 'all-result', name: 'All Results', endpoint: '/api/users/all-results' },
    { id: 'schedule', name: 'Schedule', endpoint: '/api/events/schedule' },
    { id: 'temples', name: 'Temple Reports', endpoint: '/api/admin/temples' }
  ];

  useEffect(() => {
    // Clear data when switching tabs to prevent structure conflicts
    setData([]);
    setError(null);
    
    if (activeTab === 'champions') {
      fetchChampions();
    } else if (activeTab === 'all-result') {
      fetchAllResults();
    }
  }, [activeTab]);

  // Listen for global logout events
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('StaffPanel: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, []);


  // Fetch champions data
  const fetchChampions = async () => {
    try {
    setLoading(true);
      setError(null);
      const data = await reportAPI.getChampions();
      setData(data);
    } catch (err) {
      console.error('Error fetching champions:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all results data
  const fetchAllResults = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Making request to all-results endpoint...');
      const data = await reportAPI.getAllResults();
      console.log('All Results Data:', data); // Debug logging
      setData(data);
    } catch (err) {
      console.error('Error fetching all results:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };



  // Modal helper functions
  const showSuccessModal = (title, message, details = null) => {
    setModalType('success');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setShowModal(true);
    
    // Auto-close success modal after 3 seconds
    setTimeout(() => {
      closeModal();
    }, 1000);
  };

  const showErrorModal = (title, message, details = null) => {
    setModalType('error');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setShowModal(true);
  };

  const showInfoModal = (title, message, details = null) => {
    setModalType('info');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setShowModal(true);
  };

  const showConfirmModal = (title, message, details = null, updateData = null) => {
    setModalType('confirm');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setPendingUpdate(updateData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalTitle('');
    setModalMessage('');
    setModalDetails(null);
    setPendingUpdate(null);
  };

   
  // tabs code start from here 
 
  // Render Temple Reports - now using reusable component
  const renderTempleReports = () => {
    return <TempleManagement apiSource="staff" showContactInfo={false} showParticipants={false} />;
  };



  // Modal Component
  const Modal = () => {
    if (!showModal) return null;

    const getModalIcon = () => {
      switch (modalType) {
        case 'success':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          );
        case 'error':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          );
        case 'info':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
        case 'confirm':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
        default:
          return null;
      }
    };

    const getModalButtonColor = () => {
      switch (modalType) {
        case 'success':
          return 'bg-green-600 hover:bg-green-700';
        case 'error':
          return 'bg-red-600 hover:bg-red-700';
        case 'info':
          return 'bg-blue-600 hover:bg-blue-700';
        case 'confirm':
          return 'bg-[#D35D38] hover:bg-[#B84A2E]';
        default:
          return 'bg-[#D35D38] hover:bg-[#B84A2E]';
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
        <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-md">
          <div className="flex items-center mb-4">
            {getModalIcon()}
            <h3 className={`text-lg font-semibold ml-3 ${
              modalType === 'success' ? 'text-green-900' : 
              modalType === 'error' ? 'text-red-900' : 
              'text-blue-900'
            }`}>
              {modalTitle}
            </h3>
          </div>
          
          <p className={`text-sm mb-4 ${
            modalType === 'success' ? 'text-green-700' : 
            modalType === 'error' ? 'text-red-700' : 
            'text-blue-700'
          }`}>
            {modalMessage}
          </p>
          
          {/* Details section */}
          {modalDetails && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Details:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(modalDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                    <span className="ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Only show buttons for non-success modals */}
          {modalType !== 'success' && (
            <div className="flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Confirm button clicked, modalType:', modalType, 'pendingUpdate:', pendingUpdate);
                  if (modalType === 'confirm') {
                    // Note: Individual and bulk result updates are now handled in UpdateIndividualResult component
                    // This modal is only used for other confirmations in StaffPanel
                    closeModal();
                  } else {
                    closeModal();
                  }
                }}
                className={`${getModalButtonColor()} text-white px-4 py-2 rounded transition`}
              >
                Confirm
              </button>
            </div>
          )}
          
          {/* Show auto-close message for success modals */}
          {modalType === 'success' && (
            <div className="text-center text-xs text-gray-500 mt-2">
              This message will close automatically...
            </div>
          )}
        </div>
      </div>
    );
  };
  
  //Body
  return (
    <div className="min-h-screen bg-[#F0F0F0] p-3 sm:p-4 md:p-6">
      {/* Modal */}
      <Modal />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-2 sm:mb-4">
          <h1 className="text-lg sm:text-3xl font-bold text-[#2A2A2A] mb-0 sm:mb-2">Staff Panel</h1>
          <p className="hidden sm:block text-sm sm:text-base text-[#5A5A5A]">Manage your sports event data</p>
        </div>

        {/* Tabs */}
        <div className="mb-0 md:mb-6">
          {/* Desktop Tabs - Horizontal */}
          <nav className="hidden lg:flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#D35D38] text-[#D35D38]'
                    : 'border-transparent text-[#5A5A5A] hover:text-[#2A2A2A] hover:border-[#D35D38]'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>

          {/* Tablet Tabs - Scrollable */}
          <div className="hidden md:block lg:hidden">
            <div className="overflow-x-auto">
              <nav className="flex space-x-6 min-w-max">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#D35D38] text-[#D35D38]'
                        : 'border-transparent text-[#5A5A5A] hover:text-[#2A2A2A] hover:border-[#D35D38]'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
            </div>
          </div>
        </div>

        {/* Render different content based on active tab */}
        {activeTab === 'temples' ? (
          renderTempleReports()
        ) : activeTab === 'update-results' ? (
          <UpdateIndividualResult />
        ) : activeTab === 'teams' ? (
          <UpdateTeamResult />
        ) : activeTab === 'champions' ? (
          <Champions apiSource="staff" />
        ) : activeTab === 'all-result' ? (
          <Results apiSource="staff" />
        ) : activeTab === 'schedule' ? (
          <Schedule apiSource="staff" />
        ) : null}

        {/* Bottom spacer for mobile to account for fixed tab bar */}
        <div className="h-20 md:hidden"></div>
      </div>

      {/* Mobile Bottom Tab Bar (< 768px) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F8DFBE] z-50 md:hidden">
        <nav className="flex items-center justify-around py-2 px-1">
          {/* Individual */}
          <button
            onClick={() => setActiveTab('update-results')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              activeTab === 'update-results'
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium truncate">Individual</span>
          </button>

          {/* Teams */}
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              activeTab === 'teams'
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium truncate">Teams</span>
          </button>

          {/* Champions */}
          <button
            onClick={() => setActiveTab('champions')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              activeTab === 'champions'
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-[10px] font-medium truncate">Champions</span>
          </button>

          {/* All Results */}
          <button
            onClick={() => setActiveTab('all-result')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              activeTab === 'all-result'
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-[10px] font-medium truncate">Results</span>
          </button>

          {/* Schedule */}
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              activeTab === 'schedule'
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-medium truncate">Schedule</span>
          </button>

          {/* Temple Reports */}
          <button
            onClick={() => setActiveTab('temples')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
              activeTab === 'temples'
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[10px] font-medium truncate">Temples</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default StaffPanel; 