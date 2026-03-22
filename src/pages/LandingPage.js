import React, { useEffect, useState } from 'react';
import './LandingPage.css';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`landing-container ${showSplash ? 'splash-mode' : 'main-mode'}`}>
      <img
        src="/assets/replate 1.png"
        alt="Replate Logo"
        className={`logo ${showSplash ? 'logo-animate' : 'logo-static'}`}
      />

      {!showSplash && (
        <div className="cta-row fade-in">
          <Link to="/login" className="btn">Login</Link>
          <Link to="/signup" className="btn outline">Sign Up</Link>
        </div>
      )}
    </div>
  );
};

export default LandingPage;


