import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { 
  getRolLabel, 
  Gebruiker, 
  Wyk,
  UserRole,
  getLidmaatDisplayNaam
} from '@/types/nhka';
import { 
  MapPin,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  CheckSquare,
  Square,
  ArrowRight,
  GripVertical,
  Filter,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface WykToewysingProps {
  gemeenteId?: string;
  onClose?: () => void;
  showAsModal?: boolean;
  initialUnassignedMembers?: Gebruiker[];
}

const WykToewysing: React.FC<WykToewysingProps> = ({ 
  gemeenteId, 
  onClose, 
  showAsModal = false,
  initialUnassignedMembers
}) => {
  const { 
    currentUser,
    currentGemeente,
    gebruikers, 
    wyke,
    refreshData
  } = useNHKA();

  // Use provided gemeenteId or current gemeente
  const activeGemeenteId = gemeenteId || currentGemeente?.id;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [wykSearchTerm, setWykSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedWykId, setSelectedWykId] = useState<string>('');
  const [expandedWyke, setExpandedWyke] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [draggedMember, setDraggedMember] = useState<string | null>(null);
  const [dragOverWyk, setDragOverWyk] = useState<string | null>(null);
  const [filterRol, setFilterRol] = useState<UserRole | 'all'>('all');
  const [assignmentResult, setAssignmentResult] = useState<{ success: number; failed: number } | null>(null);

  // Get unassigned members (no wyk_id)
  const unassignedMembers = (initialUnassignedMembers || gebruikers)
    .filter(g => !g.wyk_id && g.gemeente_id === activeGemeenteId)
    .filter(g => 
      g.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.van.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.selfoon?.includes(searchTerm) ||
      g.epos?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(g => filterRol === 'all' || g.rol === filterRol);

  // Get wyke for the active gemeente
  const gemeenteWyke = wyke
    .filter(w => w.gemeente_id === activeGemeenteId)
    .filter(w => 
      w.naam.toLowerCase().includes(wykSearchTerm.toLowerCase())
    );

  // Get members for a specific wyk
  const getMembersForWyk = (wykId: string) => 
    gebruikers.filter(g => g.wyk_id === wykId);

  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Select all visible unassigned members
  const selectAllVisible = () => {
    const allVisibleIds = unassignedMembers.map(m => m.id);
    setSelectedMembers(prev => {
      const allSelected = allVisibleIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !allVisibleIds.includes(id));
      } else {
        return [...new Set([...prev, ...allVisibleIds])];
      }
    });
  };

  // Toggle wyk expansion
  const toggleWykExpansion = (wykId: string) => {
    setExpandedWyke(prev => 
      prev.includes(wykId)
        ? prev.filter(id => id !== wykId)
        : [...prev, wykId]
    );
  };

  // Assign members to wyk
  const assignMembersToWyk = async (memberIds: string[], wykId: string) => {
    if (memberIds.length === 0 || !wykId) {
      toast.error('Kies asb lidmate en \'n wyk');
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let failCount = 0;

    for (const memberId of memberIds) {
      try {
        const { error } = await supabase
          .from('gebruikers')
          .update({ 
            wyk_id: wykId,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId);

        if (error) {
          console.error('Assignment error:', error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('Assignment error:', err);
        failCount++;
      }
    }

    setIsAssigning(false);
    setAssignmentResult({ success: successCount, failed: failCount });

    // Clear selection
    setSelectedMembers(prev => prev.filter(id => !memberIds.includes(id)));
    setSelectedWykId('');

    // Refresh data
    await refreshData();

    if (failCount === 0) {
      toast.success(`${successCount} lidma${successCount === 1 ? 'at' : 'te'} suksesvol toegewys!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} suksesvol, ${failCount} misluk`);
    } else {
      toast.error('Toewysing het misluk');
    }
  };

  // Remove member from wyk
  const removeMemberFromWyk = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('gebruikers')
        .update({ 
          wyk_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        toast.error('Kon nie lidmaat verwyder nie');
        return;
      }

      await refreshData();
      toast.success('Lidmaat verwyder van wyk');
    } catch (err) {
      toast.error('Fout tydens verwydering');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, memberId: string) => {
    setDraggedMember(memberId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', memberId);
  };

  const handleDragEnd = () => {
    setDraggedMember(null);
    setDragOverWyk(null);
  };

  const handleDragOver = (e: React.DragEvent, wykId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverWyk(wykId);
  };

  const handleDragLeave = () => {
    setDragOverWyk(null);
  };

  const handleDrop = async (e: React.DragEvent, wykId: string) => {
    e.preventDefault();
    setDragOverWyk(null);
    
    const memberId = e.dataTransfer.getData('text/plain');
    if (memberId) {
      // If there are selected members and the dragged one is selected, assign all selected
      if (selectedMembers.includes(memberId) && selectedMembers.length > 1) {
        await assignMembersToWyk(selectedMembers, wykId);
      } else {
        await assignMembersToWyk([memberId], wykId);
      }
    }
    setDraggedMember(null);
  };

  // Handle bulk assignment
  const handleBulkAssign = () => {
    if (selectedMembers.length === 0) {
      toast.error('Kies asb lidmate om toe te wys');
      return;
    }
    if (!selectedWykId) {
      toast.error('Kies asb \'n wyk');
      return;
    }
    assignMembersToWyk(selectedMembers, selectedWykId);
  };

  // Get role options for filter
  const roleOptions: { value: UserRole | 'all'; label: string }[] = [
    { value: 'all', label: 'Alle Rolle' },
    { value: 'lidmaat', label: 'Lidmaat' },
    { value: 'groepleier', label: 'Groepleier' },
    { value: 'ouderling', label: 'Ouderling' },
    { value: 'diaken', label: 'Diaken' },
    { value: 'kerkraad', label: 'Kerkraad' },
    { value: 'predikant', label: 'Predikant' }
  ];

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7A8450] flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002855]">Wyk Toewysing</h2>
            <p className="text-sm text-gray-500">
              Sleep lidmate na wyke of gebruik massa-toewysing
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Bulk Assignment Bar */}
      {selectedMembers.length > 0 && (
        <div className="p-3 bg-[#D4A84B]/10 border-b border-[#D4A84B]/20 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#D4A84B]" />
            <span className="font-medium text-[#002855]">
              {selectedMembers.length} gekies
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <select
              value={selectedWykId}
              onChange={(e) => setSelectedWykId(e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm"
            >
              <option value="">Kies wyk...</option>
              {gemeenteWyke.map(w => (
                <option key={w.id} value={w.id}>{w.naam}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={!selectedWykId || isAssigning}
              className="px-4 py-1.5 bg-[#7A8450] text-white font-medium rounded-lg hover:bg-[#6a7445] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Besig...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Wys Toe
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => setSelectedMembers([])}
            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content - Two Columns */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Column - Unassigned Members */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 min-h-[300px] lg:min-h-0">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <Users className="w-4 h-4" />
                Ontoegekende Lidmate
                <span className="px-2 py-0.5 bg-[#9E2A2B]/10 text-[#9E2A2B] text-xs font-medium rounded-full">
                  {unassignedMembers.length}
                </span>
              </h3>
              <button
                onClick={selectAllVisible}
                className="text-xs text-[#7A8450] hover:text-[#6a7445] font-medium"
              >
                {unassignedMembers.every(m => selectedMembers.includes(m.id)) && unassignedMembers.length > 0
                  ? 'Ontkies Almal'
                  : 'Kies Almal'}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Soek lidmate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none"
                />
              </div>
              <div className="relative">
                <select
                  value={filterRol}
                  onChange={(e) => setFilterRol(e.target.value as UserRole | 'all')}
                  className="pl-3 pr-8 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none appearance-none bg-white"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {unassignedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <CheckCircle2 className="w-12 h-12 text-[#7A8450] mb-3" />
                <p className="text-gray-600 font-medium">Alle lidmate is toegewys!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Geen ontoegekende lidmate gevind nie
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {unassignedMembers.map(member => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, member.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      selectedMembers.includes(member.id)
                        ? 'bg-[#7A8450]/10 border border-[#7A8450]/30'
                        : 'bg-white border border-gray-100 hover:border-[#7A8450]/30 hover:bg-gray-50'
                    } ${draggedMember === member.id ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      selectedMembers.includes(member.id) 
                        ? 'bg-[#7A8450] text-white' 
                        : 'border border-gray-300'
                    }`}>
                      {selectedMembers.includes(member.id) && <Check className="w-3 h-3" />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#002855] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.profile_pic_url ? (
                        <img src={member.profile_pic_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {(member.noemnaam || member.naam || '')[0]}{(member.van || '')[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {getLidmaatDisplayNaam(member)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 truncate">
                          {member.selfoon || member.epos || 'Geen kontak'}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          member.rol === 'lidmaat' 
                            ? 'bg-[#8B7CB3]/10 text-[#8B7CB3]' 
                            : 'bg-[#7A8450]/10 text-[#7A8450]'
                        }`}>
                          {getRolLabel(member.rol)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Wyke */}
        <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Wyke
                <span className="px-2 py-0.5 bg-[#002855]/10 text-[#002855] text-xs font-medium rounded-full">
                  {gemeenteWyke.length}
                </span>
              </h3>
              <button
                onClick={() => refreshData()}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Verfris data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Soek wyke..."
                value={wykSearchTerm}
                onChange={(e) => setWykSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {gemeenteWyke.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">Geen wyke gevind nie</p>
                <p className="text-sm text-gray-400 mt-1">
                  Skep eers wyke in die Wyke & Besoekpunte afdeling
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {gemeenteWyke.map(wyk => {
                  const wykMembers = getMembersForWyk(wyk.id);
                  const isExpanded = expandedWyke.includes(wyk.id);
                  const isDragOver = dragOverWyk === wyk.id;

                  return (
                    <div
                      key={wyk.id}
                      onDragOver={(e) => handleDragOver(e, wyk.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, wyk.id)}
                      className={`rounded-lg border transition-all ${
                        isDragOver 
                          ? 'border-[#7A8450] bg-[#7A8450]/5 border-dashed border-2' 
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                        onClick={() => toggleWykExpansion(wyk.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-[#002855]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{wyk.naam}</p>
                            <p className="text-xs text-gray-500">
                              {wykMembers.length} lidma{wykMembers.length === 1 ? 'at' : 'te'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDragOver && (
                            <span className="text-xs text-[#7A8450] font-medium">
                              Los hier
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && wykMembers.length > 0 && (
                        <div className="border-t border-gray-100 p-2 bg-gray-50 space-y-1">
                          {wykMembers.map(member => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#002855] flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {member.profile_pic_url ? (
                                    <img src={member.profile_pic_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white text-xs font-bold">
                                      {(member.noemnaam || member.naam || '')[0]}{(member.van || '')[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {getLidmaatDisplayNaam(member)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {getRolLabel(member.rol)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMemberFromWyk(member.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                title="Verwyder van wyk"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {isExpanded && wykMembers.length === 0 && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50 text-center">
                          <p className="text-sm text-gray-400">
                            Geen lidmate in hierdie wyk nie
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Sleep lidmate hierheen om toe te wys
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with stats */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span>
            <strong className="text-[#9E2A2B]">{unassignedMembers.length}</strong> ontoegekend
          </span>
          <span>
            <strong className="text-[#7A8450]">{gebruikers.filter(g => g.wyk_id && g.gemeente_id === activeGemeenteId).length}</strong> toegewys
          </span>
        </div>
        {assignmentResult && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7A8450]" />
            <span className="text-[#7A8450]">
              {assignmentResult.success} suksesvol toegewys
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
      {content}
    </div>
  );
};

export default WykToewysing;
