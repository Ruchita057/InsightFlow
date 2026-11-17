/**
 * InsightFlow — Rule-based smart insights engine
 * Generates human-readable insight cards from dataset analysis.
 */

const InsightsEngine = (() => {
  function fmtNum(n) {
    return (typeof InsightUtils !== 'undefined' && InsightUtils.formatNumber)
      ? InsightUtils.formatNumber(n)
      : String(n);
  }
  function fmtCur(n) {
    return (typeof InsightUtils !== 'undefined' && InsightUtils.formatCurrency)
      ? InsightUtils.formatCurrency(n)
      : '$' + n;
  }

  /**
   * Generate insights from parsed data.
   */
  function generate(rows, headers, types, quality) {
    if (!rows || rows.length === 0) return [];

    const insights = [];
    const numericCols = quality.numericCols || [];
    const catCols = quality.categoricalCols || [];

    insights.push({
      title: 'Dataset Overview',
      description: `Loaded ${fmtNum(rows.length)} rows across ${headers.length} columns (${numericCols.length} numeric, ${catCols.length} categorical).`,
      type: 'info',
    });

    if (quality.completeness >= 95) {
      insights.push({
        title: 'Excellent Data Quality',
        description: `Overall completeness is ${quality.completeness}%. Only ${quality.missingTotal} missing cell(s) detected.`,
        type: 'success',
      });
    } else if (quality.completeness >= 80) {
      insights.push({
        title: 'Good Data Quality',
        description: `Completeness is ${quality.completeness}%. Consider reviewing columns with higher missing rates.`,
        type: 'info',
      });
    } else {
      insights.push({
        title: 'Data Quality Attention Needed',
        description: `Completeness is only ${quality.completeness}%. ${quality.missingTotal} missing values found — cleaning recommended before analysis.`,
        type: 'warning',
      });
    }

    if (quality.duplicates > 0) {
      insights.push({
        title: 'Duplicate Rows Detected',
        description: `Found ${quality.duplicates} potential duplicate row(s). Consider deduplication for accurate metrics.`,
        type: 'warning',
      });
    }

    if (catCols.length > 0) {
      const col = catCols[0];
      const counts = countBy(rows, col);
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [top, topCount] = sorted[0];
        const pct = ((topCount / rows.length) * 100).toFixed(1);
        insights.push({
          title: `Top ${col}`,
          description: `"${top}" leads with ${fmtNum(topCount)} records (${pct}% of total). ${sorted.length} unique values overall.`,
          type: 'accent',
        });
      }
    }

    const revenueCol = findCol(headers, ['revenue', 'sales', 'amount', 'estrevenue', 'total']);
    const profitCol = findCol(headers, ['profit', 'margin', 'net']);
    const customerHint = findCol(headers, ['customerid', 'customer_id', 'customers', 'employeeid']);

    if (revenueCol && numericCols.includes(revenueCol)) {
      const total = sum(rows, revenueCol);
      const avg = total / rows.length;
      insights.push({
        title: `Total ${revenueCol}`,
        description: `Sum of ${revenueCol} is ${fmtCur(total)}. Average per row: ${fmtCur(avg)}.`,
        type: 'success',
      });

      if (catCols.length > 0) {
        const cat = catCols[0];
        const byCat = {};
        rows.forEach((r) => {
          const k = r[cat] || 'Unknown';
          byCat[k] = (byCat[k] || 0) + (parseFloat(r[revenueCol]) || 0);
        });
        const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
        if (topCat) {
          insights.push({
            title: `Highest-Performing ${cat}`,
            description: `"${topCat[0]}" generates the most ${revenueCol}: ${fmtCur(topCat[1])}.`,
            type: 'accent',
          });
        }
      }
    }

    if (profitCol && numericCols.includes(profitCol)) {
      const totalProfit = sum(rows, profitCol);
      insights.push({
        title: `Total ${profitCol}`,
        description: `Aggregate ${profitCol} across all records: ${fmtCur(totalProfit)}.`,
        type: 'success',
      });
    }

    if (customerHint) {
      const unique = new Set(rows.map((r) => r[customerHint])).size;
      insights.push({
        title: 'Unique Identifiers',
        description: `${fmtNum(unique)} unique values in ${customerHint} across ${fmtNum(rows.length)} rows.`,
        type: 'info',
      });
    }

    if (numericCols.length > 0) {
      const col = revenueCol || numericCols[0];
      const values = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      if (values.length > 10) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || 0;
        const outliers = values.filter((v) => Math.abs(v - mean) > 2.5 * std);
        if (outliers.length > 0) {
          insights.push({
            title: 'Potential Anomalies',
            description: `Detected ${outliers.length} outlier value(s) in ${col} (>2.5σ from mean). Max: ${fmtNum(Math.max(...outliers))}.`,
            type: 'warning',
          });
        } else {
          insights.push({
            title: `${col} Distribution`,
            description: `Mean ≈ ${fmtNum(mean)}, Std Dev ≈ ${fmtNum(std)}. No extreme outliers detected.`,
            type: 'info',
          });
        }
      }
    }

    const dateCol = (quality.dateCols && quality.dateCols[0]) || findCol(headers, ['date', 'hiredate', 'releaseyear', 'year']);
    if (dateCol) {
      const dates = rows.map((r) => String(r[dateCol])).filter(Boolean).sort();
      if (dates.length > 1) {
        insights.push({
          title: 'Time Range',
          description: `${dateCol} spans from ${dates[0]} to ${dates[dates.length - 1]}.`,
          type: 'info',
        });
      }
    }

    const attritionCol = findCol(headers, ['attrition', 'churn', 'left']);
    if (attritionCol) {
      const yes = rows.filter((r) => String(r[attritionCol]).toLowerCase() === 'yes').length;
      const rate = ((yes / rows.length) * 100).toFixed(1);
      insights.push({
        title: 'Attrition Rate',
        description: `${rate}% of records show Attrition = Yes (${yes} of ${rows.length}).`,
        type: parseFloat(rate) > 15 ? 'danger' : 'info',
      });
    }

    return insights.slice(0, 8);
  }

  function findCol(headers, candidates) {
    if (!headers || !headers.length) return null;
    const lower = headers.map((h) => String(h).toLowerCase().replace(/[\s_]/g, ''));
    for (const c of candidates) {
      const key = c.toLowerCase().replace(/[\s_]/g, '');
      const idx = lower.indexOf(key);
      if (idx !== -1) return headers[idx];
    }
    for (const c of candidates) {
      const key = c.toLowerCase().replace(/[\s_]/g, '');
      const idx = lower.findIndex((h) => h.includes(key));
      if (idx !== -1) return headers[idx];
    }
    return null;
  }

  function countBy(rows, col) {
    const map = {};
    rows.forEach((r) => {
      const k = r[col] != null && String(r[col]).trim() !== '' ? String(r[col]) : 'Unknown';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }

  function sum(rows, col) {
    return rows.reduce((s, r) => s + (parseFloat(r[col]) || 0), 0);
  }

  return { generate, findCol, countBy, sum };
})();

// Expose globally for other scripts
window.InsightsEngine = InsightsEngine;
