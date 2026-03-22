import React, { useState } from 'react';
import './PredictiveStrip.css';

const PredictiveStrip = ({ recommendations, route, forecasts, handlePickup, handleClaim }) => {
  const [active, setActive] = useState('');

  const previewText = {
    recommendations: recommendations.length ? `${recommendations.length} items` : 'No recommendations yet',
    route: route.length ? `${route.length} stops` : 'No route available',
    forecasts: forecasts.length ? `${forecasts.length} categories` : 'No forecast data'
  };

  return (
    <div className="predictive-strip">
      {/* Top Cards */}
      <div className={`predictive-card ${active === 'recommendations' ? 'active' : ''}`} onClick={() => setActive('recommendations')}>
        <span>⭐</span>
        <h4>Recommendations</h4>
        <p>{previewText.recommendations}</p>
      </div>
      <div className={`predictive-card ${active === 'route' ? 'active' : ''}`} onClick={() => setActive('route')}>
        <span>🚚</span>
        <h4>Pickup Route</h4>
        <p>{previewText.route}</p>
      </div>
      <div className={`predictive-card ${active === 'forecasts' ? 'active' : ''}`} onClick={() => setActive('forecasts')}>
        <span>📅</span>
        <h4>Forecasts</h4>
        <p>{previewText.forecasts}</p>
      </div>

      {/* Expanded Sections */}
      {active === 'recommendations' && (
        <div className="predictive-details">
          <h3>Recommended For You ⭐</h3>
          <div className="food-list">
            {recommendations.map((item) => (
              <div key={item._id} className="food-card recommended">
                {item.image ? (
                  <img src={`http://localhost:5000/${item.image}`} alt={item.title} className="food-image" />
                ) : (
                  <div className="food-image placeholder">No Image</div>
                )}
                <h3>{item.title}</h3>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Expiry:</strong> {item.expiryDate?.slice(0, 10)}</p>
                <span className="recommended-badge">⭐ Recommended</span>
                <button className="claim-btn" onClick={() => handleClaim(item._id)} disabled={item.claimed}>
                  {item.claimed ? 'Already Claimed' : '✅ Claim'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'route' && (
        <div className="predictive-details">
          <h3>Optimized Pickup Route 🚚</h3>
          <div className="route-list">
            {route.map((stop) => (
              <div key={stop.id} className="route-card">
                <h3>{stop.title}</h3>
                <p><strong>Location:</strong> {stop.location}</p>
                <p><strong>Distance:</strong> {stop.distanceKm?.toFixed(2)} km</p>
                {stop.pickupConfirmed ? (
                  <span className="pickup-badge">✔️ Pickup Confirmed</span>
                ) : (
                  <button className="pickup-btn" onClick={() => handlePickup(stop.id)}>
                    🚚 Confirm Pickup
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'forecasts' && (
        <div className="predictive-details">
          <h3>Availability Forecasts 📅</h3>
          <div className="forecast-list">
            {forecasts.map((f, idx) => (
              <div key={idx} className="forecast-card">
                <h3>{f.category}</h3>
                <p>{f.prediction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveStrip;
