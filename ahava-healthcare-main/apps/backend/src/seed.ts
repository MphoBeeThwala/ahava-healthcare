// Database Seed Script
// Creates test users for all roles: Admin, Doctor, Nurse, Patient

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Hash password for all test users
  const password = 'Test@123456789'; // Strong password meeting requirements
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create Admin User
  console.log('Creating Admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ahava.com' },
    update: {},
    create: {
      email: 'admin@ahava.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phoneNumber: '+27123456789',
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✓ Admin created:', admin.email);

  // Create Doctor User
  console.log('\nCreating Doctor user...');
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@ahava.com' },
    update: {},
    create: {
      email: 'doctor@ahava.com',
      password: hashedPassword,
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      role: 'DOCTOR',
      phoneNumber: '+27123456790',
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✓ Doctor created:', doctor.email);

  // Create Nurse User
  console.log('\nCreating Nurse user...');
  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@ahava.com' },
    update: {},
    create: {
      email: 'nurse@ahava.com',
      password: hashedPassword,
      firstName: 'Mary',
      lastName: 'Williams',
      role: 'NURSE',
      phoneNumber: '+27123456791',
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✓ Nurse created:', nurse.email);

  // Create Patient User
  console.log('\nCreating Patient user...');
  const patient = await prisma.user.upsert({
    where: { email: 'patient@ahava.com' },
    update: {},
    create: {
      email: 'patient@ahava.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'PATIENT',
      phoneNumber: '+27123456792',
      phoneVerified: true,
      emailVerified: true,
      isActive: true,
      medicalAidNumber: 'MA123456',
      address: '123 Main Street, Johannesburg, Gauteng, 2000',
    },
  });
  console.log('✓ Patient created:', patient.email);

  console.log('\n✅ Seeding completed!\n');
  console.log('═══════════════════════════════════════════════');
  console.log('  TEST USER CREDENTIALS');
  console.log('═══════════════════════════════════════════════');
  console.log('\n🔐 Password for ALL test users: Test@123456789\n');
  console.log('👤 Admin:');
  console.log('   Email: admin@ahava.com');
  console.log('   Role:  ADMIN');
  console.log('\n👨‍⚕️ Doctor:');
  console.log('   Email: doctor@ahava.com');
  console.log('   Role:  DOCTOR');
  console.log('\n👩‍⚕️ Nurse:');
  console.log('   Email: nurse@ahava.com');
  console.log('   Role:  NURSE');
  console.log('\n🏥 Patient:');
  console.log('   Email: patient@ahava.com');
  console.log('   Role:  PATIENT');
  console.log('\n═══════════════════════════════════════════════');
  console.log('\n🚀 You can now login with these credentials!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


