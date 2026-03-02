// PLXYGROUND Admin Panel – Single Page Application
const API_BASE = 'http://localhost:3011';
let token = localStorage.getItem('plxy_admin_token');
let currentPage = 'queue';
let alertInterval = null;

// ── API Helper ──
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Toast ──
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// ── Modal ──
function showModal(title, bodyHtml, actions = []) {
  const root = document.getElementById('modal-root');
  const actionsHtml = actions.map(a =>
    `<button class="btn ${a.cls || 'btn-primary'}" onclick="${a.onclick}">${escapeHtml(a.label)}</button>`
  ).join('');
  root.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-content">
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <div>${bodyHtml}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          ${actionsHtml}
        </div>
      </div>
    </div>`;
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

// ── Escape HTML (prevent injection) ──
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ── Auth ──
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  
  if (!email || !password) { errEl.textContent = 'Email and password required'; errEl.style.display = 'block'; return; }
  
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errEl.style.display = 'none';
  
  try {
    const res = await apiFetch('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    token = res.token;
    localStorage.setItem('plxy_admin_token', token);
    showApp();
    showToast('Welcome to PLXYGROUND Admin', 'success');
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

// Allow Enter key on login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !document.getElementById('login-page').classList.contains('hidden')) {
    handleLogin();
  }
});

function handleSignOut() {
  token = null;
  localStorage.removeItem('plxy_admin_token');
  if (alertInterval) { clearInterval(alertInterval); alertInterval = null; }
  document.getElementById('app-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-page').classList.remove('hidden');
  navigate('queue');
}

// ── Navigation ──
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.sidebar-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  const titles = { queue: 'Moderation Queue', content: 'Content Management', users: 'User Management', audit: 'Audit Log', analytics: 'Analytics', alerts: 'Live Alerts', security: 'Admin Security' };
  document.getElementById('page-title').textContent = titles[page] || page;
  
  if (alertInterval && page !== 'alerts') { clearInterval(alertInterval); alertInterval = null; }
  
  const loaders = { queue: loadQueue, content: loadContent, users: loadUsers, audit: loadAudit, analytics: loadAnalytics, alerts: loadAlerts, security: loadSecurity };
  if (loaders[page]) loaders[page]();
}

function handleGlobalSearch(val) {
  // Trigger search on current page
  if (currentPage === 'content') loadContent(val);
  else if (currentPage === 'users') loadUsers(val);
}

// ── Queue Page ──
async function loadQueue() {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading queue...</div>';
  try {
    const res = await apiFetch('/api/admin/queue?limit=200');
    const rows = res.data || [];
    el.innerHTML = `
      <div class="table-container">
        <div class="table-toolbar">
          <span style="font-weight:600;">${rows.length} items</span>
          <button class="btn btn-success btn-sm" onclick="bulkQueueAction('approve')" id="queue-bulk-approve">✓ Approve Selected</button>
          <button class="btn btn-danger btn-sm" onclick="bulkQueueAction('reject')">✗ Reject Selected</button>
          <button class="btn btn-ghost btn-sm" onclick="bulkQueueAction('delete')">🗑 Delete Selected</button>
          <button class="btn btn-ghost btn-sm" onclick="bulkQueueAction('assign')">📌 Assign to Me</button>
          <button class="btn btn-ghost btn-sm" onclick="loadQueue()">↻ Refresh</button>
        </div>
        <div style="overflow-x:auto;">
        <table>
          <thead><tr>
            <th><input type="checkbox" id="queue-select-all" onchange="toggleQueueSelectAll(this.checked)"></th>
            <th>Type</th><th>Status</th><th>Title/Name</th><th>Submitted By</th><th>Reports</th><th>Assigned</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><input type="checkbox" class="queue-cb" value="${r.id}"></td>
                <td><span class="type-pill">${escapeHtml(r.type)}</span></td>
                <td><span class="status-badge status-${r.status}">${escapeHtml(r.status)}</span></td>
                <td>${escapeHtml(r.title_or_name)}</td>
                <td>${escapeHtml(r.submitted_by || '-')}</td>
                <td>${r.report_count || 0}</td>
                <td>${escapeHtml(r.assigned_admin || '-')}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-success btn-sm" onclick="singleQueueAction(${r.id},'approve')">✓</button>
                  <button class="btn btn-danger btn-sm" onclick="singleQueueAction(${r.id},'reject')">✗</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#dc2626;">Error loading queue: ${escapeHtml(err.message)}<br><button class="btn btn-primary" onclick="loadQueue()">Retry</button></div>`;
  }
}

function toggleQueueSelectAll(checked) {
  document.querySelectorAll('.queue-cb').forEach(cb => cb.checked = checked);
}

function getSelectedQueueIds() {
  return Array.from(document.querySelectorAll('.queue-cb:checked')).map(cb => parseInt(cb.value));
}

async function bulkQueueAction(action) {
  const ids = getSelectedQueueIds();
  if (ids.length === 0) { showToast('Select items first', 'error'); return; }
  try {
    const res = await apiFetch('/api/admin/queue/bulk-action', { method: 'POST', body: JSON.stringify({ ids, action }) });
    showToast(`${action} completed on ${ids.length} items`, 'success');
    loadQueue();
  } catch (err) { showToast(err.message, 'error'); }
}

async function singleQueueAction(id, action) {
  try {
    await apiFetch('/api/admin/queue/bulk-action', { method: 'POST', body: JSON.stringify({ ids: [id], action }) });
    showToast(`Item ${action}d`, 'success');
    loadQueue();
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Content Page ──
async function loadContent(searchVal) {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading content...</div>';
  const search = searchVal || '';
  try {
    const res = await apiFetch(`/api/admin/content?limit=2000${search ? `&search=${encodeURIComponent(search)}` : ''}`);
    const rows = res.data || [];
    el.innerHTML = `
      <div class="table-container">
        <div class="table-toolbar">
          <input type="text" class="table-toolbar-search" placeholder="Search content..." value="${escapeHtml(search)}" oninput="loadContent(this.value)">
          <span style="color:#999;font-size:13px;">${rows.length} items</span>
          <button class="btn btn-ghost btn-sm" onclick="loadContent()">↻ Refresh</button>
        </div>
        <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Title</th><th>Creator</th><th>Type</th><th>Status</th><th>Body</th><th>Media</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><strong>${escapeHtml(r.title)}</strong></td>
                <td>${escapeHtml(r.creator_name || '-')}</td>
                <td><span class="type-pill">${escapeHtml(r.content_type)}</span></td>
                <td><span class="status-badge status-${r.is_published ? 'published' : 'pending'}">${r.is_published ? 'Published' : 'Pending'}</span></td>
                <td><div class="content-body">${escapeHtml(r.body || '')}</div></td>
                <td>${r.media_url ? `<a href="${escapeHtml(r.media_url)}" target="_blank" class="btn btn-ghost btn-sm">🖼 View</a>` : '-'}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td style="white-space:nowrap;">
                  ${r.is_published
                    ? `<button class="btn btn-warning btn-sm" onclick="togglePublish(${r.id},false)">Unpublish</button>`
                    : `<button class="btn btn-success btn-sm" onclick="togglePublish(${r.id},true)">Publish</button>`
                  }
                  <button class="btn btn-danger btn-sm" onclick="deleteContent(${r.id},'${escapeHtml(r.title)}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#dc2626;">Error: ${escapeHtml(err.message)}<br><button class="btn btn-primary" onclick="loadContent()">Retry</button></div>`;
  }
}

async function togglePublish(id, publish) {
  try {
    await apiFetch(`/api/admin/content/${id}`, { method: 'PUT', body: JSON.stringify({ is_published: publish }) });
    showToast(publish ? 'Content published' : 'Content unpublished', 'success');
    loadContent();
  } catch (err) { showToast(err.message, 'error'); }
}

function deleteContent(id, title) {
  showModal('Delete Content', `<p>Are you sure you want to delete "<strong>${escapeHtml(title)}</strong>"?</p>`, [
    { label: 'Delete', cls: 'btn-danger', onclick: `confirmDeleteContent(${id})` }
  ]);
}

async function confirmDeleteContent(id) {
  closeModal();
  try {
    await apiFetch(`/api/admin/content/${id}`, { method: 'DELETE' });
    showToast('Content deleted', 'success');
    loadContent();
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Users Page ──
async function loadUsers(searchVal) {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading users...</div>';
  const search = searchVal || '';
  try {
    const res = await apiFetch(`/api/admin/users?limit=2000${search ? `&search=${encodeURIComponent(search)}` : ''}`);
    const rows = res.data || [];
    el.innerHTML = `
      <div class="table-container">
        <div class="table-toolbar">
          <input type="text" class="table-toolbar-search" placeholder="Search users..." value="${escapeHtml(search)}" oninput="loadUsers(this.value)">
          <span style="color:#999;font-size:13px;">${rows.length} users</span>
          <button class="btn btn-ghost btn-sm" onclick="loadUsers()">↻ Refresh</button>
        </div>
        <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><strong>${escapeHtml(r.name)}</strong></td>
                <td>${escapeHtml(r.email || '-')}</td>
                <td><span class="type-pill">${escapeHtml(r.role)}</span></td>
                <td><span class="status-badge status-${r.is_suspended ? 'suspended' : 'active'}">${r.is_suspended ? 'Suspended' : 'Active'}</span></td>
                <td>${r.email_verified ? '✅' : '❌'}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td style="white-space:nowrap;">
                  <button class="btn ${r.is_suspended ? 'btn-success' : 'btn-warning'} btn-sm" onclick="toggleSuspend(${r.id})">${r.is_suspended ? 'Reactivate' : 'Suspend'}</button>
                  <button class="btn btn-ghost btn-sm" onclick="changeRole(${r.id},'${escapeHtml(r.role)}')">Role</button>
                  <button class="btn btn-ghost btn-sm" onclick="toggleVerify(${r.id})">${r.email_verified ? 'Unverify' : 'Verify'}</button>
                  <button class="btn btn-ghost btn-sm" onclick="resetPassword(${r.id},'${escapeHtml(r.name)}')">Reset PW</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#dc2626;">Error: ${escapeHtml(err.message)}<br><button class="btn btn-primary" onclick="loadUsers()">Retry</button></div>`;
  }
}

async function toggleSuspend(userId) {
  try {
    const res = await apiFetch(`/api/admin/users/${userId}/suspend`, { method: 'POST', body: JSON.stringify({ reason: 'Admin action' }) });
    showToast(res.message, 'success');
    loadUsers();
  } catch (err) { showToast(err.message, 'error'); }
}

function changeRole(userId, currentRole) {
  const newRole = currentRole === 'creator' ? 'business' : 'creator';
  showModal('Change Role', `<p>Change role from <strong>${escapeHtml(currentRole)}</strong> to <strong>${newRole}</strong>?</p><p style="color:#999;font-size:13px;margin-top:8px;">Note: ADMIN role cannot be assigned (single-admin policy).</p>`, [
    { label: `Change to ${newRole}`, cls: 'btn-primary', onclick: `confirmChangeRole(${userId},'${newRole}')` }
  ]);
}

async function confirmChangeRole(userId, role) {
  closeModal();
  try {
    await apiFetch(`/api/admin/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ role }) });
    showToast(`Role updated to ${role}`, 'success');
    loadUsers();
  } catch (err) { showToast(err.message, 'error'); }
}

async function toggleVerify(userId) {
  try {
    const res = await apiFetch(`/api/admin/users/${userId}/email-verify`, { method: 'POST' });
    showToast(res.message, 'success');
    loadUsers();
  } catch (err) { showToast(err.message, 'error'); }
}

function resetPassword(userId, name) {
  showModal('Reset Password', `
    <p>Force reset password for <strong>${escapeHtml(name)}</strong></p>
    <label class="form-label">New Password</label>
    <input type="password" id="reset-pw-input" class="form-input" placeholder="Min 8 characters">
  `, [
    { label: 'Reset Password', cls: 'btn-danger', onclick: `confirmResetPassword(${userId})` }
  ]);
}

async function confirmResetPassword(userId) {
  const pw = document.getElementById('reset-pw-input').value;
  if (!pw || pw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
  closeModal();
  try {
    await apiFetch('/api/admin/users/reset-password', { method: 'POST', body: JSON.stringify({ userId, newPassword: pw }) });
    showToast('Password reset successful', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Audit Page ──
async function loadAudit() {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading audit log...</div>';
  try {
    const res = await apiFetch('/api/admin/audit?limit=500');
    const rows = res.data || [];
    el.innerHTML = `
      <div class="table-container">
        <div class="table-toolbar">
          <span style="font-weight:600;">${rows.length} entries</span>
          <a href="${API_BASE}/api/admin/audit/export" target="_blank" class="btn btn-ghost btn-sm" onclick="this.href='${API_BASE}/api/admin/audit/export?token='+token">📥 Export JSON</a>
          <button class="btn btn-ghost btn-sm" onclick="loadAudit()">↻ Refresh</button>
        </div>
        <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>Before</th><th>After</th><th>Reason</th><th>Time</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><span class="type-pill">${escapeHtml(r.action_type)}</span></td>
                <td>${escapeHtml(r.actor || '-')}</td>
                <td>${escapeHtml(r.target || '-')}</td>
                <td>${r.before_snapshot ? `<div class="json-preview">${escapeHtml(formatJson(r.before_snapshot))}</div>` : '-'}</td>
                <td>${r.after_snapshot ? `<div class="json-preview">${escapeHtml(formatJson(r.after_snapshot))}</div>` : '-'}</td>
                <td>${escapeHtml(r.reason || '-')}</td>
                <td>${new Date(r.created_at).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#dc2626;">Error: ${escapeHtml(err.message)}<br><button class="btn btn-primary" onclick="loadAudit()">Retry</button></div>`;
  }
}

function formatJson(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

// ── Analytics Page ──
async function loadAnalytics() {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading analytics...</div>';
  try {
    const res = await apiFetch('/api/admin/analytics');
    const k = res.kpis;
    const mockBadge = res.isMock ? '<span class="mock-badge">Mock</span>' : '';

    const maxTrend = Math.max(...(res.weeklyTrend || []).map(t => t.count), 1);

    el.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;color:#999;">${mockBadge} SQL-derived KPIs from database. <button class="btn btn-ghost btn-sm" onclick="loadAnalytics()">↻ Refresh</button></div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Creators</div><div class="kpi-value">${k.totalCreators}</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Businesses</div><div class="kpi-value">${k.totalBusinesses}</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Users</div><div class="kpi-value">${k.totalUsers}</div></div>
        <div class="kpi-card"><div class="kpi-label">Total Content</div><div class="kpi-value">${k.totalContent}</div></div>
        <div class="kpi-card"><div class="kpi-label">Published</div><div class="kpi-value" style="color:var(--success);">${k.publishedContent}</div></div>
        <div class="kpi-card"><div class="kpi-label">Pending Review</div><div class="kpi-value" style="color:var(--warning);">${k.pendingContent}</div></div>
        <div class="kpi-card"><div class="kpi-label">Last 7 Days</div><div class="kpi-value">${k.last7DaysContent}</div></div>
        <div class="kpi-card"><div class="kpi-label">Suspended Users</div><div class="kpi-value" style="color:var(--danger);">${k.suspendedUsers}</div></div>
        <div class="kpi-card"><div class="kpi-label">Queue Pending</div><div class="kpi-value">${k.pendingQueue}</div></div>
        <div class="kpi-card"><div class="kpi-label">Opportunities</div><div class="kpi-value">${k.totalOpportunities}</div></div>
      </div>

      <div class="chart-container">
        <div class="chart-title">Weekly Content Trend ${mockBadge}</div>
        <div class="bar-chart">
          ${(res.weeklyTrend || []).map(t => `
            <div class="bar-item">
              <div class="bar" style="height:${Math.round((t.count / maxTrend) * 180)}px;"></div>
              <div class="bar-label">${escapeHtml(t.week)}<br><strong>${t.count}</strong></div>
            </div>
          `).join('') || '<div style="color:#999;padding:20px;">No data for the period</div>'}
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-title">Content by Type</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          ${(res.byType || []).map(t => `
            <div style="text-align:center;">
              <div style="font-size:32px;font-weight:800;color:var(--primary);">${t.count}</div>
              <div style="font-size:13px;color:#999;text-transform:capitalize;">${escapeHtml(t.content_type?.replace('_', ' '))}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#dc2626;">Error: ${escapeHtml(err.message)}<br><button class="btn btn-primary" onclick="loadAnalytics()">Retry</button></div>`;
  }
}

// ── Live Alerts Page ──
async function loadAlerts() {
  const el = document.getElementById('page-content');
  try {
    const res = await apiFetch('/api/admin/alerts');
    const alerts = res.data || [];
    const mockBadge = res.isMock ? '<span class="mock-badge">Mock</span>' : '';

    el.innerHTML = `
      <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;color:#999;">Live alerts: recent content and user signups ${mockBadge}</span>
        <button class="btn btn-ghost btn-sm" onclick="loadAlerts()">↻ Refresh</button>
        <label style="font-size:12px;color:#999;"><input type="checkbox" id="auto-refresh-toggle" onchange="toggleAutoRefresh(this.checked)" ${alertInterval ? 'checked' : ''}> Auto-refresh (30s)</label>
      </div>
      <div class="table-container">
        ${alerts.length === 0 ? '<div style="padding:40px;text-align:center;color:#999;">No recent alerts</div>' : ''}
        ${alerts.map(a => `
          <div class="alert-item">
            <div class="alert-icon">${a.alert_type === 'content' ? '📝' : '👤'}</div>
            <div class="alert-text">
              <div class="alert-title">${a.alert_type === 'content' ? `New content: ${escapeHtml(a.title)}` : `New user: ${escapeHtml(a.name)}`}</div>
              <div class="alert-meta">
                ${a.alert_type === 'content' ? `by ${escapeHtml(a.creator_name)} • ${escapeHtml(a.content_type)}` : `Role: ${escapeHtml(a.role)}`}
                 • ${new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#dc2626;">Error: ${escapeHtml(err.message)}<br><button class="btn btn-primary" onclick="loadAlerts()">Retry</button></div>`;
  }
}

function toggleAutoRefresh(checked) {
  if (alertInterval) { clearInterval(alertInterval); alertInterval = null; }
  if (checked) {
    alertInterval = setInterval(() => { if (currentPage === 'alerts') loadAlerts(); }, 30000);
  }
}

// ── Admin Security Page ──
function loadSecurity() {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div style="max-width:480px;">
      <div class="table-container" style="padding:24px;">
        <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">Change Admin Password</h3>
        <label class="form-label">Current Password</label>
        <input type="password" id="sec-current-pw" class="form-input" placeholder="Enter current password">
        <label class="form-label" style="margin-top:12px;">New Password</label>
        <input type="password" id="sec-new-pw" class="form-input" placeholder="Min 8 characters">
        <label class="form-label" style="margin-top:12px;">Confirm New Password</label>
        <input type="password" id="sec-confirm-pw" class="form-input" placeholder="Confirm new password">
        <div id="sec-message" style="margin-top:12px;font-size:13px;display:none;"></div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="changeAdminPassword()">Change Password</button>
      </div>
    </div>
  `;
}

async function changeAdminPassword() {
  const currentPassword = document.getElementById('sec-current-pw').value;
  const newPassword = document.getElementById('sec-new-pw').value;
  const confirmPw = document.getElementById('sec-confirm-pw').value;
  const msgEl = document.getElementById('sec-message');

  if (!currentPassword || !newPassword) { msgEl.textContent = 'All fields required'; msgEl.style.color = '#dc2626'; msgEl.style.display = 'block'; return; }
  if (newPassword.length < 8) { msgEl.textContent = 'New password must be at least 8 characters'; msgEl.style.color = '#dc2626'; msgEl.style.display = 'block'; return; }
  if (newPassword !== confirmPw) { msgEl.textContent = 'Passwords do not match'; msgEl.style.color = '#dc2626'; msgEl.style.display = 'block'; return; }

  try {
    await apiFetch('/api/admin/security/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
    msgEl.textContent = '✓ Password changed successfully';
    msgEl.style.color = '#059669';
    msgEl.style.display = 'block';
    showToast('Password changed successfully', 'success');
    document.getElementById('sec-current-pw').value = '';
    document.getElementById('sec-new-pw').value = '';
    document.getElementById('sec-confirm-pw').value = '';
  } catch (err) {
    msgEl.textContent = err.message;
    msgEl.style.color = '#dc2626';
    msgEl.style.display = 'block';
    showToast(err.message, 'error');
  }
}

// ── Init ──
if (token) {
  // Validate token by trying a request
  apiFetch('/api/admin/analytics').then(() => showApp()).catch(() => {
    token = null;
    localStorage.removeItem('plxy_admin_token');
  });
}
