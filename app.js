'use strict';

/* Storage keys */
const DB_STORAGE_KEY  = 'abcLogisticsDB';   // serialized SQL.js database (Uint8Array as JSON)
const ID_KEY          = 'abcLogisticsNextId';
const LEGACY_KEY      = 'abcLogisticsInventory'; // old localStorage format — migrated on first run

let db = null;                  // SQL.js Database instance (synchronous after init)
let inventory = [];             // In-memory cache; refreshed from DB after every write
let inventoryChartInstance = null;

// ============================================================
// DATABASE LAYER
// ============================================================

async function initDatabase() {
  // initSqlJs is provided by the sql-wasm.js CDN script loaded in index.html.
  // locateFile tells it where to fetch the companion .wasm binary from the same CDN path.
  const SQL = await initSqlJs({
    locateFile: filename =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${filename}`
  });

  // Restore an existing serialized DB from localStorage if available
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  if (stored) {
    try {
      db = new SQL.Database(new Uint8Array(JSON.parse(stored)));
    } catch {
      db = new SQL.Database(); // corrupt storage — start fresh
    }
  } else {
    db = new SQL.Database();
  }

  // Create the inventory table if this is a brand-new database
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      category   TEXT NOT NULL,
      quantity   REAL NOT NULL DEFAULT 0,
      unitPrice  REAL NOT NULL DEFAULT 0,
      totalValue REAL NOT NULL DEFAULT 0,
      dateAdded  TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'In Stock'
    )
  `);

  // Seed or migrate only when the table is empty
  const rowCount = db.exec('SELECT COUNT(*) FROM inventory')[0]?.values[0][0] ?? 0;
  if (rowCount === 0) {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      // Migrate items from the previous localStorage-only format
      try {
        JSON.parse(legacy).forEach(item => dbInsertItem(item));
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        seedData();
      }
    } else {
      seedData();
    }
  }

  saveDatabase();
}

/* Serialize the in-memory SQLite DB back to localStorage after every write. */
function saveDatabase() {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(Array.from(db.export())));
  } catch (e) {
    console.warn('localStorage quota exceeded — DB not persisted:', e);
  }
}

/* Refresh the inventory array from the DB. Call after any INSERT / UPDATE / DELETE. */
function loadInventoryFromDB() {
  const result = db.exec('SELECT * FROM inventory ORDER BY dateAdded DESC');
  if (!result.length) { inventory = []; return; }
  const cols = result[0].columns;
  inventory = result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function dbInsertItem(item) {
  db.run(
    `INSERT INTO inventory
     (id, name, category, quantity, unitPrice, totalValue, dateAdded, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.name, item.category, item.quantity,
     item.unitPrice, item.totalValue, item.dateAdded, item.status]
  );
}

function dbDeleteItem(id) {
  db.run('DELETE FROM inventory WHERE id = ?', [id]);
}

/*
 * Returns the first item whose name matches (case-insensitive), or null if none.
 * Used to block duplicate inserts before they reach the DB.
 */
function dbCheckDuplicate(name) {
  const result = db.exec(
    'SELECT id, name FROM inventory WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name.trim()]
  );
  if (!result.length || !result[0].values.length) return null;
  return { id: result[0].values[0][0], name: result[0].values[0][1] };
}

// ============================================================
// DUPLICATE DETECTION & MERGING
// ============================================================

/*
 * Scans the DB for items sharing the same name (case-insensitive).
 * For each duplicate group: keeps the oldest record, adds all quantities together,
 * and deletes the remaining duplicates.
 * Returns a summary array so the caller can display a warning banner.
 */
function detectAndMergeDuplicates() {
  const dupeResult = db.exec(`
    SELECT LOWER(name) AS lname, COUNT(*) AS cnt
    FROM inventory
    GROUP BY LOWER(name)
    HAVING cnt > 1
  `);

  if (!dupeResult.length || !dupeResult[0].values.length) return [];

  const mergedSummary = [];

  dupeResult[0].values.forEach(([lname]) => {
    // Fetch all rows for this name, oldest first — the first becomes the keeper
    const rows = db.exec(
      'SELECT * FROM inventory WHERE LOWER(name) = ? ORDER BY dateAdded ASC',
      [lname]
    );
    if (!rows.length) return;

    const cols = rows[0].columns;
    const items = rows[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    const keeper = items[0];
    const mergedQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);

    // Update keeper with the combined quantity
    db.run('UPDATE inventory SET quantity = ?, totalValue = ? WHERE id = ?',
      [mergedQty, mergedQty * Number(keeper.unitPrice), keeper.id]);

    // Remove the duplicates
    items.slice(1).forEach(i => db.run('DELETE FROM inventory WHERE id = ?', [i.id]));

    mergedSummary.push({ name: keeper.name, count: items.length, mergedQty });
  });

  if (mergedSummary.length > 0) saveDatabase();
  return mergedSummary;
}

function showDuplicateWarning(mergedItems) {
  const banner  = document.getElementById('duplicate-warning');
  const detail  = document.getElementById('duplicate-detail');
  const dismiss = document.getElementById('dismiss-warning');
  if (!banner || !mergedItems.length) return;

  const list = mergedItems
    .map(m => `"${m.name}" (${m.count} entries merged, combined qty: ${m.mergedQty})`)
    .join('; ');
  detail.textContent = ` ${list}.`;
  banner.style.display = 'flex';

  dismiss.addEventListener('click', () => { banner.style.display = 'none'; }, { once: true });
}

// ============================================================
// SEED DATA
// ============================================================

function seedData() {
  const seeds = [
    { id: 'ABC-0001', name: 'Forklift Model X200',     category: 'Equipment',      quantity: 3,  unitPrice: 45000, totalValue: 135000, dateAdded: '2025-11-15', status: 'In Stock' },
    { id: 'ABC-0002', name: 'Pallet Wrap Film',         category: 'Supplies',       quantity: 8,  unitPrice: 120,   totalValue: 960,    dateAdded: '2025-12-01', status: 'Low Stock' },
    { id: 'ABC-0003', name: 'Steel Beams 6m',           category: 'Raw Materials',  quantity: 0,  unitPrice: 850,   totalValue: 0,      dateAdded: '2025-12-10', status: 'Out of Stock' },
    { id: 'ABC-0004', name: 'Shipping Containers 20ft', category: 'Finished Goods', quantity: 12, unitPrice: 3200,  totalValue: 38400,  dateAdded: '2026-01-05', status: 'In Stock' },
    { id: 'ABC-0005', name: 'Safety Helmets',           category: 'Supplies',       quantity: 45, unitPrice: 35,    totalValue: 1575,   dateAdded: '2026-01-20', status: 'In Stock' },
  ];
  seeds.forEach(item => dbInsertItem(item));
  // Reserve IDs 1-5 for seeds; next user-created item gets ABC-0006
  localStorage.setItem(ID_KEY, '6');
}

// ============================================================
// ID GENERATION
// ============================================================

function getNextId() {
  const counter = parseInt(localStorage.getItem(ID_KEY) || '1', 10);
  localStorage.setItem(ID_KEY, String(counter + 1));
  return 'ABC-' + String(counter).padStart(4, '0');
}

// ============================================================
// KPIs
// ============================================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function updateKPIs() {
  const totalItems      = inventory.length;
  const totalValue      = inventory.reduce((sum, i) => sum + i.totalValue, 0);
  const lowStockCount   = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
  const categoriesInUse = new Set(inventory.map(i => i.category)).size;

  document.getElementById('kpi-total-items').textContent  = totalItems;
  document.getElementById('kpi-total-value').textContent  = formatCurrency(totalValue);
  document.getElementById('kpi-low-stock').textContent    = lowStockCount;
  document.getElementById('kpi-categories').textContent   = categoriesInUse;
}

// ============================================================
// RECENT ACTIVITY
// ============================================================

function statusBadge(status) {
  const cls = status === 'In Stock' ? 'badge-success'
    : status === 'Low Stock' ? 'badge-warning' : 'badge-danger';
  return `<span class="badge ${cls}">${status}</span>`;
}

function updateRecentActivity() {
  const tbody = document.getElementById('recent-tbody');
  // ISO YYYY-MM-DD strings sort correctly as plain strings; slice the 5 most recent
  const recent = [...inventory]
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No recent activity.</td></tr>';
    return;
  }
  tbody.innerHTML = recent.map(item => `
    <tr>
      <td><code>${item.id}</code></td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${formatCurrency(item.totalValue)}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${item.dateAdded}</td>
    </tr>
  `).join('');
}

// ============================================================
// CHART
// ============================================================

function buildChartData() {
  // Sort alphabetically so chart order is stable across add/delete operations
  const sorted = [...inventory].sort((a, b) => a.name.localeCompare(b.name));

  const labels = sorted.map(item => {
    const n = item.name || '(unnamed)';
    return n.length > 20 ? n.slice(0, 18) + '\u2026' : n;
  });

  const quantities = sorted.map(item => {
    const q = Number(item.quantity);
    return isNaN(q) ? 0 : q;
  });

  // Colour-code bars: danger red for 0, warning amber for <=5, primary blue otherwise
  const backgroundColors = quantities.map(q => {
    if (q === 0) return 'rgba(220, 38, 38, 0.75)';
    if (q <= 5)  return 'rgba(217, 119, 6, 0.75)';
    return 'rgba(26, 58, 92, 0.75)';
  });

  const borderColors = quantities.map(q => {
    if (q === 0) return '#dc2626';
    if (q <= 5)  return '#d97706';
    return '#1a3a5c';
  });

  return { labels, quantities, backgroundColors, borderColors, sorted };
}

function renderInventoryChart() {
  const canvas = document.getElementById('inventory-chart');
  if (!canvas) return;

  // Chart.js throws "Canvas is already in use" if you call new Chart() on a canvas
  // that already has a live instance attached. Destroying first avoids that error.
  if (inventoryChartInstance) {
    inventoryChartInstance.destroy();
    inventoryChartInstance = null;
  }

  const { labels, quantities, backgroundColors, borderColors, sorted } = buildChartData();

  if (labels.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px Segoe UI, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('No inventory items to display.', canvas.width / 2, canvas.height / 2);
    return;
  }

  inventoryChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Quantity',
        data: quantities,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // Show the full untruncated item name in the tooltip
            title: (items) => sorted[items[0].dataIndex]?.name || items[0].label,
            label: (item)  => ` Quantity: ${item.raw}`,
          }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 11 }, color: '#64748b', maxRotation: 45, minRotation: 0 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 }, color: '#64748b', precision: 0 },
          grid: { color: '#e2e8f0' },
        }
      }
    }
  });
}

// ============================================================
// DASHBOARD SEARCH
// ============================================================

function renderDashboardResults(searchTerm) {
  const term    = (searchTerm || '').trim().toLowerCase();
  const tbody   = document.getElementById('dashboard-results-tbody');
  const noRes   = document.getElementById('dashboard-no-results');
  const wrapper = document.getElementById('dashboard-results-wrapper');
  if (!tbody) return;

  // Empty search: reset chart to full data set, hide results table
  if (term === '') {
    wrapper.style.display = 'none';
    noRes.style.display   = 'none';
    renderInventoryChart();
    return;
  }

  wrapper.style.display = '';

  const matched = inventory.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.id.toLowerCase().includes(term)
  );

  // Rebuild chart with only matched items. Must destroy the existing instance first
  // (same reason as in renderInventoryChart — Chart.js rejects reuse of a live canvas).
  if (inventoryChartInstance) {
    inventoryChartInstance.destroy();
    inventoryChartInstance = null;
  }

  const canvas = document.getElementById('inventory-chart');
  if (canvas) {
    if (matched.length > 0) {
      const sm     = [...matched].sort((a, b) => a.name.localeCompare(b.name));
      const labels = sm.map(i => { const n = i.name || '(unnamed)'; return n.length > 20 ? n.slice(0, 18) + '\u2026' : n; });
      const qtys   = sm.map(i => { const q = Number(i.quantity); return isNaN(q) ? 0 : q; });
      const bg     = qtys.map(q => q === 0 ? 'rgba(220,38,38,0.75)' : q <= 5 ? 'rgba(217,119,6,0.75)' : 'rgba(26,58,92,0.75)');
      const bd     = qtys.map(q => q === 0 ? '#dc2626' : q <= 5 ? '#d97706' : '#1a3a5c');

      inventoryChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Quantity', data: qtys, backgroundColor: bg, borderColor: bd, borderWidth: 1, borderRadius: 4 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { title: (it) => sm[it[0].dataIndex]?.name || it[0].label, label: (it) => ` Quantity: ${it.raw}` } }
          },
          scales: {
            x: { ticks: { font: { size: 11 }, color: '#64748b', maxRotation: 45 }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { font: { size: 11 }, color: '#64748b', precision: 0 }, grid: { color: '#e2e8f0' } }
          }
        }
      });
    } else {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Segoe UI, system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No items match your search.', canvas.width / 2, canvas.height / 2);
    }
  }

  if (matched.length === 0) {
    tbody.innerHTML = '';
    noRes.style.display  = 'block';
    noRes.textContent    = `No items found matching "${searchTerm}".`;
    return;
  }

  noRes.style.display = 'none';
  tbody.innerHTML = matched
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item => {
      const qty    = isNaN(Number(item.quantity)) ? 0 : Number(item.quantity);
      const qtyCls = qty === 0 ? 'qty-zero' : '';
      return `
        <tr>
          <td><code>${item.id}</code></td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td class="${qtyCls}">${qty}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${statusBadge(item.status)}</td>
        </tr>`;
    }).join('');
}

function initDashboardSearch() {
  const input   = document.getElementById('dashboard-search-input');
  const wrapper = document.getElementById('dashboard-results-wrapper');
  const noRes   = document.getElementById('dashboard-no-results');
  if (!input) return;

  if (wrapper) wrapper.style.display = 'none';
  if (noRes)   noRes.style.display   = 'none';

  input.addEventListener('input', () => renderDashboardResults(input.value));
}

// ============================================================
// INVENTORY TABLE
// ============================================================

function getCurrentFilter() {
  return {
    search:   (document.getElementById('search-input')?.value || '').toLowerCase(),
    category: document.getElementById('filter-category')?.value || '',
    status:   document.getElementById('filter-status')?.value  || '',
  };
}

function renderInventoryTable(filter) {
  const tbody = document.getElementById('inventory-tbody');
  const noMsg = document.getElementById('no-items-msg');

  let filtered = inventory.filter(item => {
    const matchSearch = !filter.search ||
      item.name.toLowerCase().includes(filter.search) ||
      item.id.toLowerCase().includes(filter.search);
    const matchCat    = !filter.category || item.category === filter.category;
    const matchStatus = !filter.status   || item.status   === filter.status;
    return matchSearch && matchCat && matchStatus;
  });

  // ISO YYYY-MM-DD strings sort correctly as plain strings
  filtered.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  if (filtered.length === 0) {
    tbody.innerHTML      = '';
    noMsg.style.display  = 'block';
    return;
  }

  noMsg.style.display = 'none';
  tbody.innerHTML = filtered.map(item => `
    <tr>
      <td><code>${item.id}</code></td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(item.totalValue)}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${item.dateAdded}</td>
      <td><button class="btn-delete" data-id="${item.id}">Delete</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
  });
}

// ============================================================
// DELETE
// ============================================================

function deleteItem(id) {
  if (!confirm(`Delete item ${id}? This cannot be undone.`)) return;
  dbDeleteItem(id);
  saveDatabase();
  loadInventoryFromDB();
  updateKPIs();
  updateRecentActivity();
  renderInventoryTable(getCurrentFilter());
  const dashTerm = document.getElementById('dashboard-search-input')?.value || '';
  renderDashboardResults(dashTerm);
}

// ============================================================
// FORM — VALIDATION HELPERS
// ============================================================

/* Apply a red border and show an error message below the field. */
function setFieldError(fieldEl, errId, message) {
  fieldEl.classList.add('input-error');
  const span = document.getElementById(errId);
  if (span) span.textContent = message;
}

/* Remove red border and clear the error message. */
function clearFieldError(fieldEl, errId) {
  fieldEl.classList.remove('input-error');
  const span = document.getElementById(errId);
  if (span) span.textContent = '';
}

/* Clear all field errors at once (used on submit attempt and Clear button). */
function clearAllFieldErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
}

// ============================================================
// FORM — INIT & SUBMISSION
// ============================================================

function initForm() {
  const form     = document.getElementById('inventory-form');
  const fName    = document.getElementById('f-name');
  const fCat     = document.getElementById('f-category');
  const fQty     = document.getElementById('f-quantity');
  const fPrice   = document.getElementById('f-unitPrice');
  const fTotal   = document.getElementById('f-totalValue');
  const fStatus  = document.getElementById('f-status');
  const feedback = document.getElementById('form-feedback');
  const resetBtn = document.getElementById('reset-form-btn');

  function recalcTotal() {
    const qty   = parseFloat(fQty.value);
    const price = parseFloat(fPrice.value);
    fTotal.value = (!isNaN(qty) && !isNaN(price)) ? formatCurrency(qty * price) : '';
  }

  /* Live validation on numeric inputs.
   * validity.badInput is true when the browser has rejected non-numeric text
   * typed into a type="number" field — this is how we detect "alphanumeric in a number field". */
  fQty.addEventListener('input', () => {
    if (fQty.validity.badInput) {
      setFieldError(fQty, 'err-quantity', 'Numbers only — letters and symbols are not allowed.');
    } else if (fQty.value !== '' && parseFloat(fQty.value) < 0) {
      setFieldError(fQty, 'err-quantity', 'Quantity cannot be negative.');
    } else {
      clearFieldError(fQty, 'err-quantity');
    }
    recalcTotal();
  });

  fPrice.addEventListener('input', () => {
    if (fPrice.validity.badInput) {
      setFieldError(fPrice, 'err-unitPrice', 'Numbers only — letters and symbols are not allowed.');
    } else if (fPrice.value !== '' && parseFloat(fPrice.value) < 0) {
      setFieldError(fPrice, 'err-unitPrice', 'Unit price cannot be negative.');
    } else {
      clearFieldError(fPrice, 'err-unitPrice');
    }
    recalcTotal();
  });

  // Clear field-level errors as the user corrects their input
  fName.addEventListener('input',  () => clearFieldError(fName, 'err-name'));
  fCat.addEventListener('change',  () => clearFieldError(fCat,  'err-category'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllFieldErrors();
    feedback.className = '';
    feedback.textContent = '';

    const name      = fName.value.trim();
    const category  = fCat.value;
    const quantity  = parseFloat(fQty.value);
    const unitPrice = parseFloat(fPrice.value);
    const status    = fStatus.value;
    let hasError    = false;

    // --- Name ---
    if (!name) {
      setFieldError(fName, 'err-name', 'Item name is required.');
      hasError = true;
    }

    // --- Category ---
    if (!category) {
      setFieldError(fCat, 'err-category', 'Please select a category.');
      hasError = true;
    }

    // --- Quantity ---
    if (fQty.validity.badInput) {
      setFieldError(fQty, 'err-quantity', 'Numbers only — letters and symbols are not allowed.');
      hasError = true;
    } else if (fQty.value === '' || isNaN(quantity)) {
      setFieldError(fQty, 'err-quantity', 'Quantity is required.');
      hasError = true;
    } else if (quantity < 0) {
      setFieldError(fQty, 'err-quantity', 'Quantity cannot be negative.');
      hasError = true;
    }

    // --- Unit Price ---
    if (fPrice.validity.badInput) {
      setFieldError(fPrice, 'err-unitPrice', 'Numbers only — letters and symbols are not allowed.');
      hasError = true;
    } else if (fPrice.value === '' || isNaN(unitPrice)) {
      setFieldError(fPrice, 'err-unitPrice', 'Unit price is required.');
      hasError = true;
    } else if (unitPrice < 0) {
      setFieldError(fPrice, 'err-unitPrice', 'Unit price cannot be negative.');
      hasError = true;
    }

    if (hasError) return;

    // --- Duplicate name check (case-insensitive SQL query) ---
    const existing = dbCheckDuplicate(name);
    if (existing) {
      setFieldError(fName, 'err-name',
        `"${existing.name}" already exists (${existing.id}). Item names must be unique.`);
      return;
    }

    // --- All checks passed — insert ---
    const item = {
      id:         getNextId(),
      name,
      category,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      dateAdded:  new Date().toISOString().slice(0, 10),
      status,
    };

    dbInsertItem(item);
    saveDatabase();
    loadInventoryFromDB();
    updateKPIs();
    updateRecentActivity();
    renderInventoryTable(getCurrentFilter());
    const dashTerm = document.getElementById('dashboard-search-input')?.value || '';
    renderDashboardResults(dashTerm);

    form.reset();
    fTotal.value = '';
    clearAllFieldErrors();

    feedback.className   = 'success';
    feedback.textContent = `Item "${item.name}" (${item.id}) added successfully.`;
    setTimeout(() => { feedback.textContent = ''; feedback.className = ''; }, 4000);
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    fTotal.value         = '';
    feedback.textContent = '';
    feedback.className   = '';
    clearAllFieldErrors();
  });
}

// ============================================================
// NAVIGATION
// ============================================================

function initNavigation() {
  const links    = document.querySelectorAll('[data-section]');
  const sections = document.querySelectorAll('.section');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      links.forEach(l    => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(target)?.classList.add('active');
      if (target === 'inventory') renderInventoryTable(getCurrentFilter());
    });
  });
}

// ============================================================
// FILTERS
// ============================================================

function initFilters() {
  document.getElementById('search-input')?.addEventListener('input',  () => renderInventoryTable(getCurrentFilter()));
  document.getElementById('filter-category')?.addEventListener('change', () => renderInventoryTable(getCurrentFilter()));
  document.getElementById('filter-status')?.addEventListener('change',   () => renderInventoryTable(getCurrentFilter()));
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDatabase();
  } catch (err) {
    // SQL.js failed to load (e.g. offline, CDN blocked). Show a clear error to the user.
    console.error('Database initialisation failed:', err);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;padding:2rem;">
        <div style="text-align:center;color:#dc2626;max-width:400px;">
          <h2 style="margin-bottom:.5rem;">Database failed to load</h2>
          <p>Please check your internet connection and reload the page.<br>
             The database library is loaded from a CDN and requires an internet connection.</p>
        </div>
      </div>`;
    return;
  }

  // Check for and merge any duplicate items that may exist in the loaded data
  const merged = detectAndMergeDuplicates();
  loadInventoryFromDB();

  initNavigation();
  initForm();
  initFilters();
  updateKPIs();
  updateRecentActivity();
  renderInventoryTable({ search: '', category: '', status: '' });
  renderInventoryChart();
  initDashboardSearch();

  // Show a dashboard warning banner if duplicates were found and merged
  if (merged.length > 0) showDuplicateWarning(merged);
});
