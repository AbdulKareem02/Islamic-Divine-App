// src/pages/PrayerTimesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import "./prayerTimings.css";
import { Link } from "react-router-dom";

const PrayerTimesPage = () => {
  const [prayerTimes, setPrayerTimes] = useState(() => {
    // Try to get cached prayer times from localStorage
    const cached = localStorage.getItem("cachedPrayerTimes");
    const cachedDate = localStorage.getItem("cachedPrayerDate");
    const today = new Date().toISOString().split("T")[0];

    if (cached && cachedDate === today) {
      return JSON.parse(cached);
    }
    return null;
  });

  const [location, setLocation] = useState(() => {
    // Try to get cached location from localStorage
    const cached = localStorage.getItem("cachedPrayerLocation");
    if (cached) {
      return JSON.parse(cached);
    }
    return {
      city: "",
      country: "",
      latitude: null,
      longitude: null,
    };
  });

  const [loading, setLoading] = useState(!prayerTimes); // Only load if no cache
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchCity, setSearchCity] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(() => {
    const cached = localStorage.getItem("cachedDisplayLocation");
    return cached || "";
  });
  const [expanded, setExpanded] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState(() => {
    const cached = localStorage.getItem("cachedCurrentPrayer");
    return cached ? JSON.parse(cached) : null;
  });
  const [nextPrayer, setNextPrayer] = useState(() => {
    const cached = localStorage.getItem("cachedNextPrayer");
    return cached ? JSON.parse(cached) : null;
  });
  const [timeToNextPrayer, setTimeToNextPrayer] = useState("");

  const containerRef = useRef(null);
  const azanAudioRef = useRef(null);
  const azanPlayedRef = useRef(false);
  const azaanTestPlayedRef = useRef(false); // For manual testing
  const prayerTimesFetchedRef = useRef(false);

  // Prayer names with Arabic
  const prayers = [
    { key: "Fajr", name: "Fajr", arabic: "الفجر" },
    { key: "Sunrise", name: "Sunrise", arabic: "الشروق" },
    { key: "Dhuhr", name: "Dhuhr", arabic: "الظهر" },
    { key: "Asr", name: "Asr", arabic: "العصر" },
    { key: "Maghrib", name: "Maghrib", arabic: "المغرب" },
    { key: "Isha", name: "Isha", arabic: "العشاء" },
  ];

  // Cache prayer data to localStorage
  const cachePrayerData = (data) => {
    if (!data) return;

    localStorage.setItem("cachedPrayerTimes", JSON.stringify(data));
    localStorage.setItem("cachedPrayerDate", date);
    localStorage.setItem("cachedPrayerLocation", JSON.stringify(location));
    localStorage.setItem("cachedDisplayLocation", displayLocation);

    // Also cache current and next prayer calculations
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayerTimesArray = prayers
      .map((prayer) => ({
        ...prayer,
        time: data.timings[prayer.key],
        minutes: convertTimeToMinutes(data.timings[prayer.key]),
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

    localStorage.setItem("cachedCurrentPrayer", JSON.stringify(current));
    localStorage.setItem("cachedNextPrayer", JSON.stringify(next));

    setCurrentPrayer(current);
    setNextPrayer(next);
  };

  // Initialize audio on component mount
  useEffect(() => {
    azanAudioRef.current = new Audio("/azan.mpeg");

    // Optional: Preload the audio
    azanAudioRef.current.load();

    return () => {
      if (azanAudioRef.current) {
        azanAudioRef.current.pause();
        azanAudioRef.current = null;
      }
    };
  }, []);

  // Function to fetch and cache prayer times for next day at midnight
  const preloadNextDayPrayerTimes = async (lat, lng) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${tomorrowStr}?latitude=${lat}&longitude=${lng}&method=2`,
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("tomorrowPrayerTimes", JSON.stringify(data.data));
        localStorage.setItem("tomorrowPrayerDate", tomorrowStr);
        console.log("Next day prayer times preloaded");
      }
    } catch (error) {
      console.error("Failed to preload next day prayer times:", error);
    }
  };

  // Check if we need to refresh cached data (new day or location changed)
  useEffect(() => {
    const cachedDate = localStorage.getItem("cachedPrayerDate");
    const today = new Date().toISOString().split("T")[0];

    if (cachedDate !== today || !prayerTimes) {
      fetchPrayerTimes();
    } else {
      // Data is cached and still valid
      setLoading(false);
    }
  }, [date]);

  // Fetch user's current location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      // Check if we have cached location
      const cachedLocation = localStorage.getItem("cachedPrayerLocation");
      if (cachedLocation) {
        const parsedLocation = JSON.parse(cachedLocation);
        setLocation(parsedLocation);

        // Check if cached data is for today
        const cachedDate = localStorage.getItem("cachedPrayerDate");
        const today = new Date().toISOString().split("T")[0];

        if (cachedDate === today) {
          setLoading(false);
        } else {
          fetchPrayerTimes();
        }

        return;
      }

      // No cache, get fresh location
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

      const newLocation = {
        city:
          data.address.city ||
          data.address.town ||
          data.address.village ||
          "Unknown",
        country: data.address.country || "",
        latitude: lat,
        longitude: lng,
      };

      setLocation(newLocation);
      localStorage.setItem("cachedPrayerLocation", JSON.stringify(newLocation));

      const locationName = `${data.address.city || data.address.town || data.address.village || "Your Location"}, ${data.address.country || ""}`;
      const displayName =
        type === "current" ? `${locationName} (Current)` : locationName;

      setDisplayLocation(displayName);
      localStorage.setItem("cachedDisplayLocation", displayName);

      // Preload next day prayer times
      preloadNextDayPrayerTimes(lat, lng);
    } catch (error) {
      const newLocation = {
        city: type === "current" ? "Your Location" : "Searched Location",
        country: "",
        latitude: lat,
        longitude: lng,
      };

      setLocation(newLocation);
      localStorage.setItem("cachedPrayerLocation", JSON.stringify(newLocation));

      const displayName =
        type === "current" ? "Your Current Location" : "Searched Location";
      setDisplayLocation(displayName);
      localStorage.setItem("cachedDisplayLocation", displayName);

      // Preload next day prayer times even if reverse geocoding fails
      preloadNextDayPrayerTimes(lat, lng);
    }
  };

  const setDefaultLocation = () => {
    const defaultLocation = {
      city: "Mecca",
      country: "Saudi Arabia",
      latitude: 21.3891,
      longitude: 39.8579,
    };

    setLocation(defaultLocation);
    localStorage.setItem(
      "cachedPrayerLocation",
      JSON.stringify(defaultLocation),
    );

    const displayName = "Mecca, Saudi Arabia";
    setDisplayLocation(displayName);
    localStorage.setItem("cachedDisplayLocation", displayName);

    // Preload next day prayer times for default location
    preloadNextDayPrayerTimes(21.3891, 39.8579);
  };

  // Fetch prayer times when location changes
  useEffect(() => {
    if (
      location.latitude &&
      location.longitude &&
      !prayerTimesFetchedRef.current
    ) {
      const cachedDate = localStorage.getItem("cachedPrayerDate");
      const today = new Date().toISOString().split("T")[0];

      if (cachedDate !== today) {
        fetchPrayerTimes();
      }
      prayerTimesFetchedRef.current = true;
    }
  }, [location]);

  // Calculate current and next prayer when prayerTimes change
  useEffect(() => {
    if (prayerTimes) {
      calculateCurrentAndNextPrayer();
    }
  }, [prayerTimes]);

  // Update time to next prayer every second for better accuracy
  useEffect(() => {
    let interval;

    const updateTimer = () => {
      if (nextPrayer && nextPrayer.time) {
        calculateTimeToNextPrayer();
        checkAndPlayAzaan(); // Check if it's 1 minute before prayer
      }
    };

    if (nextPrayer) {
      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 1000); // Update every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
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
      cachePrayerData(data.data);

      // Preload next day prayer times
      preloadNextDayPrayerTimes(location.latitude, location.longitude);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentAndNextPrayer = () => {
    if (!prayerTimes) return;

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

    // Update cache
    localStorage.setItem("cachedCurrentPrayer", JSON.stringify(current));
    localStorage.setItem("cachedNextPrayer", JSON.stringify(next));
  };

  const calculateTimeToNextPrayer = () => {
    if (!nextPrayer || !nextPrayer.time) return;

    const now = new Date();
    const currentSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const [timeStr, period] = nextPrayer.time.split(" ");
    let [hours, minutes] = timeStr.split(":").map(Number);

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const nextSeconds = hours * 3600 + minutes * 60;

    let diff = nextSeconds - currentSeconds;
    if (diff < 0) diff += 24 * 3600;

    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;

    // Format time string
    if (hrs > 0) {
      setTimeToNextPrayer(`${hrs}h ${mins}m ${secs}s`);
    } else if (mins > 0) {
      setTimeToNextPrayer(`${mins}m ${secs}s`);
    } else {
      setTimeToNextPrayer(`${secs}s`);
    }
  };

  const checkAndPlayAzaan = () => {
    if (!nextPrayer || !nextPrayer.time || azanPlayedRef.current) return;

    const now = new Date();
    const currentSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const [timeStr, period] = nextPrayer.time.split(" ");
    let [hours, minutes] = timeStr.split(":").map(Number);

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const prayerSeconds = hours * 3600 + minutes * 60;

    // Calculate 1 minute before prayer
    const oneMinuteBefore = prayerSeconds - 60;

    // Adjust for midnight wrap-around
    let diff;
    if (oneMinuteBefore < 0) {
      diff = 24 * 3600 + oneMinuteBefore - currentSeconds;
    } else {
      diff = oneMinuteBefore - currentSeconds;
    }

    // If we're exactly at 1 minute before prayer (with 1 second tolerance)
    if (diff >= 0 && diff <= 1) {
      playAzaanSound();
      azanPlayedRef.current = true;
    }

    // Reset flag after prayer time passes
    const prayerDiff = prayerSeconds - currentSeconds;
    if (prayerDiff <= 0) {
      azanPlayedRef.current = false;
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

      // Clear current prayer times to force fresh fetch
      setPrayerTimes(null);
      localStorage.removeItem("cachedPrayerTimes");
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

        // Clear current prayer times to force fresh fetch
        setPrayerTimes(null);
        localStorage.removeItem("cachedPrayerTimes");

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

  const formatTo12Hour = (timeString) => {
    if (!timeString) return "";

    // Handle format like "05:18 (EAT)" or "05:18 AM"
    const timePart = timeString.split(" ")[0];
    const [hoursStr, minutes] = timePart.split(":");
    let hours = parseInt(hoursStr, 10);

    // Check if it already has AM/PM
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }

    // Determine AM/PM
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert 0 -> 12

    return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // Function to play azaan sound
  const playAzaanSound = () => {
    if (azanAudioRef.current) {
      azanAudioRef.current.currentTime = 0; // Reset to start
      azanAudioRef.current.play().catch((error) => {
        console.error("Error playing azaan:", error);
      });
    }
  };

  // Clear all cached data (useful for debugging or on logout)
  const clearCache = () => {
    localStorage.removeItem("cachedPrayerTimes");
    localStorage.removeItem("cachedPrayerDate");
    localStorage.removeItem("cachedPrayerLocation");
    localStorage.removeItem("cachedDisplayLocation");
    localStorage.removeItem("cachedCurrentPrayer");
    localStorage.removeItem("cachedNextPrayer");
    localStorage.removeItem("tomorrowPrayerTimes");
    localStorage.removeItem("tomorrowPrayerDate");
  };

  // Add this useEffect to clear old cache on new day
  useEffect(() => {
    const checkAndClearCache = () => {
      const cachedDate = localStorage.getItem("cachedPrayerDate");
      const today = new Date().toISOString().split("T")[0];

      if (cachedDate !== today) {
        // Keep location cache but clear prayer times
        localStorage.removeItem("cachedPrayerTimes");
        localStorage.removeItem("cachedPrayerDate");
        localStorage.removeItem("cachedCurrentPrayer");
        localStorage.removeItem("cachedNextPrayer");
      }
    };

    checkAndClearCache();
  }, []);

  // Show cached data immediately while fetching in background
  const isShowingCachedData =
    !loading &&
    prayerTimes &&
    localStorage.getItem("cachedPrayerDate") === date;

  if (isFetchingLocation && !isShowingCachedData) {
    return (
      <div className="loading-container">
        <p>Getting your location...</p>
        <LoadingSpinner />
      </div>
    );
  }

  if (loading && !isShowingCachedData) {
    return (
      <div className="loading-container">
        <p>Loading Prayer Timings...</p>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !isShowingCachedData) {
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

  return (
    <div className="prayer-times-page" ref={containerRef}>
      {/* Header */}

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
                <p className="prayer-time">{formatTo12Hour(nextPrayer.time)}</p>
                <p className="time-remaining">in {timeToNextPrayer}</p>
              </div>
            </div>
            <Link to="/prayer-timings" className="route-link">
              <div className="show-all-prayer-link">
                <p>All Prayer Timings</p>

                <span>
                  <FaAngleRight />
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrayerTimesPage;
