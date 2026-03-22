import React, { useState } from 'react';
import './AuthForm.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        if (data.user.location) localStorage.setItem('userLocation', data.user.location);
        
        alert(`✅ Welcome back, ${data.user.name}!`);
        
        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = '/admin-dashboard';
          } else {
            window.location.href = `/${data.user.role}-dashboard`;
          }
        }, 500);
      } else {
        setErrors({ general: data.message || 'Login failed' });
      }
    } catch (err) {
      setErrors({ general: 'Cannot connect to server. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login to Replate</h2>
        <p className="auth-subtitle">Enter your credentials to access your dashboard</p>
        
        {errors.general && (
          <div className="error-message general-error">⚠️ {errors.general}</div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'input-error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="field-error">⚠️ {errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <button 
                type="button" 
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'input-error' : ''}
              disabled={loading}
            />
            {errors.password && <span className="field-error">⚠️ {errors.password}</span>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading || !email || !password}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <a href="/signup" className="auth-link">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
