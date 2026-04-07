export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  specialtyKey: string;
  avatar: string;
  photo: string;
  rating: number;
  reviewCount: number;
  experience: number;
  location: string;
  city: string;
  address: string;
  languages: string[];
  bio: string;
  consultationFee: number;
  availability: DaySlots[];
  nextAvailable: string;
  verified: boolean;
  online: boolean;
  waitTime: string;
  insurances: string[];
  education: string[];
  clinicName: string;
}

export interface DaySlots {
  day: string;
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Review {
  id: string;
  doctorId: string;
  patientName: string;
  patientAvatar: string;
  rating: number;
  comment: string;
  date: string;
  visitType: 'in-person' | 'video' | 'chat';
  verified: boolean;
}

export interface Appointment {
  id: string;
  slotId?: string;
  doctorId: string | { _id?: string; id?: string; name?: string; specialty?: string; photo?: string; avatar?: string };
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  doctorPhoto: string;
  patientName: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'chat';
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  reason: string;
  notes?: string;
  fee: number;
  reviewed?: boolean;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'diagnosis' | 'prescription' | 'lab' | 'imaging' | 'vaccination';
  title: string;
  doctor: string;
  description: string;
  attachments?: string[];
  tags: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'doctor-card' | 'disclaimer';
  suggestions?: string[];
  doctors?: Partial<Doctor>[];
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  revenue: number;
  satisfaction: number;
  chartData: number[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'system' | 'reminder';
  read: boolean;
  createdAt?: string;
  time?: string;
}

export interface SearchFilters {
  query: string;
  specialty: string;
  city: string;
  visitType: string;
  minRating: number;
  maxFee: number;
  gender: string;
  availableToday: boolean;
}
