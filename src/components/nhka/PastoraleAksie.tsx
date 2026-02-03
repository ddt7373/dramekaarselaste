import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { getAksieLabel, isRestrictedLeader, AksieTipe } from '@/types/nhka';
import {
  Heart,
  Plus,
  Calendar,
  User,
  Filter,
  Home,
  MessageSquare,
  Phone as PhoneIcon,
  BookOpen,
  ChevronDown,
  FileText,
  Download,
  Printer,
  WifiOff,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// PDF Generation helper
const generatePastoraleVerslagPDF = (
  aksies: any[],
  gebruikers: any[],
  gemeenteNaam: string,
  filterMonth: string
) => {
  const monthLabel = filterMonth === 'all'
    ? 'Alle Tye'
    : new Date(filterMonth + '-01').toLocaleDateString('af-ZA', { month: 'long', year: 'numeric' });

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pastorale Verslag - ${gemeenteNaam}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #002855; border-bottom: 2px solid #D4A84B; padding-bottom: 10px; }
        h2 { color: #002855; margin-top: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #002855; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
        .stat-number { font-size: 24px; font-weight: bold; color: #002855; }
        .stat-label { font-size: 12px; color: #666; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pastorale Verslag</h1>
        <div class="date">Gegenereer: ${new Date().toLocaleDateString('af-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      
      <p><strong>Gemeente:</strong> ${gemeenteNaam}</p>
      <p><strong>Periode:</strong> ${monthLabel}</p>
      
      <div class="stats">
        <div class="stat-box">
          <div class="stat-number">${aksies.filter(a => a.tipe === 'besoek').length}</div>
          <div class="stat-label">Huisbesoeke</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${aksies.filter(a => a.tipe === 'boodskap').length}</div>
          <div class="stat-label">Boodskappe</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${aksies.filter(a => a.tipe === 'gebed').length}</div>
          <div class="stat-label">Gebede</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${aksies.filter(a => a.tipe === 'oproep').length}</div>
          <div class="stat-label">Oproepe</div>
        </div>
      </div>
      
      <h2>Aksie Besonderhede</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Lidmaat</th>
            <th>Tipe</th>
            <th>Leier</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          ${aksies.map(aksie => {
    const gebruiker = gebruikers.find((g: any) => g.id === aksie.gebruiker_id);
    const leier = gebruikers.find((g: any) => g.id === aksie.leier_id);
    return `
              <tr>
                <td>${new Date(aksie.datum).toLocaleDateString('af-ZA')}</td>
                <td>${gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}</td>
                <td>${getAksieLabel(aksie.tipe)}</td>
                <td>${leier ? `${leier.naam} ${leier.van}` : 'Onbekend'}</td>
                <td>${aksie.nota || '-'}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Nederduitsch Hervormde Kerk van Afrika</p>
        <p>"Dra mekaar se laste en vervul so die wet van Christus" — Galasiërs 6:2</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

const PastoraleAksie: React.FC = () => {
  const { currentUser, gebruikers, aksies, addPastoraleAksie, currentGemeente } = useNHKA();
  const { isOnline, addToQueue, syncQueue, syncNow, pendingCount } = useOffline();
  const [showForm, setShowForm] = useState(false);
  const [filterTipe, setFilterTipe] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const [newAksie, setNewAksie] = useState({
    gebruiker_id: '',
    tipe: 'besoek' as 'besoek' | 'boodskap' | 'gebed' | 'oproep',
    datum: new Date().toISOString().split('T')[0],
    nota: ''
  });

  if (!currentUser) return null;

  const lidmate = gebruikers.filter(g => {
    if (g.rol !== 'lidmaat') return false;
    if (isRestrictedLeader(currentUser.rol)) {
      return g.wyk_id === currentUser.wyk_id && currentUser.wyk_id !== undefined && currentUser.wyk_id !== null;
    }
    return true;
  });

  // Get pending pastoral actions from queue
  const pendingPastoralActions = syncQueue.filter(item => item.type === 'pastoral');

  // Filter actions
  const filteredAksies = aksies.filter(aksie => {
    if (filterTipe !== 'all' && aksie.tipe !== filterTipe) return false;
    if (filterMonth !== 'all') {
      const aksieDate = new Date(aksie.datum);
      const [year, month] = filterMonth.split('-');
      if (aksieDate.getFullYear() !== parseInt(year) || aksieDate.getMonth() !== parseInt(month) - 1) {
        return false;
      }
    }
    // Role-based restriction check
    if (isRestrictedLeader(currentUser.rol)) {
      const g = gebruikers.find(u => u.id === aksie.gebruiker_id);
      if (g?.wyk_id !== currentUser.wyk_id) return false;
    }

    return true;
  });

  // Stats
  const thisMonth = new Date();
  const monthlyStats = {
    besoek: aksies.filter(a => a.tipe === 'besoek' && new Date(a.datum).getMonth() === thisMonth.getMonth()).length,
    boodskap: aksies.filter(a => a.tipe === 'boodskap' && new Date(a.datum).getMonth() === thisMonth.getMonth()).length,
    gebed: aksies.filter(a => a.tipe === 'gebed' && new Date(a.datum).getMonth() === thisMonth.getMonth()).length,
    oproep: aksies.filter(a => a.tipe === 'oproep' && new Date(a.datum).getMonth() === thisMonth.getMonth()).length
  };

  const handleSubmit = async () => {
    if (!newAksie.gebruiker_id || !newAksie.nota) {
      toast.error('Kies \'n lidmaat en voeg \'n nota by');
      return;
    }

    const aksieData = {
      ...newAksie,
      leier_id: currentUser.id,
      gemeente_id: currentGemeente?.id || ''
    };

    if (isOnline) {
      // Online: submit directly
      await addPastoraleAksie(aksieData);
      toast.success('Pastorale aksie suksesvol geregistreer');
    } else {
      // Offline: add to queue
      addToQueue({
        type: 'pastoral',
        data: aksieData
      });
      toast.success('Aksie gestoor vir later sinkronisering', {
        description: 'Sal outomaties sinkroniseer wanneer jy weer aanlyn is'
      });
    }

    setNewAksie({
      gebruiker_id: '',
      tipe: 'besoek',
      datum: new Date().toISOString().split('T')[0],
      nota: ''
    });
    setShowForm(false);
  };

  const handleGeneratePDF = () => {
    generatePastoraleVerslagPDF(
      filteredAksies,
      gebruikers,
      currentGemeente?.naam || 'Gemeente',
      filterMonth
    );
    toast.success('PDF verslag word gegenereer...');
  };

  const getAksieIcon = (tipe: string) => {
    switch (tipe) {
      case 'besoek': return <Home className="w-5 h-5" />;
      case 'boodskap': return <MessageSquare className="w-5 h-5" />;
      case 'gebed': return <BookOpen className="w-5 h-5" />;
      case 'oproep': return <PhoneIcon className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getAksieColor = (tipe: string) => {
    switch (tipe) {
      case 'besoek': return 'bg-[#002855] text-white';
      case 'boodskap': return 'bg-[#D4A84B] text-[#002855]';
      case 'gebed': return 'bg-[#8B7CB3] text-white';
      case 'oproep': return 'bg-[#7A8450] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Generate month options
  const monthOptions = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    monthOptions.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('af-ZA', { month: 'long', year: 'numeric' })
    });
  }

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <WifiOff className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Jy is tans van-lyn-af</p>
            <p className="text-sm text-amber-600">Aksies sal gestoor word en later gesinkroniseer word</p>
          </div>
        </div>
      )}

      {/* Pending Actions Banner */}
      {pendingPastoralActions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CloudOff className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800">
                {pendingPastoralActions.length} aksie{pendingPastoralActions.length > 1 ? 's' : ''} wag om te sinkroniseer
              </p>
              <p className="text-sm text-blue-600">
                Hierdie aksies is van-lyn-af gestoor
              </p>
            </div>
          </div>
          {isOnline && (
            <button
              onClick={syncNow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Sinkroniseer
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855]">Pastorale Aksies</h1>
          <p className="text-gray-500">Registreer en volg geestelike versorging</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#002855] text-white font-semibold rounded-xl hover:bg-[#001d40] transition-colors shadow-lg"
          >
            <Printer className="w-5 h-5" />
            PDF Verslag
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuwe Aksie
          </button>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#002855] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#002855]">{monthlyStats.besoek}</p>
              <p className="text-xs text-gray-500">Huisbesoeke</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A84B] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#002855]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4A84B]">{monthlyStats.boodskap}</p>
              <p className="text-xs text-gray-500">Boodskappe</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#8B7CB3] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#8B7CB3]">{monthlyStats.gebed}</p>
              <p className="text-xs text-gray-500">Gebede</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7A8450] flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7A8450]">{monthlyStats.oproep}</p>
              <p className="text-xs text-gray-500">Oproepe</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Action Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#002855] mb-4">Registreer Nuwe Aksie</h2>
          {!isOnline && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
              <WifiOff className="w-4 h-4" />
              <span>Hierdie aksie sal gestoor word en later gesinkroniseer word</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lidmaat *</label>
              <div className="relative">
                <select
                  value={newAksie.gebruiker_id}
                  onChange={(e) => setNewAksie({ ...newAksie, gebruiker_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                >
                  <option value="">Kies 'n lidmaat...</option>
                  {lidmate.map(lid => (
                    <option key={lid.id} value={lid.id}>
                      {lid.naam} {lid.van}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input
                type="date"
                value={newAksie.datum}
                onChange={(e) => setNewAksie({ ...newAksie, datum: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Aksie</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['besoek', 'boodskap', 'gebed', 'oproep'] as const).map(tipe => (
                  <button
                    key={tipe}
                    type="button"
                    onClick={() => setNewAksie({ ...newAksie, tipe })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${newAksie.tipe === tipe
                      ? 'border-[#D4A84B] bg-[#D4A84B]/10 text-[#002855]'
                      : 'border-gray-200 text-gray-600 hover:border-[#D4A84B]/50'
                      }`}
                  >
                    {getAksieIcon(tipe)}
                    {getAksieLabel(tipe)}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota *</label>
              <textarea
                value={newAksie.nota}
                onChange={(e) => setNewAksie({ ...newAksie, nota: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                rows={3}
                placeholder="Beskryf die aksie en enige belangrike inligting..."
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
              className="px-6 py-2 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7445] transition-colors flex items-center gap-2"
            >
              {!isOnline && <CloudOff className="w-4 h-4" />}
              {isOnline ? 'Registreer Aksie' : 'Stoor Van-lyn-af'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
          >
            <option value="all">Alle Tipes</option>
            <option value="besoek">Huisbesoeke</option>
            <option value="boodskap">Boodskappe</option>
            <option value="gebed">Gebede</option>
            <option value="oproep">Oproepe</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
          >
            <option value="all">Alle Maande</option>
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Pending Actions (Offline Queue) */}
      {pendingPastoralActions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <CloudOff className="w-4 h-4" />
            Waggende Aksies (Van-lyn-af)
          </h3>
          {pendingPastoralActions.map(item => {
            const gebruiker = gebruikers.find(g => g.id === item.data.gebruiker_id);
            return (
              <div
                key={item.id}
                className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getAksieColor(item.data.tipe)}`}>
                    {getAksieIcon(item.data.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getAksieLabel(item.data.tipe as AksieTipe)} • Wag vir sinkronisering
                        </p>
                      </div>
                      <span className="text-sm text-amber-600 flex-shrink-0 flex items-center gap-1">
                        <CloudOff className="w-3 h-3" />
                        Van-lyn-af
                      </span>
                    </div>
                    {item.data.nota && (
                      <p className="mt-2 text-sm text-gray-600 bg-white/50 rounded-lg p-3">
                        {item.data.nota}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-3">
        {filteredAksies.length > 0 ? (
          filteredAksies.map(aksie => {
            const gebruiker = gebruikers.find(g => g.id === aksie.gebruiker_id);
            const leier = gebruikers.find(g => g.id === aksie.leier_id);

            return (
              <div
                key={aksie.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getAksieColor(aksie.tipe)}`}>
                    {getAksieIcon(aksie.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getAksieLabel(aksie.tipe)} deur {leier ? `${leier.naam} ${leier.van}` : 'Onbekend'}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400 flex-shrink-0">
                        {new Date(aksie.datum).toLocaleDateString('af-ZA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {aksie.nota && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        {aksie.nota}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen aksies gevind</h3>
            <p className="text-gray-500">Begin deur 'n nuwe pastorale aksie te registreer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastoraleAksie;
