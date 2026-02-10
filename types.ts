
export type ViewState = 'schedule' | 'patients' | 'settings' | 'reports';

export type Category = '心理' | '職能' | 'rTMS';

export interface Therapist {
  id: string;
  name: string;
  category: Category;
}

export interface Treatment {
  id: string;
  name: string;
  patientPrice: number;   // 病人實付/收款金額
  therapistFee: number;   // 老師/治療師固定薪資
  durationMinutes: number;
  category: Category;
}

export type AppointmentStatus = 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'noshow';

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  therapistId: string;
  treatmentId: string;
  status: AppointmentStatus;
  patientPrice: number; // 預約時的收款金額快照
  therapistFee: number; // 預約時的老師薪資快照
  paidAmount: number;
  isPaid: boolean;
  notes?: string;
  createdAt: number;
}

export interface DailyStats {
  totalAppointments: number;
  completed: number;
  totalRevenue: number;
  estimatedCommission: number;
}

export type Role = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
}
