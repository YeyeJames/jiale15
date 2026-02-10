
import React, { useState } from 'react';
import { Therapist, Treatment, User, Category } from '../types';
import { Button } from '../components/Button';
import { Trash2, Plus, Users, Stethoscope, Shield, Database, Download, Upload, Banknote, UserRound, AlertTriangle } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Modal } from '../components/Modal';

interface SettingsViewProps {
  currentUser: User;
  therapists: Therapist[];
  treatments: Treatment[];
  users: User[];
  onUpdateTherapists: (data: Therapist[]) => void;
  onUpdateTreatments: (data: Treatment[]) => void;
  onUpdateUsers: (data: User[]) => void;
}

interface ConfirmationState {
  type: 'delete_therapist' | 'delete_treatment' | 'import_data';
  data: any;
  title: string;
  message: string;
  actionLabel: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  therapists,
  treatments,
  users,
  onUpdateTherapists,
  onUpdateTreatments,
  onUpdateUsers,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'therapists' | 'treatments' | 'users' | 'data'>(
    isAdmin ? 'therapists' : 'data'
  );
  
  // Modal States
  const [isTherapistModalOpen, setIsTherapistModalOpen] = useState(false);
  const [therapistForm, setTherapistForm] = useState({ name: '', category: '心理' as Category });

  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({ 
    name: '', 
    category: '心理' as Category, 
    patientPrice: '', 
    therapistFee: '' 
  });

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  const handleExportData = () => {
    const allData = { therapists, treatments, appointments: DataService.getAppointments(), users, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `佳樂診所備份_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setConfirmation({
            type: 'import_data',
            data: data,
            title: '確定還原備份資料？',
            message: '此操作將會「完全覆蓋」系統現有的所有資料（包含預約紀錄、人員設定等），且無法復原。請確認您已備份當前資料，是否繼續？',
            actionLabel: '確認還原覆蓋'
        });
      } catch (err) { alert('檔案格式錯誤，無法匯入。'); }
    };
    reader.readAsText(file);
    // Reset input value to allow re-selecting the same file if needed
    e.target.value = '';
  };

  const executeConfirmation = () => {
      if (!confirmation) return;
      
      if (confirmation.type === 'delete_therapist') {
          onUpdateTherapists(therapists.filter(x => x.id !== confirmation.data));
      } else if (confirmation.type === 'delete_treatment') {
          onUpdateTreatments(treatments.filter(x => x.id !== confirmation.data));
      } else if (confirmation.type === 'import_data') {
          const data = confirmation.data;
          if (data.therapists) onUpdateTherapists(data.therapists);
          if (data.treatments) onUpdateTreatments(data.treatments);
          if (data.users) onUpdateUsers(data.users);
          if (data.appointments) DataService.saveAppointments(data.appointments);
          window.location.reload();
      }
      setConfirmation(null);
  };

  // Handlers for Therapist Modal
  const openTherapistModal = () => {
    setTherapistForm({ name: '', category: '心理' });
    setIsTherapistModalOpen(true);
  };

  const submitTherapist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!therapistForm.name.trim()) return;
    onUpdateTherapists([...therapists, { 
      id: `t${Date.now()}`, 
      name: therapistForm.name, 
      category: therapistForm.category 
    }]);
    setIsTherapistModalOpen(false);
  };

  // Handlers for Treatment Modal
  const openTreatmentModal = () => {
    setTreatmentForm({ name: '', category: '心理', patientPrice: '', therapistFee: '' });
    setIsTreatmentModalOpen(true);
  };

  const submitTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentForm.name.trim()) return;
    
    const pPrice = parseFloat(treatmentForm.patientPrice) || 0;
    const tFee = parseFloat(treatmentForm.therapistFee) || 0;

    onUpdateTreatments([...treatments, { 
      id: `tr${Date.now()}`, 
      name: treatmentForm.name, 
      category: treatmentForm.category, 
      patientPrice: pPrice, 
      therapistFee: tFee, 
      durationMinutes: 30 
    }]);
    setIsTreatmentModalOpen(false);
  };

  const CategoryBadge = ({ category }: { category: Category }) => {
    const colors: Record<Category, string> = { '心理': 'bg-purple-100 text-purple-700', '職能': 'bg-blue-100 text-blue-700', 'rTMS': 'bg-emerald-100 text-emerald-700' };
    return <span className={`inline-flex items-center px-3 md:px-4 py-1 rounded-full text-[10px] md:text-sm font-black uppercase tracking-widest ${colors[category] || 'bg-stone-100 text-stone-700'}`}>{category}</span>;
  };

  const categories: Category[] = ['心理', '職能', 'rTMS'];

  return (
    <div className="space-y-6 md:space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Optimized Navigation Tabs for Mobile */}
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 p-2 md:p-3 flex gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {isAdmin && (
            <>
                <Button variant={activeTab === 'therapists' ? 'primary' : 'ghost'} size="sm" className="whitespace-nowrap px-4 md:px-8 flex-shrink-0" onClick={() => setActiveTab('therapists')} icon={<Users size={18}/>}>人員名單</Button>
                <Button variant={activeTab === 'treatments' ? 'primary' : 'ghost'} size="sm" className="whitespace-nowrap px-4 md:px-8 flex-shrink-0" onClick={() => setActiveTab('treatments')} icon={<Stethoscope size={18}/>}>項目與薪資</Button>
                <Button variant={activeTab === 'users' ? 'primary' : 'ghost'} size="sm" className="whitespace-nowrap px-4 md:px-8 flex-shrink-0" onClick={() => setActiveTab('users')} icon={<Shield size={18}/>}>帳號</Button>
            </>
        )}
        <Button variant={activeTab === 'data' ? 'primary' : 'ghost'} size="sm" className="whitespace-nowrap px-4 md:px-8 flex-shrink-0" onClick={() => setActiveTab('data')} icon={<Database size={18}/>}>資料管理</Button>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[3.5rem] shadow-3xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
        {activeTab === 'therapists' && isAdmin && (
            <div>
                <div className="px-6 md:px-12 py-6 md:py-10 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/50">
                    <div>
                        <h3 className="text-xl md:text-3xl font-black text-stone-800">人員與醫師名單</h3>
                        <p className="text-[10px] md:text-sm text-stone-400 font-bold uppercase tracking-widest mt-1">Personnel Management</p>
                    </div>
                    <Button onClick={openTherapistModal} size="md" className="w-full md:w-auto" icon={<Plus size={20} strokeWidth={3}/>}>新增人員</Button>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full text-left">
                      <thead className="bg-stone-50">
                          <tr className="border-b border-stone-100">
                              <th className="px-12 py-6 font-black text-stone-400 uppercase tracking-widest text-xs">人員姓名</th>
                              <th className="px-12 py-6 font-black text-stone-400 uppercase tracking-widest text-xs">類別</th>
                              <th className="px-12 py-6 text-right font-black text-stone-400 uppercase tracking-widest text-xs">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50 text-xl font-bold">
                          {therapists.map(t => (
                              <tr key={t.id} className="hover:bg-amber-50/30 transition-all">
                                  <td className="px-12 py-8">
                                      <div className="flex items-center gap-5">
                                          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm">{t.name[0]}</div>
                                          <span className="font-black text-stone-800 text-2xl">{t.name}</span>
                                      </div>
                                  </td>
                                  <td className="px-12 py-8"><CategoryBadge category={t.category} /></td>
                                  <td className="px-12 py-8 text-right">
                                      <button 
                                        onClick={() => setConfirmation({
                                            type: 'delete_therapist',
                                            data: t.id,
                                            title: '刪除人員',
                                            message: `確定要刪除「${t.name}」嗎？刪除後無法復原，請確認。`,
                                            actionLabel: '確認刪除'
                                        })} 
                                        className="p-5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                      >
                                          <Trash2 size={32}/>
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-stone-50">
                   {therapists.map(t => (
                      <div key={t.id} className="p-5 flex items-center justify-between hover:bg-stone-50">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-lg">{t.name[0]}</div>
                            <div>
                               <p className="font-black text-stone-800">{t.name}</p>
                               <CategoryBadge category={t.category} />
                            </div>
                         </div>
                         <button 
                            onClick={() => setConfirmation({
                                type: 'delete_therapist',
                                data: t.id,
                                title: '刪除人員',
                                message: `確定要刪除「${t.name}」嗎？`,
                                actionLabel: '確認刪除'
                            })} 
                            className="p-3 text-stone-300 active:text-red-500"
                         >
                            <Trash2 size={24}/>
                         </button>
                      </div>
                   ))}
                </div>
            </div>
        )}

        {activeTab === 'treatments' && isAdmin && (
            <div>
                <div className="px-6 md:px-12 py-6 md:py-10 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/50">
                    <div>
                        <h3 className="text-xl md:text-3xl font-black text-stone-800">項目與薪資設定</h3>
                        <p className="text-[10px] md:text-sm text-stone-400 font-bold uppercase tracking-widest mt-1">Financial Settings</p>
                    </div>
                    <Button onClick={openTreatmentModal} size="md" className="w-full md:w-auto" icon={<Plus size={20} strokeWidth={3}/>}>新增項目</Button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full text-left">
                      <thead className="bg-stone-50">
                          <tr className="border-b border-stone-100">
                              <th className="px-12 py-6 font-black text-stone-400 uppercase tracking-widest text-xs">項目名稱</th>
                              <th className="px-12 py-6 font-black text-stone-400 uppercase tracking-widest text-xs">類別</th>
                              <th className="px-12 py-6 font-black text-stone-400 uppercase tracking-widest text-xs">收款 (病人付)</th>
                              <th className="px-12 py-6 font-black text-stone-400 uppercase tracking-widest text-xs">薪資 (人員領)</th>
                              <th className="px-12 py-6 text-right font-black text-stone-400 uppercase tracking-widest text-xs">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50 text-xl font-bold">
                          {treatments.map(tr => (
                              <tr key={tr.id} className="hover:bg-amber-50/30 transition-all">
                                  <td className="px-12 py-8 font-black text-stone-800 text-2xl">{tr.name}</td>
                                  <td className="px-12 py-8"><CategoryBadge category={tr.category} /></td>
                                  <td className="px-12 py-8"><div className="flex items-center gap-3 text-stone-600"><Banknote size={24} className="text-stone-300"/>${tr.patientPrice.toLocaleString()}</div></td>
                                  <td className="px-12 py-8"><div className="flex items-center gap-3 text-amber-600 font-black">+${tr.therapistFee.toLocaleString()}</div></td>
                                  <td className="px-12 py-8 text-right">
                                      <button 
                                        onClick={() => setConfirmation({
                                            type: 'delete_treatment',
                                            data: tr.id,
                                            title: '刪除項目',
                                            message: `確定要刪除「${tr.name}」嗎？這不會影響歷史預約紀錄。`,
                                            actionLabel: '確認刪除'
                                        })}
                                        className="p-5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                      >
                                          <Trash2 size={32}/>
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-stone-50">
                   {treatments.map(tr => (
                      <div key={tr.id} className="p-6 space-y-3">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-black text-lg text-stone-800 leading-tight mb-1">{tr.name}</p>
                               <CategoryBadge category={tr.category} />
                            </div>
                            <button 
                                onClick={() => setConfirmation({
                                    type: 'delete_treatment',
                                    data: tr.id,
                                    title: '刪除項目',
                                    message: `確定要刪除「${tr.name}」嗎？`,
                                    actionLabel: '確認刪除'
                                })}
                                className="p-2 text-stone-300"
                            >
                                <Trash2 size={20}/>
                            </button>
                         </div>
                         <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                               <p className="text-[10px] font-black text-stone-400 uppercase mb-1">收款(病人)</p>
                               <p className="font-black text-stone-700">${tr.patientPrice.toLocaleString()}</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                               <p className="text-[10px] font-black text-amber-400 uppercase mb-1">薪資(人員)</p>
                               <p className="font-black text-brand-orange">${tr.therapistFee.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
            </div>
        )}

        {activeTab === 'users' && isAdmin && (
            <div className="p-6 md:p-12">
                <h3 className="text-xl md:text-3xl font-black text-stone-800 mb-6 md:mb-10">帳號權限管理</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-10">
                    {users.map(u => (
                        <div key={u.id} className="p-6 md:p-10 border-2 md:border-4 border-stone-50 rounded-2xl md:rounded-[3rem] flex items-center justify-between bg-stone-50/30 hover:border-amber-200 transition-all group">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-xl md:rounded-[2rem] flex items-center justify-center text-stone-400 shadow-lg group-hover:text-amber-500 transition-all"><UserRound size={24} className="md:w-10 md:h-10" /></div>
                                <div>
                                    <p className="font-black text-stone-800 text-lg md:text-3xl">{u.name}</p>
                                    <p className="text-[10px] md:text-sm text-stone-400 font-bold uppercase tracking-widest mt-0.5">{u.username} | {u.role}</p>
                                </div>
                            </div>
                            {/* Combined duplicate className attributes into one */}
                            <Shield className={`${u.role === 'admin' ? 'text-amber-500' : 'text-stone-300'} md:w-12 md:h-12`} size={24} strokeWidth={2.5} />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'data' && (
            <div className="p-6 md:p-12 space-y-10 md:space-y-16">
                <div className="max-w-4xl">
                    <h3 className="text-2xl md:text-4xl font-black text-stone-800 mb-2 md:mb-4">系統備份與還原</h3>
                    <p className="text-stone-400 font-bold text-sm md:text-xl leading-relaxed">資料僅存放於本機瀏覽器。為防遺失，請務必定期下載備份。</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                    <div className="p-8 md:p-16 border-2 md:border-4 border-dashed border-stone-100 rounded-3xl md:rounded-[4rem] bg-stone-50/30 text-center hover:border-amber-200 transition-all">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-amber-100 text-amber-600 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl shadow-amber-200/50"><Download size={32} className="md:w-16 md:h-16" /></div>
                        <h4 className="text-xl md:text-3xl font-black text-stone-800 mb-2 md:mb-4">下載系統備份</h4>
                        <p className="text-stone-400 text-[10px] md:text-sm font-bold mb-8 md:mb-12 uppercase tracking-widest">Full Backup to JSON</p>
                        <Button variant="primary" size="lg" onClick={handleExportData} icon={<Download size={24}/>} className="w-full">立即匯出檔案</Button>
                    </div>
                    
                    <div className="p-8 md:p-16 border-2 md:border-4 border-dashed border-stone-100 rounded-3xl md:rounded-[4rem] bg-stone-50/30 text-center hover:border-indigo-200 transition-all">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-indigo-100 text-indigo-600 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl shadow-indigo-200/50"><Upload size={32} className="md:w-16 md:h-16" /></div>
                        <h4 className="text-xl md:text-3xl font-black text-stone-800 mb-2 md:mb-4">還原備份資料</h4>
                        <p className="text-stone-400 text-[10px] md:text-sm font-bold mb-8 md:mb-12 uppercase tracking-widest">Restore from JSON</p>
                        <label className="block">
                            <span className="bg-white border-2 border-stone-100 text-stone-700 h-16 md:h-20 rounded-2xl md:rounded-3xl font-black cursor-pointer hover:bg-stone-50 flex items-center justify-center gap-3 transition-all text-sm md:text-xl shadow-lg">
                                <Upload size={24} /> 選取備份檔案
                            </span>
                            <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                        </label>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Add Therapist Modal */}
      <Modal isOpen={isTherapistModalOpen} onClose={() => setIsTherapistModalOpen(false)} title="新增人員">
         <form onSubmit={submitTherapist} className="space-y-6">
            <div>
               <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">姓名 Name</label>
               <input 
                 autoFocus
                 type="text" 
                 required 
                 className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 text-lg" 
                 placeholder="例如：陳醫師"
                 value={therapistForm.name}
                 onChange={e => setTherapistForm({...therapistForm, name: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">科別 Category</label>
               <div className="flex gap-3">
                 {categories.map(cat => (
                   <button
                     key={cat}
                     type="button"
                     onClick={() => setTherapistForm({...therapistForm, category: cat})}
                     className={`flex-1 py-3 rounded-xl font-black transition-all ${therapistForm.category === cat ? 'bg-amber-500 text-white shadow-lg' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-stone-100 mt-6">
               <Button variant="secondary" onClick={() => setIsTherapistModalOpen(false)}>取消</Button>
               <Button type="submit" disabled={!therapistForm.name}>確認新增</Button>
            </div>
         </form>
      </Modal>

      {/* Add Treatment Modal */}
      <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} title="新增治療項目">
         <form onSubmit={submitTreatment} className="space-y-6">
            <div>
               <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">項目名稱 Treatment Name</label>
               <input 
                 autoFocus
                 type="text" 
                 required 
                 className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 text-lg" 
                 placeholder="例如：個別心理治療"
                 value={treatmentForm.name}
                 onChange={e => setTreatmentForm({...treatmentForm, name: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">所屬科別 Category</label>
               <div className="flex gap-3">
                 {categories.map(cat => (
                   <button
                     key={cat}
                     type="button"
                     onClick={() => setTreatmentForm({...treatmentForm, category: cat})}
                     className={`flex-1 py-3 rounded-xl font-black transition-all ${treatmentForm.category === cat ? 'bg-amber-500 text-white shadow-lg' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-black uppercase tracking-widest mb-2 text-stone-400">病人收費 Price</label>
                   <input 
                     type="number" 
                     className="w-full border-2 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-stone-50 text-lg" 
                     placeholder="0"
                     value={treatmentForm.patientPrice}
                     onChange={e => setTreatmentForm({...treatmentForm, patientPrice: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-black uppercase tracking-widest mb-2 text-amber-500">人員薪資 Fee</label>
                   <input 
                     type="number" 
                     className="w-full border-2 border-amber-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-black bg-amber-50 text-lg" 
                     placeholder="0"
                     value={treatmentForm.therapistFee}
                     onChange={e => setTreatmentForm({...treatmentForm, therapistFee: e.target.value})}
                   />
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-stone-100 mt-6">
               <Button variant="secondary" onClick={() => setIsTreatmentModalOpen(false)}>取消</Button>
               <Button type="submit" disabled={!treatmentForm.name}>確認新增</Button>
            </div>
         </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal 
         isOpen={!!confirmation} 
         onClose={() => setConfirmation(null)} 
         title={confirmation?.title || '確認操作'}
         footer={
             <>
                <Button variant="secondary" onClick={() => setConfirmation(null)}>取消</Button>
                <Button variant="danger" onClick={executeConfirmation}>{confirmation?.actionLabel}</Button>
             </>
         }
      >
         <div className="flex items-start gap-6 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="p-4 rounded-xl shrink-0 bg-red-100 text-red-600">
                <AlertTriangle size={32} />
            </div>
            <p className="text-lg text-stone-700 font-bold leading-relaxed pt-1">{confirmation?.message}</p>
         </div>
      </Modal>
    </div>
  );
};
