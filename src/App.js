import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DonorDashboard from './pages/DonorDashboard';
import DonationForm from './pages/DonationForm';
import ReceiverDashboard from './pages/ReceiverDashboard';
import MultiDonationForm from './pages/MultiDonationForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Donor routes */}
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/donate" element={<DonationForm />} />
        <Route path="/donate-bulk" element={<MultiDonationForm />} />
        
        {/* Receiver routes */}
        <Route path="/receiver-dashboard" element={<ReceiverDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
