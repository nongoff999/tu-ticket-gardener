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

    // Initialize period if not set
    if (!AppState.dashboardPeriod) {
        AppState.dashboardPeriod = 'DAY';
    }

    // Calculate dynamic stats based on period
    const stats = getStatsForPeriod(AppState.dashboardPeriod, AppState.selectedDate);

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Weekly Calendar -->
        ${Components.weeklyCalendar(AppState.selectedDate)}

        <!-- Stats Grid -->
        <div class="stats-grid" style="margin-top: -1rem;">
            ${Components.statCard(`ทิคเก็ตราย${AppState.dashboardPeriod === 'DAY' ? 'วัน' : AppState.dashboardPeriod === 'WEEK' ? 'สัปดาห์' : 'เดือน'}`, stats.total, 'blue', 'dashboard')}
            ${Components.statCard('ทิคเก็ตใหม่วันนี้', stats.new, 'yellow', 'notification_important')}
            ${Components.statCard('ระหว่างดำเนินการ', stats.inProgress, 'purple', 'settings_suggest')}
            ${Components.statCard('ยังไม่ดำเนินการ', stats.pending, 'pink', 'pending_actions')}
            ${Components.statCard('เสร็จสิ้น', stats.completed, 'green', 'task_alt')}
        </div>

        <!-- Period Tabs -->
        <div class="period-tabs">
            <button class="period-tab ${AppState.dashboardPeriod === 'DAY' ? 'active' : ''}" data-period="DAY">DAY</button>
            <button class="period-tab ${AppState.dashboardPeriod === 'WEEK' ? 'active' : ''}" data-period="WEEK">WEEK</button>
            <button class="period-tab ${AppState.dashboardPeriod === 'MONTH' ? 'active' : ''}" data-period="MONTH">MONTH</button>
        </div>

        <!-- Chart Card -->
        <!-- Chart Card -->
        <div class="chart-card">
            <h2>รายงานจำนวนของทิคเก็ตราย${AppState.dashboardPeriod === 'DAY' ? 'วัน' : AppState.dashboardPeriod === 'WEEK' ? 'สัปดาห์' : 'เดือน'}</h2>
            
            ${generateChartSVG(AppState.dashboardPeriod, AppState.selectedDate)}
            
            <div class="chart-legend" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 1rem;">
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #0ea5e9;"></div>
                    <span class="chart-legend-text">รายวัน/สัปดาห์/เดือน</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #FBBF24;"></div>
                    <span class="chart-legend-text">ใหม่วันนี้</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #a78bfa;"></div>
                    <span class="chart-legend-text">ระหว่างดำเนินการ</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #fb7185;"></div>
                    <span class="chart-legend-text">ยังไม่ดำเนินการ</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #10B981;"></div>
                    <span class="chart-legend-text">เสร็จสิ้น</span>
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

        <!-- Calendar Report Section -->
        <div id="dashboard-calendar-container" style="margin-top: 2rem;"></div>

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
            const newPeriod = this.dataset.period;
            AppState.dashboardPeriod = newPeriod;
            renderDashboard(); // Re-render with new period
        });
    });

    // Add navigation button functionality (now in calendar)
    const prevBtn = content.querySelector('#prev-period');
    const nextBtn = content.querySelector('#next-period');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling if calendar day click is triggered
            navigatePeriod(-1);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigatePeriod(1);
        });
    }

    // Initialize calendar report at bottom
    if (!window.calendarState) {
        window.calendarState = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear()
        };
    }
    renderCalendar();
}

function navigatePeriod(direction) {
    const currentDate = new Date(AppState.selectedDate);

    if (AppState.dashboardPeriod === 'DAY') {
        currentDate.setDate(currentDate.getDate() + direction);
    } else if (AppState.dashboardPeriod === 'WEEK') {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (AppState.dashboardPeriod === 'MONTH') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    }

    AppState.selectedDate = currentDate.toISOString().split('T')[0];
    renderDashboard();
}

function getStatsForPeriod(period, dateStr) {
    const date = new Date(dateStr);
    let tickets = [];

    if (period === 'DAY') {
        // Same day tickets
        tickets = MOCK_DATA.tickets.filter(t => t.date.startsWith(dateStr));
    } else if (period === 'WEEK') {
        // Get week range
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        tickets = MOCK_DATA.tickets.filter(t => {
            const ticketDate = new Date(t.date);
            return ticketDate >= startOfWeek && ticketDate <= endOfWeek;
        });
    } else if (period === 'MONTH') {
        // Same month tickets
        const year = date.getFullYear();
        const month = date.getMonth();

        tickets = MOCK_DATA.tickets.filter(t => {
            const ticketDate = new Date(t.date);
            return ticketDate.getFullYear() === year && ticketDate.getMonth() === month;
        });
    }

    // สำหรับ "ยังไม่ดำเนินการ" = ทิคเก็ตที่ยังไม่มีใครเข้าไปจัดการเลย (status = pending)
    // นับสะสมจากอดีตจนถึงวันนี้
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for inclusive comparison
    const allPendingTickets = MOCK_DATA.tickets.filter(t => {
        const ticketDate = new Date(t.date);
        return ticketDate <= today && t.status === 'pending';
    });

    return {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'inProgress').length,
        pending: allPendingTickets.length, // นับสะสมตลอด
        completed: tickets.filter(t => t.status === 'completed').length
    };
}

function getChartData(period, dateStr) {
    const data = {
        labels: [],
        series: {
            total: [],
            new: [],
            inProgress: [],
            pending: [],
            completed: []
        }
    };

    const date = new Date(dateStr);

    if (period === 'DAY') {
        // Hourly buckets (00, 04, 08, 12, 16, 20, 24)
        for (let i = 0; i <= 24; i += 4) {
            data.labels.push(`${i.toString().padStart(2, '0')}:00`);
            // Mock data for hours - random variance based on time
            // More activity during day (8-16)
            const activityFactor = (i >= 8 && i <= 18) ? 1 : 0.2;
            data.series.total.push(Math.floor(Math.random() * 5 * activityFactor));
            data.series.new.push(Math.floor(Math.random() * 3 * activityFactor));
            data.series.inProgress.push(Math.floor(Math.random() * 4 * activityFactor));
            data.series.pending.push(Math.floor(Math.random() * 2 + 5)); // Base pending load
            data.series.completed.push(Math.floor(Math.random() * 3 * activityFactor));
        }
    } else if (period === 'WEEK') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            data.labels.push(days[i]);

            // Random daily data
            data.series.total.push(Math.floor(Math.random() * 10 + 2));
            data.series.new.push(Math.floor(Math.random() * 5));
            data.series.inProgress.push(Math.floor(Math.random() * 6));
            data.series.pending.push(Math.floor(Math.random() * 5 + 10));
            data.series.completed.push(Math.floor(Math.random() * 4));
        }
    } else if (period === 'MONTH') {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Show labels every 5 days + last day
        for (let i = 1; i <= daysInMonth; i++) {
            if (i === 1 || i % 5 === 0 || i === daysInMonth) {
                data.labels.push(i.toString());
            } else {
                data.labels.push('');
            }

            data.series.total.push(Math.floor(Math.random() * 10 + 2));
            data.series.new.push(Math.floor(Math.random() * 5));
            data.series.inProgress.push(Math.floor(Math.random() * 6));
            data.series.pending.push(Math.floor(Math.random() * 5 + 10));
            data.series.completed.push(Math.floor(Math.random() * 4));
        }
    }

    return data;
}

function generateChartSVG(period, dateStr) {
    const data = getChartData(period, dateStr);
    const height = 150; // ViewBox height
    const width = 300; // ViewBox width (wider for smooth curve)

    // Find max value for scaling
    const allValues = [
        ...data.series.total, ...data.series.new,
        ...data.series.inProgress, ...data.series.pending,
        ...data.series.completed
    ];
    const maxValue = Math.max(...allValues, 10) * 1.2; // Add 20% padding

    const pointsToPath = (values) => {
        if (values.length === 0) return '';

        const stepX = width / (values.length - 1);
        let d = `M 0 ${height - (values[0] / maxValue * height)}`;

        for (let i = 1; i < values.length; i++) {
            const x = i * stepX;
            const y = height - (values[i] / maxValue * height);

            // Straight line
            d += ` L ${x} ${y}`;
        }
        return d;
    };

    const seriesColors = {
        total: '#0ea5e9',
        new: '#FBBF24',
        inProgress: '#a78bfa',
        pending: '#fb7185',
        completed: '#10B981'
    };

    let pathsHTML = '';
    const seriesOrder = ['total', 'new', 'inProgress', 'pending', 'completed']; // Render order

    seriesOrder.forEach(key => {
        pathsHTML += `<path d="${pointsToPath(data.series[key])}" 
                           fill="none" 
                           stroke="${seriesColors[key]}" 
                           stroke-width="1.5" 
                           stroke-linecap="round" 
                           stroke-linejoin="round"
                           opacity="0.9"></path>`;
    });

    // Generate X-axis labels HTML
    let labelsHTML = '';
    data.labels.forEach((label, index) => {
        if (!label) return;
        const x = (index / (data.labels.length - 1)) * 100;
        // Adjust text alignment based on position
        let anchor = 'middle';
        if (index === 0) anchor = 'start';
        if (index === data.labels.length - 1) anchor = 'end';

        labelsHTML += `<text x="${x}%" y="95%" font-size="8" fill="#6b7280" text-anchor="${anchor}">${label}</text>`;
    });

    return `
        <div style="position: relative; height: 14rem; margin-bottom: 0.5rem;">
            <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width: 100%; height: 90%;">
                ${pathsHTML}
            </svg>
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 10%; overflow: visible;">
                ${labelsHTML}
            </svg>
        </div>
    `;
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

            ${(() => {
            if (ticket.locationDetail && ticket.locationDetail.includes('Ticket By Name:')) {
                const parts = ticket.locationDetail.split('Ticket By Name: ')[1].split(' เมื่อ ');
                const name = parts[0];
                const time = parts[1] || '';
                return `
                    <div style="background: linear-gradient(to right, #f0f9ff, #e0f2fe); padding: 1rem; border-radius: 0.75rem; border: 1px solid #bae6fd; display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <span class="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.125rem;">แจ้งโดย</div>
                            <div style="font-weight: 600; color: #0c4a6e; font-size: 1rem;">${name}</div>
                        </div>
                        ${time ? `
                        <div style="width: 1px; height: 24px; background: #bae6fd; margin: 0 0.5rem;"></div>
                        <div>
                            <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.125rem;">เมื่อ</div>
                            <div style="font-weight: 500; color: #0c4a6e; font-size: 0.9rem;">${time}</div>
                        </div>
                        ` : ''}
                    </div>
                    `;
            }
            return '';
        })()}

            <!-- Timeline Section -->
            <!-- Timeline Section (Refactored) -->
            ${renderTimeline(ticket)}

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
                ${ticket.locationDetail && !ticket.locationDetail.includes('Ticket By Name:') ? `
                <div class="detail-info-item full">
                    <span class="detail-info-label">ระบุสถานที่ใกล้เคียง :</span>
                    <span class="detail-info-value">${ticket.locationDetail}</span>
                </div>
                ` : ''}
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
                    <div class="detail-info-value" style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem;">
                        ${ticket.assignees.length > 0 ? ticket.assignees.map(name => `
                            <div style="display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.25rem 0.75rem 0.25rem 0.25rem; border-radius: 2rem;">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=64" alt="${name}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
                                <span style="font-size: 0.9rem; font-weight: 500; color: #334155;">${name}</span>
                            </div>
                        `).join('') : '-'}
                    </div>
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

        <div style="height: 6rem;"></div>
    `;
}

function renderAddTicket() {
    AppState.currentPage = 'add';
    updateActiveNavItem('add');

    document.getElementById('page-title').textContent = 'ADD TICKET';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div style="padding: 0 1rem;">
            <!-- Reporter Card (Top) -->
            <div style="margin-bottom: 1.5rem;">
                <div style="background: linear-gradient(to right, #f0f9ff, #e0f2fe); padding: 1rem; border-radius: 0.75rem; border: 1px solid #bae6fd; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <span class="material-symbols-outlined">person</span>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.125rem;">แจ้งโดย</div>
                        <div style="font-weight: 600; color: #0c4a6e; font-size: 1rem;">${MOCK_DATA.user?.name || 'ผู้ใช้'}</div>
                    </div>
                    <div style="width: 1px; height: 24px; background: #bae6fd; margin: 0 0.5rem;"></div>
                    <div>
                        <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.125rem;">เมื่อ</div>
                        <div style="font-weight: 500; color: #0c4a6e; font-size: 0.9rem;">${new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            <form id="ticket-form">
                <div class="form-group">
                    <label class="form-label">ลำดับความสำคัญ <span class="required">*</span></label>
                    <div class="priority-toggle">
                        <button type="button" class="priority-btn normal active">ไม่เร่งด่วน</button>
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
                    <label class="form-label">สถานที่เกิดเหตุ (โซน) <span class="required">*</span></label>
                    <select id="ticket-zone" class="form-select">
                        <option value="" disabled selected>เลือกโซน</option>
                        ${MOCK_DATA.zones.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group" id="location-detail-group" style="display: none;">
                    <!-- Hidden field removed as we generate it on submit -->
                </div>

                <div class="form-group">
                    <label class="form-label">Ticket Type <span class="required">*</span></label>
                    <div class="damage-type-toggle" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${MOCK_DATA.damageTypes.map((dt, idx) => `
                            <button type="button" class="damage-type-btn ${idx === 0 ? 'active' : ''}" data-type="${dt.id}">
                                ${dt.name}
                            </button>
                        `).join('')}
                    </div>
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

    // Damage type toggle
    const damageTypeBtns = content.querySelectorAll('.damage-type-btn');
    damageTypeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            damageTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Zone selection - Show location detail
    const zoneSelect = content.querySelector('#ticket-zone');
    const locationDetailGroup = content.querySelector('#location-detail-group');
    const locationDetailInput = content.querySelector('#location-detail');

    zoneSelect.addEventListener('change', function () {
        // Zone change logic removed as reporter info is now static at top
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
        const selectedDamageType = content.querySelector('.damage-type-btn.active')?.dataset.type || 'broken';
        const locationDetail = content.querySelector('#location-detail').value || '';

        const errors = [];
        if (!title) errors.push('ชื่อทิคเก็ต');
        if (!zoneId) errors.push('ชื่อสถานที่');
        if (uploadedImages.length === 0) errors.push('รูปภาพ (อย่างน้อย 1 รูป)');

        if (errors.length > 0) {
            showPopup('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน:\n' + errors.join('\n'), 'error');
            return;
        }

        // Generate "Ticket By Name: [user] เมื่อ [date] [time]" format on submit
        const userName = MOCK_DATA.user?.name || 'ผู้ใช้';
        const now = new Date();
        const thaiDate = now.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const fullLocationDetail = `Ticket By Name: ${userName} เมื่อ ${thaiDate} ${time}`;

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
            locationDetail: fullLocationDetail, // Set functionality string here
            treeType: '-',
            damageType: selectedDamageType,
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

        showPopup('บันทึกสำเร็จ', 'อัปเดตข้อมูลทิคเก็ตเรียบร้อยแล้ว', 'success', () => {
            router.navigate('/tickets');
        });
    });
}

function renderTimeline(ticket) {
    // 1. Open Info
    let openerName = MOCK_DATA.user?.name || 'ผู้ใช้';
    if (ticket.locationDetail && ticket.locationDetail.includes('Ticket By Name:')) {
        openerName = ticket.locationDetail.split('Ticket By Name: ')[1].split(' เมื่อ ')[0];
    }

    return `
    <div style="margin: 1.5rem 0; padding: 1rem; background: var(--surface); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
        <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">
            ไทม์ไลน์ความคืบหน้า
        </h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Timeline Item: Open Ticket -->
            <div style="display: flex; gap: 0.75rem; align-items: start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: white;">notification_important</span>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">
                        เปิดทิคเก็ตใหม่โดย ${openerName}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${new Date(ticket.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(ticket.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
            
            ${ticket.startedAt ? ` 
            <!-- Timeline Item: In Progress -->
            <div style="display: flex; gap: 0.75rem; align-items: start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: white;">settings_suggest</span>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">
                        เริ่มดำเนินการ
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        อัพเดตโดย ${ticket.startedBy || MOCK_DATA.user?.name || 'ผู้ใช้'}
                        <br>${new Date(ticket.startedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${ticket.completedAt ? ` 
            <!-- Timeline Item: Completed -->
            <div style="display: flex; gap: 0.75rem; align-items: start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #34d399 0%, #10b981 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: white;">task_alt</span>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">
                        เสร็จสิ้น
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ปิดงานโดย ${ticket.completedBy || MOCK_DATA.user?.name || 'ผู้ใช้'}
                        <br>${new Date(ticket.completedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    `;
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

    // Generate Reporter Card HTML if data exists
    let reporterCardHTML = '';
    if (ticket.locationDetail && ticket.locationDetail.includes('Ticket By Name:')) {
        const parts = ticket.locationDetail.split('Ticket By Name: ')[1].split(' เมื่อ ');
        const name = parts[0];
        const time = parts[1] || '';
        reporterCardHTML = `
            <div style="margin-bottom: 1.5rem;">
                <div style="background: linear-gradient(to right, #f0f9ff, #e0f2fe); padding: 1rem; border-radius: 0.75rem; border: 1px solid #bae6fd; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <span class="material-symbols-outlined">person</span>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.125rem;">แจ้งโดย</div>
                        <div style="font-weight: 600; color: #0c4a6e; font-size: 1rem;">${name}</div>
                    </div>
                    ${time ? `
                    <div style="width: 1px; height: 24px; background: #bae6fd; margin: 0 0.5rem;"></div>
                    <div>
                        <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.125rem;">เมื่อ</div>
                        <div style="font-weight: 500; color: #0c4a6e; font-size: 0.9rem;">${time}</div>
                    </div>
                    ` : ''}
                </div>
            </div>`;
    }

    // Status Stepper Logic
    // Default to 'inProgress' if 'new' (User request: "ตอนแก้ไขให้เปิดมา ที่status ระหว่างดำเนินการ รอไว้เลย")
    const currentStatus = ticket.status === 'new' ? 'inProgress' : ticket.status;

    const isNew = currentStatus === 'new';
    const isPro = currentStatus === 'inProgress';
    const isComp = currentStatus === 'completed';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div style="padding: 0 1rem;">
            ${reporterCardHTML}
            <form id="ticket-form">
                <div class="form-group">
                    <label class="form-label">Ticket Status <span class="required">*</span></label>
                    <div class="status-stepper">
                        <!-- Step 1: New -->
                        <div class="step-item ${isNew ? 'active' : 'passed disabled'}" data-value="new">
                            <div class="step-circle">1</div>
                            <div class="step-label">ทิคเก็ตใหม่</div>
                        </div>
                        <div class="step-line ${isPro || isComp ? 'active' : ''}"></div>
                        
                        <!-- Step 2: In Progress -->
                        <div class="step-item ${isPro ? 'active' : (isComp ? 'passed disabled' : '')}" data-value="inProgress">
                            <div class="step-circle">2</div>
                            <div class="step-label">ระหว่างดำเนินการ</div>
                        </div>
                        <div class="step-line ${isComp ? 'active' : ''}"></div>
                        
                        <!-- Step 3: Completed -->
                        <div class="step-item ${isComp ? 'active' : ''}" data-value="completed">
                            <div class="step-circle">3</div>
                            <div class="step-label">ปิดทิคเก็ต</div>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 0.8rem; color: #64748b; margin-top: -0.5rem; margin-bottom: 1rem;">
                        (สามารถกดเลือกสถานะได้ด้วยตัวเอง)
                    </div>
                    <input type="hidden" id="edit-ticket-status" value="${currentStatus}">
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
            
            ${renderTimeline(ticket)}

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

    // Status Stepper Logic
    const stepper = content.querySelector('.status-stepper');
    const statusInput = content.querySelector('#edit-ticket-status');
    if (stepper) {
        const steps = stepper.querySelectorAll('.step-item');
        const lines = stepper.querySelectorAll('.step-line');

        steps.forEach((step, index) => {
            step.addEventListener('click', function () {
                if (this.classList.contains('disabled')) return;

                const newValue = this.dataset.value;
                statusInput.value = newValue;

                // Re-evaluate visuals based on selection, strictly preserving original 'locked' history
                const originalStatus = ticket.status;

                // User Request: "2 ไป 3 ได้ แต่ไป 1 ไม่ได้นะ มันผ่านไปแล้ว"
                // Logic:
                // If original is New: All enabled.
                // If original is InProgress: New is locked. InProgress <-> Completed enabled.
                // If original is Completed: New & InProgress locked. (Actually, if user edits a Completed ticket, can they go back to InProgress? Usually no, but user said "2 ไป 3 ได้". Maybe they mean during the *current edit* of a NEW ticket?)

                // Wait, if I open a NEW ticket, it auto-jumps to InProgress.
                // So originalStatus = 'new', currentStatus = 'inProgress'.
                // User says: "Can go 2->3, but not 1".
                // So even if original was New, once we are at 'InProgress' (which is default for edit), we shouldn't go back to New?
                // The auto-jump logic set `currentStatus` to `inProgress`.
                // So effectively, for Edit Ticket:
                // - Step 1 (New) is ALWAYS disabled/locked because we are already "working on it".
                // - We can only toggle between 2 (InProgress) and 3 (Completed).

                // Exception: Unless we want to allow reverting a "Just Created" ticket back to New? 
                // User said "มันผ่านไปแล้ว" (It's passed). So Step 1 is history.

                steps.forEach(s => {
                    const val = s.dataset.value;

                    // Lock Step 1 (New) ALWAYS in Edit Mode (since we are auto-jumping to 2)
                    // Lock Step 2 (InProgress) ONLY if original was Completed (Cannot reverse a closed ticket?) 
                    // Wait, user said "2 ไป 3 ได้".
                    // If original was Completed, is it locked?
                    // "ระบบล็อคอัจฉริยะ" from previous turn.

                    let isLocked = false;

                    if (val === 'new') {
                        isLocked = true; // Always lock New in Edit Mode
                    } else if (val === 'inProgress') {
                        // Lock InProgress only if original was Completed?
                        if (originalStatus === 'completed') {
                            isLocked = true;
                        }
                    }

                    let cls = 'step-item';
                    if (isLocked) cls += ' disabled';

                    // Visual state based on CURRENT SELECTION (newValue)
                    if (val === newValue) {
                        cls += ' active';
                    } else if (
                        (newValue === 'inProgress' && val === 'new') ||
                        (newValue === 'completed' && (val === 'new' || val === 'inProgress'))
                    ) {
                        cls += ' passed';
                    }

                    s.className = cls;
                });

                // Update lines
                lines.forEach((l) => l.classList.remove('active'));
                if (newValue === 'inProgress' || newValue === 'completed') {
                    lines[0].classList.add('active');
                }
                if (newValue === 'completed') {
                    lines[1].classList.add('active');
                }
            });
        });
    }

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
        // Gather values using IDs to prevent index mapping issues
        const status = form.querySelector('#edit-ticket-status').value;
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

        // Update Timestamps based on Status Change
        const oldStatus = ticket.status;
        const newStatus = status;
        const nowStr = new Date().toISOString();
        const userName = MOCK_DATA.user?.name || 'ผู้ใช้';

        if (newStatus === 'inProgress' && (oldStatus === 'new' || !ticket.startedAt)) {
            ticket.startedAt = nowStr;
            ticket.startedBy = userName;
        } else if (newStatus === 'completed') {
            if (oldStatus === 'new' || !ticket.startedAt) {
                ticket.startedAt = nowStr; // Assume started same time if jumped
                ticket.startedBy = userName;
            }
            if (oldStatus !== 'completed' || !ticket.completedAt) {
                ticket.completedAt = nowStr;
                ticket.completedBy = userName;
            }
        }

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

    const content = document.getElementById('main-content');

    // Initialize calendar state if not exists
    if (!window.calendarState) {
        window.calendarState = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear()
        };
    }

    renderCalendar();
}

function renderCalendar() {
    const { currentMonth, currentYear } = window.calendarState;
    const content = document.getElementById('main-content');

    // Create ticket count map by date
    const ticketsByDate = {};
    MOCK_DATA.tickets.forEach(t => {
        const dateKey = t.date.split(' ')[0]; // YYYY-MM-DD
        if (!ticketsByDate[dateKey]) {
            ticketsByDate[dateKey] = [];
        }
        ticketsByDate[dateKey].push(t);
    });

    // Get calendar data
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, etc.

    // Thai month names
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    // Generate calendar HTML
    let calendarHTML = `
        <div class="calendar-container" style="background: var(--card-bg); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Calendar Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <button onclick="changeMonth(-1)" class="btn btn-sm" style="padding: 0.5rem 1rem;">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">
                    ${thaiMonths[currentMonth]} ${currentYear + 543}
                </h2>
                <button onclick="changeMonth(1)" class="btn btn-sm" style="padding: 0.5rem 1rem;">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
            
            <!-- Day headers -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; margin-bottom: 0.5rem;">
                <div style="text-align: center; font-weight: 600; color: #ef4444; padding: 0.5rem;">อา</div>
                <div style="text-align: center; font-weight: 600; padding: 0.5rem;">จ</div>
                <div style="text-align: center; font-weight: 600; padding: 0.5rem;">อ</div>
                <div style="text-align: center; font-weight: 600; padding: 0.5rem;">พ</div>
                <div style="text-align: center; font-weight: 600; padding: 0.5rem;">พฤ</div>
                <div style="text-align: center; font-weight: 600; padding: 0.5rem;">ศ</div>
                <div style="text-align: center; font-weight: 600; color: #3b82f6; padding: 0.5rem;">ส</div>
            </div>
            
            <!-- Calendar days -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">
    `;

    // Empty cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarHTML += `<div style="aspect-ratio: 1; min-height: 80px;"></div>`;
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const ticketsOnDay = ticketsByDate[dateKey] || [];
        const hasData = ticketsOnDay.length > 0;
        const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

        let dayStyle = `
            aspect-ratio: 1;
            min-height: 80px;
            border: 2px solid ${isToday ? 'var(--primary)' : '#e5e7eb'};
            border-radius: 0.5rem;
            padding: 0.5rem;
            background: ${hasData ? 'linear-gradient(135deg, #dbeafe 0%, #fff 100%)' : 'var(--surface)'};
            cursor: ${hasData ? 'pointer' : 'default'};
            transition: all 0.2s;
            position: relative;
        `;

        let dayContent = `
            <div style="font-weight: ${isToday ? 'bold' : '500'}; 
                        color: ${isToday ? 'var(--primary)' : 'var(--text-primary)'}; 
                        margin-bottom: 0.25rem;">
                ${day}
            </div>
        `;

        if (hasData) {
            const totalTrees = ticketsOnDay.reduce((sum, t) => sum + (t.quantity || 1), 0);
            const fallenCount = ticketsOnDay.filter(t => t.damageType === 'fallen').length;

            dayContent += `
                <div style="font-size: 0.7rem; color: var(--primary); font-weight: 600; margin-bottom: 0.25rem;">
                    ${ticketsOnDay.length} เคส
                </div>
                <div style="font-size: 0.65rem; color: var(--text-secondary);">
                    ${totalTrees} ต้น
                </div>
                ${fallenCount > 0 ? `<div style="font-size: 0.65rem; color: #f59e0b;">⚠ ${fallenCount} ล้ม</div>` : ''}
            `;
        }

        const clickHandler = hasData ? `onclick="downloadDailyReport('${dateKey}')"` : '';
        const hoverStyle = hasData ? 'onmouseover="this.style.transform=\'scale(1.05)\'; this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.15)\';" onmouseout="this.style.transform=\'scale(1)\'; this.style.boxShadow=\'none\';"' : '';

        calendarHTML += `
            <div style="${dayStyle}" ${clickHandler} ${hoverStyle}>
                ${dayContent}
            </div>
        `;
    }

    calendarHTML += `
            </div>
        </div>
        
        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--primary-light); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
            <div style="display: flex; align-items: start; gap: 0.75rem;">
                <span class="material-symbols-outlined" style="color: var(--primary); font-size: 1.25rem;">info</span>
                <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6;">
                    <strong style="color: var(--primary);">คลิกที่วันที่มีข้อมูล</strong> เพื่อดาวน์โหลดรายงาน Excel ของวันนั้น<br>
                    • สีน้ำเงิน = มีข้อมูลวันนั้น<br>
                    • ตัวเลข = จำนวนเคส / จำนวนต้นไม้<br>
                    • ⚠ = มีต้นไม้โค่นล้ม
                </div>
            </div>
        </div>
    `;

    const dashboardContainer = document.getElementById('dashboard-calendar-container');
    if (dashboardContainer) {
        dashboardContainer.innerHTML = calendarHTML;
    } else if (AppState.currentPage === 'report-detail') {
        content.innerHTML = calendarHTML;
    }
}

// Month navigation
function changeMonth(delta) {
    const { currentMonth, currentYear } = window.calendarState;

    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }

    window.calendarState.currentMonth = newMonth;
    window.calendarState.currentYear = newYear;

    renderCalendar();
}
window.changeMonth = changeMonth;



// Download report for a specific day
async function downloadDailyReport(dateStr) {
    const date = new Date(dateStr);

    // Format dates for headers
    const thaiDate = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const today = new Date();
    const todayThaiDate = today.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Filter tickets for this specific day
    const dayTickets = MOCK_DATA.tickets.filter(t => t.date.startsWith(dateStr));

    if (dayTickets.length === 0) {
        alert('ไม่พบข้อมูลในวันนี้');
        return;
    }

    // Calculate statistics
    const totalFallen = dayTickets.filter(t => t.damageType === 'fallen').length;
    const totalBroken = dayTickets.filter(t => t.damageType === 'broken' || t.damageType === 'tilted').length;
    const grandTotalItems = dayTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`รายงาน ${thaiDate}`);

    // Setup worksheet
    worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1
    };

    // Column widths
    worksheet.columns = [
        { width: 5 },   // ลำดับ
        { width: 18 },  // วันที่เกิดเหตุ
        { width: 30 },  // สถานที่
        { width: 20 },  // รูปภาพ
        { width: 10 },  // จำนวน
        { width: 25 },  // ต้นไม้/โค่นล้ม
        { width: 25 }   // กิ่งหัก/เอน
    ];

    // Header Row 1: วันที่
    const headerRow1 = worksheet.addRow(['', thaiDate, '', '', '', '', '']);
    worksheet.mergeCells('B1:G1');
    headerRow1.getCell(2).font = { name: 'Sarabun', size: 16, bold: true };
    headerRow1.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow1.height = 25;

    // Header Row 2: วันที่จัดทำ
    const headerRow2 = worksheet.addRow(['', `วันที่จัดทำรายงาน: ${todayThaiDate}`, '', '', '', '', '']);
    worksheet.mergeCells('B2:G2');
    headerRow2.getCell(2).font = { name: 'Sarabun', size: 11 };
    headerRow2.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    // Header Row 3: องค์กร
    const headerRow3 = worksheet.addRow(['', 'สำนักอาคารและสถานที่ มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต', '', '', '', '', '']);
    worksheet.mergeCells('B3:G3');
    headerRow3.getCell(2).font = { name: 'Sarabun', size: 12, bold: true };
    headerRow3.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Gap

    // Table header
    const tableHeader = worksheet.addRow(['ลำดับ', 'วันที่เกิดเหตุ', 'สถานที่เกิดเหตุ', 'รูปภาพ', 'จำนวน', 'ชนิดต้นไม้และสถานะ\nโค่นล้ม', 'กิ่งหัก/ฉีก/เอน']);
    tableHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.font = { name: 'Sarabun', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    tableHeader.height = 40;

    // Data rows
    for (let i = 0; i < dayTickets.length; i++) {
        const t = dayTickets[i];
        const qty = t.quantity || 1;
        const fallen = t.damageType === 'fallen' ? 'โค่นล้ม' : '';
        const broken = (t.damageType === 'broken' || t.damageType === 'tilted') ? (t.damageType === 'broken' ? 'กิ่งหัก' : 'เอียง') : '';

        const ticketDate = new Date(t.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

        const row = worksheet.addRow([
            i + 1,
            ticketDate,
            t.zoneName || t.zone,
            '',
            qty + ' ต้น',
            `${t.treeType}\n${fallen}`,
            broken
        ]);

        row.height = 90;
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.font = { name: 'Sarabun', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        // Add image if exists
        if (t.images && t.images.length > 0) {
            try {
                const imgUrl = t.images[0];
                let imageId;

                if (imgUrl.startsWith('data:image/')) {
                    const mimeType = imgUrl.split(';')[0].split(':')[1];
                    const ext = mimeType.split('/')[1];
                    const validExtensions = ['png', 'jpeg', 'gif'];
                    const finalExt = ext === 'jpg' ? 'jpeg' : (validExtensions.includes(ext) ? ext : 'png');
                    const base64Data = imgUrl.split(',')[1];

                    imageId = workbook.addImage({
                        base64: base64Data,
                        extension: finalExt,
                    });
                } else {
                    const response = await fetch(imgUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('image/')) {
                        throw new Error(`Invalid content-type: ${contentType}`);
                    }

                    const buffer = await response.arrayBuffer();
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

    // Summary row
    const totalCases = dayTickets.length;
    const summaryStyle = (cell, colNumber) => {
        if (colNumber > 0) {
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.font = { name: 'Sarabun', size: 11, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
    };

    const treeSumRow = worksheet.addRow(['', 'สรุปรวมจำนวนต้นไม้ทั้งสิ้น', '', '', grandTotalItems + ' ต้น', '', '']);
    worksheet.mergeCells(`B${treeSumRow.number}:D${treeSumRow.number}`);
    treeSumRow.eachCell(summaryStyle);

    const caseSumRow = worksheet.addRow(['', 'สรุปจำนวนเคส', '', '', totalCases + ' เคส', totalFallen + ' เคส', totalBroken + ' เคส']);
    worksheet.mergeCells(`B${caseSumRow.number}:D${caseSumRow.number}`);
    caseSumRow.eachCell(summaryStyle);
    caseSumRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    caseSumRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

    // Generate Excel File
    const fileName = `TU_Report_${dateStr}.xlsx`;
    const excelBuffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([excelBuffer]), fileName);
}
window.downloadDailyReport = downloadDailyReport;

// Add navigation items to export
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.navigateTo = navigateTo;
window.showTicketDetail = showTicketDetail;
window.removeUploadedImage = removeUploadedImage;
