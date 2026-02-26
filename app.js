/* ===================================================
   DeliverIQ — app.js
   Full application logic: state, rendering, algorithms
   =================================================== */

'use strict';

// ── State ──────────────────────────────────────────
const state = {
  orders: [],
  filter: { status: 'all' },
  view: 'grid',
  editId: null,
  deleteId: null,
  lastAssignedId: null,
  isPaid: true,
  selectedCategory: '',
};

// ── Sample Data ─────────────────────────────────────
const SAMPLE = [
  { restaurantName: 'Burger Barn',    itemCount: 3, isPaid: false, deliveryDistance: 2.5,  category: '🍔 Burgers'  },
  { restaurantName: 'Sushi Spot',     itemCount: 5, isPaid: true,  deliveryDistance: 4.8,  category: '🍣 Sushi'    },
  { restaurantName: 'Pizza Palace',   itemCount: 2, isPaid: false, deliveryDistance: 1.2,  category: '🍕 Pizza'    },
  { restaurantName: 'Taco Town',      itemCount: 4, isPaid: false, deliveryDistance: 6.7,  category: '🌮 Mexican'  },
  { restaurantName: 'Noodle Hub',     itemCount: 1, isPaid: true,  deliveryDistance: 3.1,  category: '🍜 Noodles'  },
  { restaurantName: 'Greens & Co.',   itemCount: 2, isPaid: false, deliveryDistance: 8.3,  category: '🥗 Healthy'  },
  { restaurantName: 'Chick Express',  itemCount: 6, isPaid: true,  deliveryDistance: 5.5,  category: '🍗 Chicken'  },
  { restaurantName: 'Ramen Republic', itemCount: 3, isPaid: false, deliveryDistance: 0.9,  category: '🍜 Noodles'  },
];

// ── Helpers ─────────────────────────────────────────
let _idCounter = 1;

function generateId() {
  return 'ORD-' + String(_idCounter++).padStart(4, '0');
}

function formatDist(d) {
  return Number(d).toFixed(1) + ' km';
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)  return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Toast ────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const icons = { success:'✅', error:'❌', info:'💡', warning:'⚠️' };
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${escHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }, duration);
}

// ── Tab Navigation ───────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'orders')    renderOrders();
  if (tab === 'analytics') renderAnalytics();
  if (tab === 'assign') {
    // Show live preview of all unpaid orders using whatever distance is currently entered
    const maxDist = parseFloat(document.getElementById('assignMaxDist')?.value);
    renderEligibleList(isNaN(maxDist) ? undefined : maxDist);
  }
  if (tab === 'dashboard') renderDashboard();

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mobile-open');
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

// ── Theme ────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const icon = isDark ? '☀️' : '🌙';
  const label = isDark ? 'Light Mode' : 'Dark Mode';
  document.getElementById('themeIcon').textContent = icon;
  document.getElementById('themeLabel').textContent = label;
  document.getElementById('themeIconMobile').textContent = icon;
  renderAnalytics(); // redraw charts for theme
}

// ── Modal ─────────────────────────────────────────────
function openAddModal(editId = null) {
  state.editId = editId;
  const modal    = document.getElementById('modal');
  const overlay  = document.getElementById('modalOverlay');
  const titleEl  = document.getElementById('modalTitle');
  const saveBtn  = document.getElementById('saveBtn');

  clearModalErrors();

  if (editId) {
    const o = state.orders.find(o => o.orderId === editId);
    if (!o) return;
    titleEl.textContent = 'Edit Order';
    saveBtn.textContent = 'Save Changes';
    document.getElementById('mRestaurant').value = o.restaurantName;
    document.getElementById('mItems').value      = o.itemCount;
    document.getElementById('mDist').value       = o.deliveryDistance;
    document.getElementById('mDistSlider').value = Math.min(o.deliveryDistance, 50);
    document.getElementById('distLabel').textContent = formatDist(o.deliveryDistance);
    setPayment(o.isPaid);
    // category
    document.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === (o.category || ''));
    });
    state.selectedCategory = o.category || '';
  } else {
    titleEl.textContent = 'Add New Order';
    saveBtn.textContent = 'Add Order';
    document.getElementById('mRestaurant').value = '';
    document.getElementById('mItems').value      = '';
    document.getElementById('mDist').value       = '';
    document.getElementById('mDistSlider').value = 5;
    document.getElementById('distLabel').textContent = '5 km';
    setPayment(true);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === ''));
    state.selectedCategory = '';
  }

  overlay.classList.add('open');
  setTimeout(() => document.getElementById('mRestaurant').focus(), 100);
}

function closeAddModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  state.editId = null;
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeAddModal();
  if (e.target === document.getElementById('deleteOverlay')) closeDeleteModal();
}

function clearModalErrors() {
  ['errRestaurant','errItems','errDist'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

// ── Payment & Category ───────────────────────────────
function setPayment(paid) {
  state.isPaid = paid;
  document.getElementById('payPaid').className   = 'pay-btn' + (paid  ? ' active-paid'   : '');
  document.getElementById('payUnpaid').className = 'pay-btn' + (!paid ? ' active-unpaid' : '');
}

function selectCat(btn, cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedCategory = cat;
}

// ── Slider sync ──────────────────────────────────────
function syncSlider() {
  const v = parseFloat(document.getElementById('mDist').value) || 0;
  document.getElementById('mDistSlider').value = Math.min(v, 50);
  document.getElementById('distLabel').textContent = formatDist(v);
}
function syncDistInput() {
  const v = document.getElementById('mDistSlider').value;
  document.getElementById('mDist').value = v;
  document.getElementById('distLabel').textContent = formatDist(v);
}

// ── Save Order (Add / Edit) ──────────────────────────
function saveOrder() {
  clearModalErrors();
  const restaurant = document.getElementById('mRestaurant').value.trim();
  const itemCount  = parseInt(document.getElementById('mItems').value);
  const distance   = parseFloat(document.getElementById('mDist').value);

  let valid = true;
  if (!restaurant) {
    document.getElementById('errRestaurant').textContent = 'Restaurant name is required.';
    valid = false;
  }
  if (!itemCount || itemCount < 1) {
    document.getElementById('errItems').textContent = 'Enter a valid item count (≥1).';
    valid = false;
  }
  if (isNaN(distance) || distance < 0) {
    document.getElementById('errDist').textContent = 'Enter a valid distance (≥0 km).';
    valid = false;
  }
  if (!valid) return;

  if (state.editId) {
    const idx = state.orders.findIndex(o => o.orderId === state.editId);
    if (idx !== -1) {
      state.orders[idx] = {
        ...state.orders[idx],
        restaurantName:   restaurant,
        itemCount,
        isPaid:           state.isPaid,
        deliveryDistance: distance,
        category:         state.selectedCategory,
      };
      toast(`Order ${state.editId} updated!`, 'success');
    }
  } else {
    const order = {
      orderId:          generateId(),
      restaurantName:   restaurant,
      itemCount,
      isPaid:           state.isPaid,
      deliveryDistance: distance,
      category:         state.selectedCategory,
      createdAt:        Date.now(),
    };
    state.orders.unshift(order);
    toast(`Order ${order.orderId} added!`, 'success');
  }

  closeAddModal();
  refreshAll();
}

// ── Delete ───────────────────────────────────────────
function openDeleteModal(orderId) {
  const o = state.orders.find(o => o.orderId === orderId);
  if (!o) return;
  state.deleteId = orderId;
  document.getElementById('deleteOrderName').textContent = o.restaurantName;
  document.getElementById('deleteOverlay').classList.add('open');
}

function closeDeleteModal(e) {
  if (e && e.target !== document.getElementById('deleteOverlay')) return;
  document.getElementById('deleteOverlay').classList.remove('open');
  state.deleteId = null;
}

function confirmDelete() {
  if (!state.deleteId) return;
  const o = state.orders.find(o => o.orderId === state.deleteId);
  state.orders = state.orders.filter(o => o.orderId !== state.deleteId);
  if (state.lastAssignedId === state.deleteId) state.lastAssignedId = null;
  toast(`Deleted "${o.restaurantName}"`, 'warning');
  document.getElementById('deleteOverlay').classList.remove('open');
  state.deleteId = null;
  refreshAll();
}

// ── Filters & Sorting ────────────────────────────────
function setFilter(key, val) {
  state.filter[key] = val;
  // update chip styles for status
  if (key === 'status') {
    ['all','paid','unpaid'].forEach(s => {
      const chip = document.getElementById('chip-' + s);
      chip.className = 'chip' + (s === val ? ' active' : '');
    });
  }
  renderOrders();
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterDist').value  = '';
  document.getElementById('sortBy').value       = 'newest';
  setFilter('status', 'all');
}

function setView(v) {
  state.view = v;
  document.getElementById('viewGrid').className  = 'view-btn' + (v === 'grid' ? ' active' : '');
  document.getElementById('viewTable').className = 'view-btn' + (v === 'table' ? ' active' : '');
  renderOrders();
}

function getFilteredOrders() {
  const maxDist = parseFloat(document.getElementById('filterDist')?.value);
  const search  = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  const sortBy  = document.getElementById('sortBy')?.value || 'newest';
  const status  = state.filter.status;

  let list = state.orders.filter(o => {
    if (status === 'paid'   && !o.isPaid)  return false;
    if (status === 'unpaid' && o.isPaid)   return false;
    if (!isNaN(maxDist) && maxDist >= 0 && o.deliveryDistance > maxDist) return false;
    if (search && !o.restaurantName.toLowerCase().includes(search)) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':    return a.createdAt - b.createdAt;
      case 'dist-asc':  return a.deliveryDistance - b.deliveryDistance;
      case 'dist-desc': return b.deliveryDistance - a.deliveryDistance;
      case 'items-asc': return a.itemCount - b.itemCount;
      case 'items-desc':return b.itemCount - a.itemCount;
      case 'name':      return a.restaurantName.localeCompare(b.restaurantName);
      default:          return b.createdAt - a.createdAt;
    }
  });

  return list;
}

// ── Render: Orders ───────────────────────────────────
function renderOrders() {
  const container  = document.getElementById('ordersContainer');
  const filterInfo = document.getElementById('filterInfo');
  if (!container) return; // guard: element must exist in DOM

  const list = getFilteredOrders();
  const total = state.orders.length;

  if (filterInfo) {
    filterInfo.textContent = list.length === total
      ? `Showing all ${total} order${total !== 1 ? 's' : ''}`
      : `Showing ${list.length} of ${total} order${total !== 1 ? 's' : ''}`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${total === 0 ? '🍕' : '🔍'}</div>
        <div class="empty-title">${total === 0 ? 'No orders yet' : 'No matching orders'}</div>
        <div class="empty-sub">${total === 0 ? 'Add your first order to get started.' : 'Try adjusting your filters.'}</div>
      </div>`;
    return;
  }

  if (state.view === 'grid') {
    container.innerHTML = `<div class="orders-grid-view">${list.map(renderOrderCard).join('')}</div>`;
  } else {
    container.innerHTML = renderOrdersTable(list);
  }
}

function renderOrderCard(o) {
  const isAssigned = o.orderId === state.lastAssignedId;
  const pillClass  = isAssigned ? 'pill-assigned' : o.isPaid ? 'pill-paid' : 'pill-unpaid';
  const pillText   = isAssigned ? '⚡ Assigned' : o.isPaid ? '✓ Paid' : '✗ Unpaid';
  const cat        = o.category || '🍽 General';

  return `
  <div class="order-card${isAssigned ? ' assigned-card' : ''}">
    <div class="card-top">
      <span class="order-id-tag">${escHtml(o.orderId)}</span>
      <span class="card-category">${escHtml(cat)}</span>
    </div>
    <div class="card-name">${escHtml(o.restaurantName)}</div>
    <div class="card-stats">
      <div class="stat-item">
        <div class="stat-label">Distance</div>
        <div class="stat-val km">${formatDist(o.deliveryDistance)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Items</div>
        <div class="stat-val items">${o.itemCount}</div>
      </div>
    </div>
    <div class="card-footer">
      <span class="status-pill ${pillClass}">${pillText}</span>
      <div class="card-actions">
        <button class="card-action-btn" onclick="openAddModal('${escHtml(o.orderId)}')" title="Edit">✏️</button>
        <button class="card-action-btn delete" onclick="openDeleteModal('${escHtml(o.orderId)}')" title="Delete">🗑</button>
      </div>
    </div>
  </div>`;
}

function renderOrdersTable(list) {
  const rows = list.map(o => {
    const isAssigned = o.orderId === state.lastAssignedId;
    const pillClass  = isAssigned ? 'pill-assigned' : o.isPaid ? 'pill-paid' : 'pill-unpaid';
    const pillText   = isAssigned ? '⚡ Assigned' : o.isPaid ? '✓ Paid' : '✗ Unpaid';
    return `
    <tr>
      <td class="mono">${escHtml(o.orderId)}</td>
      <td class="bold">${escHtml(o.restaurantName)}</td>
      <td>${escHtml(o.category || '—')}</td>
      <td class="mono">${o.itemCount}</td>
      <td class="mono" style="color:var(--accent-2)">${formatDist(o.deliveryDistance)}</td>
      <td><span class="status-pill ${pillClass}">${pillText}</span></td>
      <td class="mono" style="color:var(--text-3)">${timeAgo(o.createdAt)}</td>
      <td>
        <div style="display:flex;gap:0.35rem;">
          <button class="card-action-btn" onclick="openAddModal('${escHtml(o.orderId)}')" title="Edit">✏️</button>
          <button class="card-action-btn delete" onclick="openDeleteModal('${escHtml(o.orderId)}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `
  <div class="orders-table-view">
    <table class="orders-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Restaurant</th>
          <th>Category</th>
          <th>Items</th>
          <th>Distance</th>
          <th>Status</th>
          <th>Added</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ── Render: Dashboard ────────────────────────────────
function renderDashboard() {
  const total  = state.orders.length;
  const paid   = state.orders.filter(o => o.isPaid).length;
  const unpaid = total - paid;
  const avgDist = total
    ? (state.orders.reduce((s, o) => s + o.deliveryDistance, 0) / total).toFixed(1)
    : 0;

  document.getElementById('kpiTotal').textContent   = total;
  document.getElementById('kpiUnpaid').textContent  = unpaid;
  document.getElementById('kpiPaid').textContent    = paid;
  document.getElementById('kpiAvgDist').textContent = avgDist;

  // Recent orders
  const recent = document.getElementById('recentOrders');
  const list   = [...state.orders].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);

  if (list.length === 0) {
    recent.innerHTML = `<div class="empty-state" style="padding:2rem;"><div class="empty-icon">📭</div><div class="empty-title">No orders yet</div></div>`;
    return;
  }

  recent.innerHTML = list.map(o => {
    const emoji = (o.category || '🍽').split(' ')[0];
    return `
    <div class="recent-item">
      <span class="recent-emoji">${emoji}</span>
      <div class="recent-info">
        <div class="recent-name">${escHtml(o.restaurantName)}</div>
        <div class="recent-meta">${escHtml(o.orderId)} · ${o.itemCount} items · ${timeAgo(o.createdAt)}</div>
      </div>
      <span class="recent-dist">${formatDist(o.deliveryDistance)}</span>
      <span class="status-pill ${o.isPaid ? 'pill-paid' : 'pill-unpaid'}" style="flex-shrink:0;">
        ${o.isPaid ? '✓' : '✗'}
      </span>
    </div>`;
  }).join('');
}

// ── AssignDelivery Algorithm ─────────────────────────
/**
 * AssignDelivery(maxDistance):
 *   1. Filter ALL orders where isPaid === false
 *   2. Filter those where deliveryDistance <= maxDistance
 *   3. Assign the one with minimum deliveryDistance (nearest)
 *   4. If none qualify: display "No order available"
 */
function assignDelivery(source) {
  const inputId  = source === 'quick' ? 'quickMaxDist' : 'assignMaxDist';
  const outputId = source === 'quick' ? 'quickOutput'  : 'mainOutput';
  const maxDist  = parseFloat(document.getElementById(inputId).value);
  const output   = document.getElementById(outputId);

  if (isNaN(maxDist) || maxDist < 0) {
    renderOutput(output, null, 'invalid');
    toast('Please enter a valid max distance.', 'error');
    return;
  }

  // Step 1: all unpaid orders
  const allUnpaid = state.orders.filter(o => !o.isPaid);

  // Step 2: filter by distance
  const candidates = allUnpaid.filter(o => o.deliveryDistance <= maxDist);

  if (candidates.length === 0) {
    state.lastAssignedId = null;
    renderOutput(output, null, 'none');
    if (source === 'main') renderEligibleList(maxDist);
    toast('No order available within that range.', 'warning');
    return;
  }

  // Step 3: pick the nearest
  const nearest = candidates.reduce((a, b) => a.deliveryDistance <= b.deliveryDistance ? a : b);
  state.lastAssignedId = nearest.orderId;

  renderOutput(output, nearest, 'success');
  toast(`⚡ Assigned ${nearest.orderId} — ${nearest.restaurantName}`, 'success');

  if (source === 'main') renderEligibleList(maxDist);

  refreshAll();
}

function renderOutput(el, order, type) {
  if (!el) return;
  if (type === 'invalid') {
    el.innerHTML = `<div class="output-result-card"><span class="output-result-icon">⚠️</span><div class="output-result-body"><div class="output-result-label">Error</div><div class="output-result-name" style="color:var(--red)">Invalid input</div></div></div>`;
    return;
  }
  if (type === 'none') {
    el.innerHTML = `<div class="output-result-card"><span class="output-result-icon">❌</span><div class="output-result-body"><div class="output-result-label">Result</div><div class="output-no-order">No order available</div><div class="output-result-meta">No unpaid orders within the given distance</div></div></div>`;
    return;
  }
  const cat = (order.category || '🍽').split(' ')[0];
  el.innerHTML = `
  <div class="output-result-card">
    <span class="output-result-icon">${cat}</span>
    <div class="output-result-body">
      <div class="output-result-label">Assigned Order</div>
      <div class="output-result-name">${escHtml(order.restaurantName)}</div>
      <div class="output-result-meta">${escHtml(order.orderId)} · ${formatDist(order.deliveryDistance)} · ${order.itemCount} items</div>
    </div>
  </div>`;
}

// Live preview: shows ALL unpaid orders, grouped by in-range / out-of-range
function renderEligibleList(maxDist) {
  const el = document.getElementById('eligibleList');
  if (!el) return;

  // All unpaid orders sorted by distance ascending
  const allUnpaid = state.orders
    .filter(o => !o.isPaid)
    .sort((a, b) => a.deliveryDistance - b.deliveryDistance);

  if (allUnpaid.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><div class="empty-icon">🎉</div><div class="empty-title">No unpaid orders</div><div class="empty-sub">All orders have been paid.</div></div>`;
    return;
  }

  const hasMaxDist = !isNaN(maxDist) && maxDist >= 0;
  const inRange  = hasMaxDist ? allUnpaid.filter(o => o.deliveryDistance <= maxDist) : [];
  const outRange = hasMaxDist ? allUnpaid.filter(o => o.deliveryDistance >  maxDist) : allUnpaid;
  const nearest  = inRange[0] || null; // already sorted, first = nearest

  let html = '';

  if (hasMaxDist) {
    if (inRange.length > 0) {
      html += `<div class="elig-section-label">✅ Within ${maxDist} km — eligible (${inRange.length})</div>`;
      html += inRange.map(o => `
        <div class="eligible-item${o.orderId === (nearest && nearest.orderId) ? ' nearest' : ''}">
          <span class="elig-emoji">${(o.category||'🍽').split(' ')[0]}</span>
          <div class="elig-info">
            <span class="elig-name">${escHtml(o.restaurantName)}</span>
            <span class="elig-id">${escHtml(o.orderId)} · ${o.itemCount} items</span>
          </div>
          <span class="elig-dist">${formatDist(o.deliveryDistance)}</span>
          ${o.orderId === (nearest && nearest.orderId) ? '<span class="near-tag">NEAREST</span>' : ''}
        </div>`).join('');
    } else {
      html += `<div class="elig-section-label no-eligible">❌ No unpaid orders within ${maxDist} km</div>`;
    }

    if (outRange.length > 0) {
      html += `<div class="elig-section-label out-label">🚫 Beyond ${maxDist} km — not eligible (${outRange.length})</div>`;
      html += outRange.map(o => `
        <div class="eligible-item out-of-range">
          <span class="elig-emoji">${(o.category||'🍽').split(' ')[0]}</span>
          <div class="elig-info">
            <span class="elig-name">${escHtml(o.restaurantName)}</span>
            <span class="elig-id">${escHtml(o.orderId)} · ${o.itemCount} items</span>
          </div>
          <span class="elig-dist out-dist">${formatDist(o.deliveryDistance)}</span>
        </div>`).join('');
    }
  } else {
    // No maxDist entered yet — show all unpaid as a plain list
    html += `<div class="elig-section-label">⏳ All unpaid orders (enter max distance to filter)</div>`;
    html += allUnpaid.map(o => `
      <div class="eligible-item">
        <span class="elig-emoji">${(o.category||'🍽').split(' ')[0]}</span>
        <div class="elig-info">
          <span class="elig-name">${escHtml(o.restaurantName)}</span>
          <span class="elig-id">${escHtml(o.orderId)} · ${o.itemCount} items</span>
        </div>
        <span class="elig-dist">${formatDist(o.deliveryDistance)}</span>
      </div>`).join('');
  }

  el.innerHTML = html;
}

// ── Export CSV ───────────────────────────────────────
function exportOrders() {
  if (state.orders.length === 0) { toast('No orders to export.', 'warning'); return; }

  const headers = ['Order ID','Restaurant','Category','Items','Distance (km)','Paid','Added'];
  const rows = state.orders.map(o => [
    o.orderId,
    `"${o.restaurantName.replace(/"/g,'""')}"`,
    `"${(o.category||'').replace(/"/g,'""')}"`,
    o.itemCount,
    o.deliveryDistance,
    o.isPaid ? 'Yes' : 'No',
    new Date(o.createdAt).toLocaleString(),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `deliveriq-orders-${Date.now()}.csv`;
  a.click();
  toast('Orders exported as CSV!', 'success');
}

// ── Analytics ─────────────────────────────────────────
function renderAnalytics() {
  // Guard: analytics elements only exist after the tab has rendered once
  if (!document.getElementById('donutChart')) return;
  const orders = state.orders;
  const total  = orders.length;
  const paid   = orders.filter(o => o.isPaid).length;
  const unpaid = total - paid;

  // Donut
  drawDonut(paid, unpaid, total);

  // Bar chart
  drawBarChart(orders);

  // Top restaurants
  renderTopRestaurants(orders);

  // Summary
  renderSummaryStats(orders, total, paid, unpaid);
}

function drawDonut(paid, unpaid, total) {
  const canvas = document.getElementById('donutChart');
  const center = document.getElementById('donutCenter');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, r = 75, thick = 24;

  ctx.clearRect(0,0,W,H);

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--glass-border').trim();
    ctx.lineWidth = thick;
    ctx.stroke();
    center.textContent = '—';
    document.getElementById('donutLegend').innerHTML = '';
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const colors = ['#34d399','#f87171'];
  const data   = [paid, unpaid];
  const labels = ['Paid','Unpaid'];
  let startAngle = -Math.PI/2;

  data.forEach((val, i) => {
    if (val === 0) return;
    const slice = (val/total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = thick;
    ctx.lineCap = 'butt';
    ctx.stroke();
    startAngle += slice;
  });

  center.textContent = total;

  document.getElementById('donutLegend').innerHTML = labels.map((l,i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      <span>${l}: ${data[i]}</span>
    </div>`).join('');
}

function drawBarChart(orders) {
  const el = document.getElementById('barChart');
  if (!el) return;

  const ranges = [
    { label: '0–2 km',   min: 0,  max: 2  },
    { label: '2–5 km',   min: 2,  max: 5  },
    { label: '5–10 km',  min: 5,  max: 10 },
    { label: '10–20 km', min: 10, max: 20 },
    { label: '20+ km',   min: 20, max: Infinity },
  ];

  const counts = ranges.map(r => orders.filter(o => o.deliveryDistance >= r.min && o.deliveryDistance < r.max).length);
  const max    = Math.max(...counts, 1);

  el.innerHTML = counts.map((c, i) => `
  <div class="bar-col">
    <span class="bar-count">${c}</span>
    <div class="bar-fill" style="height:${Math.max((c/max)*100,4)}px" title="${ranges[i].label}: ${c} orders"></div>
    <span class="bar-label">${ranges[i].label}</span>
  </div>`).join('');
}

function renderTopRestaurants(orders) {
  const el = document.getElementById('topRestaurants');
  if (!el) return;

  const counts = {};
  orders.forEach(o => { counts[o.restaurantName] = (counts[o.restaurantName]||0) + 1; });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const maxCnt = sorted[0]?.[1] || 1;

  if (sorted.length === 0) {
    el.innerHTML = `<p class="muted-text">No orders yet.</p>`;
    return;
  }

  el.innerHTML = sorted.map(([name, cnt], i) => `
  <div class="top-item">
    <span class="top-rank${i===0?' gold':''}">${i+1}</span>
    <span class="top-name">${escHtml(name)}</span>
    <div class="top-bar-wrap"><div class="top-bar" style="width:${(cnt/maxCnt)*100}%"></div></div>
    <span class="top-count">${cnt}</span>
  </div>`).join('');
}

function renderSummaryStats(orders, total, paid, unpaid) {
  const el = document.getElementById('summaryStats');
  if (!el) return;

  const dists = orders.map(o => o.deliveryDistance);
  const items = orders.map(o => o.itemCount);
  const avg   = a => a.length ? (a.reduce((s,v)=>s+v,0)/a.length).toFixed(1) : '—';
  const min   = a => a.length ? Math.min(...a).toFixed(1) : '—';
  const max   = a => a.length ? Math.max(...a).toFixed(1) : '—';

  const stats = [
    { label: 'Total Orders',        val: total },
    { label: 'Paid / Unpaid',       val: `${paid} / ${unpaid}` },
    { label: 'Avg Distance',        val: avg(dists) + ' km' },
    { label: 'Min Distance',        val: min(dists) + ' km' },
    { label: 'Max Distance',        val: max(dists) + ' km' },
    { label: 'Avg Items per Order', val: avg(items) },
    { label: 'Total Items',         val: items.reduce((s,v)=>s+v,0) },
  ];

  el.innerHTML = stats.map(s => `
  <div class="sum-row">
    <span class="sum-label">${s.label}</span>
    <span class="sum-value">${s.val}</span>
  </div>`).join('');
}

// ── Global Refresh ────────────────────────────────────
function refreshAll() {
  document.getElementById('navBadge').textContent = state.orders.length;
  // Always re-render all sections so switching tabs never shows stale data.
  renderDashboard();
  renderOrders();
  renderAnalytics();
  // Refresh eligible list using current distance input value
  const maxDist = parseFloat(document.getElementById('assignMaxDist')?.value);
  renderEligibleList(isNaN(maxDist) ? undefined : maxDist);
}

// ── Keyboard Shortcuts ────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAddModal();
    document.getElementById('deleteOverlay').classList.remove('open');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openAddModal();
  }
});

// ── Init ──────────────────────────────────────────────
(function init() {
  // Load sample data with staggered timestamps
  SAMPLE.forEach((s, i) => {
    state.orders.push({
      orderId:          generateId(),
      restaurantName:   s.restaurantName,
      itemCount:        s.itemCount,
      isPaid:           s.isPaid,
      deliveryDistance: s.deliveryDistance,
      category:         s.category,
      createdAt:        Date.now() - (SAMPLE.length - i) * 60000 * 15,
    });
  });

  document.getElementById('navBadge').textContent = state.orders.length;
  renderDashboard();
  renderOrders();
})();
