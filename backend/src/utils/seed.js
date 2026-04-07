require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');

// Medical specialties with keys
const SPECIALTIES = [
  { name: 'Cardiology', key: 'cardiology' },
  { name: 'Dermatology', key: 'dermatology' },
  { name: 'Neurology', key: 'neurology' },
  { name: 'Orthopedics', key: 'orthopedics' },
  { name: 'Pediatrics', key: 'pediatrics' },
  { name: 'Psychiatry', key: 'psychiatry' },
  { name: 'Radiology', key: 'radiology' },
  { name: 'General Surgery', key: 'surgery' },
  { name: 'Ophthalmology', key: 'ophthalmology' },
  { name: 'ENT (Otolaryngology)', key: 'ent' },
  { name: 'Gastroenterology', key: 'gastroenterology' },
  { name: 'Pulmonology', key: 'pulmonology' },
  { name: 'Endocrinology', key: 'endocrinology' },
  { name: 'Nephrology', key: 'nephrology' },
  { name: 'Urology', key: 'urology' },
  { name: 'Oncology', key: 'oncology' },
  { name: 'Rheumatology', key: 'rheumatology' },
  { name: 'Anesthesiology', key: 'anesthesiology' },
  { name: 'Emergency Medicine', key: 'emergency' },
  { name: 'Family Medicine', key: 'family' },
  { name: 'Internal Medicine', key: 'internal' },
  { name: 'Obstetrics & Gynecology', key: 'obgyn' },
  { name: 'Allergy & Immunology', key: 'allergy' },
  { name: 'Infectious Disease', key: 'infectious' },
  { name: 'Physical Medicine', key: 'physical' },
];

// Cities
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

// Languages
const LANGUAGES = [
  ['English', 'Spanish'],
  ['English', 'French'],
  ['English', 'Mandarin'],
  ['English', 'Arabic'],
  ['English', 'Hindi'],
  ['English'],
];

// Generate time slots for a day
function generateTimeSlots() {
  const slots = [];
  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  times.forEach((time, idx) => {
    slots.push({
      id: `slot-${idx + 1}`,
      time,
      available: true, // All slots available by default
    });
  });
  return slots;
}

// Generate availability for next 7 days
function generateAvailability() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availability = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    availability.push({
      day: days[date.getDay()],
      date: date.toISOString().split('T')[0],
      slots: generateTimeSlots(),
    });
  }
  return availability;
}

// Admin accounts
const ADMINS = [
  { name: 'Admin Master', email: 'admin@healthai.com', password: 'admin123', role: 'admin' },
  { name: 'Sarah Johnson', email: 'sarah.admin@healthai.com', password: 'admin123', role: 'admin' },
  { name: 'Michael Chen', email: 'michael.admin@healthai.com', password: 'admin123', role: 'admin' },
];

// Patient accounts
const PATIENTS = [
  { name: 'John Smith', email: 'john.smith@email.com', password: 'patient123', gender: 'male', phone: '+1-555-0101' },
  { name: 'Emily Davis', email: 'emily.davis@email.com', password: 'patient123', gender: 'female', phone: '+1-555-0102' },
  { name: 'Robert Wilson', email: 'robert.wilson@email.com', password: 'patient123', gender: 'male', phone: '+1-555-0103' },
  { name: 'Maria Garcia', email: 'maria.garcia@email.com', password: 'patient123', gender: 'female', phone: '+1-555-0104' },
  { name: 'James Brown', email: 'james.brown@email.com', password: 'patient123', gender: 'male', phone: '+1-555-0105' },
  { name: 'Linda Martinez', email: 'linda.martinez@email.com', password: 'patient123', gender: 'female', phone: '+1-555-0106' },
  { name: 'David Lee', email: 'david.lee@email.com', password: 'patient123', gender: 'male', phone: '+1-555-0107' },
  { name: 'Jennifer Taylor', email: 'jennifer.taylor@email.com', password: 'patient123', gender: 'female', phone: '+1-555-0108' },
  { name: 'William Anderson', email: 'william.anderson@email.com', password: 'patient123', gender: 'male', phone: '+1-555-0109' },
  { name: 'Patricia Thomas', email: 'patricia.thomas@email.com', password: 'patient123', gender: 'female', phone: '+1-555-0110' },
];

// Doctor names (30 doctors)
const DOCTOR_NAMES = [
  'Dr. Sarah Mitchell', 'Dr. David Chen', 'Dr. Emily Rodriguez', 'Dr. Michael Johnson',
  'Dr. Jessica Williams', 'Dr. Christopher Lee', 'Dr. Amanda Brown', 'Dr. Daniel Garcia',
  'Dr. Rachel Martinez', 'Dr. Kevin Anderson', 'Dr. Laura Taylor', 'Dr. Brian Wilson',
  'Dr. Michelle Moore', 'Dr. Steven Jackson', 'Dr. Nicole White', 'Dr. Andrew Harris',
  'Dr. Samantha Martin', 'Dr. Joshua Thompson', 'Dr. Elizabeth Clark', 'Dr. Matthew Lewis',
  'Dr. Ashley Walker', 'Dr. Ryan Hall', 'Dr. Megan Allen', 'Dr. Justin Young',
  'Dr. Stephanie King', 'Dr. Brandon Wright', 'Dr. Rebecca Lopez', 'Dr. Eric Hill',
  'Dr. Kimberly Scott', 'Dr. Jonathan Green',
];

// Bio templates
const BIO_TEMPLATES = [
  'Board-certified physician with extensive experience in patient care and treatment.',
  'Dedicated to providing compassionate, evidence-based medical care to all patients.',
  'Specialized in advanced diagnostic techniques and personalized treatment plans.',
  'Committed to excellence in healthcare with a focus on patient outcomes.',
  'Experienced practitioner with a passion for preventive medicine and wellness.',
];

// Education templates
const EDUCATION_TEMPLATES = [
  ['MD - Harvard Medical School', 'Residency - Johns Hopkins Hospital'],
  ['MD - Stanford University', 'Fellowship - Mayo Clinic'],
  ['MD - Yale School of Medicine', 'Residency - Massachusetts General Hospital'],
  ['MD - Columbia University', 'Fellowship - Cleveland Clinic'],
  ['MD - University of Pennsylvania', 'Residency - UCSF Medical Center'],
];

// Insurance providers
const INSURANCES = ['Blue Cross', 'Aetna', 'UnitedHealthcare', 'Cigna', 'Humana', 'Medicare'];

// Review comments
const REVIEW_COMMENTS = [
  'Excellent doctor! Very thorough and caring. Highly recommend.',
  'Great experience. The doctor listened carefully and explained everything clearly.',
  'Professional and knowledgeable. Made me feel comfortable throughout the visit.',
  'Outstanding care. The doctor took time to answer all my questions.',
  'Very satisfied with the treatment. The doctor was patient and understanding.',
  'Highly skilled and compassionate. Would definitely visit again.',
  'Exceptional service. The doctor provided clear guidance and follow-up.',
  'Wonderful experience. The doctor was attentive and professional.',
  'Great bedside manner. Made a stressful situation much easier.',
  'Top-notch care. The doctor was thorough and explained treatment options well.',
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthai');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Review.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create Admins
    console.log('\n👤 Creating admin accounts...');
    const adminUsers = [];
    for (const admin of ADMINS) {
      const user = await User.create({
        ...admin,
        // Password will be hashed automatically by User model pre-save hook
      });
      adminUsers.push(user);
      console.log(`   ✅ Created admin: ${user.name} (${user.email})`);
    }

    // Create Patients
    console.log('\n👥 Creating patient accounts...');
    const patientUsers = [];
    for (const patient of PATIENTS) {
      const user = await User.create({
        ...patient,
        role: 'patient',
        // Password will be hashed automatically by User model pre-save hook
        dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `${Math.floor(Math.random() * 9999) + 1} Main St, ${CITIES[Math.floor(Math.random() * CITIES.length)]}, USA`,
      });
      patientUsers.push(user);
      console.log(`   ✅ Created patient: ${user.name} (${user.email})`);
    }

    // Create Doctors (both User accounts and Doctor profiles)
    console.log('\n👨‍⚕️ Creating doctor accounts...');
    const doctors = [];
    const doctorUsers = [];
    
    for (let i = 0; i < 30; i++) {
      const specialty = SPECIALTIES[i % SPECIALTIES.length];
      const city = CITIES[i % CITIES.length];
      const experience = 5 + Math.floor(Math.random() * 20); // 5-25 years
      const consultationFee = 100 + Math.floor(Math.random() * 200); // $100-$300
      const education = EDUCATION_TEMPLATES[i % EDUCATION_TEMPLATES.length];
      const languages = LANGUAGES[i % LANGUAGES.length];
      const bio = BIO_TEMPLATES[i % BIO_TEMPLATES.length];
      
      // Create User account for doctor (so they can login)
      const doctorEmail = DOCTOR_NAMES[i].toLowerCase().replace('dr. ', '').replace(' ', '.') + '@healthai.com';
      const doctorUser = await User.create({
        name: DOCTOR_NAMES[i],
        email: doctorEmail,
        password: 'doctor123', // Will be hashed automatically
        role: 'doctor',
        phone: `+1-555-${String(200 + i).padStart(4, '0')}`,
        specialty: specialty.name,
        experience,
        bio,
        education,
        languages,
        approved: true,
        approvalStatus: 'approved',
      });
      doctorUsers.push(doctorUser);
      
      // Create Doctor profile (for public listing)
      const doctor = await Doctor.create({
        name: DOCTOR_NAMES[i],
        specialty: specialty.name,
        specialtyKey: specialty.key,
        avatar: null, // No avatar by default - will show initials
        photo: null, // No photo by default
        rating: 0, // Will be calculated from reviews
        reviewCount: 0,
        experience,
        city,
        location: city,
        address: `${Math.floor(Math.random() * 999) + 1} Medical Plaza, ${city}, USA`,
        languages,
        bio,
        consultationFee,
        nextAvailable: i % 3 === 0 ? 'Today' : i % 3 === 1 ? 'Tomorrow' : 'This Week',
        verified: true,
        online: Math.random() > 0.5,
        waitTime: `${5 + Math.floor(Math.random() * 25)} min`,
        insurances: INSURANCES.slice(0, 3 + Math.floor(Math.random() * 3)),
        education,
        clinicName: `${city} Medical Center`,
        availability: generateAvailability(),
      });
      
      doctors.push(doctor);
      console.log(`   ✅ Created doctor: ${doctor.name} - ${doctor.specialty} (${doctorEmail})`);
    }

    // Create Reviews (each doctor gets 3-8 reviews from random patients)
    console.log('\n⭐ Creating reviews...');
    for (const doctor of doctors) {
      const numReviews = 3 + Math.floor(Math.random() * 6); // 3-8 reviews per doctor
      let totalRating = 0;
      
      for (let i = 0; i < numReviews; i++) {
        const patient = patientUsers[Math.floor(Math.random() * patientUsers.length)];
        const rating = 3 + Math.floor(Math.random() * 3); // 3-5 stars
        totalRating += rating;
        
        await Review.create({
          doctorId: doctor._id,
          patientId: patient._id,
          patientName: patient.name,
          patientAvatar: null, // No avatar by default
          rating,
          comment: REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)],
          visitType: ['in-person', 'video', 'chat'][Math.floor(Math.random() * 3)],
          verified: true,
        });
      }
      
      // Update doctor's rating and review count
      const avgRating = (totalRating / numReviews).toFixed(1);
      await Doctor.findByIdAndUpdate(doctor._id, {
        rating: parseFloat(avgRating),
        reviewCount: numReviews,
      });
      
      console.log(`   ✅ Created ${numReviews} reviews for ${doctor.name} (avg rating: ${avgRating})`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admins: ${adminUsers.length}`);
    console.log(`   - Patients: ${patientUsers.length}`);
    console.log(`   - Doctors: ${doctorUsers.length} (User accounts) + ${doctors.length} (Doctor profiles)`);
    console.log(`   - Medical Specialties: ${SPECIALTIES.length}`);
    console.log(`   - Reviews: Created for all doctors`);
    
    // Get top rated doctors
    const topDoctors = await Doctor.find().sort({ rating: -1 }).limit(5);
    console.log('\n🏆 Top 5 Rated Doctors:');
    topDoctors.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.name} - ${doc.specialty} (${doc.rating}⭐ from ${doc.reviewCount} reviews)`);
    });

    console.log('\n🎉 All data seeded successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Admins:   admin@healthai.com / admin123');
    console.log('   Patients: john.smith@email.com / patient123');
    console.log('   Doctors:  sarah.mitchell@healthai.com / doctor123');
    console.log('   (All patients use password: patient123)');
    console.log('   (All doctors use password: doctor123)');
    console.log('\n📝 Note: No sample appointments, medical records, or notifications created.');
    console.log('   Users must create their own data by using the application.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
