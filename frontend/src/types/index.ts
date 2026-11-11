export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  role: UserRole;
  clinicId: string;
}

export interface ClinicInfo {
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  emergencyPhone?: string;
}

export interface Doctor {
  id: string;
  fullName: string;
  department: string;
  specialization: string;
  roomNumber: string;
  consultationFee: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}

export interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  bloodGroup?: string;
  allergies: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  roomNumber: string;
  doctorName: string;
  patientName: string;
  maskedPatientName: string;
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED';
  isEmergency?: boolean;
}

