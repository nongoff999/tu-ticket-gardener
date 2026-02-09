import json
import random
from datetime import datetime, timedelta

def generate_mock_data():
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
    statuses = ["new", "inProgress", "completed", "pending"]
    priorities = ["normal", "urgent"]
    damage_types = ["broken", "tilted", "fallen", "replant"]
    operations = [
        "ตัดแต่งกิ่งเพื่อลดน้ำหนักของลำต้นและทรงพุ่ม ก่อนย้ายไปยังที่พักฟื้น",
        "ดึงลำต้นให้ตรง และค้ำยันใหม่",
        "ตัดทอน ขนย้าย และคืนสภาพพื้นที่ สาเหตุ จากโรคแมลงและปลวก ทำให้รากและลำต้นผุ เน่า",
        "ตัดแต่งแผลของกิ่งที่ฉีกหัก พร้อมเก็บเคลียร์ความสะอาดในพื้นที่",
        "ปลูกเพื่อทดแทนต้นเดิมที่โค่นล่ม หรือ ยืนต้นตาย"
    ]
    assignees_list = ["สมชาย การดี", "พีระพล แสนสุข", "วิชัย ใจดี", "สมศักดิ์ ดีมาก"]
    
    image_urls = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAi8kiOMRopdjGSOlptNcZkg6jeCDmIkKN345K3y5CpRSik9JCOHDpCuz1scew8brwfk_TOUmGG8zOi9842WDzUkffevqlXtcgZUYDqbp4QPMUZH47Vv4sxl3kp2UonojpoHv2ENszkZabJxZWNgj-BQW_9AvBAPaS7mp-tg9fq_dDsK0QjPbukeI_jJqdRR6BrMxqxtjzgjfdzK9766ZaQHuGRK0sAp4VpmaIxbQhFsk_Q-2IPohvWgLmYEs8kk4zDzUaUhqmrHBk",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAqIdRWWMME_2YbQukMegmyMbzUiTjqByzOZl6qI8NTURu4tI1fxBu7_yUXCAChov-zwxaWCO9OeRCMCWUQtgJjTX5_Pudw5NJtiiDaV7Hy5s7uQybeH1R9JcqsNPlaqH54El1LQPRhbLTGgZgjZNFGCzpSHXR9cE42m9ViwsyENiXJXHBT0v46kjBZGWV0u-wriQRCQrGQeDEIIL4UjIe6TU-CKZK4mIx8nRg1lZzzkuadvh0BreJ78axe-af1QgVwribAxHeHwoY",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCl4CfONdV-UlMcG6Mo0gJGrx2yewJ_2fbmVjBCa24kfYrauSYDomkssIJPQDR54JPJg85O7pYCHy36Bc8g4x7aBOc3x8QVKHfWxpk6bCuO6KsMaj82Kgl3zE81I1ImHvCVmSCLkSzdfz13pFhlL-Cf1sPMBbHyv3cqNMReDVkeYzSz3Wkb-7qRJsbrBEAXlAB5fTRnQn1uGDnr4012SA0nd_pXLnpbw9GCXJcYKEjrPB_sxyqa_rl3F9VRD-66Rs1OAnxTKpMlBkk",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuADv61QBDFe7w-zN2Qb4QcIlWSzZ8KUetnvuFVRyXz_tu76iZDBTge-sw1i8w4d2b9dwAxwZnY-KgkrBN44IC5zjxCYwST_IW9ClUWXVdZx7ZNuUQLbuRn5XS2Qx-R0f6VACTGSopufC2P0u9W88qGsIj-h0eKOn9OQ3HfC2cp-GOfUa9liaQKR8EiyQp_ibRJVv0gGHQioihOS7OZr5BUAHbmtdOZkGsY6_WZ103kRdcmmX8Kvq-DZcTist4tPDFhRnWwG7c2mas4"
    ]

    # Load existing data to find current lowest ID
    with open('d:/Source code Aof/tu ticket gardener/tu ticket gardener/data/tickets.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    existing_ids = [t['id'] for t in data['tickets']]
    current_id = min(existing_ids) - 1 if existing_ids else 1000
    
    tickets = []
    # New period: Aug 1, 2025 to Oct 31, 2025 (approx 90 days)
    start_date = datetime(2025, 8, 1)
    end_date = datetime(2025, 10, 31)
    
    total_days = (end_date - start_date).days
    
    for i in range(180): # Approx 2 tickets per day
        random_day = start_date + timedelta(days=random.randint(0, total_days))
        random_hour = random.randint(7, 18)
        random_minute = random.randint(0, 59)
        date_str = random_day.strftime(f"%Y-%m-%d {random_hour:02d}:{random_minute:02d}")
        
        zone = random.choice(zones)
        tree = random.choice(tree_types)
        damage = random.choice(damage_types)
        
        ticket = {
            "id": current_id,
            "title": f"{tree}{random.choice(['กิ่งหัก', 'เอียง', 'โค่นล้ม', 'มีปลวก'])}",
            "description": f"พบปัญหา{tree}บริเวณ{zone['name']} ต้องการการตรวจสอบและแก้ไข (ประวัติย้อนหลัง)",
            "category": random.choice(categories),
            "status": random.choice(statuses),
            "priority": random.choice(priorities),
            "zone": zone["id"],
            "zoneName": zone["name"],
            "treeType": tree,
            "damageType": damage,
            "circumference": random.randint(10, 80) if damage != "replant" else 0,
            "quantity": random.randint(1, 5),
            "impact": random.choice(["ขวางทางเดิน", "เสี่ยงทับอาคาร", "บดบังวิสัยทัศน์", "ไฟฟ้าขัดข้อง"]),
            "operation": random.choice(operations),
            "date": date_str,
            "assignees": random.sample(assignees_list, random.randint(0, 2)),
            "images": [random.choice(image_urls)],
            "notes": "ข้อมูลประวัติย้อนหลังจากการขยายฐานข้อมูล"
        }
        tickets.append(ticket)
        current_id -= 1

    # Add new tickets
    data["tickets"] = data["tickets"] + tickets
    
    # Sort tickets by date descending
    data["tickets"].sort(key=lambda x: x["date"], reverse=True)
    
    # Update stats (optional, but good for consistency)
    data["stats"]["total"] = len(data["tickets"])
    data["stats"]["new"] = len([t for t in data["tickets"] if t["status"] == "new"])
    data["stats"]["inProgress"] = len([t for t in data["tickets"] if t["status"] == "inProgress"])
    data["stats"]["pending"] = len([t for t in data["tickets"] if t["status"] == "pending"])
    data["stats"]["completed"] = len([t for t in data["tickets"] if t["status"] == "completed"])

    with open('d:/Source code Aof/tu ticket gardener/tu ticket gardener/data/tickets.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    generate_mock_data()
    print("Done generating 180 additional tickets (6 months total).")
