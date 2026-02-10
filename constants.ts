
import { Therapist, Treatment, Appointment, User } from './types';

export const INITIAL_THERAPISTS: Therapist[] = [
  { id: 't1', name: '陳心理師', category: '心理' },
  { id: 't2', name: '林物理治療師', category: '職能' },
  { id: 't3', name: '王職能治療師', category: '職能' },
  { id: 't_rtms', name: '執行醫師', category: 'rTMS' },
];

export const INITIAL_TREATMENTS: Treatment[] = [
  { id: 'tr1', name: '心理衡鑑', patientPrice: 2000, therapistFee: 1000, durationMinutes: 60, category: '心理' },
  { id: 'tr2', name: '個別心理治療', patientPrice: 1600, therapistFee: 800, durationMinutes: 50, category: '心理' },
  { id: 'tr_other_psy', name: '其他', patientPrice: 0, therapistFee: 0, durationMinutes: 30, category: '心理' },
  { id: 'tr3', name: '職能發展評估', patientPrice: 1200, therapistFee: 600, durationMinutes: 40, category: '職能' },
  { id: 'tr4', name: '精細動作訓練', patientPrice: 800, therapistFee: 400, durationMinutes: 30, category: '職能' },
  { id: 'tr_other_ot', name: '其他', patientPrice: 0, therapistFee: 0, durationMinutes: 30, category: '職能' },
  { id: 'tr_rtms', name: 'rTMS', patientPrice: 3500, therapistFee: 0, durationMinutes: 30, category: 'rTMS' },
  { id: 'tr_rtms_free', name: 'rTMS (送)', patientPrice: 0, therapistFee: 0, durationMinutes: 30, category: 'rTMS' },
  { id: 'tr_rtms_short', name: 'rTMS(短療程)', patientPrice: 2500, therapistFee: 0, durationMinutes: 30, category: 'rTMS' },
  { id: 'tr_other_rtms', name: '其他', patientPrice: 0, therapistFee: 0, durationMinutes: 30, category: 'rTMS' },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'jiale', password: 'jiale', name: '管理員', role: 'admin' },
  { id: 'u2', username: 'staff', password: 'staff', name: '櫃檯人員', role: 'staff' },
];

const today = new Date().toISOString().split('T')[0];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientName: '張大山',
    patientPhone: '0912-345-678',
    date: today,
    time: '09:00',
    therapistId: 't1',
    treatmentId: 'tr1',
    status: 'completed',
    patientPrice: 2000,
    therapistFee: 1000,
    paidAmount: 2000,
    isPaid: true,
    createdAt: Date.now(),
  }
];
