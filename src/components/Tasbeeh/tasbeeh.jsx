import { useState, useRef, useEffect } from "react";
import "./tasbeeh.css";

const Tasbeeh = () => {
  const [count, setCount] = useState(0);
  const [circleCount, setCircleCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTasbeeh, setSelectedTasbeeh] = useState("subhanAllah");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState("bead");

  // Create ref for audio element
  const audioRef = useRef(null);

  // Sound URLs
  const soundOptions = {
    bead: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3",
    click: "https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3",
    tick: "https://assets.mixkit.co/sfx/preview/mixkit-simple-metronome-991.mp3",
    bell: "https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3",
  };

  const tasbeehOptions = {
    subhanAllah: {
      text: "سبحان الله",
      translation: "Glory be to Allah",
      pronunciation: "Subhan Allah",
    },
    alhamdulillah: {
      text: "الحمد لله",
      translation: "Praise be to Allah",
      pronunciation: "Alhamdulillah",
    },
    allahuAkbar: {
      text: "الله أكبر",
      translation: "Allah is the Greatest",
      pronunciation: "Allahu Akbar",
    },
    laIlahaIllallah: {
      text: "لا إله إلا الله",
      translation: "There is no god but Allah",
      pronunciation: "La ilaha illa Allah",
    },
  };

  const incrementCount = () => {
    setCount((prev) => {
      const newCount = prev + 1;

      if (newCount % 33 === 0) {
        setCircleCount((c) => c + 1);
        // Play completion sound when reaching 33
        if (soundEnabled) {
          const audio = new Audio(soundOptions.bell);
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
        return 0;
      }

      return newCount;
    });

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Play click sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
  };

  const resetCount = () => {
    setCount(0);
    setCircleCount(0);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const changeSoundType = (type) => {
    setSoundType("bead");
    if (soundEnabled && audioRef.current) {
      audioRef.current.src = soundOptions["bead"];
      audioRef.current.load();
      // Play preview sound
      setTimeout(() => {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
      }, 100);
    }
  };

  // Initialize audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = soundOptions[soundType];
      audioRef.current.load();
    }
  }, [soundType]);

  useEffect(() => {
    if (!isAnimating) return;
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [isAnimating]);

  return (
    <div className={`tasbeeh-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      <div className="header">
        <div className="header-controls">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button
            className={`sound-toggle ${
              soundEnabled ? "sound-on" : "sound-off"
            }`}
            onClick={toggleSound}
          >
            {soundEnabled ? "🔊 Sound On" : "🔇 Muted"}
          </button>
        </div>
      </div>

      <div className="tasbeeh-selector">
        {Object.keys(tasbeehOptions).map((key) => (
          <button
            key={key}
            className={`tasbeeh-option ${
              selectedTasbeeh === key ? "active" : ""
            }`}
            onClick={() => setSelectedTasbeeh(key)}
          >
            {tasbeehOptions[key].text}
          </button>
        ))}
      </div>

      <div className="tasbeeh-display">
        <div className="arabic-text">
          {tasbeehOptions[selectedTasbeeh].text}
        </div>
        <div className="translation">
          {tasbeehOptions[selectedTasbeeh].translation}
        </div>
        <div className="pronunciation">
          ({tasbeehOptions[selectedTasbeeh].pronunciation})
        </div>
      </div>

      <button
        className={`counter-button ${isAnimating ? "animate" : ""}`}
        onClick={incrementCount}
      >
        <div className="count">{count}</div>
        <div className="label">Tap to Count</div>
      </button>

      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${Math.min((count / 33) * 100, 100)}%` }}
        ></div>
        <div className="progress-text">{count}/33</div>
      </div>

      <div className="circle-counter">
        <div className="circle-label">Completed Cycles:</div>
        <div className="circle-count">{circleCount}</div>
      </div>

      {/* Sound Selector Section */}
      {/* {soundEnabled && (
        <div className="sound-selector">
          <h4>Sound Type:</h4>
          <div className="sound-options">
            <button
              className={`sound-option ${soundType === "bead" ? "active" : ""}`}
              onClick={() => changeSoundType("bead")}
            >
              🧿 Bead
            </button>
            <button
              className={`sound-option ${soundType === "click" ? "active" : ""}`}
              onClick={() => changeSoundType("click")}
            >
              🖱️ Click
            </button>
            <button
              className={`sound-option ${soundType === "tick" ? "active" : ""}`}
              onClick={() => changeSoundType("tick")}
            >
              ⏰ Tick
            </button>
            <button
              className={`sound-option ${soundType === "bell" ? "active" : ""}`}
              onClick={() => changeSoundType("bell")}
            >
              🔔 Bell
            </button>
          </div>
        </div>
      )} */}

      <button className="reset-button" onClick={resetCount}>
        Reset Counter
      </button>

      <div className="instructions">
        <p>
          Tap the circle to count each recitation. After 33 counts, it will
          automatically reset and increment the cycle counter.
        </p>
      </div>
    </div>
  );
};

export default Tasbeeh;
