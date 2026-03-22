import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonateForm.css';

const DonateForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic client-side validation
    if (!title || !quantity || !location) {
      alert('Title, quantity, and location are required.');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to upload a donation.');
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('quantity', quantity);
      formData.append('location', location);
      formData.append('expiryDate', expiryDate);
      if (image) formData.append('image', image);

      const res = await fetch('http://localhost:5000/api/food', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type for FormData
        body: formData
      });

      const data = await res.json().catch(() => ({}));

      // debug logs to trace issues
      console.log('Upload response:', res.status, data);

      if (res.ok) {
        alert('Donation uploaded successfully!');
        // clear form
        setTitle('');
        setDescription('');
        setQuantity('');
        setLocation('');
        setExpiryDate('');
        setImage(null);

        // primary redirect (React)
        navigate('/donor-dashboard');

        // fallback redirect (hard reload) in case router is misconfigured
        setTimeout(() => {
          if (window.location.pathname !== '/donor-dashboard') {
            window.location.href = '/donor-dashboard';
          }
        }, 200);
      } else {
        alert(data.message || `Upload failed (status ${res.status}).`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Server error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donate-container">
      <h2>🍱 Upload a Donation</h2>
      <form onSubmit={handleSubmit} className="donate-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="text"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default DonateForm;

