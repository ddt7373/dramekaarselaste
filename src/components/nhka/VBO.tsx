import React, { useState, useEffect, useRef } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import {
  VBOAktiwiteit,
  VBOIndiening,
  VBOAktiwiteitTipe,
  VBOIndieningStatus,
  getVBOAktiwiteitTipeLabel,
  getVBOIndieningStatusLabel,
  isModerator,
  Gebruiker,
  VBOHistoriesePunte
} from '@/types/nhka';
import {
  Award,
  Plus,
  X,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  ChevronDown,
  Search,
  Filter,
  GraduationCap,
  BookOpen,
  Users,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
  Target,
  Calendar,
  Mic,
  PenTool,
  Globe,
  UserCheck,
  Video,
  Book,
  Sparkles,
  History,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

// Special Activity IDs
const ACTIVITY_IDS = {
  INTERNASIONALE_KONFERENSIE: 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
  LMS_KURSUS: 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a24'
};

interface LeaderboardEntry {
  predikant_id: string;
  naam: string;
  van: string;
  totale_punte: number;
}

// VBO Activities as per NHKA requirements
const NHKA_VBO_AKTIWITEITE: VBOAktiwiteit[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    titel: 'VTT Fisies Bygewoon',
    beskrywing: 'Bywoning van die Voortgesette Teologiese Toerusting (VTT) geleentheid in persoon. Dit is die NHKA se vlagskipgeleentheid vir predikante.',
    tipe: 'konferensie',
    krediete: 30,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    titel: 'VTT Aanlyn',
    beskrywing: 'Aanlyn deelname aan die Voortgesette Teologiese Toerusting (VTT) sessies.',
    tipe: 'konferensie',
    krediete: 15,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    titel: 'Predikantevergadering',
    beskrywing: 'Bywoning van die amptelike predikantevergadering.',
    tipe: 'konferensie',
    krediete: 8,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    titel: 'Ringskomitee Predikante Bygewoon',
    beskrywing: 'Bywoning van ringskomitee vergaderings vir predikante.',
    tipe: 'konferensie',
    krediete: 5,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    titel: 'NGK Lentekonferensie',
    beskrywing: 'Bywoning van die NGK Lentekonferensie of soortgelyke kongres.',
    tipe: 'konferensie',
    krediete: 30,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    titel: 'Fresh Expressions',
    beskrywing: 'Deelname aan Fresh Expressions opleiding of werkwinkel.',
    tipe: 'werkwinkel',
    krediete: 15,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    titel: 'Aanbiedings (Gesprek met die Bybel, VTT\'s)',
    beskrywing: 'Aanbieding van sessies soos Gesprek met die Bybel, VTT sessies, of soortgelyke opvoedkundige geleenthede.',
    tipe: 'ander',
    krediete: 10,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: ACTIVITY_IDS.INTERNASIONALE_KONFERENSIE,
    titel: 'Internasionale Beroepsverwante Konferensie',
    beskrywing: 'Bywoning van internasionale beroepsverwante konferensies. Aansoek word voorgelê en op meriete beoordeel.',
    tipe: 'konferensie',
    krediete: 0, // Op meriete beoordeel
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    titel: 'Artikel Geskryf (HTS/THT)',
    beskrywing: 'Publikasie van \'n teologiese artikel in HTS Teologiese Studies of Tydskrif vir Hervormde Teologie.',
    tipe: 'publikasie',
    krediete: 30,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    titel: 'Eweknie-evaluasie',
    beskrywing: 'Deelname aan eweknie-evaluasie proses met mede-predikante.',
    tipe: 'mentorskap',
    krediete: 10,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    titel: 'Dagstukkies - Bybelse Dagboek (Radio)',
    beskrywing: 'Skryf van dagstukkies vir die Bybelse Dagboek radio-uitsending.',
    tipe: 'publikasie',
    krediete: 20,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    titel: 'Boek/Akademiese Artikel Gelees',
    beskrywing: 'Lees van \'n teologiese boek of akademiese artikel met \'n kort opsomming as bewys.',
    tipe: 'navorsing',
    krediete: 4,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
    titel: 'Artikel vir Die Hervormer',
    beskrywing: 'Skryf van \'n artikel vir Die Hervormer kerkblad.',
    tipe: 'publikasie',
    krediete: 4,
    bewyse_verplig: true,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: ACTIVITY_IDS.LMS_KURSUS,
    titel: 'LMS Kursus Voltooi',
    beskrywing: 'Voltooiing van \'n goedgekeurde kursus op die Leerbestuur Stelsel (LMS). Krediete word outomaties toegeken.',
    tipe: 'kursus',
    krediete: 5,
    bewyse_verplig: false,
    aktief: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const KREDIETE_DOELWIT = 150; // 150 krediete oor drie jaar

interface DBVBOIndiening {
  id: string;
  predikant_id: string;
  aktiwiteit_id: string;
  aktiwiteit_titel: string;
  aktiwiteit_tipe: string;
  krediete: number;
  status: string;
  notas?: string;
  bewys_url?: string;
  bewys_naam?: string;
  moderator_id?: string;
  moderator_notas?: string;
  goedgekeur_op?: string;
  jaar: number;
  is_outomaties: boolean;
  kursus_id?: string;
  created_at: string;
  updated_at: string;
}

const VBO: React.FC = () => {
  const { currentUser, kursusse } = useNHKA();

  const [activeTab, setActiveTab] = useState<'my-krediete' | 'aktiwiteite' | 'indienings' | 'bestuur'>('my-krediete');
  const [loading, setLoading] = useState(true);
  const [aktiwiteite, setAktiwiteite] = useState<VBOAktiwiteit[]>([]);
  const [myIndienings, setMyIndienings] = useState<VBOIndiening[]>([]);
  const [alleIndienings, setAlleIndienings] = useState<VBOIndiening[]>([]);
  const [historicalPoints, setHistoricalPoints] = useState<VBOHistoriesePunte[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal states
  const [showAddAktiwiteit, setShowAddAktiwiteit] = useState(false);
  const [showEditAktiwiteit, setShowEditAktiwiteit] = useState(false);
  const [editingAktiwiteit, setEditingAktiwiteit] = useState<VBOAktiwiteit | null>(null);
  const [showIndiening, setShowIndiening] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAktiwiteit, setSelectedAktiwiteit] = useState<VBOAktiwiteit | null>(null);
  const [selectedIndiening, setSelectedIndiening] = useState<VBOIndiening | null>(null);

  // Form states
  const [newAktiwiteit, setNewAktiwiteit] = useState({
    titel: '',
    beskrywing: '',
    tipe: 'kursus' as VBOAktiwiteitTipe,
    krediete: 1,
    kursus_id: '',
    bewyse_verplig: true
  });

  const [indieningForm, setIndieningForm] = useState({
    notas: '',
    bewysFile: null as File | null,
    krediete_aangevra: 0
  });

  const [reviewForm, setReviewForm] = useState({
    status: 'goedgekeur' as VBOIndieningStatus,
    notas: '',
    krediete_toegeken: 0
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPredikantUser = currentUser?.rol === 'predikant';
  const isHoofAdminUser = currentUser?.rol === 'hoof_admin';
  const isModeratorUser = isModerator(currentUser?.rol || 'lidmaat');

  // Hoof admin and moderators see management view, predikants see their credits
  // hoof_admin should always see management view
  const showManagementView = isHoofAdminUser || (isModeratorUser && !isPredikantUser);

  // Set default tab based on user role
  useEffect(() => {
    if (showManagementView) {
      setActiveTab('indienings');
    } else if (isPredikantUser) {
      setActiveTab('my-krediete');
    }
  }, [showManagementView, isPredikantUser]);

  // Calculate total credits for selected year
  const totaleKrediete = myIndienings
    .filter(i => i.status === 'goedgekeur' && new Date(i.created_at).getFullYear() === selectedYear)
    .reduce((sum, i) => sum + (i.aktiwiteit?.krediete || 0), 0);

  const hangendeIndienings = myIndienings.filter(i => i.status === 'hangende').length;
  const kredietPersentasie = Math.min((totaleKrediete / KREDIETE_DOELWIT) * 100, 100);

  // Load data
  useEffect(() => {
    loadData();
  }, [currentUser, selectedYear]);

  const loadData = async () => {
    setLoading(true);

    let activitiesList: VBOAktiwiteit[] = NHKA_VBO_AKTIWITEITE;

    // Fetch activities from database (hoof_admin/moderator can create new ones)
    try {
      const { data: aktData, error: aktError } = await supabase
        .from('vbo_aktiwiteite')
        .select('*')
        .order('titel', { ascending: true });

      if (!aktError && aktData?.length) {
        activitiesList = aktData.map((a: any) => ({
          id: a.id,
          titel: a.titel,
          beskrywing: a.beskrywing,
          tipe: a.tipe as VBOAktiwiteitTipe,
          krediete: a.krediete ?? 0,
          kursus_id: a.kursus_id,
          bewyse_verplig: a.bewyse_verplig ?? true,
          aktief: a.aktief ?? true,
          created_at: a.created_at,
          updated_at: a.updated_at
        }));
      }
      setAktiwiteite(activitiesList);
    } catch {
      setAktiwiteite(NHKA_VBO_AKTIWITEITE);
    }

    // Load real submissions from database
    if (currentUser?.id) {
      try {
        // Fetch user's own submissions
        const { data: myData, error: myError } = await supabase
          .from('vbo_indienings')
          .select('*')
          .eq('predikant_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!myError && myData) {
          // Convert DB format to VBOIndiening format
          const converted: VBOIndiening[] = myData.map((item: DBVBOIndiening) => {
            const aktiwiteit = activitiesList.find(a => a.id === item.aktiwiteit_id) || {
              id: item.aktiwiteit_id,
              titel: item.aktiwiteit_titel,
              beskrywing: '',
              tipe: item.aktiwiteit_tipe as VBOAktiwiteitTipe,
              krediete: item.krediete,
              bewyse_verplig: false,
              aktief: true,
              created_at: item.created_at,
              updated_at: item.updated_at
            };

            return {
              id: item.id,
              predikant_id: item.predikant_id,
              aktiwiteit_id: item.aktiwiteit_id,
              aktiwiteit: { ...aktiwiteit, krediete: item.krediete },
              status: item.status as VBOIndieningStatus,
              notas: item.notas,
              bewys_url: item.bewys_url,
              bewys_naam: item.bewys_naam,
              moderator_notas: item.moderator_notas,
              goedgekeur_op: item.goedgekeur_op,
              created_at: item.created_at,
              updated_at: item.updated_at
            };
          });
          setMyIndienings(converted);
        }

        // Fetch historical points for predikant
        const { data: histData } = await supabase
          .from('vbo_historiese_punte')
          .select('*')
          .eq('predikant_id', currentUser.id)
          .order('jaar', { ascending: false });

        setHistoricalPoints(histData || []);

        // For moderators and hoof_admin, fetch all submissions
        if (showManagementView) {
          const { data: allData, error: allError } = await supabase
            .from('vbo_indienings')
            .select('*')
            .order('created_at', { ascending: false });

          if (!allError && allData) {
            // Fetch predikant info for each submission
            const predikantIds = [...new Set(allData.map((item: DBVBOIndiening) => item.predikant_id))];
            const { data: predikante } = await supabase
              .from('gebruikers')
              .select('id, naam, van, rol')
              .in('id', predikantIds);

            const predikantMap = new Map(predikante?.map(p => [p.id, p]) || []);

            const converted: VBOIndiening[] = allData.map((item: DBVBOIndiening) => {
              const aktiwiteit = activitiesList.find(a => a.id === item.aktiwiteit_id) || {
                id: item.aktiwiteit_id,
                titel: item.aktiwiteit_titel,
                beskrywing: '',
                tipe: item.aktiwiteit_tipe as VBOAktiwiteitTipe,
                krediete: item.krediete,
                bewyse_verplig: false,
                aktief: true,
                created_at: item.created_at,
                updated_at: item.updated_at
              };

              const predikant = predikantMap.get(item.predikant_id);

              return {
                id: item.id,
                predikant_id: item.predikant_id,
                aktiwiteit_id: item.aktiwiteit_id,
                aktiwiteit: { ...aktiwiteit, krediete: item.krediete },
                predikant: predikant ? {
                  id: predikant.id,
                  naam: predikant.naam,
                  van: predikant.van,
                  rol: predikant.rol,
                  aktief: true,
                  created_at: '',
                  updated_at: ''
                } : undefined,
                status: item.status as VBOIndieningStatus,
                notas: item.notas,
                bewys_url: item.bewys_url,
                bewys_naam: item.bewys_naam,
                moderator_notas: item.moderator_notas,
                goedgekeur_op: item.goedgekeur_op,
                created_at: item.created_at,
                updated_at: item.updated_at
              };
            });
            setAlleIndienings(converted);
          }
        }
      } catch (error) {
        console.error('Error loading VBO data:', error);
      }

      // Fetch data for leaderboard (excluding historical points as requested)
      try {
        const { data: allApprovedIndienings } = await supabase
          .from('vbo_indienings')
          .select('predikant_id, krediete, status')
          .eq('status', 'goedgekeur');

        // Calculate leaderboard
        if (allApprovedIndienings) {
          const scores = new Map<string, number>();

          // Process current system submissions (approved only)
          allApprovedIndienings.forEach(ind => {
            if (ind.predikant_id) {
              const current = scores.get(ind.predikant_id) || 0;
              scores.set(ind.predikant_id, current + (ind.krediete || 0));
            }
          });

          // Historical points are excluded from leaderboard as per request

          const lb: LeaderboardEntry[] = [];

          scores.forEach((score, id) => {
            lb.push({
              predikant_id: id,
              naam: 'Anoniem', // Default
              van: '',
              totale_punte: score
            });
          });

          lb.sort((a, b) => b.totale_punte - a.totale_punte);
          setLeaderboard(lb);
        }
      } catch (err) {
        console.error("Error fetching leaderboard data", err);
      }
    }

    setLoading(false);
  };

  const handleAddAktiwiteit = async () => {
    if (!newAktiwiteit.titel || !newAktiwiteit.beskrywing) {
      toast.error('Titel en beskrywing is verpligtend');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vbo_aktiwiteite')
        .insert({
          titel: newAktiwiteit.titel,
          beskrywing: newAktiwiteit.beskrywing,
          tipe: newAktiwiteit.tipe,
          krediete: newAktiwiteit.krediete,
          kursus_id: newAktiwiteit.kursus_id || null,
          bewyse_verplig: newAktiwiteit.bewyse_verplig,
          aktief: true,
          created_by: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setShowAddAktiwiteit(false);
      setNewAktiwiteit({
        titel: '',
        beskrywing: '',
        tipe: 'kursus',
        krediete: 1,
        kursus_id: '',
        bewyse_verplig: true
      });
      toast.success('Aktiwiteit suksesvol bygevoeg');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie aktiwiteit stoor nie');
    }
    setSaving(false);
  };

  const handleUpdateAktiwiteit = async () => {
    if (!editingAktiwiteit) return;
    if (!editingAktiwiteit.titel || !editingAktiwiteit.beskrywing) {
      toast.error('Titel en beskrywing is verpligtend');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vbo_aktiwiteite')
        .update({
          titel: editingAktiwiteit.titel,
          beskrywing: editingAktiwiteit.beskrywing,
          tipe: editingAktiwiteit.tipe,
          krediete: editingAktiwiteit.krediete,
          kursus_id: editingAktiwiteit.kursus_id || null,
          bewyse_verplig: editingAktiwiteit.bewyse_verplig,
          aktief: editingAktiwiteit.aktief,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAktiwiteit.id);
      if (error) throw error;
      toast.success('Aktiwiteit opgedateer');
      setShowEditAktiwiteit(false);
      setEditingAktiwiteit(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie aktiwiteit opdateer nie');
    }
    setSaving(false);
  };

  const handleToggleAktiwiteitAktief = async (aktiwiteit: VBOAktiwiteit) => {
    try {
      const { error } = await supabase
        .from('vbo_aktiwiteite')
        .update({ aktief: !aktiwiteit.aktief, updated_at: new Date().toISOString() })
        .eq('id', aktiwiteit.id);
      if (error) throw error;
      toast.success(aktiwiteit.aktief ? 'Aktiwiteit gedeaktiveer' : 'Aktiwiteit geaktiveer');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Kon nie status verander nie');
    }
  };

  const handleSubmitIndiening = async () => {
    console.log('Starting submission process...', { selectedAktiwiteit, currentUser, indieningForm });

    if (!selectedAktiwiteit || !currentUser) {
      toast.error('Sessie verval of geen aktiwiteit gekies');
      return;
    }

    if (selectedAktiwiteit.bewyse_verplig && !indieningForm.bewysFile) {
      toast.error('Bewys lêer is verpligtend vir hierdie aktiwiteit');
      return;
    }

    setSaving(true);

    // Upload file to storage if provided
    let bewysUrl = '';
    let bewysNaam = '';

    if (indieningForm.bewysFile) {
      try {
        const fileExt = indieningForm.bewysFile.name.split('.').pop();
        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;

        console.log('Uploading file:', fileName);

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('vbo-bewyse')
          .upload(fileName, indieningForm.bewysFile);

        if (uploadError) {
          console.error('Upload error detail:', uploadError);
          toast.error(`Kon nie bewys oplaai nie: ${uploadError.message}`);
          setSaving(false);
          return;
        }

        const { data } = supabase.storage
          .from('vbo-bewyse')
          .getPublicUrl(fileName);

        bewysUrl = data.publicUrl;
        bewysNaam = indieningForm.bewysFile.name;
        console.log('File uploaded successfully, URL:', bewysUrl);

      } catch (err) {
        console.error('File upload exception:', err);
        toast.error('Onverwagte fout met lêer oplaai');
        setSaving(false);
        return;
      }
    }

    // Insert into database
    // Insert into database
    const krediete = selectedAktiwiteit.id === ACTIVITY_IDS.INTERNASIONALE_KONFERENSIE
      ? indieningForm.krediete_aangevra
      : selectedAktiwiteit.krediete;

    const payload = {
      predikant_id: currentUser.id,
      aktiwiteit_id: selectedAktiwiteit.id,
      aktiwiteit_titel: selectedAktiwiteit.titel,
      aktiwiteit_tipe: selectedAktiwiteit.tipe,
      krediete: krediete,
      status: 'hangende',
      notas: indieningForm.notas,
      bewys_url: bewysUrl || null,
      bewys_naam: bewysNaam || null,
      jaar: new Date().getFullYear(),
      is_outomaties: false
    };

    console.log('Inserting payload:', payload);

    try {
      const { error, data } = await supabase
        .from('vbo_indienings')
        .insert([payload])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Submission successful:', data);
      toast.success('Indiening suksesvol gestuur vir goedkeuring');
      await loadData();
    } catch (error: any) {
      console.error('Error submitting to DB:', error);
      toast.error(`Kon nie indiening stoor nie: ${error.message || error}`);
    }

    setShowIndiening(false);
    setSelectedAktiwiteit(null);
    setIndieningForm({ notas: '', bewysFile: null, krediete_aangevra: 0 });
    setSaving(false);
  };

  const handleReviewIndiening = async () => {
    if (!selectedIndiening || !currentUser) return;

    setSaving(true);

    try {
      const updateData: any = {
        status: reviewForm.status,
        moderator_id: currentUser.id,
        moderator_notas: reviewForm.notas,
        updated_at: new Date().toISOString()
      };

      if (reviewForm.status === 'goedgekeur') {
        updateData.goedgekeur_op = new Date().toISOString();
        // Hoof_admin en moderator kan krediete vir alle indienings oorskryf
        updateData.krediete = reviewForm.krediete_toegeken;
      }

      const { error } = await supabase
        .from('vbo_indienings')
        .update(updateData)
        .eq('id', selectedIndiening.id);

      if (error) throw error;

      toast.success(`Indiening ${reviewForm.status === 'goedgekeur' ? 'goedgekeur' : 'afgekeur'}`);
      await loadData();
    } catch (error) {
      console.error('Error reviewing:', error);
      toast.error('Kon nie indiening opdateer nie');
    }

    setShowReviewModal(false);
    setSelectedIndiening(null);
    setReviewForm({ status: 'goedgekeur', notas: '', krediete_toegeken: 0 });
    setSaving(false);
  };

  const getStatusBadge = (status: VBOIndieningStatus) => {
    switch (status) {
      case 'goedgekeur':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Goedgekeur
          </span>
        );
      case 'afgekeur':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Afgekeur
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Hangende
          </span>
        );
    }
  };

  const getTipeBadge = (tipe: VBOAktiwiteitTipe) => {
    const colors: Record<VBOAktiwiteitTipe, string> = {
      kursus: 'bg-blue-100 text-blue-700',
      konferensie: 'bg-purple-100 text-purple-700',
      werkwinkel: 'bg-orange-100 text-orange-700',
      mentorskap: 'bg-pink-100 text-pink-700',
      navorsing: 'bg-teal-100 text-teal-700',
      publikasie: 'bg-indigo-100 text-indigo-700',
      ander: 'bg-gray-100 text-gray-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[tipe]}`}>
        {getVBOAktiwiteitTipeLabel(tipe)}
      </span>
    );
  };

  const getAktiwiteitIcon = (tipe: VBOAktiwiteitTipe) => {
    switch (tipe) {
      case 'kursus':
        return <GraduationCap className="w-5 h-5" />;
      case 'konferensie':
        return <Users className="w-5 h-5" />;
      case 'werkwinkel':
        return <Video className="w-5 h-5" />;
      case 'mentorskap':
        return <UserCheck className="w-5 h-5" />;
      case 'navorsing':
        return <Book className="w-5 h-5" />;
      case 'publikasie':
        return <PenTool className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  // Determine which tabs to show
  const tabs = [
    ...(isPredikantUser ? [
      { id: 'my-krediete', label: 'My Krediete', icon: <Award className="w-4 h-4" /> },
      { id: 'aktiwiteite', label: 'Aktiwiteite', icon: <BookOpen className="w-4 h-4" /> }
    ] : []),
    ...(isModeratorUser ? [
      { id: 'indienings', label: 'Indienings (Bestuur)', icon: <FileText className="w-4 h-4" /> },
      { id: 'bestuur', label: 'Aktiwiteite Bestuur', icon: <Edit2 className="w-4 h-4" /> }
    ] : [])
  ];

  // Set default tab if current tab is not accessible
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id as any);
    }
  }, [tabs.length, isPredikantUser, isModeratorUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#D4A84B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#002855]">VBO Krediete</h1>
        <p className="text-gray-600">Bestuur jou Voortgesette Bedieningsopleiding krediete</p>
      </div>

      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.id
              ? 'bg-[#002855] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Krediete Tab - Predikant View */}
      {
        activeTab === 'my-krediete' && isPredikantUser && (
          <div className="space-y-4">
            {/* Stats Overview */}
            {/* Stats Overview - Blue & Gold Banner */}
            {/* Stats Overview - Blue & Gold Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002855] to-[#003d7a] p-6 md:p-8 text-white shadow-lg">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A84B]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8B7CB3]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left Section: Main Stats */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#D4A84B]/20 rounded-lg">
                      <Award className="w-6 h-6 text-[#D4A84B]" />
                    </div>
                    <p className="text-[#D4A84B] font-medium">VBO Vordering</p>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <h3 className="text-4xl font-bold">{totaleKrediete}</h3>
                    <span className="text-white/60">/ {KREDIETE_DOELWIT} krediete</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-sm">
                      <span className="text-white/80">150 krediete oor drie jaar</span>
                      <span className="font-bold text-[#D4A84B]">{Math.round(kredietPersentasie)}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                      <div
                        className="h-full bg-[#D4A84B] rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${kredietPersentasie}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Secondary Stats & Leaderboard Mini */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-[#D4A84B]" />
                        <span className="text-sm font-bold text-white/90">Hangende</span>
                      </div>
                      <p className="text-2xl font-bold">{hangendeIndienings}</p>
                    </div>

                    {/* My Position Box */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-colors cursor-pointer" onClick={() => document.getElementById('leaderboard-section')?.scrollIntoView({ behavior: 'smooth' })}>
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[#D4A84B]" />
                        <span className="text-sm font-bold text-white/90">Ranglys</span>
                      </div>
                      <p className="text-2xl font-bold">
                        #{leaderboard.findIndex(l => l.predikant_id === currentUser?.id) + 1 || '-'}
                      </p>
                      <p className="text-xs text-white/60">van {leaderboard.length} predikante</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            {leaderboard.length > 0 && (
              <div id="leaderboard-section" className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <h3 className="font-bold text-[#002855] text-lg mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#D4A84B]" />
                  Predikant Ranglys (Top 10)
                </h3>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 pb-2">
                    {leaderboard.slice(0, 10).map((entry, idx) => {
                      const isMe = entry.predikant_id === currentUser?.id;
                      return (
                        <div key={idx} className={`flex-shrink-0 w-28 p-4 rounded-xl border-2 transition-transform hover:scale-105 ${isMe ? 'bg-[#002855] border-[#002855] text-white shadow-xl scale-105 ring-4 ring-[#D4A84B]/20' : 'bg-white border-gray-100 text-gray-600 shadow-sm'} flex flex-col items-center text-center relative overflow-hidden`}>
                          {idx < 3 && (
                            <div className="absolute top-0 right-0 p-1">
                              <Sparkles className={`w-3 h-3 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`} />
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-2 shadow-inner ${isMe ? 'bg-[#D4A84B] text-[#002855]' : idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
                            {idx + 1}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">
                            {isMe ? 'Jy' : 'Predikant'}
                          </span>
                          <span className={`text-lg font-black ${isMe ? 'text-[#D4A84B]' : 'text-[#002855]'}`}>
                            {entry.totale_punte}
                          </span>
                          <span className="text-[10px] opacity-60">kri</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Historical Data Section */}
            {historicalPoints.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mt-6">
                <h3 className="font-bold text-[#002855] text-lg mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#D4A84B]" />
                  Historiese Data
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500">Jaar</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500">Beskrywing</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500">Punte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {historicalPoints.map((point) => (
                        <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{point.jaar}</td>
                          <td className="px-4 py-3 text-gray-600">{point.beskrywing || 'Historiese data invoer'}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#D4A84B]">{point.punte}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <h3 className="font-semibold text-[#002855] mt-6">My Indienings ({selectedYear})</h3>

            {
              myIndienings.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Jy het nog geen indienings nie</p>
                  <p className="text-sm text-gray-400 mt-1">Klik op "Aktiwiteite" om beskikbare aktiwiteite te sien</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myIndienings.map(indiening => (
                    <div key={indiening.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {getTipeBadge(indiening.aktiwiteit?.tipe || 'ander')}
                            {getStatusBadge(indiening.status)}
                            {indiening.aktiwiteit_id === ACTIVITY_IDS.LMS_KURSUS && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4A84B]/10 text-[#D4A84B] text-xs font-medium rounded-full">
                                <Sparkles className="w-3 h-3" />
                                Outomaties
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-[#002855]">{indiening.aktiwiteit?.titel}</h4>
                          {indiening.notas && (
                            <p className="text-sm text-gray-600 mt-1">{indiening.notas}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Ingedien: {new Date(indiening.created_at).toLocaleDateString('af-ZA')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#D4A84B]">
                            {indiening.aktiwiteit?.krediete || '?'}
                          </p>
                          <p className="text-xs text-gray-500">krediete</p>
                        </div>
                      </div>

                      {indiening.bewys_naam && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{indiening.bewys_naam}</span>
                          </div>
                        </div>
                      )}

                      {indiening.moderator_notas && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Moderator Notas:</span> {indiening.moderator_notas}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </div >
        )
      }

      {/* Aktiwiteite Tab - Predikant View */}
      {
        activeTab === 'aktiwiteite' && isPredikantUser && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">VBO Kredietevereistes</p>
                <p className="text-sm text-blue-700 mt-1">
                  Predikante moet 150 krediete oor drie jaar verdien. Kies aktiwiteite hieronder en dien bewyse in vir goedkeuring.
                  <br />
                  <span className="font-medium">Let wel:</span> LMS kursusse wat as VBO-geskik gemerk is, ken outomaties krediete toe by voltooiing.
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-[#002855]">Beskikbare Aktiwiteite</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aktiwiteite.filter(a => a.aktief).map(aktiwiteit => {
                const alreadySubmitted = myIndienings.some(
                  i => i.aktiwiteit_id === aktiwiteit.id &&
                    new Date(i.created_at).getFullYear() === selectedYear &&
                    i.status !== 'afgekeur'
                );
                const isInternational = aktiwiteit.id === 'internasionale-konferensie';
                const isLMS = aktiwiteit.id === 'lms-kursus';

                return (
                  <div key={aktiwiteit.id} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow flex flex-col ${isLMS ? 'border-[#D4A84B]/30' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${aktiwiteit.tipe === 'konferensie' ? 'bg-purple-100 text-purple-600' :
                        aktiwiteit.tipe === 'publikasie' ? 'bg-indigo-100 text-indigo-600' :
                          aktiwiteit.tipe === 'kursus' ? 'bg-blue-100 text-blue-600' :
                            aktiwiteit.tipe === 'werkwinkel' ? 'bg-orange-100 text-orange-600' :
                              aktiwiteit.tipe === 'mentorskap' ? 'bg-pink-100 text-pink-600' :
                                aktiwiteit.tipe === 'navorsing' ? 'bg-teal-100 text-teal-600' :
                                  'bg-gray-100 text-gray-600'
                        }`}>
                        {getAktiwiteitIcon(aktiwiteit.tipe)}
                      </div>
                      <div className="text-right">
                        {isInternational ? (
                          <p className="text-sm font-medium text-amber-600">Op meriete</p>
                        ) : (
                          <>
                            <p className="text-xl font-bold text-[#D4A84B]">{aktiwiteit.krediete}</p>
                            <p className="text-xs text-gray-500">krediete</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mb-2 flex gap-2 flex-wrap">
                      {getTipeBadge(aktiwiteit.tipe)}
                      {isLMS && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#D4A84B]/10 text-[#D4A84B]">
                          Outomaties
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-[#002855] mb-2">{aktiwiteit.titel}</h4>
                    <p className="text-sm text-gray-600 mb-4 flex-1">{aktiwiteit.beskrywing}</p>

                    {aktiwiteit.bewyse_verplig && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mb-3">
                        <Upload className="w-3 h-3" />
                        Bewys verpligtend
                      </div>
                    )}

                    {isLMS ? (
                      <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
                        Voltooi VBO-geskikte kursusse in Geloofsgroei
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAktiwiteit(aktiwiteit);
                          setIndieningForm({
                            ...indieningForm,
                            krediete_aangevra: aktiwiteit.krediete
                          });
                          setShowIndiening(true);
                        }}
                        disabled={alreadySubmitted}
                        className={`w-full py-2 rounded-lg font-medium transition-colors ${alreadySubmitted
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d]'
                          }`}
                      >
                        {alreadySubmitted ? 'Reeds Ingedien' : 'Dien In'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      }

      {/* Indienings Tab - Moderator View */}
      {
        activeTab === 'indienings' && showManagementView && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#002855]">Hangende Indienings</h3>
            </div>

            {alleIndienings.filter(i => i.status === 'hangende').length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">Geen hangende indienings nie</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alleIndienings.filter(i => i.status === 'hangende').map(indiening => (
                  <div key={indiening.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTipeBadge(indiening.aktiwiteit?.tipe || 'ander')}
                          {getStatusBadge(indiening.status)}
                        </div>
                        <h4 className="font-semibold text-[#002855]">{indiening.aktiwiteit?.titel}</h4>
                        <p className="text-sm text-[#D4A84B] font-medium mt-1">
                          {indiening.predikant?.naam} {indiening.predikant?.van}
                        </p>
                        {indiening.notas && (
                          <p className="text-sm text-gray-600 mt-2">{indiening.notas}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Ingedien: {new Date(indiening.created_at).toLocaleDateString('af-ZA')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#D4A84B]">
                          {indiening.aktiwiteit?.krediete || '?'}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">krediete</p>
                        <button
                          onClick={() => {
                            setSelectedIndiening(indiening);
                            setReviewForm({
                              ...reviewForm,
                              krediete_toegeken: indiening.aktiwiteit?.krediete || 0
                            });
                            setShowReviewModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#002855] text-white text-sm font-medium rounded-lg hover:bg-[#001d40] transition-colors"
                        >
                          Hersien
                        </button>
                      </div>
                    </div>

                    {indiening.bewys_naam && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <a
                          href={indiening.bewys_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#002855] hover:text-[#D4A84B] transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{indiening.bewys_naam}</span>
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* All Submissions History */}
            <div className="mt-8">
              <h3 className="font-semibold text-[#002855] mb-4">Alle Indienings</h3>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Predikant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aktiwiteit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Krediete</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {alleIndienings.map(indiening => (
                      <tr key={indiening.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {indiening.predikant?.naam} {indiening.predikant?.van}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {indiening.aktiwiteit?.titel}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#D4A84B]">
                          {indiening.aktiwiteit?.krediete || '?'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(indiening.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(indiening.created_at).toLocaleDateString('af-ZA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {/* Bestuur Tab - Hoof_admin en Moderator View */}
      {
        activeTab === 'bestuur' && showManagementView && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#002855]">Aktiwiteite Bestuur</h3>
              <button
                onClick={() => setShowAddAktiwiteit(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nuwe Aktiwiteit
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Titel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Krediete</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bewys</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {aktiwiteite.map(aktiwiteit => (
                    <tr key={aktiwiteit.id} className={`hover:bg-gray-50 ${!aktiwiteit.aktief ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{aktiwiteit.titel}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{aktiwiteit.beskrywing}</p>
                      </td>
                      <td className="px-4 py-3">
                        {getTipeBadge(aktiwiteit.tipe)}
                      </td>
                      <td className="px-4 py-3 text-lg font-bold text-[#D4A84B]">
                        {aktiwiteit.krediete === 0 ? 'Op meriete' : aktiwiteit.krediete}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {aktiwiteit.bewyse_verplig ? 'Ja' : 'Nee'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${aktiwiteit.aktief ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {aktiwiteit.aktief ? 'Aktief' : 'Onaktief'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingAktiwiteit({ ...aktiwiteit }); setShowEditAktiwiteit(true); }}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Wysig"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAktiwiteitAktief(aktiwiteit)}
                            className={`p-1.5 rounded-lg transition-colors ${aktiwiteit.aktief ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-green-100 text-green-600'}`}
                            title={aktiwiteit.aktief ? 'Deaktiveer' : 'Aktiveer'}
                          >
                            {aktiwiteit.aktief ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Add Aktiwiteit Modal */}
      {
        showAddAktiwiteit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Nuwe VBO Aktiwiteit</h2>
                <button
                  onClick={() => setShowAddAktiwiteit(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={newAktiwiteit.titel}
                    onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, titel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    placeholder="bv. Jaarlikse Sinodale Konferensie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing *</label>
                  <textarea
                    value={newAktiwiteit.beskrywing}
                    onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, beskrywing: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                    placeholder="Beskryf die aktiwiteit..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                    <div className="relative">
                      <select
                        value={newAktiwiteit.tipe}
                        onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, tipe: e.target.value as VBOAktiwiteitTipe })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                      >
                        <option value="kursus">LMS Kursus</option>
                        <option value="konferensie">Konferensie</option>
                        <option value="werkwinkel">Werkwinkel</option>
                        <option value="mentorskap">Mentorskap</option>
                        <option value="navorsing">Navorsing</option>
                        <option value="publikasie">Publikasie</option>
                        <option value="ander">Ander</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Krediete</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={newAktiwiteit.krediete}
                      onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, krediete: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = Op meriete beoordeel</p>
                  </div>
                </div>

                {newAktiwiteit.tipe === 'kursus' && kursusse.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gekoppelde LMS Kursus</label>
                    <div className="relative">
                      <select
                        value={newAktiwiteit.kursus_id}
                        onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, kursus_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none appearance-none bg-white"
                      >
                        <option value="">Kies kursus...</option>
                        {kursusse.map(k => (
                          <option key={k.id} value={k.id}>{k.titel}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bewyse_verplig"
                    checked={newAktiwiteit.bewyse_verplig}
                    onChange={(e) => setNewAktiwiteit({ ...newAktiwiteit, bewyse_verplig: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#D4A84B] focus:ring-[#D4A84B]"
                  />
                  <label htmlFor="bewyse_verplig" className="text-sm text-gray-700">
                    Bewys lêer verpligtend
                  </label>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddAktiwiteit(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleAddAktiwiteit}
                  disabled={saving}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Stoor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Stoor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Aktiwiteit Modal */}
      {
        showEditAktiwiteit && editingAktiwiteit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Wysig VBO Aktiwiteit</h2>
                <button onClick={() => { setShowEditAktiwiteit(false); setEditingAktiwiteit(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={editingAktiwiteit.titel}
                    onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, titel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beskrywing *</label>
                  <textarea
                    value={editingAktiwiteit.beskrywing}
                    onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, beskrywing: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                    <select
                      value={editingAktiwiteit.tipe}
                      onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, tipe: e.target.value as VBOAktiwiteitTipe })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none bg-white"
                    >
                      <option value="kursus">LMS Kursus</option>
                      <option value="konferensie">Konferensie</option>
                      <option value="werkwinkel">Werkwinkel</option>
                      <option value="mentorskap">Mentorskap</option>
                      <option value="navorsing">Navorsing</option>
                      <option value="publikasie">Publikasie</option>
                      <option value="ander">Ander</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Krediete</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editingAktiwiteit.krediete}
                      onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, krediete: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAktiwiteit.bewyse_verplig}
                      onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, bewyse_verplig: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#D4A84B]"
                    />
                    <span className="text-sm text-gray-700">Bewys verpligtend</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAktiwiteit.aktief}
                      onChange={(e) => setEditingAktiwiteit({ ...editingAktiwiteit, aktief: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#D4A84B]"
                    />
                    <span className="text-sm text-gray-700">Aktief</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button onClick={() => { setShowEditAktiwiteit(false); setEditingAktiwiteit(null); }} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                  Kanselleer
                </button>
                <button onClick={handleUpdateAktiwiteit} disabled={saving} className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Stoor</>}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Submit Indiening Modal */}
      {
        showIndiening && selectedAktiwiteit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Dien Aktiwiteit In</h2>
                <button
                  onClick={() => {
                    setShowIndiening(false);
                    setSelectedAktiwiteit(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-[#002855]/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getTipeBadge(selectedAktiwiteit.tipe)}
                    <span className="text-lg font-bold text-[#D4A84B]">
                      {selectedAktiwiteit.krediete === 0 ? 'Op meriete' : `${selectedAktiwiteit.krediete} krediete`}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#002855]">{selectedAktiwiteit.titel}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedAktiwiteit.beskrywing}</p>
                </div>

                {selectedAktiwiteit.id === 'internasionale-konferensie' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Krediete Aangevra</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={indieningForm.krediete_aangevra}
                      onChange={(e) => setIndieningForm({ ...indieningForm, krediete_aangevra: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Moderator sal finale krediete bepaal</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas *</label>
                  <textarea
                    value={indieningForm.notas}
                    onChange={(e) => setIndieningForm({ ...indieningForm, notas: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                    placeholder="Beskryf wanneer en waar die aktiwiteit plaasgevind het..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bewys Lêer {selectedAktiwiteit.bewyse_verplig && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setIndieningForm({ ...indieningForm, bewysFile: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#D4A84B] transition-colors"
                  >
                    {indieningForm.bewysFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-[#D4A84B]" />
                        <span className="text-gray-700">{indieningForm.bewysFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Klik om lêer op te laai</p>
                        <p className="text-xs text-gray-400">PDF, JPG, PNG (maks 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowIndiening(false);
                    setSelectedAktiwiteit(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleSubmitIndiening}
                  disabled={saving || !indieningForm.notas}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dien In...
                    </>
                  ) : (
                    'Dien In'
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Review Modal */}
      {
        showReviewModal && selectedIndiening && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Hersien Indiening</h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedIndiening(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-[#002855]/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getTipeBadge(selectedIndiening.aktiwiteit?.tipe || 'ander')}
                    <span className="text-lg font-bold text-[#D4A84B]">
                      {selectedIndiening.aktiwiteit?.krediete === 0 ? 'Op meriete' : `${selectedIndiening.aktiwiteit?.krediete} krediete`}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#002855]">{selectedIndiening.aktiwiteit?.titel}</h3>
                  <p className="text-sm text-[#D4A84B] font-medium mt-2">
                    {selectedIndiening.predikant?.naam} {selectedIndiening.predikant?.van}
                  </p>
                </div>

                {selectedIndiening.notas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Predikant Notas</label>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedIndiening.notas}</p>
                  </div>
                )}

                {selectedIndiening.bewys_naam && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bewys Lêer</label>
                    <a
                      href={selectedIndiening.bewys_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#002855] hover:text-[#D4A84B] transition-colors bg-gray-50 rounded-lg p-3"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{selectedIndiening.bewys_naam}</span>
                      <Eye className="w-4 h-4 ml-auto" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Krediete Toe te Ken {selectedIndiening.aktiwiteit?.krediete === 0 ? '(op meriete)' : '(kan oorskryf)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={reviewForm.krediete_toegeken}
                    onChange={(e) => setReviewForm({ ...reviewForm, krediete_toegeken: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
                  />
                  {selectedIndiening.aktiwiteit?.krediete === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Bepaal die krediete gebaseer op die meriete van die indiening</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Besluit</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReviewForm({ ...reviewForm, status: 'goedgekeur' })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${reviewForm.status === 'goedgekeur'
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                        }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Goedkeur
                    </button>
                    <button
                      onClick={() => setReviewForm({ ...reviewForm, status: 'afgekeur' })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${reviewForm.status === 'afgekeur'
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                        }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Keur Af
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moderator Notas</label>
                  <textarea
                    value={reviewForm.notas}
                    onChange={(e) => setReviewForm({ ...reviewForm, notas: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                    placeholder="Voeg notas by vir die predikant..."
                  />
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedIndiening(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleReviewIndiening}
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${reviewForm.status === 'goedgekeur'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verwerk...
                    </>
                  ) : reviewForm.status === 'goedgekeur' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Goedkeur
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Keur Af
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default VBO;
