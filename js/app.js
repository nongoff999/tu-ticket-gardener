/**
 * TU Ticket Gardener - Main Application
 * มหาวิทยาลัยธรรมศาสตร์ รังสิต
 */

// Local Date Formatter helper
const formatDateLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// App State
const AppState = {
    currentPage: 'dashboard',
    selectedCategory: 'all',
    selectedTicket: null,
    isDrawerOpen: false,
    selectedDate: formatDateLocal(new Date()), // Default to today
    selectedReport: null,
    currentFilter: 'all',
    ticketsPage: 1,
    ticketsPerPage: 10
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

// ============================================
// Version Management & Auto-Update Detection
// ============================================
const APP_VERSION = '1.2.1';

// Manual Update (triggered by button in sidebar)
async function checkForUpdate() {
    console.log('🔄 Force update triggered...');

    // Show visual feedback
    showPopup('กำลังอัปเดต', 'ระบบกำลังล้างแคชและโหลดเวอร์ชันล่าสุด...', 'info');

    // Step 1: Disable the button to prevent double-click
    const btn = document.querySelector('.update-check-btn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 1.1rem; animation: spin 1s linear infinite;">sync</span>
            กำลังอัปเดต...
        `;
    }

    // Add spin animation
    if (!document.getElementById('spin-style')) {
        const spinStyle = document.createElement('style');
        spinStyle.id = 'spin-style';
        spinStyle.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
        document.head.appendChild(spinStyle);
    }

    try {
        // Step 2: Unregister ALL Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log('✅ Service Worker unregistered');
            }
        }

        // Step 3: Delete ALL Cache Storage
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => {
                console.log(`🗑️ Deleting cache: ${name}`);
                return caches.delete(name);
            }));
            console.log('✅ All caches cleared');
        }
    } catch (e) {
        console.error('⚠️ Cleanup error (non-fatal):', e);
    }

    // Step 4: Hard navigate with cache-busting timestamp
    // Using location.href instead of reload() to force a new navigation
    // This ensures the browser treats it as a fresh page load
    setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('_v', Date.now()); // Cache buster
        window.location.href = url.toString();
    }, 1500);
}

// Auto Version Check (runs periodically)
async function autoCheckVersion() {
    try {
        const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        if (data.version && data.version !== APP_VERSION) {
            console.log(`🆕 New version detected: ${data.version} (current: ${APP_VERSION})`);
            showUpdateBanner(data.version, data.changelog || '');
        } else {
            console.log(`✅ App is up to date (v${APP_VERSION})`);
        }
    } catch (e) {
        // version.json may not exist yet, that's fine
        console.log('ℹ️ Version check skipped (no version.json)');
    }
}

function showUpdateBanner(newVersion, changelog) {
    // Prevent duplicate banners
    if (document.getElementById('update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
        <div style="
            position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
            background: #1e293b; color: white; padding: 1rem 1.5rem; border-radius: 1rem;
            display: flex; align-items: center; gap: 1rem; z-index: 10000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 420px; width: calc(100% - 2rem);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        ">
            <span class="material-symbols-outlined" style="font-size: 1.5rem; color: #22c55e;">system_update</span>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 0.9rem;">พบเวอร์ชันใหม่ v${newVersion}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${changelog || 'มีการปรับปรุงใหม่พร้อมให้อัปเดต'}</div>
            </div>
            <button onclick="checkForUpdate()" style="
                background: #22c55e; color: white; border: none; padding: 0.5rem 1rem;
                border-radius: 0.5rem; font-weight: 700; font-size: 0.8rem; cursor: pointer;
                white-space: nowrap;
            ">อัปเดต</button>
            <button onclick="this.closest('#update-banner').remove()" style="
                background: none; border: none; color: #64748b; cursor: pointer; padding: 0.25rem;
            ">
                <span class="material-symbols-outlined" style="font-size: 1.2rem;">close</span>
            </button>
        </div>
    `;

    // Add slide-up animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(100%); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);
}

window.checkForUpdate = checkForUpdate;
window.forceUpdate = checkForUpdate; // Alias for backward compatibility

// Check for updates 5 seconds after load, then every 5 minutes
setTimeout(autoCheckVersion, 5000);
setInterval(autoCheckVersion, 5 * 60 * 1000);

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

// Safer Back Navigation
function goBack() {
    const currentPage = AppState.currentPage;

    // If we have history, use it (but check if it's safe)
    if (history.length > 2) {
        history.back();
        return;
    }

    // Smart Fallback
    switch (currentPage) {
        case 'add':
        case 'add-select':
        case 'monitor':
        case 'reports':
        case 'tickets':
            router.navigate('/dashboard');
            break;
        case 'ticket':
            router.navigate('/tickets');
            break;
        case 'edit':
            // Go back to detail if we have ID, otherwise list
            if (AppState.selectedTicket) router.navigate('/ticket/' + AppState.selectedTicket.id);
            else router.navigate('/tickets');
            break;
        case 'report-detail':
            router.navigate('/reports');
            break;
        default:
            router.navigate('/dashboard');
    }
}
window.goBack = goBack;

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
    // If desktop (min-width 1024), toggle collapse instead of opening overlay
    if (window.innerWidth >= 1024) {
        document.body.classList.toggle('sidebar-collapsed');
        return;
    }

    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    // If desktop (min-width 1024), collapse the sidebar instead of closing overlay
    if (window.innerWidth >= 1024) {
        document.body.classList.add('sidebar-collapsed');
        return;
    }

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

    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
        // Desktop: Hide both buttons (sidebar handles navigation)
        menuBtn.style.display = 'none';
        backBtn.style.display = isSubPage ? 'flex' : 'none';
    } else {
        // Mobile: Show menu/back as appropriate
        if (isSubPage) {
            menuBtn.style.display = 'none';
            backBtn.style.display = 'flex';
        } else {
            menuBtn.style.display = 'flex';
            backBtn.style.display = 'none';
        }
    }
}

// Re-evaluate header when window resizes between mobile/desktop breakpoints
let _resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        const mainPages = ['dashboard', 'monitor', 'tickets', 'add', 'reports'];
        const isSubPage = !mainPages.includes(AppState.currentPage);
        updateHeaderNav(isSubPage);
    }, 150);
});

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

// Global Chart Toggle
window.toggleChartSeries = function (series) {
    if (!AppState.chartVisibility) {
        AppState.chartVisibility = { new: true, inProgress: true, completed: true, pending: true };
    }
    AppState.chartVisibility[series] = !AppState.chartVisibility[series];
    renderDashboard();
};

// Page Renderers
function renderDashboard() {
    updateHeaderNav(false); // Dashboard is main page
    console.log('------------------------------------------');
    console.log('🏠 กำลังแสดงผล Dashboard (หน้าหลัก)...');
    AppState.currentPage = 'dashboard';
    updateActiveNavItem('dashboard');

    document.getElementById('page-title').textContent = 'TICKET DASHBOARD';

    // Initialize period and default to month-to-date range if not set
    if (!AppState.dashboardPeriod || AppState.dashboardPeriod !== 'CUSTOM') {
        AppState.dashboardPeriod = 'CUSTOM';
    }

    if (!AppState.customStartDate || !AppState.customEndDate) {
        const end = new Date();
        const start = new Date();
        start.setDate(1); // Set to 1st of current month
        AppState.customStartDate = formatDateLocal(start);
        AppState.customEndDate = formatDateLocal(end);
    }

    const stats = getStatsForPeriod(AppState.dashboardPeriod, AppState.selectedDate);

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="stats-compact-row desktop-3-col">
            
            <div class="stat-card yellow">
                <div style="position: relative; z-index: 10;">
                    <p class="stat-card-label">ทิคเก็ตใหม่</p>
                    <p class="stat-card-value">${stats.new}</p>
                </div>
                <span class="material-symbols-outlined stat-card-icon">fiber_new</span>
            </div>

            <div class="stat-card purple">
                <div style="position: relative; z-index: 10;">
                    <p class="stat-card-label">ระหว่างดำเนินการ</p>
                    <p class="stat-card-value">${stats.inProgress}</p>
                </div>
                <span class="material-symbols-outlined stat-card-icon">settings_suggest</span>
            </div>

            <div class="stat-card pink">
                <div style="position: relative; z-index: 10;">
                    <p class="stat-card-label">งานเร่งด่วน</p>
                    <p class="stat-card-value">${stats.urgent}</p>
                </div>
                <span class="material-symbols-outlined stat-card-icon">warning</span>
            </div>

        </div>
        
        <div class="dashboard-container">
            <!-- Chart Card (Large) -->
            <div class="col-span-12">
                <div class="chart-card" style="width: 100%; max-width: 100%;">
                <div class="chart-header" style="margin-bottom: 1rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 0.75rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 1.35rem;">analytics</span>
                        รายงานจำนวนทิคเก็ตสะสม
                    </h2>
                    
                    <div class="custom-date-range" style="width: 100%; max-width: 400px;">
                        <div style="position: relative;">
                            <span class="material-symbols-outlined" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.25rem; pointer-events: none;">calendar_month</span>
                            <input type="text" id="date-range-picker" readonly 
                                placeholder="เลือกช่วงเวลา..."
                                style="width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border: 1.5px solid #e2e8f0; border-radius: 1.25rem; font-family: 'Kanit', sans-serif; font-size: 1rem; color:#1e293b; outline: none; background: white; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;">
                        </div>
                    </div>
                </div>

                ${generateChartSVG(AppState.dashboardPeriod, AppState.selectedDate, true)}
                
                <div class="chart-legend" style="display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
                    <div class="chart-legend-item" onclick="toggleChartSeries('new')" style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; opacity: ${!AppState.chartVisibility || AppState.chartVisibility.new ? '1' : '0.4'}; transition: opacity 0.2s;">
                        <div class="chart-legend-color" style="width: 1.25rem; height: 1.25rem; background: #fbbf24; border-radius: 4px;"></div>
                        <span class="chart-legend-text" style="font-size: 0.9rem; font-weight: 600; color: #475569;">ทิคเก็ตเปิดใหม่</span>
                    </div>
                    <div class="chart-legend-item" onclick="toggleChartSeries('inProgress')" style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; opacity: ${!AppState.chartVisibility || AppState.chartVisibility.inProgress ? '1' : '0.4'}; transition: opacity 0.2s;">
                        <div class="chart-legend-color" style="width: 1.25rem; height: 1.25rem; background: #a855f7; border-radius: 4px;"></div>
                        <span class="chart-legend-text" style="font-size: 0.9rem; font-weight: 600; color: #475569;">ระหว่างดำเนินการ</span>
                    </div>
                    <div class="chart-legend-item" onclick="toggleChartSeries('completed')" style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; opacity: ${!AppState.chartVisibility || AppState.chartVisibility.completed ? '1' : '0.4'}; transition: opacity 0.2s;">
                        <div class="chart-legend-color" style="width: 1.25rem; height: 1.25rem; background: #cbd5e1; border-radius: 4px;"></div>
                        <span class="chart-legend-text" style="font-size: 0.9rem; font-weight: 600; color: #475569;">จำนวนที่เสร็จสิ้น</span>
                    </div>
                </div>
                </div>
            </div>



            <!-- Risk Area Statistics -->
            <div class="col-span-12 md:col-span-6">
                ${renderRiskHotspotsSection()}
            </div>

            <!-- Fallen Trees Section -->
            <div class="col-span-12">
                ${renderFallenTreesSection(AppState.dashboardPeriod, AppState.selectedDate)}
            </div>
        </div>

        <!-- Floating Action Button -->
        <button class="fab-btn" onclick="router.navigate('/add')">
            <span class="fab-text">Add Ticket</span>
            <span class="material-symbols-outlined" style="font-size: 1.75rem;">add</span>
        </button>

        <div class="safe-area-bottom"></div>
    `;

    // Initialize Flatpickr for Range Selection
    setTimeout(() => {
        const picker = document.getElementById('date-range-picker');
        if (picker && typeof flatpickr !== 'undefined') {
            flatpickr(picker, {
                mode: "range",
                dateFormat: "Y-m-d",
                defaultDate: [AppState.customStartDate, AppState.customEndDate],
                locale: "th",
                onChange: function (selectedDates) {
                    if (selectedDates.length === 2) {
                        AppState.customStartDate = formatDateLocal(selectedDates[0]);
                        AppState.customEndDate = formatDateLocal(selectedDates[1]);
                        renderDashboard();
                    }
                }
            });
        }
    }, 0);



    // Add calendar functionality (Old logic - keeping if needed by other components)
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

    AppState.selectedDate = formatDateLocal(currentDate);
    renderDashboard();
}

function getStatsForPeriod(period, dateStr) {
    const date = new Date(dateStr);
    let periodTickets = [];

    // 1. Filter Tickets by Period (For 'Completed' and 'Total Intake' reference)
    if (period === 'DAY') {
        periodTickets = MOCK_DATA.tickets.filter(t => t.date.startsWith(dateStr));
    } else if (period === 'CUSTOM') {
        const start = new Date(AppState.customStartDate || new Date());
        start.setHours(0, 0, 0, 0);
        const end = new Date(AppState.customEndDate || new Date());
        end.setHours(23, 59, 59, 999);
        periodTickets = MOCK_DATA.tickets.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });
    } else if (period === 'WEEK') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        periodTickets = MOCK_DATA.tickets.filter(t => {
            const ticketDate = new Date(t.date);
            return ticketDate >= startOfWeek && ticketDate <= endOfWeek;
        });
    } else if (period === 'MONTH') {
        const year = date.getFullYear();
        const month = date.getMonth();
        periodTickets = MOCK_DATA.tickets.filter(t => {
            const ticketDate = new Date(t.date);
            return ticketDate.getFullYear() === year && ticketDate.getMonth() === month;
        });
    }

    // 2. Global Accumulation (All Time) - As requested
    // New: All time 'new'
    const newAllTime = MOCK_DATA.tickets.filter(t => t.status === 'new').length;

    // In Progress: All time 'inProgress' (User said "Everything in progress accumulated")
    const inProgressAllTime = MOCK_DATA.tickets.filter(t => t.status === 'inProgress').length;

    // Urgent: All time Urgent (Active tickets only)
    // "Both New and Doing" => active statuses
    const urgentAllTime = MOCK_DATA.tickets.filter(t =>
        t.priority === 'urgent' &&
        ['new', 'pending', 'inProgress'].includes(t.status)
    ).length;

    // Completed: Period based (Performance tracking)
    const completedPeriod = periodTickets.filter(t => t.status === 'completed').length;

    return {
        total: periodTickets.length, // Keep for chart mostly
        completed: completedPeriod,

        // Accumulated values
        new: newAllTime,
        inProgress: inProgressAllTime,
        urgent: urgentAllTime
    };
}

function getChartData(period, dateStr) {
    const data = {
        labels: [],
        series: { new: [], pending: [], completed: [], inProgress: [] }
    };
    const tickets = MOCK_DATA.tickets;
    const initArray = (len) => Array(len).fill(0);

    if (period === 'DAY') {
        const buckets = [0, 4, 8, 12, 16, 20, 24];
        data.labels = buckets.map(h => `${h.toString().padStart(2, '0')}:00`);
        const len = buckets.length;
        data.series.new = initArray(len);
        data.series.pending = initArray(len);
        data.series.completed = initArray(len);
        data.series.inProgress = initArray(len);

        const dayTickets = tickets.filter(t => t.date.startsWith(dateStr));
        dayTickets.forEach(t => {
            const h = new Date(t.date).getHours();
            const idx = Math.floor(h / 4);
            if (t.status === 'new') data.series.new[idx]++;
            else if (t.status === 'completed') data.series.completed[idx]++;
            else if (t.status === 'inProgress') data.series.inProgress[idx]++;
            else data.series.pending[idx]++; // pending
        });
    } else if (period === 'WEEK') {
        const d = new Date(dateStr);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        data.labels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        const len = 7;
        data.series.new = initArray(len);
        data.series.completed = initArray(len);
        data.series.inProgress = initArray(len);

        const weekTickets = tickets.filter(t => { const td = new Date(t.date); return td >= startOfWeek && td < endOfWeek; });
        weekTickets.forEach(t => {
            const idx = new Date(t.date).getDay();
            if (t.status === 'new') data.series.new[idx]++;
            else if (t.status === 'completed') data.series.completed[idx]++;
            else if (t.status === 'inProgress') data.series.inProgress[idx]++;
        });
    } else if (period === 'MONTH') {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = d.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            if (i === 1 || i % 5 === 0 || i === daysInMonth) data.labels.push(i.toString());
            else data.labels.push('');
        }

        const len = daysInMonth;
        data.series.new = initArray(len);
        data.series.completed = initArray(len);
        data.series.inProgress = initArray(len);

        const monthTickets = tickets.filter(t => { const td = new Date(t.date); return td.getFullYear() === year && td.getMonth() === month; });
        monthTickets.forEach(t => {
            const idx = new Date(t.date).getDate() - 1;
            if (t.status === 'new') data.series.new[idx]++;
            else if (t.status === 'completed') data.series.completed[idx]++;
            else if (t.status === 'inProgress') data.series.inProgress[idx]++;
        });
    } else if (period === 'CUSTOM') {
        const start = new Date(AppState.customStartDate || new Date());
        const end = new Date(AppState.customEndDate || new Date());
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);

        const oneDay = 1000 * 60 * 60 * 24;
        const daysDiff = Math.max(1, Math.ceil((end - start) / oneDay));
        const len = daysDiff + 1;

        data.series.new = initArray(len);
        data.series.completed = initArray(len);
        data.series.inProgress = initArray(len);

        for (let i = 0; i < len; i++) {
            const curr = new Date(start);
            curr.setDate(start.getDate() + i);
            const dayStr = `${curr.getDate()}/${curr.getMonth() + 1}`;
            data.labels.push(dayStr); // Show every day label
        }

        const customTickets = tickets.filter(t => { const td = new Date(t.date); return td >= start && td <= end; });
        customTickets.forEach(t => {
            const td = new Date(t.date);
            td.setHours(0, 0, 0, 0);
            const diff = Math.round((td - start) / oneDay);
            if (diff >= 0 && diff < len) {
                if (t.status === 'new') data.series.new[diff]++;
                else if (t.status === 'completed') data.series.completed[diff]++;
                else if (t.status === 'inProgress') data.series.inProgress[diff]++;
            }
        });
    }
    return data;
}

function generateChartSVG(period, dateStr, isLarge = false) {
    const data = getChartData(period, dateStr);
    const height = isLarge ? 280 : 200; // Increased height for Enterprise UI look
    const width = isLarge ? 1000 : 400; // Fixed large ViewBox to scale naturally
    const paddingTop = 30;
    const paddingBottom = 60; // Extra room for rotated labels
    const paddingLeft = 10;
    const paddingRight = 10;
    const chartHeight = height - paddingTop - paddingBottom;

    if (!AppState.chartVisibility) {
        AppState.chartVisibility = { new: true, inProgress: true, completed: true };
    }
    const vis = AppState.chartVisibility;

    // Scale
    let allVals = [];
    if (vis.new) allVals.push(...data.series.new);
    if (vis.inProgress) allVals.push(...data.series.inProgress);
    if (vis.completed) allVals.push(...data.series.completed);

    const maxVal = Math.max(...allVals, 5);

    const itemCount = data.labels.length;
    const availableWidth = width - paddingLeft - paddingRight;
    const itemWidth = availableWidth / itemCount;

    const visibleCount = (vis.new ? 1 : 0) + (vis.inProgress ? 1 : 0) + (vis.completed ? 1 : 0);
    const actualBarCount = visibleCount || 1;

    // 3 Bars theoretically: New, In Progress, Completed
    const barGroupWidth = isLarge ? Math.min(itemWidth * 0.85, 60) : itemWidth * 0.8;
    const singleBarWidth = Math.max((barGroupWidth / actualBarCount) - 1, 1); // Ensure at least 1px width
    const gap = (itemWidth - barGroupWidth) / 2;

    let svgContent = '';

    // Grid Lines (Subtle Enterprise Style)
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
        const val = (maxVal / gridCount) * i;
        const y = height - paddingBottom - ((val / maxVal) * chartHeight);
        svgContent += `<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />`;
    }

    // Bars
    data.labels.forEach((label, i) => {
        const xBase = paddingLeft + (i * itemWidth) + gap;
        let currentBarIdx = 0;

        // 1. New (Yellow)
        if (vis.new) {
            const h1 = (data.series.new[i] / maxVal) * chartHeight;
            const y1 = height - paddingBottom - h1;
            if (h1 > 0) svgContent += `<rect x="${xBase + (singleBarWidth + 1) * currentBarIdx}" y="${y1}" width="${singleBarWidth}" height="${h1}" fill="#fbbf24" rx="${isLarge ? 4 : 2}" />`;
            currentBarIdx++;
        }

        // 2. In Progress (Purple)
        if (vis.inProgress) {
            const hProg = (data.series.inProgress[i] / maxVal) * chartHeight;
            const yProg = height - paddingBottom - hProg;
            if (hProg > 0) svgContent += `<rect x="${xBase + (singleBarWidth + 1) * currentBarIdx}" y="${yProg}" width="${singleBarWidth}" height="${hProg}" fill="#a855f7" rx="${isLarge ? 4 : 2}" />`;
            currentBarIdx++;
        }

        // 3. Completed (Gray)
        if (vis.completed) {
            const h3 = (data.series.completed[i] / maxVal) * chartHeight;
            const y3 = height - paddingBottom - h3;
            if (h3 > 0) svgContent += `<rect x="${xBase + (singleBarWidth + 1) * currentBarIdx}" y="${y3}" width="${singleBarWidth}" height="${h3}" fill="#cbd5e1" rx="${isLarge ? 4 : 2}" />`;
            currentBarIdx++;
        }

        // Label (Enterprise style rotated)
        if (label) {
            svgContent += `<text transform="translate(${xBase + barGroupWidth / 2}, ${height - paddingBottom + 15}) rotate(-45)" font-size="${isLarge ? 11 : 9}" fill="#64748b" text-anchor="end" font-family="sans-serif" font-weight="500">${label}</text>`;
        }
    });

    return `
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">
            ${svgContent}
        </svg>
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
    updateHeaderNav(false); // Monitor is a main page
    console.log('------------------------------------------');
    console.log('👀 กำลังแสดงผล Garden Monitor (ติดตามงาน)...');
    AppState.currentPage = 'monitor';
    updateActiveNavItem('monitor');

    document.getElementById('page-title').textContent = 'GARDEN MONITOR';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Monitor Toolbar (Unified) -->
        <div class="ticket-toolbar">
            <!-- Search Box -->
            <div class="search-box">
                <span class="material-symbols-outlined icon">search</span>
                <input type="text" id="search-input" placeholder="ค้นหาทิคเก็ต..." value="">
            </div>

            <!-- Status Filter -->
            <div class="filter-dropdown-container">
                <button id="status-filter-trigger" class="filter-chip-btn">
                     <span class="material-symbols-outlined chip-icon" style="color: var(--primary);">filter_list</span>
                     <div class="chip-info">
                         <span class="chip-label">สถานะ</span>
                         <span id="status-filter-label" class="chip-value">ทั้งหมด</span>
                     </div>
                     <span class="material-symbols-outlined chip-arrow">expand_more</span>
                </button>
                <div id="status-dropdown-menu" class="filter-dropdown-menu"></div>
            </div>

            <!-- Priority Filter -->
            <div class="filter-dropdown-container">
                <button id="priority-filter-trigger" class="filter-chip-btn">
                     <span class="material-symbols-outlined chip-icon" style="color: #ef4444;">flag</span>
                     <div class="chip-info">
                         <span class="chip-label">ความเร่งด่วน</span>
                         <span id="priority-filter-label" class="chip-value">ทั้งหมด</span>
                     </div>
                     <span class="material-symbols-outlined chip-arrow">expand_more</span>
                </button>
                <div id="priority-dropdown-menu" class="filter-dropdown-menu"></div>
            </div>

            <!-- View Switcher (Right Aligned) -->
            <div class="view-switcher" style="margin-left: auto;">
                <button id="view-list-btn" class="view-btn"> <span class="material-symbols-outlined">view_list</span> </button>
                <button id="view-grid-btn" class="view-btn"> <span class="material-symbols-outlined">grid_view</span> </button>
            </div>
        </div>

        <!-- Ticket Count -->
        <div style="padding: 0 1.5rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;" id="monitor-count"></p>
        </div>

        <!-- Table Header -->
        <div class="monitor-header" style="
            display: grid;
            grid-template-columns: 80px 1fr 140px 140px;
            gap: 1.5rem;
            padding: 0 1.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.75rem;
        ">
            <div style="padding-left: 0;">รหัส</div>
            <div>รายละเอียดงาน</div>
            <div style="text-align: center;">สถานะ</div>
            <div style="text-align: right;">วันที่ / เวลา</div>
        </div>

        <!-- Ticket List -->
        <div class="ticket-list pb-safe" id="ticket-list">
            <!-- Content rendered by JS -->
        </div>
    `;

    // --- Logic ---
    const searchInput = document.getElementById('search-input');
    const countLabel = document.getElementById('monitor-count');
    const viewListBtn = document.getElementById('view-list-btn');
    const viewGridBtn = document.getElementById('view-grid-btn');
    const listContainer = document.getElementById('ticket-list');

    // View Switching
    function setView(view) {
        if (view === 'grid') {
            listContainer.classList.add('grid-view');
            viewGridBtn.classList.add('active');
            viewListBtn.classList.remove('active');
            AppState.monitorViewMode = 'grid';
        } else {
            listContainer.classList.remove('grid-view');
            viewListBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            AppState.monitorViewMode = 'list';
        }
    }

    viewListBtn.addEventListener('click', () => setView('list'));
    viewGridBtn.addEventListener('click', () => setView('grid'));

    // Default View
    // Default View: List for Desktop, Grid for Mobile
    if (!AppState.monitorViewMode) {
        AppState.monitorViewMode = window.innerWidth >= 768 ? 'list' : 'grid';
    }
    setView(AppState.monitorViewMode);

    // Filters State
    let selectedStatuses = ['new', 'inProgress', 'completed']; // Default all
    let selectedPriorities = ['urgent', 'not-urgent']; // Default all

    // --- Generic Multi-Select Helper (Duplicated for Safety) ---
    function setupMultiSelect(triggerId, menuId, labelId, getItems, selectedValues, onUpdate) {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);
        const labelEl = document.getElementById(labelId);

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasShown = menu.classList.contains('show');
            document.querySelectorAll('.filter-dropdown-menu.show').forEach(el => el.classList.remove('show'));
            if (!wasShown) {
                menu.classList.add('show');
                renderItems();
            }
        });

        function renderItems() {
            const items = getItems();
            menu.innerHTML = items.map(item => {
                const isSelected = selectedValues.includes(item.id);
                return `
                    <div class="filter-dropdown-item ${isSelected ? 'selected' : ''}" data-value="${item.id}">
                        <div class="checkbox-circle">
                            <span class="material-symbols-outlined">check</span>
                        </div>
                        <span>${item.label}</span>
                        <span class="filter-dropdown-count">${item.count}</span>
                    </div>
                `;
            }).join('');

            menu.querySelectorAll('.filter-dropdown-item').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = el.dataset.value;
                    const idx = selectedValues.indexOf(val);
                    if (idx > -1) selectedValues.splice(idx, 1);
                    else selectedValues.push(val);

                    renderItems();
                    updateLabel(items.length);
                    onUpdate();
                });
            });
        }

        function updateLabel(totalItems) {
            const total = totalItems || getItems().length;
            if (selectedValues.length === total && total > 0) {
                labelEl.textContent = 'ทั้งหมด';
            } else if (selectedValues.length === 0) {
                labelEl.textContent = 'ไม่ได้เลือก';
            } else {
                labelEl.textContent = `เลือกแล้ว ${selectedValues.length} รายการ`;
            }
        }

        return () => {
            const items = getItems();
            updateLabel(items.length);
            if (menu.classList.contains('show')) renderItems();
        };
    }

    // Global Closer
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown-container')) {
            document.querySelectorAll('.filter-dropdown-menu.show').forEach(el => el.classList.remove('show'));
        }
    });

    // Initialize Status
    const updateStatusUI = setupMultiSelect(
        'status-filter-trigger', 'status-dropdown-menu', 'status-filter-label',
        () => {
            const counts = { new: 0, inProgress: 0, completed: 0 };
            MOCK_DATA.tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++ });
            return [
                { id: 'new', label: 'ทิคเก็ตใหม่', count: counts.new },
                { id: 'inProgress', label: 'กำลังดำเนินการ', count: counts.inProgress },
                { id: 'completed', label: 'เสร็จสิ้น', count: counts.completed }
            ];
        },
        selectedStatuses,
        applyFilters
    );
    updateStatusUI();

    // Initialize Priority
    const updatePriorityUI = setupMultiSelect(
        'priority-filter-trigger', 'priority-dropdown-menu', 'priority-filter-label',
        () => {
            const counts = { urgent: 0, 'not-urgent': 0 };
            MOCK_DATA.tickets.forEach(t => {
                const key = t.priority === 'urgent' ? 'urgent' : 'not-urgent';
                counts[key]++;
            });
            return [
                { id: 'urgent', label: 'เร่งด่วน', count: counts.urgent },
                { id: 'not-urgent', label: 'ไม่เร่งด่วน', count: counts.not_urgent || counts['not-urgent'] }
            ];
        },
        selectedPriorities,
        applyFilters
    );
    updatePriorityUI();

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        let filtered = [...MOCK_DATA.tickets];

        // 1. Status Filter
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(t => selectedStatuses.includes(t.status));
        } else {
            filtered = [];
        }

        // 2. Priority Filter
        if (selectedPriorities.length > 0) {
            filtered = filtered.filter(t => {
                const p = t.priority === 'urgent' ? 'urgent' : 'not-urgent';
                return selectedPriorities.includes(p);
            });
        } else {
            filtered = [];
        }

        // 3. Search Filter
        if (query) {
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.zoneName.toLowerCase().includes(query) ||
                t.id.toString().includes(query) ||
                (t.treeType && t.treeType.toLowerCase().includes(query)) ||
                (t.operation && t.operation.toLowerCase().includes(query)) ||
                (t.locationDetail && t.locationDetail.toLowerCase().includes(query)) ||
                (t.notes && t.notes.toLowerCase().includes(query))
            );
        }

        // 4. Sorting (Fixed to Latest)
        filtered.sort((a, b) => b.id - a.id);

        // Render
        const listEl = document.getElementById('ticket-list');
        if (filtered.length > 0) {
            // Using monitorCard for Monitor view
            listEl.innerHTML = filtered.map(ticket => Components.monitorCard(ticket)).join('');
        } else {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <span class="material-symbols-outlined" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;">inbox</span>
                    <p style="font-size: 1.1rem; font-weight: 500;">ไม่พบรายการทิคเก็ต</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">ลองปรับตัวกรองหรือค้นหาใหม่</p>
                </div>
            `;
        }

        // Update Count
        countLabel.textContent = `แสดง ${filtered.length} รายการ`;
    }

    searchInput.addEventListener('input', applyFilters);
    applyFilters();
}

function renderTicketList() {
    updateHeaderNav(false); // Ticket List is a main page (accessible from sidebar nav)
    console.log('------------------------------------------');
    console.log('📋 กำลังแสดงผล Ticket List (รายการทั้งหมด)...');
    AppState.currentPage = 'tickets';
    updateActiveNavItem('tickets');

    document.getElementById('page-title').textContent = 'TICKET LISTS';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Ticket Toolbar (Unified) -->
        <div class="ticket-toolbar">
            <!-- Search Box -->
            <div class="search-box">
                <span class="material-symbols-outlined icon">search</span>
                <input type="text" id="search-input" placeholder="ค้นหาทิคเก็ต..." value="">
            </div>

            <!-- Status Filter -->
            <div class="filter-dropdown-container">
                <button id="status-filter-trigger" class="filter-chip-btn">
                     <span class="material-symbols-outlined chip-icon" style="color: var(--primary);">filter_list</span>
                     <div class="chip-info">
                         <span class="chip-label">สถานะ</span>
                         <span id="status-filter-label" class="chip-value">ทั้งหมด</span>
                     </div>
                     <span class="material-symbols-outlined chip-arrow">expand_more</span>
                </button>
                <div id="status-dropdown-menu" class="filter-dropdown-menu"></div>
            </div>

            <!-- Priority Filter -->
            <div class="filter-dropdown-container">
                <button id="priority-filter-trigger" class="filter-chip-btn">
                     <span class="material-symbols-outlined chip-icon" style="color: #ef4444;">flag</span>
                     <div class="chip-info">
                         <span class="chip-label">ความเร่งด่วน</span>
                         <span id="priority-filter-label" class="chip-value">ทั้งหมด</span>
                     </div>
                     <span class="material-symbols-outlined chip-arrow">expand_more</span>
                </button>
                <div id="priority-dropdown-menu" class="filter-dropdown-menu"></div>
            </div>

            <!-- View Switcher -->
            <div class="view-switcher" style="margin-left: auto;">
                <button id="view-list-btn" class="view-btn"> <span class="material-symbols-outlined">view_list</span> </button>
                <button id="view-grid-btn" class="view-btn"> <span class="material-symbols-outlined">grid_view</span> </button>
            </div>
        </div>

        <!-- Ticket Count -->
        <div style="padding: 0 1.5rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;" id="list-count"></p>
        </div>

        <!-- Desktop Table Header -->
        <div class="ticket-list-header">
            <div class="tlh-thumb"></div>
            <div class="tlh-info">รายละเอียดงาน</div>
            <div class="tlh-meta">สถานะ</div>
            <div class="tlh-date">วันที่ / เวลา</div>
            <div class="tlh-action"></div>
        </div>

        <!-- Ticket List -->
        <div class="ticket-list" id="ticket-list" style="margin-bottom: 0;">
            <!-- Content rendered by JS -->
        </div>

        <!-- Standard Table Pagination -->
        <div class="table-pagination">
            <div class="rows-per-page">
                <span>แสดงหน้าละ:</span>
                <select id="rows-per-page-select" class="rows-select">
                    <option value="10" ${AppState.ticketsPerPage == 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${AppState.ticketsPerPage == 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${AppState.ticketsPerPage == 50 ? 'selected' : ''}>50</option>
                </select>
                <span>รายการ</span>
            </div>
            
            <div class="pagination-controls">
                <div class="pagination-info" id="pagination-info" style="margin-right: 1rem;">แสดง - จาก -</div>
                <button class="pagination-btn" id="prev-page-btn">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <div id="page-numbers" style="display: flex; gap: 0.25rem;"></div>
                <button class="pagination-btn" id="next-page-btn">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </div>

        <!-- Floating Action Button -->
        <button class="fab-btn" onclick="router.navigate('/add')">
            <span class="fab-text">แจ้งปัญหาใหม่</span>
            <span class="material-symbols-outlined" style="font-size: 1.75rem;">add</span>
        </button>
    `;

    // --- Logic ---
    // --- Logic ---
    const searchInput = document.getElementById('search-input');
    const countLabel = document.getElementById('list-count');
    const viewListBtn = document.getElementById('view-list-btn');
    const viewGridBtn = document.getElementById('view-grid-btn');
    const listContainer = document.getElementById('ticket-list');

    // View Switching
    const tableHeader = document.querySelector('.ticket-list-header');
    function setView(view) {
        if (view === 'grid') {
            listContainer.classList.add('grid-view');
            viewGridBtn.classList.add('active');
            viewListBtn.classList.remove('active');
            AppState.ticketViewMode = 'grid';
            // Must use !important to override CSS media query's display: grid !important
            if (tableHeader) tableHeader.style.setProperty('display', 'none', 'important');
        } else {
            listContainer.classList.remove('grid-view');
            viewListBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            AppState.ticketViewMode = 'list';
            // Remove inline display so CSS media query takes over
            if (tableHeader) tableHeader.style.removeProperty('display');
        }
    }

    viewListBtn.addEventListener('click', () => setView('list'));
    viewGridBtn.addEventListener('click', () => setView('grid'));

    // Default to List View for Tickets
    // Default View: Grid for Mobile, List for Desktop if not set
    if (!AppState.ticketViewMode) {
        AppState.ticketViewMode = window.innerWidth < 768 ? 'grid' : 'list';
    }
    setView(AppState.ticketViewMode);

    // Default Filters
    let selectedStatuses = ['new', 'inProgress', 'completed'];
    let selectedPriorities = ['urgent', 'not-urgent']; // Multi-select default
    let currentSort = 'latest';

    // --- Generic Multi-Select Helper ---
    function setupMultiSelect(triggerId, menuId, labelId, getItems, selectedValues, onUpdate) {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);
        const labelEl = document.getElementById(labelId);

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasShown = menu.classList.contains('show');
            // Close all first
            document.querySelectorAll('.filter-dropdown-menu.show').forEach(el => el.classList.remove('show'));
            // Toggle current
            if (!wasShown) {
                menu.classList.add('show');
                renderItems();
            }
        });

        function renderItems() {
            const items = getItems();
            menu.innerHTML = items.map(item => {
                const isSelected = selectedValues.includes(item.id);
                return `
                    <div class="filter-dropdown-item ${isSelected ? 'selected' : ''}" data-value="${item.id}">
                        <div class="checkbox-circle">
                            <span class="material-symbols-outlined">check</span>
                        </div>
                        <span>${item.label}</span>
                        <span class="filter-dropdown-count">${item.count}</span>
                    </div>
                `;
            }).join('');

            menu.querySelectorAll('.filter-dropdown-item').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = el.dataset.value;
                    const idx = selectedValues.indexOf(val);
                    if (idx > -1) selectedValues.splice(idx, 1);
                    else selectedValues.push(val);

                    renderItems();
                    updateLabel(items.length);
                    onUpdate();
                });
            });
        }

        function updateLabel(totalItems) {
            // Need total items count. If not passed, we might assume from last render or call getItems().
            // getItems is cheap.
            const total = totalItems || getItems().length;

            if (selectedValues.length === total && total > 0) {
                labelEl.textContent = 'ทั้งหมด';
            } else if (selectedValues.length === 0) {
                labelEl.textContent = 'ไม่ได้เลือก';
            } else {
                labelEl.textContent = `เลือกแล้ว ${selectedValues.length} รายการ`;
            }
        }

        // Return update function to call externally if data changes (e.g. counts)
        return () => {
            const items = getItems();
            updateLabel(items.length);
            if (menu.classList.contains('show')) renderItems();
        };
    }

    // Global Closer
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown-container')) {
            document.querySelectorAll('.filter-dropdown-menu.show').forEach(el => el.classList.remove('show'));
        }
    });

    // Initialize Status Dropdown
    const updateStatusUI = setupMultiSelect(
        'status-filter-trigger', 'status-dropdown-menu', 'status-filter-label',
        () => {
            const counts = { new: 0, inProgress: 0, completed: 0 };
            MOCK_DATA.tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++ });
            return [
                { id: 'new', label: 'ทิคเก็ตใหม่', count: counts.new },
                { id: 'inProgress', label: 'กำลังดำเนินการ', count: counts.inProgress },
                { id: 'completed', label: 'เสร็จสิ้น', count: counts.completed }
            ];
        },
        selectedStatuses,
        applyFilters
    );
    updateStatusUI(); // Initial label set

    // Initialize Priority Dropdown
    const updatePriorityUI = setupMultiSelect(
        'priority-filter-trigger', 'priority-dropdown-menu', 'priority-filter-label',
        () => {
            const counts = { urgent: 0, 'not-urgent': 0 };
            MOCK_DATA.tickets.forEach(t => {
                const key = t.priority === 'urgent' ? 'urgent' : 'not-urgent';
                counts[key]++;
            });
            return [
                { id: 'urgent', label: 'เร่งด่วน', count: counts.urgent },
                { id: 'not-urgent', label: 'ไม่เร่งด่วน', count: counts.not_urgent || counts['not-urgent'] }
            ];
        },
        selectedPriorities,
        applyFilters
    );
    updatePriorityUI();


    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        let filtered = [...MOCK_DATA.tickets]; // Copy

        // 1. Status Filter (Multi-Select)
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(t => selectedStatuses.includes(t.status));
        } else {
            filtered = [];
        }

        // 2. Priority Filter (Multi-Select)
        if (selectedPriorities.length > 0) {
            filtered = filtered.filter(t => {
                const p = t.priority === 'urgent' ? 'urgent' : 'not-urgent';
                return selectedPriorities.includes(p);
            });
        } else {
            filtered = [];
        }

        // 3. Search Filter
        if (query) {
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.zoneName.toLowerCase().includes(query) ||
                t.id.toString().includes(query) ||
                (t.treeType && t.treeType.toLowerCase().includes(query)) ||
                (t.operation && t.operation.toLowerCase().includes(query)) ||
                (t.assignees && t.assignees.join(' ').toLowerCase().includes(query)) ||
                (t.locationDetail && t.locationDetail.toLowerCase().includes(query)) ||
                (t.notes && t.notes.toLowerCase().includes(query))
            );
        }

        // 4. Sorting
        filtered.sort((a, b) => {
            if (currentSort === 'latest') { // Newest ID/Date first
                return b.id - a.id;
            } else if (currentSort === 'oldest') {
                return a.id - b.id;
            } else if (currentSort === 'priority') {
                // Urgent first, then latest
                if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
                return b.id - a.id;
            }
            return 0;
        });

        // Render
        const listEl = document.getElementById('ticket-list');
        const rowsSelect = document.getElementById('rows-per-page-select');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const infoEl = document.getElementById('pagination-info');
        const pageNumbersEl = document.getElementById('page-numbers');

        // Pagination Logic
        const total = filtered.length;
        const totalPages = Math.ceil(total / AppState.ticketsPerPage);

        // Safety check for current page
        if (AppState.ticketsPage > totalPages) AppState.ticketsPage = Math.max(1, totalPages);

        const startIdx = (AppState.ticketsPage - 1) * AppState.ticketsPerPage;
        const endIdx = Math.min(startIdx + AppState.ticketsPerPage, total);
        const pagedData = filtered.slice(startIdx, endIdx);

        if (pagedData.length > 0) {
            listEl.innerHTML = pagedData.map(ticket => Components.ticketCard(ticket)).join('');
        } else {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <span class="material-symbols-outlined" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;">inbox</span>
                    <p style="font-size: 1.1rem; font-weight: 500;">ไม่พบรายการทิคเก็ต</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">ลองปรับตัวกรองหรือค้นหาใหม่</p>
                </div>
            `;
        }

        // --- Update Pagination UI ---
        infoEl.textContent = total > 0 ? `แสดง ${startIdx + 1}-${endIdx} จาก ${total} รายการ` : 'ไม่พบรายการ';
        prevBtn.disabled = AppState.ticketsPage <= 1;
        nextBtn.disabled = AppState.ticketsPage >= totalPages;

        // Render Page Numbers (Show current and neighbor pages)
        let pageHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= AppState.ticketsPage - 1 && i <= AppState.ticketsPage + 1)) {
                pageHtml += `<button class="pagination-btn ${i === AppState.ticketsPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === AppState.ticketsPage - 2 || i === AppState.ticketsPage + 2) {
                pageHtml += `<span style="padding: 0 0.5rem; color: #94a3b8;">...</span>`;
            }
        }
        pageNumbersEl.innerHTML = pageHtml;

        // Page Selectors Listeners
        pageNumbersEl.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.onclick = () => {
                AppState.ticketsPage = parseInt(btn.dataset.page);
                applyFilters();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        });

        // Update Count label at top
        countLabel.textContent = `พบทั้งหมด ${total} รายการ`;
    }

    // Pagination Controls Setup
    const rowsSelect = document.getElementById('rows-per-page-select');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    rowsSelect.onchange = (e) => {
        AppState.ticketsPerPage = parseInt(e.target.value);
        AppState.ticketsPage = 1;
        applyFilters();
    };

    prevBtn.onclick = () => {
        if (AppState.ticketsPage > 1) {
            AppState.ticketsPage--;
            applyFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    nextBtn.onclick = () => {
        AppState.ticketsPage++;
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    searchInput.addEventListener('input', () => {
        AppState.ticketsPage = 1; // Reset to page 1 on search
        applyFilters();
    });

    // Initial Render
    applyFilters();
}

function renderTicketDetail(params) {
    updateHeaderNav(true);
    const ticketId = params[0] ? parseInt(params[0]) : null;
    const ticket = MOCK_DATA.tickets.find(t => t.id === ticketId);

    if (!ticket) {
        router.navigate('/tickets');
        return;
    }

    AppState.selectedTicket = ticket;
    document.getElementById('page-title').textContent = 'TICKET DETAILS';

    // No longer building ticketNameStr as we use ticket.title directly

    // Helpers for Tags
    const getStatusTagClass = (s) => {
        if (s === 'new') return 'warning';
        if (s === 'inProgress') return 'primary';
        if (s === 'completed') return 'success';
        return 'neutral';
    };
    const getStatusLabel = (s) => {
        if (s === 'new') return 'ทิคเก็ตใหม่';
        if (s === 'inProgress') return 'กำลังดำเนินการ';
        if (s === 'completed') return 'เสร็จสิ้น';
        return s;
    };

    const content = document.getElementById('main-content');

    const renderImages = (imgs) => {
        if (!imgs || imgs.length === 0) return '<div class="detail-value" style="color: #cbd5e1; font-style: italic;">- ไม่มีรูปภาพ -</div>';
        return `<div class="image-grid-view">
            ${imgs.map(url => `<img src="${url}" onclick="window.open('${url}', '_blank')">`).join('')}
        </div>`;
    };

    content.innerHTML = `
        <div class="edit-ticket-container" style="padding: 1rem; max-width: 900px; margin: 0 auto;">
            
            <!-- Single Consolidated Card -->
            <div class="detail-card">
                
                <!-- HEADER: Title & Tags -->
                <div class="detail-header-title">
                    ${ticket.title}
                </div>
                
                <!-- HEADER: Tags -->
                <div class="tag-row">
                    <span class="detail-tag neutral">Ticket #${ticket.id}</span>
                    <span class="detail-tag ${getStatusTagClass(ticket.status)}">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">info</span>
                        ${getStatusLabel(ticket.status)}
                    </span>
                    ${ticket.priority === 'urgent'
            ? `<span class="detail-tag urgent"><span class="material-symbols-outlined" style="font-size: 1rem;">warning</span> เร่งด่วน</span>`
            : `<span class="detail-tag neutral">ไม่เร่งด่วน</span>`
        }
                    <span class="detail-tag outline">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">forest</span>
                        ${getDamageTypeName(ticket.damageType || ticket.category)}
                    </span>
                    <span class="detail-tag outline">
                         <span class="material-symbols-outlined" style="font-size: 1rem;">location_on</span>
                         ${ticket.zoneName || 'ไม่ระบุโซน'}
                    </span>
                </div>

                <!-- MAIN INFO GRID -->
                <div class="detail-grid-compact">
                    <!-- Left Column -->
                    <div>
                        <div class="detail-group">
                            <label class="detail-label">สถานที่เกิดเหตุ (จุดสังเกต)</label>
                            <div class="detail-value">${ticket.locationDetail || '-'}</div>
                        </div>
                        <!-- Damage type description is now only in the tag row -->
                        <div class="detail-group">
                            <label class="detail-label">ผลกระทบที่ได้รับ</label>
                            <div class="detail-value">${ticket.impact || '-'}</div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div>
                        <div class="detail-group">
                            <label class="detail-label">ชนิดพันธุ์ต้นไม้</label>
                            <div class="detail-value">${ticket.treeType || '-'}</div>
                        </div>
                        <div class="grid-2-col" style="gap: 1rem; margin-bottom: 1.25rem;">
                             <div class="detail-group" style="margin-bottom: 0;">
                                <label class="detail-label">ขนาดลำต้น (นิ้ว)</label>
                                <div class="detail-value">${ticket.circumference || '-'}</div>
                            </div>
                             <div class="detail-group" style="margin-bottom: 0;">
                                <label class="detail-label">จำนวน (ต้น)</label>
                                <div class="detail-value">${ticket.quantity || '-'}</div>
                            </div>
                        </div>
                        <div class="detail-group">
                            <label class="detail-label">ผู้รับผิดชอบ</label>
                            <div class="detail-value">
                                ${ticket.assignees && ticket.assignees.length > 0
            ? `<div class="assignee-list">${ticket.assignees.map(a => `<span class="assignee-chip" style="padding-right: 0.6rem; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">${a}</span>`).join('')}</div>`
            : '- ยังไม่ระบุ -'}
                            </div>
                        </div> 
                    </div>
                </div>

                <div class="detail-divider"></div>

                <!-- IMAGES SECTION -->
                <div class="detail-section-label">หลักฐานและรูปภาพ</div>
                <div class="detail-grid-compact">
                    <div class="detail-group">
                        <label class="detail-label">รูปภาพก่อนดำเนินการ</label>
                        ${renderImages(ticket.images)}
                    </div>
                    <div class="detail-group">
                        <label class="detail-label">รูปภาพระหว่างดำเนินการ</label>
                        ${renderImages(ticket.progressImages || [])}
                    </div>
                </div>

                <div class="detail-divider"></div>

                <!-- OPERATION & MANAGEMENT -->
                <div class="detail-section-label">การดำเนินงาน & สถานะ</div>
                <div class="detail-grid-compact">
                    <div>
                        ${ticket.status !== 'completed' ? `
                         <div class="detail-group">
                            <label class="detail-label">ขั้นตอนการดำเนินงาน</label>
                            <div class="detail-value">${ticket.operation || '-'}</div>
                        </div>
                        ` : ''}
                        <div class="detail-group">
                            <label class="detail-label">หมายเหตุ</label>
                            <div class="detail-value">${ticket.notes || '-'}</div>
                        </div>
                    </div>
                    <div>
                         <div class="detail-group">
                            <label class="detail-label">พิกัดสถานที่ (GPS)</label>
                            ${ticket.lat && ticket.lng ? `
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <span style="font-family: monospace; background: #f8fafc; padding: 0.25rem 0.5rem; border-radius: 0.25rem; border: 1px solid #e2e8f0;">${ticket.lat}, ${ticket.lng}</span>
                                    <a href="https://www.google.com/maps?q=${ticket.lat},${ticket.lng}" target="_blank" class="gps-map-link">
                                        <span class="material-symbols-outlined">map</span> Map
                                    </a>
                                </div>
                            ` : '- ไม่ระบุ -'}
                        </div>
                    </div>
                </div>

            </div>
            
            <!-- Timeline (Outside Card or Inside? User asked for 'single box'. Let's keep timeline separate as it is a history log, or should we put it inside?) -->
            <!-- Usually Timeline is separate. I'll keep it separate for clarity but close. -->
            
            <div style="height: 2rem;"></div>
            ${renderTimeline(ticket)}
            <div style="height: 8rem;"></div>
        </div>

        <div class="floating-action-bar">
             <button class="btn-float" onclick="router.navigate('/edit/${ticket.id}')">
                <span class="material-symbols-outlined">edit_note</span>
                แก้ไขข้อมูล / อัปเดตงาน
            </button>
        </div>
        
        <div class="safe-area-bottom"></div>
    `;
}

function renderAddTicket() {
    updateHeaderNav(false); // Add Ticket is a main page
    AppState.currentPage = 'add';
    updateActiveNavItem('add');

    document.getElementById('page-title').textContent = 'ADD TICKET';

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div style="padding: 0 1rem;">
            <form id="ticket-form">
                <div class="form-group">
                    <label class="form-label">ลักษณะความเสียหาย <span class="required">*</span></label>
                    <div class="description-toggle" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                        <button type="button" class="desc-btn" data-value="fallen">โค่นล้ม</button>
                        <button type="button" class="desc-btn" data-value="broken">กิ่งหัก/ฉีก</button>
                        <button type="button" class="desc-btn" data-value="tilted">ลำต้นเอียง</button>
                        <button type="button" class="desc-btn" data-value="other">อื่นๆ</button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">โซนพื้นที่ <span class="required">*</span></label>
                    <select id="ticket-zone" class="form-select">
                        <option value="" disabled selected>เลือกโซน</option>
                        ${MOCK_DATA.zones.map(z => `<option value="${z.id}">${z.name.split(' (')[0]}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">สถานที่เกิดเหตุ (พิมพ์ระบุ)</label>
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
                    <label class="form-label">รูปภาพ <span class="required">*</span> <span class="image-count">(0/6)</span></label>
                    <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
                    <div class="image-grid" id="image-grid">
                        <div class="image-add" id="image-add-btn">
                            <span class="material-symbols-outlined" style="font-size: 1.5rem;">add</span>
                            <span class="label">เพิ่มรูป</span>
                        </div>
                    </div>
                </div>

                <div class="floating-action-bar">
                    <button type="submit" class="btn-float">
                        <span class="material-symbols-outlined">save</span>
                        บันทึกทิคเก็ต
                    </button>
                </div>
            </form>
            <div style="height: 6rem;"></div>
        </div>

        <div class="safe-area-bottom"></div>
    `;



    // Description toggle - Buttons
    const descBtns = content.querySelectorAll('.desc-btn');
    const customDesc = content.querySelector('#ticket-description-custom');

    descBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            descBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (this.dataset.value === 'other') {
                customDesc.style.display = 'block';
                customDesc.focus();
            } else {
                customDesc.style.display = 'none';
            }
        });
    });

    // Zone selection
    const zoneSelect = content.querySelector('#ticket-zone');
    zoneSelect.addEventListener('change', function () {
        // Zone change logic
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

        const zoneId = content.querySelector('#ticket-zone').value;
        const locationName = content.querySelector('#ticket-location-name').value.trim();
        const lat = content.querySelector('#ticket-lat').value;
        const lng = content.querySelector('#ticket-lng').value;


        // Get Damage Type
        const activeDescBtn = content.querySelector('.desc-btn.active');
        let damageType = activeDescBtn ? activeDescBtn.dataset.value : 'other';

        const damageMap = {
            'fallen': 'โค่นล้ม',
            'broken': 'กิ่งหัก/ฉีก',
            'tilted': 'ลำต้นเอียง',
            'other': 'อื่นๆ'
        };
        const damagePart = damageMap[damageType];

        const errors = [];
        if (!activeDescBtn) errors.push('ลักษณะความเสียหาย');
        if (!zoneId) errors.push('โซนพื้นที่');
        if (uploadedImages.length === 0) errors.push('รูปภาพ (อย่างน้อย 1 รูป)');

        if (errors.length > 0) {
            showPopup('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน:\n' + errors.join('\n'), 'error');
            return;
        }

        // Generate location detail

        const fullLocationDetail = locationName;

        // Create new ticket object
        const zoneObj = MOCK_DATA.zones.find(z => z.id === zoneId);
        const combinedZoneName = zoneObj?.name.split(' (')[0] || '';

        const zoneShortNameDisplay = zoneShortName ? `โซน${zoneShortName}` : '';

        let autoTitle = '';
        if (damageType === 'other') {
            const locPart = locationName ? ` (${locationName})` : '';
            autoTitle = `อื่นๆ${locPart}`;
        } else {
            autoTitle = [damagePart, zoneShortNameDisplay].filter(Boolean).join(' ');
        }

        const newTicket = {
            id: Math.floor(Math.random() * 100000), // Simple random ID
            title: autoTitle,
            description: '',
            category: damageType, // Use derived category
            status: 'new',
            priority: 'normal',
            zone: zoneId,
            zoneName: combinedZoneName,
            locationDetail: fullLocationDetail, // Set functionality string here
            lat: lat || null,
            lng: lng || null,
            treeType: '-',
            damageType: damageType,
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
    // Build timeline items, then reverse so latest is on top
    const timelineItems = [];
    const historyTimes = new Set();
    if (ticket.history && ticket.history.length > 0) {
        ticket.history.forEach(h => historyTimes.add(new Date(h.updatedAt).getTime()));
    }

    // 1. Open Info (oldest)
    let openerName = MOCK_DATA.user?.name || 'Security Guard';
    if (ticket.locationDetail && ticket.locationDetail.includes('Ticket By Name:')) {
        openerName = ticket.locationDetail.split('Ticket By Name: ')[1].split(' เมื่อ ')[0];
    }

    timelineItems.push({
        icon: 'notification_important',
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        title: `เปิดทิคเก็ตใหม่โดย ${openerName}`,
        detail: `เวลาวันที่: ${new Date(ticket.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(ticket.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
        time: new Date(ticket.date).getTime()
    });

    // 2. In Progress (only if not covered by history)
    if ((ticket.startedAt && !historyTimes.has(new Date(ticket.startedAt).getTime())) || (!ticket.startedAt && ticket.assignees && ticket.assignees.length > 0)) {
        timelineItems.push({
            icon: 'settings_suggest',
            gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            title: 'เข้าดำเนินการโดย',
            detail: `${ticket.assignees && ticket.assignees.length > 0 ? ticket.assignees.join(', ') : 'รอการมอบหมาย'}${ticket.startedAt ? `<br>เวลาวันที่: ${new Date(ticket.startedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}`,
            time: ticket.startedAt ? new Date(ticket.startedAt).getTime() : new Date(ticket.date).getTime() + 1000 // Ensure slightly above creation
        });
    }

    // 3. Completed (newest, only if not covered by history)
    if (ticket.completedAt && !historyTimes.has(new Date(ticket.completedAt).getTime())) {
        timelineItems.push({
            icon: 'task_alt',
            gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            title: 'งานเสร็จสิ้น',
            detail: `เสร็จสิ้นโดยทีมผู้รับผิดชอบ<br>เวลาวันที่: ${new Date(ticket.completedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            time: new Date(ticket.completedAt).getTime()
        });
    }

    // 4. Update History
    if (ticket.history && ticket.history.length > 0) {
        ticket.history.forEach(h => {
            let actName = h.action;
            if (actName === 'อัปเดตข้อมูลทิคเก็ต' || actName === 'อัพเดทข้อมูลทิคเก็ต') actName = 'อัปเดต';

            let icon = 'edit_note';
            let gradient = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
            let title = `${actName}${h.updatedBy ? `โดย ${h.updatedBy}` : ''}`;

            // Upgrade visual style for status changes
            if (actName.includes('เสร็จสิ้น')) {
                icon = 'task_alt';
                gradient = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
            } else if (actName.includes('กำลังดำเนินการ')) {
                icon = 'settings_suggest';
                gradient = 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)';
            } else if (actName.includes('ทิคเก็ตใหม่') || actName.includes('ใหม่')) {
                icon = 'notification_important';
                gradient = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            }

            timelineItems.push({
                icon: icon,
                gradient: gradient,
                title: title,
                detail: `เวลาวันที่: ${new Date(h.updatedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                time: new Date(h.updatedAt).getTime()
            });
        });
    } else if (ticket.impactUpdatedAt) {
        // Fallback for old mock data
        timelineItems.push({
            icon: 'edit_note',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            title: `อัปเดตผลกระทบที่ได้รับ${ticket.impactUpdatedBy ? `โดย ${ticket.impactUpdatedBy}` : ''}`,
            detail: `เวลาวันที่: ${new Date(ticket.impactUpdatedAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            time: new Date(ticket.impactUpdatedAt).getTime()
        });
    }

    // Sort by time: latest first
    timelineItems.sort((a, b) => b.time - a.time);

    // Render: first item is full color, rest are gray
    const html = timelineItems.map((item, index) => {
        const isOld = index > 0; // Not the latest item
        const gradientStyle = isOld ? 'background: #cbd5e1;' : `background: ${item.gradient};`;
        const textStyle = isOld ? 'color: #94a3b8;' : 'color: var(--text-primary);';
        const detailStyle = isOld ? 'color: #cbd5e1;' : 'color: var(--text-secondary);';

        return `
            <div style="display: flex; gap: 0.75rem; align-items: start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; ${gradientStyle} display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem; color: white;">${item.icon}</span>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; ${textStyle} margin-bottom: 0.25rem;">
                        ${item.title}
                    </div>
                    <div style="font-size: 0.8rem; ${detailStyle}">
                        ${item.detail}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
    <div style="margin: 1.5rem 0; padding: 1rem; background: var(--surface); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
        <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">
            ไทม์ไลน์ความคืบหน้า
        </h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${html}
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

    // Determine current damage type for buttons
    let currentDamageType = ticket.damageType || 'other';

    // Status: allow 'new' to be its own status now
    const currentStatus = ticket.status;

    const content = document.getElementById('main-content');

    // Construct Ticket Name: [Ticket No.] [Tree Type] [Damage] [Zone]
    const ticketParts = [
        `[#${ticket.id}]`,
        ticket.treeType && ticket.treeType !== '-' ? ticket.treeType : '',
        ticket.description || '',
        ticket.zoneName || ''
    ];
    const ticketNameStr = ticketParts.filter(Boolean).join(' · ');

    content.innerHTML = `
        <div class="edit-ticket-container" style="padding: 1rem; max-width: 800px; margin: 0 auto;">
            <form id="ticket-form">
                
                <!-- SECTION 1: ข้อมูลหลัก (Main Info) -->
                <div class="form-section-card">
                    <h3 class="section-title">ข้อมูลหลัก</h3>
                    
                    <!-- 1. Ticket Name (Text Display) -->
                    <div style="margin-bottom: 1.25rem;">
                        <label class="form-label" style="margin-bottom: 0.25rem;">Ticket Name</label>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #1e293b; line-height: 1.5; padding: 0.5rem 0;">
                            ${ticketNameStr}
                        </div>
                    </div>

                    <!-- 2. Priority -->
                    <div class="form-group">
                        <label class="form-label">ลำดับความสำคัญ <span class="required">*</span></label>
                        <div class="priority-toggle">
                            <button type="button" class="priority-btn normal ${ticket.priority !== 'urgent' ? 'active' : ''}">ไม่เร่งด่วน</button>
                            <button type="button" class="priority-btn urgent ${ticket.priority === 'urgent' ? 'active' : ''}">เร่งด่วน</button>
                        </div>
                    </div>

                    <!-- 3. ลักษณะความเสียหาย -->
                    <div class="form-group">
                        <label class="form-label">ลักษณะความเสียหาย <span class="required">*</span></label>
                        <div class="description-toggle" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                            <button type="button" class="desc-btn ${currentDamageType === 'fallen' ? 'active' : ''}" data-value="fallen">โค่นล้ม</button>
                            <button type="button" class="desc-btn ${currentDamageType === 'broken' ? 'active' : ''}" data-value="broken">กิ่งหัก/ฉีก</button>
                            <button type="button" class="desc-btn ${currentDamageType === 'tilted' ? 'active' : ''}" data-value="tilted">ลำต้นเอียง</button>
                            <button type="button" class="desc-btn ${currentDamageType === 'other' ? 'active' : ''}" data-value="other">อื่นๆ</button>
                        </div>
                    </div>

                    <!-- 4. โซนพื้นที่ -->
                    <div class="form-group">
                        <label class="form-label">โซนพื้นที่ <span class="required">*</span></label>
                        <select id="edit-ticket-zone" class="form-select">
                            <option value="" disabled>เลือกโซน</option>
                            ${MOCK_DATA.zones.map(z => `<option value="${z.id}" ${ticket.zone === z.id ? 'selected' : ''}>${z.name.split(' (')[0]}</option>`).join('')}
                        </select>
                    </div>

                    <!-- 5. สถานที่เกิดเหตุ -->
                    <div class="form-group">
                        <label class="form-label">สถานที่เกิดเหตุ</label>
                        <input type="text" id="edit-ticket-locationDetail" class="form-input" value="${ticket.locationDetail || ''}" placeholder="ระบุจุดสังเกตเพิ่มเติม...">
                    </div>

                    <!-- 6. รูปภาพก่อนดำเนินการ -->
                    <div class="form-group">
                        <label class="form-label">รูปภาพก่อนดำเนินการ <span class="image-count" id="before-image-count">(${ticket.images ? ticket.images.length : 0}/6)</span></label>
                        <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
                        <input type="file" id="camera-input" accept="image/*" capture="environment" style="display: none;">
                        <div class="image-grid" id="image-grid">
                            <!-- Existing images handled by initImageUpload -->
                             <div class="image-add" id="image-add-btn">
                                <span class="material-symbols-outlined">add_a_photo</span>
                                <span class="label">เพิ่มรูป</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: รายละเอียด & ผลกระทบ (Tree & Impact) -->
                <div class="form-section-card">
                    <h3 class="section-title">รายละเอียด & ผลกระทบ</h3>

                    <!-- 7. ผลกระทบที่ได้รับ -->
                    <div class="form-group">
                        <label class="form-label">ผลกระทบที่ได้รับ</label>
                        <textarea id="edit-ticket-impact" class="form-textarea" rows="2" placeholder="ระบุผลกระทบ เช่น ขวางถนน, เสียหายต่อทรัพย์สิน...">${ticket.impact || ''}</textarea>
                    </div>

                    <!-- 8. ชนิดพันธุ์ต้นไม้ -->
                    <div class="form-group">
                        <label class="form-label">ชนิดพันธุ์ต้นไม้</label>
                        <select class="form-select" id="edit-ticket-treeType">
                            <option value="-" ${!ticket.treeType || ticket.treeType === '-' ? 'selected' : ''}>-- ไม่ระบุ --</option>
                            ${MOCK_DATA.treeTypes.map(tt => `
                                <option ${ticket.treeType === tt ? 'selected' : ''}>${tt}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="grid-2-col">
                        <!-- 9. ขนาดลำต้น -->
                        <div class="form-group">
                            <label class="form-label text-center">ขนาดลำต้น (นิ้ว)</label>
                            <div class="number-input">
                                <button type="button" class="number-btn minus"><span class="material-symbols-outlined">remove</span></button>
                                <input type="number" value="${ticket.circumference || 0}" id="circumference">
                                <button type="button" class="number-btn plus"><span class="material-symbols-outlined">add</span></button>
                            </div>
                        </div>

                        <!-- 10. จำนวน -->
                        <div class="form-group">
                            <label class="form-label text-center">จำนวน (ต้น)</label>
                            <div class="number-input">
                                <button type="button" class="number-btn minus"><span class="material-symbols-outlined">remove</span></button>
                                <input type="number" value="${ticket.quantity || 1}" id="quantity">
                                <button type="button" class="number-btn plus"><span class="material-symbols-outlined">add</span></button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: การจัดการ (Operation & Management) -->
                <div class="form-section-card">
                    <h3 class="section-title">การจัดการ</h3>

                    <!-- 11. ผู้รับผิดชอบ -->
                    <div class="form-group">
                        <label class="form-label">ผู้รับผิดชอบ</label>
                        <div id="assignee-chips" class="assignee-list">
                            <!-- Chips rendered by JS -->
                        </div>
                        <div class="assignee-input-group">
                            <input type="text" id="assignee-input" class="form-input" placeholder="ระบุชื่อผู้รับผิดชอบ">
                            <button type="button" id="add-assignee-btn" class="btn-icon-text">
                                <span class="material-symbols-outlined">add</span> เพิ่ม
                            </button>
                        </div>
                    </div>

                    <!-- 12. การดำเนินงาน -->
                    <div class="form-group">
                        <label class="form-label">การดำเนินงาน</label>
                        <select class="form-select" id="operation-select">
                            <option value="-" ${!ticket.operation || ticket.operation === '-' ? 'selected' : ''}>-- ไม่ระบุ --</option>
                            ${MOCK_DATA.operations.map(op => `
                                <option ${ticket.operation === op ? 'selected' : ''}>${op}</option>
                            `).join('')}
                            <option value="other" ${ticket.operation && ticket.operation !== '-' && !MOCK_DATA.operations.includes(ticket.operation) ? 'selected' : ''}>อื่นๆ โปรดระบุ</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="operation-other-container" style="display: ${ticket.operation && ticket.operation !== '-' && !MOCK_DATA.operations.includes(ticket.operation) ? 'block' : 'none'};">
                        <input type="text" class="form-input" id="operation-other-input" value="${ticket.operation && !MOCK_DATA.operations.includes(ticket.operation) && ticket.operation !== '-' ? ticket.operation : ''}" placeholder="ระบุขั้นตอนการดำเนินงาน...">
                    </div>

                    <!-- 13. รูปภาพระหว่างดำเนินการ -->
                    <div class="form-group">
                        <label class="form-label">รูปภาพระหว่างดำเนินการ <span class="image-count" id="progress-image-count">(${ticket.progressImages ? ticket.progressImages.length : 0}/6)</span></label>
                        <input type="file" id="progress-image-input" accept="image/*" multiple style="display: none;">
                        <input type="file" id="progress-camera-input" accept="image/*" capture="environment" style="display: none;">
                        <div class="image-grid" id="progress-image-grid">
                            <div class="image-add" id="progress-image-add-btn">
                                <span class="material-symbols-outlined">add_a_photo</span>
                                <span class="label">เพิ่มรูป</span>
                            </div>
                        </div>
                    </div>

                    <!-- 14. หมายเหตุ -->
                    <div class="form-group">
                        <label class="form-label">หมายเหตุ</label>
                        <textarea id="edit-ticket-notes" class="form-textarea" rows="2" placeholder="หมายเหตุเพิ่มเติม...">${ticket.notes || ''}</textarea>
                    </div>

                    <!-- 15. พิกัดสถานที่ (GPS) -->
                    <div class="form-group">
                        <label class="form-label">พิกัดสถานที่ (GPS)</label>
                        <div class="gps-input-group">
                            <button type="button" id="get-location-btn" class="gps-update-btn">
                                <span class="material-symbols-outlined">my_location</span> พิกัด
                            </button>
                            <input type="text" id="location-coords-display" class="form-input gps-display" readonly value="${ticket.lat && ticket.lng ? `${ticket.lat}, ${ticket.lng}` : ''}" placeholder="ยังไม่ได้ระบุ">
                            ${ticket.lat && ticket.lng ? `
                                <a href="https://www.google.com/maps?q=${ticket.lat},${ticket.lng}" target="_blank" class="gps-map-link">
                                    <span class="material-symbols-outlined">map</span> Map
                                </a>
                            ` : ''}
                        </div>
                        <input type="hidden" id="edit-ticket-lat" value="${ticket.lat || ''}">
                        <input type="hidden" id="edit-ticket-lng" value="${ticket.lng || ''}">
                    </div>

                    <!-- 16. Ticket Status (Last) -->
                    <div class="form-group" style="padding-top: 0.5rem; border-top: 1px dashed #e2e8f0; margin-top: 1rem;">
                        <label class="form-label">สถานะทิคเก็ต <span class="required">*</span></label>
                        <div class="status-toggle-group">
                             <button type="button" class="status-btn ${currentStatus === 'new' ? 'active' : ''}" data-value="new">ใหม่</button>
                            <button type="button" class="status-btn ${currentStatus === 'inProgress' ? 'active' : ''}" data-value="inProgress">ระหว่างดำเนินการ</button>
                            <button type="button" class="status-btn ${currentStatus === 'completed' ? 'active' : ''}" data-value="completed">ปิดทิคเก็ต</button>
                        </div>
                        <input type="hidden" id="edit-ticket-status" value="${currentStatus}">
                    </div>
                </div>

                <div class="floating-action-bar">
                    <button type="submit" class="btn-float">
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

    // Status toggle logic (updated for 3 statuses)
    const statusBtns = content.querySelectorAll('.status-btn');
    const statusInput = content.querySelector('#edit-ticket-status');
    statusBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            statusBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = '';
                b.style.color = '';
                b.style.borderColor = '';
            });
            this.classList.add('active');
            const val = this.dataset.value;
            statusInput.value = val;

            // Styles handled by CSS class 'active'
        });
    });

    // Priority toggle
    const priorityBtns = content.querySelectorAll('.priority-btn:not(.status-btn)');
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            priorityBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Description toggle - Damage buttons
    const descBtns = content.querySelectorAll('.desc-btn');
    const customDesc = content.querySelector('#ticket-description-custom');
    descBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            descBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (this.dataset.value === 'other') {
                customDesc.style.display = 'block';
                customDesc.focus();
            } else {
                customDesc.style.display = 'none';
            }
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
    if (opSelect) {
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
    }

    // Assignee Management
    const editAssignees = [...(ticket.assignees || [])];
    function renderAssigneeChips() {
        const container = content.querySelector('#assignee-chips');
        container.innerHTML = editAssignees.map((name, i) => `
            <div class="assignee-chip" style="display: flex; align-items: center; gap: 0.35rem; background: #eff6ff; border: 1px solid #bfdbfe; padding: 0.35rem 0.5rem 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; color: #1e40af;">
                <span>${name}</span>
                <button type="button" class="remove-assignee-btn" data-index="${i}" style="background: none; border: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; padding: 0; margin: 0;">
                    <span class="material-symbols-outlined" style="font-size: 1.1rem;">close</span>
                </button>
            </div>
        `).join('');
        container.querySelectorAll('.remove-assignee-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                editAssignees.splice(parseInt(this.dataset.index), 1);
                renderAssigneeChips();
            });
        });
    }

    const addAssigneeBtn = content.querySelector('#add-assignee-btn');
    const assigneeInput = content.querySelector('#assignee-input');
    if (addAssigneeBtn) {
        addAssigneeBtn.addEventListener('click', () => {
            const name = assigneeInput.value.trim();
            if (name) {
                editAssignees.push(name);
                assigneeInput.value = '';
                renderAssigneeChips();
            }
        });
        assigneeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addAssigneeBtn.click();
            }
        });
    }

    // Setup initial remove buttons
    content.querySelectorAll('#assignee-chips .remove-assignee-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            editAssignees.splice(parseInt(this.dataset.index), 1);
            renderAssigneeChips();
        });
    });

    // Image upload - Before (from ADD TICKET)
    const uploadedImages = [];
    const MAX_IMAGES = 6;
    initImageUpload(content, uploadedImages, MAX_IMAGES, ticket.images);

    // Image upload - Progress (new upload)
    const progressImages = [];
    const progressGrid = content.querySelector('#progress-image-grid');
    const progressInput = content.querySelector('#progress-image-input');
    const progressAddBtn = content.querySelector('#progress-image-add-btn');

    // Initialize progress images with existing ones
    if (ticket.progressImages && ticket.progressImages.length > 0) {
        ticket.progressImages.forEach(imgUrl => {
            progressImages.push({ url: imgUrl, file: null });
        });
    }

    function updateProgressImageGrid() {
        const countEl = content.querySelector('#progress-image-count');
        if (countEl) countEl.textContent = `(${progressImages.length}/6)`;

        progressGrid.innerHTML = '';
        progressImages.forEach((img, index) => {
            progressGrid.innerHTML += `
                <div class="image-preview" style="position: relative;">
                    <img src="${img.url}" alt="Progress image ${index + 1}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">
                    <button type="button" class="image-remove-btn" onclick="removeProgressImage(${index})" style="position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <span class="material-symbols-outlined" style="font-size: 0.9rem;">close</span>
                    </button>
                </div>
            `;
        });
        if (progressImages.length < 6) {
            progressGrid.innerHTML += `
                <div class="image-add" id="progress-image-add-btn-inner">
                    <span class="material-symbols-outlined" style="font-size: 1.5rem;">add</span>
                    <span class="label">เพิ่มรูป</span>
                </div>
            `;
            const innerAddBtn = progressGrid.querySelector('#progress-image-add-btn-inner');
            if (innerAddBtn) {
                innerAddBtn.addEventListener('click', () => progressInput.click());
            }
        }
    }

    window.removeProgressImage = function (index) {
        progressImages.splice(index, 1);
        updateProgressImageGrid();
    };

    if (progressAddBtn) {
        progressAddBtn.addEventListener('click', () => progressInput.click());
    }

    progressInput.addEventListener('change', function (e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (progressImages.length >= 6) return;
            const reader = new FileReader();
            reader.onload = function (event) {
                progressImages.push({ url: event.target.result, file: file });
                updateProgressImageGrid();
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    });

    updateProgressImageGrid();

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
                    coordsDisplay.style.color = '#10B981';
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
            showPopup('ข้อมูลไม่ครบถ้วน', 'กรุณาเพิ่มรูปภาพก่อนดำเนินการอย่างน้อย 1 รูป', 'error');
            return;
        }

        // Get damage type
        const activeDescBtn = content.querySelector('.desc-btn.active');
        let damageType = activeDescBtn ? activeDescBtn.dataset.value : 'other';

        const damageMap = {
            'fallen': 'โค่นล้ม',
            'broken': 'กิ่งหัก/ฉีก',
            'tilted': 'ลำต้นเอียง',
            'other': 'อื่นๆ'
        };
        const damagePart = damageMap[damageType];

        const status = form.querySelector('#edit-ticket-status').value;
        const isUrgent = form.querySelector('.priority-btn.urgent').classList.contains('active');
        const locationDetail = document.getElementById('edit-ticket-locationDetail').value.trim();
        const zoneId = document.getElementById('edit-ticket-zone').value;
        const lat = document.getElementById('edit-ticket-lat').value;
        const lng = document.getElementById('edit-ticket-lng').value;
        const treeType = document.getElementById('edit-ticket-treeType').value;
        const circumference = parseInt(document.getElementById('circumference').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        const resultImpact = document.getElementById('edit-ticket-impact').value.trim();
        const notes = document.getElementById('edit-ticket-notes').value.trim();

        // Operation
        const opSelectInput = document.getElementById('operation-select');
        let operation = opSelectInput.value;
        if (operation === 'other') {
            operation = document.getElementById('operation-other-input').value.trim();
        }

        // Rebuild zone name
        const zoneObj = MOCK_DATA.zones.find(z => z.id === zoneId);
        const zoneShortName = zoneObj?.name.split(' (')[0]?.replace(/^โซน/, '') || '';
        const zoneName = zoneObj?.name.split(' (')[0] || ticket.zoneName;

        // Auto title: "ต้นนนทรี โค่นล้ม โซนหอพัก"
        const treePart = treeType && treeType !== '-' ? treeType : '';
        const zoneShortNameDisplay = zoneShortName ? `โซน${zoneShortName}` : '';

        let autoTitle = '';
        if (damageType === 'other') {
            const locPart = locationDetail ? ` (${locationDetail})` : '';
            autoTitle = [treePart, `อื่นๆ${locPart}`].filter(Boolean).join(' ');
        } else {
            autoTitle = [treePart, damagePart, zoneShortNameDisplay].filter(Boolean).join(' ');
        }

        // Update Timestamps
        const oldStatus = ticket.status;
        const newStatus = status;
        const nowStr = new Date().toISOString();
        const userName = MOCK_DATA.user?.name || 'Security Guard';

        if (newStatus === 'inProgress' && (oldStatus === 'new' || !ticket.startedAt)) {
            ticket.startedAt = nowStr;
            ticket.startedBy = userName;
        } else if (newStatus === 'completed') {
            if (oldStatus === 'new' || !ticket.startedAt) {
                ticket.startedAt = nowStr;
                ticket.startedBy = userName;
            }
            if (oldStatus !== 'completed' || !ticket.completedAt) {
                ticket.completedAt = nowStr;
                ticket.completedBy = userName;
            }
        }

        if (!ticket.history) {
            ticket.history = [];
        }

        const statusHistMap = {
            'new': 'ทิคเก็ตใหม่',
            'inProgress': 'กำลังดำเนินการ',
            'completed': 'เสร็จสิ้น'
        };

        let updateAction = 'อัปเดต';
        if (oldStatus !== newStatus) {
            updateAction = `เปลี่ยนสถานะเป็น ${statusHistMap[newStatus] || newStatus}`;
        }

        ticket.history.push({
            action: updateAction,
            updatedBy: userName,
            updatedAt: nowStr
        });

        // Update Ticket Object
        ticket.title = autoTitle;
        ticket.description = '';
        ticket.status = status;
        ticket.priority = isUrgent ? 'urgent' : 'normal';
        ticket.category = damageType;
        ticket.damageType = damageType;
        ticket.zone = zoneId;
        ticket.zoneName = zoneName;
        ticket.locationDetail = locationDetail;
        ticket.operation = operation;
        ticket.treeType = treeType;
        ticket.circumference = circumference;
        ticket.quantity = quantity;
        ticket.impact = resultImpact;
        ticket.notes = notes;
        ticket.lat = lat;
        ticket.lng = lng;
        ticket.assignees = [...editAssignees];
        ticket.images = uploadedImages.map(img => img.url);
        ticket.progressImages = progressImages.map(img => img.url);

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

    if (filter === 'urgent') {
        filtered = MOCK_DATA.tickets.filter(t => t.priority === 'urgent');
    } else if (filter === 'not-urgent') {
        filtered = MOCK_DATA.tickets.filter(t => t.priority !== 'urgent');
    } else if (filter !== 'all') {
        if (['new', 'inProgress', 'completed', 'pending'].includes(filter)) {
            filtered = MOCK_DATA.tickets.filter(t => t.status === filter);
        } else {
            filtered = MOCK_DATA.tickets.filter(t => t.category === filter);
        }
    }

    // Store current filter for search integration
    AppState.currentFilter = filter;

    // Also apply current search query if any
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (query) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.zoneName.toLowerCase().includes(query) ||
            t.id.toString().includes(query) ||
            (t.treeType && t.treeType.toLowerCase().includes(query)) ||
            (t.status && getStatusLabel(t.status).toLowerCase().includes(query)) ||
            (t.category && getCategoryName(t.category).toLowerCase().includes(query)) ||
            (t.damageType && getDamageTypeName(t.damageType).toLowerCase().includes(query)) ||
            (t.priority === 'urgent' && 'เร่งด่วน'.includes(query)) ||
            (t.priority !== 'urgent' && 'ไม่เร่งด่วน'.includes(query)) ||
            (t.operation && t.operation.toLowerCase().includes(query)) ||
            (t.assignees && t.assignees.join(' ').toLowerCase().includes(query)) ||
            (t.locationDetail && t.locationDetail.toLowerCase().includes(query)) ||
            (t.notes && t.notes.toLowerCase().includes(query))
        );
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

        // Apply current filter first
        let base = MOCK_DATA.tickets;
        const currentFilter = AppState.currentFilter || 'all';
        if (currentFilter === 'urgent') {
            base = base.filter(t => t.priority === 'urgent');
        } else if (currentFilter === 'not-urgent') {
            base = base.filter(t => t.priority !== 'urgent');
        } else if (currentFilter !== 'all') {
            if (['new', 'inProgress', 'completed', 'pending'].includes(currentFilter)) {
                base = base.filter(t => t.status === currentFilter);
            } else {
                base = base.filter(t => t.category === currentFilter);
            }
        }

        // Then search across all fields
        const filtered = base.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.zoneName.toLowerCase().includes(query) ||
            t.id.toString().includes(query) ||
            (t.treeType && t.treeType.toLowerCase().includes(query)) ||
            (t.status && getStatusLabel(t.status).toLowerCase().includes(query)) ||
            (t.category && getCategoryName(t.category).toLowerCase().includes(query)) ||
            (t.damageType && getDamageTypeName(t.damageType).toLowerCase().includes(query)) ||
            (t.priority === 'urgent' && 'เร่งด่วน'.includes(query)) ||
            (t.priority !== 'urgent' && 'ไม่เร่งด่วน'.includes(query)) ||
            (t.operation && t.operation.toLowerCase().includes(query)) ||
            (t.assignees && t.assignees.join(' ').toLowerCase().includes(query)) ||
            (t.locationDetail && t.locationDetail.toLowerCase().includes(query)) ||
            (t.notes && t.notes.toLowerCase().includes(query))
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
    updateHeaderNav(false); // Reports is a main page
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

            <div class="report-card" onclick="openReportDetail('map_overview')">
                <div class="report-card-icon" style="background: #f0f9ff; color: #0284c7;">
                    <span class="material-symbols-outlined">map</span>
                </div>
                <div class="report-card-info">
                    <h3>แผนที่ตำแหน่งทิคเก็ต (Ticket Map)</h3>
                    <p>ดูตำแหน่งพิกัดของทิคเก็ตทั้งหมดบนแผนที่</p>
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

    if (AppState.selectedReport === 'map_overview') {
        renderMapReport();
        return;
    }

    if (AppState.selectedReport === 'summary') {
        renderDailySummaryReport(AppState.selectedDate, AppState.selectedEndDate);
        return;
    }

    // Default to summary if no report selected
    renderDailySummaryReport(AppState.selectedDate, AppState.selectedEndDate);
}

function renderMapReport() {
    document.getElementById('page-title').textContent = 'แผนที่ทิคเก็ต';
    const content = document.getElementById('main-content');

    // Use full height for map (adjust for header)
    content.innerHTML = `
        <div style="position: relative; height: calc(100vh - 64px); width: 100%; margin: -1rem -1rem 0 -1rem;">
            <div id="full-screen-map" style="height: 100%; width: 100%; z-index: 1;"></div>
            
            <!-- Map Legend Overlay -->
            <div style="position: absolute; bottom: 2rem; left: 1rem; right: 1rem; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px); padding: 0.75rem placeholder; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 400; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; pointer-events: auto;">
                 <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #fbbf24; border: 2px solid white; box-shadow: 0 0 4px #fbbf24;"></div>
                    <span style="font-size: 0.8rem; font-weight: 600;">ใหม่</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #f43f5e; border: 2px solid white; box-shadow: 0 0 4px #f43f5e;"></div>
                    <span style="font-size: 0.8rem; font-weight: 600;">กำลัง/ค้าง</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #94a3b8; border: 2px solid white; box-shadow: 0 0 4px #94a3b8;"></div>
                    <span style="font-size: 0.8rem; font-weight: 600;">เสร็จสิ้น</span>
                </div>
            </div>
        </div>
    `;

    // Initialize Map
    setTimeout(() => {
        if (typeof L !== 'undefined') {
            const centerLat = 14.0722;
            const centerLng = 100.6128;

            const map = L.map('full-screen-map', {
                zoomControl: false,
                attributionControl: false
            }).setView([centerLat, centerLng], 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 20
            }).addTo(map);

            L.control.zoom({ position: 'topright' }).addTo(map);

            // Add all tickets
            const tickets = MOCK_DATA.tickets.filter(t => t.lat && t.lng);

            tickets.forEach(t => {
                const color = t.status === 'new' ? '#fbbf24' : (t.status === 'completed' ? '#94a3b8' : '#f43f5e');

                const customIcon = L.divIcon({
                    className: 'custom-map-marker',
                    html: `<div style="background: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color}"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });

                const popupContent = `
                    <div style="font-family: 'Kanit', sans-serif; padding: 0.5rem; min-width: 160px;">
                        <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">#${t.id}</span>
                        <div style="font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.25rem;">${t.treeType || 'ไม่ระบุพันธุ์ไม้'}</div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">${t.zoneName}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.5rem;">
                             <span style="font-size: 0.7rem; color: ${color}; font-weight: 700;">${getStatusLabel(t.status)}</span>
                             <button onclick="router.navigate('/ticket/${t.id}')" style="background: var(--primary); color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 0.4rem; font-size: 0.7rem; cursor: pointer;">ดูรายละเอียด</button>
                        </div>
                    </div>
                `;

                L.marker([t.lat, t.lng], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(popupContent, { closeButton: false });
            });
        }
    }, 100);
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
async function downloadDailyImages(dateStr, endDateStr) {
    if (!endDateStr) endDateStr = dateStr;
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        showPopup('ข้อผิดพลาด', 'ไลบรารี ZIP ไม่พร้อมใช้งาน', 'error');
        return;
    }

    showPopup('กำลังเตรียมรูปภาพ', 'กำลังรวบรวมและบีบอัดรูปภาพ อาจใช้เวลาสักครู่...', 'info');

    try {
        const zip = new JSZip();

        // Find tickets
        const tickets = MOCK_DATA.tickets.filter(t => {
            if (!t.date) return false;
            const tDateStr = t.date.replace(' ', 'T').split('T')[0];
            return tDateStr >= dateStr && tDateStr <= endDateStr;
        });

        if (tickets.length === 0) {
            showPopup('ไม่พบข้อมูล', 'ไม่มีรูปภาพในช่วงที่เลือก', 'warning');
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
        const nameSuffix = dateStr === endDateStr ? dateStr : `${dateStr}_to_${endDateStr}`;
        const zipName = `TU_Ticket_Images_${nameSuffix}.zip`;
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
    AppState.selectedEndDate = dateStr;
    AppState.selectedReport = 'summary';
    router.navigate('/report-detail');
}
window.viewDailySummary = viewDailySummary;



// Download report for a specific day
async function downloadDailyReport(dateStr, endDateStr) {
    if (!endDateStr) endDateStr = dateStr;

    // Filter tickets for this specific range
    const dayTickets = MOCK_DATA.tickets.filter(t => {
        if (!t.date) return false;
        const tDateStr = t.date.replace(' ', 'T').split('T')[0];
        return tDateStr >= dateStr && tDateStr <= endDateStr;
    });

    if (dayTickets.length === 0) {
        alert('ไม่พบข้อมูลในช่วงที่เลือก');
        return;
    }

    const nameSuffix = dateStr === endDateStr ? dateStr : `${dateStr}_to_${endDateStr}`;
    const reportDateDisplay = window.currentReportDateDisplayForExcel || nameSuffix;

    const workbook = new ExcelJS.Workbook();
    // Maximum 31 characters for worksheet name
    const sheetName = `รายงาน ${nameSuffix}`.substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName);

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
    const thaiFullDateForExcel = reportDateDisplay;
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

window.updateFallenTreeYear = function (year) {
    AppState.fallenTreeYear = parseInt(year);
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
};

/* Fallen Tree Report Logic */
function getFallenTreeStats(period, dateStr) {
    const tickets = MOCK_DATA.tickets;
    const y = AppState.fallenTreeYear || new Date().getFullYear();

    // ข้อมูลสะสมรายปี (Accumulated Yearly)
    let filtered = tickets.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === y;
    });

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

function getZoneHotspotData() {
    let periodTickets = MOCK_DATA.tickets;

    const zones = {};
    periodTickets.forEach(t => {
        const z = t.zoneName?.split(' - ')[0] || t.zone || 'ไม่ระบุโซน';
        zones[z] = (zones[z] || 0) + 1;
    });

    return Object.entries(zones)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
}

function renderRiskHotspotsSection() {
    const hotspots = getZoneHotspotData();

    if (hotspots.length === 0) {
        return `
            <div class="chart-card">
                <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined" style="color: #ef4444;">location_on</span>
                        สถิติรายงานพื้นที่เสี่ยง (Top 5)
                    </div>
                    <span style="font-size: 0.8rem; background: #fee2e2; color: #ef4444; padding: 0.2rem 0.6rem; border-radius: 1rem; font-weight: 600;">สะสมทุกปี</span>
                </h2>
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <p style="font-size: 0.875rem;">ไม่มีข้อมูลพื้นที่เสี่ยง</p>
                </div>
            </div>
        `;
    }

    const maxVal = hotspots[0][1];
    const colors = ['#ef4444', '#f97316', '#fb923c', '#fbbf24', '#fcd34d'];

    const barsHtml = hotspots.map(([name, count], index) => {
        const percent = (count / maxVal) * 100;
        const color = colors[index] || '#94a3b8';
        return `
            <div style="margin-bottom: 0.875rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <div style="flex: 1; min-width: 0; padding-right: 0.75rem;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${index + 1}. ${name}
                        </div>
                    </div>
                    <div style="font-size: 0.875rem; font-weight: 800; color: ${color}; white-space: nowrap;">
                        ${count} <span style="font-size: 0.65rem; font-weight: 600; color: #94a3b8;">ทิคเก็ต</span>
                    </div>
                </div>
                <div style="height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; border: 1px solid #f8fafc;">
                    <div style="height: 100%; width: ${percent}%; background: ${color}; border-radius: 99px; transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="chart-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                <div>
                     <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-outlined" style="color: #ef4444;">location_on</span>
                        สถิติรายงานพื้นที่เสี่ยง (Top 5)
                        <span style="font-size: 0.75rem; background: #fee2e2; color: #ef4444; padding: 0.15rem 0.5rem; border-radius: 1rem; font-weight: 600;">สะสมทุกปี</span>
                    </h2>
                    <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">5 อันดับโซนที่เกิดเหตุสะสมสูงสุดในระบบ</p>
                </div>
            </div>
            
            <div style="padding: 0 0.5rem;">
                ${barsHtml}
            </div>
        </div>
    `;
}

function renderFallenTreesSection(period, dateStr) {
    const currentYear = new Date().getFullYear();
    const selectedYear = AppState.fallenTreeYear || currentYear;

    // Extract available years from mock data
    let availableYears = [...new Set(MOCK_DATA.tickets.map(t => new Date(t.date).getFullYear()))];
    if (!availableYears.includes(selectedYear)) availableYears.push(selectedYear);
    availableYears.sort((a, b) => b - a);

    const yearSelectHtml = `
        <select onchange="updateFallenTreeYear(this.value)" style="padding: 0.25rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-family: 'Kanit'; font-size: 0.875rem; color: #475569; outline: none; background: #f8fafc; cursor: pointer;">
            ${availableYears.map(y => `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>ปี ${y}</option>`).join('')}
        </select>
    `;

    const stats = getFallenTreeStats(period, dateStr);

    if (stats.total === 0) {
        return `
        <div class="chart-card">
            <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem; color: #1e293b; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: var(--primary);">forest</span>
                    รายงานจำนวนต้นไม้ที่โค่นล้ม
                </div>
                ${yearSelectHtml}
            </h2>
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed var(--border); border-radius: 1rem; margin-top: 0.5rem;">
                <span class="material-symbols-outlined" style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.3;">eco</span>
                <p style="font-size: 0.875rem;">ไม่มีข้อมูลในช่วงเวลานี้</p>
            </div>
        </div>
        `;
    }

    const colors = ['#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#f97316', '#64748b'];

    // Assign Colors & Calculate Percentages
    let cumulativePercent = 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

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
                    style="transform: rotate(-90deg); transform-origin: 50% 50%; transition: all 1s ease;"></circle>
        `;
        cumulativePercent += percent;
        return circle;
    }).join('');

    const legendHtml = stats.items.map(item => `
        <div style="display: flex; align-items: center; gap: 0.375rem; background: #f8fafc; padding: 0.35rem 0.6rem; border-radius: 0.5rem; border: 1px solid #f1f5f9;">
            <div style="width: 0.65rem; height: 0.65rem; border-radius: 50%; background: ${item.color};"></div>
            <span style="font-size: 0.75rem; color: #334155; font-weight: 700;">${item.name}</span>
            <span style="font-size: 0.75rem; color: #64748b; margin-left: auto;">${item.count}</span>
        </div>
    `).join('');

    return `
        <div class="chart-card">
            <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; color: #1e293b; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: var(--primary);">forest</span>
                    รายงานจำนวนต้นไม้ที่โค่นล้ม
                </div>
                ${yearSelectHtml}
            </h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: center;">
                <div style="position: relative; width: 100%; aspect-ratio: 1/1; max-width: 200px; margin: 0 auto; display: flex; justify-content: center; align-items: center;">
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                        <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="#f1f5f9" stroke-width="12"></circle>
                        ${circlesHtml}
                    </svg>
                    <div style="position: absolute; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                        <span style="font-size: 1.75rem; font-weight: 800; color: #1e293b; line-height: 1;">${stats.total}</span>
                        <span style="font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-top: 2px;">ต้นรวม</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${legendHtml}
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
                    priority: t.priority === 'urgent' ? 'เร่งด่วน' : 'ไม่เร่งด่วน',
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
async function downloadReportAsImage(dateStr, endDateStr) {
    if (!endDateStr) endDateStr = dateStr;
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
                const nameSuffix = dateStr === endDateStr ? dateStr : `${dateStr}_to_${endDateStr}`;
                const fileName = `TU_Ticket_Report_Image_${nameSuffix}.png`;
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

function clearLocalStorage() {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดใน LocalStorage? การกระทำนี้ไม่สามารถย้อนกลับได้!')) {
        localStorage.removeItem('tu_gardener_data');
        showToast('ข้อมูล LocalStorage ถูกล้างแล้ว! กำลังรีโหลด...', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

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
