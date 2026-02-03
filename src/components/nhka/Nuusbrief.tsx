import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Nuusbrief as NuusbriefType, isAdmin } from '@/types/nhka';
import { 
  Newspaper, 
  Plus, 
  Send, 
  Clock, 
  Users,
  Loader2,
  X,
  Eye,
  Trash2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp SVG Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Nuusbrief: React.FC = () => {
  const { currentUser, currentGemeente, gebruikers, sendSMS } = useNHKA();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [nuusbriewe, setNuusbriewe] = useState<NuusbriefType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState<NuusbriefType | null>(null);
  
  const [formData, setFormData] = useState({
    titel: '',
    inhoud: ''
  });

  const canEdit = currentUser && isAdmin(currentUser.rol);

  useEffect(() => {
    fetchNuusbriewe();
  }, [currentGemeente]);

  const fetchNuusbriewe = async () => {
    if (!currentGemeente) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nuusbriewe')
        .select('*')
        .eq('gemeente_id', currentGemeente.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNuusbriewe(data || []);
    } catch (error: any) {
      console.error('Error fetching nuusbriewe:', error);
      toast.error('Kon nie nuusbriewe laai nie');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentGemeente || !currentUser) return;
    if (!formData.titel || !formData.inhoud) {
      toast.error('Titel en inhoud is verpligtend');
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('nuusbriewe')
        .insert([{
          gemeente_id: currentGemeente.id,
          titel: formData.titel,
          inhoud: formData.inhoud,
          created_by: currentUser.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Nuusbrief gestoor');
      setFormData({ titel: '', inhoud: '' });
      setShowForm(false);
      await fetchNuusbriewe();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Kon nie stoor nie: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendSMS = async (nuusbrief: NuusbriefType) => {
    const membersWithPhone = gebruikers.filter(g => g.selfoon && g.aktief);
    
    if (membersWithPhone.length === 0) {
      toast.error('Geen lidmate met selfoonnommers nie');
      return;
    }

    if (!confirm(`Stuur nuusbrief aan ${membersWithPhone.length} lidmate via SMS?`)) {
      return;
    }

    try {
      setSending(true);
      const phones = membersWithPhone.map(m => m.selfoon!);
      const message = `[${currentGemeente?.naam} Nuusbrief]\n\n${nuusbrief.titel}\n\n${nuusbrief.inhoud.substring(0, 300)}${nuusbrief.inhoud.length > 300 ? '...' : ''}`;
      
      const result = await sendSMS(phones, message, 'algemeen');
      
      if (result.success) {
        // Update nuusbrief record
        await supabase
          .from('nuusbriewe')
          .update({ 
            gestuur_op: new Date().toISOString(),
            ontvangers_aantal: membersWithPhone.length
          })
          .eq('id', nuusbrief.id);

        toast.success(`Nuusbrief gestuur aan ${membersWithPhone.length} lidmate`);
        await fetchNuusbriewe();
      } else {
        toast.error('Kon nie SMS stuur nie');
      }
    } catch (error: any) {
      console.error('Error sending:', error);
      toast.error('Fout: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleShareWhatsApp = (nuusbrief: NuusbriefType) => {
    const text = `*${currentGemeente?.naam} Nuusbrief*\n\n*${nuusbrief.titel}*\n\n${nuusbrief.inhoud}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Is jy seker jy wil hierdie nuusbrief verwyder?')) return;

    try {
      const { error } = await supabase
        .from('nuusbriewe')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Nuusbrief verwyder');
      await fetchNuusbriewe();
    } catch (error: any) {
      toast.error('Kon nie verwyder nie');
    }
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
          <h1 className="text-2xl font-bold text-[#002855]">Gemeente Nuusbrief</h1>
          <p className="text-gray-500">Skep en stuur nuusbriewe aan lidmate</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuwe Nuusbrief
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#002855]/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-[#002855]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#002855]">{nuusbriewe.length}</p>
              <p className="text-xs text-gray-500">Totale Nuusbriewe</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7A8450]/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-[#7A8450]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7A8450]">{nuusbriewe.filter(n => n.gestuur_op).length}</p>
              <p className="text-xs text-gray-500">Gestuur</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#8B7CB3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#8B7CB3]">{gebruikers.filter(g => g.selfoon).length}</p>
              <p className="text-xs text-gray-500">Ontvangers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletters List */}
      <div className="space-y-4">
        {nuusbriewe.length > 0 ? (
          nuusbriewe.map(nuusbrief => (
            <div key={nuusbrief.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-gray-900">{nuusbrief.titel}</h3>
                    {nuusbrief.gestuur_op ? (
                      <span className="px-2 py-0.5 bg-[#7A8450]/10 text-[#7A8450] text-xs font-medium rounded-full">
                        Gestuur aan {nuusbrief.ontvangers_aantal} lidmate
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Konsep
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{nuusbrief.inhoud}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(nuusbrief.created_at).toLocaleDateString('af-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {nuusbrief.gestuur_op && (
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        Gestuur: {new Date(nuusbrief.gestuur_op).toLocaleDateString('af-ZA')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(nuusbrief)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Voorskou"
                  >
                    <Eye className="w-5 h-5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp(nuusbrief)}
                    className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                    title="Deel via WhatsApp"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                  </button>
                  {canEdit && !nuusbrief.gestuur_op && (
                    <>
                      <button
                        onClick={() => handleSendSMS(nuusbrief)}
                        disabled={sending}
                        className="p-2 rounded-lg bg-[#002855] text-white hover:bg-[#001d40] transition-colors disabled:opacity-50"
                        title="Stuur via SMS"
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(nuusbrief.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Verwyder"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen nuusbriewe nie</h3>
            <p className="text-gray-500 mb-4">Begin deur 'n nuwe nuusbrief te skep</p>
          </div>
        )}
      </div>

      {/* New Newsletter Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Nuwe Nuusbrief</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={formData.titel}
                  onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                  placeholder="bv. Desember Nuusbrief"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inhoud *</label>
                <textarea
                  value={formData.inhoud}
                  onChange={(e) => setFormData({ ...formData, inhoud: e.target.value })}
                  rows={12}
                  placeholder="Skryf jou nuusbrief hier..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.inhoud.length} karakters</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Kanselleer
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.titel || !formData.inhoud}
                className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Stoor Nuusbrief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#002855]">Voorskou</h2>
              <button onClick={() => setShowPreview(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-[#002855]/5 rounded-xl p-6 border border-[#002855]/10">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-[#002855]">{currentGemeente?.naam}</h1>
                  <p className="text-sm text-gray-500">Nuusbrief</p>
                </div>
                <h2 className="text-lg font-bold text-[#002855] mb-4">{showPreview.titel}</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{showPreview.inhoud}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowPreview(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Sluit
              </button>
              <button
                onClick={() => {
                  handleShareWhatsApp(showPreview);
                  setShowPreview(null);
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20bd5a] flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Deel via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nuusbrief;
