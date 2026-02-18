const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/tickets.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

const targets = data.tickets.filter(t => t.treeType === 'ต้นหางนกยูง' && (t.damageType === 'broken' || t.title.includes('กิ่งหัก/ฉีก')));
console.log('Found:', targets.length);
targets.forEach(t => {
    console.log(t.id, t.title, t.zoneName);
});
