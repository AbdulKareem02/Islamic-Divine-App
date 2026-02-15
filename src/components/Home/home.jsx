import React, { useState, useEffect, useRef } from "react";
import "./home.css";
import { Link } from "react-router-dom";
import PrayerTimesPage from "../PrayerTimings/playerTimings";
import QiblaCompass from "../Kaaba/kaaba";

const IslamicHome = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="islamic-lifestyle-app">
      {/* Header Section */}
      <header className="app-header">
        <div className="stars-container">
          {/* Multiple stars with different sizes and animation delays */}
          <div className="star star-1"></div>
          <div className="star star-2"></div>
          <div className="star star-3"></div>
          <div className="star star-4"></div>
          <div className="star star-5"></div>
          <div className="star star-6"></div>
          <div className="star star-7"></div>
          <div className="star star-8"></div>
          <div className="star star-9"></div>
          <div className="star star-10"></div>
        </div>

        <div className="header-content">
          <h1 className="app-title">Islamic Divine</h1>

          {/* <div className="prayer-indicator">
            <span className="prayer-label">Next Prayer:</span>
            <span className="prayer-name">Asr</span>
            <span className="prayer-time">04:30 PM</span>
          </div> */}

          <div className="quick-info-head">
            {/* <div className="prayer-time">
              <h4>Hijiri Date</h4>
              <h6>Shaban 1147, 20</h6>
            </div> */}

            <div className="home-prayer-time">
              <h4>Hijiri Date</h4>
              <h2>1147</h2>
            </div>
          </div>

          <img
            src="https://res.cloudinary.com/dsizcysfr/image/upload/v1769789162/1000083159_bg_removed.png_di0sqo.png"
            alt="Islamic Divine"
            className="home-banner-img"
          />
        </div>
      </header>

      <div className="quick-tabs">
        <div className="quick-card">
          <img
            src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768139807/qibla_10913318_crtvli.png"
            alt=""
            className="quick-acc-icon"
          />
          <span>Qibla</span>
        </div>

        <Link to="/calender" className="route-link">
          <div className="quick-card">
            <img
              src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768139806/ramadan_6706288_aytrja.png"
              alt=""
              className="quick-acc-icon"
            />
            <span>Calender</span>
          </div>
        </Link>
        <Link to="/tasbeeh" className="route-link">
          <div className="quick-card">
            <img
              src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768139809/beads_2397486_jicbam.png"
              alt=""
              className="quick-acc-icon"
            />
            <span>Tasbeeh</span>
          </div>
        </Link>
        <div className="quick-card">
          <img
            src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768139808/salah_7171885_xyhhjq.png"
            alt=""
            className="quick-acc-icon"
          />
          <span>Dua</span>
        </div>
        <div className="quick-card">
          <img
            src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768139806/allah_7161428_jwwhn6.png"
            alt=""
            className="quick-acc-icon"
          />
          <span>Names</span>
        </div>
        <div className="quick-card">
          <img
            src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768139707/1000066380-removebg-preview_e83dim.png"
            alt=""
            className="quick-acc-icon"
          />
          <span>Dhikir</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="home-main-content">
        {/* Namaz Timings Card */}
        {/* <div className="card namaz-card">
          <div className="card-header">
            <span className="card-icon">🕋</span>
            <div className="card-title-group">
              <h2 className="card-title">Namaz Timings</h2>
              <p className="card-subtitle">Today's prayer schedule</p>
            </div>
            <span className="card-arrow">→</span>
          </div>
          <div className="prayer-times">
            <div className="prayer-time-item">
              <span className="prayer-name-small">Fajr</span>
              <span className="prayer-time-small">04:30 AM</span>
            </div>
            <div className="prayer-time-item">
              <span className="prayer-name-small">Dhuhr</span>
              <span className="prayer-time-small">12:15 PM</span>
            </div>
            <div className="prayer-time-item">
              <span className="prayer-name-small">Asr</span>
              <span className="prayer-time-small">04:30 PM</span>
            </div>
            <div className="prayer-time-item">
              <span className="prayer-name-small">Maghrib</span>
              <span className="prayer-time-small">06:45 PM</span>
            </div>
            <div className="prayer-time-item">
              <span className="prayer-name-small">Isha</span>
              <span className="prayer-time-small">08:00 PM</span>
            </div>
          </div>
        </div> */}

        <PrayerTimesPage />
        <Link to="/listen-quran">
          <div className="listen-quran-card">
            <img
              src="https://res.cloudinary.com/dsizcysfr/image/upload/v1769354991/Listen_Audio_Quran_20260125_205534_0000_bzdnqp.png"
              alt="listen-quran"
              className="listen-quran-img"
            />
          </div>
        </Link>

        {/* <div className="card prayer-card">
          <div className="card-header">
            <span className="card-icon">🕌</span>
            <div className="card-title-group">
              <h2 className="card-title">for Daily Prayers</h2>
              <p className="card-subtitle">
                5 daily prayers with accurate timings
              </p>
            </div>
            <span className="card-arrow">→</span>
          </div>
        </div> */}

        {/* Qibla Compass Card */}
        {/* <div className="card qibla-card">
          <div className="card-header">
            <span className="card-icon">🧭</span>
            <div className="card-title-group">
              <h2 className="card-title">Qibla Compass</h2>
              <p className="card-subtitle">Find prayer direction accurately</p>
            </div>
            <span className="card-arrow">→</span>
          </div>
          <div className="location-display">
            <span className="location-icon">📍</span>
            <span className="location-text">Rajshahi, Bangladesh</span>
          </div>
        </div> */}

        {/* AI Quran Card */}
        {/* <div className="card quran-card">
          <div className="card-header">
            <span className="card-icon">📖</span>
            <div className="card-title-group">
              <h2 className="card-title">AI-Quran</h2>
              <p className="card-subtitle">Smart recitation & translation</p>
            </div>
            <span className="card-arrow">→</span>
          </div>
        </div> */}

        {/* Time & Location Section */}
        {/* <div className="time-location-section">
          <div className="time-display">
            <span className="time-icon">🕒</span>
            <div className="time-content">
              <span className="current-time">{currentTime}</span>
              <span className="time-label">Current Time</span>
            </div>
          </div>
          <div className="hijri-date">
            <span className="hijri-icon">🌙</span>
            <span className="hijri-text">15 Ramadan 1445</span>
          </div>
        </div> */}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="nav-container">
          <button
            className={`nav-item ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <img
              src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768141633/home_18020336_n0drdk.png"
              alt=""
              className="nav-icon"
            />

            <span className="nav-label">Home</span>
          </button>
          <button
            className={`nav-item ${activeTab === "quran" ? "active" : ""}`}
            onClick={() => setActiveTab("quran")}
          >
            <img
              src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768729011/trophy_pjhyqw.png"
              alt=""
              className="nav-icon"
            />
            <span className="nav-label">Quiz</span>
          </button>
          <button
            className={`nav-item ${activeTab === "prayer" ? "active" : ""}`}
            onClick={() => setActiveTab("prayer")}
          >
            <div className="nav-center-button">
              <img
                src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768728586/recite_ijjq63.png"
                alt=""
                className="nav-icon-center"
              />
            </div>
            <span className="nav-label ">Quran</span>
          </button>
          <button
            className={`nav-item ${activeTab === "qibla" ? "active" : ""}`}
            onClick={() => setActiveTab("qibla")}
          >
            <img
              src="https://res.cloudinary.com/dsizcysfr/image/upload/v1768729087/qibla_uy8ux5.png"
              alt=""
              className="nav-icon"
            />
            <span className="nav-label">Qibla</span>
          </button>
          <button
            className={`nav-item ${activeTab === "more" ? "active" : ""}`}
            onClick={() => setActiveTab("more")}
          >
            <span className="nav-icon">⋮</span>
            <span className="nav-label">More</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      {/* <footer className="app-footer">
        <div className="footer-content">
          <div className="branding">
            <span className="brand-icon">☪️</span>
            <span className="brand-name">Islamic Lifestyle App</span>
          </div>
          <div className="social-handle">
            <span className="handle-prefix">@</span>
            netrosystems
          </div>
          <p className="tagline">Your daily companion for spiritual growth</p>
        </div>
      </footer> */}

      <QiblaCompass />
    </div>
  );
};

export default IslamicHome;
