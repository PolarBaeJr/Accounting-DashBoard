'use strict';

const STORAGE_KEY = 'abcLogisticsInventory';
const ID_KEY = 'abcLogisticsNextId';

let inventory = [];

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
});
