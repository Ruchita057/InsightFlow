/**
 * InsightFlow — Utility helpers
 * Shared functions for theme, toasts, formatting, storage, etc.
 */

const InsightUtils = (() => {
  // ---------- Theme ----------
  function getTheme() {
    return localStorage.getItem('if_theme') || 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('if_theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  function updateThemeIcon(theme) {
    const icons = document.querySelectorAll('#themeIcon');
    icons.forEach((icon) => {
      if (theme === 'dark') {
        // Show sun (switch to light)
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
      } else {
        // Show moon
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      }
    });
  }

  function initTheme() {
    setTheme(getTheme());
    document.querySelectorAll('#themeToggle').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  // ---------- Toasts ----------
  function toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'alert');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ---------- Loading ----------
  function showLoading(text = 'Processing data…') {
    const overlay = document.getElementById('loadingOverlay');
    const label = document.getElementById('loadingText');
    if (label) label.textContent = text;
    if (overlay) overlay.classList.add('visible');
  }

  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('visible');
  }

  // ---------- Formatting ----------
  function formatNumber(n, decimals = 0) {
    if (n == null || isNaN(n)) return '—';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Number(n).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function formatCurrency(n) {
    if (n == null || isNaN(n)) return '—';
    return '$' + formatNumber(n, Math.abs(n) < 100 ? 2 : 0);
  }

  function formatPercent(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
  }

  // ---------- Type detection ----------
  function isNumeric(val) {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(parseFloat(val)) && isFinite(val);
  }

  function isDateLike(val) {
    if (!val || typeof val !== 'string') return false;
    // Common date patterns
    const patterns = [
      /^\d{4}-\d{2}-\d{2}/,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
      /^\d{1,2}-\d{1,2}-\d{2,4}/,
    ];
    return patterns.some((p) => p.test(val.trim()));
  }

  function detectColumnTypes(rows, headers) {
    const types = {};
    headers.forEach((h) => {
      let numeric = 0;
      let date = 0;
      let nonEmpty = 0;
      const sample = rows.slice(0, Math.min(100, rows.length));
      sample.forEach((row) => {
        const v = row[h];
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          nonEmpty++;
          if (isNumeric(v)) numeric++;
          else if (isDateLike(String(v))) date++;
        }
      });
      if (nonEmpty === 0) {
        types[h] = 'empty';
      } else if (numeric / nonEmpty > 0.8) {
        types[h] = 'numeric';
      } else if (date / nonEmpty > 0.6) {
        types[h] = 'date';
      } else {
        types[h] = 'categorical';
      }
    });
    return types;
  }

  // ---------- Data quality ----------
  function analyzeQuality(rows, headers, types) {
    const total = rows.length;
    let missingTotal = 0;
    const missingByCol = {};
    headers.forEach((h) => {
      let miss = 0;
      rows.forEach((r) => {
        const v = r[h];
        if (v === null || v === undefined || String(v).trim() === '') miss++;
      });
      missingByCol[h] = miss;
      missingTotal += miss;
    });

    // Duplicates (full row string compare)
    const seen = new Set();
    let duplicates = 0;
    rows.forEach((r) => {
      const key = headers.map((h) => r[h]).join('¦');
      if (seen.has(key)) duplicates++;
      else seen.add(key);
    });

    const numericCols = headers.filter((h) => types[h] === 'numeric');
    const categoricalCols = headers.filter((h) => types[h] === 'categorical');
    const dateCols = headers.filter((h) => types[h] === 'date');
    const completeness = total > 0
      ? ((1 - missingTotal / (total * headers.length)) * 100).toFixed(1)
      : 0;

    return {
      totalRows: total,
      totalCols: headers.length,
      missingTotal,
      missingByCol,
      duplicates,
      numericCols,
      categoricalCols,
      dateCols,
      completeness: parseFloat(completeness),
    };
  }

  // ---------- LocalStorage recent ----------
  const RECENT_KEY = 'if_recent_uploads';
  const MAX_RECENT = 5;

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveRecent(entry) {
    // entry: { name, timestamp, rows, cols, source }
    // We don't store full data (too large) — just metadata.
    // For demo datasets we store the demo key.
    let list = getRecent().filter((e) => e.name !== entry.name);
    list.unshift(entry);
    list = list.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }

  // ---------- Chart colors ----------
  const CHART_COLORS = [
    '#6366f1', '#a855f7', '#ec4899', '#06b6d4',
    '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#14b8a6', '#f97316',
  ];

  function getChartColors(n) {
    const colors = [];
    for (let i = 0; i < n; i++) {
      colors.push(CHART_COLORS[i % CHART_COLORS.length]);
    }
    return colors;
  }

  function getChartDefaults() {
    const isDark = getTheme() === 'dark';
    return {
      color: isDark ? '#a1a1aa' : '#52525b',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    };
  }

  return {
    initTheme,
    toggleTheme,
    getTheme,
    setTheme,
    toast,
    showLoading,
    hideLoading,
    formatNumber,
    formatCurrency,
    formatPercent,
    isNumeric,
    isDateLike,
    detectColumnTypes,
    analyzeQuality,
    getRecent,
    saveRecent,
    getChartColors,
    getChartDefaults,
  };
})();

window.InsightUtils = InsightUtils;
