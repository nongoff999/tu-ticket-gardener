const fs = require('fs');

const TREE_TYPES = [
    "ต้นนนทรี", "ต้นพฤกษ์", "ต้นราชพฤกษ์", "ต้นอินทนิล", "ต้นหางนกยูง",
    "ต้นมะฮอกกานี", "ต้นสน", "ต้นไทร", "ต้นประดู่", "ต้นตะแบก"
];

const ZONES = [
    { id: "A1", name: "ถนนปรีดี พนมยงค์ (ถนนหลัก)" },
    { id: "A2", name: "ถนนยูงทอง" },
    { id: "B1", name: "โซนสนามกีฬา" },
    { id: "B2", name: "โซนหอพักนักศึกษา" },
    { id: "C1", name: "โซนคณะวิศวกรรมศาสตร์" },
    { id: "C2", "name": "โซนคณะนิติศาสตร์" },
    { id: "D1", "name": "โซนหอสมุด" },
    { id: "D2", "name": "โซนอาคารบริการ" },
    { id: "E1", "name": "โซนสระว่ายน้ำ" },
    { id: "E2", "name": "โซนสวนพฤกษศาสตร์" }
];

const OPERATIONS = [
    "ตัดแต่งกิ่งเพื่อลดน้ำหนักของลำต้นและทรงพุ่ม ก่อนย้ายไปยังที่พักฟื้น",
    "ดึงลำต้นให้ตรง และค้ำยันใหม่",
    "ตัดทอน ขนย้าย และคืนสภาพพื้นที่ สาเหตุ จากโรคแมลงและปลวก ทำให้รากและลำต้นผุ เน่า",
    "ตัดแต่งแผลของกิ่งที่ฉีกหัก พร้อมเก็บเคลียร์ความสะอาดในพื้นที่",
    "ปลูกเพื่อทดแทนต้นเดิมที่โค่นล่ม หรือ ยืนต้นตาย"
];

const ASSIGNEES_LIST = ["สมชาย การดี", "สมศักดิ์ ดีมาก", "วิชัย ใจดี", "พีระพล แสนสุข"];
const STATUSES = ["new", "inProgress", "pending", "completed"];
const CATEGORIES = ["accident", "nature", "damage"];
const DAMAGES = ["broken", "tilted", "fallen", "replant"];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const tickets = [];
const startDate = new Date('2026-01-01T08:00:00');
const endDate = new Date('2026-02-11T17:00:00');

for (let i = 1; i <= 60; i++) {
    const status = getRandomItem(STATUSES);
    const zone = getRandomItem(ZONES);
    const tree = getRandomItem(TREE_TYPES);
    const damage = getRandomItem(DAMAGES);
    const date = getRandomDate(startDate, endDate);

    // Logic for fields based on status
    let assignees = [];
    let operation = "-";
    let notes = "";

    if (status !== 'new') {
        // Assign 1-3 people
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...ASSIGNEES_LIST].sort(() => 0.5 - Math.random());
        assignees = shuffled.slice(0, count);

        operation = getRandomItem(OPERATIONS);
        if (Math.random() > 0.7) notes = "ดำเนินการตามแผน";
    }

    // New tickets might have empty fields
    if (status === 'new') {
        operation = "-"; // Or empty string, logic handles it
    }

    tickets.push({
        id: 1000 + i,
        title: `${tree} ${damage === 'fallen' ? 'โค่นล้ม' : (damage === 'broken' ? 'กิ่งหัก' : 'เอียง')}`,
        description: `พบปัญหา${tree}บริเวณ${zone.name} ต้องการการตรวจสอบ`,
        category: getRandomItem(CATEGORIES),
        status: status,
        priority: Math.random() > 0.8 ? 'urgent' : 'normal',
        zone: zone.id,
        zoneName: zone.name,
        treeType: tree,
        damageType: damage,
        circumference: damage === 'replant' ? 0 : Math.floor(Math.random() * 150) + 20,
        quantity: Math.floor(Math.random() * 5) + 1,
        impact: "-",
        operation: operation,
        date: date.toISOString().slice(0, 16).replace('T', ' '),
        assignees: assignees,
        images: ["https://images.unsplash.com/photo-1549419163-9d7a2283ce93?w=800"], // Placeholder
        notes: notes
    });
}

// Sort by date desc
tickets.sort((a, b) => new Date(b.date) - new Date(a.date));

const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    inProgress: tickets.filter(t => t.status === 'inProgress').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    completed: tickets.filter(t => t.status === 'completed').length
};

const data = {
    user: { name: "สมชาย การดี", role: "หัวหน้าช่างสวน", avatar: null },
    stats: stats,
    categories: [
        { id: "all", name: "ทั้งหมด" },
        { id: "accident", name: "อุบัติเหตุ" },
        { id: "nature", name: "อุบัติเหตุจากธรรมชาติ" },
        { id: "damage", name: "อุปกรณ์ชำรุดเสียหาย" }
    ],
    treeTypes: TREE_TYPES,
    zones: ZONES,
    damageTypes: [
        { id: "broken", name: "ฉีก / หัก", icon: "content_cut" },
        { id: "tilted", name: "เอน / เอียง", icon: "height" },
        { id: "fallen", name: "โค่นล้ม", icon: "landscape" },
        { id: "replant", name: "ปลูกใหม่", icon: "eco" }
    ],
    operations: OPERATIONS,
    tickets: tickets
};

fs.writeFileSync('d:/Source code Aof/tu ticket gardener/tu ticket gardener/data/tickets.json', JSON.stringify(data, null, 4));
console.log('Generated ' + tickets.length + ' tickets.');
