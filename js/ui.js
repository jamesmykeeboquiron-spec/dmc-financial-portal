/* ============================================================
   DMC Financial Portal
   js/ui.js

   PURPOSE: Shared UI utilities used across all pages.
   Number formatting, toast, active nav, date helpers.

   DO NOT put page-specific logic here.
   Depends on: data.js
   ============================================================ */

const DMC_UI = (function () {

  /* ----------------------------------------------------------
     Month names — used for labels and headings
  ---------------------------------------------------------- */
  const MONTHS = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'
  ];


  /* ----------------------------------------------------------
     Number formatting
  ---------------------------------------------------------- */

  /* ₱1,234,567 — rounded, no decimals */
  function fmt(n) {
    return '₱' + Math.round(n).toLocaleString('en-PH');
  }

  /* ₱1,234,567.89 — with 2 decimal places */
  function fmtDec(n) {
    return '₱' + Number(n).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /* ₱1.2M or ₱340k — for chart axis labels */
  function fmtAxis(v) {
    if (v >= 1000000) return '₱' + (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000)    return '₱' + (v / 1000).toFixed(0) + 'k';
    return '₱' + v;
  }

  /* -₱18,851 — handles negative correctly (sign before ₱) */
  function fmtSigned(n) {
    var abs = Math.abs(Math.round(n)).toLocaleString('en-PH');
    return (n < 0 ? '-' : '') + '₱' + abs;
  }

  /* Get numeric value from an input element safely */
  function getVal(id) {
    var el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
  }

  /* Set text content of an element safely */
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* Set inner HTML of an element safely */
  function setHTML(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = val;
  }


  /* ----------------------------------------------------------
     Month helpers
  ---------------------------------------------------------- */

  /* 'YYYY-MM' → 'January' */
  function monthName(key) {
    return MONTHS[parseInt(key.split('-')[1]) - 1];
  }

  /* 'YYYY-MM' → 'Jan' */
  function monthShort(key) {
    return MONTHS_SHORT[parseInt(key.split('-')[1]) - 1];
  }

  /* Date string 'YYYY-MM-DD' → 'May 31, 2026' */
  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /* Days until label — 'Today', 'Tomorrow', '3 days', 'Overdue' */
  function daysLabel(days) {
    if (days < 0)  return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return days + ' days';
  }


  /* ----------------------------------------------------------
     Toast notification
     Shows a small confirmation popup then hides it.
  ---------------------------------------------------------- */
  function toast(msg, duration) {
    duration = duration || 2500;
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () {
      el.classList.remove('show');
    }, duration);
  }


  /* ----------------------------------------------------------
     Active nav link
     Highlights the correct nav link based on current page.
  ---------------------------------------------------------- */
  function setActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var linkPage = href.split('/').pop();
      if (linkPage === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }


  /* ----------------------------------------------------------
     Set today's date on a date input
     Also sets a label element with the full readable date.
  ---------------------------------------------------------- */
  function setTodayDate(inputId, labelId) {
    var today = new Date();
    var iso   = today.toISOString().split('T')[0];
    var el    = document.getElementById(inputId);
    if (el) el.value = iso;

    if (labelId) {
      var lbl = document.getElementById(labelId);
      if (lbl) {
        lbl.textContent = today.toLocaleDateString('en-PH', {
          weekday: 'long', year: 'numeric',
          month: 'long', day: 'numeric'
        });
      }
    }
  }


  /* ----------------------------------------------------------
     Get date range for a filter shortcut key
     Returns { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  ---------------------------------------------------------- */
  function getDateRange(key) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayStr = today.toISOString().split('T')[0];

    if (key === 'today') {
      return { from: todayStr, to: todayStr };
    }

    if (key === 'week') {
      var weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        from: weekStart.toISOString().split('T')[0],
        to:   todayStr
      };
    }

    if (key === 'month') {
      var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: monthStart.toISOString().split('T')[0],
        to:   todayStr
      };
    }

    if (key === 'all') {
      return { from: null, to: null };
    }

    return { from: null, to: null };
  }


  /* ----------------------------------------------------------
     Render the monthly summary table
     Used on monthly.html and potentially owner.html
  ---------------------------------------------------------- */
  function renderMonthlyTable(monthMap, tbodyId, footIds) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    var keys = Object.keys(monthMap).sort();
    var totI = 0, totE = 0;

    tbody.innerHTML = keys.map(function (k) {
      var r   = monthMap[k];
      var net = r.income - r.expenses;
      totI += r.income;
      totE += r.expenses;

      var badge = net >= 0
        ? '<span class="pill pill-income">Profit</span>'
        : '<span class="pill pill-expense">Loss</span>';

      return [
        '<tr>',
          '<td>', monthName(k), ' ', k.split('-')[0], '</td>',
          '<td class="text-right tabular" style="color:var(--color-income)">', fmt(r.income), '</td>',
          '<td class="text-right tabular" style="color:var(--color-expense)">', fmt(r.expenses), '</td>',
          '<td class="text-right tabular fw-500" style="color:', (net >= 0 ? 'var(--color-income)' : 'var(--color-expense)'), '">', fmtSigned(net), '</td>',
          '<td class="text-right">', badge, '</td>',
        '</tr>'
      ].join('');
    }).join('');

    /* Footer totals */
    if (footIds) {
      var totNet = totI - totE;
      setText(footIds.income,   fmt(totI));
      setText(footIds.expenses, fmt(totE));
      var netEl = document.getElementById(footIds.net);
      if (netEl) {
        netEl.textContent = fmtSigned(totNet);
        netEl.style.color = totNet >= 0
          ? 'var(--color-income)'
          : 'var(--color-expense)';
      }
    }
  }


  /* ----------------------------------------------------------
     Render recent entries list
     Used on the dashboard recent entries card.
  ---------------------------------------------------------- */
  function renderRecentList(entries, containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var recent = entries.slice().reverse().slice(0, 10);

    if (!recent.length) {
      el.innerHTML = '<div class="empty-state"><i class="ti ti-clipboard-x" aria-hidden="true"></i>No entries yet — use Daily Entry to start logging</div>';
      return;
    }

    el.innerHTML = recent.map(function (e) {
      var net    = e.income - e.expenses;
      var netCls = net >= 0 ? 'text-income' : 'text-expense';
      var prefix = net >= 0 ? '+' : '';
      return [
        '<div class="entry-row">',
          '<span class="col-date text-secondary">', e.date.substring(5), '</span>',
          '<span class="col-desc">', e.note, '</span>',
          '<span class="col-amt tabular text-income">', fmt(e.income), '</span>',
          '<span class="col-amt tabular text-expense col-exp">-', fmt(e.expenses), '</span>',
          '<span class="col-amt tabular ', netCls, ' col-net">', prefix, fmt(net), '</span>',
        '</div>'
      ].join('');
    }).join('');
  }


  /* ----------------------------------------------------------
     Public API
  ---------------------------------------------------------- */
  return {
    MONTHS:       MONTHS,
    MONTHS_SHORT: MONTHS_SHORT,

    /* Formatting */
    fmt:          fmt,
    fmtDec:       fmtDec,
    fmtAxis:      fmtAxis,
    fmtSigned:    fmtSigned,
    getVal:       getVal,
    setText:      setText,
    setHTML:      setHTML,

    /* Date & month */
    monthName:    monthName,
    monthShort:   monthShort,
    formatDate:   formatDate,
    daysLabel:    daysLabel,
    setTodayDate: setTodayDate,
    getDateRange: getDateRange,

    /* Navigation */
    setActiveNav: setActiveNav,

    /* Renderers */
    renderMonthlyTable: renderMonthlyTable,
    renderRecentList:   renderRecentList,

    /* Toast */
    toast:        toast
  };

})();
