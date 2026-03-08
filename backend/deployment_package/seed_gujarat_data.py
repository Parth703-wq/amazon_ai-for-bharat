"""
seed_gujarat_data.py
====================
Inserts real Gujarat office locations and state-specific schemes into the database.
Run once: python seed_gujarat_data.py

Part 1: 12 real office locations in Bharuch and nearby Gujarat areas.
Part 2: 5 Gujarat state-specific schemes.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

db = SessionLocal()

# ─── Part 1: Real Office Locations ───────────────────────────────────────────

OFFICES = [
    {
        "name": "Jan Seva Kendra - Bharuch Main",
        "office_type": "jan_seva_kendra",
        "address": "Collector Office Campus, Station Road, Bharuch",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.7051,
        "longitude": 72.9959,
        "phone": "02642-242001",
        "operating_hours": "Monday to Saturday 09:00-18:00",
        "services": ["Aadhaar Update", "Ration Card", "PM Kisan", "Income Certificate"],
        "is_active": True,
    },
    {
        "name": "CSC Centre - Bharuch Causeway",
        "office_type": "csc_centre",
        "address": "Near Causeway Bridge, Bharuch",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.7089,
        "longitude": 72.9994,
        "phone": "9876543210",
        "operating_hours": "Monday to Saturday 09:00-17:00",
        "services": ["PAN Card", "Aadhaar Enrolment", "e-District", "Birth Certificate"],
        "is_active": True,
    },
    {
        "name": "Gram Panchayat Office - Amod",
        "office_type": "gram_panchayat",
        "address": "Main Road, Amod, Bharuch District",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.9833,
        "longitude": 72.8667,
        "phone": "02646-220012",
        "operating_hours": "Monday to Friday 10:00-17:00",
        "services": ["PM Kisan", "MGNREGA Job Card", "Swachh Bharat", "Jal Jeevan Mission"],
        "is_active": True,
    },
    {
        "name": "Jan Seva Kendra - Ankleshwar",
        "office_type": "jan_seva_kendra",
        "address": "Near GIDC, Ankleshwar, Bharuch District",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.6267,
        "longitude": 73.0013,
        "phone": "02646-244001",
        "operating_hours": "Monday to Saturday 09:00-18:00",
        "services": ["Aadhaar Update", "Income Certificate", "Caste Certificate", "Ration Card", "PM Kisan"],
        "is_active": True,
    },
    {
        "name": "CSC Centre - Ankleshwar GIDC",
        "office_type": "csc_centre",
        "address": "GIDC Estate Office, Ankleshwar",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.6289,
        "longitude": 73.0089,
        "phone": "9898765432",
        "operating_hours": "Monday to Saturday 09:00-17:00",
        "services": ["PAN Card", "Aadhaar", "e-District", "Driving License"],
        "is_active": True,
    },
    {
        "name": "District Social Welfare Office - Bharuch",
        "office_type": "district_office",
        "address": "District Panchayat Building, Bharuch",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.7034,
        "longitude": 72.9978,
        "phone": "02642-240055",
        "operating_hours": "Monday to Friday 10:30-18:00",
        "services": ["SC ST Scholarship", "Disability Pension", "Old Age Pension", "Widow Pension"],
        "is_active": True,
    },
    {
        "name": "Gram Panchayat - Jhagadia",
        "office_type": "gram_panchayat",
        "address": "Panchayat Bhavan, Jhagadia, Bharuch District",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.5833,
        "longitude": 73.0500,
        "phone": "02645-220034",
        "operating_hours": "Monday to Friday 10:00-17:00",
        "services": ["MGNREGA", "PM Awas Gramin", "Swachh Bharat", "Soil Health Card"],
        "is_active": True,
    },
    {
        "name": "Jan Seva Kendra - Vadodara Sayajigunj",
        "office_type": "jan_seva_kendra",
        "address": "Sayajigunj, Vadodara",
        "district": "Vadodara",
        "state": "Gujarat",
        "latitude": 22.3119,
        "longitude": 73.1723,
        "phone": "0265-2362001",
        "operating_hours": "Monday to Saturday 09:00-18:00",
        "services": ["All Services", "Aadhaar", "PAN", "Ration Card", "Income Certificate"],
        "is_active": True,
    },
    {
        "name": "CSC Centre - Surat Adajan",
        "office_type": "csc_centre",
        "address": "Adajan Patia, Surat",
        "district": "Surat",
        "state": "Gujarat",
        "latitude": 21.2282,
        "longitude": 72.8523,
        "phone": "0261-2765432",
        "operating_hours": "Monday to Saturday 09:00-17:00",
        "services": ["Aadhaar Update", "PAN Card", "e-District", "Passport"],
        "is_active": True,
    },
    {
        "name": "Jan Seva Kendra - Rajpipla",
        "office_type": "jan_seva_kendra",
        "address": "Near Bus Stand, Rajpipla, Narmada District",
        "district": "Narmada",
        "state": "Gujarat",
        "latitude": 21.8722,
        "longitude": 73.5028,
        "phone": "02640-220045",
        "operating_hours": "Monday to Saturday 09:00-17:00",
        "services": ["Tribal Schemes", "PM Kisan", "Aadhaar", "Ration Card", "Vanvasi Kalyan"],
        "is_active": True,
    },
    {
        "name": "Agriculture Office - Bharuch",
        "office_type": "district_office",
        "address": "Agriculture Bhavan, Near Collector Office, Bharuch",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.7045,
        "longitude": 72.9965,
        "phone": "02642-241234",
        "operating_hours": "Monday to Friday 10:30-18:00",
        "services": ["PM Kisan", "Fasal Bima", "Kisan Credit Card", "Soil Health Card", "Sinchai Yojana"],
        "is_active": True,
    },
    {
        "name": "Gram Panchayat - Hansot",
        "office_type": "gram_panchayat",
        "address": "Main Chowk, Hansot, Bharuch District",
        "district": "Bharuch",
        "state": "Gujarat",
        "latitude": 21.5931,
        "longitude": 72.8100,
        "phone": "02643-220021",
        "operating_hours": "Monday to Friday 10:00-17:00",
        "services": ["MGNREGA", "PM Awas", "Jal Jeevan Mission", "Swachh Bharat"],
        "is_active": True,
    },
]

# ─── Part 2: Gujarat State-Specific Schemes ───────────────────────────────────

SCHEMES = [
    {
        "name": "Mukhyamantri Amrutum Yojana (MA Yojana)",
        "description": (
            "Gujarat state health insurance scheme providing cashless treatment up to 5 lakh "
            "for BPL and lower middle class families at empanelled hospitals across Gujarat."
        ),
        "category": "health",
        "benefit_amount": "Up to 5 lakh cashless treatment",
        "eligibility_criteria": (
            "BPL families and families with annual income below 4 lakh in Gujarat"
        ),
        "required_documents": "Aadhaar card, ration card, income certificate, MA card",
        "applying_authority": "Nearest government hospital or ma.gujarat.gov.in",
        "scheme_type": "state",
        "state": "Gujarat",
        "ministry": "Government of Gujarat Health Department",
        "beneficiary_type": "family",
        "gender": "all",
        "caste": "all",
        "income_limit": 400000.0,
        "is_active": True,
        "tags": "gujarat,health,insurance,ma yojana,cashless",
    },
    {
        "name": "Kisan Suryoday Yojana",
        "description": (
            "Gujarat scheme providing 3 phase electricity connection to farmers for daytime "
            "irrigation from 5 AM to 9 PM instead of middle of night."
        ),
        "category": "agriculture",
        "benefit_amount": "Daytime electricity for irrigation at subsidized rates",
        "eligibility_criteria": (
            "All farmers in Gujarat with agricultural land and electricity connection"
        ),
        "required_documents": "Aadhaar card, electricity bill, land records",
        "applying_authority": "PGVCL or DGVCL office or your nearest electricity office in Gujarat",
        "scheme_type": "state",
        "state": "Gujarat",
        "ministry": "Government of Gujarat Energy Department",
        "beneficiary_type": "farmer",
        "gender": "all",
        "caste": "all",
        "is_active": True,
        "tags": "gujarat,electricity,farmer,irrigation,kisan suryoday",
    },
    {
        "name": "Namo Saraswati Scheme",
        "description": (
            "Gujarat government scholarship for girls studying Science stream in Class 11 and 12 "
            "at Gujarat Board schools to encourage girls in STEM education."
        ),
        "category": "education",
        "benefit_amount": "10000 to 25000 per year",
        "eligibility_criteria": (
            "Girls studying Science in Class 11 and 12 in Gujarat Board schools with minimum "
            "70 percent marks in Class 10"
        ),
        "required_documents": (
            "Aadhaar card, Class 10 marksheet, school bonafide certificate, bank passbook"
        ),
        "applying_authority": "School principal or e-Samaj Kalyan portal Gujarat",
        "scheme_type": "state",
        "state": "Gujarat",
        "ministry": "Government of Gujarat Education Department",
        "beneficiary_type": "student",
        "min_age": 15,
        "max_age": 18,
        "gender": "female",
        "caste": "all",
        "is_active": True,
        "tags": "gujarat,girl,scholarship,science,namo saraswati",
    },
    {
        "name": "Gujarat Ration Card Scheme",
        "description": (
            "Gujarat state subsidized food grain scheme providing rice at 1 rupee per kg and "
            "wheat at 2 rupees per kg to BPL and Antyodaya families through PDS ration shops."
        ),
        "category": "finance",
        "benefit_amount": "Rice at 1 rupee per kg wheat at 2 rupees per kg",
        "eligibility_criteria": (
            "BPL families and Antyodaya families in Gujarat with valid ration card"
        ),
        "required_documents": (
            "Aadhaar card, existing ration card or new application form"
        ),
        "applying_authority": "Nearest ration shop or Mamlatdar office or digitalgujarat.gov.in",
        "scheme_type": "state",
        "state": "Gujarat",
        "ministry": "Government of Gujarat Food and Civil Supplies",
        "beneficiary_type": "family",
        "gender": "all",
        "caste": "all",
        "is_active": True,
        "tags": "gujarat,ration,food,bpl,wheat,rice",
    },
    {
        "name": "Vanvasi Kalyan Yojana Gujarat",
        "description": (
            "Tribal welfare scheme for Adivasi communities in Gujarat providing educational "
            "scholarships, housing assistance, and livelihood support specifically for tribal "
            "areas including Bharuch Narmada and Dangs districts."
        ),
        "category": "social_security",
        "benefit_amount": "Varies by component — scholarships up to 15000, housing up to 1.5 lakh",
        "eligibility_criteria": (
            "Scheduled Tribe families in Gujarat especially in tribal talukas of Bharuch "
            "Narmada Dangs Tapi districts"
        ),
        "required_documents": (
            "Aadhaar card, ST caste certificate, residence proof, income certificate"
        ),
        "applying_authority": (
            "Tribal Development Department office or nearest Seva Setu camp Gujarat"
        ),
        "scheme_type": "state",
        "state": "Gujarat",
        "ministry": "Government of Gujarat Tribal Development Department",
        "beneficiary_type": "tribal",
        "gender": "all",
        "caste": "st",
        "is_active": True,
        "tags": "gujarat,tribal,adivasi,vanvasi,bharuch,narmada",
    },
]


def run():
    offices_added = 0
    schemes_added = 0

    print("\n" + "=" * 60)
    print("JanSahayak AI — Gujarat Data Seeder")
    print("=" * 60)

    # ── Part 1: Insert offices (skip if name already exists) ──────────────────
    print("\n[Part 1] Inserting office locations...")
    for o in OFFICES:
        existing = (
            db.query(models.OfficeLocation)
            .filter(models.OfficeLocation.name == o["name"])
            .first()
        )
        if existing:
            print(f"  SKIP (already exists): {o['name']}")
            continue

        db.add(models.OfficeLocation(**o))
        offices_added += 1
        print(f"  + Added: {o['name']} ({o['district']})")

    # ── Part 2: Insert schemes (skip if name already exists) ──────────────────
    print("\n[Part 2] Inserting Gujarat state schemes...")
    for s in SCHEMES:
        existing = (
            db.query(models.Scheme)
            .filter(models.Scheme.name == s["name"])
            .first()
        )
        if existing:
            print(f"  SKIP (already exists): {s['name']}")
            continue

        db.add(models.Scheme(**s))
        schemes_added += 1
        print(f"  + Added: {s['name']}")

    db.commit()
    db.close()

    print("\n" + "=" * 60)
    print(f"  Offices inserted : {offices_added}")
    print(f"  Schemes inserted : {schemes_added}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run()
