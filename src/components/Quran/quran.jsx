// src/pages/QuranPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./quran.css";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const QuranPage = () => {
  const [quranData, setQuranData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedAyahs, setCompletedAyahs] = useState([]);
  const [isSurahInfoExpanded, setIsSurahInfoExpanded] = useState(false);

  const audioRef = useRef(null);
  const ayahRefs = useRef([]);
  const containerRef = useRef(null);
  const progressAnimationRef = useRef(null);
  const playbackRate = 1.25;

  // Get current surah data safely
  const currentSurahData = quranData?.surahs[currentSurah - 1];

  useEffect(() => {
    const fetchQuran = async () => {
      try {
        const response = await fetch(
          "https://api.alquran.cloud/v1/quran/ar.alafasy",
        );
        if (!response.ok) throw new Error("Failed to fetch Quran data");
        const data = await response.json();
        setQuranData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuran();
  }, []);

  useEffect(() => {
    if (quranData && currentSurahData) {
      ayahRefs.current = Array(currentSurahData.ayahs.length)
        .fill()
        .map((_, i) => ayahRefs.current[i] || React.createRef());
    }
  }, [quranData, currentSurah, currentSurahData]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }
  }, []);

  const playAyah = useCallback(
    (ayahIndex) => {
      if (!currentSurahData) return;

      if (ayahIndex >= currentSurahData.ayahs.length) {
        stopPlayback();
        setCurrentAyah(0);
        setProgress(0);
        setCompletedAyahs([]);
        return;
      }

      const ayah = currentSurahData.ayahs[ayahIndex];
      setCurrentAyah(ayahIndex);

      if (audioRef.current) {
        audioRef.current.src = ayah.audio;
        audioRef.current.playbackRate = playbackRate;

        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);

            // Scroll to current ayah with smooth animation
            if (ayahRefs.current[ayahIndex]?.current) {
              ayahRefs.current[ayahIndex].current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }

            audioRef.current.onended = () => {
              setCompletedAyahs((prev) => [...prev, ayahIndex]);

              if (ayahIndex < currentSurahData.ayahs.length - 1) {
                playAyah(ayahIndex + 1);
              } else {
                setIsPlaying(false);
                setProgress(0);
              }
            };

            const updateProgress = () => {
              if (audioRef.current && !audioRef.current.paused) {
                const currentProgress =
                  (audioRef.current.currentTime / audioRef.current.duration) *
                  100;
                setProgress(currentProgress);
                progressAnimationRef.current =
                  requestAnimationFrame(updateProgress);
              }
            };

            if (progressAnimationRef.current) {
              cancelAnimationFrame(progressAnimationRef.current);
            }
            updateProgress();
          })
          .catch((err) => {
            console.error("Error playing audio:", err);
            setIsPlaying(false);
          });
      }
    },
    [currentSurahData, playbackRate, stopPlayback],
  );

  const togglePlayPause = useCallback(() => {
    if (!currentSurahData) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
    } else {
      if (
        completedAyahs.length === currentSurahData.ayahs.length ||
        currentAyah >= currentSurahData.ayahs.length
      ) {
        // Restart surah
        stopPlayback();
        setCurrentAyah(0);
        setProgress(0);
        setCompletedAyahs([]);
        playAyah(0);
      } else {
        if (audioRef.current?.paused && audioRef.current.currentTime > 0) {
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              const updateProgress = () => {
                if (audioRef.current && !audioRef.current.paused) {
                  setProgress(
                    (audioRef.current.currentTime / audioRef.current.duration) *
                      100,
                  );
                  progressAnimationRef.current =
                    requestAnimationFrame(updateProgress);
                }
              };

              if (progressAnimationRef.current) {
                cancelAnimationFrame(progressAnimationRef.current);
              }
              updateProgress();
            })
            .catch((err) => {
              console.error("Error playing audio:", err);
              setIsPlaying(false);
            });
        } else {
          playAyah(currentAyah);
        }
      }
    }
  }, [
    isPlaying,
    currentSurahData,
    completedAyahs.length,
    currentAyah,
    stopPlayback,
    playAyah,
  ]);

  const restartSurah = useCallback(() => {
    stopPlayback();
    setCurrentAyah(0);
    setProgress(0);
    setCompletedAyahs([]);
    if (isPlaying) {
      playAyah(0);
    }
  }, [isPlaying, stopPlayback, playAyah]);

  const handleSurahChange = useCallback(
    (e) => {
      const newSurah = parseInt(e.target.value);
      setCurrentSurah(newSurah);
      stopPlayback();
      setCurrentAyah(0);
      setProgress(0);
      setCompletedAyahs([]);
      setIsPlaying(false);
      setIsSurahInfoExpanded(false);

      // Scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    },
    [stopPlayback],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (!quranData || !currentSurahData)
    return <div className="error-message">No data available</div>;

  return (
    <div className="quran-app" ref={containerRef}>
      {/* Header with gradient */}
      <div className="app-header">
        <h1 className="app-title">
          <span className="title-arabic">القرآن الكريم</span>
          <span className="title-english">Al-Quran Al-Kareem</span>
        </h1>
      </div>

      {/* Surah Selection and Controls */}
      <div className="controls-section">
        <div className="surah-selector-wrapper">
          <select
            value={currentSurah}
            onChange={handleSurahChange}
            className="surah-select"
            aria-label="Select Surah"
          >
            {quranData.surahs.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {surah.number.toString().padStart(3, "0")}. {surah.englishName}
              </option>
            ))}
          </select>
          <span className="select-arrow">▼</span>
        </div>

        <div className="playback-controls">
          <button
            onClick={togglePlayPause}
            className={`control-btn ${isPlaying ? "pause" : "play"}`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <span className="btn-icon">{isPlaying ? "⏸" : "▶"}</span>
            <span className="btn-text">{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <button
            onClick={restartSurah}
            className="control-btn restart"
            aria-label="Restart Surah"
          >
            <span className="btn-icon">↺</span>
            <span className="btn-text">Restart</span>
          </button>
        </div>
      </div>

      {/* Surah Info Card */}
      {currentSurahData && (
        <div
          className={`surah-info-card ${isSurahInfoExpanded ? "expanded" : ""}`}
          onClick={() => setIsSurahInfoExpanded(!isSurahInfoExpanded)}
        >
          <div className="surah-info-header">
            <div className="surah-badge">
              <span className="surah-number">{currentSurahData.number}</span>
            </div>
            <div className="surah-titles">
              <h2 className="surah-name-arabic">{currentSurahData.name}</h2>
              <h3 className="surah-name-english">
                {currentSurahData.englishName}
              </h3>
            </div>
            <button className="expand-btn" aria-label="Toggle surah info">
              {isSurahInfoExpanded ? "−" : "+"}
            </button>
          </div>

          {isSurahInfoExpanded && (
            <div className="surah-info-expanded">
              <p className="surah-translation">
                {currentSurahData.englishNameTranslation}
              </p>
              <div className="surah-meta">
                <span className="meta-item">
                  <span className="meta-label">Ayahs</span>
                  <span className="meta-value">
                    {currentSurahData.ayahs.length}
                  </span>
                </span>
                <span className="meta-divider">•</span>
                <span className="meta-item">
                  <span className="meta-label">Revelation</span>
                  <span className="meta-value">
                    {currentSurahData.revelationType}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {isPlaying && (
        <div className="global-progress">
          <div
            className="global-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Ayah Container */}
      <div className="ayah-container">
        {currentSurahData.ayahs.map((ayah, index) => (
          <div
            key={ayah.number}
            ref={ayahRefs.current[index]}
            className={`ayah-card 
              ${currentAyah === index ? "current" : ""} 
              ${completedAyahs.includes(index) ? "completed" : ""}
              ${!completedAyahs.includes(index) && currentAyah > index ? "pending" : ""}
            `}
          >
            {/* Ayah Number Badge */}
            <div className="ayah-number-badge">{ayah.numberInSurah}</div>

            {/* Arabic Text with Gradient Fill */}
            <div className="arabic-container">
              <p className="arabic-text">
                {ayah.text.split("").map((char, charIndex) => {
                  const isCompleted = completedAyahs.includes(index);
                  const isCurrent = currentAyah === index && isPlaying;
                  const highlightThreshold = Math.floor(
                    (ayah.text.length * progress) / 100,
                  );
                  const shouldHighlight =
                    isCompleted ||
                    (isCurrent && charIndex <= highlightThreshold);

                  return (
                    <span
                      key={charIndex}
                      className={`arabic-char ${shouldHighlight ? "filled" : ""}`}
                      style={{
                        transitionDelay: shouldHighlight
                          ? `${charIndex * 20}ms`
                          : "0ms",
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>

              {/* Decorative Line */}
              <div className="arabic-decoration">
                <span className="decoration-line" />
                <span className="decoration-dot" />
              </div>
            </div>

            {/* Translation */}
            <div className="translation-container">
              <p className="translation-text">{ayah.translation}</p>
            </div>
          </div>
        ))}
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export default QuranPage;
