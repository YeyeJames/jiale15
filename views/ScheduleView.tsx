
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle, Banknote, Trash2, RotateCcw, AlertTriangle, Coffee, Sparkles, Filter, FileText, Info, CalendarDays, X, UserMinus, MousePointer2 } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Appointment, Therapist, Treatment, Category } from '../types';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface ScheduleViewProps {
  appointments: Appointment[];
  therapists: Therapist[];
  treatments: Treatment[];
  onAddAppointment: (apt: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
  onDeleteAppointment: (id: string) => void;
}

interface PendingAction {
    type: 'checkin' | 'reset' | 'delete' | 'cancel';
    appointment: Appointment;
    title: string;
    message: string;
    confirmText: string;
    confirmVariant: 'primary' | 'danger' | 'success';
}

const parseLocal = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  appointments,
  therapists,
  treatments,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid'>('all');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [modalNotes, setModalNotes] = useState('');

  const calendarRef = useRef<HTMLDivElement>(null);

  const [formCategory, setFormCategory] = useState<Category>('心理');
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    time: '09:00',
    therapistId: '',
    treatmentId: '',
    notes: '',
    customPatientPrice: '',
    customTherapistFee: '',
  });

  useEffect(() => {
    if (pendingAction) {
        setModalNotes(pendingAction.appointment.notes || '');
    }
  }, [pendingAction]);

  useEffect(() => {
    if (isAddModalOpen) {
      setFormData(prev => ({ ...prev, therapistId: '', treatmentId: '', customPatientPrice: '', customTherapistFee: '' }));
    }
  }, [formCategory, isAddModalOpen]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const filteredTherapists = useMemo(() => {
    return therapists.filter(t => t.category === formCategory);
  }, [therapists, formCategory]);

  const filteredTreatments = useMemo(() => {
    if (!formData.therapistId) return [];
    const therapist = therapists.find(t => t.id === formData.therapistId);
    if (!therapist) return [];
    return treatments.filter(tr => tr.category === therapist.category);
  }, [formData.therapistId, therapists, treatments]);

  const selectedTreatmentObj = useMemo(() => {
    return treatments.find(t => t.id === formData.treatmentId);
  }, [formData.treatmentId, treatments]);

  const isOtherTreatment = useMemo(() => {
    return selectedTreatmentObj?.name === '其他';
  }, [selectedTreatmentObj]);

  const dailyAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  const stats = useMemo(() => {
    const total = dailyAppointments.length;
    const completed = dailyAppointments.filter(a => a.status === 'completed').length;
    const revenue = dailyAppointments.reduce((acc, curr) => acc + (curr.isPaid ? curr.paidAmount : 0), 0);
    return { total, completed, revenue };
  }, [dailyAppointments]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth));
    const end = endOfWeek(endOfMonth(calendarMonth));
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const triggerCheckIn = (apt: Appointment) => {
    setPendingAction({
        type: 'checkin',
        appointment: apt,
        title: '確認報到與繳費',
        message: `您即將辦理「${apt.patientName}」的報到，並收取款項 $${apt.patientPrice}。此操作將同時標記為完成治療。`,
        confirmText: '確認收款',
        confirmVariant: 'primary'
    });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    const { type, appointment: apt } = pendingAction;
    const commonUpdates = { notes: modalNotes };

    if (type === 'checkin') {
        onUpdateAppointment(apt.id, { ...commonUpdates, status: 'completed', isPaid: true, paidAmount: apt.patientPrice });
    } else if (type === 'reset') {
        onUpdateAppointment(apt.id, { ...commonUpdates, status: 'scheduled', isPaid: false, paidAmount: 0 });
    } else if (type === 'cancel') {
        onUpdateAppointment(apt.id, { ...commonUpdates, status: 'cancelled' });
    } else if (type === 'delete') {
        onDeleteAppointment(apt.id);
    }
    setPendingAction(null);
  };

  const handlePrevDay = () => setSelectedDate(prev => format(addDays(parseLocal(prev), -1), 'yyyy-MM-dd'));
  const handleNextDay = () => setSelectedDate(prev => format(addDays(parseLocal(prev), 1), 'yyyy-MM-dd'));
  const handleSelectCalendarDate = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setIsCalendarOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const treatment = treatments.find(t => t.id === formData.treatmentId);
    if (!treatment) return;

    let pPrice = treatment.patientPrice;
    let tFee = treatment.therapistFee;

    if (isOtherTreatment) {
        pPrice = parseFloat(formData.customPatientPrice) || 0;
        tFee = parseFloat(formData.customTherapistFee) || 0;
        if (!formData.notes.trim()) {
            alert('選擇「其他」項目時，請務必於備註欄說明原因。');
            return;
        }
    }

    onAddAppointment({
      ...formData,
      date: selectedDate,
      status: 'scheduled',
      patientPrice: pPrice,
      therapistFee: tFee,
      paidAmount: 0,
      isPaid: false,
    });
    setIsAddModalOpen(false);
    setFormData({ patientName: '', patientPhone: '', time: '09:00', therapistId: '', treatmentId: '', notes: '', customPatientPrice: '', customTherapistFee: '' });
  };

  const categories: Category[] = ['心理', '職能', 'rTMS'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Header with Calendar Picker */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative">
        <div className="flex items-center gap-4">
            <button onClick={handlePrevDay} className="p-3 md:p-4 bg-stone-50 rounded-xl text-stone-600 hover:bg-amber-100 hover:text-amber-700 transition-all border border-stone-100"><ChevronLeft size={24}/></button>
            
            <div className="relative" ref={calendarRef}>
              <button 
                onClick={() => {
                  setIsCalendarOpen(!isCalendarOpen);
                  setCalendarMonth(parseLocal(selectedDate));
                }}
                className="flex flex-col items-center px-4 min-w-[180px] group cursor-pointer hover:bg-stone-50 rounded-2xl transition-all py-1"
              >
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1 group-hover:text-amber-500">{format(parseLocal(selectedDate), 'yyyy')}</span>
                  <span className="text-2xl md:text-3xl font-black text-stone-800 flex items-center gap-3">
                      <Calendar size={28} className="text-amber-500 group-hover:scale-110 transition-transform"/>
                      {format(parseLocal(selectedDate), 'MM月dd日')}
                      <span className="text-amber-500/50">{WEEKDAYS[parseLocal(selectedDate).getDay()]}</span>
                  </span>
              </button>

              {/* Popup Calendar Selector */}
              {isCalendarOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 bg-white rounded-[2rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)] border border-stone-100 p-6 w-[320px] animate-in zoom-in-95 duration-200 origin-top">
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-800"><ChevronLeft size={20}/></button>
                    <span className="font-black text-stone-800 text-lg">{format(calendarMonth, 'yyyy年 MM月')}</span>
                    <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-800"><ChevronRight size={20}/></button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEKDAYS_SHORT.map(d => <div key={d} className="text-center text-[10px] font-black text-stone-300 uppercase py-1">{d}</div>)}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      const isSelected = isSameDay(day, parseLocal(selectedDate));
                      const isCurrentMonth = isSameMonth(day, calendarMonth);
                      return (
                        <button 
                          key={i} 
                          onClick={() => handleSelectCalendarDate(day)}
                          className={`
                            h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all
                            ${isSelected ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 
                              isCurrentMonth ? 'text-stone-700 hover:bg-amber-50 hover:text-amber-600' : 'text-stone-200'}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-50 flex gap-2">
                    <button 
                      onClick={() => handleSelectCalendarDate(new Date())}
                      className="flex-1 py-2 text-xs font-black text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all"
                    >
                      回今天 Today
                    </button>
                    <button 
                      onClick={() => setIsCalendarOpen(false)}
                      className="p-2 text-stone-300 hover:text-stone-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleNextDay} className="p-3 md:p-4 bg-stone-50 rounded-xl text-stone-600 hover:bg-amber-100 hover:text-amber-700 transition-all border border-stone-100"><ChevronRight size={24}/></button>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsAddModalOpen(true)} size="md" icon={<Plus size={24} strokeWidth={3} />}>新增預約</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem title="今日預約" val={`${stats.total} 位`} icon={<Calendar/>} color="bg-amber-50 text-amber-600" />
        <StatItem title="已完成" val={`${stats.completed} 位`} icon={<CheckCircle/>} color="bg-emerald-50 text-emerald-600" />
        <StatItem title="今日營收" val={`$${stats.revenue.toLocaleString()}`} icon={<Banknote/>} color="bg-yellow-50 text-yellow-600" />
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-stone-200/60 border border-stone-100 overflow-hidden">
        <div className="border-b border-stone-100 px-8 py-4 flex gap-8 bg-stone-50/30">
            <button onClick={() => setActiveTab('all')} className={`pb-2 text-lg font-black transition-all border-b-4 ${activeTab === 'all' ? 'border-amber-500 text-stone-800' : 'border-transparent text-stone-400'}`}>全部排程</button>
            <button onClick={() => setActiveTab('unpaid')} className={`pb-2 text-lg font-black transition-all border-b-4 ${activeTab === 'unpaid' ? 'border-amber-500 text-stone-800' : 'border-transparent text-stone-400'}`}>待繳費</button>
        </div>

        <div className="divide-y divide-stone-50 p-4">
            {dailyAppointments.length === 0 ? (
                <div className="py-24 px-8 text-center flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-amber-50 rounded-[3rem] shadow-inner flex items-center justify-center text-amber-500 relative z-10 animate-bounce transition-all duration-1000">
                      <Coffee size={64} strokeWidth={1.2} className="md:w-20 md:h-20" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-lg animate-pulse z-20">
                      <Sparkles size={24} />
                    </div>
                    <div className="absolute -bottom-2 -left-6 w-16 h-16 bg-brand-yellow/20 rounded-full blur-2xl z-0"></div>
                  </div>
                  
                  <div className="max-w-md space-y-4">
                    <h3 className="text-3xl md:text-4xl font-black text-stone-800 tracking-tight">
                        今天暫時還沒有預約喔！
                    </h3>
                    <div className="space-y-2">
                        <p className="text-stone-400 font-bold text-lg md:text-xl leading-relaxed">
                            給自己倒杯咖啡，享受這片刻的悠閒。
                        </p>
                        <p className="text-amber-600/60 font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <MousePointer2 size={16} /> 點擊下方按鈕開始排程
                        </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={() => setIsAddModalOpen(true)} 
                        icon={<Plus size={28} strokeWidth={3} />}
                        className="shadow-2xl hover:scale-105 active:scale-95 transition-all px-12"
                    >
                        建立首筆預約
                    </Button>
                  </div>
                  
                  {/* Decorative background element */}
                  <div className="absolute opacity-[0.03] pointer-events-none select-none -z-10 overflow-hidden inset-0 flex items-center justify-center">
                    <CalendarDays size={600} strokeWidth={0.5} className="rotate-12" />
                  </div>
                </div>
            ) : (
                dailyAppointments
                .filter(a => activeTab === 'all' || (activeTab === 'unpaid' && !a.isPaid && a.status !== 'cancelled'))
                .map((apt) => {
                    const therapist = therapists.find(t => t.id === apt.therapistId);
                    const treatment = treatments.find(t => t.id === apt.treatmentId);
                    const categoryColors: Record<string, string> = { '心理': 'bg-purple-100 text-purple-600', '職能': 'bg-blue-100 text-blue-600', 'rTMS': 'bg-emerald-100 text-emerald-600' };

                    return (
                        <div key={apt.id} className="p-6 md:p-8 hover:bg-amber-50/40 rounded-[1.5rem] transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6 group">
                            <div className="flex items-start gap-6 flex-1">
                                <div className="min-w-[80px] flex flex-col items-center justify-center bg-stone-100 group-hover:bg-white rounded-2xl py-4 shadow-inner border border-stone-200/50">
                                    <span className="text-xl font-black text-stone-800 tracking-tight">{apt.time}</span>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <h4 className="font-black text-2xl text-stone-800">{apt.patientName}</h4>
                                        <StatusBadge status={apt.status} />
                                        {apt.isPaid && <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">Paid ${apt.paidAmount}</span>}
                                        {therapist && <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-widest ${categoryColors[therapist.category] || 'bg-stone-100 text-stone-600'}`}>{therapist.category}</span>}
                                    </div>
                                    <p className="text-lg text-stone-500 font-bold">{treatment?.name || '未知項目'} <span className="text-stone-300 mx-2">/</span> {therapist?.name || '未知治療師'}</p>
                                    {apt.notes && <p className="mt-2 text-sm text-stone-400 italic flex items-center gap-2 bg-stone-50 p-3 rounded-xl"><FileText size={16} /> {apt.notes}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                {apt.status === 'scheduled' ? (
                                    <>
                                        <Button variant="primary" size="md" icon={<Banknote size={20} />} onClick={() => triggerCheckIn(apt)}>報到繳費</Button>
                                        <Button 
                                            variant="danger" 
                                            size="md" 
                                            icon={<UserMinus size={20} />} 
                                            onClick={() => setPendingAction({ 
                                                type: 'cancel', 
                                                appointment: apt, 
                                                title: '個案請假 / 取消預約', 
                                                message: `確定要取消 ${apt.patientName} 的預約？`, 
                                                confirmText: '確定請假/取消', 
                                                confirmVariant: 'danger' 
                                            })}
                                        >
                                            請假/取消
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="secondary" size="md" icon={<RotateCcw size={20} />} onClick={() => setPendingAction({ type: 'reset', appointment: apt, title: '重設狀態', message: `確定重設 ${apt.patientName} 為預約中？`, confirmText: '確定重設', confirmVariant: 'danger' })}>重設</Button>
                                )}
                                <button onClick={() => setPendingAction({ type: 'delete', appointment: apt, title: '永久刪除', message: `確定要永久刪除這筆紀錄嗎？`, confirmText: '永久刪除', confirmVariant: 'danger' })} className="p-3 text-stone-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"><Trash2 size={24}/></button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      <Modal isOpen={!!pendingAction} onClose={() => setPendingAction(null)} title={pendingAction?.title || ''} footer={<><Button variant="secondary" size="md" onClick={() => setPendingAction(null)}>取消</Button><Button variant={pendingAction?.confirmVariant || 'primary'} size="md" onClick={handleConfirmAction}>{pendingAction?.confirmText}</Button></>}>
        <div className="space-y-6">
            <div className="flex items-start gap-6 p-4 bg-stone-50 rounded-2xl">
                <div className={`p-4 rounded-xl shrink-0 ${pendingAction?.confirmVariant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}><AlertTriangle size={32} /></div>
                <p className="text-lg text-stone-600 font-bold leading-relaxed pt-1">{pendingAction?.message}</p>
            </div>
            {pendingAction?.type !== 'delete' && (
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">薪資備註 Salary Notes</label>
                    <textarea className="w-full border-2 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-bold bg-stone-50 text-base h-32 resize-none shadow-inner" placeholder="原因或薪資對帳說明..." value={modalNotes} onChange={e => setModalNotes(e.target.value)} />
                </div>
            )}
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新增預約紀錄">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                 <div><label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">時間 Time</label><input type="time" required className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 text-lg" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}/></div>
                 <div><label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">日期 Date</label><div className="p-4 bg-stone-100 border-2 border-stone-100 rounded-xl text-stone-600 font-black text-lg">{selectedDate}</div></div>
            </div>
            <div><label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">個案姓名 Patient</label><input type="text" required placeholder="請輸入姓名" className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 text-lg" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})}/></div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">預約科別 Category</label>
              <div className="flex gap-3 p-1.5 bg-stone-100 rounded-2xl mb-4 shadow-inner">
                {categories.map(cat => (
                  <button key={cat} type="button" onClick={() => setFormCategory(cat)} className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${formCategory === cat ? 'bg-amber-500 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-200'}`}>{cat}</button>
                ))}
              </div>

              <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">主責人員 Responsible Person ({formCategory})</label>
              <select required className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 appearance-none text-lg" value={formData.therapistId} onChange={e => setFormData({...formData, therapistId: e.target.value})}>
                <option value="">選擇治療師/醫師</option>
                {filteredTherapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">治療項目 Treatment</label>
              <select required disabled={!formData.therapistId} className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 appearance-none disabled:opacity-50 text-lg" value={formData.treatmentId} onChange={e => setFormData({...formData, treatmentId: e.target.value})}>
                  <option value="">{formData.therapistId ? "選擇項目" : "請先選擇人員"}</option>
                  {filteredTreatments.map(t => <option key={t.id} value={t.id}>{t.name} {t.name !== '其他' ? `(實收$${t.patientPrice})` : '(自定義收費)'}</option>)}
              </select>
            </div>

            {isOtherTreatment && (
                <div className="grid grid-cols-2 gap-6 animate-in zoom-in-95 duration-200">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-amber-600 flex items-center gap-2"><Banknote size={16}/> 自填實收金額</label>
                        <input type="number" required placeholder="0" className="w-full border-2 border-amber-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-amber-50 text-lg shadow-inner" value={formData.customPatientPrice} onChange={e => setFormData({...formData, customPatientPrice: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-2 text-amber-600 flex items-center gap-2"><Sparkles size={16}/> 自填人員薪資</label>
                        <input type="number" required placeholder="0" className="w-full border-2 border-amber-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-amber-50 text-lg shadow-inner" value={formData.customTherapistFee} onChange={e => setFormData({...formData, customTherapistFee: e.target.value})}/>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">預約備註 / 薪資說明 {isOtherTreatment ? <span className="text-red-500 font-black">(必填)</span> : "(選填)"}</label>
                <textarea className={`w-full border-2 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-bold bg-stone-50 text-base h-28 resize-none transition-all shadow-inner ${isOtherTreatment && !formData.notes ? 'border-amber-200' : ''}`} placeholder={isOtherTreatment ? "請務必說明選用「其他」項目的原因..." : "備註..."} value={formData.notes} required={isOtherTreatment} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>

            <div className="mt-6 flex justify-end gap-4 pt-6 border-t border-stone-100">
                <Button variant="secondary" size="md" onClick={() => setIsAddModalOpen(false)}>取消</Button>
                <Button type="submit" size="md" disabled={!formData.treatmentId || (isOtherTreatment && (!formData.customPatientPrice || !formData.notes.trim()))}>建立預約</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

const StatItem = ({title, val, icon, color}: {title: string, val: string, icon: React.ReactNode, color: string}) => (
  <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/50 flex items-center justify-between group hover:scale-[1.02] transition-all">
      <div><p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-2">{title}</p><p className="text-3xl font-black text-stone-800 tracking-tighter">{val}</p></div>
      <div className={`h-16 w-16 ${color} rounded-2xl flex items-center justify-center shadow-md`}>{React.cloneElement(icon as React.ReactElement<any>, { size: 32, strokeWidth: 2.5 })}</div>
  </div>
);
