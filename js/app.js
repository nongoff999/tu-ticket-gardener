/**
 * TU Ticket Gardener - Main Application
 * มหาวิทยาลัยธรรมศาสตร์ รังสิต
 */

// App State
const AppState = {
    currentPage: 'dashboard',
    selectedCategory: 'all',
    selectedTicket: null,
    isDrawerOpen: false,
    selectedDate: new Date().toISOString().split('T')[0], // Default to today
    selectedReport: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Device Detection
    initDeviceDetection();

    // โหลดข้อมูลจาก JSON ก่อน
    await loadData();

    // Listen for realtime updates from Firebase
    if (typeof listenForUpdates === 'function') {
        listenForUpdates((newData) => {
            console.log('✨ ข้อมูลอัปเดตแบบ Real-time!');
            // Update the global MOCK_DATA reference
            window.MOCK_DATA = newData;
            // Re-render current page
            refreshCurrentPage();
        });
    }

    initRouter();
    initDrawer();
    initFilterTabs();
});

function refreshCurrentPage() {
    if (!router || !AppState.currentPage) return;

    // We don't want to re-render if the user is in the middle of a form
    if (['add', 'edit', 'add-select'].includes(AppState.currentPage)) {
        console.log('📝 ผู้ใช้กำลังกรอกข้อมูล - ข้ามการรีเฟรชหน้าจอ');
        return;
    }

    console.log(`♻️ รีเฟรชหน้า: ${AppState.currentPage}`);
    router.navigate(router.getCurrentPath(), true); // true for silent/force re-render if supported by your router
    // If router doesn't support force, we can call the renderer directly
    const routes = {
        'dashboard': renderDashboard,
        'monitor': renderMonitor,
        'tickets': renderTicketList,
        'ticket': renderTicketDetail
    };

    if (routes[AppState.currentPage]) {
        routes[AppState.currentPage]();
    }
}

function initDeviceDetection() {
    const info = getDeviceInfo();
    const el = document.getElementById('device-info');
    if (el) {
        el.textContent = `Device: ${info}`;
        console.log(`📱 ตรวจพบอุปกรณ์: ${info}`);
    }
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    let device = "Desktop";

    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "macOS";
    if (ua.indexOf("X11") !== -1) os = "UNIX";
    if (ua.indexOf("Linux") !== -1) os = "Linux";
    if (ua.indexOf("Android") !== -1) {
        os = "Android";
        device = "Mobile";
    }
    if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1 || ua.indexOf("iPod") !== -1) {
        os = "iOS";
        device = "iPhone/iPad";
    }

    // Secondary Check for common mobile devices
    if (/Mobi|Android/i.test(ua)) {
        device = "Mobile";
    }

    return `${os} (${device})`;
}

async function forceUpdate() {
    console.log('🔄 กำลังล้างแคชและอัปเดตแอป...');
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            await registration.unregister();
        }
    }

    // Clear Caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Refresh
    window.location.reload(true);
}
window.forceUpdate = forceUpdate;

// Router Setup
function initRouter() {
    router
        .register('/dashboard', renderDashboard)
        .register('/monitor', renderMonitor)
        .register('/tickets', renderTicketList)
        .register('/ticket', renderTicketDetail)
        .register('/add', renderAddTicket)
        .register('/add-select', renderCategorySelection)
        .register('/edit', renderEditTicket)
        .register('/reports', renderReportList)
        .register('/report-detail', renderReportDetail);
}

// Drawer Functions
function initDrawer() {
    // Already initialized via onclick handlers in HTML
}

function openDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateTo(page) {
    // Close drawer only on mobile
    if (window.innerWidth < 1024) {
        closeDrawer();
    }
    router.navigate('/' + page);
}

// Global Popup Functions
function showPopup(title, message, type = 'info', onConfirm = null) {
    const popup = document.getElementById('custom-popup');
    const iconContainer = document.getElementById('popup-icon');
    const iconSpan = iconContainer.querySelector('span');
    const titleEl = document.getElementById('popup-title');
    const messageEl = document.getElementById('popup-message');
    const btn = popup.querySelector('.popup-btn');

    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Set icon and style
    iconContainer.className = 'popup-icon ' + type;
    if (type === 'success') iconSpan.textContent = 'check_circle';
    else if (type === 'error') iconSpan.textContent = 'error';
    else iconSpan.textContent = 'info';

    // Show
    popup.classList.add('active');

    // Handle button click
    btn.onclick = function () {
        closePopup();
        if (onConfirm) onConfirm();
    };
}

function closePopup() {
    document.getElementById('custom-popup').classList.remove('active');
}
window.showPopup = showPopup;
window.closePopup = closePopup;

// Page Renderers
function renderDashboard() {
    AppState.currentPage = 'dashboard';
    updateActiveNavItem('dashboard');

    document.getElementById('page-title').textContent = 'TICKET DASHBOARD';

    // Calculate dynamic stats for selected date
    const stats = getStatsForDate(AppState.selectedDate);

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Weekly Calendar -->
        ${Components.weeklyCalendar(AppState.selectedDate)}

        <!-- Stats Grid -->
        <div class="stats-grid" style="margin-top: -1rem;">
            ${Components.statCard('ทิคเก็ตทั้งหมด', stats.total, 'blue', 'dashboard')}
            ${Components.statCard('ทิคเก็ตใหม่', stats.new, 'yellow', 'notification_important')}
            ${Components.statCard('ดำเนินการ', stats.inProgress, 'purple', 'settings_suggest')}
            ${Components.statCard('ยังไม่ดำเนินการ', stats.pending, 'pink', 'pending_actions')}
            ${Components.statCard('เสร็จสิ้น', stats.completed, 'green', 'task_alt')}
        </div>

        <!-- Period Tabs -->
        <div class="period-tabs">
            <button class="period-tab active">DAY</button>
            <button class="period-tab">WEEK</button>
            <button class="period-tab">MONTH</button>
        </div>

        <!-- Chart Card -->
        <div class="chart-card">
            <h2>รายงานจำนวนของทิคเก็ตรายสัปดาห์</h2>
            <div style="position: relative; height: 12rem;">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                    <path d="M 0 30 Q 15 25 25 28 T 45 35 T 65 22 T 85 28 T 100 35" 
                          fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"></path>
                    <path d="M 0 42 Q 15 40 25 38 T 45 35 T 65 40 T 85 38 T 100 45" 
                          fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"></path>
                </svg>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0 0.25rem; margin-top: 0.5rem;">
                <span style="font-size: 0.625rem; color: var(--text-muted);">จ.</span>
                <span style="font-size: 0.625rem; color: var(--text-muted);">อ.</span>
                <span style="font-size: 0.625rem; color: var(--text-muted);">พ.</span>
                <span style="font-size: 0.625rem; color: var(--text-muted);">พฤ.</span>
                <span style="font-size: 0.625rem; color: var(--text-muted);">ศ.</span>
                <span style="font-size: 0.625rem; color: var(--text-muted);">ส.</span>
                <span style="font-size: 0.625rem; color: var(--text-muted);">อา.</span>
            </div>
            <div class="chart-legend">
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #FBBF24;"></div>
                    <span class="chart-legend-text">ทิคเก็ตเปิดใหม่</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #10B981;"></div>
                    <span class="chart-legend-text">ทิคเก็ตที่ปิด</span>
                </div>
            </div>
        </div>

        <!-- Donut Chart Card -->
        <div class="chart-card">
            <h2>รายงานจำนวนต้นไม้ที่โค่นล้ม</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem 0.75rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #BAE6FD;"></div>
                    <span style="font-size: 0.625rem;">ต้นนนทรี</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #A7F3D0;"></div>
                    <span style="font-size: 0.625rem;">ต้นพฤกษ์</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #FDE68A;"></div>
                    <span style="font-size: 0.625rem;">ต้นอินทนิล</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #FECDD3;"></div>
                    <span style="font-size: 0.625rem;">ต้นมะฮอกกานี</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #C7D2FE;"></div>
                    <span style="font-size: 0.625rem;">ต้นสน</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #E2E8F0;"></div>
                    <span style="font-size: 0.625rem;">อื่นๆ</span>
                </div>
            </div>
            <div style="display: flex; justify-content: center; align-items: center; padding: 1rem;">
                <svg viewBox="0 0 100 100" style="width: 14rem; height: 14rem;">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F5F9" stroke-width="12"></circle>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#BAE6FD" stroke-width="12" 
                            stroke-dasharray="80 251.2" stroke-dashoffset="0" 
                            style="transform: rotate(-90deg); transform-origin: 50% 50%;"></circle>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#A7F3D0" stroke-width="12"
                            stroke-dasharray="60 251.2" stroke-dashoffset="-80"
                            style="transform: rotate(-90deg); transform-origin: 50% 50%;"></circle>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FDE68A" stroke-width="12"
                            stroke-dasharray="40 251.2" stroke-dashoffset="-140"
                            style="transform: rotate(-90deg); transform-origin: 50% 50%;"></circle>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FECDD3" stroke-width="12"
                            stroke-dasharray="30 251.2" stroke-dashoffset="-180"
                            style="transform: rotate(-90deg); transform-origin: 50% 50%;"></circle>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#C7D2FE" stroke-width="12"
                            stroke-dasharray="41.2 251.2" stroke-dashoffset="-210"
                            style="transform: rotate(-90deg); transform-origin: 50% 50%;"></circle>
                </svg>
                <div style="position: absolute; display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 1.875rem; font-weight: 700;">${stats.total}</span>
                    <span style="font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Total</span>
                </div>
            </div>
        </div>

        <div class="safe-area-bottom"></div>
    `;

    // Add calendar functionality
    const calendarDays = content.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => {
        day.addEventListener('click', function () {
            AppState.selectedDate = this.dataset.date;
            renderDashboard(); // Re-render with new date
        });
    });

    // Add period tab functionality
    const periodTabs = content.querySelectorAll('.period-tab');
    periodTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            periodTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function getStatsForDate(dateStr) {
    const tickets = MOCK_DATA.tickets.filter(t => t.date.startsWith(dateStr));
    return {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'inProgress').length,
        pending: tickets.filter(t => t.status === 'pending').length,
        completed: tickets.filter(t => t.status === 'completed').length
    };
}

function renderMonitor() {
    AppState.currentPage = 'monitor';
    updateActiveNavItem('monitor');

    document.getElementById('page-title').textContent = 'GARDEN MONITOR';

    const urgentCount = MOCK_DATA.tickets.filter(t => t.priority === 'urgent').length;
    const normalCount = MOCK_DATA.tickets.filter(t => t.priority === 'normal').length;

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card urgent">
                <p class="summary-card-label">ทิคเก็ตเร่งด่วน</p>
                <p class="summary-card-value">${urgentCount}</p>
                <span class="material-symbols-outlined summary-card-icon">notifications</span>
            </div>
            <div class="summary-card normal">
                <p class="summary-card-label">ทิคเก็ตปกติ</p>
                <p class="summary-card-value">${normalCount}</p>
                <span class="material-symbols-outlined summary-card-icon">confirmation_number</span>
            </div>
        </div>

        <!-- Search -->
        <div class="search-box">
            <span class="material-symbols-outlined icon">search</span>
            <input type="text" placeholder="ค้นหาทิคเก็ต..." id="search-input">
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs" id="filter-tabs">
            <button class="filter-tab active" data-filter="all">ทั้งหมด</button>
            <button class="filter-tab" data-filter="new">ทิคเก็ตใหม่</button>
            <button class="filter-tab" data-filter="inProgress">ระหว่างดำเนินการ</button>
            <button class="filter-tab" data-filter="completed">เสร็จสิ้น</button>
        </div>

        <!-- Ticket List -->
        <div class="ticket-list pb-safe" id="ticket-list">
            ${MOCK_DATA.tickets.map(ticket => Components.monitorCard(ticket)).join('')}
        </div>
    `;

    initFilterTabs();
    initSearch();
}

function renderTicketList() {
    AppState.currentPage = 'tickets';
    updateActiveNavItem('tickets');

    document.getElementById('page-title').textContent = 'TICKET LISTS';

    const urgentCount = MOCK_DATA.tickets.filter(t => t.priority === 'urgent').length;
    const normalCount = MOCK_DATA.tickets.filter(t => t.priority === 'normal').length;

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card urgent">
                <p class="summary-card-label">ทิคเก็ตเร่งด่วน</p>
                <p class="summary-card-value">${urgentCount}</p>
                <span class="material-symbols-outlined summary-card-icon">notifications_active</span>
            </div>
            <div class="summary-card normal">
                <p class="summary-card-label">ทิคเก็ตปกติ</p>
                <p class="summary-card-value">${normalCount}</p>
                <span class="material-symbols-outlined summary-card-icon">confirmation_number</span>
            </div>
        </div>

        <!-- Search -->
        <div class="search-box">
            <span class="material-symbols-outlined icon">search</span>
            <input type="text" placeholder="Search ticket" id="search-input">
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs" id="filter-tabs">
            ${MOCK_DATA.categories.map((cat, i) =>
        Components.filterTab(cat.id, cat.name, i === 0)
    ).join('')}
        </div>

        <!-- Ticket Count -->
        <div style="padding: 0 1.5rem; margin-bottom: 0.5rem;">
            <p style="font-size: 0.875rem; color: var(--text-muted);">ทั้งหมด ${MOCK_DATA.tickets.length} รายการ</p>
        </div>

        <!-- Ticket List -->
        <div class="ticket-list pb-safe" id="ticket-list">
            ${MOCK_DATA.tickets.map(ticket => Components.ticketCard(ticket)).join('')}
        </div>
    `;

    initFilterTabs();
    initSearch();
}

function renderTicketDetail(params) {
    const ticketId = params[0] ? parseInt(params[0]) : null;
    const ticket = MOCK_DATA.tickets.find(t => t.id === ticketId);

    if (!ticket) {
        router.navigate('/tickets');
        return;
    }

    AppState.selectedTicket = ticket;

    document.getElementById('page-title').textContent = 'TICKET DETAILS';

    const statusStep = ticket.status === 'new' ? 1 :
        ticket.status === 'inProgress' ? 2 : 3;

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Image Carousel -->
        <div class="detail-image">
            <img src="${ticket.images[0]}" alt="${ticket.title}">
            <button class="detail-back-btn" onclick="history.back()">
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <div class="detail-dots">
                ${ticket.images.map((_, i) => `<div class="detail-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
            </div>
        </div>

        <!-- Content Card -->
        <div class="detail-content">
            <div class="detail-header">
                <h1 class="detail-title">${ticket.title}</h1>
                <div class="detail-badges">
                    <span class="badge ${getStatusClass(ticket.status)}">${getStatusLabel(ticket.status)}</span>
                    ${ticket.priority === 'urgent' ? '<span class="badge urgent">เร่งด่วน</span>' : ''}
                </div>
            </div>

            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <span class="detail-info-label">Ticket Number</span>
                    <span class="detail-info-value large">${ticket.id}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">Ticket Type</span>
                    <span class="detail-info-value">${getCategoryName(ticket.category)}</span>
                </div>
            </div>

            <div class="detail-description">
                <span class="detail-info-label">Ticket Description :</span>
                <p style="margin-top: 0.5rem;">${ticket.description}</p>
            </div>

            <div class="detail-info-grid" style="margin-top: 1.5rem;">
                <div class="detail-info-item">
                    <span class="detail-info-label">การดำเนินงาน :</span>
                    <span class="detail-info-value">${ticket.operation}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">สถานที่เกิดเหตุ :</span>
                    <span class="detail-info-value">${ticket.zoneName}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">ชนิดพันธุ์ไม้ :</span>
                    <span class="detail-info-value">${ticket.treeType}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">เส้นรอบวง :</span>
                    <span class="detail-info-value">${ticket.circumference} นิ้ว</span>
                </div>
                <div class="detail-info-item full">
                    <span class="detail-info-label">ผู้รับผิดชอบ :</span>
                    <span class="detail-info-value">${ticket.assignees.length > 0 ? ticket.assignees.join(', ') : '-'}</span>
                </div>
                ${ticket.notes ? `
                <div class="detail-info-item full">
                    <span class="detail-info-label">หมายเหตุ :</span>
                    <span class="detail-info-value">${ticket.notes}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Edit Button -->
        <div class="detail-footer">
            <button class="btn btn-primary" onclick="router.navigate('/edit/${ticket.id}')">
                Edit Ticket
            </button>
        </div>

        <div style="height: 8rem;"></div>
    `;
}

function renderAddTicket() {
    AppState.currentPage = 'add';
    updateActiveNavItem('add');

    document.getElementById('page-title').textContent = 'ADD TICKET';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Stepper -->
        ${Components.stepper(1)}

        <div style="padding: 0 1rem;">
            <form id="ticket-form">
                <div class="form-group">
                    <label class="form-label">ลำดับความสำคัญ <span class="required">*</span></label>
                    <div class="priority-toggle">
                        <button type="button" class="priority-btn normal active">ปกติ</button>
                        <button type="button" class="priority-btn urgent">เร่งด่วน</button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Ticket Name <span class="required">*</span></label>
                    <input type="text" id="ticket-title" class="form-input" placeholder="ชื่อทิคเก็ต">
                </div>

                <div class="form-group">
                    <label class="form-label">Ticket Description</label>
                    <textarea class="form-textarea" rows="4" placeholder="รายละเอียดของปัญหา"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">ชื่อสถานที่ <span class="required">*</span></label>
                    <select id="ticket-zone" class="form-select">
                        <option value="" disabled selected>ระบุชื่อสถานที่</option>
                        ${MOCK_DATA.zones.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">รูปภาพ <span class="required">*</span> <span class="image-count">(0/6)</span></label>
                    <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
                    <div class="image-grid" id="image-grid">
                        <div class="image-add" id="image-add-btn">
                            <span class="material-symbols-outlined" style="font-size: 1.5rem;">add</span>
                            <span class="label">เพิ่มรูป</span>
                        </div>
                    </div>
                </div>

                <div style="padding: 1.5rem 0 2rem;">
                    <button type="submit" class="btn btn-primary">บันทึก</button>
                </div>
            </form>
        </div>

        <div class="safe-area-bottom"></div>
    `;

    // Priority toggle
    const priorityBtns = content.querySelectorAll('.priority-btn');
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            priorityBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Image upload functionality
    const uploadedImages = [];
    const MAX_IMAGES = 6;
    initImageUpload(content, uploadedImages, MAX_IMAGES);

    // Form submit
    const form = content.querySelector('#ticket-form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const title = content.querySelector('#ticket-title').value.trim();
        const zoneId = content.querySelector('#ticket-zone').value;
        const description = content.querySelector('.form-textarea').value.trim();
        const isUrgent = content.querySelector('.priority-btn.urgent').classList.contains('active');

        const errors = [];
        if (!title) errors.push('ชื่อทิคเก็ต');
        if (!zoneId) errors.push('ชื่อสถานที่');
        if (uploadedImages.length === 0) errors.push('รูปภาพ (อย่างน้อย 1 รูป)');

        if (errors.length > 0) {
            showPopup('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน:\n' + errors.join('\n'), 'error');
            return;
        }

        // Create new ticket object
        const newTicket = {
            id: Math.floor(Math.random() * 100000), // Simple random ID
            title: title,
            description: description,
            category: 'nature', // Default category for now
            status: 'new',
            priority: isUrgent ? 'urgent' : 'normal',
            zone: zoneId,
            zoneName: MOCK_DATA.zones.find(z => z.id === zoneId)?.name || zoneId,
            treeType: '-',
            damageType: 'broken',
            circumference: 0,
            quantity: 1,
            impact: '-',
            operation: '-',
            date: new Date().toISOString(), // Current timestamp
            assignees: [], // Initially empty
            images: uploadedImages.map(img => img.url),
            notes: ''
        };

        // Add to MOCK_DATA
        MOCK_DATA.tickets.unshift(newTicket);

        // Save to LocalStorage
        saveData();

        showPopup('บันทึกสำเร็จ', 'บันทึกทิคเก็ตเรียบร้อยแล้ว', 'success', () => {
            router.navigate('/tickets');
        });
    });
}

function renderEditTicket(params) {
    const ticketId = params[0] ? parseInt(params[0]) : null;
    const ticket = MOCK_DATA.tickets.find(t => t.id === ticketId);

    if (!ticket) {
        router.navigate('/tickets');
        return;
    }

    AppState.currentPage = 'edit';

    document.getElementById('page-title').textContent = 'EDIT TICKET';

    const statusStep = ticket.status === 'new' ? 1 :
        ticket.status === 'inProgress' ? 2 : 3;

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Stepper -->
        ${Components.stepper(statusStep)}

        <div style="padding: 0 1rem;">
            <form id="ticket-form">
                <div class="form-group">
                    <label class="form-label">Ticket Status <span class="required">*</span></label>
                    <select class="form-select">
                        <option value="new" ${ticket.status === 'new' ? 'selected' : ''}>ทิคเก็ตใหม่</option>
                        <option value="inProgress" ${ticket.status === 'inProgress' ? 'selected' : ''}>ระหว่างดำเนินการ</option>
                        <option value="completed" ${ticket.status === 'completed' ? 'selected' : ''}>ปิดทิคเก็ต</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">ลำดับความสำคัญ <span class="required">*</span></label>
                    <div class="priority-toggle">
                        <button type="button" class="priority-btn normal ${ticket.priority === 'normal' ? 'active' : ''}">ปกติ</button>
                        <button type="button" class="priority-btn urgent ${ticket.priority === 'urgent' ? 'active' : ''}">เร่งด่วน</button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Ticket Name <span class="required">*</span></label>
                    <input type="text" id="edit-ticket-title" class="form-input" value="${ticket.title}">
                </div>

                <div class="form-group">
                    <label class="form-label">Ticket Description</label>
                    <textarea id="edit-ticket-description" class="form-textarea" rows="3">${ticket.description}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">คุณลักษณะ</label>
                    <div class="tags-container">
                        ${MOCK_DATA.damageTypes.map(dt => `
                            <button type="button" class="tag ${ticket.damageType === dt.id ? 'active' : ''}" data-value="${dt.id}">
                                ${dt.name}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">การดำเนินงาน</label>
                    <select class="form-select" id="operation-select">
                        ${MOCK_DATA.operations.map(op => `
                            <option ${ticket.operation === op ? 'selected' : ''}>${op}</option>
                        `).join('')}
                        <option value="other" ${!MOCK_DATA.operations.includes(ticket.operation) && ticket.operation ? 'selected' : ''}>อื่นๆ โปรดระบุ</option>
                    </select>
                </div>

                <div class="form-group" id="operation-other-container" style="display: ${!MOCK_DATA.operations.includes(ticket.operation) && ticket.operation ? 'block' : 'none'};">
                    <label class="form-label">ระบุการดำเนินงาน</label>
                    <input type="text" class="form-input" id="operation-other-input" value="${!MOCK_DATA.operations.includes(ticket.operation) ? ticket.operation : ''}" placeholder="โปรดระบุขั้นตอนการดำเนินงาน">
                </div>

                <div class="form-group">
                    <label class="form-label">ชนิดพันธุ์ต้นไม้</label>
                    <select class="form-select" id="edit-ticket-treeType">
                        ${MOCK_DATA.treeTypes.map(tt => `
                            <option ${ticket.treeType === tt ? 'selected' : ''}>${tt}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label text-center">เส้นรอบวง (นิ้ว)</label>
                    <div class="number-input" style="width: 100%;">
                        <button type="button" class="number-btn minus"><span class="material-symbols-outlined">remove</span></button>
                        <input type="number" value="${ticket.circumference}" id="circumference">
                        <button type="button" class="number-btn plus"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label text-center">จำนวน</label>
                    <div class="number-input" style="width: 100%;">
                        <button type="button" class="number-btn minus"><span class="material-symbols-outlined">remove</span></button>
                        <input type="number" value="${ticket.quantity}" id="quantity">
                        <button type="button" class="number-btn plus"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">ผลกระทบที่ได้รับ</label>
                    <input type="text" id="edit-ticket-impact" class="form-input" value="${ticket.impact}">
                </div>

                <div class="form-group">
                    <label class="form-label">สถานที่เกิดเหตุ (โซน)</label>
                    <input type="text" id="edit-ticket-zoneName" class="form-input" value="${ticket.zoneName}">
                </div>

                <div class="form-group">
                    <label class="form-label">หมายเหตุ</label>
                    <input type="text" id="edit-ticket-notes" class="form-input" value="${ticket.notes || ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">รูปภาพ <span class="required">*</span> <span class="image-count">(${ticket.images.length}/6)</span></label>
                    <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
                    <div class="image-grid" id="image-grid">
                        <div class="image-add" id="image-add-btn">
                            <span class="material-symbols-outlined" style="font-size: 1.5rem;">add</span>
                            <span class="label">เพิ่มรูป</span>
                        </div>
                    </div>
                </div>

                <div style="padding: 1.5rem 0 2rem;">
                    <button type="submit" class="btn btn-primary">บันทึก</button>
                </div>
            </form>
        </div>

        <div class="safe-area-bottom"></div>
    `;

    // Priority toggle
    const priorityBtns = content.querySelectorAll('.priority-btn');
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            priorityBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Tags
    const tags = content.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', function () {
            tags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Number inputs
    const numberInputs = content.querySelectorAll('.number-input');
    numberInputs.forEach(container => {
        const input = container.querySelector('input');
        const minusBtn = container.querySelector('.minus');
        const plusBtn = container.querySelector('.plus');

        minusBtn.addEventListener('click', () => {
            input.value = Math.max(0, parseInt(input.value) - 1);
        });
        plusBtn.addEventListener('click', () => {
            input.value = parseInt(input.value) + 1;
        });
    });

    // Operation Select Change
    const opSelect = content.querySelector('#operation-select');
    const opOtherContainer = content.querySelector('#operation-other-container');

    opSelect.addEventListener('change', function () {
        if (this.value === 'other') {
            opOtherContainer.style.display = 'block';
            setTimeout(() => {
                content.querySelector('#operation-other-input').focus();
            }, 100);
        } else {
            opOtherContainer.style.display = 'none';
        }
    });

    // Image upload functionality with existing images
    const uploadedImages = [];
    const MAX_IMAGES = 6;
    initImageUpload(content, uploadedImages, MAX_IMAGES, ticket.images);

    // Form submit
    const form = content.querySelector('#ticket-form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (uploadedImages.length === 0) {
            showPopup('ข้อมูลไม่ครบถ้วน', 'กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูป', 'error');
            return;
        }

        // Gather values using IDs to prevent index mapping issues
        const status = form.querySelector('select').value;
        const isUrgent = form.querySelector('.priority-btn.urgent').classList.contains('active');
        const title = document.getElementById('edit-ticket-title').value.trim();
        const description = document.getElementById('edit-ticket-description').value.trim();
        const resultImpact = document.getElementById('edit-ticket-impact').value.trim();
        const zoneName = document.getElementById('edit-ticket-zoneName').value.trim();
        const notes = document.getElementById('edit-ticket-notes').value.trim();

        // Tags (Damage Type)
        const activeTag = form.querySelector('.tag.active');
        const damageTypeId = activeTag ? activeTag.dataset.value : ticket.damageType;

        // Operation
        const opSelectInput = document.getElementById('operation-select');
        let operation = opSelectInput.value;
        if (operation === 'other') {
            operation = document.getElementById('operation-other-input').value.trim();
        }

        // Tree Type
        const treeType = document.getElementById('edit-ticket-treeType').value;

        // Numbers
        const circumference = parseInt(document.getElementById('circumference').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;

        // Update Ticket Object
        ticket.status = status;
        ticket.priority = isUrgent ? 'urgent' : 'normal';
        ticket.title = title;
        ticket.description = description;
        ticket.damageType = damageTypeId;
        ticket.operation = operation;
        ticket.treeType = treeType;
        ticket.circumference = circumference;
        ticket.quantity = quantity;
        ticket.impact = resultImpact;
        ticket.zoneName = zoneName;
        ticket.notes = notes;
        ticket.images = uploadedImages.map(img => img.url);

        // Update in Array (Reference is same, but good to be explicit if replacing object)
        // Since we modified properies of `ticket` which is a reference to the object in MOCK_DATA array, 
        // the array is already updated.

        // Save to storage
        saveData();

        showPopup('บันทึกสำเร็จ', 'ดูแลข้อมูลเรียบร้อยแล้ว', 'success', () => {
            router.navigate('/ticket/' + ticket.id);
        });
    });
}

function renderCategorySelection() {
    AppState.currentPage = 'add-select';
    updateActiveNavItem('add-select');

    document.getElementById('page-title').textContent = 'SELECT CATEGORY';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="category-selection-container">
            <h2 style="text-align: center; font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">โปรดเลือกหมวดหมู่ทิคเก็ต</h2>
            
            <div class="category-grid">
                <!-- Security Card (Disabled/Inactive for now) -->
                <div class="category-card disabled" onclick="showPopup('ยังไม่เปิดให้บริการ', 'ระบบ Security Ticket อยู่ระหว่างการพัฒนา', 'info')">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdO2g1xFQm3R6XxkcDCdtIeGNzjvOoJfBvVQLD83ZcFO5XWgXjeku3lEGyRj7uhq5Nd-bGircOU2gh3zzOrOkmJgMLuk06iabUg_7vGqaSF5F2C-dusDicJOeDXjJ8Q63xXOG_ECI1XXl9r2aYbfjzxTRAp0ZVjmTdSX7arUobX47umUMnEWAW0HYiFkIJz_wZSOonXQD5edlr6X38g2T_OZMVi5yfSU82SrzJtXOR1jQts57MnBVhyinzkrPvOZ3VksmbVmyqDMU" 
                         alt="Professional Security Officer" class="category-card-img">
                    <div class="category-card-overlay">
                        <p class="category-subtitle">TICKET</p>
                        <h3 class="category-title">Security</h3>
                    </div>
                </div>

                <!-- Gardener Card (Active) -->
                <div class="category-card active gardener" onclick="router.navigate('/add')">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAteNisuFGxXvz5p3iZfrBglXaOjnXcduPhkx3UbVYLuG6KUXONqFjg7xb4O5akv1m3F7sZJn9iry-SbLukeHDNcllzeHliu_xWfpPXxM6U55eF1r2oGCOlAfT-q48s_cI0o-Q63Krq6I5LTs6CenOiNTUiFkf1YVyvFyB8nRTiV2Dp9OQcYVNgf1BNGnI0fdOqRa45jfd5g-oIaRvhZ72xA37NJ8PS3TaqCpgQ1xuUD7WnmJZceDEM17WNSX5ZYY6DpS_jmdwyrXQ" 
                         alt="Gardener in Lush Green Garden" class="category-card-img">
                    <div class="category-card-overlay">
                        <p class="category-subtitle">TICKET</p>
                        <h3 class="category-title">Gardener</h3>
                    </div>
                </div>
            </div>

            <div style="flex: 1;"></div>
            
            <div style="display: flex; justify-content: center; padding-bottom: 1rem;">
                <div style="width: 8rem; height: 0.375rem; background: var(--border); border-radius: 9999px;"></div>
            </div>
        </div>
    `;
}

// Helper Functions
function updateActiveNavItem(page) {
    const navItems = document.querySelectorAll('.drawer-nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
}

function initFilterTabs() {
    const filterContainer = document.getElementById('filter-tabs');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', function (e) {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;

        // Update active state
        filterContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Filter tickets
        const filter = tab.dataset.filter;
        filterTickets(filter);
    });
}

function filterTickets(filter) {
    const ticketList = document.getElementById('ticket-list');
    if (!ticketList) return;

    let filtered = MOCK_DATA.tickets;

    if (filter !== 'all') {
        if (['new', 'inProgress', 'completed', 'pending'].includes(filter)) {
            filtered = MOCK_DATA.tickets.filter(t => t.status === filter);
        } else {
            filtered = MOCK_DATA.tickets.filter(t => t.category === filter);
        }
    }

    const isMonitor = AppState.currentPage === 'monitor';
    ticketList.innerHTML = filtered.map(ticket =>
        isMonitor ? Components.monitorCard(ticket) : Components.ticketCard(ticket)
    ).join('');
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const ticketList = document.getElementById('ticket-list');
        if (!ticketList) return;

        const filtered = MOCK_DATA.tickets.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.zoneName.toLowerCase().includes(query) ||
            t.id.toString().includes(query)
        );

        const isMonitor = AppState.currentPage === 'monitor';
        ticketList.innerHTML = filtered.map(ticket =>
            isMonitor ? Components.monitorCard(ticket) : Components.ticketCard(ticket)
        ).join('');
    });
}

function showTicketDetail(ticketId) {
    router.navigate('/ticket/' + ticketId);
}

// Image Upload Helper Function
function initImageUpload(container, uploadedImages, maxImages, existingImages = []) {
    const imageInput = container.querySelector('#image-input');
    const imageGrid = container.querySelector('#image-grid');
    const imageAddBtn = container.querySelector('#image-add-btn');
    const imageCountLabel = container.querySelector('.image-count');

    // Add existing images to the array
    existingImages.forEach(img => uploadedImages.push({ url: img, isExisting: true }));

    function updateImageGrid() {
        // Clear grid except add button
        const items = imageGrid.querySelectorAll('.image-item');
        items.forEach(item => item.remove());

        // Add all images before the add button
        uploadedImages.forEach((imgData, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${imgData.url}" alt="รูปที่ ${index + 1}">
                <button type="button" class="image-remove" onclick="removeUploadedImage(${index})">
                    <span class="material-symbols-outlined" style="font-size: 0.875rem;">close</span>
                </button>
            `;
            imageGrid.insertBefore(imageItem, imageAddBtn);
        });

        // Update count label
        if (imageCountLabel) {
            imageCountLabel.textContent = `(${uploadedImages.length}/${maxImages})`;
        }

        // Hide add button if max reached
        if (uploadedImages.length >= maxImages) {
            imageAddBtn.style.display = 'none';
        } else {
            imageAddBtn.style.display = 'flex';
        }
    }

    // Store reference for removal
    window._currentUploadedImages = uploadedImages;
    window._currentUpdateGrid = updateImageGrid;

    // Click to open file picker
    imageAddBtn.addEventListener('click', () => {
        if (uploadedImages.length < maxImages) {
            imageInput.click();
        }
    });

    // Handle file selection
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const remaining = maxImages - uploadedImages.length;
        const filesToAdd = files.slice(0, remaining);

        filesToAdd.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImages.push({
                        url: event.target.result,
                        file: file,
                        isExisting: false
                    });
                    updateImageGrid();
                };
                reader.readAsDataURL(file);
            }
        });

        // Reset input to allow re-selecting same file
        imageInput.value = '';
    });

    // Initial render
    updateImageGrid();
}

// Global function to remove uploaded image
function removeUploadedImage(index) {
    if (window._currentUploadedImages) {
        window._currentUploadedImages.splice(index, 1);
        if (window._currentUpdateGrid) {
            window._currentUpdateGrid();
        }
    }
}

// Export functions
window.removeUploadedImage = removeUploadedImage;

/**
 * ==========================================
 * Reports Module Implementation
 * ==========================================
 */

function renderReportList() {
    AppState.currentPage = 'reports';
    updateActiveNavItem('reports');
    document.getElementById('page-title').textContent = 'รายงาน';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="report-list">
            <div class="report-card" onclick="openReportDetail('summary')">
                <div class="report-card-icon">
                    <span class="material-symbols-outlined">summarize</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานสรุปต้นไม้โค่นล้ม หัก ฉีกขาด จากลมฝน</h3>
                    <p>สรุปรายการความเสียหายรายวัน พร้อมรูปภาพและสถิติสะสม</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>
        </div>
    `;
}

function openReportDetail(type) {
    AppState.selectedReport = type;
    navigateTo('/report-detail');
}
window.openReportDetail = openReportDetail;

function renderReportDetail() {
    AppState.currentPage = 'report-detail';
    document.getElementById('page-title').textContent = 'รายงานสรุปต้นไม้โค่นล้มฯ';

    // Calculate current fiscal year (Oct-Sep)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentFiscalYear = currentMonth >= 9 ? currentYear : currentYear - 1;

    // Generate fiscal year options from 2567 (2024) up to current + allow future
    const startFY = 2024; // First year the system launched (พ.ศ. 2567)
    let fyOptions = '';
    for (let fy = currentFiscalYear; fy >= startFY; fy--) {
        const thaiYear = fy + 543;
        const selected = fy === currentFiscalYear ? 'selected' : '';
        fyOptions += `<option value="${fy}" ${selected}>ปีงบประมาณ ${thaiYear} (ต.ค. ${thaiYear - 1} - ก.ย. ${thaiYear})</option>`;
    }

    const content = document.getElementById('main-content');

    content.innerHTML = `
        <div class="search-container">
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">
                    <span class="material-symbols-outlined" style="font-size: 1.1rem; vertical-align: middle; margin-right: 4px;">calendar_month</span>
                    เลือกปีงบประมาณ
                </label>
                <select id="report-fiscal-year" class="form-input" style="font-size: 1rem; padding: 0.75rem 1rem; cursor: pointer;">
                    ${fyOptions}
                </select>
            </div>
            
            <button class="btn btn-primary" onclick="downloadRangeReport()" style="height: 3.5rem; width: 100%; margin-top: 0.5rem;">
                <span class="material-symbols-outlined">download</span>
                ดาวน์โหลดรายงาน Excel
            </button>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--primary-light); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
                <div style="display: flex; align-items: start; gap: 0.75rem;">
                    <span class="material-symbols-outlined" style="color: var(--primary); font-size: 1.25rem;">info</span>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                        <strong style="color: var(--primary);">รายงานจะรวมข้อมูลทั้งหมดในปีงบประมาณที่เลือก</strong><br>
                        • ช่วงเวลา: 1 ตุลาคม ถึง 30 กันยายน<br>
                        • แสดงรายการความเสียหายทั้งหมดพร้อมวันที่เกิดเหตุ<br>
                        • รวมรูปภาพประกอบในไฟล์ Excel<br>
                        • แสดงสถิติสรุปและยอดสะสมอัตโนมัติ
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Download report based on selected fiscal year
async function downloadRangeReport() {
    const fySelect = document.getElementById('report-fiscal-year');
    if (!fySelect) {
        showPopup('แจ้งเตือน', 'กรุณาเลือกปีงบประมาณ', 'warning');
        return;
    }

    const fy = parseInt(fySelect.value); // e.g. 2025
    const startDate = `${fy}-10-01`;

    // End date: Sep 30 of next year, or today if current fiscal year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentFiscalYear = currentMonth >= 9 ? now.getFullYear() : now.getFullYear() - 1;

    let endDate;
    if (fy === currentFiscalYear) {
        // Current fiscal year: use today's date
        endDate = now.toISOString().split('T')[0];
    } else {
        // Past fiscal year: use Sep 30 of next year
        endDate = `${fy + 1}-09-30`;
    }

    await exportToExcel(startDate, endDate);
}
window.downloadRangeReport = downloadRangeReport;

/**
 * Excel Export Logic using ExcelJS
 * Now supports date ranges and shows incident dates
 */
async function exportToExcel(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const today = new Date();

    // Format dates for headers
    const startThaiDate = startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const endThaiDate = endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const todayThaiDate = today.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Determine fiscal year
    const reportYear = endDate.getFullYear();
    const reportMonth = endDate.getMonth();
    const fiscalYearStart = reportMonth >= 9 ? reportYear : reportYear - 1;
    const thaiYear = fiscalYearStart + 543;

    // Filter tickets for the date range
    const rangeTickets = MOCK_DATA.tickets.filter(t => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

    // Calculate Stats for range
    const totalFallen = rangeTickets.filter(t => t.damageType === 'fallen').length;
    const totalBroken = rangeTickets.filter(t => t.damageType === 'broken' || t.damageType === 'tilted').length;
    const grandTotalItems = rangeTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);

    // Calculate Accumulated (from Oct 1st to end date)
    const fiscalStart = new Date(`${fiscalYearStart}-10-01`);
    const accTickets = MOCK_DATA.tickets.filter(t => {
        const d = new Date(t.date);
        return d >= fiscalStart && d <= endDate;
    });
    const accFallen = accTickets.filter(t => t.damageType === 'fallen').length;
    const accBroken = accTickets.filter(t => t.damageType === 'broken' || t.damageType === 'tilted').length;

    const fiscalStartLabel = `1 ตุลาคม ${thaiYear}`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`รายงาน ${thaiYear}`);

    // Set Column Widths (added date column)
    worksheet.columns = [
        { width: 8 },  // ลำดับ
        { width: 15 }, // วันที่เกิดเหตุ (NEW)
        { width: 28 }, // สถานที่เกิดเหตุ
        { width: 25 }, // รูปภาพ
        { width: 12 }, // จำนวน
        { width: 38 }, // โค่นล้ม
        { width: 38 }  // กิ่งหัก/ฉีก/เอน
    ];

    // 1. Add PSM Logo - SKIPPED to avoid CORS/Fetch errors
    /*
    try {
        const logoUrl = 'https://psm.tu.ac.th/wp-content/uploads/2025/07/cropped-SapSin_Triangle_Color.png';
        const logoResponse = await fetch(logoUrl);
        const logoBuffer = await logoResponse.arrayBuffer();

        const logoImageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });

        worksheet.addImage(logoImageId, {
            tl: { col: 0.2, row: 0.2 },
            ext: { width: 80, height: 80 }
        });
    } catch (e) {
        console.warn('Could not load logo:', e);
    }
    */

    // 2. Headers (Title & Subtitle)
    const titleRow = worksheet.addRow(['รายงานสรุปต้นไม้โค่นล้ม หัก ฉีกขาด จากลมฝน']);
    worksheet.mergeCells('A1:G1');
    titleRow.font = { name: 'Sarabun', size: 16, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    // Show fiscal year or date range
    const periodLabel = startThaiDate === endThaiDate
        ? startThaiDate
        : `ปีงบประมาณ ${thaiYear} (${startThaiDate} - ${endThaiDate})`;
    const periodRow = worksheet.addRow([periodLabel]);
    worksheet.mergeCells('A2:G2');
    periodRow.font = { name: 'Sarabun', size: 14, bold: true };
    periodRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Report generation date
    const genDateRow = worksheet.addRow([`วันที่จัดทำรายงาน: ${todayThaiDate}`]);
    worksheet.mergeCells('A3:G3');
    genDateRow.font = { name: 'Sarabun', size: 12, bold: true, color: { argb: 'FF0000FF' } };
    genDateRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const locationRow = worksheet.addRow(['(ในพื้นที่ สำนักงานบริหารทรัพยากรสินทรัพย์และกีฬา)']);
    worksheet.mergeCells('A4:G4');
    locationRow.font = { name: 'Sarabun', size: 12, bold: true, color: { argb: 'FF0000FF' } };
    locationRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Gap

    // 3. Table Header Row - 7 columns with date column
    const headerRow = worksheet.addRow(['ลำดับ', 'วันที่เกิดเหตุ', 'สถานที่เกิดเหตุ', 'รูปภาพ', 'จำนวน', 'ชนิดต้นไม้และสถานะ\nโค่นล้ม', 'กิ่งหัก/ฉีก/เอน']);
    headerRow.height = 40;
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCCCCC' }
        };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.font = { name: 'Sarabun', size: 10, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    // Color special headers
    headerRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } }; // Orange
    headerRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }; // Green

    // 4. Data Rows - all tickets in range
    for (let i = 0; i < rangeTickets.length; i++) {
        const t = rangeTickets[i];
        const isFallen = t.damageType === 'fallen';
        const statusText = `${t.treeType} / ${t.operation || 'อยู่ระหว่างดำเนินการ'}`;

        // Format incident date in Thai
        const incidentDate = new Date(t.date);
        const incidentDateStr = incidentDate.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const row = worksheet.addRow([
            i + 1,
            incidentDateStr,
            t.zoneName + '\n' + t.title,
            '', // Image Placeholder
            `${t.quantity || 1} ต้น`,
            isFallen ? statusText : '',
            !isFallen ? statusText : ''
        ]);

        row.height = 100; // Large height for images
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.font = { name: 'Sarabun', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(7).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Add Image
        if (t.images && t.images.length > 0) {
            try {
                const imgUrl = t.images[0];
                let imageId;

                if (imgUrl.startsWith('data:image/')) {
                    // Handle Base64 Image safely using ExcelJS native support
                    // Extract extension from data URI scheme (e.g. data:image/png;base64,...)
                    const mimeType = imgUrl.split(';')[0].split(':')[1]; // image/png
                    const ext = mimeType.split('/')[1]; // png

                    const validExtensions = ['png', 'jpeg', 'gif'];
                    const finalExt = ext === 'jpg' ? 'jpeg' : (validExtensions.includes(ext) ? ext : 'png');

                    imageId = workbook.addImage({
                        base64: imgUrl,
                        extension: finalExt,
                    });
                } else {
                    // Handle URL Image
                    const response = await fetch(imgUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('image/')) {
                        throw new Error(`Invalid content-type: ${contentType}`);
                    }

                    const buffer = await response.arrayBuffer();

                    // Determine extension from content-type or URL
                    let ext = 'png';
                    if (contentType) {
                        const type = contentType.split('/')[1];
                        if (['jpeg', 'jpg', 'png', 'gif'].includes(type)) {
                            ext = type === 'jpeg' ? 'jpg' : type;
                        }
                    }

                    const validExtensions = ['png', 'jpeg', 'gif'];
                    const finalExt = ext === 'jpg' ? 'jpeg' : (validExtensions.includes(ext) ? ext : 'png');

                    imageId = workbook.addImage({
                        buffer: buffer,
                        extension: finalExt,
                    });
                }

                worksheet.addImage(imageId, {
                    tl: { col: 3.1, row: row.number - 1.1 },
                    ext: { width: 140, height: 110 }
                });
            } catch (e) {
                console.warn('Could not load image for Excel:', e);
            }
        }
    }

    // 5. Summary Row - สรุปรวมในช่วงที่เลือก
    const totalCases = rangeTickets.length;
    const summaryStyle = (cell, colNumber) => {
        if (colNumber > 1) {
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.font = { name: 'Sarabun', size: 11, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
    };

    // Row: สรุปจำนวนต้นไม้
    const treeSumRow = worksheet.addRow(['', '', 'สรุปรวมจำนวนต้นไม้ทั้งสิ้น', '', grandTotalItems + ' ต้น', '', '']);
    worksheet.mergeCells(`B${treeSumRow.number}:D${treeSumRow.number}`);
    treeSumRow.eachCell(summaryStyle);

    // Row: สรุปจำนวนเคส (โค่นล้ม / กิ่งหัก)
    const caseSumRow = worksheet.addRow(['', '', 'สรุปจำนวนเคส', '', totalCases + ' เคส', totalFallen + ' เคส', totalBroken + ' เคส']);
    worksheet.mergeCells(`B${caseSumRow.number}:D${caseSumRow.number}`);
    caseSumRow.eachCell(summaryStyle);
    caseSumRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Light orange
    caseSumRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Light green

    // 6. Accumulated Row - ยอดสะสมตั้งแต่ต้นปีงบประมาณ
    const accTotalItems = accTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
    const accTotalCases = accTickets.length;

    worksheet.addRow([]); // Gap
    const accHeaderRow = worksheet.addRow(['', '', `ยอดสะสมตั้งแต่ ${fiscalStartLabel} ถึงปัจจุบัน`, '', '', '', '']);
    worksheet.mergeCells(`B${accHeaderRow.number}:G${accHeaderRow.number}`);
    accHeaderRow.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.font = { name: 'Sarabun', size: 12, bold: true, color: { argb: 'FF0000FF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } }; // Light blue
        }
    });

    // Accumulated trees
    const accTreeRow = worksheet.addRow(['', '', 'ยอดสะสมต้นไม้', '', accTotalItems + ' ต้น', '', '']);
    worksheet.mergeCells(`B${accTreeRow.number}:D${accTreeRow.number}`);
    accTreeRow.eachCell(summaryStyle);

    // Accumulated cases by type
    const accCaseRow = worksheet.addRow(['', '', 'ยอดสะสมเคส', '', accTotalCases + ' เคส', accFallen + ' เคส', accBroken + ' เคส']);
    worksheet.mergeCells(`B${accCaseRow.number}:D${accCaseRow.number}`);
    accCaseRow.eachCell(summaryStyle);
    accCaseRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    accCaseRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

    // Generate Excel File
    const fileName = `TU_Report_${startDateStr}_to_${endDateStr}.xlsx`;
    const excelBuffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([excelBuffer]), fileName);
}
window.exportToExcel = exportToExcel;

// Add navigation items to export
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.navigateTo = navigateTo;
window.showTicketDetail = showTicketDetail;
window.removeUploadedImage = removeUploadedImage;
