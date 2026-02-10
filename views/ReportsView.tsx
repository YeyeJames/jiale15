
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Appointment, Therapist, Treatment } from '../types';
// Add Info to the lucide-react imports
import { DollarSign, Calendar as CalendarIcon, Briefcase, FileText, Printer, PieChart, Users, ReceiptText, ChevronDown, ChevronUp, UserCheck, TrendingUp, BarChart, Coffee, Sparkles, ClipboardList, Info } from 'lucide-react';
import { Button } from '../components/Button';
import { JialeLogo } from '../App';

interface ReportsViewProps {
  appointments: Appointment[];
  therapists: Therapist[];
  treatments: Treatment[];
}

type ReportTab = 'summary' | 'therapist' | 'treatment' | 'payroll';

export const ReportsView: React.FC<ReportsViewProps> = ({ appointments, therapists, treatments }) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [expandedTherapist, setExpandedTherapist] = useState<string | null>(null);

  const monthData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    
    const filtered = appointments.filter(apt => {
      try {
        const [aY, aM, aD] = apt.date.split('-').map(Number);
        const aptDate = new Date(aY, aM - 1, aD);
        return aptDate >= start && aptDate <= end;
      } catch (e) { return false; }
    });

    const completedApts = filtered.filter(apt => apt.status === 'completed');
    const totalRevenue = completedApts.reduce((sum, apt) => sum + (apt.isPaid ? apt.paidAmount : 0), 0);
    const completedCount = completedApts.length;
    const cancelledCount = filtered.filter(apt => apt.status === 'cancelled').length;

    const therapistStats = therapists.map(t => {
      const tApts = completedApts.filter(apt => apt.therapistId === t.id)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      
      const revenue = tApts.reduce((sum, apt) => sum + (apt.isPaid ? apt.paidAmount : 0), 0);
      const totalCommission = tApts.reduce((sum, apt) => sum + apt.therapistFee, 0);
      
      const details = tApts.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        patientName: apt.patientName,
        treatmentName: treatments.find(tr => tr.id === apt.treatmentId)?.name || '未知項目',
        patientPaid: apt.isPaid ? apt.paidAmount : 0,
        earnedFee: apt.therapistFee,
        notes: apt.notes || ''
      }));

      return { ...t, count: tApts.length, revenue, commission: totalCommission, details };
    }).filter(t => t.count > 0).sort((a, b) => b.revenue - a.revenue);

    const treatmentStats = treatments.map(tr => {
      const trApts = completedApts.filter(apt => apt.treatmentId === tr.id);
      const revenue = trApts.reduce((sum, apt) => sum + (apt.isPaid ? apt.paidAmount : 0), 0);
      return { ...tr, count: trApts.length, revenue };
    }).filter(tr => tr.count > 0).sort((a, b) => b.revenue - a.revenue);

    return { totalRevenue, totalAppointments: filtered.length, completedCount, cancelledCount, therapistStats, treatmentStats };
  }, [appointments, therapists, treatments, selectedMonth]);

  const toggleTherapist = (id: string) => setExpandedTherapist(expandedTherapist === id ? null : id);

  const handlePrint = () => {
    setActiveTab('payroll');
    setTimeout(() => window.print(), 500);
  };

  const hasData = monthData.completedCount > 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/30 border border-stone-100 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-stone-800 tracking-tight">經營統計報表</h2>
          <p className="text-sm text-brand-orange font-bold uppercase tracking-widest mt-1">{selectedMonth} Financial Audit</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border-2 border-stone-100 shadow-inner">
            <CalendarIcon size={24} className="text-brand-orange" strokeWidth={2.5} />
            <input 
              type="month" 
              className="bg-transparent border-none outline-none font-black text-stone-700 text-lg" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="md" disabled={!hasData} onClick={handlePrint} icon={<Printer size={24} />}>列印本月薪資單</Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 print:hidden px-1">
        <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={<PieChart size={20}/>}>數據總覽</TabButton>
        <TabButton active={activeTab === 'therapist'} onClick={() => setActiveTab('therapist')} icon={<Users size={20}/>}>業績明細</TabButton>
        <TabButton active={activeTab === 'treatment'} onClick={() => setActiveTab('treatment')} icon={<Briefcase size={20}/>}>項目分析</TabButton>
        <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<ReceiptText size={20}/>}>薪資單預覽</TabButton>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-stone-200/40 border border-stone-100 overflow-hidden print:border-none print:shadow-none print:bg-transparent min-h-[400px]">
        {!hasData ? (
          <div className="py-32 px-10 text-center flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
             <div className="relative">
                <div className="w-40 h-40 bg-stone-50 rounded-[3rem] shadow-inner flex items-center justify-center text-stone-300 relative z-10">
                  <BarChart size={80} strokeWidth={1} />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-lg z-20">
                  <Info size={24} />
                </div>
             </div>
             <div className="max-w-md space-y-4">
                <h3 className="text-3xl font-black text-stone-800 tracking-tight">本月尚無完診紀錄</h3>
                <p className="text-stone-400 font-bold text-lg leading-relaxed">
                  統計報表僅會計算狀態為「已報到繳費」的預約紀錄。若已有服務，請至排程頁面辦理報到。
                </p>
             </div>
          </div>
        ) : (
          <>
            {activeTab === 'summary' && (
              <div className="p-10 space-y-10 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SummaryCard title="當月總收入" value={`$${monthData.totalRevenue.toLocaleString()}`} icon={<DollarSign/>} color="amber"/>
                  <SummaryCard title="服務人次" value={`${monthData.completedCount}`} icon={<Users/>} color="stone"/>
                  <SummaryCard title="薪資總支出" value={`$${Math.round(monthData.therapistStats.reduce((s, t) => s + t.commission, 0)).toLocaleString()}`} icon={<UserCheck/>} color="emerald"/>
                  <SummaryCard title="預約取消" value={`${monthData.cancelledCount}`} icon={<FileText/>} color="red"/>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
                    <div className="p-10 bg-stone-50/50 rounded-[2.5rem] border border-stone-100">
                        <h4 className="text-xl font-black text-stone-800 mb-8 flex items-center gap-3">
                            <TrendingUp className="text-brand-orange" /> 治療師業績排名
                        </h4>
                        <div className="space-y-6">
                            {monthData.therapistStats.slice(0, 5).map((t, idx) => (
                                <div key={t.id} className="flex items-center gap-5">
                                    <span className="w-8 font-black text-stone-300">#{idx+1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-stone-700">{t.name}</span>
                                            <span className="font-black text-stone-800">${t.revenue.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-stone-100 shadow-inner">
                                            <div className="bg-brand-orange h-full rounded-full transition-all duration-1000" style={{ width: `${(t.revenue / (monthData.totalRevenue || 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 bg-stone-50/50 rounded-[2.5rem] border border-stone-100">
                        <h4 className="text-xl font-black text-stone-800 mb-8 flex items-center gap-3">
                            <PieChart className="text-brand-olive" /> 項目佔比分析
                        </h4>
                        <div className="space-y-6">
                            {monthData.treatmentStats.slice(0, 5).map((tr) => (
                                <div key={tr.id}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-stone-700">{tr.name}</span>
                                        <span className="font-black text-stone-800">{tr.count} 次</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-stone-100 shadow-inner">
                                        <div className="bg-brand-yellow h-full rounded-full transition-all duration-1000" style={{ width: `${(tr.count / (monthData.completedCount || 1)) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'therapist' && (
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-end mb-4 px-2">
                   <h3 className="text-2xl font-black text-stone-800">人員業績明細表</h3>
                   <p className="text-stone-400 font-bold">點擊人員卡片展開每日明細</p>
                </div>
                {monthData.therapistStats.map(t => (
                  <div key={t.id} className="border-2 border-stone-100 rounded-[2rem] overflow-hidden bg-white hover:border-amber-200 transition-all shadow-sm">
                    <button 
                      onClick={() => toggleTherapist(t.id)}
                      className="w-full p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-brand-yellow/20 text-brand-orange rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                          {t.name[0]}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-stone-800">{t.name}</h4>
                          <span className="inline-flex mt-1 px-3 py-0.5 bg-stone-100 text-stone-500 rounded-full text-[10px] font-black uppercase tracking-widest">{t.category}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-8 md:gap-16">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">服務人次</p>
                          <p className="text-xl font-black text-stone-800">{t.count} 次</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">總收入</p>
                          <p className="text-xl font-black text-stone-800">${t.revenue.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">應付薪資</p>
                          <p className="text-xl font-black text-brand-orange">${t.commission.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex justify-center md:justify-end">
                        {expandedTherapist === t.id ? <ChevronUp size={24} className="text-stone-300"/> : <ChevronDown size={24} className="text-stone-300"/>}
                      </div>
                    </button>
                    {expandedTherapist === t.id && (
                      <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                        <div className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 shadow-inner">
                          <table className="w-full text-left">
                            <thead className="bg-stone-100/50">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">日期</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">個案</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">項目</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">實收金額</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-amber-600 uppercase tracking-widest">應付薪資</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {t.details.map(d => (
                                <tr key={d.id} className="text-sm font-bold text-stone-600">
                                  <td className="px-6 py-4 whitespace-nowrap">{d.date.split('-').slice(1).join('/')}</td>
                                  <td className="px-6 py-4 text-stone-800">{d.patientName}</td>
                                  <td className="px-6 py-4">{d.treatmentName}</td>
                                  <td className="px-6 py-4 text-right font-black text-stone-400">${d.patientPaid.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-black text-amber-600">${d.earnedFee.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'treatment' && (
              <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthData.treatmentStats.map(tr => (
                    <div key={tr.id} className="p-8 border-2 border-stone-100 rounded-[2rem] bg-stone-50/30 flex flex-col justify-between hover:border-brand-yellow transition-all">
                       <div>
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-olive"><Briefcase size={24}/></div>
                             <span className="text-[10px] font-black text-stone-400 bg-white px-3 py-1 rounded-full shadow-sm">{tr.category}</span>
                          </div>
                          <h4 className="text-xl font-black text-stone-800 mb-2">{tr.name}</h4>
                          <p className="text-stone-400 font-bold text-sm">本月共服務 {tr.count} 人次</p>
                       </div>
                       <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">累計營收</p>
                             <p className="text-2xl font-black text-brand-orange">${tr.revenue.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">佔比</p>
                             <p className="text-lg font-black text-stone-700">{Math.round((tr.revenue / (monthData.totalRevenue || 1)) * 100)}%</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
                <div className="p-0 bg-transparent">
                    <div className="print-hidden p-12 bg-brand-yellow/10 border-b border-brand-yellow/20 flex items-center justify-between">
                        <div>
                            <h3 className="text-3xl font-black text-stone-800">薪資單預覽模式</h3>
                            <p className="text-stone-500 font-bold mt-2">格式已調整為 A4 大小，點擊列印後將一人一頁產出。</p>
                        </div>
                        <JialeLogo className="w-20 h-20 opacity-30" />
                    </div>
                    
                    <div className="space-y-0">
                        {monthData.therapistStats.map(t => (
                            <div key={t.id} className="salary-slip bg-white p-16 md:p-24 shadow-none border-b border-stone-100 last:border-none">
                                <div className="flex justify-between items-center mb-16 border-b-[6px] border-stone-900 pb-10">
                                    <div className="flex items-center gap-6">
                                        <JialeLogo className="w-20 h-20" />
                                        <div>
                                            <h1 className="text-5xl font-black text-stone-900 tracking-tighter mb-1">薪資明細單</h1>
                                            <p className="text-xl font-bold text-brand-orange uppercase tracking-[0.2em]">{selectedMonth} PAYROLL RECORD</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-16">
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">治療師 Therapist</p>
                                        <p className="text-4xl font-black text-stone-900">{t.name} <span className="text-brand-orange text-2xl ml-3">({t.category})</span></p>
                                    </div>
                                    <div className="text-right space-y-4">
                                        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">結算月份 Period</p>
                                        <p className="text-4xl font-black text-stone-900">{selectedMonth}</p>
                                    </div>
                                </div>

                                <table className="w-full mb-16">
                                    <thead>
                                        <tr className="border-y-2 border-stone-900 bg-stone-50">
                                            <th className="py-6 text-left px-4 font-black text-stone-800 text-sm">日期 Date</th>
                                            <th className="py-6 text-left px-4 font-black text-stone-800 text-sm">個案 Patient</th>
                                            <th className="py-6 text-left px-4 font-black text-stone-800 text-sm">治療項目 Treatment</th>
                                            <th className="py-6 text-right px-4 font-black text-stone-800 text-sm">金額 Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200">
                                        {t.details.map(detail => (
                                            <tr key={detail.id}>
                                                <td className="py-6 px-4 font-bold text-stone-500">{detail.date}</td>
                                                <td className="py-6 px-4 font-black text-stone-900 text-lg">{detail.patientName}</td>
                                                <td className="py-6 px-4 font-bold text-stone-600">{detail.treatmentName}</td>
                                                <td className="py-6 px-4 text-right font-black text-stone-900 text-xl">${Math.round(detail.earnedFee).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-[4px] border-stone-900 bg-stone-50">
                                            <td colSpan={3} className="py-10 px-4 text-right font-black text-3xl text-stone-900">本月薪資應領總計 Total:</td>
                                            <td className="py-10 px-4 text-right font-black text-5xl text-brand-orange">${Math.round(t.commission).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className="grid grid-cols-3 gap-16 pt-20 mt-20 border-t border-stone-100">
                                    <div className="space-y-12">
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">人員簽認 Signature</p>
                                        <div className="border-b-2 border-stone-200 h-10 w-full"></div>
                                    </div>
                                    <div className="space-y-12">
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">核薪主管 Approved by</p>
                                        <div className="border-b-2 border-stone-200 h-10 w-full"></div>
                                    </div>
                                    <div className="space-y-12 flex flex-col items-center">
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">診所單位蓋章 Official Seal</p>
                                        <div className="h-32 w-32 border-4 border-double border-stone-200 rounded-full flex items-center justify-center text-[10px] text-stone-300 font-black text-center p-3">佳樂身心診所<br/>人事專用章</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, children }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-8 py-5 rounded-[1.8rem] text-lg font-black transition-all whitespace-nowrap ${active ? 'bg-stone-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white text-stone-400 border-2 border-stone-50 hover:bg-stone-50'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { strokeWidth: 3 })} 
    {children}
  </button>
);

const SummaryCard = ({ title, value, icon, color }: any) => {
  const colors: any = { 
    amber: 'bg-brand-orange text-white shadow-brand-orange/20', 
    stone: 'bg-stone-100 text-stone-600 shadow-stone-200/20', 
    emerald: 'bg-emerald-100 text-emerald-700 shadow-emerald-200/20', 
    red: 'bg-red-50 text-red-600 shadow-red-200/20' 
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl flex items-center gap-6 hover:scale-[1.03] transition-all">
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${colors[color]} shadow-lg`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 32, strokeWidth: 2.5 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-stone-800 leading-none tracking-tighter">{value}</p>
      </div>
    </div>
  );
};
