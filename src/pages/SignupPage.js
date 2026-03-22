import React, { useState } from 'react';
import './AuthForm.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, location }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        if (data.user.location) localStorage.setItem('userLocation', data.user.location);
        
        alert(`✅ Welcome, ${data.user.name}!`);
        window.location.href = `/${data.user.role}-dashboard`;
      } else {
        setErrors({ general: data.message || 'Signup failed' });
      }
    } catch (err) {
      setErrors({ general: 'Cannot connect to server. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join Replate to start donating or receiving food</p>
        
        {errors.general && (
          <div className="error-message general-error">⚠️ {errors.general}</div>
        )}
        
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className={errors.name ? 'input-error' : ''}
            disabled={loading}
          />
          {errors.name && <span className="field-error">⚠️ {errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={errors.email ? 'input-error' : ''}
            disabled={loading}
          />
          {errors.email && <span className="field-error">⚠️ {errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={errors.password ? 'input-error' : ''}
            disabled={loading}
          />
          {errors.password && <span className="field-error">⚠️ {errors.password}</span>}
        </div>

        <div className="form-group">
          <label>Location (Optional)</label>
          <input
            type="text"
            placeholder="City or area"
            value={location}
            onChange={e => setLocation(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="role-cards">
          {['donor', 'receiver'].map((r) => (
            <div
              key={r}
              className={`role-card ${role === r ? 'selected' : ''}`}
              onClick={() => !loading && setRole(r)}
            >
              <span className="role-icon">{r === 'donor' ? '🥗' : '🍽️'}</span>
              <span className="role-label">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
              <span className="role-desc">{r === 'donor' ? 'Share food' : 'Receive food'}</span>
            </div>
          ))}
        </div>

        <button onClick={handleSignup} disabled={loading} className="auth-submit-btn">
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <a href="/login" className="auth-link">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;


