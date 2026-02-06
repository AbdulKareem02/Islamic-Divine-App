import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Moon,
  MoonStar,
} from "lucide-react";
import "./calenderPage.css";

const Calender = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hijriDates, setHijriDates] = useState({});
  const [hijriHeader, setHijriHeader] = useState("");
  let currentDate = new Date();
  // Generate Gregorian calendar days for current month
  const getGregorianCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  // Enhanced Hijri date formatting with proper Islamic month names
  // Enhanced Hijri date formatter with full month names (browser-consistent)
  // ✅ Full and consistent Hijri date formatter for all browsers
  const formatHijriDate = useCallback((date) => {
    // Full official English Hijri month names (Umm al-Qura calendar)
    const islamicMonths = [
      "Muharram",
      "Safar",
      "Rabiʽ al-Awwal",
      "Rabiʽ al-Thani",
      "Jumada al-Awwal",
      "Jumada al-Thani",
      "Rajab",
      "Shaʽban",
      "Ramadan",
      "Shawwal",
      "Dhu al-Qaʽdah",
      "Dhu al-Hijjah",
    ];

    try {
      // Use the Islamic (Umm al-Qura) calendar system
      const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "numeric", // numeric so we can map manually
        year: "numeric",
      });

      // Get structured date parts
      const parts = formatter.formatToParts(date);
      let day = "",
        month = "",
        year = "";

      parts.forEach((p) => {
        if (p.type === "day") day = p.value;
        if (p.type === "month") month = p.value;
        if (p.type === "year") year = p.value;
      });

      // Convert month number → full name (fixes I / II issue)
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = islamicMonths[monthIndex] || "Unknown";

      return `${day} ${monthName} ${year} AH`;
    } catch (error) {
      console.error("Hijri format error:", error);
      return "Hijri Date N/A";
    }
  }, []);

  // Get Hijri month and year for header
  // ✅ Fully consistent Islamic month and year (works on mobile & desktop)
  const getHijriMonthYear = useCallback(
    (date) => {
      const islamicMonths = [
        "Muharram",
        "Safar",
        "Rabiʽ al-Awwal",
        "Rabiʽ al-Thani",
        "Jumada al-Awwal",
        "Jumada al-Thani",
        "Rajab",
        "Shaʽban",
        "Ramadan",
        "Shawwal",
        "Dhu al-Qaʽdah",
        "Dhu al-Hijjah",
      ];

      try {
        // Use numeric month for manual mapping (works on all devices)
        const formatter = new Intl.DateTimeFormat(
          "en-TN-u-ca-islamic-umalqura",
          {
            month: "numeric",
            year: "numeric",
          },
        );

        const parts = formatter.formatToParts(date);
        let month = "",
          year = "";

        parts.forEach((p) => {
          if (p.type === "month") month = p.value;
          if (p.type === "year") year = p.value;
        });

        const monthIndex = parseInt(month, 10) - 1;
        const monthName = islamicMonths[monthIndex] || "Unknown";
        return `${monthName} ${year} AH`;
      } catch (error) {
        console.error("Hijri header error:", error);
        // fallback to formatted full hijri date
        const fullHijri = formatHijriDate(date).split(" ");
        // e.g. ["5", "Jumada", "al-Thani", "1446", "AH"]
        return `${fullHijri[1]} ${fullHijri[2] || ""} ${fullHijri[3]} AH`;
      }
    },
    [formatHijriDate],
  );

  // Get short Hijri date for calendar cells
  const getShortHijriDate = useCallback(
    (date) => {
      try {
        const hijri = new Intl.DateTimeFormat("en-US", {
          calendar: "islamic-umalqura",
          day: "numeric",
        }).format(date);

        if (!hijri || hijri.includes("Invalid")) throw new Error();
        return hijri;
      } catch (error) {
        const fullHijri = formatHijriDate(date);
        return fullHijri[0];
      }
    },
    [formatHijriDate],
  );

  // Preload Hijri dates for visible calendar
  useEffect(() => {
    const now = new Date(); // ✅ Move currentDate inside effect
    const days = getGregorianCalendarDays();
    const hijriMap = {};

    days.forEach((day) => {
      hijriMap[day.toDateString()] = getShortHijriDate(day);
    });

    setHijriDates(hijriMap);
    setHijriHeader(formatHijriDate(now)); // ✅ use 'now' here
  }, [
    currentMonth,
    formatHijriDate,
    getGregorianCalendarDays,
    getShortHijriDate,
    getHijriMonthYear,
  ]);

  // Navigation
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const today = new Date();
  const isToday = (date) => date.toDateString() === today.toDateString();
  const isCurrentMonth = (date) => date.getMonth() === currentMonth.getMonth();

  const days = getGregorianCalendarDays();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const arabicWeekDays = [
    "أحد",
    "اثنين",
    "ثلاثاء",
    "أربعاء",
    "خميس",
    "جمعة",
    "سبت",
  ];

  return (
    <div className="dual-calendar-container">
      <div className="dual-calendar-card">
        <div className="dual-calendar-header">
          <div className="header-pattern"></div>
          <div className="title-container">
            <h1 className="calendar-title">
              <MoonStar size={28} />
              Islamic Calendar
              <Moon size={28} />
            </h1>
            <p className="calendar-subtitle">
              Synchronized Gregorian and Hijri Dates
            </p>
            <div className="hijri-header">{hijriHeader}</div>
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            <div className="month-nav">
              <button className="nav-button" onClick={prevMonth}>
                <ChevronLeft size={20} />
              </button>

              <div className="month-year-container">
                <div className="gregorian-month">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="hijri-month">
                  {getHijriMonthYear(currentMonth)}
                </div>
              </div>

              <button className="nav-button" onClick={nextMonth}>
                <ChevronRight size={20} />
              </button>
            </div>

            <button className="today-button" onClick={goToToday}>
              Today
            </button>
          </div>

          <div className="week-days">
            {weekDays.map((day, index) => (
              <div key={day} className="week-day">
                {day}
                <div className="arabic-week-day">{arabicWeekDays[index]}</div>
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((date, index) => (
              <div
                key={index}
                className={`calendar-cell ${isToday(date) ? "today" : ""} ${
                  isCurrentMonth(date) ? "current-month" : "other-month"
                }`}
              >
                {isToday(date) && <div className="today-indicator" />}
                <div className="gregorian-date">{date.getDate()}</div>
                <div className="hijri-date">
                  {hijriDates[date.toDateString()] || ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="current-date-time">
          <div className="time-display">
            <Clock size={18} />
            {currentDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}{" "}
            • {formatHijriDate(currentDate)}
          </div>
          <div className="islamic-decoration">
            <Calendar size={14} />
            Islamic Calendar System - Umm al-Qura
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calender;
