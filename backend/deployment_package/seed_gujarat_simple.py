"""
seed_gujarat_simple.py
======================
Direct PyMySQL seeder — no SQLAlchemy overhead.
Run: python seed_gujarat_simple.py

Reads DB credentials from backend/.env directly.
"""

import pymysql
import json
import time

# ── Read .env manually (no pydantic needed) ───────────────────────────────────
def load_env(path=".env"):
    cfg = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    cfg[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return cfg

env = load_env()

DB_HOST = env.get("DB_HOST", "localhost")
DB_PORT = int(env.get("DB_PORT", 3306))
DB_NAME = env.get("DB_NAME", "jansahayak")
DB_USER = env.get("DB_USER", "root")
DB_PASS = env.get("DB_PASSWORD", "")

# ── Connect with retry ────────────────────────────────────────────────────────
def get_conn():
    for attempt in range(5):
        try:
            conn = pymysql.connect(
                host=DB_HOST, port=DB_PORT, user=DB_USER,
                password=DB_PASS, database=DB_NAME,
                charset="utf8mb4", autocommit=False,
                connect_timeout=10,
            )
            return conn
        except Exception as e:
            print(f"  [Retry {attempt+1}/5] MySQL connection failed: {e}")
            time.sleep(2)
    raise RuntimeError("Could not connect to MySQL after 5 attempts.")

# ─────────────────────────────────────────────────────────────────────────────
# Part 1: Office Locations
# ─────────────────────────────────────────────────────────────────────────────

OFFICES = [
    ("Jan Seva Kendra - Bharuch Main",         "jan_seva_kendra", "Collector Office Campus, Station Road, Bharuch",              "Bharuch",  "Gujarat", 21.7051, 72.9959, "02642-242001", "Mon-Sat 09:00-18:00", '["Aadhaar Update","Ration Card","PM Kisan","Income Certificate"]'),
    ("CSC Centre - Bharuch Causeway",           "csc_centre",      "Near Causeway Bridge, Bharuch",                               "Bharuch",  "Gujarat", 21.7089, 72.9994, "9876543210",   "Mon-Sat 09:00-17:00", '["PAN Card","Aadhaar Enrolment","e-District","Birth Certificate"]'),
    ("Gram Panchayat Office - Amod",            "gram_panchayat",  "Main Road, Amod, Bharuch District",                          "Bharuch",  "Gujarat", 21.9833, 72.8667, "02646-220012", "Mon-Fri 10:00-17:00", '["PM Kisan","MGNREGA Job Card","Swachh Bharat","Jal Jeevan Mission"]'),
    ("Jan Seva Kendra - Ankleshwar",            "jan_seva_kendra", "Near GIDC, Ankleshwar, Bharuch District",                    "Bharuch",  "Gujarat", 21.6267, 73.0013, "02646-244001", "Mon-Sat 09:00-18:00", '["Aadhaar Update","Income Certificate","Caste Certificate","Ration Card","PM Kisan"]'),
    ("CSC Centre - Ankleshwar GIDC",            "csc_centre",      "GIDC Estate Office, Ankleshwar",                             "Bharuch",  "Gujarat", 21.6289, 73.0089, "9898765432",   "Mon-Sat 09:00-17:00", '["PAN Card","Aadhaar","e-District","Driving License"]'),
    ("District Social Welfare Office - Bharuch","district_office", "District Panchayat Building, Bharuch",                       "Bharuch",  "Gujarat", 21.7034, 72.9978, "02642-240055", "Mon-Fri 10:30-18:00", '["SC ST Scholarship","Disability Pension","Old Age Pension","Widow Pension"]'),
    ("Gram Panchayat - Jhagadia",               "gram_panchayat",  "Panchayat Bhavan, Jhagadia, Bharuch District",               "Bharuch",  "Gujarat", 21.5833, 73.0500, "02645-220034", "Mon-Fri 10:00-17:00", '["MGNREGA","PM Awas Gramin","Swachh Bharat","Soil Health Card"]'),
    ("Jan Seva Kendra - Vadodara Sayajigunj",   "jan_seva_kendra", "Sayajigunj, Vadodara",                                       "Vadodara", "Gujarat", 22.3119, 73.1723, "0265-2362001", "Mon-Sat 09:00-18:00", '["All Services","Aadhaar","PAN","Ration Card","Income Certificate"]'),
    ("CSC Centre - Surat Adajan",               "csc_centre",      "Adajan Patia, Surat",                                        "Surat",    "Gujarat", 21.2282, 72.8523, "0261-2765432", "Mon-Sat 09:00-17:00", '["Aadhaar Update","PAN Card","e-District","Passport"]'),
    ("Jan Seva Kendra - Rajpipla",              "jan_seva_kendra", "Near Bus Stand, Rajpipla, Narmada District",                 "Narmada",  "Gujarat", 21.8722, 73.5028, "02640-220045", "Mon-Sat 09:00-17:00", '["Tribal Schemes","PM Kisan","Aadhaar","Ration Card","Vanvasi Kalyan"]'),
    ("Agriculture Office - Bharuch",            "district_office", "Agriculture Bhavan, Near Collector Office, Bharuch",          "Bharuch",  "Gujarat", 21.7045, 72.9965, "02642-241234", "Mon-Fri 10:30-18:00", '["PM Kisan","Fasal Bima","Kisan Credit Card","Soil Health Card","Sinchai Yojana"]'),
    ("Gram Panchayat - Hansot",                 "gram_panchayat",  "Main Chowk, Hansot, Bharuch District",                       "Bharuch",  "Gujarat", 21.5931, 72.8100, "02643-220021", "Mon-Fri 10:00-17:00", '["MGNREGA","PM Awas","Jal Jeevan Mission","Swachh Bharat"]'),
]

# ─────────────────────────────────────────────────────────────────────────────
# Part 2: Gujarat Schemes
# ─────────────────────────────────────────────────────────────────────────────

SCHEMES = [
    {
        "name": "Mukhyamantri Amrutum Yojana (MA Yojana)",
        "description": "Gujarat state health insurance scheme providing cashless treatment up to 5 lakh for BPL and lower middle class families at empanelled hospitals across Gujarat.",
        "category": "health",
        "benefit_amount": "Up to 5 lakh cashless treatment",
        "eligibility_criteria": "BPL families and families with annual income below 4 lakh in Gujarat",
        "required_documents": "Aadhaar card, ration card, income certificate, MA card",
        "applying_authority": "Nearest government hospital or ma.gujarat.gov.in",
        "scheme_type": "state", "state": "Gujarat",
        "ministry": "Government of Gujarat Health Department",
        "beneficiary_type": "family", "gender": "all", "caste": "all",
        "income_limit": 400000, "is_active": 1,
        "tags": "gujarat,health,insurance,ma yojana,cashless",
    },
    {
        "name": "Kisan Suryoday Yojana",
        "description": "Gujarat scheme providing 3 phase electricity connection to farmers for daytime irrigation from 5 AM to 9 PM instead of middle of night.",
        "category": "agriculture",
        "benefit_amount": "Daytime electricity for irrigation at subsidized rates",
        "eligibility_criteria": "All farmers in Gujarat with agricultural land and electricity connection",
        "required_documents": "Aadhaar card, electricity bill, land records",
        "applying_authority": "PGVCL or DGVCL office or your nearest electricity office in Gujarat",
        "scheme_type": "state", "state": "Gujarat",
        "ministry": "Government of Gujarat Energy Department",
        "beneficiary_type": "farmer", "gender": "all", "caste": "all",
        "is_active": 1,
        "tags": "gujarat,electricity,farmer,irrigation,kisan suryoday",
    },
    {
        "name": "Namo Saraswati Scheme",
        "description": "Gujarat government scholarship for girls studying Science stream in Class 11 and 12 at Gujarat Board schools to encourage girls in STEM education.",
        "category": "education",
        "benefit_amount": "10000 to 25000 per year",
        "eligibility_criteria": "Girls studying Science in Class 11 and 12 in Gujarat Board schools with minimum 70 percent marks in Class 10",
        "required_documents": "Aadhaar card, Class 10 marksheet, school bonafide certificate, bank passbook",
        "applying_authority": "School principal or e-Samaj Kalyan portal Gujarat",
        "scheme_type": "state", "state": "Gujarat",
        "ministry": "Government of Gujarat Education Department",
        "beneficiary_type": "student", "min_age": 15, "max_age": 18,
        "gender": "female", "caste": "all", "is_active": 1,
        "tags": "gujarat,girl,scholarship,science,namo saraswati",
    },
    {
        "name": "Gujarat Ration Card Scheme",
        "description": "Gujarat state subsidized food grain scheme providing rice at 1 rupee per kg and wheat at 2 rupees per kg to BPL and Antyodaya families through PDS ration shops.",
        "category": "finance",
        "benefit_amount": "Rice at 1 rupee per kg wheat at 2 rupees per kg",
        "eligibility_criteria": "BPL families and Antyodaya families in Gujarat with valid ration card",
        "required_documents": "Aadhaar card, existing ration card or new application form",
        "applying_authority": "Nearest ration shop or Mamlatdar office or digitalgujarat.gov.in",
        "scheme_type": "state", "state": "Gujarat",
        "ministry": "Government of Gujarat Food and Civil Supplies",
        "beneficiary_type": "family", "gender": "all", "caste": "all",
        "is_active": 1,
        "tags": "gujarat,ration,food,bpl,wheat,rice",
    },
    {
        "name": "Vanvasi Kalyan Yojana Gujarat",
        "description": "Tribal welfare scheme for Adivasi communities in Gujarat providing educational scholarships, housing assistance, and livelihood support specifically for tribal areas including Bharuch Narmada and Dangs districts.",
        "category": "social_security",
        "benefit_amount": "Varies by component - scholarships up to 15000, housing up to 1.5 lakh",
        "eligibility_criteria": "Scheduled Tribe families in Gujarat especially in tribal talukas of Bharuch Narmada Dangs Tapi districts",
        "required_documents": "Aadhaar card, ST caste certificate, residence proof, income certificate",
        "applying_authority": "Tribal Development Department office or nearest Seva Setu camp Gujarat",
        "scheme_type": "state", "state": "Gujarat",
        "ministry": "Government of Gujarat Tribal Development Department",
        "beneficiary_type": "tribal", "gender": "all", "caste": "st",
        "is_active": 1,
        "tags": "gujarat,tribal,adivasi,vanvasi,bharuch,narmada",
    },
]


def run():
    print("\n" + "=" * 60)
    print("  JanSahayak AI - Gujarat Data Seeder")
    print(f"  DB: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print("=" * 60)

    conn = get_conn()
    cur  = conn.cursor()
    offices_added = 0
    schemes_added = 0

    # ── Part 1: Offices ───────────────────────────────────────────────────────
    print("\n[Part 1] Inserting office locations...")
    for o in OFFICES:
        name = o[0]
        cur.execute("SELECT id FROM office_locations WHERE name = %s LIMIT 1", (name,))
        if cur.fetchone():
            print(f"  SKIP: {name}")
            continue
        cur.execute(
            """INSERT INTO office_locations
               (name, office_type, address, district, state,
                latitude, longitude, phone, operating_hours, services, is_active)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1)""",
            o,
        )
        offices_added += 1
        print(f"  + {name}")

    conn.commit()

    # ── Part 2: Schemes ───────────────────────────────────────────────────────
    print("\n[Part 2] Inserting Gujarat state schemes...")
    for s in SCHEMES:
        cur.execute("SELECT id FROM schemes WHERE name = %s LIMIT 1", (s["name"],))
        if cur.fetchone():
            print(f"  SKIP: {s['name']}")
            continue

        cur.execute(
            """INSERT INTO schemes
               (name, description, category, benefit_amount, eligibility_criteria,
                required_documents, applying_authority, scheme_type, state, ministry,
                beneficiary_type, gender, caste, is_active, tags,
                income_limit, min_age, max_age)
               VALUES (%(name)s, %(description)s, %(category)s, %(benefit_amount)s,
                       %(eligibility_criteria)s, %(required_documents)s, %(applying_authority)s,
                       %(scheme_type)s, %(state)s, %(ministry)s,
                       %(beneficiary_type)s, %(gender)s, %(caste)s, %(is_active)s, %(tags)s,
                       %(income_limit)s, %(min_age)s, %(max_age)s)""",
            {
                "name": s["name"],
                "description": s["description"],
                "category": s["category"],
                "benefit_amount": s["benefit_amount"],
                "eligibility_criteria": s["eligibility_criteria"],
                "required_documents": s["required_documents"],
                "applying_authority": s["applying_authority"],
                "scheme_type": s["scheme_type"],
                "state": s["state"],
                "ministry": s["ministry"],
                "beneficiary_type": s["beneficiary_type"],
                "gender": s["gender"],
                "caste": s["caste"],
                "is_active": s["is_active"],
                "tags": s["tags"],
                "income_limit": s.get("income_limit"),
                "min_age": s.get("min_age"),
                "max_age": s.get("max_age"),
            },
        )
        schemes_added += 1
        print(f"  + {s['name']}")

    conn.commit()
    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    print(f"  Offices inserted  : {offices_added} / {len(OFFICES)}")
    print(f"  Schemes inserted  : {schemes_added} / {len(SCHEMES)}")
    print("  Done! Gujarat data seeded successfully.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run()
