import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import SignupUser from './components/SignupUser';
import UserDashboard from './components/UserDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import UploadFiles from './components/UploadFiles';
import SignupNext from './components/SignupNext';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from './services/operations/profileAPI';
import { useEffect } from 'react';
import ViewDocuments from './components/ViewDocuments';
import QRCodeScanner from './components/QRCodeScanner';
import Settings from './components/Settings';
import CompleteProfile from './pages/CompleteProfile';

function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.profile)

  useEffect(() => {
    console.log(localStorage.getItem("token"))
    if (localStorage.getItem("token")) {
      const token = JSON.parse(localStorage.getItem("token"))
      dispatch(getUserDetails(token, navigate))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupUser />} />
      <Route path="/signup/next" element={<SignupNext />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/view-documents" element={<ViewDocuments />} />
      <Route path="/upload" element={<UploadFiles/>} />
      <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
      <Route path="/scan-qr" element={<QRCodeScanner />} />
      <Route path="/my-profile" element={<Settings />} />
    </Routes>
  );
}

export default App;
