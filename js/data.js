/**
 * TU Ticket Gardener - Data Manager
 * โหลดข้อมูลจากไฟล์ JSON และ Helper Functions
 * มหาวิทยาลัยธรรมศาสตร์ รังสิต
 */

// Global data storage
let MOCK_DATA = null;
let dataLoaded = false;

// Load data from JSON file
async function loadData() {
    if (dataLoaded) return MOCK_DATA;

    try {
        // 0. Initialize Firebase if configured
        if (typeof initFirebase === 'function') {
            initFirebase();
        }

        // 1. Try Firebase first (if enabled)
        if (typeof isFirebaseEnabled === 'function' && isFirebaseEnabled()) {
            const firebaseData = await loadDataFromFirebase();
            if (firebaseData) {
                MOCK_DATA = firebaseData;
                // Also save to LocalStorage as backup
                localStorage.setItem('tu_gardener_data', JSON.stringify(MOCK_DATA));
                dataLoaded = true;
                return MOCK_DATA;
            }
        }

        // 2. Check LocalStorage
        // 2. Check LocalStorage
        const localData = localStorage.getItem('tu_gardener_data');
        if (localData) {
            const parsed = JSON.parse(localData);

            // Check if data is "old" (ID >= 2000) - We want to switch to new curated data (ID 1000+)
            // If old, we ignore local storage and fetch fresh JSON
            const hasOldTickets = parsed.tickets && parsed.tickets.some(t => t.id >= 2000);

            if (hasOldTickets) {
                console.log('🧹 พบข้อมูลชุดเก่า (ID >= 2000) - ทำการล้างและโหลดข้อมูลใหม่จากไฟล์ JSON');
                localStorage.removeItem('tu_gardener_data');
                // Proceed to fetch from JSON (Block 3)
            } else {
                MOCK_DATA = parsed;

                // Force update categories and damageTypes to ensure latest schema
                MOCK_DATA.categories = [
                    { id: "all", name: "ทั้งหมด" },
                    { id: "fallen", name: "โค่นล้ม" },
                    { id: "broken", name: "กิ่งหัก/ฉีก" },
                    { id: "tilted", name: "ลำต้นเอียง" },
                    { id: "other", name: "อื่นๆ" }
                ];

                MOCK_DATA.damageTypes = [
                    { id: "fallen", name: "โค่นล้ม", icon: "forest" },
                    { id: "broken", name: "กิ่งหัก/ฉีก", icon: "content_cut" },
                    { id: "tilted", name: "ลำต้นเอียง", icon: "u_turn_right" },
                    { id: "other", name: "อื่นๆ", icon: "more_horiz" }
                ];

                // Force update treeTypes (User Request Step 4943)
                MOCK_DATA.treeTypes = [
                    "ต้นจามจุรี", "ต้นพฤกษ์", "ต้นนนทรี", "ต้นประดู่", "ต้นมะฮอกกานี", "ต้นกระพี้จั่น", "ต้นอินทนิล", "ต้นตะแบก",
                    "ต้นเสลา", "ต้นสะเดา", "ต้นเหลืองปรีดียาธร", "ต้นปีบ", "ต้นกระถินณรงค์", "ต้นชมพูพันธ์ทิพย์", "ต้นพิกุล", "ต้นขี้เหล็ก",
                    "ต้นพะยูง", "ต้นสาเก", "ต้นกระทิง", "ต้นโศก", "ต้นจิกทะเล", "ต้นจิกสวน", "ต้นชะแมบทอง", "ต้นหางนกยูง",
                    "ต้นทองอุไร", "ต้นไทร", "ต้นหว้า", "ต้นมะขาม", "ต้นตะเคียน", "ต้นมะกอกน้ำ", "ต้นตีนเป็ด", "ต้นพญาสัตบรรณ",
                    "ต้นพะยอม", "ต้นทองกวาว"
                ];

                console.log('📦 โหลดข้อมูลจาก LocalStorage:', MOCK_DATA.tickets.length, 'tickets');

                // Sync to Firebase if enabled
                if (typeof isFirebaseEnabled === 'function' && isFirebaseEnabled()) {
                    saveDataToFirebase(MOCK_DATA);
                }

                dataLoaded = true;
                return MOCK_DATA;
            }
        }
        // 3. If no local data, fetch from JSON
        const response = await fetch('data/tickets.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        MOCK_DATA = await response.json();
        // Save initial data to storage
        saveData();
        console.log('✅ โหลดข้อมูลจากไฟล์ JSON และบันทึกลง Storage');

        console.log('==========================================');
        console.log('📊 สรุปข้อมูลทิคเก็ตที่โหลดมา:');
        console.table({
            'ทั้งหมด': MOCK_DATA.stats.total,
            'ใหม่ (new)': MOCK_DATA.stats.new,
            'กำลังทำ (inProgress)': MOCK_DATA.stats.inProgress,
            'รอดำเนินการ (pending)': MOCK_DATA.stats.pending,
            'เสร็จสิ้น (completed)': MOCK_DATA.stats.completed
        });

        if (MOCK_DATA.tickets.length > 0) {
            console.log('📅 ข้อมูลตั้งแต่:', MOCK_DATA.tickets[MOCK_DATA.tickets.length - 1].date);
            console.log('📅 ถึงวันที่:', MOCK_DATA.tickets[0].date);
        }
        console.log('==========================================');

        dataLoaded = true;
        return MOCK_DATA;
    } catch (error) {
        console.error('❌ ไม่สามารถโหลดข้อมูลได้:', error);
        // Fallback to empty data
        MOCK_DATA = {
            user: { name: "สมชาย การดี", role: "หัวหน้าช่างสวน", avatar: null },
            stats: { total: 0, new: 0, inProgress: 0, pending: 0, completed: 0 },
            categories: [
                { id: "all", name: "ทั้งหมด" },
                { id: "fallen", name: "โค่นล้ม" },
                { id: "broken", name: "กิ่งหัก/ฉีก" },
                { id: "tilted", name: "ลำต้นเอียง" },
                { id: "other", name: "อื่นๆ" }
            ],
            treeTypes: [],
            zones: [],
            damageTypes: [
                { id: "fallen", name: "โค่นล้ม", icon: "forest" },
                { id: "broken", name: "กิ่งหัก/ฉีก", icon: "content_cut" },
                { id: "tilted", name: "ลำต้นเอียง", icon: "u_turn_right" },
                { id: "other", name: "อื่นๆ", icon: "more_horiz" }
            ],
            operations: [],
            tickets: []
        };
        dataLoaded = true;
        return MOCK_DATA;
    }
}

// Save data to LocalStorage and Firebase
function saveData() {
    if (!MOCK_DATA) return;

    // Recalculate stats before saving
    const tickets = MOCK_DATA.tickets || [];
    MOCK_DATA.stats = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'inProgress').length,
        pending: tickets.filter(t => t.status === 'pending').length,
        completed: tickets.filter(t => t.status === 'completed').length
    };

    // Save to LocalStorage
    localStorage.setItem('tu_gardener_data', JSON.stringify(MOCK_DATA));
    console.log('💾 บันทึกข้อมูลลง LocalStorage แล้ว');

    // Save to Firebase if enabled
    if (typeof isFirebaseEnabled === 'function' && isFirebaseEnabled()) {
        saveDataToFirebase(MOCK_DATA);
    }
}

// Get data (synchronous - must call loadData first)
function getData() {
    if (!dataLoaded) {
        console.warn('⚠️ ข้อมูลยังไม่ถูกโหลด กรุณาเรียก loadData() ก่อน');
    }
    return MOCK_DATA;
}

// Helper functions
function getStatusLabel(status) {
    const labels = {
        'new': 'ทิคเก็ตใหม่',
        'inProgress': 'ระหว่างดำเนินการ',
        'pending': 'รอดำเนินการ',
        'completed': 'เสร็จสิ้น'
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'new': 'new',
        'inProgress': 'progress',
        'pending': 'new',
        'completed': 'done'
    };
    return classes[status] || '';
}

function getPriorityLabel(priority) {
    return priority === 'urgent' ? 'เร่งด่วน' : 'ปกติ';
}

function getCategoryName(categoryId) {
    if (!MOCK_DATA) return categoryId;
    const category = MOCK_DATA.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
}

function getDamageTypeName(damageTypeId) {
    if (!MOCK_DATA) return damageTypeId;
    const dt = MOCK_DATA.damageTypes.find(d => d.id === damageTypeId);
    return dt ? dt.name : damageTypeId;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatShortDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543; // Buddhist Era
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
}

// Export for use in other files
// Export for use in other files
window.loadData = loadData;
window.saveData = saveData;
window.getData = getData;
window.getStatusLabel = getStatusLabel;
window.getStatusClass = getStatusClass;
window.getPriorityLabel = getPriorityLabel;
window.getCategoryName = getCategoryName;
window.getDamageTypeName = getDamageTypeName;
window.formatDate = formatDate;
window.formatShortDate = formatShortDate;

// For backward compatibility
Object.defineProperty(window, 'MOCK_DATA', {
    get: function () {
        return getData();
    }
});
