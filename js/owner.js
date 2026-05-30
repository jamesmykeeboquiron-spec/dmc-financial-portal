/* ============================================================
   DMC Financial Portal
   js/owner.js

   PURPOSE: Logic for the owner dashboard (pages/owner.html)
   only. Handles filter shortcuts, KPI cards, expense
   breakdown, PDC panel, and charts.

   DO NOT put shared utilities here — those go in ui.js.
   DO NOT put data access here — that goes in data.js.
   Depends on: data.js, ui.js, charts.js
   ============================================================ */

(function () {

  /* ----------------------------------------------------------
     State
     Tracks the current filter so we can re-render on change.
  ---------------------------------------------------------- */
  var state = {
    filterKey: 'month',   /* active shortcut key */
    from:      null,      /* custom from date string */
    to:        null       /* custom to date string */
  };


  /* ----------------------------------------------------------
     Expense category config
     Label and dot color for each expense category.
  ---------------------------------------------------------- */
  var EXP_CATEGORIES = [
    { key: 'sal',   label: 'Salaries',    dotClass: 'dot-salaries'  },
    { key: 'pur',   label: 'Purchases',   dotClass: 'dot-purchases' },
    { key: 'rent',  label: 'Rental',      dotClass: 'dot-rental'    },
    { key: 'util',  label: 'Utilities',   dotClass: 'dot-utilities' },
    { key: 'ben',   label: 'Benefits',    dotClass: 'dot-benefits'  },
    { key: 'meals', label: 'Staff Meals', dotClass: 'dot-meals'     },
    { key: 'pcf',   label: 'PCF',         dotClass: 'dot-pcf'       },
    { key: 'tax',   label: 'Taxes',       dotClass: 'dot-taxes'     },
    { key: 'sun',   label: 'Sundries',    dotClass: 'dot-sundries'  }
  ];


  /* ----------------------------------------------------------
     Filter — shortcut buttons
     Called when user clicks This month / Today / etc.
  ---------------------------------------------------------- */
  function onShortcutClick(btn, key) {
    /* Update active button style */
    document.querySelectorAll('.btn-shortcut').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    /* Get date range for this key */
    var range = DMC_UI.getDateRange(key);
    state.filterKey = key;
    state.from      = range.from;
    state.to        = range.to;

    /* Update date inputs to match */
    var fromEl = document.getElementById('filter-from');
    var toEl   = document.getElementById('filter-to');
    if (fromEl) fromEl.value = range.from || '';
    if (toEl)   toEl.value   = range.to   || '';

    render();
  }


  /* ----------------------------------------------------------
     Filter — custom date range
     Called when user changes a date input manually.
  ---------------------------------------------------------- */
  function onDateChange() {
    /* Clear active shortcut — user is using custom range */
    document.querySelectorAll('.btn-shortcut').forEach(function (b) {
      b.classList.remove('active');
    });

    state.filterKey = 'custom';
    state.from = document.getElementById('filter-from').value || null;
    state.to   = document.getElementById('filter-to').value   || null;

    render();
  }


  /* ----------------------------------------------------------
     Render KPI cards
  ---------------------------------------------------------- */
  function renderKPIs(entries) {
    var summary = DMC_DATA.ytdSummary(entries);
    var net     = summary.income - summary.expenses;

    DMC_UI.setText('kpi-income',   DMC_UI.fmt(summary.income));
    DMC_UI.setText('kpi-expenses', DMC_UI.fmt(summary.expenses));
    DMC_UI.setText('kpi-balance',  DMC_UI.fmt(net));

    var netEl = document.getElementById('kpi-net');
    if (netEl) {
      netEl.textContent = DMC_UI.fmtSigned(net);
      netEl.className   = 'kpi-value ' + (net >= 0 ? 'net-pos' : 'net-neg');
    }
  }


  /* ----------------------------------------------------------
     Render expense breakdown list
  ---------------------------------------------------------- */
  function renderExpBreakdown(entries) {
    var el = document.getElementById('exp-breakdown-list');
    if (!el) return;

    var breakdown = DMC_DATA.expenseBreakdown(entries);

    el.innerHTML = EXP_CATEGORIES.map(function (cat) {
      var val = breakdown[cat.key] || 0;
      if (!val) return '';
      return [
        '<div class="exp-list-item">',
          '<div class="exp-list-left">',
            '<div class="exp-list-dot ', cat.dotClass, '"></div>',
            cat.label,
          '</div>',
          '<div class="exp-list-value">', DMC_UI.fmt(val), '</div>',
        '</div>'
      ].join('');
    }).join('');
  }


  /* ----------------------------------------------------------
     Render PDC panel
     Shows cheques due in the next 10 days grouped by urgency.
  ---------------------------------------------------------- */
  function renderPDC() {
    var allCheques = DMC_DATA.loadCheques();
    var upcoming   = DMC_DATA.chequesWithinDays(allCheques, 10);

    /* Split into urgency groups */
    var critical = [], soon = [], later = [];
    upcoming.forEach(function (c) {
      var days = DMC_DATA.daysUntil(c.dueDate);
      if (days <= 2)      critical.push(c);
      else if (days <= 7) soon.push(c);
      else                later.push(c);
    });

    /* Total */
    var total = upcoming.reduce(function (s, c) { return s + c.amount; }, 0);
    DMC_UI.setText('pdc-total',   DMC_UI.fmt(total));
    DMC_UI.setText('pdc-count',   upcoming.length + ' cheque' + (upcoming.length !== 1 ? 's' : ''));
    DMC_UI.setText('pdc-banks',   countBanks(upcoming) + ' bank' + (countBanks(upcoming) !== 1 ? 's' : ''));

    /* Render each group */
    renderPDCGroup('pdc-group-critical', critical, 'critical', 'Due within 2 days');
    renderPDCGroup('pdc-group-soon',     soon,     'soon',     'Coming up — 3 to 7 days');
    renderPDCGroup('pdc-group-upcoming', later,    'upcoming', 'Upcoming — 8 to 10 days');
  }

  function countBanks(cheques) {
    var banks = {};
    cheques.forEach(function (c) { if (c.bank) banks[c.bank] = true; });
    return Object.keys(banks).length;
  }

  function renderPDCGroup(containerId, cheques, urgency, label) {
    var el = document.getElementById(containerId);
    if (!el) return;

    if (!cheques.length) {
      el.style.display = 'none';
      return;
    }

    el.style.display = '';

    var subtotal = cheques.reduce(function (s, c) { return s + c.amount; }, 0);

    var rows = cheques.map(function (c) {
      var days      = DMC_DATA.daysUntil(c.dueDate);
      var daysLbl   = DMC_UI.daysLabel(days);
      var dateStr   = DMC_UI.formatDate(c.dueDate);

      return [
        '<tr>',
          '<td><div class="cheque-payee">', c.payee, '</div></td>',
          '<td>', dateStr, '</td>',
          '<td><span class="pill pill-glass days-badge">', daysLbl, '</span></td>',
          '<td><span class="pill pill-glass bank-pill">',
            '<i class="ti ti-building-bank" aria-hidden="true" style="font-size:10px"></i> ',
            c.bank,
          '</span></td>',
          '<td class="text-right">',
            '<span class="pill pill-glass pill-amt-', urgency, '">', DMC_UI.fmt(c.amount), '</span>',
          '</td>',
        '</tr>'
      ].join('');
    }).join('');

    el.innerHTML = [
      '<div class="pdc-group ', urgency, '">',
        '<div class="pdc-group-header">',
          '<div class="pdc-group-label ', urgency, '">',
            '<div class="pdc-group-dot ', urgency, '"></div>',
            label,
          '</div>',
          '<div class="pdc-group-subtotal ', urgency, '">', DMC_UI.fmt(subtotal), '</div>',
        '</div>',
        '<table class="cheque-table" role="table">',
          '<thead>',
            '<tr>',
              '<th>Payee</th>',
              '<th>Due date</th>',
              '<th>Days away</th>',
              '<th>Bank</th>',
              '<th class="text-right">Amount</th>',
            '</tr>',
          '</thead>',
          '<tbody>', rows, '</tbody>',
        '</table>',
      '</div>'
    ].join('');
  }


  /* ----------------------------------------------------------
     Render charts
  ---------------------------------------------------------- */
  function renderCharts(allEntries) {
    var monthMap = DMC_DATA.byMonth(allEntries);
    DMC_CHARTS.renderMonthlyBar('chart-monthly', monthMap);
  }


  /* ----------------------------------------------------------
     Main render
     Called on load and every time the filter changes.
  ---------------------------------------------------------- */
  function render() {
    var allEntries = DMC_DATA.loadEntries();

    /* Filter entries based on current state */
    var filtered = state.from || state.to
      ? DMC_DATA.filterByRange(allEntries, state.from, state.to)
      : allEntries;

    renderKPIs(filtered);
    renderExpBreakdown(filtered);
    renderCharts(allEntries);  /* Charts always show all months for context */
    renderPDC();
  }


  /* ----------------------------------------------------------
     Greeting
     Sets "Good morning/afternoon/evening, Boqs"
     and today's date.
  ---------------------------------------------------------- */
  function renderGreeting() {
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Good morning'
                 : hour < 18 ? 'Good afternoon'
                 : 'Good evening';

    DMC_UI.setText('greeting-text', greeting + ', Boqs');
    DMC_UI.setText('greeting-date', new Date().toLocaleDateString('en-PH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
    DMC_UI.setText('last-updated', 'Last updated ' + new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit'
    }));
  }


  /* ----------------------------------------------------------
     Wire up filter shortcut buttons
  ---------------------------------------------------------- */
  function wireFilters() {
    document.querySelectorAll('.btn-shortcut').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onShortcutClick(btn, btn.dataset.filter);
      });
    });

    var fromEl = document.getElementById('filter-from');
    var toEl   = document.getElementById('filter-to');
    if (fromEl) fromEl.addEventListener('change', onDateChange);
    if (toEl)   toEl.addEventListener('change',   onDateChange);
  }


  /* ----------------------------------------------------------
     Set default filter — This month
  ---------------------------------------------------------- */
  function setDefaultFilter() {
    var range  = DMC_UI.getDateRange('month');
    state.from = range.from;
    state.to   = range.to;

    var fromEl = document.getElementById('filter-from');
    var toEl   = document.getElementById('filter-to');
    if (fromEl) fromEl.value = range.from || '';
    if (toEl)   toEl.value   = range.to   || '';

    /* Mark "This month" button as active */
    var monthBtn = document.querySelector('[data-filter="month"]');
    if (monthBtn) monthBtn.classList.add('active');
  }


  /* ----------------------------------------------------------
     Init — runs when the page loads
  ---------------------------------------------------------- */
  function init() {
    DMC_UI.setActiveNav();
    renderGreeting();
    setDefaultFilter();
    wireFilters();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
