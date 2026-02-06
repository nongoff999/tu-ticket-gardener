/**
 * TU Ticket Gardener - Main Application
 * มหาวิทยาลัยธรรมศาสตร์ รังสิต
 */

// App State
const AppState = {
    currentPage: 'dashboard',
    selectedCategory: 'all',
    selectedTicket: null,
    isDrawerOpen: false
};

// Initialize App
document.addEventListener('DOMContentLoaded', async function () {
    // โหลดข้อมูลจาก JSON ก่อน
    await loadData();

    initRouter();
    initDrawer();
    initFilterTabs();
});

// Router Setup
function initRouter() {
    router
        .register('/dashboard', renderDashboard)
        .register('/monitor', renderMonitor)
        .register('/tickets', renderTicketList)
        .register('/ticket', renderTicketDetail)
        .register('/add', renderAddTicket)
        .register('/add-select', renderCategorySelection)
        .register('/edit', renderEditTicket);
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
    closeDrawer();
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

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <!-- Stats Grid -->
        <div class="stats-grid">
            ${Components.statCard('ทิคเก็ตทั้งหมด', MOCK_DATA.stats.total, 'blue', 'dashboard')}
            ${Components.statCard('ทิคเก็ตใหม่', MOCK_DATA.stats.new, 'yellow', 'notification_important')}
            ${Components.statCard('ดำเนินการ', MOCK_DATA.stats.inProgress, 'purple', 'settings_suggest')}
            ${Components.statCard('ยังไม่ดำเนินการ', MOCK_DATA.stats.pending, 'pink', 'pending_actions')}
            ${Components.statCard('เสร็จสิ้น', MOCK_DATA.stats.completed, 'green', 'task_alt')}
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
                    <span style="font-size: 1.875rem; font-weight: 700;">15</span>
                    <span style="font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Total</span>
                </div>
            </div>
        </div>

        <div class="safe-area-bottom"></div>
    `;

    // Add period tab functionality
    const periodTabs = content.querySelectorAll('.period-tab');
    periodTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            periodTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
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
                    <input type="text" class="form-input" value="${ticket.title}">
                </div>

                <div class="form-group">
                    <label class="form-label">Ticket Description</label>
                    <textarea class="form-textarea" rows="3">${ticket.description}</textarea>
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
                    <select class="form-select">
                        ${MOCK_DATA.treeTypes.map(tt => `
                            <option ${ticket.treeType === tt ? 'selected' : ''}>${tt}</option>
                        `).join('')}
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="form-group">
                    <div>
                        <label class="form-label text-center">เส้นรอบวง (นิ้ว)</label>
                        <div class="number-input">
                            <button type="button" class="number-btn minus"><span class="material-symbols-outlined">remove</span></button>
                            <input type="number" value="${ticket.circumference}" id="circumference">
                            <button type="button" class="number-btn plus"><span class="material-symbols-outlined">add</span></button>
                        </div>
                    </div>
                    <div>
                        <label class="form-label text-center">จำนวน</label>
                        <div class="number-input">
                            <button type="button" class="number-btn minus"><span class="material-symbols-outlined">remove</span></button>
                            <input type="number" value="${ticket.quantity}" id="quantity">
                            <button type="button" class="number-btn plus"><span class="material-symbols-outlined">add</span></button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">ผลกระทบที่ได้รับ</label>
                    <input type="text" class="form-input" value="${ticket.impact}">
                </div>

                <div class="form-group">
                    <label class="form-label">สถานที่เกิดเหตุ (โซน)</label>
                    <input type="text" class="form-input" value="${ticket.zoneName}">
                </div>

                <div class="form-group">
                    <label class="form-label">หมายเหตุ</label>
                    <input type="text" class="form-input" value="${ticket.notes || ''}">
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

        // Gather values
        const status = form.querySelector('select').value;
        const isUrgent = form.querySelector('.priority-btn.urgent').classList.contains('active');
        const title = form.querySelectorAll('input.form-input')[0].value;
        const description = form.querySelector('textarea').value;
        const resultImpact = form.querySelectorAll('input.form-input')[1].value; // Impact input
        const zoneName = form.querySelectorAll('input.form-input')[2].value; // Zone name input
        const notes = form.querySelectorAll('input.form-input')[3].value; // Notes input

        // Tags (Damage Type)
        const activeTag = form.querySelector('.tag.active');
        const damageTypeId = activeTag ? activeTag.dataset.value : ticket.damageType;

        // Operation
        const opSelect = form.querySelector('#operation-select');
        let operation = opSelect.value;
        if (operation === 'other') {
            operation = form.querySelector('#operation-other-input').value;
        }

        // Selects
        const treeTypeSelect = form.querySelectorAll('select.form-select')[2]; // 3rd select is tree type
        const treeType = treeTypeSelect.value;

        // Numbers
        const circumference = parseInt(form.querySelector('#circumference').value) || 0;
        const quantity = parseInt(form.querySelector('#quantity').value) || 1;

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
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.navigateTo = navigateTo;
window.showTicketDetail = showTicketDetail;
window.removeUploadedImage = removeUploadedImage;
