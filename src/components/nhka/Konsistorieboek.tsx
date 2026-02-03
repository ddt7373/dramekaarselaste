import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import SignaturePad from './SignaturePad';
import {
  BookOpen,
  Users,
  Gavel,
  Coins,
  Megaphone,
  UserPlus,
  Plus,
  Calendar,
  Clock,
  User,
  PenTool,
  Save,
  Eye,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import {
  ErediensBywoning,
  BywoningRekord,
  KonsistorieBesluit,
  KollekteRekord,
  GemeenteAfkondiging,
  LidmaatskapKennisgewing,
  ErediensTipe,
  KonsistorieBesluitStatus,
  AfkondigingKategorie,
  LidmaatskapKennisgwingTipe,
  getErediensTipeLabel,
  getKonsistorieBesluitStatusLabel,
  getAfkondigingKategorieLabel,
  getLidmaatskapKennisgwingTipeLabel,
  canManageKonsistorieboek
} from '@/types/nhka';

const Konsistorieboek: React.FC = () => {
  const { currentUser, currentGemeente } = useNHKA();
  const [activeTab, setActiveTab] = useState('bywoning');
  const [loading, setLoading] = useState(false);

  // Data states
  const [bywoningRecords, setBywoningRecords] = useState<ErediensBywoning[]>([]);
  const [besluite, setBesluite] = useState<KonsistorieBesluit[]>([]);
  const [kollektes, setKollektes] = useState<KollekteRekord[]>([]);
  const [afkondigings, setAfkondigings] = useState<GemeenteAfkondiging[]>([]);
  const [kennisgewings, setKennisgewings] = useState<LidmaatskapKennisgewing[]>([]);

  // Dialog states
  const [showBywoningDialog, setShowBywoningDialog] = useState(false);
  const [showBesluitDialog, setShowBesluitDialog] = useState(false);
  const [showKollekteDialog, setShowKollekteDialog] = useState(false);
  const [showAfkondigingDialog, setShowAfkondigingDialog] = useState(false);
  const [showKennisgwingDialog, setShowKennisgwingDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  // Form states
  const [bywoningForm, setBywoningForm] = useState({
    erediens_datum: new Date().toISOString().split('T')[0],
    erediens_tyd: '09:00',
    erediens_tipe: 'oggend' as ErediensTipe,
    tema: '',
    skriflesing: '',
    prediker_naam: ''
  });

  const [attendees, setAttendees] = useState<{
    naam: string;
    rol: string;
    is_kerkraad: boolean;
    handtekening_data?: string;
    kommentaar?: string;
  }[]>([]);

  const [newAttendee, setNewAttendee] = useState({
    naam: '',
    rol: 'lidmaat',
    is_kerkraad: false,
    kommentaar: ''
  });

  const [currentSignatureIndex, setCurrentSignatureIndex] = useState<number | null>(null);

  const [besluitForm, setBesluitForm] = useState({
    vergadering_datum: new Date().toISOString().split('T')[0],
    vergadering_nommer: '',
    besluit_nommer: '',
    onderwerp: '',
    beskrywing: '',
    besluit: '',
    voorsteller: '',
    sekondant: '',
    status: 'aanvaar' as KonsistorieBesluitStatus
  });

  const [kollekteForm, setKollekteForm] = useState({
    erediens_datum: new Date().toISOString().split('T')[0],
    erediens_tipe: 'oggend' as ErediensTipe,
    deurkollekte_bedrag: 0,
    nagmaal_kollekte_bedrag: 0,
    kategese_kollekte_bedrag: 0,
    ander_kollekte_bedrag: 0,
    ander_kollekte_beskrywing: '',
    getel_deur_naam: '',
    getel_deur_handtekening: '',
    kassier_kwitansie_nommer: '',
    notas: ''
  });

  const [afkondigingForm, setAfkondigingForm] = useState({
    erediens_datum: new Date().toISOString().split('T')[0],
    titel: '',
    inhoud: '',
    kategorie: 'algemeen' as AfkondigingKategorie,
    is_dringend: false,
    geldig_tot: ''
  });

  const [kennisgwingForm, setKennisgwingForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    tipe: 'nuwe_lidmaat' as LidmaatskapKennisgwingTipe,
    lidmaat_naam: '',
    beskrywing: '',
    van_gemeente: '',
    na_gemeente: '',
    dokument_verwysing: ''
  });

  const canManage = currentUser && canManageKonsistorieboek(currentUser.rol);

  useEffect(() => {
    if (currentGemeente) {
      loadData();
    }
  }, [currentGemeente, activeTab]);

  const loadData = async () => {
    if (!currentGemeente) return;
    setLoading(true);

    try {
      switch (activeTab) {
        case 'bywoning':
          const { data: bywoningData } = await supabase
            .from('erediens_bywoning')
            .select('*')
            .eq('gemeente_id', currentGemeente.id)
            .order('erediens_datum', { ascending: false })
            .limit(50);
          setBywoningRecords(bywoningData || []);
          break;

        case 'besluite':
          const { data: besluiteData } = await supabase
            .from('konsistorie_besluite')
            .select('*')
            .eq('gemeente_id', currentGemeente.id)
            .order('vergadering_datum', { ascending: false })
            .limit(50);
          setBesluite(besluiteData || []);
          break;

        case 'kollektes':
          const { data: kollektesData } = await supabase
            .from('kollekte_rekords')
            .select('*')
            .eq('gemeente_id', currentGemeente.id)
            .order('erediens_datum', { ascending: false })
            .limit(50);
          setKollektes(kollektesData || []);
          break;

        case 'afkondigings':
          const { data: afkondigingsData } = await supabase
            .from('gemeente_afkondigings')
            .select('*')
            .eq('gemeente_id', currentGemeente.id)
            .order('erediens_datum', { ascending: false })
            .limit(50);
          setAfkondigings(afkondigingsData || []);
          break;

        case 'kennisgewings':
          const { data: kennisgewingsData } = await supabase
            .from('lidmaatskap_kennisgewings')
            .select('*')
            .eq('gemeente_id', currentGemeente.id)
            .order('datum', { ascending: false })
            .limit(50);
          setKennisgewings(kennisgewingsData || []);
          break;
      }
    } catch (error) {
      console.error('Fout met data laai:', error);
      toast.error('Kon data nie laai nie');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendee = () => {
    if (!newAttendee.naam.trim()) {
      toast.error('Voer asseblief \'n naam in');
      return;
    }
    setAttendees([...attendees, { ...newAttendee }]);
    setNewAttendee({ naam: '', rol: 'lidmaat', is_kerkraad: false, kommentaar: '' });
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleSignatureRequest = (index: number) => {
    setCurrentSignatureIndex(index);
    setShowSignatureDialog(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    if (currentSignatureIndex !== null) {
      const updated = [...attendees];
      updated[currentSignatureIndex].handtekening_data = signatureData;
      setAttendees(updated);
    }
    setShowSignatureDialog(false);
    setCurrentSignatureIndex(null);
  };

  const handleSaveBywoning = async () => {
    if (!currentGemeente || !currentUser) return;

    try {
      setLoading(true);

      // Create the service record
      const { data: bywoningData, error: bywoningError } = await supabase
        .from('erediens_bywoning')
        .insert({
          gemeente_id: currentGemeente.id,
          erediens_datum: bywoningForm.erediens_datum,
          erediens_tyd: bywoningForm.erediens_tyd,
          erediens_tipe: bywoningForm.erediens_tipe,
          tema: bywoningForm.tema,
          skriflesing: bywoningForm.skriflesing,
          prediker_naam: bywoningForm.prediker_naam,
          totale_bywoning: attendees.length,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (bywoningError) throw bywoningError;

      // Add attendance records
      if (attendees.length > 0 && bywoningData) {
        const attendeeRecords = attendees.map(a => ({
          erediens_bywoning_id: bywoningData.id,
          naam: a.naam,
          rol: a.rol,
          is_kerkraad: a.is_kerkraad,
          handtekening_data: a.handtekening_data,
          kommentaar: a.kommentaar
        }));

        const { error: recordsError } = await supabase
          .from('bywoning_rekords')
          .insert(attendeeRecords);

        if (recordsError) throw recordsError;
      }

      toast.success('Bywoning suksesvol gestoor');
      setShowBywoningDialog(false);
      resetBywoningForm();
      loadData();
    } catch (error) {
      console.error('Fout met bywoning stoor:', error);
      toast.error('Kon bywoning nie stoor nie');
    } finally {
      setLoading(false);
    }
  };

  const resetBywoningForm = () => {
    setBywoningForm({
      erediens_datum: new Date().toISOString().split('T')[0],
      erediens_tyd: '09:00',
      erediens_tipe: 'oggend',
      tema: '',
      skriflesing: '',
      prediker_naam: ''
    });
    setAttendees([]);
  };

  const handleSaveBesluit = async () => {
    if (!currentGemeente || !currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('konsistorie_besluite')
        .insert({
          gemeente_id: currentGemeente.id,
          ...besluitForm,
          created_by: currentUser.id
        });

      if (error) throw error;

      toast.success('Besluit suksesvol gestoor');
      setShowBesluitDialog(false);
      setBesluitForm({
        vergadering_datum: new Date().toISOString().split('T')[0],
        vergadering_nommer: '',
        besluit_nommer: '',
        onderwerp: '',
        beskrywing: '',
        besluit: '',
        voorsteller: '',
        sekondant: '',
        status: 'aanvaar'
      });
      loadData();
    } catch (error) {
      console.error('Fout met besluit stoor:', error);
      toast.error('Kon besluit nie stoor nie');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKollekte = async () => {
    if (!currentGemeente || !currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('kollekte_rekords')
        .insert({
          gemeente_id: currentGemeente.id,
          ...kollekteForm,
          created_by: currentUser.id
        });

      if (error) throw error;

      toast.success('Kollekte suksesvol gestoor');
      setShowKollekteDialog(false);
      setKollekteForm({
        erediens_datum: new Date().toISOString().split('T')[0],
        erediens_tipe: 'oggend',
        deurkollekte_bedrag: 0,
        nagmaal_kollekte_bedrag: 0,
        kategese_kollekte_bedrag: 0,
        ander_kollekte_bedrag: 0,
        ander_kollekte_beskrywing: '',
        getel_deur_naam: '',
        getel_deur_handtekening: '',
        kassier_kwitansie_nommer: '',
        notas: ''
      });
      loadData();
    } catch (error) {
      console.error('Fout met kollekte stoor:', error);
      toast.error('Kon kollekte nie stoor nie');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAfkondiging = async () => {
    if (!currentGemeente || !currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('gemeente_afkondigings')
        .insert({
          gemeente_id: currentGemeente.id,
          ...afkondigingForm,
          created_by: currentUser.id
        });

      if (error) throw error;

      toast.success('Afkondiging suksesvol gestoor');
      setShowAfkondigingDialog(false);
      setAfkondigingForm({
        erediens_datum: new Date().toISOString().split('T')[0],
        titel: '',
        inhoud: '',
        kategorie: 'algemeen',
        is_dringend: false,
        geldig_tot: ''
      });
      loadData();
    } catch (error) {
      console.error('Fout met afkondiging stoor:', error);
      toast.error('Kon afkondiging nie stoor nie');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKennisgewing = async () => {
    if (!currentGemeente || !currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('lidmaatskap_kennisgewings')
        .insert({
          gemeente_id: currentGemeente.id,
          ...kennisgwingForm,
          created_by: currentUser.id
        });

      if (error) throw error;

      toast.success('Kennisgewing suksesvol gestoor');
      setShowKennisgwingDialog(false);
      setKennisgwingForm({
        datum: new Date().toISOString().split('T')[0],
        tipe: 'nuwe_lidmaat',
        lidmaat_naam: '',
        beskrywing: '',
        van_gemeente: '',
        na_gemeente: '',
        dokument_verwysing: ''
      });
      loadData();
    } catch (error) {
      console.error('Fout met kennisgewing stoor:', error);
      toast.error('Kon kennisgewing nie stoor nie');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('af-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('af-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  if (!canManage) {
    return (
      <div className="p-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">
              Toegang Beperk
            </h3>
            <p className="text-sm sm:text-base text-amber-700">
              Slegs gemeente administrateurs en predikante kan die konsistorieboek bestuur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile card component for bywoning records
  const BywoningMobileCard = ({ record }: { record: ErediensBywoning }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-[#002855]">{formatDate(record.erediens_datum)}</p>
            <Badge variant="outline" className="mt-1">{getErediensTipeLabel(record.erediens_tipe)}</Badge>
          </div>
          <Badge className="bg-[#002855]">{record.totale_bywoning} bywoners</Badge>
        </div>
        {record.tema && <p className="text-sm text-gray-600 mt-2"><strong>Tema:</strong> {record.tema}</p>}
        {record.prediker_naam && <p className="text-sm text-gray-600"><strong>Prediker:</strong> {record.prediker_naam}</p>}
      </CardContent>
    </Card>
  );

  // Mobile card component for kollekte records
  const KollekteMobileCard = ({ kollekte }: { kollekte: KollekteRekord }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-[#002855]">{formatDate(kollekte.erediens_datum)}</p>
            <Badge variant="outline" className="mt-1">{getErediensTipeLabel(kollekte.erediens_tipe)}</Badge>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Totaal</p>
            <p className="font-bold text-[#002855]">
              {formatCurrency(
                kollekte.deurkollekte_bedrag +
                kollekte.nagmaal_kollekte_bedrag +
                kollekte.kategese_kollekte_bedrag +
                kollekte.ander_kollekte_bedrag
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500 text-xs">Deurkollekte</p>
            <p className="font-medium">{formatCurrency(kollekte.deurkollekte_bedrag)}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500 text-xs">Nagmaal</p>
            <p className="font-medium">{formatCurrency(kollekte.nagmaal_kollekte_bedrag)}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500 text-xs">Kategese</p>
            <p className="font-medium">{formatCurrency(kollekte.kategese_kollekte_bedrag)}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500 text-xs">Ander</p>
            <p className="font-medium">{formatCurrency(kollekte.ander_kollekte_bedrag)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Getel deur:</span>
            <span className="flex items-center gap-1">
              {kollekte.getel_deur_naam || '-'}
              {kollekte.getel_deur_handtekening && <CheckCircle className="w-4 h-4 text-green-600" />}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Kwitansie:</span>
            <span>{kollekte.kassier_kwitansie_nommer || '-'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Mobile card component for kennisgewings
  const KennisgwingMobileCard = ({ kennisgewing }: { kennisgewing: LidmaatskapKennisgewing }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold">{kennisgewing.lidmaat_naam}</p>
            <p className="text-sm text-gray-500">{formatDate(kennisgewing.datum)}</p>
          </div>
          <Badge
            className={
              kennisgewing.tipe === 'oorlede'
                ? 'bg-gray-600'
                : kennisgewing.tipe === 'oordrag_uit'
                  ? 'bg-amber-600'
                  : 'bg-green-600'
            }
          >
            {getLidmaatskapKennisgwingTipeLabel(kennisgewing.tipe)}
          </Badge>
        </div>
        {kennisgewing.van_gemeente && (
          <p className="text-sm text-gray-600">Van: {kennisgewing.van_gemeente}</p>
        )}
        {kennisgewing.na_gemeente && (
          <p className="text-sm text-gray-600">Na: {kennisgewing.na_gemeente}</p>
        )}
        {kennisgewing.beskrywing && !kennisgewing.van_gemeente && !kennisgewing.na_gemeente && (
          <p className="text-sm text-gray-600">{kennisgewing.beskrywing}</p>
        )}
        {kennisgewing.dokument_verwysing && (
          <p className="text-sm text-gray-500 mt-2">Verwysing: {kennisgewing.dokument_verwysing}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Kopstuk */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#002855] flex items-center gap-2 sm:gap-3">
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
          <span className="truncate">Konsistorieboek</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Amptelike rekords vir {currentGemeente?.naam || 'gemeente'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-full min-w-max h-auto p-1 bg-gray-100 rounded-lg">
            <TabsTrigger value="bywoning" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Users className="w-4 h-4" />
              <span>Bywoning</span>
            </TabsTrigger>
            <TabsTrigger value="besluite" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Gavel className="w-4 h-4" />
              <span>Besluite</span>
            </TabsTrigger>
            <TabsTrigger value="kollektes" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Coins className="w-4 h-4" />
              <span>Kollektes</span>
            </TabsTrigger>
            <TabsTrigger value="afkondigings" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Megaphone className="w-4 h-4" />
              <span>Afkondigings</span>
            </TabsTrigger>
            <TabsTrigger value="kennisgewings" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <UserPlus className="w-4 h-4" />
              <span>Lidmaatskap</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Erediensbywoning Tab */}
        <TabsContent value="bywoning" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="w-5 h-5 text-[#002855]" />
                    Erediensbywoning
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Log erediensbywoning met handtekeninge
                  </CardDescription>
                </div>
                <Dialog open={showBywoningDialog} onOpenChange={setShowBywoningDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#002855] hover:bg-[#002855]/90 gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Nuwe Bywoning
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] p-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0">
                      <DialogTitle className="text-lg">Log Erediensbywoning</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[calc(90vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-sm">Datum</Label>
                            <Input
                              type="date"
                              value={bywoningForm.erediens_datum}
                              onChange={(e) => setBywoningForm({ ...bywoningForm, erediens_datum: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Tyd</Label>
                            <Input
                              type="time"
                              value={bywoningForm.erediens_tyd}
                              onChange={(e) => setBywoningForm({ ...bywoningForm, erediens_tyd: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Diens Tipe</Label>
                          <Select
                            value={bywoningForm.erediens_tipe}
                            onValueChange={(v) => setBywoningForm({ ...bywoningForm, erediens_tipe: v as ErediensTipe })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oggend">Oggenddiens</SelectItem>
                              <SelectItem value="aand">Aanddiens</SelectItem>
                              <SelectItem value="spesiaal">Spesiale Diens</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Tema</Label>
                          <Input
                            value={bywoningForm.tema}
                            onChange={(e) => setBywoningForm({ ...bywoningForm, tema: e.target.value })}
                            placeholder="Preek tema"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Skriflesing</Label>
                          <Input
                            value={bywoningForm.skriflesing}
                            onChange={(e) => setBywoningForm({ ...bywoningForm, skriflesing: e.target.value })}
                            placeholder="bv. Johannes 3:16"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Prediker</Label>
                          <Input
                            value={bywoningForm.prediker_naam}
                            onChange={(e) => setBywoningForm({ ...bywoningForm, prediker_naam: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        {/* Bywoners Afdeling */}
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <Users className="w-4 h-4" />
                            Bywoningsregister
                          </h4>

                          {/* Voeg nuwe bywoner by */}
                          <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <Input
                              placeholder="Naam"
                              value={newAttendee.naam}
                              onChange={(e) => setNewAttendee({ ...newAttendee, naam: e.target.value })}
                              className="flex-1"
                            />
                            <div className="flex gap-2">
                              <Select
                                value={newAttendee.rol}
                                onValueChange={(v) => setNewAttendee({ ...newAttendee, rol: v, is_kerkraad: ['predikant', 'ouderling', 'diaken'].includes(v) })}
                              >
                                <SelectTrigger className="w-full sm:w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lidmaat">Lidmaat</SelectItem>
                                  <SelectItem value="predikant">Predikant</SelectItem>
                                  <SelectItem value="ouderling">Ouderling</SelectItem>
                                  <SelectItem value="diaken">Diaken</SelectItem>
                                  <SelectItem value="besoeker">Besoeker</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Kommentaar (opsioneel)"
                                value={newAttendee.kommentaar}
                                onChange={(e) => setNewAttendee({ ...newAttendee, kommentaar: e.target.value })}
                                className="w-full sm:w-48"
                              />
                              <Button onClick={handleAddAttendee} size="icon" variant="outline" className="flex-shrink-0">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Bywoners lys */}
                          {attendees.length > 0 && (
                            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                              {attendees.map((attendee, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg ${attendee.is_kerkraad ? 'bg-[#002855]/5 border border-[#002855]/20' : 'bg-gray-50'
                                    }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                      <span className="font-medium text-sm">{attendee.naam}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {attendee.rol}
                                      </Badge>
                                      {attendee.is_kerkraad && (
                                        <Badge className="bg-[#002855] text-xs">
                                          Kerkraad
                                        </Badge>
                                      )}
                                      {attendee.kommentaar && (
                                        <span className="text-xs text-gray-500 italic">
                                          - {attendee.kommentaar}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                      {attendee.is_kerkraad && (
                                        <Button
                                          size="sm"
                                          variant={attendee.handtekening_data ? 'default' : 'outline'}
                                          onClick={() => handleSignatureRequest(index)}
                                          className={`text-xs ${attendee.handtekening_data ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                        >
                                          <PenTool className="w-3 h-3 mr-1" />
                                          {attendee.handtekening_data ? 'Geteken' : 'Teken'}
                                        </Button>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleRemoveAttendee(index)}
                                        className="text-red-500 hover:text-red-700 h-8 w-8"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {attendees.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">
                              Geen bywoners bygevoeg nie
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                          <Button variant="outline" onClick={() => setShowBywoningDialog(false)} className="w-full sm:w-auto">
                            Kanselleer
                          </Button>
                          <Button onClick={handleSaveBywoning} disabled={loading} className="bg-[#002855] hover:bg-[#002855]/90 w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Stoor
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : bywoningRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen bywoningsrekords gevind nie</p>
                </div>
              ) : (
                <div>
                  {bywoningRecords.map((record) => (
                    <BywoningMobileCard key={record.id} record={record} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Konsistoriebesluite Tab */}
        <TabsContent value="besluite" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Gavel className="w-5 h-5 text-[#002855]" />
                    Konsistoriebesluite
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Amptelike besluite van die kerkraad
                  </CardDescription>
                </div>
                <Dialog open={showBesluitDialog} onOpenChange={setShowBesluitDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#002855] hover:bg-[#002855]/90 gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Nuwe Besluit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] p-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0">
                      <DialogTitle className="text-lg">Voeg Besluit By</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[calc(90vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-sm">Vergadering Datum</Label>
                            <Input
                              type="date"
                              value={besluitForm.vergadering_datum}
                              onChange={(e) => setBesluitForm({ ...besluitForm, vergadering_datum: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Vergadering Nr</Label>
                            <Input
                              value={besluitForm.vergadering_nommer}
                              onChange={(e) => setBesluitForm({ ...besluitForm, vergadering_nommer: e.target.value })}
                              placeholder="bv. 2024/01"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Besluit Nommer</Label>
                          <Input
                            value={besluitForm.besluit_nommer}
                            onChange={(e) => setBesluitForm({ ...besluitForm, besluit_nommer: e.target.value })}
                            placeholder="bv. B001"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Onderwerp</Label>
                          <Input
                            value={besluitForm.onderwerp}
                            onChange={(e) => setBesluitForm({ ...besluitForm, onderwerp: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Beskrywing</Label>
                          <Textarea
                            value={besluitForm.beskrywing}
                            onChange={(e) => setBesluitForm({ ...besluitForm, beskrywing: e.target.value })}
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Besluit</Label>
                          <Textarea
                            value={besluitForm.besluit}
                            onChange={(e) => setBesluitForm({ ...besluitForm, besluit: e.target.value })}
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-sm">Voorsteller</Label>
                            <Input
                              value={besluitForm.voorsteller}
                              onChange={(e) => setBesluitForm({ ...besluitForm, voorsteller: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Sekondant</Label>
                            <Input
                              value={besluitForm.sekondant}
                              onChange={(e) => setBesluitForm({ ...besluitForm, sekondant: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Status</Label>
                          <Select
                            value={besluitForm.status}
                            onValueChange={(v) => setBesluitForm({ ...besluitForm, status: v as KonsistorieBesluitStatus })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aanvaar">Aanvaar</SelectItem>
                              <SelectItem value="verwerp">Verwerp</SelectItem>
                              <SelectItem value="uitgestel">Uitgestel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowBesluitDialog(false)} className="w-full sm:w-auto">
                            Kanselleer
                          </Button>
                          <Button onClick={handleSaveBesluit} disabled={loading} className="bg-[#002855] hover:bg-[#002855]/90 w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Stoor
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : besluite.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gavel className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen besluite gevind nie</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {besluite.map((besluit) => (
                    <Card key={besluit.id} className="border-l-4 border-l-[#002855]">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-[#002855] text-sm sm:text-base truncate">{besluit.onderwerp}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {besluit.besluit_nommer && `${besluit.besluit_nommer} • `}
                              {formatDate(besluit.vergadering_datum)}
                            </p>
                          </div>
                          <Badge
                            className={`flex-shrink-0 ${besluit.status === 'aanvaar'
                              ? 'bg-green-100 text-green-800'
                              : besluit.status === 'verwerp'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {getKonsistorieBesluitStatusLabel(besluit.status)}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{besluit.besluit}</p>
                        {(besluit.voorsteller || besluit.sekondant) && (
                          <p className="text-xs sm:text-sm text-gray-500">
                            {besluit.voorsteller && `Voorsteller: ${besluit.voorsteller}`}
                            {besluit.voorsteller && besluit.sekondant && ' • '}
                            {besluit.sekondant && `Sekondant: ${besluit.sekondant}`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kollektes Tab */}
        <TabsContent value="kollektes" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Coins className="w-5 h-5 text-[#002855]" />
                    Kollekte Rekords
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Deurkollekte, Nagmaal, Kategese
                  </CardDescription>
                </div>
                <Dialog open={showKollekteDialog} onOpenChange={setShowKollekteDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#002855] hover:bg-[#002855]/90 gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Nuwe Kollekte
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] p-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0">
                      <DialogTitle className="text-lg">Log Kollekte</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[calc(90vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-sm">Datum</Label>
                            <Input
                              type="date"
                              value={kollekteForm.erediens_datum}
                              onChange={(e) => setKollekteForm({ ...kollekteForm, erediens_datum: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Diens Tipe</Label>
                            <Select
                              value={kollekteForm.erediens_tipe}
                              onValueChange={(v) => setKollekteForm({ ...kollekteForm, erediens_tipe: v as ErediensTipe })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oggend">Oggenddiens</SelectItem>
                                <SelectItem value="aand">Aanddiens</SelectItem>
                                <SelectItem value="spesiaal">Spesiaal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Deurkollekte (R)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={kollekteForm.deurkollekte_bedrag}
                              onChange={(e) => setKollekteForm({ ...kollekteForm, deurkollekte_bedrag: parseFloat(e.target.value) || 0 })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Nagmaal (R)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={kollekteForm.nagmaal_kollekte_bedrag}
                              onChange={(e) => setKollekteForm({ ...kollekteForm, nagmaal_kollekte_bedrag: parseFloat(e.target.value) || 0 })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Kategese (R)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={kollekteForm.kategese_kollekte_bedrag}
                              onChange={(e) => setKollekteForm({ ...kollekteForm, kategese_kollekte_bedrag: parseFloat(e.target.value) || 0 })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Ander (R)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={kollekteForm.ander_kollekte_bedrag}
                              onChange={(e) => setKollekteForm({ ...kollekteForm, ander_kollekte_bedrag: parseFloat(e.target.value) || 0 })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {kollekteForm.ander_kollekte_bedrag > 0 && (
                          <div>
                            <Label className="text-sm">Ander Kollekte Beskrywing</Label>
                            <Input
                              value={kollekteForm.ander_kollekte_beskrywing}
                              onChange={(e) => setKollekteForm({ ...kollekteForm, ander_kollekte_beskrywing: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        )}

                        <div>
                          <Label className="text-sm">Getel Deur</Label>
                          <Input
                            value={kollekteForm.getel_deur_naam}
                            onChange={(e) => setKollekteForm({ ...kollekteForm, getel_deur_naam: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <SignaturePad
                            label="Handtekening van Teller"
                            onSave={(sig) => setKollekteForm({ ...kollekteForm, getel_deur_handtekening: sig })}
                            existingSignature={kollekteForm.getel_deur_handtekening}
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Kassier Kwitansie Nr</Label>
                          <Input
                            value={kollekteForm.kassier_kwitansie_nommer}
                            onChange={(e) => setKollekteForm({ ...kollekteForm, kassier_kwitansie_nommer: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Notas</Label>
                          <Textarea
                            value={kollekteForm.notas}
                            onChange={(e) => setKollekteForm({ ...kollekteForm, notas: e.target.value })}
                            rows={2}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowKollekteDialog(false)} className="w-full sm:w-auto">
                            Kanselleer
                          </Button>
                          <Button onClick={handleSaveKollekte} disabled={loading} className="bg-[#002855] hover:bg-[#002855]/90 w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Stoor
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : kollektes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Coins className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen kollekte rekords gevind nie</p>
                </div>
              ) : (
                <div>
                  {kollektes.map((kollekte) => (
                    <KollekteMobileCard key={kollekte.id} kollekte={kollekte} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Afkondigings Tab */}
        <TabsContent value="afkondigings" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Megaphone className="w-5 h-5 text-[#002855]" />
                    Gemeenteafkondigings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Afkondigings tydens eredienste
                  </CardDescription>
                </div>
                <Dialog open={showAfkondigingDialog} onOpenChange={setShowAfkondigingDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#002855] hover:bg-[#002855]/90 gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Nuwe Afkondiging
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] p-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0">
                      <DialogTitle className="text-lg">Voeg Afkondiging By</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[calc(90vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-sm">Erediens Datum</Label>
                            <Input
                              type="date"
                              value={afkondigingForm.erediens_datum}
                              onChange={(e) => setAfkondigingForm({ ...afkondigingForm, erediens_datum: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Kategorie</Label>
                            <Select
                              value={afkondigingForm.kategorie}
                              onValueChange={(v) => setAfkondigingForm({ ...afkondigingForm, kategorie: v as AfkondigingKategorie })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="algemeen">Algemeen</SelectItem>
                                <SelectItem value="sterfgeval">Sterfgeval</SelectItem>
                                <SelectItem value="geboorte">Geboorte</SelectItem>
                                <SelectItem value="huwelik">Huwelik</SelectItem>
                                <SelectItem value="doop">Doop</SelectItem>
                                <SelectItem value="belydenis">Belydenis</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Titel</Label>
                          <Input
                            value={afkondigingForm.titel}
                            onChange={(e) => setAfkondigingForm({ ...afkondigingForm, titel: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Inhoud</Label>
                          <Textarea
                            value={afkondigingForm.inhoud}
                            onChange={(e) => setAfkondigingForm({ ...afkondigingForm, inhoud: e.target.value })}
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="is_dringend"
                            checked={afkondigingForm.is_dringend}
                            onCheckedChange={(checked) => setAfkondigingForm({ ...afkondigingForm, is_dringend: !!checked })}
                          />
                          <Label htmlFor="is_dringend" className="text-sm">Dringende Afkondiging</Label>
                        </div>
                        <div>
                          <Label className="text-sm">Geldig Tot (Opsioneel)</Label>
                          <Input
                            type="date"
                            value={afkondigingForm.geldig_tot}
                            onChange={(e) => setAfkondigingForm({ ...afkondigingForm, geldig_tot: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowAfkondigingDialog(false)} className="w-full sm:w-auto">
                            Kanselleer
                          </Button>
                          <Button onClick={handleSaveAfkondiging} disabled={loading} className="bg-[#002855] hover:bg-[#002855]/90 w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Stoor
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : afkondigings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Megaphone className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen afkondigings gevind nie</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {afkondigings.map((afkondiging) => (
                    <Card key={afkondiging.id} className={`border-l-4 ${afkondiging.is_dringend ? 'border-l-red-500 bg-red-50/50' : 'border-l-[#002855]'}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-[#002855] flex items-center gap-2 text-sm sm:text-base">
                              {afkondiging.is_dringend && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              <span className="truncate">{afkondiging.titel}</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500">{formatDate(afkondiging.erediens_datum)}</p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0 text-xs">{getAfkondigingKategorieLabel(afkondiging.kategorie)}</Badge>
                        </div>
                        <p className="text-gray-700 text-sm">{afkondiging.inhoud}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lidmaatskap Kennisgewings Tab */}
        <TabsContent value="kennisgewings" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <UserPlus className="w-5 h-5 text-[#002855]" />
                    Lidmaatskapkennisgewings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Nuwe lidmate, oordragte, sterfgevalle
                  </CardDescription>
                </div>
                <Dialog open={showKennisgwingDialog} onOpenChange={setShowKennisgwingDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#002855] hover:bg-[#002855]/90 gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Nuwe Kennisgewing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] p-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0">
                      <DialogTitle className="text-lg">Voeg Kennisgewing By</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[calc(90vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-sm">Datum</Label>
                            <Input
                              type="date"
                              value={kennisgwingForm.datum}
                              onChange={(e) => setKennisgwingForm({ ...kennisgwingForm, datum: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Tipe</Label>
                            <Select
                              value={kennisgwingForm.tipe}
                              onValueChange={(v) => setKennisgwingForm({ ...kennisgwingForm, tipe: v as LidmaatskapKennisgwingTipe })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nuwe_lidmaat">Nuwe Lidmaat</SelectItem>
                                <SelectItem value="oordrag_in">Oordrag Inkom</SelectItem>
                                <SelectItem value="oordrag_uit">Oordrag Uitgaan</SelectItem>
                                <SelectItem value="oorlede">Oorlede</SelectItem>
                                <SelectItem value="gedoop">Gedoop</SelectItem>
                                <SelectItem value="belydenis">Belydenis Afgelê</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Lidmaat Naam</Label>
                          <Input
                            value={kennisgwingForm.lidmaat_naam}
                            onChange={(e) => setKennisgwingForm({ ...kennisgwingForm, lidmaat_naam: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        {kennisgwingForm.tipe === 'oordrag_in' && (
                          <div>
                            <Label className="text-sm">Van Gemeente</Label>
                            <Input
                              value={kennisgwingForm.van_gemeente}
                              onChange={(e) => setKennisgwingForm({ ...kennisgwingForm, van_gemeente: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        )}
                        {kennisgwingForm.tipe === 'oordrag_uit' && (
                          <div>
                            <Label className="text-sm">Na Gemeente</Label>
                            <Input
                              value={kennisgwingForm.na_gemeente}
                              onChange={(e) => setKennisgwingForm({ ...kennisgwingForm, na_gemeente: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        )}
                        <div>
                          <Label className="text-sm">Beskrywing</Label>
                          <Textarea
                            value={kennisgwingForm.beskrywing}
                            onChange={(e) => setKennisgwingForm({ ...kennisgwingForm, beskrywing: e.target.value })}
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Dokument Verwysing</Label>
                          <Input
                            value={kennisgwingForm.dokument_verwysing}
                            onChange={(e) => setKennisgwingForm({ ...kennisgwingForm, dokument_verwysing: e.target.value })}
                            placeholder="bv. Sertifikaat nommer"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowKennisgwingDialog(false)} className="w-full sm:w-auto">
                            Kanselleer
                          </Button>
                          <Button onClick={handleSaveKennisgewing} disabled={loading} className="bg-[#002855] hover:bg-[#002855]/90 w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Stoor
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : kennisgewings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen kennisgewings gevind nie</p>
                </div>
              ) : (
                <div>
                  {kennisgewings.map((kennisgewing) => (
                    <KennisgwingMobileCard key={kennisgewing.id} kennisgewing={kennisgewing} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Handtekening Dialoog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Handtekening
              {currentSignatureIndex !== null && attendees[currentSignatureIndex] && (
                <span className="text-gray-500 font-normal ml-2 text-sm">
                  - {attendees[currentSignatureIndex].naam}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <SignaturePad
            onSave={handleSignatureSave}
            onCancel={() => setShowSignatureDialog(false)}
            label="Teken asseblief hier"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Konsistorieboek;
