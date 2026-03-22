import React, { useEffect, useState } from 'react';
import './DonorDashboard.css';

const DonorDashboard = () => {
  
  const [listings, setListings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [donations, setDonations] = useState([
    { 
      title: '', 
      description: '', 
      quantity: '', 
      location: '', 
      address: '',
      landmark: '',
      latitude: '',
      longitude: '',
      expiryDate: '', 
      image: null, 
      category: '' 
    }
  ]);

  const [aiInsights, setAiInsights] = useState({ autoCategory: '', predictedExpiry: '' });
  const [reminder, setReminder] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/donor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setListings(data);
      } catch (err) {
        console.error('Fetch listings error:', err);
      }
    };
    if (token) fetchListings();
  }, [token]);

  useEffect(() => {
    const fetchReminder = async () => {
      try {
        const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/reminders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.reminder) setReminder(data);
      } catch (err) {
        console.error('Fetch reminder error:', err);
      }
    };
    if (token) fetchReminder();
  }, [token]);

  const detectCurrentLocation = (index) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const updated = [...donations];
        
        updated[index].latitude = latitude;
        updated[index].longitude = longitude;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          if (data.display_name) {
            updated[index].address = data.display_name;
            const addressParts = data.display_name.split(',');
            if (addressParts.length > 0) {
              updated[index].location = addressParts[0].trim();
            }
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          updated[index].location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        
        setDonations(updated);
        setDetectingLocation(false);
        alert("📍 Location detected successfully! Coordinates saved for route optimization.");
      },
      (error) => {
        setDetectingLocation(false);
        alert("Could not detect your location. Please enter address manually.");
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const predictExpiry = async (index, title, category) => {
    if (!title?.trim()) return;
    
    try {
      const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/ai/expiry-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, category })
      });
      
      const data = await res.json();
      if (res.ok && data.predictedExpiry) {
        setAiInsights((prev) => ({ 
          ...prev, 
          predictedExpiry: data.predictedExpiry 
        }));
      }
    } catch (err) {
      console.error('Expiry prediction error:', err);
    }
  };

  const handleChange = async (index, e) => {
    const { name: fieldName, value: fieldValue } = e.target;
    const updated = [...donations];
    updated[index][fieldName] = fieldValue;
    setDonations(updated);

    if (fieldName === 'title' && fieldValue?.trim()) {
      try {
        const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/ai/classify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: fieldValue })
        });
        const data = await res.json();
        if (res.ok && data.autoCategory) {
          updated[index].category = data.autoCategory;
          setDonations([...updated]);
          
          setAiInsights((prev) => ({ 
            ...prev, 
            autoCategory: data.autoCategory 
          }));
          
          await predictExpiry(index, fieldValue, data.autoCategory);
        }
      } catch (err) {
        console.error('AI classify error:', err);
      }
    }

    if (fieldName === 'category' && fieldValue?.trim()) {
      await predictExpiry(index, updated[index].title, fieldValue);
    }

    if (fieldName === 'image' && e.target.files[0]) {
      updated[index].image = e.target.files[0];
      setDonations(updated);
    }
  };

  const applyAISuggestion = (type, value) => {
    const updated = [...donations];
    
    if (type === 'category') {
      updated[0].category = value;
    } else if (type === 'expiry') {
      updated[0].expiryDate = new Date(value).toISOString().split('T')[0];
    }
    
    setDonations(updated);
  };

  const addDonation = () => {
    setDonations((prev) => [
      ...prev,
      { 
        title: '', description: '', quantity: '', location: '', address: '',
        landmark: '', latitude: '', longitude: '', expiryDate: '', image: null, category: '' 
      }
    ]);
    setAiInsights({ autoCategory: '', predictedExpiry: '' });
  };

  const removeDonation = (index) => {
    const updated = donations.filter((_, i) => i !== index);
    setDonations(updated);
    if (updated.length === 0) {
      setAiInsights({ autoCategory: '', predictedExpiry: '' });
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      const donationData = donations.map(({ 
        title, description, quantity, location, address, landmark, latitude, longitude, expiryDate, category 
      }) => ({
        title,
        description,
        quantity,
        location,
        address: address || location,
        landmark: landmark || '',
        lat: latitude ? parseFloat(latitude) : undefined,
        lng: longitude ? parseFloat(longitude) : undefined,
        expiryDate,
        category: category || aiInsights.autoCategory
      }));
      
      formData.append('donations', JSON.stringify(donationData));

      donations.forEach((d) => {
        if (d.image) formData.append('images', d.image);
      });

      const res = await fetch('https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/bulk', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Uploaded ${data.length} donations successfully!\n\n📍 Locations saved for route optimization.`);
        setListings((prev) => [...prev, ...data]);
        setDonations([{ 
          title: '', description: '', quantity: '', location: '', address: '', landmark: '', 
          latitude: '', longitude: '', expiryDate: '', image: null, category: '' 
        }]);
        setAiInsights({ autoCategory: '', predictedExpiry: '' });
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Bulk submit error:', err);
      alert('Upload failed');
    }
  };

  const startEdit = (listing) => {
    setEditingId(listing._id);
    setDonations([{ 
      ...listing, 
      image: null,
      expiryDate: listing.expiryDate ? listing.expiryDate.split('T')[0] : '',
      address: listing.address || '',
      landmark: listing.landmark || '',
      latitude: listing.coordinates?.lat || listing.latitude || '',
      longitude: listing.coordinates?.lng || listing.longitude || ''
    }]);
    setAiInsights({ 
      autoCategory: listing.category || '', 
      predictedExpiry: listing.predictedExpiry || '' 
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      const donationData = donations[0];
      
      Object.entries(donationData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'image' && key !== 'latitude' && key !== 'longitude') {
          fd.append(key, value);
        }
      });
      
      if (donationData.latitude) fd.append('lat', donationData.latitude);
      if (donationData.longitude) fd.append('lng', donationData.longitude);

      if (donationData.image && donationData.image instanceof File) {
        fd.append('image', donationData.image);
      }

      const res = await fetch(`https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/${editingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Donation updated successfully!\n📍 Location data saved for route optimization.');
        setListings((prev) => prev.map((item) => (item._id === editingId ? data : item)));
        setEditingId(null);
        setAiInsights({ autoCategory: '', predictedExpiry: '' });
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Edit submit error:', err);
      alert('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return;
    try {
      const res = await fetch(`https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        alert('Donation deleted successfully!');
        setListings((prev) => prev.filter((item) => item._id !== id));
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed');
    }
  };

  const approveReminder = async (id) => {
    try {
      const res = await fetch(`https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/api/food/reminders/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Recurring donation created!');
        setListings((prev) => [...prev, data.newDonation]);
        setReminder(null);
      } else {
        alert(data.message || 'Approval failed');
      }
    } catch (err) {
      console.error('Approve reminder error:', err);
      alert('Approval failed');
    }
  };

  const hasCoordinates = (index) => {
    return donations[index].latitude && donations[index].longitude;
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📦 My Donations</h2>
      
      <div className="top-ai-strip">
        {(aiInsights.autoCategory || aiInsights.predictedExpiry) && (
          <div className="ai-insights">
            <h3>🤖 AI Suggestions</h3>
            {aiInsights.autoCategory && (
              <div className="ai-row">
                <div className="ai-label">Suggested Category:</div>
                <div className="ai-value">
                  <span 
                    className="ai-chip clickable"
                    onClick={() => applyAISuggestion('category', aiInsights.autoCategory)}
                    title="Click to apply to form"
                  >
                    📦 {aiInsights.autoCategory}
                  </span>
                </div>
              </div>
            )}
            {aiInsights.predictedExpiry && (
              <div className="ai-row">
                <div className="ai-label">Suggested Expiry:</div>
                <div className="ai-value">
                  <span 
                    className="ai-chip clickable"
                    onClick={() => applyAISuggestion('expiry', aiInsights.predictedExpiry)}
                    title="Click to apply to form"
                  >
                    📅 {new Date(aiInsights.predictedExpiry).toDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {reminder && (
          <div className="reminder-card">
            <h3>🔁 Recurring suggestion</h3>
            <p className="reminder-text">{reminder.reminder}</p>
            <div className="reminder-actions">
              <button className="approve-btn" onClick={() => approveReminder(reminder.donationId)}>✅ Approve</button>
              <button className="skip-btn" onClick={() => setReminder(null)}>❌ Skip</button>
            </div>
          </div>
        )}
      </div>

      {!editingId && (
        <form onSubmit={handleBulkSubmit} className="bulk-form">
          {donations.map((donation, index) => (
            <div key={index} className="donation-card">
              <h3>Donation {index + 1}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g., Fresh Apples"
                    value={donation.title}
                    onChange={(e) => handleChange(index, e)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="Will be auto-filled by AI"
                    value={donation.category}
                    onChange={(e) => handleChange(index, e)}
                    className={aiInsights.autoCategory ? 'ai-filled' : ''}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe your donation..."
                  value={donation.description}
                  onChange={(e) => handleChange(index, e)}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="text"
                    name="quantity"
                    placeholder="e.g., 5 boxes, 10 kg"
                    value={donation.quantity}
                    onChange={(e) => handleChange(index, e)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Location *</label>
                  <div className="location-input-group">
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g., Noida Sector 18"
                      value={donation.location}
                      onChange={(e) => handleChange(index, e)}
                      required
                    />
                    <button
                      type="button"
                      className="location-detect-btn"
                      onClick={() => detectCurrentLocation(index)}
                      disabled={detectingLocation}
                      title="Detect current location for route optimization"
                    >
                      {detectingLocation ? '📍 Detecting...' : '📍 Detect Location'}
                    </button>
                  </div>
                  {hasCoordinates(index) && (
                    <p className="location-hint">
                      ✅ Coordinates saved! Receivers will get optimized routes.
                    </p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Address (Optional)</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Complete address for precise pickup"
                    value={donation.address}
                    onChange={(e) => handleChange(index, e)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    placeholder="e.g., Near Metro Station"
                    value={donation.landmark}
                    onChange={(e) => handleChange(index, e)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={donation.expiryDate || ''}
                    onChange={(e) => handleChange(index, e)}
                    required
                    min={today}
                  />
                  <small className="expiry-hint">Food will be considered expired after this date</small>
                </div>
                
                <div className="form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={(e) => handleChange(index, e)}
                  />
                </div>
              </div>

              {donations.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeDonation(index)}
                >
                  🗑️ Remove This Donation
                </button>
              )}
            </div>
          ))}

          <div className="form-actions">
            <button type="button" className="add-btn" onClick={addDonation}>➕ Add Another Donation</button>
            <button type="submit" className="submit-btn">✅ Submit All Donations</button>
          </div>
        </form>
      )}

      {editingId && (
        <form onSubmit={handleEditSubmit} className="edit-form">
          <h3>Edit Donation</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={donations[0].title}
                onChange={(e) => handleChange(0, e)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={donations[0].category || ''}
                onChange={(e) => handleChange(0, e)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={donations[0].description || ''}
              onChange={(e) => handleChange(0, e)}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="text"
                name="quantity"
                value={donations[0].quantity}
                onChange={(e) => handleChange(0, e)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Location *</label>
              <div className="location-input-group">
                <input
                  type="text"
                  name="location"
                  value={donations[0].location}
                  onChange={(e) => handleChange(0, e)}
                  required
                />
                <button
                  type="button"
                  className="location-detect-btn"
                  onClick={() => detectCurrentLocation(0)}
                  disabled={detectingLocation}
                  title="Update location coordinates"
                >
                  {detectingLocation ? '📍 Detecting...' : '📍 Update Location'}
                </button>
              </div>
              {hasCoordinates(0) && (
                <p className="location-hint">
                  ✅ Coordinates available for route optimization
                </p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Address</label>
              <input
                type="text"
                name="address"
                placeholder="Complete address"
                value={donations[0].address || ''}
                onChange={(e) => handleChange(0, e)}
              />
            </div>
            
            <div className="form-group">
              <label>Landmark</label>
              <input
                type="text"
                name="landmark"
                placeholder="Nearby landmark"
                value={donations[0].landmark || ''}
                onChange={(e) => handleChange(0, e)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                value={donations[0].expiryDate || ''}
                onChange={(e) => handleChange(0, e)}
                required
                min={today}
              />
            </div>
            
            <div className="form-group">
              <label>Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) => handleChange(0, e)}
              />
              {donations[0].imageUrl && !(donations[0].image instanceof File) && (
                <p className="current-image">Current image will be kept</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">💾 Save Changes</button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => { 
                setEditingId(null); 
                setAiInsights({ autoCategory: '', predictedExpiry: '' }); 
                setDonations([{ 
                  title: '', description: '', quantity: '', location: '', address: '', landmark: '', 
                  latitude: '', longitude: '', expiryDate: '', image: null, category: '' 
                }]);
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      )}

      <div className="donation-grid">
        {listings.length === 0 ? (
          <div className="empty-state">
            <p>No donations yet. Start by adding your first donation above!</p>
          </div>
        ) : (
          listings.map((listing) => (
            <div key={listing._id} className="donation-card">
              {listing.image && (
                <img
                  src={`https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app/${listing.image}`}
                  alt={listing.title}
                  className="donation-image"
                />
              )}
              <div className="donation-info">
                <h3>{listing.title}</h3>
                <p className="donation-description">{listing.description}</p>
                <p><strong>Category:</strong> {listing.category || 'Not specified'}</p>
                <p><strong>Quantity:</strong> {listing.quantity}</p>
                <p><strong>Location:</strong> {listing.location}</p>
                {listing.address && <p><strong>Address:</strong> {listing.address}</p>}
                {listing.landmark && <p><strong>Landmark:</strong> {listing.landmark}</p>}
                {listing.coordinates && listing.coordinates.lat && listing.coordinates.lng && (
                  <p className="route-optimized">
                    <strong>📍 Route Optimized:</strong> Yes (coordinates saved)
                  </p>
                )}
                <p>
                  <strong>Expiry:</strong> 
                  {listing.expiryDate ? (
                    new Date(listing.expiryDate) > new Date() ? (
                      <span className="expiry-valid"> 📅 {new Date(listing.expiryDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="expiry-expired"> ⚠️ EXPIRED on {new Date(listing.expiryDate).toLocaleDateString()}</span>
                    )
                  ) : (
                    <span className="expiry-unknown"> ⚠️ Not specified</span>
                  )}
                </p>
                {listing.predictedExpiry && (
                  <p className="ai-prediction">
                    <strong>AI Predicted Expiry:</strong> {new Date(listing.predictedExpiry).toDateString()}
                  </p>
                )}
                {listing.claimed ? (
                  <span className="claimed-badge">
                    ✅ Claimed {listing.claimedAt ? `on ${listing.claimedAt.split('T')[0]}` : ''}
                  </span>
                ) : (
                  <span className="available-badge">🟢 Available</span>
                )}
              </div>
              <div className="donation-actions">
                <button className="edit-btn" onClick={() => startEdit(listing)}>✏️ Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(listing._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
