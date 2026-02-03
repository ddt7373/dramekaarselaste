import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Share2,
  ExternalLink,
  Package,
  Image as ImageIcon,
  Check,
  X,
  Copy,
  MessageCircle,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Upload,
  Loader2,
  Percent,
  CreditCard,
  Building2,
  RefreshCw,
  AlertTriangle,
  Ticket,
  Hash
} from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class KuberkermisErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Kuberkermis Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-red-800 mb-2">Iets het verkeerd gegaan</h2>
              <p className="text-red-600 mb-4 text-sm">
                {this.state.error?.message || 'Onbekende fout'}
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Herlaai Bladsy
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Types
type KuberkermisKategorie = 'kos' | 'gebak' | 'handwerk' | 'kaartjies' | 'dienste' | 'algemeen';

interface KuberkermisProdukt {
  id: string;
  gemeente_id: string;
  titel: string;
  beskrywing?: string;
  prys: number;
  kategorie: KuberkermisKategorie;
  foto_url?: string;
  voorraad: number;
  aktief: boolean;
  is_kaartjie: boolean;
  geskep_deur?: string;
  created_at: string;
  updated_at: string;
}

interface KuberkermisKaartjieNommer {
  id: string;
  produk_id: string;
  nommer: string;
  bestelling_id?: string;
  bestelling?: KuberkermisBestelling;
  is_verkoop: boolean;
  created_at: string;
  updated_at: string;
}

interface KuberkermisBestelling {
  id: string;
  gemeente_id: string;
  produk_id: string;
  produk?: KuberkermisProdukt;
  koper_naam: string;
  koper_selfoon: string;
  koper_epos?: string;
  hoeveelheid: number;
  totaal_bedrag: number;
  betaal_status: 'hangende' | 'betaal' | 'gekanselleer';
  yoco_checkout_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  kaartjies?: KuberkermisKaartjieNommer[];
}

const getKategorieLabel = (kategorie: string | undefined | null): string => {
  if (!kategorie) return 'Algemeen';
  const labels: Record<string, string> = {
    kos: 'Kos & Lekkernye',
    gebak: 'Gebak & Koeke',
    handwerk: 'Handwerk',
    kaartjies: 'Kaartjies & Toegang',
    dienste: 'Dienste',
    algemeen: 'Algemeen'
  };
  return labels[kategorie] || 'Algemeen';
};

// Helper function to safely format price - handles string or number
const formatPrice = (value: any): string => {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};



const kategorieOptions = [
  { value: 'kos', label: 'Kos & Lekkernye' },
  { value: 'gebak', label: 'Gebak & Koeke' },
  { value: 'handwerk', label: 'Handwerk' },
  { value: 'kaartjies', label: 'Kaartjies & Toegang' },
  { value: 'dienste', label: 'Dienste' },
  { value: 'algemeen', label: 'Algemeen' }
];

// Main Component
const KuberkermisContent: React.FC = () => {
  const { currentUser, currentGemeente, gemeentes } = useNHKA();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Try to get gemeente from user's gemeente_id if currentGemeente is null
  // This is a fallback for cases where the context might not have the gemeente set
  const effectiveGemeente = currentGemeente || (currentUser?.gemeente_id
    ? gemeentes.find(g => g.id === currentUser.gemeente_id)
    : null);

  // Debug logging
  useEffect(() => {
    console.log('Kuberkermis Debug:');
    console.log('- currentUser:', currentUser?.naam, currentUser?.van, 'rol:', currentUser?.rol);
    console.log('- currentUser.gemeente_id:', currentUser?.gemeente_id);
    console.log('- currentGemeente:', currentGemeente?.naam, currentGemeente?.id);
    console.log('- effectiveGemeente:', effectiveGemeente?.naam, effectiveGemeente?.id);
    console.log('- gemeentes count:', gemeentes.length);
  }, [currentUser, currentGemeente, effectiveGemeente, gemeentes]);

  // Core state
  const [produkte, setProdukte] = useState<KuberkermisProdukt[]>([]);
  const [bestellings, setBestellings] = useState<KuberkermisBestelling[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // UI state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedProdukt, setSelectedProdukt] = useState<KuberkermisProdukt | null>(null);
  const [editingProdukt, setEditingProdukt] = useState<KuberkermisProdukt | null>(null);
  const [activeTab, setActiveTab] = useState('produkte');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ticket management state
  const [ticketNommers, setTicketNommers] = useState<KuberkermisKaartjieNommer[]>([]);
  const [newTicketNommer, setNewTicketNommer] = useState('');
  const [bulkTicketNommers, setBulkTicketNommers] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [savingTickets, setSavingTickets] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titel: '',
    beskrywing: '',
    prys: '',
    kategorie: 'algemeen' as KuberkermisKategorie,
    foto_url: '',
    voorraad: '-1',
    is_kaartjie: false
  });

  // Check if user can manage products
  const canManage = currentUser && ['hoof_admin', 'subadmin', 'admin', 'predikant'].includes(currentUser.rol);

  // Load tickets for a product
  const loadTickets = async (produkId: string) => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('kuberkermis_kaartjie_nommers')
        .select('*, bestelling:kuberkermis_bestellings!bestelling_id(koper_naam, koper_selfoon)')
        .eq('produk_id', produkId)
        .order('nommer', { ascending: true });
      if (error) throw error;
      console.log(`Kuberkermis: Loaded ${data?.length} tickets for product ${produkId}:`, data);
      setTicketNommers(data || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      toast({ title: 'Fout', description: 'Kon nie kaartjie nommers laai nie', variant: 'destructive' });
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleAddTicket = async () => {
    if (!selectedProdukt || !newTicketNommer.trim()) return;
    setSavingTickets(true);
    try {
      const { error } = await supabase
        .from('kuberkermis_kaartjie_nommers')
        .insert([{
          produk_id: selectedProdukt.id,
          nommer: newTicketNommer.trim(),
          is_verkoop: false
        }]);
      if (error) throw error;
      setNewTicketNommer('');
      await loadTickets(selectedProdukt.id);
      toast({ title: 'Sukses', description: 'Kaartjie bygevoeg' });
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message || 'Kon nie kaartjie byvoeg nie', variant: 'destructive' });
    } finally {
      setSavingTickets(false);
    }
  };

  const handleBulkAddTickets = async () => {
    if (!selectedProdukt || !bulkTicketNommers.trim()) return;
    const nommers = bulkTicketNommers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
    if (nommers.length === 0) return;

    setSavingTickets(true);
    try {
      const inserts = nommers.map(n => ({
        produk_id: selectedProdukt.id,
        nommer: n,
        is_verkoop: false
      }));
      const { error } = await supabase
        .from('kuberkermis_kaartjie_nommers')
        .insert(inserts);
      if (error) throw error;
      setBulkTicketNommers('');
      await loadTickets(selectedProdukt.id);
      toast({ title: 'Sukses', description: `${nommers.length} kaartjies bygevoeg` });
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message || 'Kon nie kaartjies byvoeg nie', variant: 'destructive' });
    } finally {
      setSavingTickets(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Is jy seker jy wil hierdie kaartjie verwyder?')) return;
    try {
      const { error } = await supabase
        .from('kuberkermis_kaartjie_nommers')
        .delete()
        .eq('id', ticketId);
      if (error) throw error;
      setTicketNommers(prev => prev.filter(t => t.id !== ticketId));
      toast({ title: 'Sukses', description: 'Kaartjie verwyder' });
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message || 'Kon nie kaartjie verwyder nie', variant: 'destructive' });
    }
  };

  // Load data - use effectiveGemeente instead of currentGemeente
  const loadData = async () => {
    const gemeenteToUse = effectiveGemeente;

    if (!gemeenteToUse?.id) {
      console.log('Kuberkermis: No gemeente available, skipping data load');
      setDataLoaded(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Kuberkermis: Fetching data for gemeente:', gemeenteToUse.id, gemeenteToUse.naam);

      const { data: produkteData, error: produkteError } = await supabase
        .from('kuberkermis_produkte')
        .select('*')
        .eq('gemeente_id', gemeenteToUse.id)
        .order('created_at', { ascending: false });

      console.log('Kuberkermis: Response:', { produkteData, produkteError });

      if (produkteError) {
        console.error('Kuberkermis produkte error:', produkteError);
        if (produkteError.code === '42P01' ||
          (produkteError.message && produkteError.message.includes('does not exist'))) {
          setError('Die kuberkermis tabel bestaan nog nie. Kontak die administrateur.');
        } else {
          setError(`Kon nie produkte laai nie: ${produkteError.message || 'Onbekende fout'}`);
        }
        setProdukte([]);
      } else {
        setProdukte(produkteData || []);
      }

      // Load bestellings if user can manage
      if (canManage) {
        try {
          const { data: bestellingsData, error: bError } = await supabase
            .from('kuberkermis_bestellings')
            .select('*, produk:kuberkermis_produkte(*), kaartjies:kuberkermis_kaartjie_nommers!bestelling_id(*)')
            .eq('gemeente_id', gemeenteToUse.id)
            .order('created_at', { ascending: false });

          if (bError) throw bError;
          console.log(`Kuberkermis: Loaded ${bestellingsData?.length} bestellings:`, bestellingsData);

          // Debug check for kaartjies join
          if (bestellingsData && bestellingsData.length > 0) {
            const withTickets = bestellingsData.filter(b => b.kaartjies && b.kaartjies.length > 0);
            console.log(`Kuberkermis: Bestellings with joined tickets: ${withTickets.length}`);
            if (withTickets.length > 0) {
              console.log('Kuberkermis: Example tickets for first order:', withTickets[0].kaartjies);
            }
          }

          if (bestellingsData) {
            setBestellings(bestellingsData);
          }
        } catch (err) {
          console.error('Error loading bestellings:', err);
        }
      }
    } catch (err: any) {
      console.error('Kuberkermis loadData error:', err);
      setError('Kon nie data laai nie. Probeer asseblief weer.');
      setProdukte([]);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    if (effectiveGemeente?.id) {
      loadData();
    } else {
      setDataLoaded(true);
    }
  }, [effectiveGemeente?.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Fout', description: 'Slegs beelde word toegelaat', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fout', description: 'Beeld moet kleiner as 5MB wees', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${effectiveGemeente?.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('kuberkermis-fotos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('kuberkermis-fotos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, foto_url: urlData.publicUrl }));
      toast({ title: 'Sukses', description: 'Foto opgelaai' });
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      toast({ title: 'Fout', description: err.message || 'Kon nie foto oplaai nie.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!effectiveGemeente || !currentUser) {
      toast({ title: 'Fout', description: 'Geen gemeente of gebruiker gevind nie', variant: 'destructive' });
      return;
    }

    if (!formData.titel.trim()) {
      toast({ title: 'Fout', description: 'Titel is verpligtend', variant: 'destructive' });
      return;
    }

    const prysNum = parseFloat(formData.prys);
    if (!formData.prys || isNaN(prysNum) || prysNum <= 0) {
      toast({ title: 'Fout', description: 'Geldige prys is verpligtend', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const produktData = {
        gemeente_id: effectiveGemeente.id,
        titel: formData.titel.trim(),
        beskrywing: formData.beskrywing.trim() || null,
        prys: prysNum,
        kategorie: formData.kategorie,
        foto_url: formData.foto_url || null,
        voorraad: parseInt(formData.voorraad) || -1,
        aktief: true,
        is_kaartjie: formData.is_kaartjie,
        geskep_deur: currentUser.id
      };

      if (editingProdukt) {
        const { error } = await supabase
          .from('kuberkermis_produkte')
          .update(produktData)
          .eq('id', editingProdukt.id);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Produk opgedateer' });
      } else {
        const { error } = await supabase
          .from('kuberkermis_produkte')
          .insert([produktData]);
        if (error) throw error;
        toast({ title: 'Sukses', description: 'Produk bygevoeg' });
      }

      setShowAddDialog(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Error saving produk:', err);
      toast({ title: 'Fout', description: err.message || 'Kon nie produk stoor nie', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (produk: KuberkermisProdukt) => {
    if (!confirm('Is jy seker jy wil hierdie produk verwyder?')) return;

    try {
      const { error } = await supabase
        .from('kuberkermis_produkte')
        .delete()
        .eq('id', produk.id);
      if (error) throw error;
      toast({ title: 'Sukses', description: 'Produk verwyder' });
      loadData();
    } catch (err: any) {
      console.error('Error deleting produk:', err);
      toast({ title: 'Fout', description: err.message || 'Kon nie produk verwyder nie', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (produk: KuberkermisProdukt) => {
    try {
      const { error } = await supabase
        .from('kuberkermis_produkte')
        .update({ aktief: !produk.aktief })
        .eq('id', produk.id);
      if (error) throw error;
      toast({ title: 'Sukses', description: produk.aktief ? 'Produk gedeaktiveer' : 'Produk geaktiveer' });
      loadData();
    } catch (err) {
      console.error('Error toggling produk:', err);
    }
  };

  const resetForm = () => {
    setFormData({ titel: '', beskrywing: '', prys: '', kategorie: 'algemeen', foto_url: '', voorraad: '-1', is_kaartjie: false });
    setEditingProdukt(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditDialog = (produk: KuberkermisProdukt) => {
    setEditingProdukt(produk);
    setFormData({
      titel: produk.titel || '',
      beskrywing: produk.beskrywing || '',
      prys: String(produk.prys || 0),
      kategorie: produk.kategorie || 'algemeen',
      foto_url: produk.foto_url || '',
      voorraad: String(produk.voorraad ?? -1),
      is_kaartjie: produk.is_kaartjie || false
    });
    setShowAddDialog(true);
  };

  const getPublicLink = (produk: KuberkermisProdukt) => {
    return `${window.location.origin}/kermis/${effectiveGemeente?.id}?produk=${produk.id}`;
  };

  const getWhatsAppLink = (produk: KuberkermisProdukt) => {
    const link = getPublicLink(produk);
    const message = encodeURIComponent(
      `🛒 *${produk.titel || 'Produk'}*\n\n${produk.beskrywing || ''}\n\n💰 Prys: R${formatPrice(produk.prys)}\n\nKoop nou aanlyn:\n${link}`
    );
    return `https://wa.me/?text=${message}`;
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Gekopieer!', description: 'Skakel na knipbord gekopieer' });
  };

  // No gemeente available - show message with debug info
  if (!effectiveGemeente) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">Kies eers 'n gemeente om die kuberkermis te sien.</p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs text-gray-500">
              <p className="font-semibold mb-2">Debug Info:</p>
              <p>currentGemeente: {currentGemeente ? currentGemeente.naam : 'null'}</p>
              <p>currentUser: {currentUser ? `${currentUser.naam} ${currentUser.van}` : 'null'}</p>
              <p>currentUser.gemeente_id: {currentUser?.gemeente_id || 'null'}</p>
              <p>gemeentes loaded: {gemeentes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-[#D4A84B]" />
            Kuberkermis
          </h1>
          <p className="text-gray-600 mt-1">Verkoop produkte en dienste aanlyn vir {effectiveGemeente.naam}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Herlaai
          </Button>
          {canManage && (
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]">
              <Plus className="w-4 h-4 mr-2" />
              Nuwe Produk
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs mt-1">Die databasis tabel bestaan moontlik nog nie.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#002855]" />
          <span className="ml-3 text-gray-600">Laai produkte...</span>
        </div>
      )}

      {/* Content */}
      {dataLoaded && !loading && (
        <>
          {/* Info Cards */}
          <Card className="bg-gradient-to-r from-[#002855]/5 to-[#D4A84B]/5 border-[#D4A84B]/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#D4A84B] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Hoe werk die Kuberkermis?</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Laai produkte op met pryse en foto's</li>
                    <li>Deel die skakel via WhatsApp met potensiële kopers</li>
                    <li>Kopers kan aanlyn betaal sonder om 'n gebruiker te wees</li>
                    <li>Ontvang kennisgewings wanneer iemand 'n aankoop maak</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Percent className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-2">Platformkoste & Uitbetalings</p>
                  <div className="space-y-2 text-blue-800">
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p><strong>10% platformkoste</strong> word per transaksie gehef.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>Die oorblywende <strong>90%</strong> word binne <strong>3 werksdae</strong> oorbetaal.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products/Orders Tabs for Admins */}
          {canManage ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="produkte"><Package className="w-4 h-4 mr-2" />Produkte</TabsTrigger>
                <TabsTrigger value="bestellings"><ShoppingCart className="w-4 h-4 mr-2" />Verkope</TabsTrigger>
              </TabsList>

              <TabsContent value="produkte" className="mt-6">
                {produkte.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">Geen produkte nog nie</p>
                      <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]">
                        <Plus className="w-4 h-4 mr-2" />Voeg Eerste Produk By
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {produkte.map(produk => (
                      <Card key={produk.id} className={`overflow-hidden ${!produk.aktief ? 'opacity-60' : ''}`}>
                        <div className="h-40 bg-gray-100 relative">
                          {produk.foto_url ? (
                            <img src={produk.foto_url} alt={produk.titel || 'Produk'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002855]/10 to-[#D4A84B]/10">
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          {!produk.aktief && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge variant="secondary">Gedeaktiveer</Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#002855]">{produk.titel || 'Ongetiteld'}</h3>
                                {produk.is_kaartjie && <Ticket className="w-4 h-4 text-[#D4A84B]" />}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">{getKategorieLabel(produk.kategorie)}</Badge>
                            </div>
                            <span className="text-lg font-bold text-[#D4A84B]">R{formatPrice(produk.prys)}</span>
                          </div>

                          {produk.beskrywing && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{produk.beskrywing}</p>}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>Voorraad: {produk.voorraad === -1 ? 'Onbeperk' : produk.voorraad}</span>
                            {produk.is_kaartjie && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[#D4A84B] hover:text-[#c49a3f] p-0"
                                onClick={() => {
                                  setSelectedProdukt(produk);
                                  loadTickets(produk.id);
                                  setShowTicketDialog(true);
                                }}
                              >
                                <Hash className="w-3 h-3 mr-1" /> Bestuur Kaartjies
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedProdukt(produk); setShowShareDialog(true); }} className="flex-1">
                              <Share2 className="w-3 h-3 mr-1" />Deel
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(produk)}><Edit2 className="w-3 h-3" /></Button>
                            <Button size="sm" variant="outline" onClick={() => handleToggleActive(produk)}>{produk.aktief ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(produk)} className="text-red-600 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bestellings" className="mt-6">
                {bestellings.length === 0 ? (
                  <Card><CardContent className="p-8 text-center"><ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Geen bestellings nog nie</p></CardContent></Card>
                ) : (
                  <div className="space-y-4">
                    {bestellings.map(bestelling => (
                      <Card key={bestelling.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-[#002855]">
                                {bestelling.produk?.titel ||
                                  produkte.find(p => p.id === bestelling.produk_id)?.titel ||
                                  `Onbekende Produk (ID: ${bestelling.produk_id.substring(0, 8)})`}
                              </h3>
                              <p className="text-xs text-gray-400 font-mono mb-1">ID: {bestelling.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-600">Koper: {bestelling.koper_naam || 'Onbekend'}</p>
                              <p className="text-sm text-gray-600">Selfoon: {bestelling.koper_selfoon || 'Nie verskaf'}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-[#D4A84B]">R{formatPrice(bestelling.totaal_bedrag)}</span>
                              <div className="mt-1">

                                {bestelling.betaal_status === 'betaal' ? (
                                  <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Betaal</Badge>
                                ) : bestelling.betaal_status === 'gekanselleer' ? (
                                  <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Gekanselleer</Badge>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Display Ticket Numbers if any */}
                          {bestelling.kaartjies && bestelling.kaartjies.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <Ticket className="w-3 h-3" /> Toegewysde Kaartjies:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {bestelling.kaartjies.map(k => (
                                  <Badge key={k.id} variant="secondary" className="text-[10px] font-mono">
                                    {k.nommer}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // Regular user view
            <div>
              {produkte.filter(p => p.aktief).length === 0 ? (
                <Card><CardContent className="p-8 text-center"><Package className="w-12 h-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Geen produkte beskikbaar nie</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produkte.filter(p => p.aktief).map(produk => (
                    <Card key={produk.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-40 bg-gray-100">
                        {produk.foto_url ? (
                          <img src={produk.foto_url} alt={produk.titel || 'Produk'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002855]/10 to-[#D4A84B]/10">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-[#002855]">{produk.titel || 'Ongetiteld'}</h3>
                            <Badge variant="outline" className="text-xs mt-1">{getKategorieLabel(produk.kategorie)}</Badge>
                          </div>
                          <span className="text-lg font-bold text-[#D4A84B]">R{formatPrice(produk.prys)}</span>
                        </div>

                        {produk.beskrywing && <p className="text-sm text-gray-600 line-clamp-2">{produk.beskrywing}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProdukt ? 'Wysig Produk' : 'Nuwe Produk'}</DialogTitle>
            <DialogDescription>Voeg 'n produk by wat jy wil verkoop</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titel">Titel *</Label>
              <Input id="titel" value={formData.titel} onChange={(e) => setFormData(prev => ({ ...prev, titel: e.target.value }))} placeholder="bv. Koeksisters (6 pak)" />
            </div>
            <div>
              <Label htmlFor="beskrywing">Beskrywing</Label>
              <Textarea id="beskrywing" value={formData.beskrywing} onChange={(e) => setFormData(prev => ({ ...prev, beskrywing: e.target.value }))} placeholder="Beskryf jou produk..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prys">Prys (R) *</Label>
                <Input id="prys" type="number" step="0.01" min="0" value={formData.prys} onChange={(e) => setFormData(prev => ({ ...prev, prys: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="voorraad">Voorraad</Label>
                <Input id="voorraad" type="number" value={formData.voorraad} onChange={(e) => setFormData(prev => ({ ...prev, voorraad: e.target.value }))} placeholder="-1 = onbeperk" />
                <p className="text-xs text-gray-500 mt-1">-1 = onbeperk</p>
              </div>
            </div>
            <div>
              <Label htmlFor="kategorie">Kategorie</Label>
              <div className="flex gap-4 mt-2">
                <Select value={formData.kategorie} onValueChange={(value) => setFormData(prev => ({ ...prev, kategorie: value as KuberkermisKategorie }))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kategorieOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_kaartjie"
                    checked={formData.is_kaartjie}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_kaartjie: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#002855] focus:ring-[#002855]"
                  />
                  <Label htmlFor="is_kaartjie" className="cursor-pointer flex items-center gap-1">
                    <Ticket className="w-4 h-4" /> Kaartjie
                  </Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Foto (opsioneel)</Label>
              <div className="mt-2 space-y-3">
                {formData.foto_url && (
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={formData.foto_url} alt="Produk foto" className="w-full h-full object-cover" />
                    <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setFormData(prev => ({ ...prev, foto_url: '' }))}><X className="w-3 h-3" /></Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1">
                    {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Laai op...</> : <><Upload className="w-4 h-4 mr-2" />Laai Foto Op</>}
                  </Button>
                </div>
                <div className="text-center text-xs text-gray-500">of</div>
                <Input value={formData.foto_url} onChange={(e) => setFormData(prev => ({ ...prev, foto_url: e.target.value }))} placeholder="Plak foto URL hier..." />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>Kanselleer</Button>
            <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Stoor...</> : (editingProdukt ? 'Opdateer' : 'Voeg By')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-[#D4A84B]" />Deel Produk</DialogTitle>
            <DialogDescription>Deel hierdie produk via WhatsApp of kopieer die skakel</DialogDescription>
          </DialogHeader>
          {selectedProdukt && (
            <div className="space-y-4">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#002855]">{selectedProdukt.titel || 'Ongetiteld'}</h3>
                  <p className="text-lg font-bold text-[#D4A84B]">R{formatPrice(selectedProdukt.prys)}</p>
                </CardContent>

              </Card>
              <div>
                <Label className="text-sm text-gray-600">Publieke Skakel</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={getPublicLink(selectedProdukt)} readOnly className="text-sm" />
                  <Button variant="outline" onClick={() => copyToClipboard(getPublicLink(selectedProdukt))}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(getWhatsAppLink(selectedProdukt), '_blank')}>
                  <MessageCircle className="w-4 h-4 mr-2" />Deel via WhatsApp
                </Button>
                <Button variant="outline" onClick={() => window.open(getPublicLink(selectedProdukt), '_blank')}><ExternalLink className="w-4 h-4" /></Button>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800"><AlertCircle className="w-4 h-4 inline mr-1" />Hierdie skakel kan deur enigiemand gebruik word om die produk te koop.</p>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowShareDialog(false)}>Sluit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Management Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#D4A84B]" />
              Kaartjie Nommers: {selectedProdukt?.titel}
            </DialogTitle>
            <DialogDescription>Bestuur die beskikbare kaartjie nommers vir hierdie produk</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Bestaande Nommers</TabsTrigger>
              <TabsTrigger value="add">Voeg Nommers By</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              {loadingTickets ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#002855]" /></div>
              ) : ticketNommers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Geen kaartjie nommers gelaai nie.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ticketNommers.map(ticket => (
                    <div key={ticket.id} className={`flex flex-col p-2 border rounded-md ${ticket.is_verkoop ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate" title={ticket.nommer}>{ticket.nommer}</span>
                        {!ticket.is_verkoop && (
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTicket(ticket.id)} className="h-6 w-6 p-0 text-red-500 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {ticket.is_verkoop && <Check className="w-4 h-4 text-green-600" />}
                      </div>
                      {ticket.is_verkoop && (
                        <p className="text-[10px] text-gray-500 mt-1 truncate">
                          Koper: {
                            ticket.bestelling?.koper_naam ||
                            bestellings.find(b => b.id === ticket.bestelling_id)?.koper_naam ||
                            (ticket.bestelling_id ? `Bestelling ID: ${ticket.bestelling_id.substring(0, 8)}` : 'Onbekend')
                          }
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="mt-4 space-y-4">
              <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Massa Oplaai</h4>
                <p className="text-xs text-blue-700 mb-3">Plak nommers hier onder, geskei deur kommas of nuwe lyne.</p>
                <Textarea
                  placeholder="bv: 101, 102, 103..."
                  value={bulkTicketNommers}
                  onChange={(e) => setBulkTicketNommers(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleBulkAddTickets}
                  disabled={savingTickets || !bulkTicketNommers.trim()}
                  className="w-full mt-3 bg-[#002855] text-white"
                >
                  {savingTickets ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Voeg Massa By
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">of enkel</span></div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Kaartjie nommer"
                  value={newTicketNommer}
                  onChange={(e) => setNewTicketNommer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTicket()}
                />
                <Button onClick={handleAddTicket} disabled={savingTickets || !newTicketNommer.trim()} className="bg-[#D4A84B] text-[#002855]">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowTicketDialog(false)}>Toemaak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Export wrapped in error boundary
const Kuberkermis: React.FC = () => (
  <KuberkermisErrorBoundary>
    <KuberkermisContent />
  </KuberkermisErrorBoundary>
);

export default Kuberkermis;
