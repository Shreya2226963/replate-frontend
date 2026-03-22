import React, { useEffect, useState } from 'react';
import './ReceiverDashboard.css';

const ReceiverDashboard = () => {
  const [foodList, setFoodList] = useState([]);
  const [claimedList, setClaimedList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [currentDonorLocation, setCurrentDonorLocation] = useState(null);
  const [currentReceiverLocation, setCurrentReceiverLocation] = useState(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [navigating, setNavigating] = useState(false);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const BACKEND_URL = 'https://replate-backend-6ford7ws3-aiml23018-2763s-projects.vercel.app';

  const fetchFood = async (location = '') => {
    try {
      setLoading(true);
      setError('');
      const url = location
        ? `${BACKEND_URL}/api/food?location=${encodeURIComponent(location)}`
        : `${BACKEND_URL}/api/food`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch food listings');
      const data = await res.json();
      setFoodList(data);

      const resClaimed = await fetch(`${BACKEND_URL}/api/food/receiver`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resClaimed.ok) {
        const claimedData = await resClaimed.json();
        setClaimedList(claimedData);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load food listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      if (!userId) return;
      const res = await fetch(`${BACKEND_URL}/api/recommendations/receivers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Recommendations API error:', err);
      setRecommendations([]);
    }
  };

  const fetchOptimizedRoute = async () => {
    try {
      if (!userId) return;
      const res = await fetch(`${BACKEND_URL}/api/food/route/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOptimizedRoute(data.optimizedRoute || []);
      }
    } catch (err) {
      console.error('Route error:', err);
      setOptimizedRoute([]);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        setNavigating(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setNavigating(false);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            setNavigating(false);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  };

  const getDonorLocation = async (foodItem) => {
    if (foodItem.coordinates && foodItem.coordinates.lat && foodItem.coordinates.lng) {
      return {
        lat: foodItem.coordinates.lat,
        lng: foodItem.coordinates.lng,
        address: foodItem.address || foodItem.location,
        name: foodItem.title
      };
    }
    
    if (foodItem.latitude && foodItem.longitude) {
      return {
        lat: foodItem.latitude,
        lng: foodItem.longitude,
        address: foodItem.address || foodItem.location,
        name: foodItem.title
      };
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(foodItem.location)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
          name: foodItem.title
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return null;
  };

  const openGoogleMaps = (origin, destination) => {
    if (!origin || !destination) {
      alert('Could not get location coordinates for navigation');
      return;
    }
    
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;
    
    console.log('Opening Google Maps:', mapsUrl);
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const showRouteConfirmation = async (foodItem) => {
    setSelectedFoodItem(foodItem);
    
    try {
      const receiverLocation = await getCurrentLocation();
      setCurrentReceiverLocation(receiverLocation);
      
      const donorLocation = await getDonorLocation(foodItem);
      
      if (!donorLocation) {
        const claimWithoutMap = window.confirm(
          `📍 Could not get precise location for "${foodItem.title}".\n\n` +
          `Location: ${foodItem.location}\n\n` +
          `Would you still like to claim this item? (You'll need to find the location manually)`
        );
        if (claimWithoutMap) {
          handleClaim(foodItem._id);
        }
        setShowMap(false);
        return;
      }
      
      setCurrentDonorLocation(donorLocation);
      
      const distance = calculateDistance(
        receiverLocation.lat,
        receiverLocation.lng,
        donorLocation.lat,
        donorLocation.lng
      );
      
      const travelTime = Math.round(distance / 40 * 60);
      
      const userChoice = window.confirm(
        `🍽️ Claim "${foodItem.title}"?\n\n` +
        `📍 Donor: ${donorLocation.address || foodItem.location}\n` +
        `📏 Distance: ${distance.toFixed(1)} km\n` +
        `⏱️ Est. travel: ${travelTime} min by car\n\n` +
        `Click OK to see route on Google Maps, or Cancel to claim without navigation.`
      );
      
      if (userChoice) {
        openGoogleMaps(receiverLocation, donorLocation);
        
        setTimeout(() => {
          const finalConfirm = window.confirm(
            `✅ After viewing the route, do you want to claim "${foodItem.title}"?\n\n` +
            `Click OK to claim now.`
          );
          if (finalConfirm) {
            handleClaim(foodItem._id);
          }
        }, 2000);
      } else {
        const confirmClaim = window.confirm(`Claim "${foodItem.title}" without navigation?`);
        if (confirmClaim) {
          handleClaim(foodItem._id);
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      const claimAnyway = window.confirm(
        `⚠️ Could not detect your current location.\n\n` +
        `Please make sure location services are enabled.\n\n` +
        `Would you still like to claim "${foodItem.title}"?\n` +
        `Location: ${foodItem.location}`
      );
      if (claimAnyway) {
        handleClaim(foodItem._id);
      }
    }
  };

  const handleClaim = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/food/${id}/claim`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to claim food');
      const updated = await res.json();
      alert(`✅ You claimed "${updated.title}" successfully!\n\n📍 Check your claimed items for pickup details.`);
      fetchFood(locationFilter);
      fetchRecommendations();
      fetchOptimizedRoute();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickClaim = async (id) => {
    if (window.confirm('Claim this item without navigation?')) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/food/${id}/claim`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to claim food');
        const updated = await res.json();
        alert(`✅ You claimed "${updated.title}" successfully!`);
        fetchFood(locationFilter);
        fetchRecommendations();
        fetchOptimizedRoute();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const navigateToDonor = async (item) => {
    try {
      const receiverLocation = await getCurrentLocation();
      const donorLocation = await getDonorLocation(item);
      
      if (donorLocation) {
        openGoogleMaps(receiverLocation, donorLocation);
      } else {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(item.location)}`;
        window.open(mapsUrl, '_blank');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(item.location)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handlePickup = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/food/${id}/pickup`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to confirm pickup');
      await res.json();
      alert('✅ Pickup confirmed!');
      fetchFood(locationFilter);
      fetchOptimizedRoute();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchFood();
      fetchRecommendations();
      fetchOptimizedRoute();
    };
    loadData();
  }, []);

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) {
      return <span className="expiry-unknown">⚠️ Not specified - consume within 3 days</span>;
    }
    const date = new Date(expiryDate);
    const today = new Date();
    if (date > today) {
      return <span className="expiry-valid">📅 {date.toLocaleDateString()}</span>;
    } else {
      return <span className="expiry-expired">⚠️ EXPIRED on {date.toLocaleDateString()}</span>;
    }
  };

  return (
    <div className="receiver-container">
      <h2 className="dashboard-title">🍽️ Receiver Dashboard</h2>

      <div className="filter-section">
        <h2 className="section-title">Available Food</h2>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Enter location (e.g., Lucknow)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-input"
          />
          <button onClick={() => fetchFood(locationFilter)} className="filter-btn">🔍 Filter</button>
          <button onClick={() => { setLocationFilter(''); fetchFood(); }} className="reset-btn">❌ Reset</button>
        </div>
      </div>

      {loading ? (
        <p>Loading food listings...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="food-list">
          {foodList.length === 0 ? (
            <p>No food available right now. Try another location!</p>
          ) : (
            foodList.map((item) => (
              <div key={item._id} className="food-card">
                {item.image ? (
                  <img src={`${BACKEND_URL}/${item.image}`} alt={item.title} className="food-image" />
                ) : (
                  <div className="food-image placeholder">No Image</div>
                )}
                <h3>{item.title}</h3>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Expiry:</strong> {formatExpiryDate(item.expiryDate)}</p>
                {item.category && <p><strong>Category:</strong> {item.category}</p>}
                {item.coordinates && item.coordinates.lat && (
                  <p className="location-hint">📍 Precise coordinates available for navigation</p>
                )}
                <div className="claim-buttons">
                  <button 
                    className="claim-btn-route" 
                    onClick={() => showRouteConfirmation(item)} 
                    disabled={item.claimed || navigating}
                  >
                    {navigating ? '📍 Getting location...' : '🗺️ Claim with Route'}
                  </button>
                  <button 
                    className="claim-btn-simple" 
                    onClick={() => handleQuickClaim(item._id)} 
                    disabled={item.claimed}
                  >
                    ✅ Quick Claim
                  </button>
                </div>
                {item.claimed && <span className="claimed-badge">Already Claimed</span>}
              </div>
            ))
          )}
        </div>
      )}

      <h2 className="section-title">My Claimed Food ✅</h2>
      <div className="food-list">
        {claimedList.length === 0 ? (
          <p>You haven't claimed any food yet.</p>
        ) : (
          claimedList.map((item) => (
            <div key={item._id} className="food-card claimed">
              {item.image ? (
                <img src={`${BACKEND_URL}/${item.image}`} alt={item.title} className="food-image" />
              ) : (
                <div className="food-image placeholder">No Image</div>
              )}
              <h3>{item.title}</h3>
              <p><strong>Quantity:</strong> {item.quantity}</p>
              <p><strong>Location:</strong> {item.location}</p>
              <p><strong>Expiry:</strong> {formatExpiryDate(item.expiryDate)}</p>
              
              <button 
                className="navigate-btn"
                onClick={() => navigateToDonor(item)}
              >
                🗺️ Navigate to Donor
              </button>
              
              <span className="claimed-badge">✅ Claimed on {item.claimedAt?.slice(0, 10) || 'Recently'}</span>

              {!item.pickupConfirmed ? (
                <button className="pickup-btn" onClick={() => handlePickup(item._id)}>
                  🚚 Confirm Pickup
                </button>
              ) : (
                <span className="pickup-badge">✔️ Pickup Confirmed</span>
              )}
            </div>
          ))
        )}
      </div>

      {recommendations.length > 0 && (
        <>
          <h2 className="section-title">AI Recommendations ⭐</h2>
          <div className="food-list">
            {recommendations.slice(0, 3).map((item, idx) => (
              <div key={idx} className="food-card recommended">
                <h3>{item.title}</h3>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Expiry:</strong> {formatExpiryDate(item.expiryDate)}</p>
                <span className="recommended-badge">⭐ Recommended for you</span>
                <button className="claim-btn-route" onClick={() => showRouteConfirmation(item)}>
                  🗺️ Claim with Route
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {optimizedRoute.length > 0 && (
        <>
          <h2 className="section-title">Optimized Pickup Route 🚚</h2>
          <div className="route-list">
            {optimizedRoute.map((stop, idx) => (
              <div key={idx} className="route-card">
                <h3>{stop.title}</h3>
                <p><strong>Location:</strong> {stop.location}</p>
                <p><strong>Expiry:</strong> {formatExpiryDate(stop.expiryDate)}</p>
                {stop.coordinates && (
                  <button 
                    className="navigate-btn"
                    onClick={() => {
                      getCurrentLocation()
                        .then(receiverLoc => {
                          openGoogleMaps(receiverLoc, stop.coordinates);
                        })
                        .catch(() => {
                          const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(stop.location)}`;
                          window.open(mapsUrl, '_blank');
                        });
                    }}
                  >
                    🗺️ Navigate
                  </button>
                )}
                {!stop.pickupConfirmed && (
                  <button className="pickup-btn" onClick={() => handlePickup(stop.id)}>
                    🚚 Confirm Pickup
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReceiverDashboard;

