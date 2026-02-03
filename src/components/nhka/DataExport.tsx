import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  Users,
  Heart,
  AlertTriangle,
  CreditCard,
  Loader2,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Settings,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Gebruiker,
  PastoraleAksie,
  KrisisVerslag,
  Betaling,
  getAksieLabel,
  getKrisisTipeLabel,
  getKrisisStatusLabel,
  getBetalingTipeLabel,
  getBetalingStatusLabel,
  getRolLabel,
  getOuderdom
} from '@/types/nhka';

type ExportCategory = 'lidmate' | 'pastorale_aksies' | 'krisisse' | 'betalings';
type ExportFormat = 'csv' | 'excel';
type ScheduleFrequency = 'weekly' | 'monthly' | 'quarterly';

interface ScheduledReport {
  id: string;
  name: string;
  categories: ExportCategory[];
  frequency: ScheduleFrequency;
  nextRun: string;
  lastRun?: string;
  active: boolean;
  email?: string;
}

interface DateRange {
  start: string;
  end: string;
}

const DataExport: React.FC = () => {
  const { gemeentes, gemeenteStats } = useNHKA();

  // Helper function to safely format price values that may be strings from database
  const formatPrice = (value: any): string => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  // Export state
  const [selectedGemeente, setSelectedGemeente] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Scheduled reports state
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    categories: [] as ExportCategory[],
    frequency: 'monthly' as ScheduleFrequency,
    email: ''
  });
  
  // Expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>('export');

  // Load scheduled reports from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nhka_scheduled_reports');
    if (saved) {
      setScheduledReports(JSON.parse(saved));
    }
  }, []);

  // Save scheduled reports to localStorage
  useEffect(() => {
    localStorage.setItem('nhka_scheduled_reports', JSON.stringify(scheduledReports));
  }, [scheduledReports]);

  const categories: { id: ExportCategory; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'lidmate', label: 'Lidmate Lys', icon: <Users className="w-5 h-5" />, description: 'Alle lidmate met kontakbesonderhede, wyke en rolle' },
    { id: 'pastorale_aksies', label: 'Pastorale Aksies', icon: <Heart className="w-5 h-5" />, description: 'Besoeke, oproepe, boodskappe en gebede' },
    { id: 'krisisse', label: 'Krisis Statistieke', icon: <AlertTriangle className="w-5 h-5" />, description: 'Krisisverslae met status en prioriteit' },
    { id: 'betalings', label: 'Betalings Rekords', icon: <CreditCard className="w-5 h-5" />, description: 'Offergawes en ander betalings' }
  ];

  const toggleCategory = (category: ExportCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(categories.map(c => c.id));
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  // Fetch data for export
  const fetchExportData = async (category: ExportCategory, gemeenteId: string | null) => {
    const baseQuery = gemeenteId ? { gemeente_id: gemeenteId } : {};
    
    switch (category) {
      case 'lidmate': {
        let query = supabase.from('gebruikers').select('*');
        if (gemeenteId) query = query.eq('gemeente_id', gemeenteId);
        const { data } = await query.order('naam');
        return data || [];
      }
      case 'pastorale_aksies': {
        let query = supabase.from('pastorale_aksies').select('*');
        if (gemeenteId) query = query.eq('gemeente_id', gemeenteId);
        query = query.gte('datum', dateRange.start).lte('datum', dateRange.end);
        const { data } = await query.order('datum', { ascending: false });
        return data || [];
      }
      case 'krisisse': {
        let query = supabase.from('krisis_verslae').select('*');
        if (gemeenteId) query = query.eq('gemeente_id', gemeenteId);
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end + 'T23:59:59');
        const { data } = await query.order('created_at', { ascending: false });
        return data || [];
      }
      case 'betalings': {
        let query = supabase.from('betalings').select('*');
        if (gemeenteId) query = query.eq('gemeente_id', gemeenteId);
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end + 'T23:59:59');
        const { data } = await query.order('created_at', { ascending: false });
        return data || [];
      }
      default:
        return [];
    }
  };

  // Convert data to CSV
  const convertToCSV = (data: any[], category: ExportCategory): string => {
    if (data.length === 0) return '';

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (category) {
      case 'lidmate':
        headers = ['Naam', 'Van', 'E-pos', 'Selfoon', 'Rol', 'Adres', 'Geboortedatum', 'Ouderdom', 'Aktief', 'Laaste Kontak'];
        rows = data.map((item: Gebruiker) => {
          const ouderdom = getOuderdom(item.geboortedatum, item.ouderdom);
          return [
            item.naam || '',
            item.van || '',
            item.epos || '',
            item.selfoon || '',
            getRolLabel(item.rol),
            item.adres || '',
            item.geboortedatum || '',
            ouderdom != null ? String(ouderdom) : '',
            item.aktief ? 'Ja' : 'Nee',
            item.laaste_kontak || ''
          ];
        });
        break;
      case 'pastorale_aksies':
        headers = ['Datum', 'Tipe', 'Lidmaat ID', 'Leier ID', 'Nota'];
        rows = data.map((item: PastoraleAksie) => [
          item.datum || '',
          getAksieLabel(item.tipe),
          item.gebruiker_id || '',
          item.leier_id || '',
          item.nota || ''
        ]);
        break;
      case 'krisisse':
        headers = ['Datum', 'Tipe', 'Prioriteit', 'Status', 'Beskrywing', 'Ingedien Deur'];
        rows = data.map((item: KrisisVerslag) => [
          item.created_at?.split('T')[0] || '',
          getKrisisTipeLabel(item.tipe),
          item.prioriteit || '',
          getKrisisStatusLabel(item.status),
          (item.beskrywing || '').replace(/"/g, '""'),
          item.ingedien_deur || ''
        ]);
        break;
      case 'betalings':
        headers = ['Datum', 'Bedrag', 'Tipe', 'Status', 'Beskrywing'];
        rows = data.map((item: Betaling) => [
          item.created_at?.split('T')[0] || '',
          `R${formatPrice(item.bedrag)}`,

          getBetalingTipeLabel(item.tipe),
          getBetalingStatusLabel(item.status),
          item.beskrywing || ''
        ]);
        break;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  // Download file
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(['\ufeff' + content], { type: mimeType + ';charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Kies asb ten minste een kategorie om uit te voer');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const gemeenteId = selectedGemeente === 'all' ? null : selectedGemeente;
      const gemeenteName = selectedGemeente === 'all' 
        ? 'Alle_Gemeentes' 
        : gemeentes.find(g => g.id === selectedGemeente)?.naam.replace(/\s+/g, '_') || 'Gemeente';
      
      const dateStr = new Date().toISOString().split('T')[0];
      const totalCategories = selectedCategories.length;
      let completedCategories = 0;

      for (const category of selectedCategories) {
        const data = await fetchExportData(category, gemeenteId);
        const csv = convertToCSV(data, category);
        
        if (csv) {
          const categoryLabel = categories.find(c => c.id === category)?.label.replace(/\s+/g, '_') || category;
          const filename = `${gemeenteName}_${categoryLabel}_${dateStr}.csv`;
          downloadFile(csv, filename, 'text/csv');
        }

        completedCategories++;
        setExportProgress(Math.round((completedCategories / totalCategories) * 100));
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success(`${selectedCategories.length} lêer(s) suksesvol afgelaai`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kon nie data uitvoer nie');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Calculate next run date
  const calculateNextRun = (frequency: ScheduleFrequency): string => {
    const now = new Date();
    switch (frequency) {
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
    }
    return now.toISOString();
  };

  // Add scheduled report
  const handleAddSchedule = () => {
    if (!newSchedule.name || newSchedule.categories.length === 0) {
      toast.error('Vul asb alle verpligte velde in');
      return;
    }

    const schedule: ScheduledReport = {
      id: Date.now().toString(),
      name: newSchedule.name,
      categories: newSchedule.categories,
      frequency: newSchedule.frequency,
      nextRun: calculateNextRun(newSchedule.frequency),
      active: true,
      email: newSchedule.email || undefined
    };

    setScheduledReports(prev => [...prev, schedule]);
    setShowScheduleModal(false);
    setNewSchedule({ name: '', categories: [], frequency: 'monthly', email: '' });
    toast.success('Geskeduleerde verslag bygevoeg');
  };

  // Toggle schedule active status
  const toggleScheduleActive = (id: string) => {
    setScheduledReports(prev =>
      prev.map(s => s.id === id ? { ...s, active: !s.active } : s)
    );
  };

  // Delete schedule
  const deleteSchedule = (id: string) => {
    setScheduledReports(prev => prev.filter(s => s.id !== id));
    toast.success('Geskeduleerde verslag verwyder');
  };

  // Run scheduled report now
  const runScheduleNow = async (schedule: ScheduledReport) => {
    setSelectedCategories(schedule.categories);
    await handleExport();
    
    // Update last run
    setScheduledReports(prev =>
      prev.map(s => s.id === schedule.id 
        ? { ...s, lastRun: new Date().toISOString(), nextRun: calculateNextRun(s.frequency) } 
        : s
      )
    );
  };

  const getFrequencyLabel = (freq: ScheduleFrequency): string => {
    const labels: Record<ScheduleFrequency, string> = {
      weekly: 'Weekliks',
      monthly: 'Maandeliks',
      quarterly: 'Kwartaalliks'
    };
    return labels[freq];
  };

  const toggleScheduleCategory = (category: ExportCategory) => {
    setNewSchedule(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'export' ? null : 'export')}
          className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#7A8450]/10 flex items-center justify-center">
              <Download className="w-5 h-5 md:w-6 md:h-6 text-[#7A8450]" />
            </div>
            <div className="text-left">
              <h3 className="text-base md:text-lg font-bold text-[#002855]">Data Uitvoer</h3>
              <p className="text-xs md:text-sm text-gray-500">Voer lidmate, aksies, krisisse en betalings uit</p>
            </div>
          </div>
          {expandedSection === 'export' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSection === 'export' && (
          <div className="p-4 md:p-6 pt-0 space-y-6">
            {/* Gemeente Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gemeente</label>
              <select
                value={selectedGemeente}
                onChange={(e) => setSelectedGemeente(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm md:text-base"
              >
                <option value="all">Alle Gemeentes</option>
                {gemeentes.map(g => (
                  <option key={g.id} value={g.id}>{g.naam}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Datum Reeks (vir aksies, krisisse & betalings)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Van</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tot</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Kategorieë
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllCategories}
                    className="text-xs text-[#7A8450] hover:underline"
                  >
                    Kies Alles
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={clearCategories}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Maak Skoon
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-start gap-3 p-3 md:p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCategories.includes(cat.id)
                        ? 'border-[#7A8450] bg-[#7A8450]/5'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-[#7A8450] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm md:text-base ${
                        selectedCategories.includes(cat.id) ? 'text-[#7A8450]' : 'text-gray-700'
                      }`}>
                        {cat.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>
                    </div>
                    {selectedCategories.includes(cat.id) && (
                      <CheckCircle2 className="w-5 h-5 text-[#7A8450] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleExport}
                disabled={isExporting || selectedCategories.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Besig met uitvoer... {exportProgress}%
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5" />
                    Voer {selectedCategories.length} Kategorie{selectedCategories.length !== 1 ? 'ë' : ''} Uit (CSV)
                  </>
                )}
              </button>
              {selectedCategories.length === 0 && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Kies ten minste een kategorie om uit te voer
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Reports Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'scheduled' ? null : 'scheduled')}
          className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#8B7CB3]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#8B7CB3]" />
            </div>
            <div className="text-left">
              <h3 className="text-base md:text-lg font-bold text-[#002855]">Geskeduleerde Verslae</h3>
              <p className="text-xs md:text-sm text-gray-500">Outomatiese maandelikse/kwartaallikse opsommings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-[#8B7CB3]/10 text-[#8B7CB3] text-xs font-medium rounded-full">
              {scheduledReports.filter(s => s.active).length} aktief
            </span>
            {expandedSection === 'scheduled' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSection === 'scheduled' && (
          <div className="p-4 md:p-6 pt-0 space-y-4">
            {/* Add Schedule Button */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-medium hover:border-[#8B7CB3] hover:text-[#8B7CB3] hover:bg-[#8B7CB3]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Voeg Geskeduleerde Verslag By
            </button>

            {/* Scheduled Reports List */}
            {scheduledReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Geen geskeduleerde verslae nie</p>
                <p className="text-sm">Skep 'n geskeduleerde verslag vir outomatiese opsommings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledReports.map(schedule => (
                  <div
                    key={schedule.id}
                    className={`p-4 rounded-xl border ${
                      schedule.active ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-semibold ${schedule.active ? 'text-[#002855]' : 'text-gray-400'}`}>
                            {schedule.name}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            schedule.active 
                              ? 'bg-[#7A8450]/10 text-[#7A8450]' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {schedule.active ? 'Aktief' : 'Gepauzeer'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {schedule.categories.map(cat => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {categories.find(c => c.id === cat)?.label}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span>{getFrequencyLabel(schedule.frequency)}</span>
                          <span>Volgende: {new Date(schedule.nextRun).toLocaleDateString('af-ZA')}</span>
                          {schedule.lastRun && (
                            <span>Laaste: {new Date(schedule.lastRun).toLocaleDateString('af-ZA')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => runScheduleNow(schedule)}
                          className="p-2 rounded-lg hover:bg-[#7A8450]/10 text-[#7A8450] transition-colors"
                          title="Voer nou uit"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleScheduleActive(schedule.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            schedule.active 
                              ? 'hover:bg-amber-100 text-amber-600' 
                              : 'hover:bg-green-100 text-green-600'
                          }`}
                          title={schedule.active ? 'Pauzeer' : 'Aktiveer'}
                        >
                          {schedule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          title="Verwyder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8B7CB3] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#002855]">Nuwe Geskeduleerde Verslag</h2>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)} 
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verslag Naam *</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="bv. Maandelikse Opsomming"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategorieë *</label>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleScheduleCategory(cat.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        newSchedule.categories.includes(cat.id)
                          ? 'border-[#8B7CB3] bg-[#8B7CB3]/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        newSchedule.categories.includes(cat.id)
                          ? 'bg-[#8B7CB3] text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.icon}
                      </div>
                      <span className={`font-medium text-sm ${
                        newSchedule.categories.includes(cat.id) ? 'text-[#8B7CB3]' : 'text-gray-700'
                      }`}>
                        {cat.label}
                      </span>
                      {newSchedule.categories.includes(cat.id) && (
                        <CheckCircle2 className="w-5 h-5 text-[#8B7CB3] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frekwensie *</label>
                <select
                  value={newSchedule.frequency}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value as ScheduleFrequency }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none"
                >
                  <option value="weekly">Weekliks</option>
                  <option value="monthly">Maandeliks</option>
                  <option value="quarterly">Kwartaalliks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-pos (Opsioneel)</label>
                <input
                  type="email"
                  value={newSchedule.email}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="verslae@gemeente.co.za"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#8B7CB3] focus:ring-2 focus:ring-[#8B7CB3]/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Verslae sal na hierdie adres gestuur word</p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Kanselleer
              </button>
              <button
                onClick={handleAddSchedule}
                disabled={!newSchedule.name || newSchedule.categories.length === 0}
                className="flex-1 py-2 px-4 rounded-xl bg-[#8B7CB3] text-white font-semibold hover:bg-[#7a6ba3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skep Verslag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExport;
