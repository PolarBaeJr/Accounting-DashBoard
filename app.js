'use strict';

const STORAGE_KEY = 'abcLogisticsInventory';
const ID_KEY = 'abcLogisticsNextId';

let inventory = [];
let inventoryChartInstance = null;

// --- Persistence ---

function loadInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    inventory = raw ? JSON.parse(raw) : [];
  } catch {
    inventory = [];
  }
  if (inventory.length === 0) {
    seedData();
  }
}

function saveInventory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  } catch (e) {
    console.warn('Storage quota exceeded', e);
  }
}

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
            label: (item) => ` Quantity: ${item.raw}`,
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

function renderDashboardResults(searchTerm) {
  const term = (searchTerm || '').trim().toLowerCase();
  const tbody = document.getElementById('dashboard-results-tbody');
  const noResults = document.getElementById('dashboard-no-results');
  const wrapper = document.getElementById('dashboard-results-wrapper');

  if (!tbody) return;

  // Empty search: show full chart, hide results table
  if (term === '') {
    wrapper.style.display = 'none';
    noResults.style.display = 'none';
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
      const sortedMatched = [...matched].sort((a, b) => a.name.localeCompare(b.name));
      const labels = sortedMatched.map(i => {
        const n = i.name || '(unnamed)';
        return n.length > 20 ? n.slice(0, 18) + '\u2026' : n;
      });
      const quantities = sortedMatched.map(i => {
        const q = Number(i.quantity);
        return isNaN(q) ? 0 : q;
      });
      const bg = quantities.map(q => q === 0 ? 'rgba(220,38,38,0.75)' : q <= 5 ? 'rgba(217,119,6,0.75)' : 'rgba(26,58,92,0.75)');
      const border = quantities.map(q => q === 0 ? '#dc2626' : q <= 5 ? '#d97706' : '#1a3a5c');

      inventoryChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Quantity', data: quantities, backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: 4 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => sortedMatched[items[0].dataIndex]?.name || items[0].label,
                label: (item) => ` Quantity: ${item.raw}`,
              }
            }
          },
          scales: {
            x: { ticks: { font: { size: 11 }, color: '#64748b', maxRotation: 45 }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { font: { size: 11 }, color: '#64748b', precision: 0 }, grid: { color: '#e2e8f0' } }
          }
        }
      });
    } else {
      // No matches: draw placeholder text on canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Segoe UI, system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No items match your search.', canvas.width / 2, canvas.height / 2);
    }
  }

  // Render mini results table
  if (matched.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
    noResults.textContent = `No items found matching "${searchTerm}".`;
    return;
  }

  noResults.style.display = 'none';
  tbody.innerHTML = matched
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item => {
      const q = Number(item.quantity);
      const qty = isNaN(q) ? 0 : q;
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
  const input = document.getElementById('dashboard-search-input');
  if (!input) return;

  // Hide results table on init; show full chart by default
  const wrapper = document.getElementById('dashboard-results-wrapper');
  const noResults = document.getElementById('dashboard-no-results');
  if (wrapper) wrapper.style.display = 'none';
  if (noResults) noResults.style.display = 'none';

  input.addEventListener('input', () => {
    renderDashboardResults(input.value);
  });
}

function getNextId() {
  const counter = parseInt(localStorage.getItem(ID_KEY) || '1', 10);
  localStorage.setItem(ID_KEY, String(counter + 1));
  return 'ABC-' + String(counter).padStart(4, '0');
}

function seedData() {
  // Set counter to 6 since seeds use ABC-0001 through ABC-0005
  localStorage.setItem(ID_KEY, '6');
  inventory = [
    { id: 'ABC-0001', name: 'Forklift Model X200', category: 'Equipment', quantity: 3, unitPrice: 45000, totalValue: 135000, dateAdded: '2025-11-15', status: 'In Stock' },
    { id: 'ABC-0002', name: 'Pallet Wrap Film', category: 'Supplies', quantity: 8, unitPrice: 120, totalValue: 960, dateAdded: '2025-12-01', status: 'Low Stock' },
    { id: 'ABC-0003', name: 'Steel Beams 6m', category: 'Raw Materials', quantity: 0, unitPrice: 850, totalValue: 0, dateAdded: '2025-12-10', status: 'Out of Stock' },
    { id: 'ABC-0004', name: 'Shipping Containers 20ft', category: 'Finished Goods', quantity: 12, unitPrice: 3200, totalValue: 38400, dateAdded: '2026-01-05', status: 'In Stock' },
    { id: 'ABC-0005', name: 'Safety Helmets', category: 'Supplies', quantity: 45, unitPrice: 35, totalValue: 1575, dateAdded: '2026-01-20', status: 'In Stock' },
  ];
  saveInventory();
}

// --- KPIs ---

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function updateKPIs() {
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
  const categoriesInUse = new Set(inventory.map(i => i.category)).size;

  document.getElementById('kpi-total-items').textContent = totalItems;
  document.getElementById('kpi-total-value').textContent = formatCurrency(totalValue);
  document.getElementById('kpi-low-stock').textContent = lowStockCount;
  document.getElementById('kpi-categories').textContent = categoriesInUse;
}

// --- Recent Activity ---

function statusBadge(status) {
  const cls = status === 'In Stock' ? 'badge-success' : status === 'Low Stock' ? 'badge-warning' : 'badge-danger';
  return `<span class="badge ${cls}">${status}</span>`;
}

function updateRecentActivity() {
  const tbody = document.getElementById('recent-tbody');
  // ISO YYYY-MM-DD strings sort correctly as plain strings; slice the 5 most recent
  const recent = [...inventory].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 5);
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

// --- Inventory Table ---

function getCurrentFilter() {
  return {
    search: (document.getElementById('search-input')?.value || '').toLowerCase(),
    category: document.getElementById('filter-category')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
  };
}

function renderInventoryTable(filter) {
  const tbody = document.getElementById('inventory-tbody');
  const noMsg = document.getElementById('no-items-msg');

  let filtered = inventory.filter(item => {
    const matchSearch = !filter.search ||
      item.name.toLowerCase().includes(filter.search) ||
      item.id.toLowerCase().includes(filter.search);
    const matchCat = !filter.category || item.category === filter.category;
    const matchStatus = !filter.status || item.status === filter.status;
    return matchSearch && matchCat && matchStatus;
  });

  // ISO YYYY-MM-DD strings sort correctly as plain strings
  filtered.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    noMsg.style.display = 'block';
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

// --- Delete ---

function deleteItem(id) {
  if (!confirm(`Delete item ${id}? This cannot be undone.`)) return;
  inventory = inventory.filter(item => item.id !== id);
  saveInventory();
  updateKPIs();
  updateRecentActivity();
  renderInventoryTable(getCurrentFilter());
  const dashTerm = document.getElementById('dashboard-search-input')?.value || '';
  renderDashboardResults(dashTerm);
}

// --- Form ---

function initForm() {
  const form = document.getElementById('inventory-form');
  const fName = document.getElementById('f-name');
  const fCat = document.getElementById('f-category');
  const fQty = document.getElementById('f-quantity');
  const fPrice = document.getElementById('f-unitPrice');
  const fTotal = document.getElementById('f-totalValue');
  const fStatus = document.getElementById('f-status');
  const feedback = document.getElementById('form-feedback');
  const resetBtn = document.getElementById('reset-form-btn');

  function recalcTotal() {
    const qty = parseFloat(fQty.value);
    const price = parseFloat(fPrice.value);
    if (!isNaN(qty) && !isNaN(price)) {
      fTotal.value = formatCurrency(qty * price);
    } else {
      fTotal.value = '';
    }
  }

  fQty.addEventListener('input', recalcTotal);
  fPrice.addEventListener('input', recalcTotal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.className = '';
    feedback.textContent = '';

    const name = fName.value.trim();
    const category = fCat.value;
    const quantity = parseFloat(fQty.value);
    const unitPrice = parseFloat(fPrice.value);
    const status = fStatus.value;

    if (!name) { showError('Item name is required.'); return; }
    if (!category) { showError('Please select a category.'); return; }
    if (isNaN(quantity) || quantity < 0) { showError('Quantity must be 0 or greater.'); return; }
    if (isNaN(unitPrice) || unitPrice < 0) { showError('Unit price must be 0 or greater.'); return; }

    const item = {
      id: getNextId(),
      name,
      category,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      dateAdded: new Date().toISOString().slice(0, 10),
      status,
    };

    inventory.push(item);
    saveInventory();
    updateKPIs();
    updateRecentActivity();
    renderInventoryTable(getCurrentFilter());
    const dashTerm = document.getElementById('dashboard-search-input')?.value || '';
    renderDashboardResults(dashTerm);

    form.reset();
    fTotal.value = '';

    feedback.className = 'success';
    feedback.textContent = `Item "${item.name}" (${item.id}) added successfully.`;
    setTimeout(() => { feedback.textContent = ''; feedback.className = ''; }, 4000);
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    fTotal.value = '';
    feedback.textContent = '';
    feedback.className = '';
  });

  function showError(msg) {
    feedback.className = 'error';
    feedback.textContent = msg;
  }
}

// --- Navigation ---

function initNavigation() {
  const links = document.querySelectorAll('[data-section]');
  const sections = document.querySelectorAll('.section');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;

      links.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      link.classList.add('active');
      document.getElementById(target)?.classList.add('active');

      if (target === 'inventory') {
        renderInventoryTable(getCurrentFilter());
      }
    });
  });
}

// --- Search & Filter ---

function initFilters() {
  const searchInput = document.getElementById('search-input');
  const filterCat = document.getElementById('filter-category');
  const filterStatus = document.getElementById('filter-status');

  searchInput?.addEventListener('input', () => renderInventoryTable(getCurrentFilter()));
  filterCat?.addEventListener('change', () => renderInventoryTable(getCurrentFilter()));
  filterStatus?.addEventListener('change', () => renderInventoryTable(getCurrentFilter()));
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  loadInventory();
  initNavigation();
  initForm();
  initFilters();
  updateKPIs();
  updateRecentActivity();
  renderInventoryTable({ search: '', category: '', status: '' });
  renderInventoryChart();
  initDashboardSearch();
});
