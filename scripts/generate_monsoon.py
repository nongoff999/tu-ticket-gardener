import json
import random
from datetime import datetime, timedelta

def generate_monsoon_data():
    tree_types = ["ต้นนนทรี", "ต้นพฤกษ์", "ต้นราชพฤกษ์", "ต้นอินทนิล", "ต้นหางนกยูง", "ต้นมะฮอกกานี", "ต้นสน", "ต้นไทร", "ต้นประดู่", "ต้นตะแบก"]
    zones = [
        {"id": "A1", "name": "ถนนปรีดี พนมยงค์ (ถนนหลัก)"},
        {"id": "A2", "name": "ถนนยูงทอง"},
        {"id": "B1", "name": "โซนสนามกีฬา"},
        {"id": "B2", "name": "โซนหอพักนักศึกษา"},
        {"id": "C1", "name": "โซนคณะวิศวกรรมศาสตร์"},
        {"id": "C2", "name": "โซนคณะนิติศาสตร์"},
        {"id": "D1", "name": "โซนหอสมุด"},
        {"id": "D2", "name": "โซนอาคารบริการ"},
        {"id": "E1", "name": "โซนสระว่ายน้ำ"},
        {"id": "E2", "name": "โซนสวนพฤกษศาสตร์"}
    ]
    categories = ["accident", "nature", "damage"]
    statuses = ["completed"] * 8 + ["new", "inProgress", "pending"]
    priorities = ["normal", "urgent"]
    # Make fallen the most common
    damage_types = ["fallen"] * 10 + ["broken"] * 3 + ["tilted"] * 2
    operations = [
        "ตัดแต่งกิ่งเพื่อลดน้ำหนักของลำต้นและทรงพุ่ม ก่อนย้ายไปยังที่พักฟื้น",
        "ดึงลำต้นให้ตรง และค้ำยันใหม่",
        "ตัดทอน ขนย้าย และคืนสภาพพื้นที่",
        "ตัดแต่งแผลของกิ่งที่ฉีกหัก",
        "ปลูกเพื่อทดแทนต้นเดิมที่โค่นล้ม"
    ]
    assignees_list = ["สมชาย การดี", "พีระพล แสนสุข", "วิชัย ใจดี", "สมศักดิ์ ดีมาก"]
    
    image_urls = [
        "https://images.unsplash.com/photo-1592150621344-79838b56da3d?w=800",
        "https://images.unsplash.com/photo-1558905612-16715494d6d5?w=800",
        "https://images.unsplash.com/photo-1501854140801-50d01674aa3e?w=800",
        "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=800",
        "https://images.unsplash.com/photo-1511497584788-876760111969?w=800"
    ]

    # Load existing data to find current lowest ID
    filepath = r'd:\Source code Aof\tu ticket gardener\tu ticket gardener\data\tickets.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # ลบข้อมูลจำลองอันเก่ารอบที่แล้วออกก่อน
    data['tickets'] = [t for t in data['tickets'] if t.get('notes') != "ข้อมูลจำลองหน้าฝนมรสุม"]
    
    existing_ids = [t['id'] for t in data['tickets']]
    current_id = min(existing_ids) - 1 if existing_ids else 1000
    
    tickets = []
    
    # Generate smaller numbers: e.g. 5, 12, 8, 3
    periods = [
        (datetime(2023, 5, 1), datetime(2023, 10, 31), random.randint(3, 7)),
        (datetime(2024, 5, 1), datetime(2024, 10, 31), random.randint(8, 14)),
        (datetime(2025, 5, 1), datetime(2025, 10, 31), random.randint(4, 9)),
        (datetime(2026, 2, 1), datetime.now(), random.randint(2, 5))
    ]
    
    for start_date, end_date, num_tickets in periods:
        total_days = (end_date - start_date).days
        if total_days < 0:
            total_days = 0
            
        for i in range(num_tickets):
            random_day = start_date + timedelta(days=random.randint(0, total_days))
            random_hour = random.randint(7, 18)
            random_minute = random.randint(0, 59)
            date_str = random_day.strftime(f"%Y-%m-%d {random_hour:02d}:{random_minute:02d}")
            
            zone = random.choice(zones)
            damage_map = {
                "fallen": "โค่นล้ม",
                "broken": "กิ่งหัก/ฉีก",
                "tilted": "ลำต้นเอียง",
            }
            
            tree = random.choice(tree_types)
            damage = random.choice(damage_types)
            damage_name = damage_map.get(damage, "อื่นๆ")
            
            zone_str = zone["name"] if zone["name"].startswith("โซน") else ("โซน" + zone["name"])
            ticket_title = f"{tree} {damage_name} {zone_str}".strip()
            
            # Most old tickets should be completed
            status = random.choice(statuses) if start_date.year == 2026 else "completed"
            
            ticket = {
                "id": current_id,
                "title": ticket_title,
                "description": "",
                "category": damage if damage in ["fallen", "broken", "tilted"] else random.choice(categories),
                "status": status,
                "priority": random.choice(priorities),
                "zone": zone["id"],
                "zoneName": zone["name"],
                "treeType": tree,
                "damageType": damage,
                "circumference": random.randint(30, 200),
                "quantity": random.randint(1, 4),
                "impact": random.choice(["ขวางทางเดิน", "เสี่ยงทับอาคาร", "บดบังวิสัยทัศน์", "ไฟฟ้าขัดข้อง"]),
                "operation": random.choice(operations) if status == "completed" else "รอการดำเนินการ",
                "date": date_str,
                "assignees": random.sample(assignees_list, random.randint(1, 3)),
                "images": [random.choice(image_urls)],
                "notes": "ข้อมูลจำลองหน้าฝนมรสุม"
            }
            tickets.append(ticket)
            current_id -= 1

    # Add new tickets
    data["tickets"] = data["tickets"] + tickets
    
    # Sort tickets by date descending
    data["tickets"].sort(key=lambda x: x["date"], reverse=True)
    
    # Update stats
    data["stats"]["total"] = len(data["tickets"])
    data["stats"]["new"] = len([t for t in data["tickets"] if t["status"] == "new"])
    data["stats"]["inProgress"] = len([t for t in data["tickets"] if t["status"] == "inProgress"])
    data["stats"]["pending"] = len([t for t in data["tickets"] if t["status"] == "pending"])
    data["stats"]["completed"] = len([t for t in data["tickets"] if t["status"] == "completed"])

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Generated {sum([p[2] for p in periods])} tickets total.")

if __name__ == "__main__":
    generate_monsoon_data()
