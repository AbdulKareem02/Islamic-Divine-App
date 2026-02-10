import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  FaSun,
  FaMoon,
  FaCloudSun,
  FaClock,
  FaChevronDown,
  FaMapMarkerAlt,
  FaVolumeUp,
} from "react-icons/fa";
import { GiSunrise, GiSunset } from "react-icons/gi";
import "./index.css";

/* ==============================
   CONSTANTS
============================== */
const DEFAULT_LOCATION = { lat: 21.4225, lon: 39.8262 }; // Makkah
const CACHE_KEY = "prayer_timings_cache_v1";

/* ==============================
   COMPONENT
============================== */
const NamazTimings = () => {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [timings, setTimings] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [showTimings, setShowTimings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [azaanEnabled, setAzaanEnabled] = useState(false);

  const azaanRef = useRef(null);
  const azaanPlayedRef = useRef(false);

  /* ==============================
     PRAYER DEFINITIONS
  ============================== */
  const prayers = [
    { key: "Fajr", en: "Fajr", ar: "الفجر", icon: <GiSunrise /> },
    { key: "Dhuhr", en: "Dhuhr", ar: "الظهر", icon: <FaSun /> },
    { key: "Asr", en: "Asr", ar: "العصر", icon: <FaCloudSun /> },
    { key: "Maghrib", en: "Maghrib", ar: "المغرب", icon: <GiSunset /> },
    { key: "Isha", en: "Isha", ar: "العشاء", icon: <FaMoon /> },
  ];

  const sunTimes = [
    { key: "Sunrise", label: "Sunrise", icon: <GiSunrise /> },
    { key: "Sunset", label: "Sunset", icon: <GiSunset /> },
    { key: "Midnight", label: "Midnight", icon: <FaClock /> },
  ];

  /* ==============================
     HELPERS
  ============================== */
  const convertTo12Hour = useCallback((time24) => {
    if (!time24) return "--:--";
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  }, []);

  const formatCountdown = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60),
    ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ==============================
     LIVE CLOCK
  ============================== */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ==============================
     AZAAN INIT
  ============================== */
  useEffect(() => {
    azaanRef.current = new Audio("/azaan.mpeg");
  }, []);

  /* ==============================
     LOAD CACHE (INSTANT RENDER)
  ============================== */
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setTimings(JSON.parse(cached));
      setIsLoading(false);
    }
  }, []);

  /* ==============================
     LOCATION
  ============================== */
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => {},
      { timeout: 8000 },
    );
  }, []);

  /* ==============================
     FETCH PRAYER TIMES
  ============================== */
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    fetch(
      `https://api.aladhan.com/v1/timings/${today}?latitude=${location.lat}&longitude=${location.lon}&method=2`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.code === 200) {
          setTimings(d.data.timings);
          localStorage.setItem(CACHE_KEY, JSON.stringify(d.data.timings));
        } else {
          throw new Error();
        }
      })
      .catch(() => setError("Failed to fetch prayer timings"))
      .finally(() => setIsLoading(false));
  }, [location]);

  /* ==============================
     CURRENT & NEXT PRAYER
  ============================== */
  useEffect(() => {
    if (!timings) return;

    const now = new Date();

    const prayerTimes = prayers.map((p) => {
      const [h, m] = timings[p.key].split(":").map(Number);
      const t = new Date();
      t.setHours(h, m, 0, 0);
      return { ...p, time: timings[p.key], timeObj: t };
    });

    const past = prayerTimes.filter((p) => p.timeObj <= now);
    const future = prayerTimes.filter((p) => p.timeObj > now);

    setCurrentPrayer(
      past[past.length - 1] || prayerTimes[prayerTimes.length - 1],
    );

    let next;
    if (future.length > 0) {
      next = future[0];
    } else {
      next = { ...prayerTimes[0] };
      next.timeObj.setDate(next.timeObj.getDate() + 1);
    }

    setNextPrayer(next);
    setCountdown(Math.floor((next.timeObj - now) / 1000));
    azaanPlayedRef.current = false;
  }, [timings]);

  /* ==============================
     COUNTDOWN + AZAAN
  ============================== */
  useEffect(() => {
    if (!nextPrayer) return;

    const i = setInterval(() => {
      const diff = Math.floor((nextPrayer.timeObj - new Date()) / 1000);

      if (diff <= 0) {
        setCountdown(0);

        if (azaanEnabled && !azaanPlayedRef.current && azaanRef.current) {
          azaanRef.current.currentTime = 0;
          azaanRef.current.play().catch(() => {});
          azaanPlayedRef.current = true;
        }
      } else {
        setCountdown(diff);
      }
    }, 1000);

    return () => clearInterval(i);
  }, [nextPrayer, azaanEnabled]);

  /* ==============================
     UI
  ============================== */
  if (isLoading && !timings) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading prayer timings…</p>
      </div>
    );
  }

  return (
    <div className="namaz-container">
      <img
        src="https://res.cloudinary.com/dsizcysfr/image/upload/v1767449652/1000052349-removebg-preview_pt4t97_x0z25s.png"
        alt="namaz-timings"
        className="prayer-page-banner-img"
      />
      {/* Header */}
      <div className="main-prayer-container">
        <div className="header">
          <h1 className="prayer-timings-title">Prayer Times</h1>
          <div className="current-time">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {error && <div className="error-banner">⚠ {error}</div>}

        {/* Cards */}
        <div className="prayer-cards">
          {currentPrayer && (
            <div className="prayer-card current">
              <div className="prayer-card-header">
                {currentPrayer.icon}
                <span>Current Prayer</span>
              </div>
              <div className="prayer-card-header-timer-cont">
                <div>
                  <h3>{currentPrayer.en}</h3>
                  <div className="arabic-name">{currentPrayer.ar}</div>
                </div>
                <div className="prayer-time">
                  {convertTo12Hour(currentPrayer.time)}

                  <div className="countdown-display">
                    {nextPrayer.en} Starts in {formatCountdown(countdown)}
                  </div>
                </div>{" "}
              </div>
            </div>
          )}

          {/* {nextPrayer && (
          <div className="prayer-card next">
            <div className="prayer-card-header">
              {nextPrayer.icon}
              <span>Next Prayer</span>
            </div>
            <h3>{nextPrayer.en}</h3>
            <div className="arabic-name">{nextPrayer.ar}</div>
            <div className="prayer-time">
              {convertTo12Hour(nextPrayer.time)}
            </div>
            <div className="countdown-display">
              Starts in {formatCountdown(countdown)}
            </div>
          </div>
        )} */}
        </div>

        {/* Timings */}

        <div className="timings-grid">
          <h3>Prayer Timings</h3>
          {prayers.map((p) => (
            <div key={p.key} className="timing-item">
              <span>{p.icon}</span>
              <div>
                <strong>{p.en}</strong>
                <div className="arabic-name">{p.ar}</div>
              </div>
              <span>{convertTo12Hour(timings[p.key])}</span>
            </div>
          ))}

          <h3 style={{ marginTop: 20 }}>Sun Timings</h3>
          {sunTimes.map((s) => (
            <div key={s.key} className="timing-item">
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span>{convertTo12Hour(timings[s.key])}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {/* <div className="footer">
        <FaMapMarkerAlt /> {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
      </div> */}
      </div>
    </div>
  );
};

export default NamazTimings;
