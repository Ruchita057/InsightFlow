/**
 * InsightFlow — Dashboard Controller
 * Handles upload, parsing, KPIs, charts, table, insights, export.
 */

const Dashboard = (() => {
  // State
  let state = {
    rows: [],
    headers: [],
    types: {},
    quality: null,
    name: '',
    source: '',
    filteredRows: [],
    sortCol: null,
    sortDir: 'asc',
    page: 1,
    pageSize: 25,
    charts: { line: null, bar: null, donut: null },
  };

  // ---------- Init ----------
  function init() {
    try {
      bindUpload();
      bindSidebar();
      bindTable();
      bindExport();
      renderRecent();

      // URL ?demo=retail|hr|netflix
      const params = new URLSearchParams(window.location.search);
      const demo = params.get('demo');
      if (demo) {
        loadDemo(demo);
      } else {
        // Auto-load Retail demo so the dashboard is never empty on first open
        loadDemo('retail');
      }
    } catch (err) {
      console.error('Dashboard init error:', err);
      if (window.InsightUtils) {
        InsightUtils.toast('Failed to start dashboard. Check console.', 'error');
      }
    }
  }

  // ---------- Upload ----------
  function bindUpload() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');

    if (!zone || !input) return;

    browseBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      input.click();
    });

    // Only open file picker when clicking the zone itself (not children with data-demo)
    zone.addEventListener('click', (e) => {
      if (e.target.closest('.demo-chip') || e.target.closest('#browseBtn')) return;
      input.click();
    });

    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    input.addEventListener('change', () => {
      if (input.files[0]) handleFile(input.files[0]);
    });

    // Demo chips — bind both on zone and document-level in case of re-renders
    document.querySelectorAll('.demo-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = chip.getAttribute('data-demo');
        if (key) loadDemo(key);
      });
    });

    document.getElementById('clearDataBtn')?.addEventListener('click', clearData);
    document.getElementById('reuploadBtn')?.addEventListener('click', () => {
      document.getElementById('uploadSection').style.display = 'block';
      document.getElementById('uploadZone')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function handleFile(file) {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    if (!name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      InsightUtils.toast('Please upload a CSV file.', 'error');
      return;
    }
    if (typeof Papa === 'undefined') {
      InsightUtils.toast('CSV parser failed to load. Check your internet connection.', 'error');
      return;
    }
    InsightUtils.showLoading('Parsing CSV…');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        if (result.errors && result.errors.length && (!result.data || result.data.length === 0)) {
          InsightUtils.hideLoading();
          InsightUtils.toast('Failed to parse CSV. Check the file format.', 'error');
          return;
        }
        processData(result.data || [], file.name, 'upload');
      },
      error: (err) => {
        console.error(err);
        InsightUtils.hideLoading();
        InsightUtils.toast('Error reading file.', 'error');
      },
    });
  }

  function loadDemo(key) {
    if (typeof DemoData === 'undefined' || !DemoData.get) {
      console.error('DemoData not loaded');
      if (window.InsightUtils) InsightUtils.toast('Demo data script failed to load.', 'error');
      return;
    }
    InsightUtils.showLoading('Loading demo dataset…');
    // Small delay so loading UI paints
    setTimeout(() => {
      try {
        const demo = DemoData.get(key);
        if (!demo || !demo.data || !demo.data.length) {
          InsightUtils.hideLoading();
          InsightUtils.toast('Demo not found or empty.', 'error');
          return;
        }
        processData(demo.data, demo.name, demo.source);
      } catch (err) {
        console.error('loadDemo error:', err);
        InsightUtils.hideLoading();
        InsightUtils.toast('Failed to load demo: ' + (err.message || 'unknown'), 'error');
      }
    }, 150);
  }

  function processData(rawRows, name, source) {
    // Clean empty rows
    const rows = rawRows.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== ''));
    if (rows.length === 0) {
      InsightUtils.hideLoading();
      InsightUtils.toast('No data rows found.', 'error');
      return;
    }

    const headers = Object.keys(rows[0]);
    const types = InsightUtils.detectColumnTypes(rows, headers);
    const quality = InsightUtils.analyzeQuality(rows, headers, types);

    state = {
      ...state,
      rows,
      headers,
      types,
      quality,
      name,
      source,
      filteredRows: [...rows],
      sortCol: null,
      sortDir: 'asc',
      page: 1,
    };

    // Persist metadata
    InsightUtils.saveRecent({
      name,
      timestamp: Date.now(),
      rows: rows.length,
      cols: headers.length,
      source,
    });

    renderAll();
    InsightUtils.hideLoading();
    InsightUtils.toast(`Loaded "${name}" — ${rows.length} rows`, 'success');
    renderRecent();
  }

  function clearData() {
    // Destroy charts
    Object.values(state.charts).forEach((c) => c?.destroy());
    state = {
      rows: [],
      headers: [],
      types: {},
      quality: null,
      name: '',
      source: '',
      filteredRows: [],
      sortCol: null,
      sortDir: 'asc',
      page: 1,
      pageSize: 25,
      charts: { line: null, bar: null, donut: null },
    };
    document.getElementById('analyticsArea').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('datasetBar').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('exportPdfBtn').disabled = true;
    document.getElementById('fileInput').value = '';
  }

  // ---------- Render all ----------
  function renderAll() {
    const empty = document.getElementById('emptyState');
    const area = document.getElementById('analyticsArea');
    const bar = document.getElementById('datasetBar');
    const upload = document.getElementById('uploadSection');
    const exportBtn = document.getElementById('exportPdfBtn');

    if (empty) empty.style.display = 'none';
    if (area) area.style.display = 'block';
    if (bar) bar.style.display = 'flex';
    if (upload) upload.style.display = 'none';
    if (exportBtn) exportBtn.disabled = false;

    const nameEl = document.getElementById('datasetName');
    const metaEl = document.getElementById('datasetMeta');
    if (nameEl) nameEl.textContent = state.name;
    if (metaEl) {
      metaEl.textContent =
        `${InsightUtils.formatNumber(state.rows.length)} rows · ${state.headers.length} columns`;
    }

    try { renderKPIs(); } catch (e) { console.error('KPI error', e); }
    try { renderCharts(); } catch (e) { console.error('Chart error', e); }
    try { renderInsights(); } catch (e) { console.error('Insights error', e); }
    try { renderQuality(); } catch (e) { console.error('Quality error', e); }
    try { renderSummary(); } catch (e) { console.error('Summary error', e); }
    try { renderTable(); } catch (e) { console.error('Table error', e); }
  }

  // ---------- KPIs ----------
  function renderKPIs() {
    const grid = document.getElementById('kpiGrid');
    if (!grid) return;

    const { rows, headers, types } = state;
    const cards = [];

    // Always: Rows & Columns
    cards.push({ label: 'Rows', value: InsightUtils.formatNumber(rows.length), change: null });
    cards.push({ label: 'Columns', value: headers.length, change: null });

    // Smart detection
    const revenueCol = InsightsEngine.findCol(headers, ['revenue', 'sales', 'amount', 'estrevenue', 'total']);
    const profitCol = InsightsEngine.findCol(headers, ['profit', 'margin']);
    const qtyCol = InsightsEngine.findCol(headers, ['quantity', 'qty', 'orders']);
    const customerCol = InsightsEngine.findCol(headers, ['customerid', 'customer_id', 'customers', 'employeeid']);
    const viewsCol = InsightsEngine.findCol(headers, ['views', 'viewcount']);
    const salaryCol = InsightsEngine.findCol(headers, ['salary', 'compensation']);

    if (revenueCol) {
      const total = InsightsEngine.sum(rows, revenueCol);
      cards.push({ label: 'Revenue', value: InsightUtils.formatCurrency(total), change: null });
    }
    if (profitCol) {
      const total = InsightsEngine.sum(rows, profitCol);
      cards.push({ label: 'Profit', value: InsightUtils.formatCurrency(total), change: null });
    }
    if (qtyCol && types[qtyCol] === 'numeric') {
      const total = InsightsEngine.sum(rows, qtyCol);
      cards.push({ label: 'Orders / Qty', value: InsightUtils.formatNumber(total), change: null });
    }
    if (customerCol) {
      const unique = new Set(rows.map((r) => r[customerCol])).size;
      cards.push({ label: 'Customers / IDs', value: InsightUtils.formatNumber(unique), change: null });
    }
    if (viewsCol) {
      const total = InsightsEngine.sum(rows, viewsCol);
      cards.push({ label: 'Total Views', value: InsightUtils.formatNumber(total), change: null });
    }
    if (salaryCol) {
      const avg = InsightsEngine.sum(rows, salaryCol) / rows.length;
      cards.push({ label: 'Avg Salary', value: InsightUtils.formatCurrency(avg), change: null });
    }

    // Fallback numeric averages if few cards
    if (cards.length < 4) {
      state.quality.numericCols.slice(0, 4 - cards.length + 2).forEach((col) => {
        if (cards.some((c) => c.label === col)) return;
        const avg = InsightsEngine.sum(rows, col) / rows.length;
        cards.push({ label: `Avg ${col}`, value: InsightUtils.formatNumber(avg, 1), change: null });
      });
    }

    grid.innerHTML = cards
      .slice(0, 6)
      .map(
        (c) => `
      <div class="kpi-card">
        <div class="kpi-label">${escapeHtml(c.label)}</div>
        <div class="kpi-value">${c.value}</div>
        ${c.change ? `<div class="kpi-change ${c.change > 0 ? 'positive' : 'negative'}">${InsightUtils.formatPercent(c.change)}</div>` : ''}
      </div>`
      )
      .join('');
  }

  // ---------- Charts ----------
  function renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded — charts skipped');
      return;
    }

    const { rows, headers, types, quality } = state;
    const defaults = InsightUtils.getChartDefaults();

    // Destroy previous
    Object.values(state.charts).forEach((c) => {
      try { c?.destroy(); } catch (_) { /* ignore */ }
    });
    state.charts = { line: null, bar: null, donut: null };

    Chart.defaults.color = defaults.color;
    Chart.defaults.borderColor = defaults.borderColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    // --- Line chart: trend over time or sequential numeric ---
    const dateCol = quality.dateCols[0] || InsightsEngine.findCol(headers, ['date', 'hiredate', 'releaseyear', 'year']);
    const valueCol =
      InsightsEngine.findCol(headers, ['revenue', 'sales', 'profit', 'views', 'salary', 'amount']) ||
      quality.numericCols[0];

    const lineCtx = document.getElementById('chartLine');
    if (lineCtx && valueCol) {
      let labels, data;
      if (dateCol) {
        // Aggregate by date (or year)
        const byDate = {};
        rows.forEach((r) => {
          const d = String(r[dateCol] || '').slice(0, 7); // YYYY-MM
          if (!d) return;
          byDate[d] = (byDate[d] || 0) + (parseFloat(r[valueCol]) || 0);
        });
        const sorted = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
        labels = sorted.map(([k]) => k);
        data = sorted.map(([, v]) => v);
        document.getElementById('chart1Title').textContent = `${valueCol} over Time`;
      } else {
        // Sample first 30 points
        const sample = rows.slice(0, 30);
        labels = sample.map((_, i) => `#${i + 1}`);
        data = sample.map((r) => parseFloat(r[valueCol]) || 0);
        document.getElementById('chart1Title').textContent = `${valueCol} Sequence`;
      }

      state.charts.line = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: valueCol,
              data,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              fill: true,
              tension: 0.35,
              pointRadius: labels.length > 40 ? 0 : 3,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(30,30,42,0.95)',
              titleFont: { size: 12 },
              bodyFont: { size: 13 },
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { color: defaults.gridColor },
              ticks: { maxTicksLimit: 10, font: { size: 11 } },
            },
            y: {
              grid: { color: defaults.gridColor },
              ticks: {
                font: { size: 11 },
                callback: (v) => InsightUtils.formatNumber(v),
              },
            },
          },
        },
      });
    }

    // --- Donut: category breakdown ---
    const catCol = quality.categoricalCols[0];
    const donutCtx = document.getElementById('chartDonut');
    if (donutCtx && catCol) {
      const counts = InsightsEngine.countBy(rows, catCol);
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const labels = sorted.map(([k]) => k);
      const data = sorted.map(([, v]) => v);
      const colors = InsightUtils.getChartColors(labels.length);

      document.getElementById('chart2Title').textContent = `By ${catCol}`;

      state.charts.donut = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
            },
            tooltip: {
              backgroundColor: 'rgba(30,30,42,0.95)',
              padding: 10,
              cornerRadius: 8,
            },
          },
        },
      });
    }

    // --- Bar chart: comparison ---
    const barCtx = document.getElementById('chartBar');
    const barCat = quality.categoricalCols[0] || quality.categoricalCols[1];
    const barVal =
      InsightsEngine.findCol(headers, ['revenue', 'profit', 'views', 'salary', 'quantity']) ||
      quality.numericCols[0];

    if (barCtx && barCat && barVal) {
      const byCat = {};
      rows.forEach((r) => {
        const k = r[barCat] || 'Unknown';
        byCat[k] = (byCat[k] || 0) + (parseFloat(r[barVal]) || 0);
      });
      const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const labels = sorted.map(([k]) => k);
      const data = sorted.map(([, v]) => v);

      document.getElementById('chart3Title').textContent = `${barVal} by ${barCat}`;

      state.charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: barVal,
              data,
              backgroundColor: 'rgba(99, 102, 241, 0.75)',
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(30,30,42,0.95)',
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, maxRotation: 45 },
            },
            y: {
              grid: { color: defaults.gridColor },
              ticks: {
                font: { size: 11 },
                callback: (v) => InsightUtils.formatNumber(v),
              },
            },
          },
        },
      });
    }
  }

  // ---------- Insights ----------
  function renderInsights() {
    const grid = document.getElementById('insightsGrid');
    if (!grid) return;
    const insights = InsightsEngine.generate(state.rows, state.headers, state.types, state.quality);
    const iconMap = {
      success: '✓',
      warning: '⚠',
      info: 'ℹ',
      danger: '!',
      accent: '★',
    };
    grid.innerHTML = insights
      .map(
        (ins) => `
      <div class="insight-card">
        <div class="insight-icon ${ins.type}">${iconMap[ins.type] || 'ℹ'}</div>
        <div class="insight-content">
          <h4>${escapeHtml(ins.title)}</h4>
          <p>${escapeHtml(ins.description)}</p>
        </div>
      </div>`
      )
      .join('');
  }

  // ---------- Quality & Summary ----------
  function renderQuality() {
    const panel = document.getElementById('qualityPanel');
    if (!panel || !state.quality) return;
    const q = state.quality;

    const completenessBadge =
      q.completeness >= 95 ? 'good' : q.completeness >= 80 ? 'warn' : 'bad';
    const dupBadge = q.duplicates === 0 ? 'good' : 'warn';

    panel.innerHTML = `
      <div class="quality-item">
        <span class="quality-label">Completeness</span>
        <span class="quality-badge ${completenessBadge}">${q.completeness}%</span>
      </div>
      <div class="quality-item">
        <span class="quality-label">Missing Values</span>
        <span class="quality-value">${InsightUtils.formatNumber(q.missingTotal)}</span>
      </div>
      <div class="quality-item">
        <span class="quality-label">Duplicate Rows</span>
        <span class="quality-badge ${dupBadge}">${q.duplicates}</span>
      </div>
      <div class="quality-item">
        <span class="quality-label">Numeric Columns</span>
        <span class="quality-value">${q.numericCols.length}</span>
      </div>
      <div class="quality-item">
        <span class="quality-label">Categorical Columns</span>
        <span class="quality-value">${q.categoricalCols.length}</span>
      </div>
      <div class="quality-item">
        <span class="quality-label">Date Columns</span>
        <span class="quality-value">${q.dateCols.length}</span>
      </div>
    `;
  }

  function renderSummary() {
    const panel = document.getElementById('summaryPanel');
    if (!panel) return;
    const { headers, types, quality } = state;

    panel.innerHTML = `
      <div class="quality-item">
        <span class="quality-label">Total Rows</span>
        <span class="quality-value">${InsightUtils.formatNumber(quality.totalRows)}</span>
      </div>
      <div class="quality-item">
        <span class="quality-label">Total Columns</span>
        <span class="quality-value">${quality.totalCols}</span>
      </div>
      <div style="margin-top:12px">
        <div class="quality-label" style="margin-bottom:8px">Column Types</div>
        <div class="column-tags">
          ${headers
            .map((h) => {
              const t = types[h];
              const cls = t === 'numeric' ? 'numeric' : t === 'categorical' ? 'categorical' : '';
              return `<span class="col-tag ${cls}" title="${t}">${escapeHtml(h)}</span>`;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // ---------- Table ----------
  function bindTable() {
    const search = document.getElementById('tableSearch');
    search?.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      if (!q) {
        state.filteredRows = [...state.rows];
      } else {
        state.filteredRows = state.rows.filter((row) =>
          state.headers.some((h) => String(row[h] ?? '').toLowerCase().includes(q))
        );
      }
      state.page = 1;
      renderTable();
    });
  }

  function renderTable() {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    const info = document.getElementById('tableInfo');
    if (!thead || !tbody) return;

    const { filteredRows, headers, page, pageSize, sortCol, sortDir } = state;

    // Sort
    let display = [...filteredRows];
    if (sortCol) {
      display.sort((a, b) => {
        let va = a[sortCol];
        let vb = b[sortCol];
        const na = parseFloat(va);
        const nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) {
          return sortDir === 'asc' ? na - nb : nb - na;
        }
        va = String(va ?? '');
        vb = String(vb ?? '');
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }

    // Paginate
    const total = display.length;
    const start = (page - 1) * pageSize;
    const pageRows = display.slice(start, start + pageSize);

    thead.innerHTML =
      '<tr>' +
      headers
        .map((h) => {
          const arrow = sortCol === h ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
          return `<th data-col="${escapeHtml(h)}" role="columnheader" tabindex="0">${escapeHtml(h)}${arrow}</th>`;
        })
        .join('') +
      '</tr>';

    thead.querySelectorAll('th').forEach((th) => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (state.sortCol === col) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortCol = col;
          state.sortDir = 'asc';
        }
        renderTable();
      });
    });

    tbody.innerHTML = pageRows
      .map(
        (row) =>
          '<tr>' +
          headers.map((h) => `<td title="${escapeHtml(String(row[h] ?? ''))}">${escapeHtml(String(row[h] ?? ''))}</td>`).join('') +
          '</tr>'
      )
      .join('');

    if (info) {
      const end = Math.min(start + pageSize, total);
      info.textContent = total === 0
        ? 'No rows match'
        : `Showing ${start + 1}–${end} of ${InsightUtils.formatNumber(total)} rows`;
    }

    // Simple pagination
    const pag = document.getElementById('tablePagination');
    if (pag) {
      const pages = Math.ceil(total / pageSize) || 1;
      pag.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="prevPage" ${page <= 1 ? 'disabled' : ''}>Prev</button>
        <span style="margin:0 8px">Page ${page} / ${pages}</span>
        <button class="btn btn-ghost btn-sm" id="nextPage" ${page >= pages ? 'disabled' : ''}>Next</button>
      `;
      document.getElementById('prevPage')?.addEventListener('click', () => {
        if (state.page > 1) {
          state.page--;
          renderTable();
        }
      });
      document.getElementById('nextPage')?.addEventListener('click', () => {
        if (state.page < pages) {
          state.page++;
          renderTable();
        }
      });
    }
  }

  // ---------- Sidebar ----------
  function bindSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    toggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('open');
    });
    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('open');
    });

    // Nav section scroll
    document.querySelectorAll('.nav-item[data-section]').forEach((item) => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
        item.classList.add('active');
        const section = item.dataset.section;
        const map = {
          overview: 'kpiGrid',
          charts: 'chartsGrid',
          insights: 'insightsGrid',
          data: 'tableSection',
        };
        const el = document.getElementById(map[section]);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
      });
    });
  }

  function renderRecent() {
    const list = document.getElementById('recentList');
    if (!list) return;
    const recent = InsightUtils.getRecent();
    if (recent.length === 0) {
      list.innerHTML = '<div class="recent-item" style="color:var(--text-muted);cursor:default">No recent uploads</div>';
      return;
    }
    list.innerHTML = recent
      .map((r) => {
        const date = new Date(r.timestamp).toLocaleDateString();
        const isDemo = r.source?.startsWith('demo:');
        return `
          <button class="recent-item" data-source="${escapeHtml(r.source || '')}" data-name="${escapeHtml(r.name)}">
            <span class="recent-name">${escapeHtml(r.name)}</span>
            <span class="recent-date">${date}</span>
          </button>`;
      })
      .join('');

    list.querySelectorAll('.recent-item[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.dataset.source;
        if (src?.startsWith('demo:')) {
          loadDemo(src.replace('demo:', ''));
        } else {
          InsightUtils.toast('Re-upload the original CSV to reload custom data.', 'info');
        }
      });
    });
  }

  // ---------- PDF Export ----------
  function bindExport() {
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportPDF);
  }

  async function exportPDF() {
    if (!state.rows.length) return;
    InsightUtils.showLoading('Generating PDF…');
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(99, 102, 241);
      pdf.text('InsightFlow Report', 20, y);
      y += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(100);
      pdf.text(`Dataset: ${state.name}`, 20, y);
      y += 6;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
      y += 6;
      pdf.text(`Rows: ${state.rows.length}  |  Columns: ${state.headers.length}`, 20, y);
      y += 12;

      // KPIs text
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text('Key Metrics', 20, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(60);
      const kpiCards = document.querySelectorAll('.kpi-card');
      kpiCards.forEach((card) => {
        const label = card.querySelector('.kpi-label')?.textContent || '';
        const value = card.querySelector('.kpi-value')?.textContent || '';
        pdf.text(`${label}: ${value}`, 24, y);
        y += 6;
      });
      y += 6;

      // Insights
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text('Smart Insights', 20, y);
      y += 8;
      pdf.setFontSize(9);
      pdf.setTextColor(60);
      const insights = InsightsEngine.generate(state.rows, state.headers, state.types, state.quality);
      insights.forEach((ins) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFont(undefined, 'bold');
        pdf.text(ins.title, 24, y);
        y += 5;
        pdf.setFont(undefined, 'normal');
        const lines = pdf.splitTextToSize(ins.description, pageW - 48);
        pdf.text(lines, 24, y);
        y += lines.length * 5 + 4;
      });
      y += 6;

      // Quality
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text('Data Quality', 20, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(60);
      const q = state.quality;
      pdf.text(`Completeness: ${q.completeness}%`, 24, y); y += 6;
      pdf.text(`Missing values: ${q.missingTotal}`, 24, y); y += 6;
      pdf.text(`Duplicates: ${q.duplicates}`, 24, y); y += 6;
      pdf.text(`Numeric cols: ${q.numericCols.length}  |  Categorical: ${q.categoricalCols.length}`, 24, y);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text('Generated by InsightFlow — Transform Data into Decisions', 20, 290);

      pdf.save(`InsightFlow_${state.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      InsightUtils.toast('PDF exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      InsightUtils.toast('PDF export failed. Try again.', 'error');
    } finally {
      InsightUtils.hideLoading();
    }
  }

  // ---------- Helpers ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Public
  return { init, loadDemo, clearData };
})();

// Expose + boot
window.Dashboard = Dashboard;

function bootDashboard() {
  if (document.querySelector('.dashboard-body')) {
    Dashboard.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootDashboard);
} else {
  bootDashboard();
}
