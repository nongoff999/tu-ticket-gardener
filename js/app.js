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

// Check for Update and Reload
async function checkForUpdate() {
    console.log('🔄 Checking for updates...');

    // Show feedback
    showPopup('กำลังอัปเดต', 'ระบบกำลังล้างแคชและดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์...', 'info');

    setTimeout(async () => {
        try {
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
        } catch (e) {
            console.error('Update cleanup failed:', e);
        }

        // Reload
        window.location.reload(true);
    }, 1000);
}

window.checkForUpdate = checkForUpdate;
window.forceUpdate = checkForUpdate; // Alias for backward compatibility

// Router Setup
// Auth & Login Functions (AD Simulation)
function renderLogin() {
    AppState.currentPage = 'login';
    document.body.classList.add('login-mode');
    document.title = 'Sign In - TU Ticket Gardener';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="login-card">
            <div class="login-brand-header">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Emblem_of_Thammasat_University.svg/1200px-Emblem_of_Thammasat_University.svg.png" alt="TU Logo" class="login-logo" style="width: 50px; height: 50px; margin-bottom: 0;">
                 <div style="display: flex; align-items: baseline; gap: 4px;">
                     <span class="brand-tu">TU</span>
                     <span class="brand-separator">:</span>
                     <span class="brand-ticket">TICKET</span>
                 </div>
            </div>
            
            <h2 class="login-title">Log in</h2>
            
            <form class="login-form" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <input type="text" class="login-input" placeholder="User name or email *" required autofocus>
                </div>
                <div class="form-group">
                    <input type="password" class="login-input" placeholder="Password *" required>
                </div>
                
                <div class="login-options">
                    <label class="remember-me">
                        <input type="checkbox" class="remember-checkbox">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="forgot-link" onclick="showPopup('ยังไม่เปิดให้บริการ', 'ระบบกู้คืนรหัสผ่านกำลังพัฒนา', 'info'); return false;">Forgot password?</a>
                </div>
                
                <button type="submit" class="login-btn">Log in</button>
            </form>
            
            <div class="login-footer">
                Not a member yet ? <a href="#" onclick="showPopup('ยังไม่เปิดให้บริการ', 'ระบบลงทะเบียนใหม่กำลังพัฒนา', 'info'); return false;">Email activation</a>
            </div>
        </div>
    `;
}

window.handleLogin = function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');

    // Simulate Loading
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> กำลังตรวจสอบ...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    setTimeout(() => {
        const usernameInput = e.target.querySelector('input[type="text"]');
        const username = usernameInput.value.split('@')[0];

        // Mock User Update
        if (MOCK_DATA.user) {
            MOCK_DATA.user.name = username || "เจ้าหน้าที่สวน";
            MOCK_DATA.user.role = "Staff (AD Verified)";
        }

        localStorage.setItem('isLoggedIn', 'true');
        document.body.classList.remove('login-mode');

        router.navigate('/dashboard');
    }, 1500);
};

window.logout = function () {
    showPopup('ออกจากระบบ', 'คุณต้องการออกจากระบบหรือไม่?', 'confirm', () => {
        localStorage.removeItem('isLoggedIn');
        document.body.classList.add('login-mode'); // Prevent flash
        router.navigate('/login');
    });
};

// Router Setup
function initRouter() {
    // Auth Guard
    const withAuth = (handler) => (params) => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            router.navigate('/login');
            return;
        }
        document.body.classList.remove('login-mode');
        handler(params);
    };

    // Helper to resolve function reference if string or window property
    const reportDetailHandler = (typeof renderReportDetail !== 'undefined') ? renderReportDetail : (window.openReportDetail || (() => console.error('Report Detail handler missing')));

    router
        .register('/login', renderLogin)
        .register('/dashboard', withAuth(renderDashboard))
        .register('/monitor', withAuth(renderMonitor))
        .register('/tickets', withAuth(renderTicketList))
        .register('/ticket', withAuth(renderTicketDetail))
        .register('/add', withAuth(renderAddTicket))
        .register('/add-select', withAuth(renderCategorySelection))
        .register('/edit', withAuth(renderEditTicket))
        .register('/reports', withAuth(renderReportList))
        .register('/report-detail', withAuth(reportDetailHandler));

    // Initial Route Check
    if (!location.hash || location.hash === '#/') {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            router.navigate('/dashboard');
        } else {
            router.navigate('/login');
        }
    }
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

function updateHeaderNav(isSubPage = false) {
    const menuBtn = document.getElementById('menu-btn');
    const backBtn = document.getElementById('back-btn');

    if (!menuBtn || !backBtn) return;

    if (isSubPage) {
        // Show Back button, Hide Menu button
        menuBtn.style.display = 'none';
        backBtn.style.display = 'flex';
    } else {
        // Show Menu button, Hide Back button
        menuBtn.style.display = 'flex';
        backBtn.style.display = 'none';
    }
}

// Global Popup Functions
// Global Popup Functions
function showPopup(title, message, type = 'info', onConfirm = null) {
    const popup = document.getElementById('custom-popup');
    const iconContainer = document.getElementById('popup-icon');
    const iconSpan = iconContainer.querySelector('span');
    const titleEl = document.getElementById('popup-title');
    const messageEl = document.getElementById('popup-message');

    // Buttons (Updated IDs from index.html change)
    const confirmBtn = document.getElementById('popup-confirm-btn');
    const cancelBtn = document.getElementById('popup-cancel-btn');

    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Set icon and style
    iconContainer.className = 'popup-icon ' + (type === 'confirm' ? 'warning' : type);

    if (type === 'success') iconSpan.textContent = 'check_circle';
    else if (type === 'error') iconSpan.textContent = 'error';
    else if (type === 'confirm') iconSpan.textContent = 'help';
    else iconSpan.textContent = 'info';

    // Toggle Cancel Button
    if (type === 'confirm') {
        cancelBtn.style.display = 'block';
        confirmBtn.textContent = 'ยืนยัน';
        confirmBtn.className = 'popup-btn primary'; // You might want danger if delete?
        // If it's a delete confirmation, usually red. But let's keep it primary for now or detect keyword?
        if (title.includes('ลบ')) {
            confirmBtn.style.backgroundColor = '#ef4444';
        } else {
            confirmBtn.style.backgroundColor = ''; // Reset to CSS default (primary color)
        }
    } else {
        cancelBtn.style.display = 'none';
        confirmBtn.textContent = 'ตกลง';
        confirmBtn.style.backgroundColor = '';
    }

    // Show
    popup.classList.add('active');

    // Handle button click
    confirmBtn.onclick = function () {
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
    updateHeaderNav(false); // Dashboard is main page
    console.log('------------------------------------------');
    console.log('🏠 กำลังแสดงผล Dashboard (หน้าหลัก)...');
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
        <!-- Period Calendar -->
        ${AppState.dashboardPeriod === 'CUSTOM'
            ? (() => {
                if (!AppState.customStartDate) AppState.customStartDate = new Date().toISOString().split('T')[0];
                if (!AppState.customEndDate) AppState.customEndDate = new Date().toISOString().split('T')[0];
                return `<div class="custom-date-range" style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem; width: 100%; padding: 0.25rem 0;">
                    <input type="date" value="${AppState.customStartDate}" 
                           onchange="AppState.customStartDate=this.value"
                           style="flex: 1; min-width: 0; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; text-align: center; font-family: inherit; font-size: 0.9rem; color:#334155; outline: none; background: white;">
                    
                    <input type="date" value="${AppState.customEndDate}" 
                           onchange="AppState.customEndDate=this.value"
                           style="flex: 1; min-width: 0; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; text-align: center; font-family: inherit; font-size: 0.9rem; color:#334155; outline: none; background: white;">
                           
                    <button onclick="renderDashboard()" style="padding: 0.5rem 1rem; background: #e2e8f0; border: none; border-radius: 0.375rem; color: #334155; font-weight: 600; font-size: 0.9rem; white-space: nowrap;">ตกลง</button>
                </div>`;
            })()
            : Components.periodCalendar(AppState.selectedDate, AppState.dashboardPeriod)
        }

        <!-- Stats Grid -->
        <div class="stats-grid" style="margin-top: -1rem;">
            ${Components.statCard(`ทิคเก็ตรวม (${AppState.dashboardPeriod === 'WEEK' ? 'สัปดาห์' : AppState.dashboardPeriod === 'MONTH' ? 'เดือน' : 'วัน'})`, stats.total, 'blue', 'dashboard')}
            ${Components.statCard('ทิคเก็ตใหม่', stats.new, 'yellow', 'notification_important')}
            ${Components.statCard('ระหว่างดำเนินการ', stats.inProgress, 'purple', 'settings_suggest')}
            ${Components.statCard('ยังไม่ดำเนินการ', stats.pending, 'pink', 'pending_actions')}
            ${Components.statCard('เสร็จสิ้น', stats.completed, 'green', 'task_alt')}
        </div>

        <!-- Period Tabs -->
        <div class="period-tabs">
            <button class="period-tab ${AppState.dashboardPeriod === 'DAY' ? 'active' : ''}" data-period="DAY">วัน</button>
            <button class="period-tab ${AppState.dashboardPeriod === 'WEEK' ? 'active' : ''}" data-period="WEEK">สัปดาห์</button>
            <button class="period-tab ${AppState.dashboardPeriod === 'MONTH' ? 'active' : ''}" data-period="MONTH">เดือน</button>
            <button class="period-tab ${AppState.dashboardPeriod === 'CUSTOM' ? 'active' : ''}" data-period="CUSTOM">กำหนดเอง</button>
        </div>

        <!-- Chart Card -->
        <div class="chart-card">
            <h2>รายงานจำนวนของทิคเก็ตราย${AppState.dashboardPeriod === 'WEEK' ? 'สัปดาห์' : AppState.dashboardPeriod === 'MONTH' ? 'เดือน' : 'วัน'}</h2>
            
            ${generateChartSVG(AppState.dashboardPeriod, AppState.selectedDate)}
            
            <div class="chart-legend" style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #fb7185;"></div>
                    <span class="chart-legend-text">ยังไม่ดำเนินการ</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #a78bfa;"></div>
                    <span class="chart-legend-text">ระหว่างดำเนินการ</span>
                </div>
                <div class="chart-legend-item">
                    <div class="chart-legend-color" style="background: #10B981;"></div>
                    <span class="chart-legend-text">เสร็จสิ้น</span>
                </div>
            </div>
        </div>

        <!-- Donut Chart Card -->
        <!-- Donut Chart Card (Dynamic) -->
        ${renderFallenTreesSection(AppState.dashboardPeriod, AppState.selectedDate)}

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
    } else if (period === 'CUSTOM') {
        const start = new Date(AppState.customStartDate || new Date());
        start.setHours(0, 0, 0, 0);
        const end = new Date(AppState.customEndDate || new Date());
        end.setHours(23, 59, 59, 999);
        tickets = MOCK_DATA.tickets.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });
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
    const tickets = MOCK_DATA.tickets;

    // Helper to init array with zeros
    const initArray = (len) => Array(len).fill(0);

    if (period === 'DAY' || period === 'CUSTOM') {
        // Hourly buckets: 00:00, 04:00, ..., 20:00, 24:00 (End of day)
        // 7 points: 0, 4, 8, 12, 16, 20, 24
        const buckets = [0, 4, 8, 12, 16, 20, 24];
        data.labels = buckets.map(h => `${h.toString().padStart(2, '0')}:00`);

        const len = buckets.length;
        data.series.new = initArray(len);
        data.series.pending = initArray(len);
        data.series.inProgress = initArray(len);
        data.series.completed = initArray(len);

        // Filter tickets for this day
        const dayTickets = tickets.filter(t => t.date.startsWith(dateStr));

        dayTickets.forEach(t => {
            const h = new Date(t.date).getHours();
            // Find closest bucket index (floor)
            // 0-3 -> idx 0 (00:00)
            // 4-7 -> idx 1 (04:00)
            const idx = Math.floor(h / 4);

            if (t.status === 'new') data.series.new[idx]++;
            else if (t.status === 'pending') data.series.pending[idx]++;
            else if (t.status === 'inProgress') data.series.inProgress[idx]++;
            else if (t.status === 'completed') data.series.completed[idx]++;
        });

        // "Pending" line in chart usually represents "Yet to do". Combine New + Pending for visual simplicity?
        // Or keep distinct? The User requested "Pending (Red), InProgress (Purple), Completed (Green)".
        // So let's map: Red Line = (New + Pending).
        for (let i = 0; i < len; i++) {
            data.series.pending[i] += data.series.new[i];
        }

    } else if (period === 'WEEK') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
        data.labels = days;

        const len = 7;
        data.series.new = initArray(len);
        data.series.pending = initArray(len);
        data.series.inProgress = initArray(len);
        data.series.completed = initArray(len);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const weekTickets = tickets.filter(t => {
            const d = new Date(t.date);
            return d >= startOfWeek && d < endOfWeek;
        });

        weekTickets.forEach(t => {
            const d = new Date(t.date);
            const dayIdx = d.getDay(); // 0-6

            if (t.status === 'new') data.series.new[dayIdx]++;
            else if (t.status === 'pending') data.series.pending[dayIdx]++;
            else if (t.status === 'inProgress') data.series.inProgress[dayIdx]++;
            else if (t.status === 'completed') data.series.completed[dayIdx]++;
        });

        // Combine New into Pending for Chart (Red Line)
        for (let i = 0; i < len; i++) {
            data.series.pending[i] += data.series.new[i];
        }

    } else if (period === 'MONTH') {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Buckets: Days 1..DaysInMonth
        const len = daysInMonth;
        // Labels: Show every 5th day
        for (let i = 1; i <= daysInMonth; i++) {
            if (i === 1 || i % 5 === 0 || i === daysInMonth) data.labels.push(i.toString());
            else data.labels.push('');
        }

        data.series.new = initArray(len);
        data.series.pending = initArray(len);
        data.series.inProgress = initArray(len);
        data.series.completed = initArray(len);

        const monthTickets = tickets.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        monthTickets.forEach(t => {
            const d = new Date(t.date);
            const dayIdx = d.getDate() - 1; // 0-indexed (Day 1 -> idx 0)

            if (t.status === 'new') data.series.new[dayIdx]++;
            else if (t.status === 'pending') data.series.pending[dayIdx]++;
            else if (t.status === 'inProgress') data.series.inProgress[dayIdx]++;
            else if (t.status === 'completed') data.series.completed[dayIdx]++;
        });

        // Combine New into Pending for Chart (Red Line)
        for (let i = 0; i < len; i++) {
            data.series.pending[i] += data.series.new[i];
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

        // 1. Convert values to coordinate points
        const points = values.map((v, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = height - (v / maxValue * height); // Invert Y because SVG 0 is top
            return [x, y];
        });

        // 2. Helper to calculate control points for Bezier curve
        const controlPoint = (current, previous, next, reverse) => {
            const p = previous || current;
            const n = next || current;
            const smoothing = 0.2; // 0 (sharp) to 1 (very round)

            const oX = n[0] - p[0];
            const oY = n[1] - p[1];
            const length = Math.sqrt(Math.pow(oX, 2) + Math.pow(oY, 2)) * smoothing;
            const angle = Math.atan2(oY, oX) + (reverse ? Math.PI : 0);

            const x = current[0] + Math.cos(angle) * length;
            const y = current[1] + Math.sin(angle) * length;
            return [x, y];
        };

        // 3. Generate Path logic
        return points.reduce((acc, point, i, a) => {
            if (i === 0) return `M ${point[0]},${point[1]}`;

            const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point, false);
            const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);

            return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
        }, '');
    };

    const seriesColors = {
        total: '#0ea5e9',
        new: '#FBBF24',
        inProgress: '#a78bfa',
        pending: '#fb7185',
        completed: '#10B981'
    };

    let pathsHTML = '';
    const seriesOrder = ['inProgress', 'pending', 'completed']; // Render order: Purple, Red, Green

    // Draw lines
    seriesOrder.forEach(key => {
        pathsHTML += `<path d="${pointsToPath(data.series[key])}" 
                           fill="none" 
                           stroke="${seriesColors[key]}" 
                           stroke-width="4" 
                           stroke-linecap="round" 
                           stroke-linejoin="round"
                           opacity="0.9"></path>`;
    });

    // Generate X-axis labels HTML
    let labelsHTML = '';

    // Add Axis Line
    const axisLine = `<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#e5e7eb" stroke-width="2" />`;

    data.labels.forEach((label, index) => {
        if (!label) return;
        const x = (index / (data.labels.length - 1)) * 300; // Use 300 width to match chart
        // Adjust text alignment based on position
        let anchor = 'middle';
        if (index === 0) anchor = 'start';
        if (index === data.labels.length - 1) anchor = 'end';

        labelsHTML += `<text x="${x}" y="15" font-size="10" fill="#4B5563" text-anchor="${anchor}">${label}</text>`;
    });

    return `
        <div style="position: relative; height: 16rem; margin-bottom: 0.5rem;">
            <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width: 100%; height: 85%; display: block; overflow: visible;">
                ${axisLine}
                ${pathsHTML}
            </svg>
            <div style="height: 15%; width: 100%; margin-top: 0.5rem;">
                <!-- Updated viewBox to 300 width -->
                <svg viewBox="0 0 300 20" style="width: 100%; height: 100%; overflow: visible; display: block;">
                    ${labelsHTML}
                </svg>
            </div>
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
    updateHeaderNav(true);
    console.log('------------------------------------------');
    console.log('👀 กำลังแสดงผล Garden Monitor (ติดตามงาน)...');
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
    updateHeaderNav(true);
    console.log('------------------------------------------');
    console.log('📋 กำลังแสดงผล Ticket List (รายการทั้งหมด)...');
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
    updateHeaderNav(true);
    console.log('------------------------------------------');
    const ticketId = params[0] ? parseInt(params[0]) : null;
    console.log(`🎫 กำลังเปิดดูรายละเอียดทิคเก็ต ID: ${ticketId}`);
    const ticket = MOCK_DATA.tickets.find(t => t.id === ticketId);

    if (!ticket) {
        router.navigate('/tickets');
        return;
    }

    console.log('✅ พบข้อมูล:', ticket.title);
    console.log(`- สถานะ: ${ticket.status}`);
    console.log(`- ความเร่งด่วน: ${ticket.priority}`);
    console.log(`- ผู้รับผิดชอบ: ${ticket.assignees.join(', ') || '-'}`);

    AppState.selectedTicket = ticket;

    document.getElementById('page-title').textContent = 'TICKET DETAILS';

    const statusStep = ticket.status === 'new' ? 1 :
        ticket.status === 'inProgress' ? 2 : 3;

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Image Carousel -->
        <div class="detail-image">
            <div class="detail-image-scroll" id="detail-image-scroll">
                ${ticket.images.map(img => `<img src="${img}" alt="${ticket.title}">`).join('')}
            </div>
            <div class="detail-dots">
                ${ticket.images.map((_, i) => `<div class="detail-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
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
                    <span class="detail-info-value">${getDamageTypeName(ticket.damageType)}</span>
                </div>
                ${ticket.lat && ticket.lng ? `
                <div class="detail-info-item full" style="margin-top: 0.5rem; background: #f8fafc; padding: 0.75rem; border-radius: 0.5rem; border: 1px dashed #e2e8f0;">
                    <span class="detail-info-label">พิกัด GPS :</span>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                        <span class="detail-info-value" style="font-family: monospace; font-size: 0.85rem;">${ticket.lat}, ${ticket.lng}</span>
                        <a href="https://www.google.com/maps?q=${ticket.lat},${ticket.lng}" target="_blank" class="btn" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; background: #34a853; color: white; display: flex; align-items: center; gap: 0.25rem;">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">map</span>
                            ดูบนแผนที่
                        </a>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="detail-description">
                <span class="detail-info-label">Ticket Description :</span>
                <p style="margin-top: 0.5rem;">${ticket.description}</p>
            </div>

            <div class="detail-info-grid" style="margin-top: 1.5rem;">
                ${ticket.operation && ticket.operation !== '-' ? `
                <div class="detail-info-item">
                    <span class="detail-info-label">การดำเนินงาน :</span>
                    <span class="detail-info-value">${ticket.operation}</span>
                </div>
                ` : ''}
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
                ${ticket.treeType && ticket.treeType !== '-' ? `
                <div class="detail-info-item">
                    <span class="detail-info-label">ชนิดพันธุ์ไม้ :</span>
                    <span class="detail-info-value">${ticket.treeType}</span>
                </div>
                ` : ''}
                ${ticket.circumference && ticket.circumference != 0 ? `
                <div class="detail-info-item">
                    <span class="detail-info-label">เส้นรอบวง :</span>
                    <span class="detail-info-value">${ticket.circumference} นิ้ว</span>
                </div>
                ` : ''}
                ${ticket.assignees && ticket.assignees.length > 0 ? `
                <div class="detail-info-item full">
                    <span class="detail-info-label">ผู้รับผิดชอบ :</span>
                    <div class="detail-info-value" style="margin-top: 0.5rem;">
                        ${Components.renderAssignees(ticket.assignees, 'large')}
                    </div>
                </div>
                ` : ''}
                ${ticket.notes ? `
                <div class="detail-info-item full">
                    <span class="detail-info-label">หมายเหตุ :</span>
                    <span class="detail-info-value">${ticket.notes}</span>
                </div>
                ` : ''}
            </div>

            <div style="margin-top: 1.5rem;">
                ${renderTimeline(ticket)}
            </div>

        <!-- Sticky Footer for Edit Button -->
        <!-- Sticky Footer for Actions -->
        <div class="sticky-footer" style="display: flex; gap: 0.75rem;">
            <button class="btn" onclick="deleteTicket(${ticket.id})" style="width: auto; height: 3.5rem; border-radius: 1rem; font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #fee2e2; color: #ef4444; flex: 0 0 auto; padding: 0 1.25rem;">
                <span class="material-symbols-outlined">delete</span>
            </button>
            <button class="btn btn-primary" onclick="router.navigate('/edit/${ticket.id}')" style="flex: 1; height: 3.5rem; border-radius: 1rem; font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <span class="material-symbols-outlined">edit_note</span>
                แก้ไขข้อมูลทิคเก็ต
            </button>
        </div>

        <div style="height: 6rem;"></div>
    `;

    // Add scroll listener for dots
    const scroller = document.getElementById('detail-image-scroll');
    const dots = document.querySelectorAll('.detail-dot');

    if (scroller && dots.length > 0) {
        scroller.addEventListener('scroll', () => {
            const index = Math.round(scroller.scrollLeft / scroller.offsetWidth);
            dots.forEach((dot, i) => {
                if (i === index) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        });

        // Add click listener for dots
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                scroller.scrollTo({
                    left: scroller.offsetWidth * i,
                    behavior: 'smooth'
                });
            });
        });

        // Auto-slide logic
        let autoSlideTimer = setInterval(() => {
            if (!scroller.isConnected) {
                clearInterval(autoSlideTimer);
                return;
            }
            const currentIndex = Math.round(scroller.scrollLeft / scroller.offsetWidth);
            const nextIndex = (currentIndex + 1) % dots.length;

            if (dots.length > 1) {
                scroller.scrollTo({
                    left: scroller.offsetWidth * nextIndex,
                    behavior: 'smooth'
                });
            }
        }, 4000);

        // Stop auto-slide on interaction
        scroller.addEventListener('touchstart', () => clearInterval(autoSlideTimer), { passive: true });
        dots.forEach(dot => dot.addEventListener('click', () => clearInterval(autoSlideTimer)));
    }
}

function renderAddTicket() {
    updateHeaderNav(true);
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
                    <label class="form-label">โซนพื้นที่ <span class="required">*</span></label>
                    <select id="ticket-zone" class="form-select">
                        <option value="" disabled selected>เลือกโซน</option>
                        ${MOCK_DATA.zones.map(z => `<option value="${z.id}">${z.name.split(' (')[0]}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">สถานที่เกิดเหตุ (พิมพ์ระบุ) <span class="required">*</span></label>
                    <input type="text" id="ticket-location-name" class="form-input" placeholder="เช่น หน้าตึกคณะ, ใกล้เสาไฟ, ข้างโรงอาหาร...">
                </div>

                <div class="form-group">
                    <label class="form-label">พิกัดสถานที่ (GPS)</label>
                    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                        <button type="button" id="get-location-btn" class="btn" style="width: auto; background: white; border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.9rem;">
                            <span class="material-symbols-outlined" style="font-size: 1.25rem;">my_location</span>
                            บันทึกพิกัด GPS
                        </button>
                        <input type="text" id="location-coords-display" class="form-input" style="flex: 1; min-width: 180px; font-family: monospace; background: #f1f5f9; cursor: not-allowed; font-size: 0.8rem; height: 2.5rem; padding: 0 0.75rem;" readonly placeholder="(ยังไม่ได้บันทึก)">
                        <div id="map-link-container" style="display: flex; align-items: center;"></div>
                    </div>
                    <input type="hidden" id="ticket-lat">
                    <input type="hidden" id="ticket-lng">
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

                <div class="sticky-footer">
                    <button type="submit" class="btn btn-primary" style="width: 100%; height: 3.5rem; border-radius: 1rem; font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined">save</span>
                        บันทึกทิคเก็ต
                    </button>
                </div>
            </form>
            <div style="height: 6rem;"></div>
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

    // GPS Location Functionality
    const getLocationBtn = content.querySelector('#get-location-btn');
    const coordsDisplay = content.querySelector('#location-coords-display');
    const latInput = content.querySelector('#ticket-lat');
    const lngInput = content.querySelector('#ticket-lng');

    getLocationBtn.addEventListener('click', function () {
        this.disabled = true;
        this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">sync</span> กำลังบันทึก...';

        if (!navigator.geolocation) {
            showPopup('ไม่รองรับ GPS', 'เบราว์เซอร์ของคุณไม่รองรับการระบุพิกัด', 'error');
            this.disabled = false;
            this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">my_location</span> บันทึกพิกัด GPS';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                latInput.value = lat;
                lngInput.value = lng;
                coordsDisplay.value = `Lat: ${lat}, Long: ${lng}`;
                coordsDisplay.style.color = '#10B981'; // Green
                coordsDisplay.style.fontWeight = '700';
                coordsDisplay.style.borderColor = '#10B981';

                const mapLinkContainer = content.querySelector('#map-link-container');
                if (mapLinkContainer) {
                    mapLinkContainer.innerHTML = `
                        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #2563eb; text-decoration: none; background: #eff6ff; padding: 0.4rem 0.75rem; border-radius: 0.5rem; border: 1px solid #bfdbfe;">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">map</span>
                            เปิด Google Maps
                        </a>
                    `;
                }

                this.disabled = false;
                this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">check_circle</span> บันทึกแล้ว';
                this.style.borderColor = '#10B981';
                this.style.color = '#10B981';
                console.log('📍 Captured GPS:', lat, lng);
            },
            (error) => {
                let msg = 'ไม่สามารถเข้าถึงตำแหน่งของคุณได้';
                if (error.code === 1) msg = 'กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้ง';
                showPopup('เกิดข้อผิดพลาด', msg, 'error');

                this.disabled = false;
                this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">my_location</span> บันทึกพิกัด GPS';
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });

    // Form submit
    const form = content.querySelector('#ticket-form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const title = content.querySelector('#ticket-title').value.trim();
        const zoneId = content.querySelector('#ticket-zone').value;
        const locationName = content.querySelector('#ticket-location-name').value.trim();
        const lat = content.querySelector('#ticket-lat').value;
        const lng = content.querySelector('#ticket-lng').value;
        const description = content.querySelector('.form-textarea').value.trim();
        const isUrgent = content.querySelector('.priority-btn.urgent').classList.contains('active');
        const selectedDamageType = content.querySelector('.damage-type-btn.active')?.dataset.type || 'accident';

        const errors = [];
        if (!title) errors.push('ชื่อทิคเก็ต');
        if (!zoneId) errors.push('โซนพื้นที่');
        if (!locationName) errors.push('สถานที่เกิดเหตุ (ระบุชัดเจน)');
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
        const zoneObj = MOCK_DATA.zones.find(z => z.id === zoneId);
        const combinedZoneName = `${zoneObj?.name.split(' (')[0] || ''} - ${locationName}`;

        const newTicket = {
            id: Math.floor(Math.random() * 100000), // Simple random ID
            title: title,
            description: description,
            category: selectedDamageType, // Set category to match the selected type for filtering
            status: 'new',
            priority: isUrgent ? 'urgent' : 'normal',
            zone: zoneId,
            zoneName: combinedZoneName,
            locationDetail: fullLocationDetail, // Set functionality string here
            lat: lat || null,
            lng: lng || null,
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
            
            ${ticket.startedAt || (ticket.assignees && ticket.assignees.length > 0) ? ` 
            <!-- Timeline Item: In Progress -->
            <div style="display: flex; gap: 0.75rem; align-items: start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: white;">settings_suggest</span>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">
                        เข้าดำเนินการโดย
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${ticket.assignees && ticket.assignees.length > 0 ? ticket.assignees.join(', ') : 'รอการมอบหมาย'}
                        ${ticket.startedAt ? `<br>เริ่มเมื่อ: ${new Date(ticket.startedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
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
                        งานเสร็จสิ้น
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        เสร็จสิ้นโดยทีมผู้รับผิดชอบ
                        <br>เมื่อ: ${new Date(ticket.completedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    `;
}

function renderEditTicket(params) {
    updateHeaderNav(true);
    const ticketId = params[0] ? parseInt(params[0]) : null;
    const ticket = MOCK_DATA.tickets.find(t => t.id === ticketId);

    if (!ticket) {
        router.navigate('/tickets');
        return;
    }

    AppState.currentPage = 'edit';

    document.getElementById('page-title').textContent = 'EDIT TICKET';

    // Status Stepper Logic
    // Default to 'inProgress' if 'new' (User request: "ตอนแก้ไขให้เปิดมา ที่status ระหว่างดำเนินการ รอไว้เลย")
    const currentStatus = ticket.status === 'new' ? 'inProgress' : ticket.status;

    const isNew = currentStatus === 'new';
    const isPro = currentStatus === 'inProgress';
    const isComp = currentStatus === 'completed';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div style="padding: 0 1rem;">
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
                    <label class="form-label">ผู้รับผิดชอบ</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="edit-ticket-assignee" class="form-input" value="${ticket.assignee || ''}" placeholder="ระบุชื่อผู้รับผิดชอบ" style="flex: 1;">
                        <button type="button" class="btn" onclick="document.getElementById('edit-ticket-assignee').value = ''" style="background: #fee2e2; color: #ef4444; width: auto; padding: 0 1rem;">
                            <span class="material-symbols-outlined">close</span>
                        </button>
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
                    <label class="form-label">Ticket Type</label>
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
                    <label class="form-label">พิกัดสถานที่ (GPS)</label>
                    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                        <button type="button" id="get-location-btn" class="btn" style="width: auto; background: white; border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.9rem;">
                            <span class="material-symbols-outlined" style="font-size: 1.25rem;">my_location</span>
                            อัปเดตพิกัด GPS
                        </button>
                        <input type="text" id="location-coords-display" class="form-input" style="flex: 1; min-width: 180px; font-family: monospace; background: #f1f5f9; cursor: not-allowed; font-size: 0.8rem; height: 2.5rem; padding: 0 0.75rem; color: ${ticket.lat ? '#10B981' : 'inherit'}; border-color: ${ticket.lat ? '#10B981' : 'var(--border)'}; font-weight: ${ticket.lat ? '700' : 'normal'};" readonly value="${ticket.lat && ticket.lng ? `Lat: ${ticket.lat}, Long: ${ticket.lng}` : ''}" placeholder="(ยังไม่ได้บันทึก)">
                        <div id="map-link-container">
                            ${ticket.lat && ticket.lng ? `
                                <a href="https://www.google.com/maps?q=${ticket.lat},${ticket.lng}" target="_blank" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #2563eb; text-decoration: none; background: #eff6ff; padding: 0.4rem 0.75rem; border-radius: 0.5rem; border: 1px solid #bfdbfe;">
                                    <span class="material-symbols-outlined" style="font-size: 1rem;">map</span>
                                    เปิด Google Maps
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    <input type="hidden" id="edit-ticket-lat" value="${ticket.lat || ''}">
                    <input type="hidden" id="edit-ticket-lng" value="${ticket.lng || ''}">
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

                <div class="sticky-footer">
                    <button type="submit" class="btn btn-primary" style="width: 100%; height: 3.5rem; border-radius: 1rem; font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined">save</span>
                        บันทึกการแก้ไข
                    </button>
                </div>
            </form>
            <div style="height: 1rem;"></div>
            
            ${renderTimeline(ticket)}
            <div style="height: 6rem;"></div>
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

    // GPS Location Functionality for Edit
    const getLocationBtn = content.querySelector('#get-location-btn');
    const coordsDisplay = content.querySelector('#location-coords-display');
    const latInput = content.querySelector('#edit-ticket-lat');
    const lngInput = content.querySelector('#edit-ticket-lng');

    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', function () {
            this.disabled = true;
            this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">sync</span> กำลังบันทึก...';

            if (!navigator.geolocation) {
                showPopup('ไม่รองรับ GPS', 'เบราว์เซอร์ของคุณไม่รองรับการระบุพิกัด', 'error');
                this.disabled = false;
                this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">my_location</span> อัปเดตพิกัด GPS';
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lng = position.coords.longitude.toFixed(6);
                    latInput.value = lat;
                    lngInput.value = lng;
                    coordsDisplay.value = `Lat: ${lat}, Long: ${lng}`;
                    coordsDisplay.style.color = '#10B981'; // Green
                    coordsDisplay.style.fontWeight = '700';
                    coordsDisplay.style.borderColor = '#10B981';

                    const mapLinkContainer = content.querySelector('#map-link-container');
                    if (mapLinkContainer) {
                        mapLinkContainer.innerHTML = `
                            <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #2563eb; text-decoration: none; background: #eff6ff; padding: 0.4rem 0.75rem; border-radius: 0.5rem; border: 1px solid #bfdbfe;">
                                <span class="material-symbols-outlined" style="font-size: 1rem;">map</span>
                                เปิด Google Maps
                            </a>
                        `;
                    }

                    this.disabled = false;
                    this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">check_circle</span> บันทึกแล้ว';
                    this.style.borderColor = '#10B981';
                    this.style.color = '#10B981';
                },
                (error) => {
                    let msg = 'ไม่สามารถเข้าถึงตำแหน่งของคุณได้';
                    if (error.code === 1) msg = 'กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้ง';
                    showPopup('เกิดข้อผิดพลาด', msg, 'error');
                    this.disabled = false;
                    this.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.25rem;">my_location</span> อัปเดตพิกัด GPS';
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }

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
        const lat = document.getElementById('edit-ticket-lat').value;
        const lng = document.getElementById('edit-ticket-lng').value;

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
        ticket.assignee = document.getElementById('edit-ticket-assignee').value.trim();
        ticket.priority = isUrgent ? 'urgent' : 'normal';
        ticket.title = title;
        ticket.description = description;
        ticket.category = damageTypeId;
        ticket.damageType = damageTypeId;
        ticket.operation = operation;
        ticket.treeType = treeType;
        ticket.circumference = circumference;
        ticket.quantity = quantity;
        ticket.impact = resultImpact;
        ticket.zoneName = zoneName;
        ticket.notes = notes;
        ticket.lat = lat;
        ticket.lng = lng;
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
    updateHeaderNav(true);
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
                    <img src="images/security_officer.jpg" 
                         alt="Professional Security Officer" class="category-card-img">
                    <div class="category-card-overlay">
                        <p class="category-subtitle">TICKET</p>
                        <h3 class="category-title">Security</h3>
                    </div>
                </div>

                <!-- Gardener Card (Active) -->
                <div class="category-card active gardener" onclick="router.navigate('/add')">
                    <img src="images/gardener_officer.jpg" 
                         alt="Professional TU Gardener" class="category-card-img">
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
    updateHeaderNav(true);
    AppState.currentPage = 'reports';
    updateActiveNavItem('reports');
    document.getElementById('page-title').textContent = 'รายงาน';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="report-list">
            <div class="report-card" onclick="openReportDetail('summary_fallen')">
                <div class="report-card-icon" style="background: #f0fdf4; color: #10b981;">
                    <span class="material-symbols-outlined">description</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานสรุป ต้นไม้ โค่นล้ม หัก ฉีกขาด จากลมฝน</h3>
                    <p>เอกสารสรุปทางการ แจ้งต้นไม้เสียหายจากภัยธรรมชาติ</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>

            <div class="report-card" onclick="openReportDetail('summary_daily')">
                <div class="report-card-icon" style="background: #fff7ed; color: #ea580c;">
                    <span class="material-symbols-outlined">today</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานสรุปความเสียหายรายวัน</h3>
                    <p>ภาพรวมเหตุการณ์และงานซ่อมทั้งหมดในรอบวัน</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>

            <div class="report-card" onclick="openReportDetail('yearly')">
                <div class="report-card-icon" style="background: #eff6ff; color: #2563eb;">
                    <span class="material-symbols-outlined">analytics</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานวิเคราะห์เชิงสถิติรายปี</h3>
                    <p>วิเคราะห์แนวโน้มรายเดือน และโซนที่เกิดเหตุสูงสุด</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>

            <div class="report-card" onclick="openReportDetail('tree_stats')">
                <div class="report-card-icon" style="background: #ecfccb; color: #65a30d;">
                    <span class="material-symbols-outlined">forest</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานสถิติปัญหาตามชนิดพันธุ์ไม้</h3>
                    <p>สถิติการเกิดเหตุแยกตามชนิดพันธุ์ 34 ชนิด</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>

            <div class="report-card" onclick="openReportDetail('zone_hotspots')">
                <div class="report-card-icon" style="background: #fee2e2; color: #ef4444;">
                    <span class="material-symbols-outlined">location_on</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานพื้นที่เสี่ยง (Zone Hotspots)</h3>
                    <p>สรุปพื้นที่เกิดเหตุสูงสุดเพื่อการเฝ้าระวัง</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>

            <div class="report-card" onclick="openReportDetail('performance')">
                <div class="report-card-icon" style="background: #e0f2fe; color: #0284c7;">
                    <span class="material-symbols-outlined">schedule</span>
                </div>
                <div class="report-card-info">
                    <h3>รายงานประสิทธิภาพงาน (KPI)</h3>
                    <p>ติดตามสถานะงานค้างและระยะเวลาดำเนินการ</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">chevron_right</span>
            </div>

            <div class="report-card" onclick="exportToExcel()">
                <div class="report-card-icon" style="background: #f0f9ff; color: #0ea5e9;">
                    <span class="material-symbols-outlined">table_view</span>
                </div>
                <div class="report-card-info">
                    <h3>ส่งออกข้อมูล (Excel)</h3>
                    <p>ดาวน์โหลดข้อมูลทิคเก็ตทั้งหมดเป็นไฟล์ .xlsx</p>
                </div>
                <span class="material-symbols-outlined" style="margin-left: auto; color: var(--border);">download</span>
            </div>
        </div>
        
        <div style="height: 5rem;"></div>
    `;
}

function openReportDetail(type) {
    AppState.selectedReport = type;
    router.navigate('/report-detail');
}
window.openReportDetail = openReportDetail;

function renderYearlyAnalysis(selectedYear) {
    document.getElementById('page-title').textContent = 'วิเคราะห์เชิงสถิติรายปี';
    const content = document.getElementById('main-content');

    const now = new Date();
    const currentYearAD = now.getFullYear();
    const yearToUse = selectedYear ? parseInt(selectedYear) : currentYearAD;
    const yearToUseThai = yearToUse + 543;

    // Available years: Current Year and Previous Year for demo
    const availableYears = [currentYearAD, currentYearAD - 1];

    // Filter tickets for the selected year
    const ticketsInYear = MOCK_DATA.tickets.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === yearToUse;
    });

    // Aggregate Data based on selected year
    const yearlyTrend = getYearlyPerformanceData(yearToUse);
    const topZones = getYearlyZoneData(yearToUse);

    const totalInYear = ticketsInYear.length;
    const completedInYear = ticketsInYear.filter(t => t.status === 'completed').length;

    content.innerHTML = `
        <div style="padding: 1rem;">
            <!-- Year Selector -->
            <div style="background: white; padding: 1rem; border-radius: 1rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-md); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: var(--primary);">calendar_month</span>
                    <span style="font-weight: 600; color: var(--text-primary);">เลือกปีงบประมาณ</span>
                </div>
                <select onchange="renderYearlyAnalysis(this.value)" style="padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid var(--border); font-family: inherit; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); outline: none; background: #f8fafc;">
                    ${availableYears.map(y => `<option value="${y}" ${y === yearToUse ? 'selected' : ''}>พ.ศ. ${y + 543}</option>`).join('')}
                </select>
            </div>

            <!-- Performance Trend (Annual Line Chart) -->
            <div style="background: white; padding: 1.5rem; border-radius: 1.5rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-md); border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">แนวโน้มทิคเก็ตรายเดือนปี ${yearToUseThai}</h3>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">จำนวนทิคเก็ตรวม vs ทิคเก็ตที่แก้ไขสำเร็จ</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; font-size: 0.7rem; margin-bottom: 1rem; justify-content: flex-end;">
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #0ea5e9;"></div>
                        <span>ทิคเก็ตทั้งหมด</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
                        <span>เสร็จสิ้น</span>
                    </div>
                </div>
                
                ${generateTrendChartSVG(yearlyTrend)}
            </div>

            <!-- Top Zones (Horizontal Bar Chart) -->
            <div style="background: white; padding: 1.5rem; border-radius: 1.5rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-md); border: 1px solid var(--border);">
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">8 โซนที่เกิดเหตุสูงสุดปี ${yearToUseThai}</h3>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">วิเคราะห์ตามปริมาณทิคเก็ตสะสม</p>
                </div>
                
                ${generateHorizontalBarChartSVG(topZones)}
            </div>

            <!-- Summary Stats -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f0f9ff; padding: 1.25rem; border-radius: 1.25rem; border: 1px solid #bae6fd; display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <div style="font-size: 0.75rem; color: #0369a1; margin-bottom: 0.5rem; font-weight: 600;">ทิคเก็ตรวมปีนี้</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #0ea5e9;">${totalInYear}</div>
                    <div style="font-size: 0.75rem; color: #0c4a6e; opacity: 0.7;">ทิคเก็ต</div>
                </div>
                <div style="background: #ecfdf4; padding: 1.25rem; border-radius: 1.25rem; border: 1px solid #a7f3d0; display: flex; flex-direction: column; align-items: center; text-align: center;">
                    <div style="font-size: 0.75rem; color: #047857; margin-bottom: 0.5rem; font-weight: 600;">สำเร็จรวมปีนี้</div>
                    <div style="font-size: 1.75rem; font-weight: 800; color: #064e3b;">${completedInYear}</div>
                    <div style="font-size: 0.75rem; color: #064e3b; opacity: 0.7;">ดำเนินการเรียบร้อย</div>
                </div>
            </div>

            <div style="height: 4rem;"></div>
        </div>
    `;
    window.renderYearlyAnalysis = renderYearlyAnalysis; // Make sure it's globally available
}

function getYearlyPerformanceData(year) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const data = {
        labels: months,
        series: {
            total: new Array(12).fill(0),
            completed: new Array(12).fill(0)
        }
    };

    // Filter by year if provided, else use current year
    const targetYear = year || new Date().getFullYear();

    MOCK_DATA.tickets.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === targetYear) {
            const m = d.getMonth();
            data.series.total[m]++;
            if (t.status === 'completed') {
                data.series.completed[m]++;
            }
        }
    });

    return data;
}

function getYearlyZoneData(year) {
    const zones = {};
    const targetYear = year || new Date().getFullYear();

    MOCK_DATA.tickets.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === targetYear) {
            const z = t.zoneName || t.zone || 'ไม่ระบุ';
            zones[z] = (zones[z] || 0) + 1;
        }
    });

    return Object.entries(zones)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
}

function generateTrendChartSVG(data) {
    const height = 180;
    const width = 360;
    const allValues = [...data.series.total, ...data.series.completed];
    const maxValue = Math.max(...allValues, 10) * 1.3;

    const pointsToPath = (values) => {
        if (values.length === 0) return '';
        const points = values.map((v, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = height - (v / maxValue * height);
            return [x, y];
        });

        return points.reduce((acc, point, i, a) => {
            if (i === 0) return `M ${point[0]},${point[1]}`;
            const cp1x = a[i - 1][0] + (point[0] - a[i - 1][0]) / 2;
            return `${acc} C ${cp1x},${a[i - 1][1]} ${cp1x},${point[1]} ${point[0]},${point[1]}`;
        }, '');
    };

    return `
        <div style="position: relative; height: 16rem; width: 100%;">
            <svg viewBox="0 -10 ${width} ${height + 40}" style="width: 100%; height: 100%; overflow: visible;" preserveAspectRatio="none">
                <!-- Grid Labels (Y-axis) -->
                <text x="-10" y="0" font-size="8" fill="#94a3b8" text-anchor="end">${Math.round(maxValue)}</text>
                <text x="-10" y="${height / 2}" font-size="8" fill="#94a3b8" text-anchor="end">${Math.round(maxValue / 2)}</text>
                <text x="-10" y="${height}" font-size="8" fill="#94a3b8" text-anchor="end">0</text>
                
                <!-- Grid Lines -->
                <line x1="0" y1="0" x2="${width}" y2="0" stroke="#f1f5f9" stroke-width="1" />
                <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#f1f5f9" stroke-width="1" />
                <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#e2e8f0" stroke-width="2" />

                <!-- Glow Effects (Optional) -->
                <defs>
                    <linearGradient id="gradTotal" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.2" />
                        <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0" />
                    </linearGradient>
                </defs>

                <!-- Lines -->
                <path d="${pointsToPath(data.series.total)}" fill="none" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                <path d="${pointsToPath(data.series.completed)}" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />

                <!-- X Axis Labels -->
                ${data.labels.map((l, i) => `
                    <text x="${(i / (data.labels.length - 1)) * width}" y="${height + 25}" font-size="8" fill="#94a3b8" text-anchor="middle">${l}</text>
                `).join('')}
            </svg>
        </div>
    `;
}

function generateHorizontalBarChartSVG(zones) {
    if (!zones.length) return '<p style="text-align:center;color:#94a3b8;">ยังไม่มีข้อมูล</p>';
    const maxVal = zones[0][1];

    return `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${zones.map(([name, count]) => `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 500;">
                        <span style="color: var(--text-primary);">${name}</span>
                        <span style="color: var(--primary); font-weight: 700;">${count} <small style="font-weight: 400; color: #94a3b8;">ทิคเก็ต</small></span>
                    </div>
                    <div style="height: 12px; background: #f1f5f9; border-radius: 6px; position: relative; overflow: hidden;">
                        <div style="position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(to right, #0ea5e9, #0284c7); width: ${(count / maxVal) * 100}%; border-radius: 6px; transition: width 1s ease-out;"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}


function renderReportDetail() {
    updateHeaderNav(true);
    AppState.currentPage = 'report-detail';

    if (AppState.selectedReport === 'yearly') {
        renderYearlyAnalysis();
        return;
    }

    if (AppState.selectedReport === 'summary') {
        renderDailySummaryReport(AppState.selectedDate);
        return;
    }

    // Default to summary if no report selected
    renderDailySummaryReport(AppState.selectedDate);
}

function renderDailySummaryReport(dateStr) {
    document.getElementById('page-title').textContent = 'สรุปความเสียหายรายวัน';
    const content = document.getElementById('main-content');

    const date = new Date(dateStr);
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const thaiDayName = dayNames[date.getDay()];
    const thaiFullDate = `${thaiDayName}ที่ ${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;

    // Filter tickets for this day
    const dayTickets = MOCK_DATA.tickets.filter(t => t.date.startsWith(dateStr));

    // Group by damage type
    // Match Excel logic: Filter everything not 'fallen' into the "Broken/Tilted" group
    const fallenTrees = dayTickets.filter(t => t.damageType === 'fallen');
    const brokenTrees = dayTickets.filter(t => t.damageType !== 'fallen');

    // Calculate quantities
    const totalFallenQuantity = fallenTrees.reduce((sum, t) => sum + (t.quantity || 1), 0);
    const totalBrokenQuantity = brokenTrees.reduce((sum, t) => sum + (t.quantity || 1), 0);

    content.innerHTML = `
        <div class="report-detail-container">
            <!-- Simple Date Selector for Gardeners -->
            <div style="background: white; padding: 1.25rem; border-radius: 1rem; box-shadow: var(--shadow-md); margin-bottom: 1.5rem; border: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span class="material-symbols-outlined" style="color: var(--primary);">calendar_month</span>
                    <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">เลือกวันที่ต้องการดูรายงาน</h3>
                </div>
                <input type="date" value="${dateStr}" 
                       onchange="AppState.selectedDate = this.value; renderDailySummaryReport(this.value)" 
                       style="width: 100%; padding: 1rem; border: 2px solid var(--primary); border-radius: 0.75rem; font-family: inherit; font-size: 1.125rem; font-weight: 600; color: var(--text-primary); outline: none;">
            </div>

            <!-- 2. Report Paper (STAY IN MIDDLE) -->
            <div class="report-paper" id="report-paper" style="margin-bottom: 2rem;">
                <div class="report-paper-logo" style="left: 1.5rem; top: 1.5rem;">
                    <img src="images/tu_logo.png" alt="TU PSM Logo" style="height: 70px; object-fit: contain;">
                </div>

                <div class="report-paper-header">
                    <h1 style="color: #c00000;">รายงานสรุป</h1>
                    <h2 style="color: #c00000;">ต้นไม้ โค่นล้ม หัก ฉีกขาด จากลมฝน</h2>
                    <h3>${thaiFullDate}</h3>
                    <p style="font-weight: bold; color: #595959;">(ในพื้นที่ สำนักงานบริหารทรัพย์สินและกีฬา)</p>
                </div>

                <div class="report-paper-body">
                    <div class="report-paper-section">
                        <div class="report-paper-section-title">1. ต้นไม้ลำต้น ฉีกขาด/หัก/เอียง จำนวน ${totalBrokenQuantity} ต้น ดำเนินการตัดแต่งกิ่งและเก็บเคลียร์</div>
                        <ul class="report-paper-list">
                            ${brokenTrees.map(t => `
                                <li>${t.treeType} บริเวณ${t.zoneName || t.zone} (จำนวน ${t.quantity || 1} ต้น)</li>
                            `).join('') || '<li>ไม่พบรายการ</li>'}
                        </ul>
                    </div>

                    <div class="report-paper-section">
                        <div class="report-paper-section-title">2. ต้นไม้โค่น/ล้ม จำนวน ${totalFallenQuantity} ต้น ดังนี้</div>
                        <ul class="report-paper-list">
                            ${fallenTrees.length > 0 ? fallenTrees.map(t => `
                                <li>${t.treeType} บริเวณ${t.zoneName || t.zone} (จำนวน ${t.quantity || 1} ต้น)
                                    <ul class="report-paper-sublist">
                                        <li>สถานะ: ${t.status === 'completed' ? 'ดำเนินการตัดทอนและนำออกเรียบร้อย' : 'อยู่ระหว่างดำเนินการ'}</li>
                                        ${t.notes ? `<li>หมายเหตุ: ${t.notes}</li>` : ''}
                                    </ul>
                                </li>
                            `).join('') : '<li>ไม่พบรายการ</li>'}
                        </ul>
                    </div>
                    

                </div>

                <div class="report-paper-footer">
                    * หมายเหตุ: ข้อมูลอัปเดตอัตโนมัติจากระบบ TU Ticket Gardener (ตามภาพและรายละเอียดที่แนบมาในไฟล์ Excel)
                </div>
            </div>

            <!-- 3. Summary Actions (MOVE TO BOTTOM) -->
            <div class="report-actions">
                <button onclick="downloadDailyReport('${dateStr}')" class="btn-report btn-report-excel">
                    <span class="material-symbols-outlined">table_view</span>
                    Excel รายละเอียด
                </button>
                <button onclick="downloadDailyImages('${dateStr}')" class="btn-report btn-report-images">
                    <span class="material-symbols-outlined">folder_zip</span>
                    รูปภาพประกอบ (ZIP)
                </button>
                <button onclick="downloadReportAsImage('${dateStr}')" class="btn-report" style="background:#3b82f6; color:white; border-color:#2563eb;">
                    <span class="material-symbols-outlined">image</span>
                    บันทึกหน้านี้ (Image)
                </button>

            </div>
            
            <div style="height: 5rem;"></div>
        </div>
    `;
}


// Function to download all images as ZIP
async function downloadDailyImages(dateStr) {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        showPopup('ข้อผิดพลาด', 'ไลบรารี ZIP ไม่พร้อมใช้งาน', 'error');
        return;
    }

    showPopup('กำลังเตรียมรูปภาพ', 'กำลังรวบรวมและบีบอัดรูปภาพ อาจใช้เวลาสักครู่...', 'info');

    try {
        const zip = new JSZip();
        // Standardize YYYY-MM-DD
        const searchDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

        // Find tickets
        const tickets = MOCK_DATA.tickets.filter(t => t.date && t.date.startsWith(searchDate));

        if (tickets.length === 0) {
            showPopup('ไม่พบข้อมูล', 'ไม่มีรูปภาพในวันที่เลือก', 'warning');
            return;
        }

        let imageCount = 0;
        const promises = [];

        tickets.forEach(ticket => {
            if (ticket.images && ticket.images.length > 0) {
                ticket.images.forEach((imgUrl, index) => {
                    imageCount++;
                    // Assume jpg if generic, or extract from url
                    let ext = 'jpg';
                    if (imgUrl.includes('.png')) ext = 'png';

                    const filename = `Ticket_${ticket.id}_Image${index + 1}.${ext}`;

                    // Fetch image from URL
                    const p = fetch(imgUrl, { mode: 'cors' })
                        .then(resp => {
                            if (!resp.ok) throw new Error('Fetch failed');
                            return resp.blob();
                        })
                        .then(blob => {
                            zip.file(filename, blob);
                        })
                        .catch(err => {
                            console.error(`Failed to load ${imgUrl}`, err);
                            zip.file(`Ticket_${ticket.id}_Image${index + 1}_Error.txt`, `Failed to load image: ${imgUrl}\nError: ${err.message}`);
                        });
                    promises.push(p);
                });
            }
        });

        if (imageCount === 0) {
            showPopup('ไม่พบรูปภาพ', 'ไม่มีรูปภาพในทิคเก็ตของวันนี้', 'warning');
            return;
        }

        await Promise.all(promises);

        const content = await zip.generateAsync({ type: 'blob' });
        const zipName = `TU_Ticket_Images_${searchDate}.zip`;
        saveAs(content, zipName);

        showPopup('สำเร็จ', `ดาวน์โหลดรูปภาพเรียบร้อย (${imageCount} รูป)`, 'success');

    } catch (e) {
        console.error(e);
        showPopup('เกิดข้อผิดพลาด', 'ไม่สามารถดาวน์โหลดรูปภาพได้: ' + e.message, 'error');
    }
}
window.downloadDailyImages = downloadDailyImages;

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
                    ${ticketsOnDay.length} ทิคเก็ต
                </div>
                <div style="font-size: 0.65rem; color: var(--text-secondary);">
                    ${totalTrees} ต้น
                </div>
                ${fallenCount > 0 ? `<div style="font-size: 0.65rem; color: #f59e0b;">⚠ ${fallenCount} ล้ม</div>` : ''}
            `;
        }

        const clickHandler = hasData ? `onclick="viewDailySummary('${dateKey}')"` : '';
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
                    <strong style="color: var(--primary);">คลิกที่วันที่มีข้อมูล</strong> เพื่อดูรายงานสรุปประจำวัน<br>
                    • สีน้ำเงิน = มีข้อมูลวันนั้น<br>
                    • ตัวเลข = จำนวนทิคเก็ต / จำนวนต้นไม้<br>
                    • ⚠ = มีต้นไม้โค่นล้ม
                </div>
            </div>
        </div>
    `;

    const dashboardContainer = document.getElementById('dashboard-calendar-container');
    const reportsContainer = document.getElementById('reports-calendar-container');

    if (dashboardContainer) {
        dashboardContainer.innerHTML = calendarHTML;
    } else if (reportsContainer) {
        reportsContainer.innerHTML = calendarHTML;
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

// Helper to view daily summary instead of direct download
function viewDailySummary(dateStr) {
    AppState.selectedDate = dateStr;
    AppState.selectedReport = 'summary';
    router.navigate('/report-detail');
}
window.viewDailySummary = viewDailySummary;



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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`รายงาน ${thaiDate}`);

    // Setup worksheet
    worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    };

    // Column widths
    worksheet.columns = [
        { width: 8 },   // A: ลำดับ
        { width: 35 },  // B: สถานที่เกิดเหตุ
        { width: 25 },  // C: รูปภาพ
        { width: 12 },  // D: จำนวน
        { width: 30 },  // E: โค่นล้ม
        { width: 30 }   // F: กิ่งหัก/ฉีก/เอน
    ];

    // --- Header Section ---
    const darkBlueColor = { argb: 'FF002060' };

    // Header Row 1: Title
    const headerRow1 = worksheet.addRow(['', 'รายงานสรุปต้นไม้โค่นล้ม หัก ฉีกขาด จากลมฝน', '', '', '', '']);
    worksheet.mergeCells('B1:F1');
    headerRow1.getCell(2).font = { name: 'Sarabun', size: 18, bold: true, color: darkBlueColor };
    headerRow1.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow1.height = 35;

    // Header Row 2: Date
    const thaiFullDateForExcel = date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const headerRow2 = worksheet.addRow(['', thaiFullDateForExcel, '', '', '', '']);
    worksheet.mergeCells('B2:F2');
    headerRow2.getCell(2).font = { name: 'Sarabun', size: 14, bold: true, color: darkBlueColor };
    headerRow2.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow2.height = 25;

    // Header Row 3: Organization
    const headerRow3 = worksheet.addRow(['', '(ในพื้นที่ สำนักงานบริหารทรัพย์สินและกีฬา)', '', '', '', '']);
    worksheet.mergeCells('B3:F3');
    headerRow3.getCell(2).font = { name: 'Sarabun', size: 12, bold: true, color: darkBlueColor };
    headerRow3.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow3.height = 20;

    // Add Logo (Top Left)
    try {
        const logoUrl = 'images/tu_logo.png';

        // Fetch buffer for excel
        const logoResponse = await fetch(logoUrl);
        const logoBuffer = await logoResponse.arrayBuffer();

        // Get dimensions to maintain aspect ratio
        const img = new Image();
        img.src = logoUrl;
        await new Promise(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });

        const aspect = (img.width && img.height) ? (img.width / img.height) : 1;
        const logoHeight = 80;
        const logoWidth = logoHeight * aspect;

        const logoId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });
        worksheet.addImage(logoId, {
            tl: { col: 0.1, row: 0.1 },
            ext: { width: logoWidth, height: logoHeight }
        });
    } catch (e) {
        console.warn('Could not load logo for Excel:', e);
    }

    worksheet.addRow([]); // Blank Row

    // --- Table Header Section (Merged) ---
    // Row 5: Top part of merged headers
    const tableHeader1 = worksheet.addRow(['ลำดับ', 'สถานที่เกิดเหตุ', 'รูปภาพ', 'จำนวน', 'ชนิดต้นไม้และสถานะ', '']);
    worksheet.mergeCells('E5:F5'); // Merge "ชนิดต้นไม้และสถานะ" across E and F

    // Row 6: Bottom part for sub-columns
    const tableHeader2 = worksheet.addRow(['', '', '', '', 'โค่นล้ม', 'กิ่งหัก/ฉีก/เอน']);

    // Merge cells for single-row headers in column A, B, C, D
    worksheet.mergeCells('A5:A6');
    worksheet.mergeCells('B5:B6');
    worksheet.mergeCells('C5:C6');
    worksheet.mergeCells('D5:D6');

    // Style Header Row 1 & 2
    const greyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFBFBF' } }; // Darker Grey
    const blueFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8DB4E2' } }; // Standard Excel Blue
    const orangeFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFABF8F' } }; // Standard Excel Orange
    const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }; // Standard Excel Green

    const headerCellStyle = {
        font: { name: 'Sarabun', size: 10, bold: true },
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
        border: {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        }
    };

    // Apply styles to A5:D6 (Grey)
    ['A', 'B', 'C', 'D'].forEach(col => {
        const cell = worksheet.getCell(`${col}5`);
        cell.style = headerCellStyle;
        cell.fill = greyFill;
    });

    // Apply style to E5:F5 (Blue - Main Header)
    const mainTreeHeader = worksheet.getCell('E5');
    mainTreeHeader.style = headerCellStyle;
    mainTreeHeader.fill = blueFill;

    // Apply style to E6 (Orange - Fallen)
    const fallenHeader = worksheet.getCell('E6');
    fallenHeader.style = headerCellStyle;
    fallenHeader.fill = orangeFill;

    // Apply style to F6 (Green - Broken)
    const brokenHeader = worksheet.getCell('F6');
    brokenHeader.style = headerCellStyle;
    brokenHeader.fill = greenFill;

    worksheet.getRow(5).height = 25;
    worksheet.getRow(6).height = 25;

    // --- Data Rows ---
    let totalFallenQty = 0;
    let totalBrokenQty = 0;
    let grandTotalTrees = 0;

    for (let i = 0; i < dayTickets.length; i++) {
        const t = dayTickets[i];
        const qty = t.quantity || 1;
        grandTotalTrees += qty;

        let fallenVal = '';
        let brokenVal = '';

        const actionText = t.operation && t.operation !== '-' ? ` / ${t.operation}` : '';
        const info = `${t.treeType}${actionText}`;

        if (t.damageType === 'fallen') {
            fallenVal = info;
            totalFallenQty += qty;
        } else {
            brokenVal = info;
            totalBrokenQty += qty;
        }

        const row = worksheet.addRow([
            i + 1,
            t.zoneName || t.zone,
            '', // Image placeholder
            qty + ' ต้น',
            fallenVal,
            brokenVal
        ]);

        row.height = 100;
        row.eachCell((cell) => {
            cell.style = {
                font: { name: 'Sarabun', size: 10 },
                alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                border: {
                    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
                }
            };
        });

        // Add image to column C
        if (t.images && t.images.length > 0) {
            try {
                const imgUrl = t.images[0];
                let imageId;

                // 1. Get Image Dimensions to preserve Aspect Ratio
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = imgUrl;
                await new Promise(resolve => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });

                const aspect = (img.width && img.height) ? (img.width / img.height) : 1.33; // Default 4:3

                // Define max box
                const mW = 160;
                const mH = 120;

                let targetW = mW;
                let targetH = mW / aspect;

                if (targetH > mH) {
                    targetH = mH;
                    targetW = targetH * aspect;
                }

                // 2. Add Image to Workbook
                if (imgUrl.startsWith('data:image/')) {
                    const base64Data = imgUrl.split(',')[1];
                    imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                } else {
                    const response = await fetch(imgUrl);
                    const buffer = await response.arrayBuffer();
                    imageId = workbook.addImage({ buffer: buffer, extension: 'png' });
                }

                // 3. Place Image on Sheet
                // Center the image in the cell (Column C width is roughly 25 chars ~ 180px?)
                // Row height is 100 points ~ 133px?
                // Let's stick to top-left + sized box. Or centering?
                // Fixed top-left with calculated size is safests for aspect ratio.
                worksheet.addImage(imageId, {
                    tl: { col: 2.1, row: row.number - 0.9 },
                    ext: { width: targetW, height: targetH }
                });
            } catch (e) {
                console.error('Image error:', e);
            }
        }
    }

    // --- Summary Section ---
    const summaryCommonStyle = {
        font: { name: 'Sarabun', size: 11, bold: true },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        }
    };

    // 1. Total Trees Summary Row
    const treeSumRow = worksheet.addRow(['สรุปรวมจำนวนต้นไม้ทั้งสิ้น', '', '', grandTotalTrees + ' ต้น', totalFallenQty + ' ต้น', totalBrokenQty + ' ต้น']);
    worksheet.mergeCells(`A${treeSumRow.number}:C${treeSumRow.number}`);

    // Apply styles to all cells in the row
    [1, 4, 5, 6].forEach(col => {
        treeSumRow.getCell(col).style = summaryCommonStyle;
    });
    treeSumRow.height = 30;

    // 2. Total Cases Summary Row (Optional but helpful, formatted similarly)
    const caseSumRow = worksheet.addRow(['สรุปจำนวนทิคเก็ต', '', '', dayTickets.length + ' ทิคเก็ต', dayTickets.filter(t => t.damageType === 'fallen').length + ' ทิคเก็ต', dayTickets.filter(t => t.damageType !== 'fallen').length + ' ทิคเก็ต']);
    worksheet.mergeCells(`A${caseSumRow.number}:C${caseSumRow.number}`);

    [1, 4, 5, 6].forEach(col => {
        caseSumRow.getCell(col).style = summaryCommonStyle;
    });

    // Add color highlights back to case summary
    caseSumRow.getCell(5).fill = orangeFill;
    caseSumRow.getCell(6).fill = greenFill;
    caseSumRow.height = 30;

    // Generate File
    const fileName = `TU_Ticket_Report_${dateStr}.xlsx`;
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

// Delete Ticket Function
window.deleteTicket = function (id) {
    showPopup('ลบข้อมูลทิคเก็ต', 'คุณแน่ใจหรือไม่ที่จะลบทิคเก็ตนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', 'confirm', () => {
        const index = MOCK_DATA.tickets.findIndex(t => t.id === id);
        if (index > -1) {
            MOCK_DATA.tickets.splice(index, 1);
            saveData();
            showPopup('ลบข้อมูลสำเร็จ', 'ทิคเก็ตถูกลบออกจากระบบแล้ว', 'success', () => {
                // Navigate back to dashboard
                router.navigate('/dashboard');
            });
        } else {
            showPopup('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลทิคเก็ตในระบบ', 'error');
        }
    });
};

/* Fallen Tree Report Logic */
function getFallenTreeStats(period, dateStr) {
    const tickets = MOCK_DATA.tickets;
    const date = new Date(dateStr);
    let filtered = [];

    // Filter by period
    if (period === 'DAY') {
        filtered = tickets.filter(t => t.date.startsWith(dateStr));
    } else if (period === 'WEEK') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        filtered = tickets.filter(t => {
            const d = new Date(t.date);
            return d >= startOfWeek && d < endOfWeek;
        });
    } else if (period === 'MONTH') {
        const y = date.getFullYear();
        const m = date.getMonth();
        filtered = tickets.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === y && d.getMonth() === m;
        });
    }

    // Filter only fallen (โค่นล้ม)
    filtered = filtered.filter(t => t.category === 'fallen' || t.damageType === 'fallen');

    // Group by treeType
    const groups = {};
    let total = 0;

    filtered.forEach(t => {
        const type = t.treeType || 'ไม่ระบุ';
        const qty = t.quantity || 1;
        groups[type] = (groups[type] || 0) + qty; // Sum quantity
        total += qty;
    });

    const items = Object.entries(groups).map(([name, count]) => ({ name, count }));
    items.sort((a, b) => b.count - a.count);

    return { total, items };
}

function renderFallenTreesSection(period, dateStr) {
    const stats = getFallenTreeStats(period, dateStr);

    if (stats.total === 0) {
        return `
        <div class="chart-card">
            <h2>รายงานจำนวนต้นไม้ที่โค่นล้ม</h2>
            <div style="padding: 2rem; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 14rem;">
                <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">forest</span>
                <p>ไม่มีข้อมูลต้นไม้โค่นล้มในช่วงเวลานี้</p>
            </div>
        </div>
        `;
    }

    const colors = ['#3bb143', '#facc15', '#f472b6', '#60a5fa', '#a78bfa', '#fb923c', '#94a3b8'];

    // Assign Colors & Calculate Percentages
    let cumulativePercent = 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // ~251.327

    const circlesHtml = stats.items.map((item, index) => {
        const color = colors[index % colors.length];
        item.color = color;

        const percent = item.count / stats.total;
        const dashArray = percent * circumference;
        const offset = cumulativePercent * circumference;
        const space = circumference - dashArray;

        const circle = `
            <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="${color}" stroke-width="12"
                    stroke-dasharray="${dashArray} ${space}" 
                    stroke-dashoffset="-${offset}"
                    style="transform: rotate(-90deg); transform-origin: 50% 50%; transition: all 0.5s ease;"></circle>
        `;
        cumulativePercent += percent;
        return circle;
    }).join('');

    const legendHtml = stats.items.map(item => `
        <div style="display: flex; align-items: center; gap: 0.375rem;">
            <div style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background: ${item.color};"></div>
            <span style="font-size: 0.75rem; color: var(--text-primary); font-weight: 500;">${item.name} (${item.count})</span>
        </div>
    `).join('');

    const periodLabel = period === 'DAY' ? 'วันนี้' : period === 'WEEK' ? 'สัปดาห์นี้' : 'เดือนนี้';

    return `
        <div class="chart-card">
            <h2>รายงานจำนวนต้นไม้ที่โค่นล้ม (${periodLabel})</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 0.75rem; margin-bottom: 1.5rem;">
                ${legendHtml}
            </div>
            <div style="position: relative; width: 14rem; height: 14rem; margin: 0 auto; display: flex; justify-content: center; align-items: center;">
                <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                    <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="12"></circle>
                    ${circlesHtml}
                </svg>
                <div style="position: absolute; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                    <span style="font-size: 2.25rem; font-weight: 800; color: var(--text-primary); line-height: 1;">${stats.total}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">ต้น</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * ==========================================
 * New Report Implementations
 * ==========================================
 */

function renderReportDetail() {
    updateHeaderNav(true);
    const type = AppState.selectedReport;

    // Default fallback
    let finalType = type;
    if (!type || type === 'summary') finalType = 'summary_fallen';

    if (finalType === 'yearly') {
        renderYearlyAnalysis(null);
    } else if (finalType === 'tree_stats') {
        renderTreeStatsReport();
    } else if (finalType === 'zone_hotspots') {
        renderZoneHotspotReport();
    } else if (finalType === 'performance') {
        renderPerformanceReport();
    } else if (finalType === 'summary_fallen') {
        // The "Designed" Report Paper (Fallen/Broken Trees)
        if (!AppState.selectedDate) AppState.selectedDate = new Date().toISOString().slice(0, 10);
        if (typeof renderDailySummaryReport === 'function') {
            renderDailySummaryReport(AppState.selectedDate);
        } else {
            renderReportList();
        }
    } else if (finalType === 'summary_daily') {
        // The "New" General Daily Overview
        renderDailyOverviewReport();
    } else {
        renderReportList();
    }
}

function renderDailyOverviewReport() {
    document.getElementById('page-title').textContent = 'สรุปภาพรวมรายวัน';
    const content = document.getElementById('main-content');

    // Get Today's Data
    const today = new Date().toISOString().slice(0, 10);
    const todayTickets = MOCK_DATA.tickets.filter(t => t.date && t.date.startsWith(today));

    // Calculate Stats
    const total = todayTickets.length;
    const completed = todayTickets.filter(t => t.status === 'completed').length;
    const inProgress = todayTickets.filter(t => t.status === 'inProgress').length;
    const pending = todayTickets.filter(t => t.status === 'new').length;

    content.innerHTML = `
        <div style="padding: 1rem;">
            <!-- Date Header -->
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h3 style="color: var(--text-primary); margin-bottom: 0.25rem;">ประจำวันที่ ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">ข้อมูลเหตุการณ์ทั้งหมดในวันนี้</p>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="stat-card" style="background: white; border: 1px solid var(--border); padding: 1rem; border-radius: 1rem; text-align: center; box-shadow: var(--shadow-sm);">
                    <div class="stat-value" style="color: var(--primary); font-size: 2rem; font-weight: 800; line-height: 1;">${total}</div>
                    <div class="stat-label" style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">แจ้งทั้งหมด (เรื่อง)</div>
                </div>
                <div class="stat-card" style="background: white; border: 1px solid var(--border); padding: 1rem; border-radius: 1rem; text-align: center; box-shadow: var(--shadow-sm);">
                    <div class="stat-value" style="color: #10b981; font-size: 2rem; font-weight: 800; line-height: 1;">${completed}</div>
                    <div class="stat-label" style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">แก้ไขเสร็จ (เรื่อง)</div>
                </div>
            </div>

            <!-- Ticket List -->
            <div class="kpi-card" style="background: white; border-radius: 1rem; padding: 1rem; box-shadow: var(--shadow-sm); border: 1px solid var(--border);">
                <h3 style="margin-bottom: 1rem;">รายการแจ้งซ่อมวันนี้</h3>
                ${todayTickets.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${todayTickets.map(t => `
                            <div onclick="router.navigate('/ticket/${t.id}')" style="display: flex; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; cursor: pointer;">
                                <div style="width: 3rem; height: 3rem; background: #e2e8f0; border-radius: 0.5rem; flex-shrink: 0; overflow: hidden;">
                                    ${t.images && t.images.length > 0 ? `<img src="${t.images[0]}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span class="material-symbols-outlined" style="font-size: 1.5rem; color: #94a3b8; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">image</span>'}
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.title}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${t.zoneName || 'ไม่ระบุโซน'} • ${t.time} น.</div>
                                    <div style="margin-top: 0.25rem;">
                                        <span class="status-badge ${t.status}" style="font-size: 0.7rem; padding: 0.1rem 0.5rem;">${t.status === 'new' ? 'ใหม่' : (t.status === 'inProgress' ? 'กำลังทำ' : 'เสร็จ')}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 2rem 0; color: var(--text-secondary);">
                        <span class="material-symbols-outlined" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;">check_circle</span>
                        วันนี้ยังไม่มีการแจ้งเหตุ
                    </div>
                `}
            </div>
            <div style="height: 5rem;"></div>
        </div>
    `;
}

function renderTreeStatsReport() {
    document.getElementById('page-title').textContent = 'สถิติชนิดพันธุ์ไม้';
    const content = document.getElementById('main-content');

    // Calculate Stats
    const treeCounts = {};
    MOCK_DATA.tickets.forEach(t => {
        if (t.treeType) {
            treeCounts[t.treeType] = (treeCounts[t.treeType] || 0) + 1;
        }
    });

    // Sort
    const sortedTrees = Object.entries(treeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10

    const total = Object.values(treeCounts).reduce((a, b) => a + b, 0);

    content.innerHTML = `
        <div style="padding: 1rem;">
            <div class="kpi-card" style="background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: var(--shadow-sm); border: 1px solid var(--border);">
                <h3>ชนิดพันธุ์ที่มีปัญหามากที่สุด (Top 10)</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    ${sortedTrees.length > 0 ? sortedTrees.map(([name, count], index) => `
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                <span style="font-weight: 600; color: var(--text-primary);">${index + 1}. ${name}</span>
                                <span style="font-weight: 700; color: var(--primary);">${count} เคส</span>
                            </div>
                            <div style="width: 100%; background: #f1f5f9; height: 0.6rem; border-radius: 1rem; overflow: hidden;">
                                <div style="height: 100%; background: var(--primary); width: ${(count / total) * 100}%;"></div>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align:center; color: var(--text-secondary);">ไม่มีข้อมูลชนิดพันธุ์ไม้</p>'}
                </div>
            </div>
            <div style="height: 5rem;"></div>
        </div>
    `;
}

function renderZoneHotspotReport() {
    document.getElementById('page-title').textContent = 'พื้นที่เสี่ยง (Hotspots)';
    const content = document.getElementById('main-content');

    const zoneCounts = {};
    MOCK_DATA.tickets.forEach(t => {
        const zone = t.zoneName || 'ไม่ระบุโซน';
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });

    const sortedZones = Object.entries(zoneCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const maxVal = sortedZones[0]?.[1] || 1;

    content.innerHTML = `
        <div style="padding: 1rem;">
            <div class="kpi-card" style="background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: var(--shadow-sm); border: 1px solid #fee2e2; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444; display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined">location_on</span>
                    10 อันดับพื้นที่เกิดเหตุสูงสุด
                </h3>
                <div style="margin-top: 1rem;">
                    ${sortedZones.map(([zone, count]) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px dashed #e2e8f0;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${zone}</div>
                                <div style="width: ${(count / maxVal) * 100}%; background: #fee2e2; height: 6px; margin-top: 6px; border-radius: 3px;"></div>
                            </div>
                            <div style="font-weight: 800; color: #ef4444; font-size: 1.25rem; margin-left: 1rem;">${count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="height: 5rem;"></div>
        </div>
    `;
}

function renderPerformanceReport() {
    document.getElementById('page-title').textContent = 'ประสิทธิภาพงาน (KPI)';
    const content = document.getElementById('main-content');

    const completed = MOCK_DATA.tickets.filter(t => t.status === 'completed');
    const inProgress = MOCK_DATA.tickets.filter(t => t.status === 'inProgress');
    const pending = MOCK_DATA.tickets.filter(t => t.status === 'new');

    // Avg Time (Mock)
    const overdue = inProgress.filter(t => {
        if (!t.startedAt) return false;
        try {
            const start = new Date(t.startedAt);
            const now = new Date();
            const diff = (now - start) / (1000 * 60 * 60 * 24);
            return diff > 7;
        } catch (e) { return false; }
    }).length;

    content.innerHTML = `
        <div style="padding: 1rem;">
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="stat-card" style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 1.5rem; border-radius: 1rem; text-align: center;">
                    <div class="stat-value" style="color: #10b981; font-size: 2.5rem; font-weight: 800; line-height: 1;">${completed.length}</div>
                    <div class="stat-label" style="color: #059669; font-size: 0.9rem; margin-top: 0.5rem;">งานที่เสร็จสิ้น</div>
                </div>
                <div class="stat-card" style="background: #fff1f2; border: 1px solid #ffe4e6; padding: 1.5rem; border-radius: 1rem; text-align: center;">
                    <div class="stat-value" style="color: #e11d48; font-size: 2.5rem; font-weight: 800; line-height: 1;">${overdue}</div>
                    <div class="stat-label" style="color: #be123c; font-size: 0.9rem; margin-top: 0.5rem;">งานล่าช้า (>7วัน)</div>
                </div>
            </div>
            
            <div class="kpi-card" style="background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: var(--shadow-sm); border: 1px solid var(--border);">
                <h3>สถานะงานปัจจุบัน</h3>
                <div style="margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="color: var(--text-secondary);">รอดำเนินการ (New)</span>
                        <span style="font-weight: 700; color: var(--text-primary);">${pending.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="color: var(--text-secondary);">กำลังดำเนินการ (In Progress)</span>
                        <span style="font-weight: 700; color: var(--primary);">${inProgress.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 1rem 0 0.5rem 0; margin-top: 0.5rem;">
                        <span style="font-weight: 600;">รวมทั้งหมด</span>
                        <span style="font-weight: 800; font-size: 1.1rem;">${MOCK_DATA.tickets.length}</span>
                    </div>
                </div>
            </div>
            <div style="height: 5rem;"></div>
        </div>
    `;
}

// Export to Excel Function
async function exportToExcel() {
    console.log('🔄 Exporting to Excel...');
    showPopup('กำลังเตรียมไฟล์', 'ระบบกำลังรวบรวมข้อมูลเพื่อสร้างไฟล์ Excel...', 'info');

    // Simulate async work and use libraries
    setTimeout(async () => {
        try {
            if (typeof ExcelJS === 'undefined' || typeof saveAs === 'undefined') {
                showPopup('ข้อผิดพลาด', 'ไลบรารี Excel ไม่พร้อมใช้งาน', 'error');
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('All Tickets');

            // Columns
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'สถานะ', key: 'status', width: 15 },
                { header: 'วันที่แจ้ง', key: 'date', width: 15 },
                { header: 'เวลา', key: 'time', width: 10 },
                { header: 'หมวดหมู่', key: 'category', width: 15 },
                { header: 'หัวข้อ', key: 'title', width: 30 },
                { header: 'ความสำคัญ', key: 'priority', width: 12 },
                { header: 'โซนพื้นที่', key: 'zone', width: 20 },
                { header: 'ชนิดพันธุ์ไม้', key: 'treeType', width: 20 },
                { header: 'ผู้รับผิดชอบ', key: 'assignee', width: 20 },
                { header: 'รายละเอียด', key: 'description', width: 40 }
            ];

            // Header Style
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE2E8F0' }
            };

            // Data
            MOCK_DATA.tickets.forEach(t => {
                worksheet.addRow({
                    id: t.id,
                    status: t.status === 'new' ? 'รอดำเนินการ' : (t.status === 'inProgress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'),
                    date: t.date,
                    time: t.time,
                    category: t.category === 'fallen_tree' ? 'ต้นไม้ล้ม' : (t.category === 'branch_break' ? 'กิ่งไม้หัก' : t.category),
                    title: t.title,
                    priority: t.priority === 'urgent' ? 'เร่งด่วน' : 'ปกติ',
                    zone: t.zoneName || '-',
                    treeType: t.treeType || '-',
                    assignee: t.assignee || '-',
                    description: t.description || '-'
                });
            });

            // Write
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const fileName = `TU_Ticket_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            saveAs(blob, fileName);

            showPopup('สำเร็จ', 'ดาวน์โหลดไฟล์เรียบร้อยแล้ว', 'success');

        } catch (error) {
            console.error(error);
            showPopup('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างไฟล์ Excel ได้: ' + error.message, 'error');
        }
    }, 500);
}
window.exportToExcel = exportToExcel;

// Function to download the report as an image
async function downloadReportAsImage(dateStr) {
    if (typeof html2canvas === 'undefined') {
        showPopup('ข้อผิดพลาด', 'ไลบรารี html2canvas ไม่พร้อมใช้งาน', 'error');
        return;
    }

    const element = document.getElementById('report-paper');
    if (!element) {
        showPopup('ข้อผิดพลาด', 'ไม่พบส่วนรายงานที่จะบันทึก', 'error');
        return;
    }

    showPopup('กำลังบันทึกรูปภาพ', 'กำลังสร้างไฟล์รูปภาพ...', 'info');

    try {
        // Use html2canvas to capture the element
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true, // Allow cross-origin images
            logging: false,
            backgroundColor: '#ffffff' // Ensure white background
        });

        canvas.toBlob(blob => {
            if (blob) {
                const fileName = `TU_Ticket_Report_Image_${dateStr}.png`;
                saveAs(blob, fileName);
                showPopup('สำเร็จ', 'บันทึกรูปภาพเรียบร้อยแล้ว', 'success');
            } else {
                throw new Error('Canvas is empty');
            }
        }, 'image/png');

    } catch (error) {
        console.error(error);
        showPopup('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกเป็นรูปภาพได้: ' + error.message, 'error');
    }
}
window.downloadReportAsImage = downloadReportAsImage;

/* =========================================
   FAB Interaction Logic (2-Step Click)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize FAB Logic
    const fab = document.getElementById('add-ticket-fab');
    if (!fab) return;

    fab.addEventListener('click', (e) => {
        const icon = fab.querySelector('.material-symbols-outlined');
        const label = fab.querySelector('.fab-text');

        // Reset Helper
        const resetFab = () => {
            fab.classList.remove('active');
            if (icon) icon.textContent = 'add';
            if (label) label.textContent = 'เพิ่มรายการ';
        };

        // Step 2: Navigate if already active
        if (fab.classList.contains('active')) {
            // User requested to skip 'add-select' and go directly to Add Form
            if (typeof navigateTo === 'function') {
                // navigateTo('add-select');
                navigateTo('add');
            } else if (window.router) {
                window.router.navigate('/add');
            } else {
                console.warn('Navigation function not found');
            }
            resetFab();
        }
        // Step 1: Show Label & Indicate Next Action
        else {
            e.preventDefault();
            e.stopPropagation();

            // Activate state
            fab.classList.add('active');

            // Change UI to encourage 2nd click
            if (icon) icon.textContent = 'arrow_forward';
            if (label) label.textContent = 'แตะอีกครั้งเพื่อยืนยัน';

            // Close when clicking outside
            const closeFab = (ev) => {
                if (ev.target !== fab && !fab.contains(ev.target)) {
                    resetFab();
                    document.removeEventListener('click', closeFab);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', closeFab);
            }, 100);
        }
    });
});
