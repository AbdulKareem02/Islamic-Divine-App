import React, { useEffect, useState } from "react";

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;
const COMPASS_IMAGE = "https://cdn-icons-png.flaticon.com/512/7249/7249619.png";

const toRad = (deg) => (deg * Math.PI) / 180;

function getQiblaDirection(lat, lon) {
  const latK = toRad(KAABA_LAT);
  const lonK = toRad(KAABA_LON);
  lat = toRad(lat);
  lon = toRad(lon);

  const dLon = lonK - lon;
  const y = Math.sin(dLon);
  const x = Math.cos(lat) * Math.tan(latK) - Math.sin(lat) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

export default function QiblaCompass() {
  const [heading, setHeading] = useState(0);
  const [qibla, setQibla] = useState(0);
  const [message, setMessage] = useState("Calibrating...");
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setQibla(getQiblaDirection(latitude, longitude));
      },
      () => alert("Location permission required"),
    );
  }, []);

  // Compass listener
  useEffect(() => {
    const handleOrientation = (event) => {
      let alpha = event.alpha;

      // iOS support
      if (typeof event.webkitCompassHeading === "number") {
        alpha = event.webkitCompassHeading;
      }

      if (alpha !== null) setHeading(alpha);
    };

    window.addEventListener(
      "deviceorientationabsolute",
      handleOrientation,
      true,
    );
    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
      );
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Direction message
  useEffect(() => {
    let diff = qibla - heading;
    diff = ((diff + 540) % 360) - 180;

    if (Math.abs(diff) < 3) {
      setMessage("Perfectly aligned 🕋");
    } else if (diff > 0) {
      setMessage(`Move right ${Math.abs(diff).toFixed(0)}°`);
    } else {
      setMessage(`Move left ${Math.abs(diff).toFixed(0)}°`);
    }
  }, [heading, qibla]);

  // iOS permission
  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === "granted") setPermissionGranted(true);
    } else {
      setPermissionGranted(true);
    }
  };

  const rotation = qibla - heading;

  return (
    <div style={styles.container}>
      {!permissionGranted && (
        <button onClick={requestPermission} style={styles.button}>
          Enable Compass
        </button>
      )}

      <div style={styles.compassWrapper}>
        <img
          src={COMPASS_IMAGE}
          alt="Qibla Compass"
          style={{
            ...styles.compassImage,
            transform: `rotate(${rotation}deg)`,
          }}
        />
      </div>

      <h3>{message}</h3>
      <p>Qibla: {qibla.toFixed(1)}°</p>
      <p>Heading: {heading.toFixed(1)}°</p>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    fontFamily: "Arial",
    padding: 20,
  },
  compassWrapper: {
    width: 260,
    height: 260,
    margin: "20px auto",
  },
  compassImage: {
    width: "100%",
    height: "100%",
    transition: "transform 0.2s linear",
  },
  button: {
    padding: "10px 18px",
    fontSize: 16,
    marginBottom: 15,
  },
};
