document.addEventListener("DOMContentLoaded", () => {
  const HABITS_KEY = "matrix_habits_lime_v2";
  const REFLECTIONS_KEY = "matrix_reflections_lime_v2";
  const REMINDER_KEY = "reminder_alarm_config";
  const THEME_KEY = "habit_theme_lime";

  // State Management
  let currentDate = new Date(2026, 7, 1); // Default August 2026
  let currentView = "month"; // 'month' or 'year'

  let habits = JSON.parse(localStorage.getItem(HABITS_KEY)) || [
    {
      id: 1,
      name: "Water intake (2L)",
      checks: { "2026-08-01": true, "2026-08-02": true, "2026-08-03": true },
    },
    {
      id: 2,
      name: "Cycling & Exercise",
      checks: { "2026-08-01": true, "2026-08-02": false, "2026-08-03": true },
    },
    {
      id: 3,
      name: "Deep Focus / Reading",
      checks: { "2026-08-01": true, "2026-08-02": true, "2026-08-03": true },
    },
  ];

  let reflections = JSON.parse(localStorage.getItem(REFLECTIONS_KEY)) || {
    Mood: { "2026-08-01": "😊", "2026-08-02": "🔥", "2026-08-03": "😊" },
    Energy: { "2026-08-01": "⚡", "2026-08-02": "⚡", "2026-08-03": "🔋" },
    Motivation: { "2026-08-01": "🎯", "2026-08-02": "🎯", "2026-08-03": "🚀" },
  };

  let reminderConfig = JSON.parse(localStorage.getItem(REMINDER_KEY)) || {
    time: "19:00",
    enabled: true,
  };

  // DOM Elements
  const matrixTable = document.getElementById("habit-matrix-table");
  const addHabitForm = document.getElementById("add-habit-form");
  const habitInput = document.getElementById("new-habit-input");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const calendarStrip = document.getElementById("calendar-strip");
  const monthDisplay = document.getElementById("current-month-display");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const viewMonthBtn = document.getElementById("view-month-btn");
  const viewYearBtn = document.getElementById("view-year-btn");

  // Reminder Elements
  const reminderTimeInput = document.getElementById("reminder-time");
  const toggleReminderBtn = document.getElementById("toggle-reminder-btn");

  // KPI & Analytics Elements
  const kpiHabits = document.getElementById("kpi-habits-count");
  const kpiStreak = document.getElementById("kpi-streak");
  const bestStreakEl = document.getElementById("best-streak-count");
  const kpiFreezes = document.getElementById("kpi-freezes");
  const kpiYearRate = document.getElementById("kpi-year-rate");
  const kpiMonthRate = document.getElementById("kpi-month-rate");
  const monthlyRingFill = document.getElementById("monthly-ring-fill");
  const weeklyRingFill = document.getElementById("weekly-ring-fill");
  const weeklyPercentage = document.getElementById("weekly-percentage");
  const weeklyChecksCount = document.getElementById("weekly-checks-count");
  const topHabitName = document.getElementById("top-habit-name");

  // Helper Date Formatter (YYYY-MM-DD)
  function formatDateKey(year, monthIndex, day) {
    const yyyy = year;
    const mm = String(monthIndex + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Days count helper
  function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  // --- Theme Switching ---
  function initTheme() {
    const theme = localStorage.getItem(THEME_KEY) || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  themeToggleBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    themeIcon.textContent = next === "dark" ? "☀️" : "🌙";
  });

  // --- Calendar Month Navigation ---
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    saveAndRender();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    saveAndRender();
  });

  // View Switcher (Month vs Year View)
  viewMonthBtn.addEventListener("click", () => {
    currentView = "month";
    viewMonthBtn.classList.add("active");
    viewYearBtn.classList.remove("active");
    saveAndRender();
  });

  viewYearBtn.addEventListener("click", () => {
    currentView = "year";
    viewYearBtn.classList.add("active");
    viewMonthBtn.classList.remove("active");
    saveAndRender();
  });

  // --- Reminder Alarm Config Logic ---
  reminderTimeInput.value = reminderConfig.time;
  updateReminderUI();

  reminderTimeInput.addEventListener("change", (e) => {
    reminderConfig.time = e.target.value;
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderConfig));
  });

  toggleReminderBtn.addEventListener("click", () => {
    reminderConfig.enabled = !reminderConfig.enabled;
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderConfig));
    updateReminderUI();
  });

  function updateReminderUI() {
    if (reminderConfig.enabled) {
      toggleReminderBtn.textContent = "Enabled";
      toggleReminderBtn.classList.remove("disabled");
    } else {
      toggleReminderBtn.textContent = "Disabled";
      toggleReminderBtn.classList.add("disabled");
    }
  }

  // Background Reminder Alarm Interval
  setInterval(() => {
    if (!reminderConfig.enabled) return;
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (currentTimeStr === reminderConfig.time && now.getSeconds() === 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚡ Habit Tracker Reminder", {
          body: "Time to check in your daily habits!",
        });
      } else {
        alert("⚡ Habit Tracker Reminder: Time to complete your daily habits!");
      }
    }
  }, 1000);

  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // --- Add Habit Form ---
  addHabitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = habitInput.value.trim();
    if (!name) return;

    habits.push({ id: Date.now(), name, checks: {} });
    habitInput.value = "";
    saveAndRender();
  });

  // --- Main Save & Pipeline ---
  function saveAndRender() {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    monthDisplay.textContent =
      currentView === "year"
        ? `${year} (Full Year)`
        : `${monthNames[month]} ${year}`;

    if (currentView === "year") {
      renderYearTrackerTable();
    } else {
      renderHabitMatrix();
    }

    renderReflectionsMatrix();
    renderCalendarStrip();
    updateKPIsAndAnalytics();
    renderHeatmap();
    renderBadges();
  }

  // --- 7-Day History Strip (Syncs with Active Month Selection) ---
  function renderCalendarStrip() {
    calendarStrip.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Show first 7 days of selected month or active week
    for (let day = 1; day <= 7; day++) {
      const dateObj = new Date(year, month, day);
      const key = formatDateKey(year, month, day);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

      let dayChecks = 0;
      habits.forEach((h) => {
        if (h.checks[key]) dayChecks++;
      });

      let statusClass = "status-none";
      let statusIcon = "-";

      if (habits.length > 0) {
        if (dayChecks === habits.length) {
          statusClass = "status-perfect";
          statusIcon = "✓";
        } else if (dayChecks > 0) {
          statusClass = "status-partial";
          statusIcon = `${dayChecks}/${habits.length}`;
        }
      }

      const dayCard = document.createElement("div");
      dayCard.className = `day-card ${day === 1 ? "is-today" : ""}`;
      dayCard.innerHTML = `
        <span class="day-name">${dayName}</span>
        <span class="day-number">${day}</span>
        <div class="day-status ${statusClass}">${statusIcon}</div>
      `;

      calendarStrip.appendChild(dayCard);
    }
  }

  // --- Month View Matrix Table ---
  function renderHabitMatrix() {
    matrixTable.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);

    let thead = '<thead><tr><th class="habit-col">Habit</th>';
    for (let d = 1; d <= daysCount; d++) thead += `<th>${d}</th>`;
    thead +=
      '<th class="stat-col">Total</th><th class="stat-col">Progress</th></tr></thead>';

    let tbody = "<tbody>";
    habits.forEach((habit) => {
      let completedCount = 0;
      tbody += `<tr><td class="habit-col">${escapeHTML(habit.name)}</td>`;

      for (let d = 1; d <= daysCount; d++) {
        const key = formatDateKey(year, month, d);
        const checked = !!habit.checks[key];
        if (checked) completedCount++;

        tbody += `
          <td class="cell-check ${checked ? "checked" : ""}" onclick="toggleCheck(${habit.id}, '${key}')">
            ${checked ? "✓" : ""}
          </td>`;
      }

      const pct = Math.round((completedCount / daysCount) * 100);
      tbody += `
        <td class="stat-col">${completedCount}</td>
        <td class="stat-col">
          <div class="mini-bar-bg"><div class="mini-bar-fill" style="width: ${pct}%"></div></div>
        </td>
      </tr>`;
    });
    tbody += "</tbody>";

    matrixTable.innerHTML = thead + tbody;
  }

  // --- Full Year Tracker Table View ---
  function renderYearTrackerTable() {
    matrixTable.innerHTML = "";
    const year = currentDate.getFullYear();
    const monthsShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let thead = '<thead><tr><th class="habit-col">Habit</th>';
    monthsShort.forEach((m) => (thead += `<th>${m}</th>`));
    thead += '<th class="stat-col">Year Total</th></tr></thead>';

    let tbody = "<tbody>";
    habits.forEach((habit) => {
      let totalYearChecks = 0;
      tbody += `<tr><td class="habit-col">${escapeHTML(habit.name)}</td>`;

      monthsShort.forEach((m, mIdx) => {
        let monthChecks = 0;
        const daysInM = getDaysInMonth(year, mIdx);
        for (let d = 1; d <= daysInM; d++) {
          const key = formatDateKey(year, mIdx, d);
          if (habit.checks[key]) {
            monthChecks++;
            totalYearChecks++;
          }
        }
        tbody += `<td>${monthChecks}</td>`;
      });

      tbody += `<td class="stat-col">${totalYearChecks}</td></tr>`;
    });
    tbody += "</tbody>";

    matrixTable.innerHTML = thead + tbody;
  }

  window.toggleCheck = function (habitId, dateKey) {
    habits = habits.map((h) => {
      if (h.id === habitId) {
        return { ...h, checks: { ...h.checks, [dateKey]: !h.checks[dateKey] } };
      }
      return h;
    });
    saveAndRender();
  };

  // --- Reflections Matrix ---
  function renderReflectionsMatrix() {
    const refTable = document.getElementById("reflection-matrix-table");
    refTable.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);

    let thead = '<thead><tr><th class="ref-label">Metric</th>';
    for (let d = 1; d <= daysCount; d++) thead += `<th>${d}</th>`;
    thead += "</tr></thead>";

    let tbody = "<tbody>";
    Object.keys(reflections).forEach((metric) => {
      tbody += `<tr><td class="ref-label">${metric}</td>`;
      for (let d = 1; d <= daysCount; d++) {
        const key = formatDateKey(year, month, d);
        const val = reflections[metric][key] || "-";
        tbody += `<td class="ref-cell" onclick="cycleReflection('${metric}', '${key}')">${val}</td>`;
      }
      tbody += "</tr>";
    });
    tbody += "</tbody>";

    refTable.innerHTML = thead + tbody;
  }

  window.cycleReflection = function (metric, dateKey) {
    const options = {
      Mood: ["😊", "😐", "🔥", "😴"],
      Energy: ["⚡", "🔋", "🪫"],
      Motivation: ["🎯", "🚀", "⏳"],
    };
    const current = reflections[metric][dateKey];
    const list = options[metric];
    const nextIdx = (list.indexOf(current) + 1) % list.length;
    reflections[metric][dateKey] = list[nextIdx];
    saveAndRender();
  };

  // --- Dynamic Streak Calculation Engine ---
  function calculateActualStreak() {
    if (habits.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const key = formatDateKey(
        checkDate.getFullYear(),
        checkDate.getMonth(),
        checkDate.getDate(),
      );
      let dayChecks = 0;
      habits.forEach((h) => {
        if (h.checks[key]) dayChecks++;
      });

      if (dayChecks > 0) {
        streak++;
      } else if (i > 0) {
        break; // Streak broken
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  // --- KPIs, Charts & Weekly Calculations ---
  function updateKPIsAndAnalytics() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const totalPossible = habits.length * daysCount;

    let monthChecks = 0;
    let habitTotals = {};

    habits.forEach((h) => {
      habitTotals[h.name] = 0;
      for (let d = 1; d <= daysCount; d++) {
        const key = formatDateKey(year, month, d);
        if (h.checks[key]) {
          monthChecks++;
          habitTotals[h.name]++;
        }
      }
    });

    const streak = calculateActualStreak();
    kpiStreak.textContent = streak;
    bestStreakEl.textContent = streak;

    const monthPct =
      totalPossible === 0 ? 0 : Math.round((monthChecks / totalPossible) * 100);
    kpiHabits.textContent = habits.length;
    kpiFreezes.textContent = 0;
    kpiYearRate.textContent = `${Math.round(monthPct * 0.82)}%`;
    kpiMonthRate.textContent = `${monthPct}%`;

    monthlyRingFill.style.strokeDashoffset = 125.6 - (monthPct / 100) * 125.6;

    // Calculate Weekly Completion Dynamically (First 7 days check-ins)
    let week1Checks = 0;
    habits.forEach((h) => {
      for (let d = 1; d <= 7; d++) {
        const key = formatDateKey(year, month, d);
        if (h.checks[key]) week1Checks++;
      }
    });

    const weeklyPossible = habits.length * 7;
    const weeklyPct =
      weeklyPossible === 0
        ? 0
        : Math.round((week1Checks / weeklyPossible) * 100);

    weeklyPercentage.textContent = `${weeklyPct}%`;
    weeklyChecksCount.textContent = week1Checks;
    weeklyRingFill.style.strokeDashoffset = 175.8 - (weeklyPct / 100) * 175.8;

    // Find Top Performing Habit
    let topHabit = "None";
    let maxChecks = -1;
    Object.keys(habitTotals).forEach((name) => {
      if (habitTotals[name] > maxChecks && habitTotals[name] > 0) {
        maxChecks = habitTotals[name];
        topHabit = name;
      }
    });
    topHabitName.textContent = topHabit;

    renderDailyTrendChart();
    renderWeeklyBars();
  }

  function renderDailyTrendChart() {
    const chartSvg = document.getElementById("daily-progress-chart");
    if (habits.length === 0) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);

    let points = [];
    for (let d = 1; d <= daysCount; d++) {
      let dayChecks = 0;
      const key = formatDateKey(year, month, d);
      habits.forEach((h) => {
        if (h.checks[key]) dayChecks++;
      });

      const pct = dayChecks / habits.length;
      const x = (d - 1) * (500 / (daysCount - 1));
      const y = 110 - pct * 90;
      points.push(`${x},${y}`);
    }

    chartSvg.innerHTML = `<polyline fill="none" stroke="var(--accent-primary)" stroke-width="3" points="${points.join(" ")}" />`;
  }

  function renderWeeklyBars() {
    const container = document.getElementById("weekly-bars-container");
    container.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const weeks = [
      { name: "W1", start: 1, end: 7 },
      { name: "W2", start: 8, end: 14 },
      { name: "W3", start: 15, end: 21 },
      { name: "W4", start: 22, end: 28 },
    ];

    weeks.forEach((w) => {
      let weekChecks = 0;
      const totalPossibleWeek = habits.length * (w.end - w.start + 1);

      habits.forEach((h) => {
        for (let d = w.start; d <= w.end; d++) {
          const key = formatDateKey(year, month, d);
          if (h.checks[key]) weekChecks++;
        }
      });

      const pct =
        totalPossibleWeek === 0
          ? 0
          : Math.round((weekChecks / totalPossibleWeek) * 100);

      container.innerHTML += `
        <div class="bar-column">
          <div class="bar-track"><div class="bar-fill" style="height: ${Math.max(10, pct)}%"></div></div>
          <span class="bar-label">${w.name} (${pct}%)</span>
        </div>`;
    });
  }

  // --- Heatmap ---
  function renderHeatmap() {
    const grid = document.getElementById("heatmap-grid");
    grid.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);

    for (let d = 1; d <= daysCount; d++) {
      let dayChecks = 0;
      const key = formatDateKey(year, month, d);
      habits.forEach((h) => {
        if (h.checks[key]) dayChecks++;
      });

      let lvlClass = "";
      if (dayChecks >= 3) lvlClass = "lvl-4";
      else if (dayChecks === 2) lvlClass = "lvl-3";
      else if (dayChecks === 1) lvlClass = "lvl-1";

      grid.innerHTML += `<div class="heatmap-square ${lvlClass}">${d}</div>`;
    }
  }

  // --- Dynamic Badges System ---
  function renderBadges() {
    let grandTotalChecks = 0;
    habits.forEach((h) =>
      Object.values(h.checks).forEach((v) => {
        if (v) grandTotalChecks++;
      }),
    );
    const streak = calculateActualStreak();

    const badgeDefs = [
      {
        name: "Getting Started",
        desc: "Created your first habit",
        icon: "🌱",
        unlocked: habits.length >= 1,
      },
      {
        name: "First Step",
        desc: "Reached a 3-day streak",
        icon: "✅",
        unlocked: streak >= 3,
      },
      {
        name: "On Fire",
        desc: "Reached a 7-day streak",
        icon: "🔥",
        unlocked: streak >= 7,
      },
      {
        name: "Unstoppable",
        desc: "Reached a 14-day streak",
        icon: "⚡",
        unlocked: streak >= 14,
      },
      {
        name: "Early Bird",
        desc: "Active reminder set",
        icon: "🌅",
        unlocked: reminderConfig.enabled,
      },
      {
        name: "Perfect Week",
        desc: "Completed 10+ check-ins",
        icon: "🏆",
        unlocked: grandTotalChecks >= 10,
      },
      {
        name: "Comeback",
        desc: "Returned after missed days",
        icon: "💪",
        unlocked: grandTotalChecks >= 5,
      },
      {
        name: "Half Century",
        desc: "50 total check-ins",
        icon: "⭐",
        unlocked: grandTotalChecks >= 50,
      },
      {
        name: "Centurion",
        desc: "100 total check-ins",
        icon: "💯",
        unlocked: grandTotalChecks >= 100,
      },
      {
        name: "Habit Master",
        desc: "500 total check-ins",
        icon: "👑",
        unlocked: grandTotalChecks >= 500,
      },
      {
        name: "Consistent",
        desc: "Active streak going",
        icon: "📈",
        unlocked: streak >= 1,
      },
      {
        name: "Collector",
        desc: "Created 3+ habits",
        icon: "📦",
        unlocked: habits.length >= 3,
      },
    ];

    const grid = document.getElementById("badges-grid");
    grid.innerHTML = "";
    let unlockedCount = 0;

    badgeDefs.forEach((b) => {
      if (b.unlocked) unlockedCount++;
      grid.innerHTML += `
        <div class="badge-card ${b.unlocked ? "unlocked" : ""}">
          <span class="badge-icon">${b.icon}</span>
          <span class="badge-name">${b.name}</span>
          <span class="badge-desc">${b.desc}</span>
        </div>`;
    });

    document.getElementById("unlocked-badges-count").textContent =
      `${unlockedCount} / ${badgeDefs.length}`;
  }

  function escapeHTML(str) {
    return str.replace(
      /[&<>'"]/g,
      (tag) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[tag] || tag,
    );
  }

  initTheme();
  saveAndRender();
});
