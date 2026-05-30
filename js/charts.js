/* ============================================================
   DMC Financial Portal
   js/charts.js

   PURPOSE: All Chart.js chart logic for the entire portal.
   No other file creates charts directly.
   Every chart is a function — call it, pass data, done.

   DO NOT put data fetching or page logic here.
   Depends on: Chart.js (CDN), data.js, ui.js
   ============================================================ */

const DMC_CHARTS = (function () {

  /* ----------------------------------------------------------
     Chart instance registry
     Keeps references so we can destroy before redrawing.
     Prevents duplicate charts stacking on top of each other.
  ---------------------------------------------------------- */
  var _instances = {};

  function _destroy(id) {
    if (_instances[id]) {
      _instances[id].destroy();
      delete _instances[id];
    }
  }


  /* ----------------------------------------------------------
     Shared Chart.js defaults
  ---------------------------------------------------------- */
  var COLORS = {
    income:      '#5DCAA5',
    expense:     '#F09595',
    net:         '#D85A30',
    netFill:     'rgba(216, 90, 48, 0.07)',
    purple:      '#7F77DD',
    gridLine:    'rgba(0, 0, 0, 0.04)',
    gridLineDark:'rgba(255, 255, 255, 0.06)'
  };

  function _axisConfig() {
    return {
      ticks: {
        callback: DMC_UI.fmtAxis,
        font: { size: 11 },
        color: '#888780'
      },
      grid: { color: COLORS.gridLine }
    };
  }

  function _xConfig() {
    return {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#888780' }
    };
  }


  /* ----------------------------------------------------------
     1. Monthly Income vs Expenses — Grouped Bar Chart
     Used on: owner.html dashboard
     Canvas ID: any
     Data: monthMap from DMC_DATA.byMonth()
  ---------------------------------------------------------- */
  function renderMonthlyBar(canvasId, monthMap) {
    _destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var keys     = Object.keys(monthMap).sort();
    var labels   = keys.map(DMC_UI.monthShort);
    var incData  = keys.map(function (k) { return Math.round(monthMap[k].income); });
    var expData  = keys.map(function (k) { return Math.round(monthMap[k].expenses); });

    _instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incData,
            backgroundColor: COLORS.income,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: 'Expenses',
            data: expData,
            backgroundColor: COLORS.expense,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: _xConfig(),
          y: _axisConfig()
        }
      }
    });
  }


  /* ----------------------------------------------------------
     2. Net Income Trend — Line Chart
     Used on: owner.html dashboard
     Canvas ID: any
     Data: monthMap from DMC_DATA.byMonth()
  ---------------------------------------------------------- */
  function renderNetTrend(canvasId, monthMap) {
    _destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var keys    = Object.keys(monthMap).sort();
    var labels  = keys.map(DMC_UI.monthShort);
    var netData = keys.map(function (k) {
      return Math.round(monthMap[k].income - monthMap[k].expenses);
    });

    _instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net income',
          data: netData,
          borderColor: COLORS.net,
          backgroundColor: COLORS.netFill,
          tension: 0.35,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: COLORS.net,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: _xConfig(),
          y: _axisConfig()
        }
      }
    });
  }


  /* ----------------------------------------------------------
     3. Expense Category Breakdown — Horizontal Bar Chart
     Used on: monthly.html
     Canvas ID: any
     Data: breakdown object from DMC_DATA.expenseBreakdown()
  ---------------------------------------------------------- */
  function renderExpenseBreakdown(canvasId, breakdown) {
    _destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var labels = [
      'Salaries', 'Purchases', 'Rental', 'Utilities',
      'Benefits', 'Staff Meals', 'PCF', 'Taxes', 'Sundries'
    ];
    var keys = ['sal', 'pur', 'rent', 'util', 'ben', 'meals', 'pcf', 'tax', 'sun'];
    var data = keys.map(function (k) { return Math.round(breakdown[k] || 0); });

    _instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total',
          data: data,
          backgroundColor: COLORS.purple,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: _axisConfig(),
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#888780' }
          }
        }
      }
    });
  }


  /* ----------------------------------------------------------
     4. Income by Channel — Doughnut Chart
     Used on: monthly.html
     Canvas ID: any
     Data: entries array from DMC_DATA.loadEntries()
  ---------------------------------------------------------- */
  function renderChannelDoughnut(canvasId, entries) {
    _destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var totals = { cash: 0, gcash: 0, card: 0, fp: 0, other: 0 };
    entries.forEach(function (e) {
      if (e.channels) {
        Object.keys(totals).forEach(function (ch) {
          totals[ch] += (e.channels[ch] || 0);
        });
      }
    });

    var labels = ['Cash', 'GCash', 'Card', 'Foodpanda', 'Other'];
    var keys   = ['cash', 'gcash', 'card', 'fp', 'other'];
    var data   = keys.map(function (k) { return Math.round(totals[k]); });
    var colors = ['#5DCAA5', '#7F77DD', '#378ADD', '#F09595', '#EF9F27'];

    _instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 12 },
              padding: 14,
              color: '#888780'
            }
          }
        },
        cutout: '65%'
      }
    });
  }


  /* ----------------------------------------------------------
     5. Destroy a specific chart instance
     Call this before re-rendering a chart on the same canvas.
  ---------------------------------------------------------- */
  function destroy(canvasId) {
    _destroy(canvasId);
  }


  /* ----------------------------------------------------------
     Public API
  ---------------------------------------------------------- */
  return {
    renderMonthlyBar:       renderMonthlyBar,
    renderNetTrend:         renderNetTrend,
    renderExpenseBreakdown: renderExpenseBreakdown,
    renderChannelDoughnut:  renderChannelDoughnut,
    destroy:                destroy
  };

})();
