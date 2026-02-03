import React, { useState, useRef } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { getProgramTipeLabel, isAdmin, ProgramTipe } from '@/types/nhka';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  List,
  Grid,
  X,
  ChevronDown,
  Church,
  Users,
  BookOpen,
  Upload,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const GemeenteProgram: React.FC = () => {
  const { currentUser, currentGemeente, program, addProgram, refreshData } = useNHKA();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [newEvent, setNewEvent] = useState({
    titel: '',
    beskrywing: '',
    datum: new Date().toISOString().split('T')[0],
    tyd: '09:00',
    plek: '',
    tipe: 'algemeen' as ProgramTipe
  });

  if (!currentUser) return null;

  const isUserAdmin = isAdmin(currentUser.rol);

  // Sort events by date
  const sortedProgram = [...program].sort((a, b) => 
    new Date(a.datum).getTime() - new Date(b.datum).getTime()
  );

  // Filter upcoming events
  const upcomingEvents = sortedProgram.filter(p => new Date(p.datum) >= new Date());
  const pastEvents = sortedProgram.filter(p => new Date(p.datum) < new Date());

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    return program.filter(p => {
      const eventDate = new Date(p.datum);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const handleSubmit = async () => {
    if (!newEvent.titel || !newEvent.datum) {
      toast.error('Titel en datum is verpligtend');
      return;
    }

    await addProgram({
      ...newEvent,
      created_by: currentUser.id
    });

    setNewEvent({
      titel: '',
      beskrywing: '',
      datum: new Date().toISOString().split('T')[0],
      tyd: '09:00',
      plek: '',
      tipe: 'algemeen'
    });
    setShowForm(false);
    toast.success('Geleentheid suksesvol bygevoeg');
  };

  // CSV Upload handlers
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Slegs CSV lêers word aanvaar');
      return;
    }

    setCsvFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV lêer moet ten minste een data ry hê');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['titel', 'datum'];
      const hasRequired = requiredHeaders.every(h => headers.includes(h));

      if (!hasRequired) {
        toast.error('CSV moet "titel" en "datum" kolomme hê');
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      }).filter(row => row.titel && row.datum);

      setCsvPreview(data.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleCSVUpload = async () => {
    if (!csvFile || !currentGemeente) return;

    setUploadingCSV(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const events = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        }).filter(row => row.titel && row.datum);

        let successCount = 0;
        for (const event of events) {
          try {
            const tipe = event.tipe?.toLowerCase() || 'algemeen';
            const validTipes = ['erediens', 'gebed', 'jeug', 'studie', 'vroue', 'mans', 'sosiaal', 'kategese', 'algemeen'];
            
            const { error } = await supabase
              .from('gemeente_program')
              .insert([{
                gemeente_id: currentGemeente.id,
                titel: event.titel,
                beskrywing: event.beskrywing || null,
                datum: event.datum,
                tyd: event.tyd || null,
                plek: event.plek || null,
                tipe: validTipes.includes(tipe) ? tipe : 'algemeen',
                created_by: currentUser.id
              }]);

            if (!error) successCount++;
          } catch (err) {
            console.error('Error inserting event:', err);
          }
        }

        toast.success(`${successCount} van ${events.length} geleenthede suksesvol opgelaai`);
        setShowCSVModal(false);
        setCsvFile(null);
        setCsvPreview([]);
        await refreshData();
      };
      reader.readAsText(csvFile);
    } catch (error) {
      toast.error('Fout met CSV oplaai');
    } finally {
      setUploadingCSV(false);
    }
  };

  const getTipeIcon = (tipe: string) => {
    switch (tipe) {
      case 'erediens': return <Church className="w-4 h-4" />;
      case 'gebed': return <BookOpen className="w-4 h-4" />;
      case 'jeug': return <Users className="w-4 h-4" />;
      case 'studie': return <BookOpen className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTipeColor = (tipe: string) => {
    switch (tipe) {
      case 'erediens': return 'bg-[#002855] text-white';
      case 'gebed': return 'bg-[#8B7CB3] text-white';
      case 'jeug': return 'bg-[#D4A84B] text-[#002855]';
      case 'studie': return 'bg-[#7A8450] text-white';
      case 'vroue': return 'bg-pink-500 text-white';
      case 'mans': return 'bg-blue-600 text-white';
      case 'sosiaal': return 'bg-orange-500 text-white';
      case 'kategese': return 'bg-teal-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855]">Gemeenteprogram</h1>
          <p className="text-gray-500">Alle geleenthede en byeenkomste</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-[#002855]' : 'text-gray-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-[#002855]' : 'text-gray-500'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          
          {isUserAdmin && (
            <>
              <button
                onClick={() => setShowCSVModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B7CB3] text-white font-semibold rounded-xl hover:bg-[#7a6ba0] transition-colors"
              >
                <Upload className="w-5 h-5" />
                CSV Oplaai
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nuwe Geleentheid
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && isUserAdmin && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#002855] mb-4">Nuwe Geleentheid</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                type="text"
                value={newEvent.titel}
                onChange={(e) => setNewEvent({ ...newEvent, titel: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                placeholder="Naam van die geleentheid"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
              <input
                type="date"
                value={newEvent.datum}
                onChange={(e) => setNewEvent({ ...newEvent, datum: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tyd</label>
              <input
                type="time"
                value={newEvent.tyd}
                onChange={(e) => setNewEvent({ ...newEvent, tyd: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plek</label>
              <input
                type="text"
                value={newEvent.plek}
                onChange={(e) => setNewEvent({ ...newEvent, plek: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                placeholder="Waar vind dit plaas?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <div className="relative">
                <select
                  value={newEvent.tipe}
                  onChange={(e) => setNewEvent({ ...newEvent, tipe: e.target.value as ProgramTipe })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                >
                  <option value="erediens">Erediens</option>
                  <option value="gebed">Gebedsdiens</option>
                  <option value="jeug">Jeugbyeenkoms</option>
                  <option value="studie">Bybelstudie</option>
                  <option value="vroue">Vrouebyeenkoms</option>
                  <option value="mans">Mansbyeenkoms</option>
                  <option value="sosiaal">Sosiale Geleentheid</option>
                  <option value="kategese">Kategese</option>
                  <option value="algemeen">Algemeen</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
              <textarea
                value={newEvent.beskrywing}
                onChange={(e) => setNewEvent({ ...newEvent, beskrywing: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                rows={3}
                placeholder="Addisionele inligting oor die geleentheid..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Kanselleer
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors"
            >
              Voeg By
            </button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-[#002855]">
              {currentMonth.toLocaleDateString('af-ZA', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Day Headers */}
            {['Son', 'Maa', 'Din', 'Woe', 'Don', 'Vry', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-gray-500 border-b border-gray-100">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 min-h-[80px] bg-gray-50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const events = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={i}
                  className={`p-2 min-h-[80px] border-b border-r border-gray-100 ${
                    isToday ? 'bg-[#D4A84B]/10' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-[#D4A84B]' : 'text-gray-700'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${getTipeColor(event.tipe)}`}
                        title={event.titel}
                      >
                        {event.titel}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-gray-500">+{events.length - 2} meer</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div>
            <h2 className="text-lg font-bold text-[#002855] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4A84B]" />
              Komende Geleenthede
            </h2>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#002855] text-white flex flex-col items-center justify-center">
                        <span className="text-xl font-bold leading-none">
                          {new Date(event.datum).getDate()}
                        </span>
                        <span className="text-xs uppercase mt-1">
                          {new Date(event.datum).toLocaleDateString('af-ZA', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900">{event.titel}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 ${getTipeColor(event.tipe)}`}>
                            {getTipeIcon(event.tipe)}
                            {getProgramTipeLabel(event.tipe)}
                          </span>
                        </div>
                        {event.beskrywing && (
                          <p className="text-sm text-gray-600 mt-1">{event.beskrywing}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                          {event.tyd && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.tyd}
                            </span>
                          )}
                          {event.plek && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.plek}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Geen komende geleenthede nie</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-400 mb-4">Vorige Geleenthede</h2>
              <div className="space-y-2 opacity-60">
                {pastEvents.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">
                        {new Date(event.datum).toLocaleDateString('af-ZA', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="font-medium text-gray-600">{event.titel}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getTipeColor(event.tipe)}`}>
                        {getProgramTipeLabel(event.tipe)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#8B7CB3]" />
                <h2 className="text-lg font-bold text-[#002855]">Laai Program CSV Op</h2>
              </div>
              <button 
                onClick={() => { setShowCSVModal(false); setCsvFile(null); setCsvPreview([]); }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Info */}
              <div className="bg-[#8B7CB3]/10 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-[#8B7CB3] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#8B7CB3]">
                    <p className="font-medium mb-1">CSV Formaat:</p>
                    <p>Verpligte kolomme: <strong>titel, datum</strong></p>
                    <p>Opsionele kolomme: beskrywing, tyd, plek, tipe</p>
                    <p className="mt-1">Datum formaat: YYYY-MM-DD (bv. 2025-01-15)</p>
                    <p>Tipe opsies: erediens, gebed, jeug, studie, vroue, mans, sosiaal, kategese, algemeen</p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div
                onClick={() => csvInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#8B7CB3] transition-colors"
              >
                {csvFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-[#8B7CB3]" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{csvFile.name}</p>
                      <p className="text-sm text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Klik om CSV lêer te kies</p>
                    <p className="text-sm text-gray-400 mt-1">of sleep en los hier</p>
                  </>
                )}
              </div>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVFileChange}
                className="hidden"
              />

              {/* Preview */}
              {csvPreview.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Voorskou (eerste 5 rye):</h3>
                  <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pb-2">Titel</th>
                          <th className="pb-2">Datum</th>
                          <th className="pb-2">Tipe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvPreview.map((row, i) => (
                          <tr key={i}>
                            <td className="py-2">{row.titel}</td>
                            <td className="py-2">{row.datum}</td>
                            <td className="py-2">{row.tipe || 'algemeen'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => { setShowCSVModal(false); setCsvFile(null); setCsvPreview([]); }}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Kanselleer
              </button>
              <button
                onClick={handleCSVUpload}
                disabled={!csvFile || uploadingCSV}
                className="flex-1 py-2 px-4 rounded-xl bg-[#8B7CB3] text-white font-semibold hover:bg-[#7a6ba0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingCSV ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Laai op...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Laai Op
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GemeenteProgram;
