import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonationForm.css';

const DonationForm = () => {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const BACKEND_URL = 'https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to upload a donation.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('quantity', quantity);
    formData.append('expiryDate', expiryDate);
    formData.append('location', location);
    if (image) formData.append('image', image);

    try {
      const res = await fetch(`${BACKEND_URL}/api/food`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      console.log('Upload response:', res.status, data);

      if (res.ok) {
        alert('Donation uploaded successfully!');
        navigate('/donor-dashboard');
      } else {
        alert(data.message || `Upload failed (status ${res.status}).`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Server error: ' + err.message);
    }
  };

  return (
    <div className="donation-form-container">
      <h2>🍱 Upload a Donation</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          placeholder="Food Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Quantity (e.g. 10 kg)"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Pickup Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit">✅ Submit Donation</button>
      </form>
    </div>
  );
};

export default DonationForm;
