import React, { useState, useEffect, useRef } from "react";
import "./kaaba.css";

const QiblaCompass = () => {
  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [rotationNeeded, setRotationNeeded] = useState(0);
  const [isFacingKaaba, setIsFacingKaaba] = useState(false);
  const [error, setError] = useState(null);
  const [calibrationNeeded, setCalibrationNeeded] = useState(true);

  const compassRef = useRef(null);
  const arrowRef = useRef(null);
  const kaabaRef = useRef(null);

  // Kaaba coordinates (Masjid al-Haram, Mecca)
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;

  // Calculate Qibla direction using user location
  const calculateQiblaDirection = (lat, lng) => {
    // Convert degrees to radians
    const toRad = (deg) => (deg * Math.PI) / 180;

    const userLatRad = toRad(lat);
    const userLngRad = toRad(lng);
    const kaabaLatRad = toRad(KAABA_LAT);
    const kaabaLngRad = toRad(KAABA_LNG);

    // Calculate Qibla direction using spherical trigonometry
    const y = Math.sin(kaabaLngRad - userLngRad);
    const x =
      Math.cos(userLatRad) * Math.tan(kaabaLatRad) -
      Math.sin(userLatRad) * Math.cos(kaabaLngRad - userLngRad);

    let qibla = Math.atan2(y, x);
    qibla = (qibla * 180) / Math.PI; // Convert to degrees

    // Normalize to 0-360 range
    qibla = (qibla + 360) % 360;

    return qibla;
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

          // Calculate Qibla direction
          const direction = calculateQiblaDirection(latitude, longitude);
          setQiblaDirection(direction);
          setError(null);
        },
        (err) => {
          setError(`Unable to get location: ${err.message}`);
          // Use default location (e.g., New York) for demo
          const defaultLat = 40.7128;
          const defaultLng = -74.006;
          setUserLocation({ latitude: defaultLat, longitude: defaultLng });
          const direction = calculateQiblaDirection(defaultLat, defaultLng);
          setQiblaDirection(direction);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Handle device orientation
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.webkitCompassHeading) {
        // iOS
        const heading = event.webkitCompassHeading;
        setCurrentHeading(heading);
      } else if (event.alpha !== null) {
        // Android and other devices
        const alpha = event.alpha; // Device orientation around z-axis (0-360)
        const beta = event.beta; // Device orientation around x-axis (-180 to 180)
        const gamma = event.gamma; // Device orientation around y-axis (-90 to 90)

        if (beta !== null && gamma !== null) {
          // Calculate heading from alpha, beta, gamma
          const heading = (Math.atan2(gamma, beta) * 180) / Math.PI;
          setCurrentHeading((heading + 360) % 360);
        } else if (alpha !== null) {
          setCurrentHeading(alpha);
        }
      }

      // Update rotation needed
      if (qiblaDirection !== 0) {
        const rotation = (currentHeading - qiblaDirection + 360) % 360;
        setRotationNeeded(rotation);

        // Check if user is facing Kaaba (within 5 degrees)
        const isFacing = Math.abs(rotation) < 5 || Math.abs(rotation - 360) < 5;
        setIsFacingKaaba(isFacing);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);

      // Request permission for iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === "granted") {
              setCalibrationNeeded(false);
            }
          })
          .catch(console.error);
      }
    } else {
      setError("Device orientation is not supported on this device.");
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [qiblaDirection, currentHeading]);

  // Smooth rotation of compass
  useEffect(() => {
    if (compassRef.current) {
      compassRef.current.style.transform = `rotate(${-currentHeading}deg)`;
    }

    if (arrowRef.current) {
      // Arrow points to Qibla direction
      arrowRef.current.style.transform = `rotate(${rotationNeeded}deg)`;
    }

    if (kaabaRef.current) {
      // Kaaba indicator blinking effect
      if (isFacingKaaba) {
        kaabaRef.current.classList.add("blinking");
      } else {
        kaabaRef.current.classList.remove("blinking");
      }
    }
  }, [currentHeading, rotationNeeded, isFacingKaaba]);

  // Get direction message
  const getDirectionMessage = () => {
    if (rotationNeeded < 5 || rotationNeeded > 355) {
      return "You are facing Kaaba! 🕋";
    }

    const rotation =
      rotationNeeded > 180 ? rotationNeeded - 360 : rotationNeeded;
    const direction = rotation > 0 ? "right" : "left";
    const degrees = Math.abs(Math.round(rotation));

    return `Turn ${degrees}° ${direction} to face Kaaba`;
  };

  const calibrateDevice = () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            setCalibrationNeeded(false);
          }
        })
        .catch(console.error);
    }
  };

  return (
    <div className="qibla-compass-container">
      <div className="header">
        <h1>Qibla Compass 🕋</h1>
        {userLocation.latitude && (
          <p className="location-info">
            Location: {userLocation.latitude.toFixed(4)}°,{" "}
            {userLocation.longitude.toFixed(4)}°
          </p>
        )}
      </div>

      {calibrationNeeded && (
        <div className="calibration-alert">
          <p>Calibration needed! Move your device in a figure-8 pattern</p>
          <button onClick={calibrateDevice}>Calibrate Now</button>
        </div>
      )}

      <div className="compass-wrapper">
        {/* Compass base */}
        <div className="compass-base" ref={compassRef}>
          <img
            src="https://www.thegreatapps.com/application/upload/Apps/2017/10/qibla-compass-159.png"
            alt="Compass"
            className="compass-image"
          />

          {/* Direction markers */}
          <div className="direction-marker n">N</div>
          <div className="direction-marker s">S</div>
          <div className="direction-marker e">E</div>
          <div className="direction-marker w">W</div>
          <div className="direction-marker ne">NE</div>
          <div className="direction-marker nw">NW</div>
          <div className="direction-marker se">SE</div>
          <div className="direction-marker sw">SW</div>

          {/* Kaaba direction indicator */}
          <div className="kaaba-direction" ref={arrowRef}>
            <div className="kaaba-arrow">🕋</div>
            <div className="kaaba-text">Kaaba</div>
          </div>
        </div>

        {/* Fixed overlay with center dot */}
        <div className="compass-overlay">
          <div className="center-dot"></div>
          <div className="direction-line"></div>

          {/* Kaaba facing indicator */}
          <div
            className={`kaaba-indicator ${isFacingKaaba ? "facing" : ""}`}
            ref={kaabaRef}
          >
            {isFacingKaaba ? "Facing Kaaba!" : "Turn to Kaaba"}
          </div>
        </div>
      </div>

      {/* Information display */}
      <div className="info-panel">
        <div className="info-card">
          <h3>Direction Information</h3>
          <p className="direction-message">{getDirectionMessage()}</p>
          <div className="data-grid">
            <div className="data-item">
              <span className="data-label">Qibla Direction:</span>
              <span className="data-value">{Math.round(qiblaDirection)}°</span>
            </div>
            <div className="data-item">
              <span className="data-label">Current Heading:</span>
              <span className="data-value">{Math.round(currentHeading)}°</span>
            </div>
            <div className="data-item">
              <span className="data-label">Rotation Needed:</span>
              <span className="data-value">{Math.round(rotationNeeded)}°</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>Hold your device flat and parallel to the ground</li>
            <li>Rotate slowly to find the Qibla direction</li>
            <li>Green indicator means you're facing Kaaba</li>
            <li>
              Move device in figure-8 pattern if compass needs calibration
            </li>
          </ul>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default QiblaCompass;
