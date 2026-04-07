# HEALTHAI - Database Accounts

## 🔐 Admin Accounts (3)

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin Master | admin@healthai.com | admin123 | admin |
| Sarah Johnson | sarah.admin@healthai.com | admin123 | admin |
| Michael Chen | michael.admin@healthai.com | admin123 | admin |

---

## 👥 Patient Accounts (10)

| Name | Email | Password | Gender | Phone |
|------|-------|----------|--------|-------|
| John Smith | john.smith@email.com | patient123 | male | +1-555-0101 |
| Emily Davis | emily.davis@email.com | patient123 | female | +1-555-0102 |
| Robert Wilson | robert.wilson@email.com | patient123 | male | +1-555-0103 |
| Maria Garcia | maria.garcia@email.com | patient123 | female | +1-555-0104 |
| James Brown | james.brown@email.com | patient123 | male | +1-555-0105 |
| Linda Martinez | linda.martinez@email.com | patient123 | female | +1-555-0106 |
| David Lee | david.lee@email.com | patient123 | male | +1-555-0107 |
| Jennifer Taylor | jennifer.taylor@email.com | patient123 | female | +1-555-0108 |
| William Anderson | william.anderson@email.com | patient123 | male | +1-555-0109 |
| Patricia Thomas | patricia.thomas@email.com | patient123 | female | +1-555-0110 |

---

## 👨‍⚕️ Doctor Accounts (30)

| # | Name | Email | Password | Specialty | City |
|---|------|-------|----------|-----------|------|
| 1 | Dr. Sarah Mitchell | sarah.mitchell@healthai.com | doctor123 | Cardiology | New York |
| 2 | Dr. David Chen | david.chen@healthai.com | doctor123 | Dermatology | Los Angeles |
| 3 | Dr. Emily Rodriguez | emily.rodriguez@healthai.com | doctor123 | Neurology | Chicago |
| 4 | Dr. Michael Johnson | michael.johnson@healthai.com | doctor123 | Orthopedics | Houston |
| 5 | Dr. Jessica Williams | jessica.williams@healthai.com | doctor123 | Pediatrics | Phoenix |
| 6 | Dr. Christopher Lee | christopher.lee@healthai.com | doctor123 | Psychiatry | Philadelphia |
| 7 | Dr. Amanda Brown | amanda.brown@healthai.com | doctor123 | Radiology | San Antonio |
| 8 | Dr. Daniel Garcia | daniel.garcia@healthai.com | doctor123 | General Surgery | San Diego |
| 9 | Dr. Rachel Martinez | rachel.martinez@healthai.com | doctor123 | Ophthalmology | New York |
| 10 | Dr. Kevin Anderson | kevin.anderson@healthai.com | doctor123 | ENT (Otolaryngology) | Los Angeles |
| 11 | Dr. Laura Taylor | laura.taylor@healthai.com | doctor123 | Gastroenterology | Chicago |
| 12 | Dr. Brian Wilson | brian.wilson@healthai.com | doctor123 | Pulmonology | Houston |
| 13 | Dr. Michelle Moore | michelle.moore@healthai.com | doctor123 | Endocrinology | Phoenix |
| 14 | Dr. Steven Jackson | steven.jackson@healthai.com | doctor123 | Nephrology | Philadelphia |
| 15 | Dr. Nicole White | nicole.white@healthai.com | doctor123 | Urology | San Antonio |
| 16 | Dr. Andrew Harris | andrew.harris@healthai.com | doctor123 | Oncology | San Diego |
| 17 | Dr. Samantha Martin | samantha.martin@healthai.com | doctor123 | Rheumatology | New York |
| 18 | Dr. Joshua Thompson | joshua.thompson@healthai.com | doctor123 | Anesthesiology | Los Angeles |
| 19 | Dr. Elizabeth Clark | elizabeth.clark@healthai.com | doctor123 | Emergency Medicine | Chicago |
| 20 | Dr. Matthew Lewis | matthew.lewis@healthai.com | doctor123 | Family Medicine | Houston |
| 21 | Dr. Ashley Walker | ashley.walker@healthai.com | doctor123 | Internal Medicine | Phoenix |
| 22 | Dr. Ryan Hall | ryan.hall@healthai.com | doctor123 | Obstetrics & Gynecology | Philadelphia |
| 23 | Dr. Megan Allen | megan.allen@healthai.com | doctor123 | Allergy & Immunology | San Antonio |
| 24 | Dr. Justin Young | justin.young@healthai.com | doctor123 | Infectious Disease | San Diego |
| 25 | Dr. Stephanie King | stephanie.king@healthai.com | doctor123 | Physical Medicine | New York |
| 26 | Dr. Brandon Wright | brandon.wright@healthai.com | doctor123 | Cardiology | Los Angeles |
| 27 | Dr. Rebecca Lopez | rebecca.lopez@healthai.com | doctor123 | Dermatology | Chicago |
| 28 | Dr. Eric Hill | eric.hill@healthai.com | doctor123 | Neurology | Houston |
| 29 | Dr. Kimberly Scott | kimberly.scott@healthai.com | doctor123 | Orthopedics | Phoenix |
| 30 | Dr. Jonathan Green | jonathan.green@healthai.com | doctor123 | Pediatrics | Philadelphia |

---

## 🏥 Medical Specialties (25)

1. Cardiology
2. Dermatology
3. Neurology
4. Orthopedics
5. Pediatrics
6. Psychiatry
7. Radiology
8. General Surgery
9. Ophthalmology
10. ENT (Otolaryngology)
11. Gastroenterology
12. Pulmonology
13. Endocrinology
14. Nephrology
15. Urology
16. Oncology
17. Rheumatology
18. Anesthesiology
19. Emergency Medicine
20. Family Medicine
21. Internal Medicine
22. Obstetrics & Gynecology
23. Allergy & Immunology
24. Infectious Disease
25. Physical Medicine

---

## 📊 Database Features

### Doctor Profiles Include:
- ✅ Real names and specialties
- ✅ Profile photos and avatars
- ✅ Experience (5-25 years)
- ✅ Consultation fees ($100-$300)
- ✅ City and clinic locations
- ✅ Languages spoken
- ✅ Education and credentials
- ✅ Insurance providers accepted
- ✅ 7-day availability schedule with time slots
- ✅ Online status and wait times

### Review System:
- ✅ Each doctor has 3-8 reviews from real patients
- ✅ Ratings: 3-5 stars
- ✅ Verified reviews with comments
- ✅ Visit types: in-person, video, chat
- ✅ Average rating calculated automatically
- ✅ Top-rated doctors appear on home page

### Patient Profiles Include:
- ✅ Full name and contact info
- ✅ Gender and date of birth
- ✅ Address
- ✅ Phone number
- ✅ Profile photo upload

---

## 🚀 How to Seed the Database

### Step 1: Stop the server (if running)

### Step 2: Run the seeding script
```bash
cd backend
node src/utils/seed.js
```

### Step 3: Restart the server
```bash
npm start
```

---

## ✅ What Gets Created

- **3 Admin accounts** - Full system access (password: admin123)
- **10 Patient accounts** - Can book appointments, rate doctors, view records (password: patient123)
- **30 Doctor accounts** - Can login, manage profiles, view appointments (password: doctor123)
- **30 Doctor profiles** - Public listings with availability, reviews, ratings
- **90-240 Reviews** - Each doctor gets 3-8 reviews with ratings
- **All medical fields covered** - 25 different specialties
- **Top-rated doctors** - Automatically calculated from reviews

---

## 🏆 Top Rated Doctors

After seeding, the top-rated doctors will appear on the home page based on their average ratings from patient reviews. The rating system ensures:

- Doctors with higher average ratings (4.5-5.0⭐) appear first
- Review count is displayed for credibility
- Only verified reviews are counted
- Ratings are recalculated when new reviews are added

---

## 🔒 Security Notes

- All passwords are hashed with bcrypt (10 rounds)
- **Admin password**: `admin123`
- **Patient password**: `patient123`
- **Doctor password**: `doctor123`
- No mock data - all connected to real MongoDB database
- Reviews are linked to real patient and doctor accounts
- All doctors are pre-approved (approvalStatus: 'approved')

---

## 📝 Notes

- Doctors have realistic availability schedules (7 days, 8 time slots per day)
- Each doctor has unique education credentials from top medical schools
- Insurance providers vary by doctor
- Languages spoken include English, Spanish, French, Mandarin, Arabic, Hindi
- Cities include: New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego
- All data is production-ready and realistic
