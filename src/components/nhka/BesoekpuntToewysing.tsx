import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { 
  getRolLabel, 
  Gebruiker, 
  Wyk,
  Besoekpunt,
  UserRole
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
  ArrowRight,
  GripVertical,
  Filter,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Home,
  Plus,
  FolderTree,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface BesoekpuntToewysingProps {
  gemeenteId?: string;
  onClose?: () => void;
  showAsModal?: boolean;
  initialUnassignedMembers?: Gebruiker[];
}

type AssignmentStep = 'select-members' | 'select-wyk' | 'select-besoekpunt' | 'confirm';

const BesoekpuntToewysing: React.FC<BesoekpuntToewysingProps> = ({ 
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
    besoekpunte,
    refreshData,
    addBesoekpunt
  } = useNHKA();

  // Use provided gemeenteId or current gemeente
  const activeGemeenteId = gemeenteId || currentGemeente?.id;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [wykSearchTerm, setWykSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedWykId, setSelectedWykId] = useState<string>('');
  const [selectedBesoekpuntId, setSelectedBesoekpuntId] = useState<string>('');
  const [expandedWyke, setExpandedWyke] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [draggedMember, setDraggedMember] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ type: 'wyk' | 'besoekpunt'; id: string } | null>(null);
  const [filterRol, setFilterRol] = useState<UserRole | 'all'>('all');
  const [assignmentResult, setAssignmentResult] = useState<{ success: number; failed: number } | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'unassigned-wyk' | 'unassigned-besoekpunt'>('all');
  
  // New besoekpunt modal state
  const [showNewBesoekpunt, setShowNewBesoekpunt] = useState(false);
  const [newBesoekpuntWykId, setNewBesoekpuntWykId] = useState<string>('');
  const [newBesoekpunt, setNewBesoekpunt] = useState({ naam: '', beskrywing: '', adres: '' });
  const [isCreatingBesoekpunt, setIsCreatingBesoekpunt] = useState(false);

  // Get members based on view mode
  const getFilteredMembers = () => {
    let members = initialUnassignedMembers || gebruikers;
    
    // Filter by gemeente
    members = members.filter(g => g.gemeente_id === activeGemeenteId);
    
    // Filter by view mode
    switch (viewMode) {
      case 'unassigned-wyk':
        members = members.filter(g => !g.wyk_id);
        break;
      case 'unassigned-besoekpunt':
        members = members.filter(g => g.wyk_id && !g.besoekpunt_id);
        break;
      case 'all':
      default:
        members = members.filter(g => !g.wyk_id || !g.besoekpunt_id);
        break;
    }
    
    // Filter by search
    members = members.filter(g => 
      g.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.van.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.selfoon?.includes(searchTerm) ||
      g.epos?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filter by role
    if (filterRol !== 'all') {
      members = members.filter(g => g.rol === filterRol);
    }
    
    return members;
  };

  const filteredMembers = getFilteredMembers();

  // Get wyke for the active gemeente
  const gemeenteWyke = wyke
    .filter(w => w.gemeente_id === activeGemeenteId)
    .filter(w => 
      w.naam.toLowerCase().includes(wykSearchTerm.toLowerCase())
    );

  // Get besoekpunte for a specific wyk
  const getBesoekpunteForWyk = (wykId: string) => 
    besoekpunte.filter(b => b.wyk_id === wykId);

  // Get members for a specific wyk (not assigned to besoekpunt)
  const getMembersForWyk = (wykId: string) => 
    gebruikers.filter(g => g.wyk_id === wykId && !g.besoekpunt_id);

  // Get members for a specific besoekpunt
  const getMembersForBesoekpunt = (besoekpuntId: string) => 
    gebruikers.filter(g => g.besoekpunt_id === besoekpuntId);

  // Get all members in a wyk (including those in besoekpunte)
  const getAllMembersInWyk = (wykId: string) =>
    gebruikers.filter(g => g.wyk_id === wykId);

  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Select all visible members
  const selectAllVisible = () => {
    const allVisibleIds = filteredMembers.map(m => m.id);
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

  // Assign members to wyk only
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
      toast.success(`${successCount} lidma${successCount === 1 ? 'at' : 'te'} aan wyk toegewys!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} suksesvol, ${failCount} misluk`);
    } else {
      toast.error('Toewysing het misluk');
    }
  };

  // Assign members to besoekpunt (and wyk)
  const assignMembersToBesoekpunt = async (memberIds: string[], besoekpuntId: string) => {
    if (memberIds.length === 0 || !besoekpuntId) {
      toast.error('Kies asb lidmate en \'n besoekpunt');
      return;
    }

    // Get the besoekpunt to find its wyk_id
    const besoekpunt = besoekpunte.find(b => b.id === besoekpuntId);
    if (!besoekpunt || !besoekpunt.wyk_id) {
      toast.error('Ongeldige besoekpunt');
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
            wyk_id: besoekpunt.wyk_id,
            besoekpunt_id: besoekpuntId,
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
    setSelectedBesoekpuntId('');

    // Refresh data
    await refreshData();

    if (failCount === 0) {
      toast.success(`${successCount} lidma${successCount === 1 ? 'at' : 'te'} aan besoekpunt toegewys!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} suksesvol, ${failCount} misluk`);
    } else {
      toast.error('Toewysing het misluk');
    }
  };

  // Remove member from besoekpunt (keep in wyk)
  const removeMemberFromBesoekpunt = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('gebruikers')
        .update({ 
          besoekpunt_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        toast.error('Kon nie lidmaat verwyder nie');
        return;
      }

      await refreshData();
      toast.success('Lidmaat verwyder van besoekpunt');
    } catch (err) {
      toast.error('Fout tydens verwydering');
    }
  };

  // Remove member from wyk (and besoekpunt)
  const removeMemberFromWyk = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('gebruikers')
        .update({ 
          wyk_id: null,
          besoekpunt_id: null,
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

  // Create new besoekpunt
  const handleCreateBesoekpunt = async () => {
    if (!newBesoekpunt.naam.trim()) {
      toast.error('Besoekpunt naam is verpligtend');
      return;
    }

    if (!newBesoekpuntWykId) {
      toast.error('Kies asb \'n wyk');
      return;
    }

    setIsCreatingBesoekpunt(true);

    const result = await addBesoekpunt({
      naam: newBesoekpunt.naam,
      beskrywing: newBesoekpunt.beskrywing || undefined,
      adres: newBesoekpunt.adres || undefined,
      wyk_id: newBesoekpuntWykId
    });

    setIsCreatingBesoekpunt(false);

    if (result.success) {
      toast.success('Besoekpunt suksesvol geskep!');
      setNewBesoekpunt({ naam: '', beskrywing: '', adres: '' });
      setShowNewBesoekpunt(false);
      
      // Expand the wyk to show the new besoekpunt
      if (!expandedWyke.includes(newBesoekpuntWykId)) {
        setExpandedWyke(prev => [...prev, newBesoekpuntWykId]);
      }
    } else {
      toast.error(result.error || 'Kon nie besoekpunt skep nie');
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
    setDragOverTarget(null);
  };

  const handleDragOverWyk = (e: React.DragEvent, wykId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ type: 'wyk', id: wykId });
  };

  const handleDragOverBesoekpunt = (e: React.DragEvent, besoekpuntId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ type: 'besoekpunt', id: besoekpuntId });
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropOnWyk = async (e: React.DragEvent, wykId: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    
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

  const handleDropOnBesoekpunt = async (e: React.DragEvent, besoekpuntId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    
    const memberId = e.dataTransfer.getData('text/plain');
    if (memberId) {
      // If there are selected members and the dragged one is selected, assign all selected
      if (selectedMembers.includes(memberId) && selectedMembers.length > 1) {
        await assignMembersToBesoekpunt(selectedMembers, besoekpuntId);
      } else {
        await assignMembersToBesoekpunt([memberId], besoekpuntId);
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
    
    if (selectedBesoekpuntId) {
      assignMembersToBesoekpunt(selectedMembers, selectedBesoekpuntId);
    } else if (selectedWykId) {
      assignMembersToWyk(selectedMembers, selectedWykId);
    } else {
      toast.error('Kies asb \'n wyk of besoekpunt');
    }
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

  // Stats
  const totalMembers = gebruikers.filter(g => g.gemeente_id === activeGemeenteId).length;
  const unassignedToWyk = gebruikers.filter(g => g.gemeente_id === activeGemeenteId && !g.wyk_id).length;
  const assignedToWykOnly = gebruikers.filter(g => g.gemeente_id === activeGemeenteId && g.wyk_id && !g.besoekpunt_id).length;
  const fullyAssigned = gebruikers.filter(g => g.gemeente_id === activeGemeenteId && g.wyk_id && g.besoekpunt_id).length;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7A8450] flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002855]">Wyk & Besoekpunt Toewysing</h2>
            <p className="text-sm text-gray-500">
              Sleep lidmate na wyke en besoekpunte, of gebruik massa-toewysing
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

      {/* Stats Bar */}
      <div className="p-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Totaal:</span>
          <span className="font-semibold text-[#002855]">{totalMembers}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#9E2A2B]" />
          <span className="text-gray-500">Geen wyk:</span>
          <span className="font-semibold text-[#9E2A2B]">{unassignedToWyk}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D4A84B]" />
          <span className="text-gray-500">Slegs wyk:</span>
          <span className="font-semibold text-[#D4A84B]">{assignedToWykOnly}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7A8450]" />
          <span className="text-gray-500">Volledig:</span>
          <span className="font-semibold text-[#7A8450]">{fullyAssigned}</span>
        </div>
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
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <select
              value={selectedWykId}
              onChange={(e) => {
                setSelectedWykId(e.target.value);
                setSelectedBesoekpuntId('');
              }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm"
            >
              <option value="">Kies wyk...</option>
              {gemeenteWyke.map(w => (
                <option key={w.id} value={w.id}>{w.naam}</option>
              ))}
            </select>
            {selectedWykId && (
              <>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedBesoekpuntId}
                  onChange={(e) => setSelectedBesoekpuntId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none text-sm"
                >
                  <option value="">Slegs wyk (geen besoekpunt)</option>
                  {getBesoekpunteForWyk(selectedWykId).map(b => (
                    <option key={b.id} value={b.id}>{b.naam}</option>
                  ))}
                </select>
              </>
            )}
            <button
              onClick={handleBulkAssign}
              disabled={(!selectedWykId && !selectedBesoekpuntId) || isAssigning}
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
        {/* Left Column - Members to Assign */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 min-h-[300px] lg:min-h-0">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <Users className="w-4 h-4" />
                Lidmate om toe te wys
                <span className="px-2 py-0.5 bg-[#9E2A2B]/10 text-[#9E2A2B] text-xs font-medium rounded-full">
                  {filteredMembers.length}
                </span>
              </h3>
              <button
                onClick={selectAllVisible}
                className="text-xs text-[#7A8450] hover:text-[#6a7445] font-medium"
              >
                {filteredMembers.every(m => selectedMembers.includes(m.id)) && filteredMembers.length > 0
                  ? 'Ontkies Almal'
                  : 'Kies Almal'}
              </button>
            </div>
            
            {/* View mode tabs */}
            <div className="flex gap-1 mb-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'all' ? 'bg-white text-[#002855] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Alle Onvoltooid
              </button>
              <button
                onClick={() => setViewMode('unassigned-wyk')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'unassigned-wyk' ? 'bg-white text-[#9E2A2B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Geen Wyk
              </button>
              <button
                onClick={() => setViewMode('unassigned-besoekpunt')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'unassigned-besoekpunt' ? 'bg-white text-[#D4A84B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Geen Besoekpunt
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
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <CheckCircle2 className="w-12 h-12 text-[#7A8450] mb-3" />
                <p className="text-gray-600 font-medium">
                  {viewMode === 'all' ? 'Alle lidmate is volledig toegewys!' : 
                   viewMode === 'unassigned-wyk' ? 'Alle lidmate het wyke!' :
                   'Alle lidmate het besoekpunte!'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Geen lidmate om te wys nie
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map(member => {
                  const memberWyk = wyke.find(w => w.id === member.wyk_id);
                  
                  return (
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
                            {member.naam[0]}{member.van[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {member.naam} {member.van}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {memberWyk && (
                            <span className="text-xs text-[#D4A84B] bg-[#D4A84B]/10 px-1.5 py-0.5 rounded">
                              {memberWyk.naam}
                            </span>
                          )}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Wyke & Besoekpunte */}
        <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#002855] flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Wyke & Besoekpunte
                <span className="px-2 py-0.5 bg-[#002855]/10 text-[#002855] text-xs font-medium rounded-full">
                  {gemeenteWyke.length} wyke
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewBesoekpuntWykId('');
                    setShowNewBesoekpunt(true);
                  }}
                  className="p-1.5 text-[#7A8450] hover:bg-[#7A8450]/10 rounded-lg transition-colors"
                  title="Nuwe besoekpunt"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => refreshData()}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Verfris data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
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
                  const wykBesoekpunte = getBesoekpunteForWyk(wyk.id);
                  const wykOnlyMembers = getMembersForWyk(wyk.id);
                  const allWykMembers = getAllMembersInWyk(wyk.id);
                  const isExpanded = expandedWyke.includes(wyk.id);
                  const isDragOverWyk = dragOverTarget?.type === 'wyk' && dragOverTarget.id === wyk.id;

                  return (
                    <div
                      key={wyk.id}
                      className={`rounded-lg border transition-all ${
                        isDragOverWyk 
                          ? 'border-[#7A8450] bg-[#7A8450]/5 border-dashed border-2' 
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      {/* Wyk Header - Drop zone for wyk only */}
                      <div 
                        onDragOver={(e) => handleDragOverWyk(e, wyk.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnWyk(e, wyk.id)}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                        onClick={() => toggleWykExpansion(wyk.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#002855]/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-[#002855]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{wyk.naam}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{allWykMembers.length} lidmate</span>
                              <span>•</span>
                              <span>{wykBesoekpunte.length} besoekpunte</span>
                              {wykOnlyMembers.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#D4A84B]">{wykOnlyMembers.length} sonder besoekpunt</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDragOverWyk && (
                            <span className="text-xs text-[#7A8450] font-medium">
                              Los hier (slegs wyk)
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewBesoekpuntWykId(wyk.id);
                              setShowNewBesoekpunt(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#7A8450] transition-colors"
                            title="Nuwe besoekpunt in hierdie wyk"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content - Besoekpunte */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-2 bg-gray-50 space-y-2">
                          {/* Members in wyk but not in besoekpunt */}
                          {wykOnlyMembers.length > 0 && (
                            <div className="bg-[#D4A84B]/5 rounded-lg p-2 border border-[#D4A84B]/20">
                              <p className="text-xs font-medium text-[#D4A84B] mb-2 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Lidmate sonder besoekpunt ({wykOnlyMembers.length})
                              </p>
                              <div className="space-y-1">
                                {wykOnlyMembers.slice(0, 3).map(member => (
                                  <div key={member.id} className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-[#002855] flex items-center justify-center text-white text-xs font-bold">
                                        {member.naam[0]}{member.van[0]}
                                      </div>
                                      <span className="text-sm">{member.naam} {member.van}</span>
                                    </div>
                                    <button
                                      onClick={() => removeMemberFromWyk(member.id)}
                                      className="p-1 text-gray-400 hover:text-red-500"
                                      title="Verwyder van wyk"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {wykOnlyMembers.length > 3 && (
                                  <p className="text-xs text-gray-400 text-center">
                                    +{wykOnlyMembers.length - 3} meer
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Besoekpunte */}
                          {wykBesoekpunte.length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-400">Geen besoekpunte nie</p>
                              <button
                                onClick={() => {
                                  setNewBesoekpuntWykId(wyk.id);
                                  setShowNewBesoekpunt(true);
                                }}
                                className="mt-2 text-xs text-[#7A8450] hover:underline"
                              >
                                Skep eerste besoekpunt
                              </button>
                            </div>
                          ) : (
                            wykBesoekpunte.map(bp => {
                              const bpMembers = getMembersForBesoekpunt(bp.id);
                              const isDragOverBp = dragOverTarget?.type === 'besoekpunt' && dragOverTarget.id === bp.id;

                              return (
                                <div
                                  key={bp.id}
                                  onDragOver={(e) => handleDragOverBesoekpunt(e, bp.id)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDropOnBesoekpunt(e, bp.id)}
                                  className={`bg-white rounded-lg border p-2 transition-all ${
                                    isDragOverBp 
                                      ? 'border-[#7A8450] bg-[#7A8450]/5 border-dashed border-2' 
                                      : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Home className="w-4 h-4 text-[#7A8450]" />
                                      <span className="font-medium text-sm">{bp.naam}</span>
                                      <span className="text-xs text-gray-400">({bpMembers.length})</span>
                                    </div>
                                    {isDragOverBp && (
                                      <span className="text-xs text-[#7A8450] font-medium">
                                        Los hier
                                      </span>
                                    )}
                                  </div>
                                  {bp.adres && (
                                    <p className="text-xs text-gray-400 mb-2">{bp.adres}</p>
                                  )}
                                  {bpMembers.length > 0 && (
                                    <div className="space-y-1">
                                      {bpMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-1.5 bg-gray-50 rounded">
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#002855] flex items-center justify-center text-white text-xs font-bold">
                                              {member.naam[0]}{member.van[0]}
                                            </div>
                                            <span className="text-sm">{member.naam} {member.van}</span>
                                          </div>
                                          <button
                                            onClick={() => removeMemberFromBesoekpunt(member.id)}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                            title="Verwyder van besoekpunt"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {bpMembers.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">
                                      Sleep lidmate hierheen
                                    </p>
                                  )}
                                </div>
                              );
                            })
                          )}
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
            <strong className="text-[#9E2A2B]">{unassignedToWyk}</strong> sonder wyk
          </span>
          <span>
            <strong className="text-[#D4A84B]">{assignedToWykOnly}</strong> sonder besoekpunt
          </span>
          <span>
            <strong className="text-[#7A8450]">{fullyAssigned}</strong> volledig
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

      {/* New Besoekpunt Modal */}
      {showNewBesoekpunt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#7A8450] flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#002855]">Nuwe Besoekpunt</h2>
              </div>
              <button 
                onClick={() => setShowNewBesoekpunt(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wyk *</label>
                <select
                  value={newBesoekpuntWykId}
                  onChange={(e) => setNewBesoekpuntWykId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none"
                >
                  <option value="">Kies wyk...</option>
                  {gemeenteWyke.map(w => (
                    <option key={w.id} value={w.id}>{w.naam}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Besoekpunt Naam *</label>
                <input
                  type="text"
                  value={newBesoekpunt.naam}
                  onChange={(e) => setNewBesoekpunt({ ...newBesoekpunt, naam: e.target.value })}
                  placeholder="bv. Van der Merwe Gesin"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  value={newBesoekpunt.adres}
                  onChange={(e) => setNewBesoekpunt({ ...newBesoekpunt, adres: e.target.value })}
                  placeholder="bv. Kerkstraat 123, Pretoria"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing</label>
                <textarea
                  value={newBesoekpunt.beskrywing}
                  onChange={(e) => setNewBesoekpunt({ ...newBesoekpunt, beskrywing: e.target.value })}
                  placeholder="Opsionele notas..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#7A8450] focus:ring-2 focus:ring-[#7A8450]/20 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowNewBesoekpunt(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Kanselleer
              </button>
              <button
                onClick={handleCreateBesoekpunt}
                disabled={isCreatingBesoekpunt || !newBesoekpunt.naam.trim() || !newBesoekpuntWykId}
                className="flex-1 py-2 px-4 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7445] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingBesoekpunt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Besig...
                  </>
                ) : (
                  'Skep Besoekpunt'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[700px] flex flex-col">
      {content}
    </div>
  );
};

export default BesoekpuntToewysing;
