/* ============================================================
   DMC Financial Portal
   js/data.js

   PURPOSE: The single source of truth for all data.
   All other JS files get data from here and save data here.
   No other file reads from or writes to storage directly.

   TO CONNECT A REAL DATABASE LATER:
   Replace the load() and save() functions below with your
   API calls (Google Sheets, Supabase, etc).
   Nothing else in the project needs to change.
   ============================================================ */

const DMC_DATA = (function () {

  /* ----------------------------------------------------------
     Storage key
     All entries are stored under this key in localStorage.
  ---------------------------------------------------------- */
  const STORAGE_KEY = 'dmc_entries_v1';
  const PDC_KEY     = 'dmc_cheques_v1';


  /* ----------------------------------------------------------
     Seed data
     Pre-loaded from the 2026 financial spreadsheet.
     Jan–Apr monthly closes.
  ---------------------------------------------------------- */
  const SEED_ENTRIES = [
    {
      id:       'seed-jan',
      date:     '2026-01-31',
      income:   770771.75,
      expenses: 704140.14,
      note:     'January close',
      channels: { cash: 0, gcash: 0, card: 0, fp: 0, other: 0 },
      expBreak: {
        sal: 35245.88, pur: 90000, rent: 70273,
        util: 5132.07, ben: 14865, meals: 18000,
        pcf: 70000, tax: 0, sun: 400.19
      }
    },
    {
      id:       'seed-feb',
      date:     '2026-02-28',
      income:   601008,
      expenses: 685620.56,
      note:     'February close',
      channels: { cash: 0, gcash: 0, card: 0, fp: 0, other: 0 },
      expBreak: {
        sal: 31244.88, pur: 80000, rent: 70723,
        util: 3303.95, ben: 17990, meals: 18000,
        pcf: 65000, tax: 0, sun: 358.73
      }
    },
    {
      id:       'seed-mar',
      date:     '2026-03-31',
      income:   957856.80,
      expenses: 786930.39,
      note:     'March close',
      channels: { cash: 0, gcash: 0, card: 0, fp: 0, other: 0 },
      expBreak: {
        sal: 66268.78, pur: 110000, rent: 80014,
        util: 5695, ben: 9234, meals: 18000,
        pcf: 80000, tax: 0, sun: 17718.61
      }
    },
    {
      id:       'seed-apr',
      date:     '2026-04-30',
      income:   1202571.20,
      expenses: 1221421.52,
      note:     'April close',
      channels: { cash: 0, gcash: 0, card: 0, fp: 0, other: 0 },
      expBreak: {
        sal: 93262.62, pur: 120000, rent: 90000,
        util: 13935.48, ben: 17990, meals: 18000,
        pcf: 80000, tax: 0, sun: 188233.42
      }
    }
  ];

  /* Seed cheques — sample PDC data */
  const SEED_CHEQUES = [
    {
      id:      'chq-001',
      payee:   'FJC Raels Meatshop',
      bank:    'BDO',
      amount:  85000,
      dueDate: '2026-05-31',
      note:    'Monthly meat supply'
    },
    {
      id:      'chq-002',
      payee:   'Golden Dragon Supplies',
      bank:    'Metrobank',
      amount:  120000,
      dueDate: '2026-06-02',
      note:    'Dry goods delivery'
    },
    {
      id:      'chq-003',
      payee:   'SM Supermarket',
      bank:    'BDO',
      amount:  63500,
      dueDate: '2026-06-05',
      note:    'Weekly supplies'
    },
    {
      id:      'chq-004',
      payee:   'Landbank — Loan payment',
      bank:    'Landbank',
      amount:  80000,
      dueDate: '2026-06-08',
      note:    'Monthly loan amortization'
    }
  ];


  /* ----------------------------------------------------------
     ENTRIES — Load
     Returns all entries sorted oldest to newest.

     TO REPLACE WITH API:
       const res = await fetch('/api/entries');
       return await res.json();
  ---------------------------------------------------------- */
  function loadEntries() {
    try {
      const raw     = localStorage.getItem(STORAGE_KEY);
      const stored  = raw ? JSON.parse(raw) : [];
      const seedIds = SEED_ENTRIES.map(function (e) { return e.id; });

      /* Merge seed + user entries, no duplicates */
      const all = SEED_ENTRIES.slice();
      stored.forEach(function (e) {
        if (!seedIds.includes(e.id)) all.push(e);
      });

      return all.sort(function (a, b) {
        return a.date.localeCompare(b.date);
      });
    } catch (err) {
      console.error('[DMC_DATA] loadEntries error:', err);
      return SEED_ENTRIES.slice();
    }
  }


  /* ----------------------------------------------------------
     ENTRIES — Save one entry
     Appends a new entry to localStorage.

     TO REPLACE WITH API:
       await fetch('/api/entries', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(entry)
       });
  ---------------------------------------------------------- */
  function saveEntry(entry) {
    try {
      /* Generate a unique ID if not provided */
      if (!entry.id) {
        entry.id = 'entry-' + Date.now();
      }

      const raw    = localStorage.getItem(STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : [];
      stored.push(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      return true;
    } catch (err) {
      console.error('[DMC_DATA] saveEntry error:', err);
      return false;
    }
  }


  /* ----------------------------------------------------------
     CHEQUES — Load
     Returns all cheques sorted by due date ascending.
  ---------------------------------------------------------- */
  function loadCheques() {
    try {
      const raw    = localStorage.getItem(PDC_KEY);
      const stored = raw ? JSON.parse(raw) : [];
      const seedIds= SEED_CHEQUES.map(function (c) { return c.id; });

      const all = SEED_CHEQUES.slice();
      stored.forEach(function (c) {
        if (!seedIds.includes(c.id)) all.push(c);
      });

      return all.sort(function (a, b) {
        return a.dueDate.localeCompare(b.dueDate);
      });
    } catch (err) {
      console.error('[DMC_DATA] loadCheques error:', err);
      return SEED_CHEQUES.slice();
    }
  }


  /* ----------------------------------------------------------
     CHEQUES — Save one cheque
  ---------------------------------------------------------- */
  function saveCheque(cheque) {
    try {
      if (!cheque.id) {
        cheque.id = 'chq-' + Date.now();
      }
      const raw    = localStorage.getItem(PDC_KEY);
      const stored = raw ? JSON.parse(raw) : [];
      stored.push(cheque);
      localStorage.setItem(PDC_KEY, JSON.stringify(stored));
      return true;
    } catch (err) {
      console.error('[DMC_DATA] saveCheque error:', err);
      return false;
    }
  }


  /* ----------------------------------------------------------
     HELPERS — Aggregate entries by calendar month
     Returns an object keyed by 'YYYY-MM'.
     Example: { '2026-01': { income: 770771, expenses: 704140, expBreak: {...} } }
  ---------------------------------------------------------- */
  function byMonth(entries) {
    var map = {};
    entries.forEach(function (e) {
      var key = e.date.substring(0, 7);
      if (!map[key]) {
        map[key] = {
          income: 0, expenses: 0,
          expBreak: {
            sal: 0, pur: 0, rent: 0, util: 0,
            ben: 0, meals: 0, pcf: 0, tax: 0, sun: 0
          }
        };
      }
      map[key].income   += e.income;
      map[key].expenses += e.expenses;
      if (e.expBreak) {
        Object.keys(map[key].expBreak).forEach(function (cat) {
          map[key].expBreak[cat] += (e.expBreak[cat] || 0);
        });
      }
    });
    return map;
  }


  /* ----------------------------------------------------------
     HELPERS — Filter entries by date range
  ---------------------------------------------------------- */
  function filterByRange(entries, from, to) {
    return entries.filter(function (e) {
      if (from && e.date < from) return false;
      if (to   && e.date > to)   return false;
      return true;
    });
  }


  /* ----------------------------------------------------------
     HELPERS — Filter entries by month key ('YYYY-MM')
  ---------------------------------------------------------- */
  function filterByMonth(entries, monthKey) {
    return entries.filter(function (e) {
      return e.date.substring(0, 7) === monthKey;
    });
  }


  /* ----------------------------------------------------------
     HELPERS — YTD summary totals
  ---------------------------------------------------------- */
  function ytdSummary(entries) {
    return entries.reduce(function (acc, e) {
      acc.income   += e.income;
      acc.expenses += e.expenses;
      return acc;
    }, { income: 0, expenses: 0 });
  }


  /* ----------------------------------------------------------
     HELPERS — Expense category breakdown totals
  ---------------------------------------------------------- */
  function expenseBreakdown(entries) {
    var totals = {
      sal: 0, pur: 0, rent: 0, util: 0,
      ben: 0, meals: 0, pcf: 0, tax: 0, sun: 0
    };
    entries.forEach(function (e) {
      if (e.expBreak) {
        Object.keys(totals).forEach(function (cat) {
          totals[cat] += (e.expBreak[cat] || 0);
        });
      }
    });
    return totals;
  }


  /* ----------------------------------------------------------
     HELPERS — Get cheques due within N days from today
  ---------------------------------------------------------- */
  function chequesWithinDays(cheques, days) {
    var today    = new Date();
    today.setHours(0, 0, 0, 0);
    var future   = new Date(today);
    future.setDate(future.getDate() + days);
    var futureStr = future.toISOString().split('T')[0];
    var todayStr  = today.toISOString().split('T')[0];

    return cheques.filter(function (c) {
      return c.dueDate >= todayStr && c.dueDate <= futureStr;
    });
  }


  /* ----------------------------------------------------------
     HELPERS — Days from today until a given date string
  ---------------------------------------------------------- */
  function daysUntil(dateStr) {
    var today  = new Date();
    today.setHours(0, 0, 0, 0);
    var target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    var diff   = Math.round((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  }


  /* ----------------------------------------------------------
     HELPERS — Get today's date string 'YYYY-MM-DD'
  ---------------------------------------------------------- */
  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }


  /* ----------------------------------------------------------
     HELPERS — Get current month key 'YYYY-MM'
  ---------------------------------------------------------- */
  function currentMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }


  /* ----------------------------------------------------------
     Public API
     Only expose what other files need. Keep internals private.
  ---------------------------------------------------------- */
  return {
    /* Entries */
    loadEntries:      loadEntries,
    saveEntry:        saveEntry,

    /* Cheques */
    loadCheques:      loadCheques,
    saveCheque:       saveCheque,

    /* Aggregators */
    byMonth:          byMonth,
    ytdSummary:       ytdSummary,
    expenseBreakdown: expenseBreakdown,

    /* Filters */
    filterByRange:    filterByRange,
    filterByMonth:    filterByMonth,

    /* Cheque helpers */
    chequesWithinDays: chequesWithinDays,
    daysUntil:         daysUntil,

    /* Date helpers */
    todayStr:         todayStr,
    currentMonthKey:  currentMonthKey
  };

})();
