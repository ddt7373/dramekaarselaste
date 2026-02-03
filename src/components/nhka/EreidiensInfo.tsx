import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { EreidiensInfo as EreidiensInfoType, Dagstukkie, isAdmin } from '@/types/nhka';
import { 
  Church, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  Save, 
  Send, 
  ChevronRight,
  Loader2,
  Copy,
  Check,
  X,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp SVG Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EreidiensInfo: React.FC = () => {
  const { currentUser, currentGemeente } = useNHKA();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [eredienste, setEredienste] = useState<EreidiensInfoType[]>([]);
  const [selectedErediens, setSelectedErediens] = useState<EreidiensInfoType | null>(null);
  const [dagstukkies, setDagstukkies] = useState<Dagstukkie[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Wysig state
  const [editingDagstukkie, setEditingDagstukkie] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    titel: string;
    inhoud: string;
    skrifverwysing: string;
  }>({ titel: '', inhoud: '', skrifverwysing: '' });
  const [savingDagstukkie, setSavingDagstukkie] = useState(false);
  
  const [formData, setFormData] = useState({
    sondag_datum: getNextSunday(),
    tema: '',
    skriflesing: '',
    preek_opsomming: ''
  });

  const canEdit = currentUser && ['predikant', 'admin', 'subadmin', 'hoof_admin'].includes(currentUser.rol);
  const canViewDagstukkies = currentUser && ['predikant', 'admin', 'subadmin', 'hoof_admin', 'kerkraad', 'groepleier', 'ouderling', 'diaken'].includes(currentUser.rol);

  function getNextSunday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchEredienste();
  }, [currentGemeente]);

  const fetchEredienste = async () => {
    if (!currentGemeente) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('erediens_info')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .order('sondag_datum', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEredienste(data || []);

      // Load the most recent one if exists
      if (data && data.length > 0) {
        await loadErediens(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching eredienste:', error);
      toast.error('Kon nie eredienste laai nie');
    } finally {
      setLoading(false);
    }
  };

  const loadErediens = async (erediens: EreidiensInfoType) => {
    setSelectedErediens(erediens);
    setFormData({
      sondag_datum: erediens.sondag_datum,
      tema: erediens.tema || '',
      skriflesing: erediens.skriflesing || '',
      preek_opsomming: erediens.preek_opsomming || ''
    });

    // Load dagstukkies for this erediens
    const { data: dagData, error } = await supabase
      .from('dagstukkies')
      .select('*')
      .eq('erediens_id', erediens.id)
      .order('created_at');

    if (!error && dagData) {
      setDagstukkies(dagData);
    }
  };

  const handleSave = async () => {
    if (!currentGemeente || !currentUser) return;

    try {
      setSaving(true);

      if (selectedErediens) {
        // Update existing
        const { error } = await supabase
          .from('erediens_info')
          .update({
            tema: formData.tema,
            skriflesing: formData.skriflesing,
            preek_opsomming: formData.preek_opsomming,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedErediens.id);

        if (error) throw error;
        toast.success('Erediens inligting opgedateer');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('erediens_info')
          .insert([{
            gemeente_id: currentGemeente.id,
            sondag_datum: formData.sondag_datum,
            tema: formData.tema,
            skriflesing: formData.skriflesing,
            preek_opsomming: formData.preek_opsomming,
            created_by: currentUser.id
          }])
          .select()
          .single();

        if (error) throw error;
        setSelectedErediens(data);
        toast.success('Erediens inligting gestoor');
      }

      await fetchEredienste();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Kon nie stoor nie: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDagstukkies = async () => {
    if (!formData.preek_opsomming) {
      toast.error('Voeg eers \'n preekopsomming by');
      return;
    }

    if (!selectedErediens) {
      toast.error('Stoor eers die erediens inligting');
      return;
    }

    try {
      setGenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-dagstukkies', {
        body: {
          preek_opsomming: formData.preek_opsomming,
          tema: formData.tema,
          skriflesing: formData.skriflesing
        }
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('fetch failed') || error.message?.includes('Failed to fetch')) {
          throw new Error('Kon nie met die AI-diens verbind nie. Probeer asb later weer of kontak die administrateur.');
        }
        throw error;
      }

      if (data?.success && data?.dagstukkies) {
        // Delete existing dagstukkies for this erediens
        await supabase
          .from('dagstukkies')
          .delete()
          .eq('erediens_id', selectedErediens.id);

        // Insert new dagstukkies
        const newDagstukkies = data.dagstukkies.map((d: any) => ({
          erediens_id: selectedErediens.id,
          dag: d.dag,
          titel: d.titel,
          inhoud: d.inhoud,
          skrifverwysing: d.skrifverwysing
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('dagstukkies')
          .insert(newDagstukkies)
          .select();

        if (insertError) throw insertError;

        setDagstukkies(insertedData || []);
        toast.success('Dagstukkies suksesvol gegenereer!');
      } else {
        // Check for specific error messages from the edge function
        const errorMessage = data?.error || 'Kon nie dagstukkies genereer nie';
        if (errorMessage.includes('AI generation error') || errorMessage.includes('fetch failed')) {
          throw new Error('Die AI-diens is tans nie beskikbaar nie. Probeer asb later weer.');
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error generating dagstukkies:', error);
      // Show user-friendly error message
      const errorMsg = error.message || 'Onbekende fout';
      if (errorMsg.includes('AI') || errorMsg.includes('fetch') || errorMsg.includes('verbind')) {
        toast.error('Die AI-diens is tans nie beskikbaar nie. Probeer asb later weer of voeg dagstukkies handmatig by.');
      } else {
        toast.error('Fout: ' + errorMsg);
      }
    } finally {
      setGenerating(false);
    }
  };


  // Begin wysig van 'n dagstukkie
  const startEditDagstukkie = (dagstukkie: Dagstukkie) => {
    setEditingDagstukkie(dagstukkie.id);
    setEditForm({
      titel: dagstukkie.titel,
      inhoud: dagstukkie.inhoud,
      skrifverwysing: dagstukkie.skrifverwysing || ''
    });
  };

  // Kanselleer wysig
  const cancelEditDagstukkie = () => {
    setEditingDagstukkie(null);
    setEditForm({ titel: '', inhoud: '', skrifverwysing: '' });
  };

  // Stoor gewysigde dagstukkie
  const saveDagstukkie = async (dagstukkie: Dagstukkie) => {
    if (!editForm.titel.trim() || !editForm.inhoud.trim()) {
      toast.error('Titel en inhoud is verpligtend');
      return;
    }

    try {
      setSavingDagstukkie(true);

      const { error } = await supabase
        .from('dagstukkies')
        .update({
          titel: editForm.titel.trim(),
          inhoud: editForm.inhoud.trim(),
          skrifverwysing: editForm.skrifverwysing.trim()
        })
        .eq('id', dagstukkie.id);

      if (error) throw error;

      // Update local state
      setDagstukkies(prev => prev.map(d => 
        d.id === dagstukkie.id 
          ? { ...d, titel: editForm.titel.trim(), inhoud: editForm.inhoud.trim(), skrifverwysing: editForm.skrifverwysing.trim() }
          : d
      ));

      setEditingDagstukkie(null);
      setEditForm({ titel: '', inhoud: '', skrifverwysing: '' });
      toast.success('Dagstukkie opgedateer');
    } catch (error: any) {
      console.error('Error saving dagstukkie:', error);
      toast.error('Kon nie stoor nie: ' + error.message);
    } finally {
      setSavingDagstukkie(false);
    }
  };

  const copyDagstukkie = (dagstukkie: Dagstukkie) => {
    const text = `*${dagstukkie.dag}: ${dagstukkie.titel}*\n\n${dagstukkie.inhoud}\n\n📖 ${dagstukkie.skrifverwysing}`;
    navigator.clipboard.writeText(text);
    setCopiedId(dagstukkie.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Gekopieer na knipbord');
  };

  const shareDagstukkie = (dagstukkie: Dagstukkie) => {
    const text = `*${dagstukkie.dag}: ${dagstukkie.titel}*\n\n${dagstukkie.inhoud}\n\n📖 ${dagstukkie.skrifverwysing}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const createNewErediens = () => {
    setSelectedErediens(null);
    setDagstukkies([]);
    setFormData({
      sondag_datum: getNextSunday(),
      tema: '',
      skriflesing: '',
      preek_opsomming: ''
    });
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#002855]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855]">Erediens Inligting</h1>
          <p className="text-gray-500">Bestuur Sondag se erediens en genereer dagstukkies</p>
        </div>
        {canEdit && (
          <button
            onClick={createNewErediens}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Nuwe Sondag
          </button>
        )}
      </div>

      {/* Previous Services */}
      {eredienste.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-[#002855] mb-3">Vorige Eredienste</h3>
          <div className="flex flex-wrap gap-2">
            {eredienste.map(e => (
              <button
                key={e.id}
                onClick={() => loadErediens(e)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedErediens?.id === e.id
                    ? 'bg-[#002855] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {new Date(e.sondag_datum).toLocaleDateString('af-ZA', { day: 'numeric', month: 'short' })}
                {e.tema && ` - ${e.tema.substring(0, 20)}${e.tema.length > 20 ? '...' : ''}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Church className="w-5 h-5 text-[#D4A84B]" />
              <h2 className="font-bold text-[#002855]">Sondag se Erediens</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sondag Datum</label>
                <input
                  type="date"
                  value={formData.sondag_datum}
                  onChange={(e) => setFormData({ ...formData, sondag_datum: e.target.value })}
                  disabled={!canEdit || !!selectedErediens}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                <input
                  type="text"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  disabled={!canEdit}
                  placeholder="bv. God se Genade"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skriflesing</label>
                <input
                  type="text"
                  value={formData.skriflesing}
                  onChange={(e) => setFormData({ ...formData, skriflesing: e.target.value })}
                  disabled={!canEdit}
                  placeholder="bv. Johannes 3:16-21"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preekopsomming</label>
                <textarea
                  value={formData.preek_opsomming}
                  onChange={(e) => setFormData({ ...formData, preek_opsomming: e.target.value })}
                  disabled={!canEdit}
                  rows={8}
                  placeholder="Tik of plak die preekopsomming hier..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none resize-none disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.preek_opsomming.length} karakters</p>
              </div>

              {canEdit && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#002855] text-white font-semibold hover:bg-[#001d40] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Stoor
                  </button>
                  <button
                    onClick={handleGenerateDagstukkies}
                    disabled={generating || !formData.preek_opsomming || !selectedErediens}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#8B7CB3] text-white font-semibold hover:bg-[#7a6ba0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Genereer Dagstukkies
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dagstukkies Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#8B7CB3]" />
              <h2 className="font-bold text-[#002855]">Dagstukkies vir die Week</h2>
            </div>

            {dagstukkies.length > 0 ? (
              <div className="space-y-4">
                {dagstukkies.map((dag) => (
                  <div key={dag.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {editingDagstukkie === dag.id ? (
                      // Wysig modus
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-block px-2 py-0.5 bg-[#002855] text-white text-xs font-medium rounded-full">
                            {dag.dag}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={cancelEditDagstukkie}
                              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                              title="Kanselleer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Titel</label>
                          <input
                            type="text"
                            value={editForm.titel}
                            onChange={(e) => setEditForm({ ...editForm, titel: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none text-sm"
                            placeholder="Titel van die dagstukkie"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Inhoud</label>
                          <textarea
                            value={editForm.inhoud}
                            onChange={(e) => setEditForm({ ...editForm, inhoud: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none text-sm resize-none"
                            placeholder="Die inhoud van die dagstukkie..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Skrifverwysing</label>
                          <input
                            type="text"
                            value={editForm.skrifverwysing}
                            onChange={(e) => setEditForm({ ...editForm, skrifverwysing: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none text-sm"
                            placeholder="bv. Johannes 3:16"
                          />
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => saveDagstukkie(dag)}
                            disabled={savingDagstukkie}
                            className="flex-1 py-2 px-3 rounded-lg bg-[#002855] text-white text-sm font-medium hover:bg-[#001d40] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {savingDagstukkie ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Stoor Wysigings
                          </button>
                          <button
                            onClick={cancelEditDagstukkie}
                            className="py-2 px-3 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                            Kanselleer
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Vertoon modus
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-[#002855] text-white text-xs font-medium rounded-full mb-1">
                              {dag.dag}
                            </span>
                            <h4 className="font-semibold text-[#002855]">{dag.titel}</h4>
                          </div>
                          <div className="flex gap-1">
                            {canEdit && (
                              <button
                                onClick={() => startEditDagstukkie(dag)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Wysig"
                              >
                                <Pencil className="w-4 h-4 text-[#D4A84B]" />
                              </button>
                            )}
                            {canViewDagstukkies && (
                              <>
                                <button
                                  onClick={() => copyDagstukkie(dag)}
                                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                  title="Kopieer"
                                >
                                  {copiedId === dag.id ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                                <button
                                  onClick={() => shareDagstukkie(dag)}
                                  className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                                  title="Deel via WhatsApp"
                                >
                                  <WhatsAppIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{dag.inhoud}</p>
                        {dag.skrifverwysing && (
                          <p className="text-xs text-[#8B7CB3] font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {dag.skrifverwysing}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {canViewDagstukkies && (
                  <div className="bg-[#D4A84B]/10 rounded-xl p-4 border border-[#D4A84B]/20">
                    <p className="text-sm text-[#002855] font-medium mb-2">
                      Deel hierdie dagstukkies met jou wyk of groep!
                    </p>
                    <p className="text-xs text-gray-600">
                      Klik op die WhatsApp ikoon by elke dagstukkie om dit direk te deel.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-2">Geen dagstukkies beskikbaar nie</p>
                {canEdit && (
                  <p className="text-sm text-gray-400">
                    Voeg 'n preekopsomming by en klik "Genereer Dagstukkies"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EreidiensInfo;
