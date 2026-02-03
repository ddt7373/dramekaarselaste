import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, CheckCircle2, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface GeloofsonderrigBetalingAdminProps {
  currentGemeente: { id: string } | null;
  gebruikers: { id: string; naam?: string; van?: string }[];
  processGeloofsonderrigBetaling: (leerderId: string, opts?: { namens?: boolean }) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  merkGeloofsonderrigBetaal: (leerderIds: string[]) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => void;
}

export default function GeloofsonderrigBetalingAdmin({
  currentGemeente,
  gebruikers,
  processGeloofsonderrigBetaling,
  merkGeloofsonderrigBetaal,
  refreshData
}: GeloofsonderrigBetalingAdminProps) {
  const [leerdersNieBetaal, setLeerdersNieBetaal] = useState<{ id: string; naam: string; van: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [merking, setMerking] = useState(false);

  useEffect(() => {
    if (currentGemeente) fetchLeerdersNieBetaal();
  }, [currentGemeente]);

  const fetchLeerdersNieBetaal = async () => {
    if (!currentGemeente) return;
    setLoading(true);
    try {
      const { data: klasLeerders } = await supabase.from('geloofsonderrig_klas_leerders').select('leerder_id');
      const allLeerderIds = [...new Set((klasLeerders || []).map(k => k.leerder_id))];
      if (allLeerderIds.length === 0) {
        setLeerdersNieBetaal([]);
        setLoading(false);
        return;
      }
      const { data: gemeenteLeerders } = await supabase
        .from('gebruikers')
        .select('id, naam, van')
        .in('id', allLeerderIds)
        .eq('gemeente_id', currentGemeente.id);
      const leerderIds = (gemeenteLeerders || []).map(g => g.id);
      if (leerderIds.length === 0) {
        setLeerdersNieBetaal([]);
        setLoading(false);
        return;
      }
      const { data: betaalData } = await supabase
        .from('geloofsonderrig_betalings')
        .select('leerder_id')
        .in('leerder_id', leerderIds)
        .eq('status', 'betaal');
      const betaalIds = new Set((betaalData || []).map(b => b.leerder_id));
      const nieBetaalIds = leerderIds.filter(id => !betaalIds.has(id));
      const nieBetaalGebruikers = (gemeenteLeerders || []).filter(g => nieBetaalIds.includes(g.id));
      setLeerdersNieBetaal(nieBetaalGebruikers.map(g => ({
        id: g.id,
        naam: g.naam || '',
        van: g.van || ''
      })));
    } catch (e) {
      console.error('Geloofsonderrig leerders:', e);
      setLeerdersNieBetaal([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBetaalYoco = async (leerderId: string) => {
    const result = await processGeloofsonderrigBetaling(leerderId, { namens: true });
    if (result?.success && result?.redirectUrl) window.location.href = result.redirectUrl;
    else if (result?.error) toast.error(result.error);
  };

  const handleMerkAsBetaal = async () => {
    if (selectedIds.length === 0) {
      toast.error('Kies ten minste een leerder');
      return;
    }
    setMerking(true);
    const result = await merkGeloofsonderrigBetaal(selectedIds);
    setMerking(false);
    if (result?.success) {
      toast.success(`${selectedIds.length} leerder(s) as betaal gemerk`);
      setSelectedIds([]);
      fetchLeerdersNieBetaal();
      refreshData();
    } else toast.error(result?.error || 'Kon nie merk nie');
  };

  if (!currentGemeente) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <GraduationCap className="w-5 h-5 text-amber-600" />
        <div>
          <h3 className="font-bold text-[#002855]">KI-Kats Geloofsonderrig Betalings</h3>
          <p className="text-sm text-gray-500">Betaal R100 namens leerders of merk as betaal (EFT/kontant)</p>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : leerdersNieBetaal.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">Geen leerders wat nog moet betaal nie.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={handleMerkAsBetaal} disabled={selectedIds.length === 0 || merking}>
                {merking ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                Merk {selectedIds.length > 0 ? selectedIds.length : ''} as betaal
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 w-10"><Checkbox checked={selectedIds.length === leerdersNieBetaal.length} onCheckedChange={(c) => setSelectedIds(c ? leerdersNieBetaal.map(l => l.id) : [])} /></th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Leerder</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Aksie</th>
                  </tr>
                </thead>
                <tbody>
                  {leerdersNieBetaal.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2"><Checkbox checked={selectedIds.includes(l.id)} onCheckedChange={(c) => setSelectedIds(prev => c ? [...prev, l.id] : prev.filter(id => id !== l.id))} /></td>
                      <td className="px-3 py-2 font-medium">{l.naam} {l.van}</td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" onClick={() => handleBetaalYoco(l.id)}>
                          <CreditCard className="w-4 h-4 mr-1" />Betaal R100 via Yoco
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
