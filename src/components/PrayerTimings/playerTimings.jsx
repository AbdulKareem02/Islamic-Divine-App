// src/pages/PrayerTimesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

import "./prayerTimings.css";
import { Link } from "react-router-dom";

const PrayerTimesPage = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({
    city: "",
    country: "",
    latitude: null,
    longitude: null,
  });
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchCity, setSearchCity] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState("");

  const containerRef = useRef(null);

  // Prayer names with Arabic
  const prayers = [
    { key: "Fajr", name: "Fajr", arabic: "الفجر" },
    { key: "Sunrise", name: "Sunrise", arabic: "الشروق" },
    { key: "Dhuhr", name: "Dhuhr", arabic: "الظهر" },
    { key: "Asr", name: "Asr", arabic: "العصر" },
    { key: "Maghrib", name: "Maghrib", arabic: "المغرب" },
    { key: "Isha", name: "Isha", arabic: "العشاء" },
  ];

  // Fetch user's current location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchLocationDetails(latitude, longitude, "current");
            setIsFetchingLocation(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            setDefaultLocation();
            setIsFetchingLocation(false);
          },
        );
      } else {
        setDefaultLocation();
        setIsFetchingLocation(false);
      }
    };

    getUserLocation();
  }, []);

  const fetchLocationDetails = async (lat, lng, type = "search") => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await response.json();

      setLocation({
        city:
          data.address.city ||
          data.address.town ||
          data.address.village ||
          "Unknown",
        country: data.address.country || "",
        latitude: lat,
        longitude: lng,
      });

      const locationName = `${data.address.city || data.address.town || data.address.village || "Your Location"}, ${data.address.country || ""}`;
      setDisplayLocation(
        type === "current" ? `${locationName} (Current)` : locationName,
      );
    } catch (error) {
      setLocation({
        city: type === "current" ? "Your Location" : "Searched Location",
        country: "",
        latitude: lat,
        longitude: lng,
      });
      setDisplayLocation(
        type === "current" ? "Your Current Location" : "Searched Location",
      );
    }
  };

  const setDefaultLocation = () => {
    setLocation({
      city: "Mecca",
      country: "Saudi Arabia",
      latitude: 21.3891,
      longitude: 39.8579,
    });
    setDisplayLocation("Mecca, Saudi Arabia");
  };

  // Fetch prayer times when location or date changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      fetchPrayerTimes();
    }
  }, [location, date]);

  // Calculate current and next prayer
  useEffect(() => {
    if (prayerTimes) {
      calculateCurrentAndNextPrayer();
    }
  }, [prayerTimes]);

  // Update time to next prayer every minute
  useEffect(() => {
    if (nextPrayer) {
      const interval = setInterval(() => {
        calculateTimeToNextPrayer();
      }, 60000); // Update every minute

      calculateTimeToNextPrayer(); // Initial calculation

      return () => clearInterval(interval);
    }
  }, [nextPrayer]);

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch prayer times");
      }
      const data = await response.json();
      setPrayerTimes(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentAndNextPrayer = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayerTimesArray = prayers
      .map((prayer) => ({
        ...prayer,
        time: prayerTimes.timings[prayer.key],
        minutes: convertTimeToMinutes(prayerTimes.timings[prayer.key]),
      }))
      .sort((a, b) => a.minutes - b.minutes);

    let current = null;
    let next = null;

    for (let i = 0; i < prayerTimesArray.length; i++) {
      if (currentTime < prayerTimesArray[i].minutes) {
        next = prayerTimesArray[i];
        if (i > 0) {
          current = prayerTimesArray[i - 1];
        } else {
          current = prayerTimesArray[prayerTimesArray.length - 1];
        }
        break;
      }
    }

    if (!next) {
      current = prayerTimesArray[prayerTimesArray.length - 1];
      next = prayerTimesArray[0];
    }

    setCurrentPrayer(current);
    setNextPrayer(next);
  };

  const calculateTimeToNextPrayer = () => {
    if (!nextPrayer || !nextPrayer.time) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const nextPrayerTime = convertTimeToMinutes(nextPrayer.time);

    let minutesDiff = nextPrayerTime - currentTime;

    if (minutesDiff < 0) {
      minutesDiff += 24 * 60; // Add 24 hours if prayer is tomorrow
    }

    const hours = Math.floor(minutesDiff / 60);
    const minutes = minutesDiff % 60;

    if (hours > 0) {
      setTimeToNextPrayer(`${hours}h ${minutes}m`);
    } else {
      setTimeToNextPrayer(`${minutes}m`);
    }
  };

  const convertTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [time, period] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const handleCitySearch = async () => {
    if (!searchCity.trim()) return;

    setIsFetchingLocation(true);
    setError(null);

    try {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchCity)}&limit=5`,
      );

      if (!geocodeResponse.ok) {
        throw new Error("Failed to fetch location data");
      }

      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        throw new Error("Location not found. Please try a nearby city.");
      }

      const selectedLocation = geocodeData[0];
      await fetchLocationDetails(
        parseFloat(selectedLocation.lat),
        parseFloat(selectedLocation.lon),
        "search",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetchingLocation(false);
      setSearchCity("");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsFetchingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchLocationDetails(latitude, longitude, "current");
        setIsFetchingLocation(false);
      },
      (error) => {
        setError(
          "Unable to retrieve your location. Please enable location services.",
        );
        setIsFetchingLocation(false);
      },
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCitySearch();
    }
  };

  if (loading || isFetchingLocation) {
    return (
      <div className="loading-container">
        <p>Loading Prayer Timings...</p>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="prayer-error-container">
        <div className="prayer-error">
          <div className="error-icon">!</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={handleUseCurrentLocation} className="retry-btn">
            Use Default Location
          </button>
        </div>
      </div>
    );
  }

  const formatTo12Hour = (timeString) => {
    if (!timeString) return "";

    const [hoursStr, minutes] = timeString.split(":");
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // convert 0 -> 12

    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="prayer-times-page" ref={containerRef}>
      {/* Header */}
      <div className="prayer-header">
        <div className="header-content">
          <h1>Prayer Times</h1>
          <div className="location-info">
            <div className="location-icon">
              <FaLocationDot />
            </div>
            <div className="location-text">
              <p className="location-name">{displayLocation}</p>
              <p className="location-date">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current & Next Prayer Card */}
      {currentPrayer && nextPrayer && (
        <div className="current-next-prayer">
          <div className="current-prayer-card">
            <div className="prayer-status">
              <div className="status-indicator current"></div>
              <span>Current Prayer</span>
            </div>
            <div className="prayer-details">
              <div className="prayer-name-section">
                <h3>{currentPrayer.name}</h3>
                <p className="arabic-name">{currentPrayer.arabic}</p>
              </div>

              <div className="prayer-time-section">
                {/* <p className="prayer-time">{currentPrayer.time}</p> */}
                <p className="prayer-time">
                  {formatTo12Hour(currentPrayer.time)}
                </p>
              </div>
            </div>
            <hr className="prayer-break-line" />
            <div className="prayer-status">
              <div className="status-indicator next"></div>
              <span>Next Prayer</span>
            </div>
            <div className="prayer-details">
              <div className="prayer-name-section">
                <h3>{nextPrayer.name}</h3>
                <p className="arabic-name">{nextPrayer.arabic}</p>
              </div>
              <div className="prayer-time-section">
                {/* <p className="prayer-time">{nextPrayer.time}</p> */}
                <p className="prayer-time">{formatTo12Hour(nextPrayer.time)}</p>
                <p className="time-remaining">in {timeToNextPrayer}</p>
              </div>
            </div>
            <Link to="/" className="route-link">
              <div className="show-all-prayer-link">
                <p>All Prayer Timings</p>{" "}
                <span>
                  <FaAngleRight />
                </span>
              </div>
            </Link>
          </div>
          {/* 
          <div className="next-prayer-card">
            <div className="prayer-status">
              <div className="status-indicator next"></div>
              <span>Next Prayer</span>
            </div>
            <div className="prayer-details">
              <div className="prayer-name-section">
                <h3>{nextPrayer.name}</h3>
                <p className="arabic-name">{nextPrayer.arabic}</p>
              </div>
              <div className="prayer-time-section">
                <p className="prayer-time">{nextPrayer.time}</p>
                <p className="time-remaining">in {timeToNextPrayer}</p>
              </div>
            </div>
          </div> */}
        </div>
      )}

      {/* All Prayers Card */}
      {/* <div className={`all-prayers-card ${expanded ? "expanded" : ""}`}>
        <div className="card-header" onClick={() => setExpanded(!expanded)}>
          <h3>All Prayer Times</h3>
          <div className="expand-icon">{expanded ? "▲" : "▼"}</div>
        </div>

        {expanded && (
          <div className="prayer-times-list">
            {prayers.map((prayer) => (
              <div key={prayer.key} className="prayer-item">
                <div className="prayer-item-left">
                  <h4>{prayer.name}</h4>
                  <p className="arabic-text">{prayer.arabic}</p>
                </div>
                <div className="prayer-item-right">
                  <p className="time-text">
                    {prayerTimes?.timings[prayer.key]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* Search Section */}
      {/* <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search city..."
            className="search-input"
          />
          <button
            onClick={handleCitySearch}
            className="search-btn"
            disabled={isFetchingLocation || !searchCity.trim()}
          >
            Search
          </button>
        </div>

        <button
          className="current-location-btn"
          onClick={handleUseCurrentLocation}
          disabled={isFetchingLocation}
        >
          <span className="btn-icon">📍</span>
          Current Location
        </button>

        <div className="date-picker">
          <label htmlFor="date">Select Date:</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div> */}

      {/* Footer */}
      {/* <div className="prayer-footer">
        <p>May your prayers be accepted</p>
        <div className="footer-decoration">☪</div>
      </div> */}
    </div>
  );
};

export default PrayerTimesPage;
