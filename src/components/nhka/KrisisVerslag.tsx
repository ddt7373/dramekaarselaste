import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { getKrisisTipeLabel, getKrisisStatusLabel, isAdmin, KrisisStatus, isRestrictedLeader, KrisisTipe, isLeier } from '@/types/nhka';
import {
  AlertTriangle,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  X,
  User,
  FileText,
  WifiOff,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const KrisisVerslag: React.FC = () => {
  const { currentUser, gebruikers, krisisse, addKrisisVerslag, updateKrisisStatus, currentGemeente } = useNHKA();
  const { isOnline, addToQueue, syncQueue, syncNow } = useOffline();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTipe, setFilterTipe] = useState<string>('all');
  const [selectedKrisis, setSelectedKrisis] = useState<string | null>(null);

  const [newKrisis, setNewKrisis] = useState({
    gebruiker_id: '',
    tipe: 'mediese' as 'mediese' | 'finansieel' | 'geestelik' | 'sterfgeval' | 'ander',
    beskrywing: '',
    prioriteit: 'normaal' as 'laag' | 'normaal' | 'hoog' | 'dringend'
  });

  if (!currentUser) return null;

  const isUserAdmin = isAdmin(currentUser.rol);
  const canManageKrisis = isUserAdmin || isLeier(currentUser.rol) || currentUser.rol === 'predikant';
  const lidmate = gebruikers.filter(g => {
    if (g.rol !== 'lidmaat') return false;
    if (isRestrictedLeader(currentUser.rol)) {
      return g.wyk_id === currentUser.wyk_id && currentUser.wyk_id !== undefined && currentUser.wyk_id !== null;
    }
    return true;
  });

  // Get pending crisis reports from queue
  const pendingCrisisReports = syncQueue.filter(item => item.type === 'crisis');

  // Filter crises
  const filteredKrisisse = krisisse.filter(krisis => {
    if (filterStatus !== 'all' && krisis.status !== filterStatus) return false;
    if (filterTipe !== 'all' && krisis.tipe !== filterTipe) return false;

    // Role-based restriction check
    if (isRestrictedLeader(currentUser.rol)) {
      const g = gebruikers.find(u => u.id === krisis.gebruiker_id);
      if (g?.wyk_id !== currentUser.wyk_id) return false;
    }

    return true;
  });

  // Stats
  const stats = {
    ingedien: krisisse.filter(k => k.status === 'ingedien').length,
    in_proses: krisisse.filter(k => k.status === 'in_proses').length,
    opgelos: krisisse.filter(k => k.status === 'opgelos').length,
    pending: pendingCrisisReports.length
  };

  const handleSubmit = async () => {
    if (!newKrisis.gebruiker_id || !newKrisis.beskrywing) {
      toast.error('Kies \'n lidmaat en voeg \'n beskrywing by');
      return;
    }

    const krisisData = {
      ...newKrisis,
      ingedien_deur: currentUser.id,
      status: 'ingedien' as KrisisStatus,
      gemeente_id: currentGemeente?.id || ''
    };

    if (isOnline) {
      // Online: submit directly
      await addKrisisVerslag(krisisData);
      toast.success('Krisisverslag suksesvol ingedien');
    } else {
      // Offline: add to queue
      addToQueue({
        type: 'crisis',
        data: krisisData
      });
      toast.warning('Krisisverslag gestoor vir later sinkronisering', {
        description: 'Let wel: Dringende krisisse moet telefonies gerapporteer word wanneer van-lyn-af'
      });
    }

    setNewKrisis({
      gebruiker_id: '',
      tipe: 'mediese',
      beskrywing: '',
      prioriteit: 'normaal'
    });
    setShowForm(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: KrisisStatus) => {
    if (!isOnline) {
      toast.error('Jy moet aanlyn wees om status te verander');
      return;
    }
    await updateKrisisStatus(id, newStatus);
    setSelectedKrisis(null);
    toast.success('Status opgedateer');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ingedien': return <AlertCircle className="w-5 h-5 text-[#9E2A2B]" />;
      case 'erken': return <Clock className="w-5 h-5 text-[#D4A84B]" />;
      case 'in_proses': return <Clock className="w-5 h-5 text-[#D4A84B]" />;
      case 'opgelos': return <CheckCircle className="w-5 h-5 text-[#7A8450]" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ingedien': return 'bg-[#9E2A2B]/10 text-[#9E2A2B] border-[#9E2A2B]/20';
      case 'erken': return 'bg-[#D4A84B]/10 text-[#D4A84B] border-[#D4A84B]/20';
      case 'in_proses': return 'bg-[#D4A84B]/10 text-[#D4A84B] border-[#D4A84B]/20';
      case 'opgelos': return 'bg-[#7A8450]/10 text-[#7A8450] border-[#7A8450]/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPrioriteitColor = (prioriteit: string) => {
    switch (prioriteit) {
      case 'dringend': return 'bg-[#9E2A2B] text-white';
      case 'hoog': return 'bg-[#9E2A2B]/80 text-white';
      case 'normaal': return 'bg-[#D4A84B] text-[#002855]';
      case 'laag': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <WifiOff className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-800">Jy is tans van-lyn-af</p>
            <p className="text-sm text-red-600">
              Krisisverslae sal gestoor word vir later sinkronisering.
              <strong> Vir dringende krisisse, skakel asseblief direk.</strong>
            </p>
          </div>
        </div>
      )}

      {/* Pending Reports Banner */}
      {pendingCrisisReports.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CloudOff className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">
                {pendingCrisisReports.length} verslag{pendingCrisisReports.length > 1 ? 'e' : ''} wag om te sinkroniseer
              </p>
              <p className="text-sm text-amber-600">
                Hierdie verslae is van-lyn-af gestoor
              </p>
            </div>
          </div>
          {isOnline && (
            <button
              onClick={syncNow}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
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
          <h1 className="text-2xl font-bold text-[#002855]">Krisisverslae</h1>
          <p className="text-gray-500">Dien verslae in en volg krisisse op</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E2A2B] text-white font-semibold rounded-xl hover:bg-[#8a2526] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nuwe Verslag
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#9E2A2B]/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-[#9E2A2B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#9E2A2B]">{stats.ingedien}</p>
              <p className="text-xs text-gray-500">Ingedien</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A84B]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#D4A84B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4A84B]">{stats.in_proses}</p>
              <p className="text-xs text-gray-500">In Proses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#7A8450]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7A8450]">{stats.opgelos}</p>
              <p className="text-xs text-gray-500">Opgelos</p>
            </div>
          </div>
        </div>
        {stats.pending > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CloudOff className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-amber-700">Wagend</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Crisis Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-[#9E2A2B]/20 shadow-sm">
          <h2 className="text-lg font-bold text-[#002855] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#9E2A2B]" />
            Nuwe Krisisverslag
          </h2>
          {!isOnline && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
              <WifiOff className="w-4 h-4" />
              <span>Hierdie verslag sal gestoor word en later gesinkroniseer word</span>
            </div>
          )}
          {!isOnline && (newKrisis.prioriteit === 'dringend' || newKrisis.prioriteit === 'hoog') && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span><strong>Waarskuwing:</strong> Vir dringende krisisse, skakel asseblief direk met die kerkraad</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Betrokke Lidmaat *</label>
              <div className="relative">
                <select
                  value={newKrisis.gebruiker_id}
                  onChange={(e) => setNewKrisis({ ...newKrisis, gebruiker_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#9E2A2B] focus:ring-2 focus:ring-[#9E2A2B]/20 outline-none appearance-none bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Krisis</label>
              <div className="relative">
                <select
                  value={newKrisis.tipe}
                  onChange={(e) => setNewKrisis({ ...newKrisis, tipe: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#9E2A2B] focus:ring-2 focus:ring-[#9E2A2B]/20 outline-none appearance-none bg-white"
                >
                  <option value="mediese">Mediese Nood</option>
                  <option value="finansieel">Finansiële Nood</option>
                  <option value="geestelik">Geestelike Nood</option>
                  <option value="sterfgeval">Sterfgeval</option>
                  <option value="ander">Ander</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
              <div className="grid grid-cols-4 gap-2">
                {(['laag', 'normaal', 'hoog', 'dringend'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewKrisis({ ...newKrisis, prioriteit: p })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border-2 ${newKrisis.prioriteit === p
                      ? getPrioriteitColor(p) + ' border-transparent'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing *</label>
              <textarea
                value={newKrisis.beskrywing}
                onChange={(e) => setNewKrisis({ ...newKrisis, beskrywing: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#9E2A2B] focus:ring-2 focus:ring-[#9E2A2B]/20 outline-none resize-none"
                rows={4}
                placeholder="Beskryf die krisis in detail. Sluit relevante inligting in soos kontak, ligging, en dringendheid..."
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
              className="px-6 py-2 rounded-xl bg-[#9E2A2B] text-white font-semibold hover:bg-[#8a2526] transition-colors flex items-center gap-2"
            >
              {!isOnline && <CloudOff className="w-4 h-4" />}
              {isOnline ? 'Dien Verslag In' : 'Stoor Van-lyn-af'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
          >
            <option value="all">Alle Statusse</option>
            <option value="ingedien">Ingedien</option>
            <option value="erken">Erken</option>
            <option value="in_proses">In Proses</option>
            <option value="opgelos">Opgelos</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white text-sm"
          >
            <option value="all">Alle Tipes</option>
            <option value="mediese">Mediese Nood</option>
            <option value="finansieel">Finansiële Nood</option>
            <option value="geestelik">Geestelike Nood</option>
            <option value="sterfgeval">Sterfgeval</option>
            <option value="ander">Ander</option>
          </select>
          <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Pending Reports (Offline Queue) */}
      {pendingCrisisReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <CloudOff className="w-4 h-4" />
            Waggende Verslae (Van-lyn-af)
          </h3>
          {pendingCrisisReports.map(item => {
            const gebruiker = gebruikers.find(g => g.id === item.data.gebruiker_id);
            return (
              <div
                key={item.id}
                className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPrioriteitColor(item.data.prioriteit)}`}>
                            {item.data.prioriteit}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-white/50 rounded text-xs">
                            {getKrisisTipeLabel(item.data.tipe as KrisisTipe)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-600">
                            <CloudOff className="w-3 h-3" />
                            Wag vir sinkronisering
                          </span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-600 bg-white/50 rounded-lg p-3">
                      {item.data.beskrywing}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crisis List */}
      <div className="space-y-3">
        {filteredKrisisse.length > 0 ? (
          filteredKrisisse.map(krisis => {
            const gebruiker = gebruikers.find(g => g.id === krisis.gebruiker_id);
            const ingedienDeur = gebruikers.find(g => g.id === krisis.ingedien_deur);

            return (
              <div
                key={krisis.id}
                className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow ${krisis.prioriteit === 'dringend' || krisis.prioriteit === 'hoog'
                  ? 'border-[#9E2A2B]/30'
                  : 'border-gray-100'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(krisis.status)}`}>
                    {getStatusIcon(krisis.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {gebruiker ? `${gebruiker.naam} ${gebruiker.van}` : 'Onbekend'}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPrioriteitColor(krisis.prioriteit)}`}>
                            {krisis.prioriteit}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {getKrisisTipeLabel(krisis.tipe)}
                          </span>
                          <span>•</span>
                          <span>Ingedien deur {ingedienDeur ? `${ingedienDeur.naam}` : 'Onbekend'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(krisis.status)}`}>
                          {getKrisisStatusLabel(krisis.status)}
                        </span>
                        {canManageKrisis && krisis.status !== 'opgelos' && isOnline && (
                          <button
                            onClick={() => setSelectedKrisis(selectedKrisis === krisis.id ? null : krisis.id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${selectedKrisis === krisis.id ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {krisis.beskrywing}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(krisis.created_at).toLocaleDateString('af-ZA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Status Update Options */}
                    {selectedKrisis === krisis.id && canManageKrisis && isOnline && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Dateer Status Op:</p>
                        <div className="flex flex-wrap gap-2">
                          {(['erken', 'in_proses', 'opgelos'] as KrisisStatus[]).map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(krisis.id, status)}
                              disabled={krisis.status === status}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${krisis.status === status
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : status === 'opgelos'
                                  ? 'bg-[#7A8450] text-white hover:bg-[#6a7445]'
                                  : 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]'
                                }`}
                            >
                              {getKrisisStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Offline notice for status update */}
                    {selectedKrisis === krisis.id && canManageKrisis && !isOnline && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <WifiOff className="w-3 h-3" />
                          Jy moet aanlyn wees om status te verander
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <CheckCircle className="w-16 h-16 mx-auto text-[#7A8450] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen aktiewe krisisse</h3>
            <p className="text-gray-500">Alle krisisse is hanteer of daar is geen verslae nie</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KrisisVerslag;
