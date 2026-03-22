import React, { useState } from 'react';
import './MultiDonationForm.css';

const MultiDonationForm = () => {
  const [donations, setDonations] = useState([
    { title: '', description: '', quantity: '', location: '', expiryDate: '', image: null }
  ]);

  const token = localStorage.getItem('token');
  const BACKEND_URL = 'https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app';

  const handleChange = (index, e) => {
    const { name, value, files } = e.target;
    const updated = [...donations];
    updated[index][name] = files ? files[0] : value;
    setDonations(updated);
  };

  const addDonation = () => {
    setDonations([...donations, { title: '', description: '', quantity: '', location: '', expiryDate: '', image: null }]);
  };

  const removeDonation = (index) => {
    const updated = donations.filter((_, i) => i !== index);
    setDonations(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    const donationData = donations.map(({ title, description, quantity, location, expiryDate }) => ({
      title, description, quantity, location, expiryDate
    }));
    formData.append('donations', JSON.stringify(donationData));

    donations.forEach(d => {
      if (d.image) formData.append('images', d.image);
    });

    const res = await fetch(`${BACKEND_URL}/api/food/bulk`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Uploaded ${data.length} donations successfully!`);
      setDonations([{ title: '', description: '', quantity: '', location: '', expiryDate: '', image: null }]);
    } else {
      alert(data.message || 'Upload failed');
    }
  };

  return (
    <div className="multi-donation-container">
      <h2 className="form-title">🍱 Upload Multiple Donations</h2>
      <form onSubmit={handleSubmit}>
        {donations.map((donation, index) => (
          <div key={index} className="donation-card">
            <h3>Donation {index + 1}</h3>
            <input type="text" name="title" placeholder="Title" value={donation.title} onChange={(e) => handleChange(index, e)} required />
            <textarea name="description" placeholder="Description" value={donation.description} onChange={(e) => handleChange(index, e)} />
            <input type="text" name="quantity" placeholder="Quantity" value={donation.quantity} onChange={(e) => handleChange(index, e)} required />
            <input type="text" name="location" placeholder="Location" value={donation.location} onChange={(e) => handleChange(index, e)} required />
            <input type="date" name="expiryDate" value={donation.expiryDate} onChange={(e) => handleChange(index, e)} required />
            <input type="file" name="image" accept="image/*" onChange={(e) => handleChange(index, e)} />
            <button type="button" className="remove-btn" onClick={() => removeDonation(index)}>🗑️ Remove</button>
          </div>
        ))}
        <div className="form-actions">
          <button type="button" className="add-btn" onClick={addDonation}>➕ Add another donation</button>
          <button type="submit" className="submit-btn">✅ Submit All</button>
        </div>
      </form>
    </div>
  );
};

export default MultiDonationForm;
