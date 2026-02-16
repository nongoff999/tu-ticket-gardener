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
const DAMAGES = ["accident", "nature", "other"];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const IMAGE_POOL = {
    accident: [
        "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800", // Tree/nature
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800", // Tree
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", // Forest
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", // Nature
        "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=800"  // Deep forest
    ],
    nature: [
        "https://images.unsplash.com/photo-1511497584788-876760111969?w=800", // Sun in forest
        "https://images.unsplash.com/photo-1448375240580-08527b1406c7?w=800", // Path in forest
        "https://images.unsplash.com/photo-1501854140801-50d01674aa3e?w=800", // Wide nature
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", // Grass/Trees
        "https://images.unsplash.com/photo-1513836279014-a89f7076ae46?w=800"  // Tall trees
    ],
    other: [
        "https://images.unsplash.com/photo-1592150621344-79838b56da3d?w=800", // Foliage
        "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800", // Garden/Plants
        "https://images.unsplash.com/photo-1558905612-16715494d6d5?w=800", // Garden landscape
        "https://images.unsplash.com/photo-1523306411751-bed41832b55c?w=800", // Small plant
        "https://images.unsplash.com/photo-1458245201577-fc8a130b8829?w=800"  // Pruning shears
    ]
};

const tickets = [];
const today = new Date(); // Use current date
const options = { timeZone: 'Asia/Bangkok' };

// Generate data for the last 90 days (approx 3 months) to focus on recent activity
for (let d = 0; d < 90; d++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - d);

    // Number of tickets based on weekday (Mon-Fri busy, Sat-Sun quiet)
    const dayOfWeek = currentDate.getDay(); // 0 Sun, 6 Sat
    let baseCount = 8;
    if (dayOfWeek === 0 || dayOfWeek === 6) baseCount = 3; // Weekend

    // Add random variation (+/- 40%)
    const variation = Math.floor(baseCount * 0.4);
    const ticketsToday = baseCount + Math.floor(Math.random() * (variation * 2 + 1)) - variation;

    for (let tCount = 0; tCount < ticketsToday; tCount++) {
        const ticketTime = new Date(currentDate);
        ticketTime.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60)); // Random work hours

        // Determine Status based on AGE (Realistic)
        // Age in days
        const age = d; // since d loops 0..90 (0 is today)

        let status = 'new';
        let operation = "-";

        if (age > 14) {
            // Old tickets: Mostly completed (90%)
            status = Math.random() > 0.1 ? 'completed' : 'inProgress';
        } else if (age > 7) {
            // 1-2 weeks old: Mostly completed or in progress
            const r = Math.random();
            if (r > 0.3) status = 'completed';
            else if (r > 0.1) status = 'inProgress';
            else status = 'pending';
        } else if (age > 3) {
            // 3-7 days: Active work
            const r = Math.random();
            if (r > 0.6) status = 'completed';
            else if (r > 0.2) status = 'inProgress';
            else status = 'new';
        } else {
            // Recent: New or Just Started
            const r = Math.random();
            if (r > 0.8) status = 'completed'; // Quick fix
            else if (r > 0.5) status = 'inProgress';
            else status = 'new';
        }

        const zone = getRandomItem(ZONES);
        const tree = getRandomItem(TREE_TYPES);
        const damage = getRandomItem(DAMAGES);

        let assignees = [];
        let notes = "";

        if (status !== 'new') {
            const count = Math.floor(Math.random() * 3) + 1;
            const shuffled = [...ASSIGNEES_LIST].sort(() => 0.5 - Math.random());
            assignees = shuffled.slice(0, count);

            operation = getRandomItem(OPERATIONS);
            if (Math.random() > 0.7) notes = "ดำเนินการตามแผน";
        }

        if (status === 'new' || status === 'pending') {
            operation = "-";
        }

        // Select images from pool based on damage type
        const pool = IMAGE_POOL[damage] || IMAGE_POOL['other'];
        const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
        // Use 1-2 images per ticket to keep data manageable
        const ticketImages = shuffledPool.slice(0, Math.floor(Math.random() * 2) + 1);

        tickets.push({
            id: 2000 + tickets.length,
            title: `${tree} (${damage === 'accident' ? 'อุบัติเหตุ' : (damage === 'nature' ? 'อุบัติเหตุจากธรรมชาติ' : 'อื่นๆ')})`,
            description: `พบปัญหา${tree}บริเวณ${zone.name} ต้องการการตรวจสอบ`,
            category: damage,
            status: status,
            priority: Math.random() > 0.8 ? 'urgent' : 'normal',
            zone: zone.id,
            zoneName: zone.name,
            treeType: tree,
            damageType: damage,
            circumference: Math.floor(Math.random() * 150) + 20,
            quantity: Math.floor(Math.random() * 3) + 1,
            impact: "-",
            operation: operation,
            date: ticketTime.toISOString().slice(0, 16).replace('T', ' '),
            assignees: assignees,
            images: ticketImages,
            notes: notes
        });
    }
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
        { id: "other", name: "อื่นๆ" }
    ],
    treeTypes: TREE_TYPES,
    zones: ZONES,
    damageTypes: [
        { id: "accident", name: "อุบัติเหตุ", icon: "emergency" },
        { id: "nature", name: "อุบัติเหตุจากธรรมชาติ", icon: "nature_people" },
        { id: "other", name: "อื่นๆ", icon: "more_horiz" }
    ],
    operations: OPERATIONS,
    tickets: tickets
};

fs.writeFileSync('d:/Source code Aof/tu ticket gardener/tu ticket gardener/data/tickets.json', JSON.stringify(data, null, 4));
console.log('Generated ' + tickets.length + ' tickets.');
