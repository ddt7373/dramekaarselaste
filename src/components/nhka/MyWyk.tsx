import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Gebruiker, getAksieLabel, isRestrictedLeader, UserRole, Dagstukkie, getOuderdom, getLidmaatDisplayNaam } from '@/types/nhka';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Heart,
  X,
  Check,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  Cake,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckCircle2,
  BookOpen,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

// Helper function to determine if user should see "Gemeente" instead of "My Wyk"
const shouldSeeGemeente = (rol: UserRole): boolean => {
  return ['predikant', 'subadmin', 'admin', 'hoof_admin', 'moderator'].includes(rol);
};

// WhatsApp SVG Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Helper function to format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('27') && cleaned.length === 9) {
    cleaned = '27' + cleaned;
  }
  return cleaned;
};

// Helper function to create WhatsApp URL with pre-filled message
const createWhatsAppUrl = (phone: string, memberName: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const message = encodeURIComponent(`Hallo ${memberName}, groete van jou wyksleier. Hoe gaan dit met jou?`);
  return `https://wa.me/${formattedPhone}?text=${message}`;
};

// Helper to get upcoming birthdays
const getUpcomingBirthdays = (members: Gebruiker[], days: number = 30): Gebruiker[] => {
  const today = new Date();
  return members.filter(m => {
    if (!m.geboortedatum) return false;
    const bday = new Date(m.geboortedatum);
    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (thisYearBday < today) {
      thisYearBday.setFullYear(today.getFullYear() + 1);
    }
    const diffDays = Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  }).sort((a, b) => {
    const aDate = new Date(a.geboortedatum!);
    const bDate = new Date(b.geboortedatum!);
    const aThisYear = new Date(today.getFullYear(), aDate.getMonth(), aDate.getDate());
    const bThisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
    if (aThisYear < today) aThisYear.setFullYear(today.getFullYear() + 1);
    if (bThisYear < today) bThisYear.setFullYear(today.getFullYear() + 1);
    return aThisYear.getTime() - bThisYear.getTime();
  });
};

// Helper to calculate days until birthday
const getDaysUntilBirthday = (geboortedatum: string): number => {
  const today = new Date();
  const bday = new Date(geboortedatum);
  const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYearBday < today) {
    thisYearBday.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Message templates
const messageTemplates = [
  { id: 'groet', label: 'Algemene Groet', message: 'Hallo! Groete van jou wyksleier. Ek wil net hoor hoe dit met jou gaan. Laat weet gerus as daar enigiets is waarmee ek kan help.' },
  { id: 'uitnodiging', label: 'Erediens Uitnodiging', message: 'Hallo! Ons nooi jou hartlik uit na die erediens hierdie Sondag. Ons sien uit daarna om jou daar te sien!' },
  { id: 'bemoediging', label: 'Bemoediging', message: 'Hallo! Net \'n boodskap om jou te laat weet dat ons aan jou dink. Mag die Here jou seën en krag gee vir elke dag.' },
  { id: 'dankbaarheid', label: 'Dankbaarheid', message: 'Hallo! Baie dankie vir jou betrokkenheid by die gemeente. Jou bydrae word opreg waardeer!' },
  { id: 'siekte', label: 'Siekte/Herstel', message: 'Hallo! Ons het gehoor dat jy nie lekker voel nie. Ons bid vir jou spoedige herstel. Laat weet as ons enigsins kan help.' },
];

const MyWyk: React.FC = () => {
  const { currentUser, currentGemeente, gebruikers, aksies, addGebruiker, addPastoraleAksie, sendBemoediging } = useNHKA();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAksieModal, setShowAksieModal] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Gebruiker | null>(null);
  const [newMember, setNewMember] = useState({ naam: '', van: '', selfoon: '', epos: '', adres: '', geboortedatum: '' });
  const [newAksie, setNewAksie] = useState({ tipe: 'besoek' as 'besoek' | 'boodskap' | 'gebed' | 'oproep', nota: '' });

  // Communication state
  const [showKommunikasie, setShowKommunikasie] = useState(true);
  const [kommunikasieMessage, setKommunikasieMessage] = useState('');
  const [kommunikasieRecipients, setKommunikasieRecipients] = useState<'all' | 'selected'>('all');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendMethod, setSendMethod] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'almal' | 'kerkraad'>('almal');
  const [whatsappGroupName, setWhatsappGroupName] = useState('');
  const [dagstukkies, setDagstukkies] = useState<Dagstukkie[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (currentGemeente) {
      fetchLatestDagstukkies();
    }
  }, [currentGemeente]);

  const fetchLatestDagstukkies = async () => {
    if (!currentGemeente) return;
    try {
      const { data: erediens } = await supabase
        .from('erediens_info')
        .select('id')
        .eq('gemeente_id', currentGemeente.id)
        .order('sondag_datum', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (erediens) {
        const { data: dagData } = await supabase
          .from('dagstukkies')
          .select('*')
          .eq('erediens_id', erediens.id)
          .order('created_at');
        if (dagData) setDagstukkies(dagData);
      }
    } catch (error) {
      console.error('Error fetching dagstukkies:', error);
    }
  };

  const today = new Date();
  const dayNames = ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'];
  const todayName = dayNames[today.getDay()];
  const todayDagstukkie = dagstukkies.find(d => d.dag === todayName);

  const copyDagstukkie = (dagstukkie: Dagstukkie) => {
    const text = `*${dagstukkie.dag}: ${dagstukkie.titel}*\n\n${dagstukkie.inhoud}\n\n📖 ${dagstukkie.skrifverwysing}`;
    navigator.clipboard.writeText(text);
    setCopiedId(dagstukkie.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Dagstukkie gekopieer');
  };

  const shareDagstukkie = async (dagstukkie: Dagstukkie) => {
    const text = `*${dagstukkie.dag}: ${dagstukkie.titel}*\n\n${dagstukkie.inhoud}\n\n📖 ${dagstukkie.skrifverwysing}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    // Record action for all members in current view
    for (const member of wykMembers) {
      addPastoraleAksie({
        gebruiker_id: member.id,
        leier_id: currentUser.id,
        tipe: 'boodskap',
        datum: new Date().toISOString().split('T')[0],
        nota: `Dagstukkie gedeel via WhatsApp: ${dagstukkie.titel}`
      });
    }
    toast.success('Dagstukkie gedeel - aksies aangeteken');
  };

  if (!currentUser) return null;

  // Determine page title based on user role
  const pageTitle = shouldSeeGemeente(currentUser.rol) ? 'Gemeente' : 'My Wyk';
  const pageDescription = shouldSeeGemeente(currentUser.rol)
    ? 'Bestuur en versorg die gemeente se lidmate'
    : 'Bestuur en versorg jou wyk se lidmate';

  const wykMembers = gebruikers.filter(g => {
    // If kerkraad view is active (only for high-level roles)
    if (shouldSeeGemeente(currentUser.rol) && viewMode === 'kerkraad') {
      const isLeader = ['ouderling', 'diaken', 'groepleier', 'kerkraad'].includes(g.rol);
      if (!isLeader) return false;
    } else {
      // Basic role check for "Almal" or ward view - only show lidmate
      if (g.rol !== 'lidmaat') return false;
    }

    // Search term check
    const matchesSearch = g.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.van.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Role-based restriction check
    if (isRestrictedLeader(currentUser.rol)) {
      // If user is a restricted leader, they can ONLY see members in their ward
      return g.wyk_id === currentUser.wyk_id && currentUser.wyk_id !== undefined && currentUser.wyk_id !== null;
    }

    // For admins/ministers, show everyone in the congregation (unless it's church council view)
    return true;
  });

  const membersWithPhone = wykMembers.filter(m => m.selfoon);
  const upcomingBirthdays = getUpcomingBirthdays(wykMembers, 30);

  const getContactStatus = (member: Gebruiker) => {
    const memberAksies = aksies.filter(a => a.gebruiker_id === member.id);
    const latestActionDate = memberAksies.length > 0
      ? new Date(Math.max(...memberAksies.map(a => new Date(a.datum).getTime())))
      : null;

    const dbContactDate = member.laaste_kontak ? new Date(member.laaste_kontak) : null;

    let laaste_kontak_datum = dbContactDate;
    if (latestActionDate && (!laaste_kontak_datum || latestActionDate > laaste_kontak_datum)) {
      laaste_kontak_datum = latestActionDate;
    }

    if (!laaste_kontak_datum) return { status: 'danger', label: 'Nog nooit', days: 999 };

    const now = new Date();
    const d1 = new Date(laaste_kontak_datum.getFullYear(), laaste_kontak_datum.getMonth(), laaste_kontak_datum.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { status: 'success', label: 'Vandag', days: 0 };
    if (diffDays <= 30) return { status: 'success', label: `${diffDays} dae gelede`, days: diffDays };
    if (diffDays <= 60) return { status: 'warning', label: `${diffDays} dae gelede`, days: diffDays };
    return { status: 'danger', label: `${diffDays} dae gelede`, days: diffDays };
  };

  const getMemberAksies = (memberId: string) => aksies.filter(a => a.gebruiker_id === memberId).slice(0, 3);

  const handleAddMember = async () => {
    if (!newMember.naam || !newMember.van) { toast.error('Naam en van is verpligtend'); return; }
    await addGebruiker({ ...newMember, rol: 'lidmaat', aktief: true });
    setNewMember({ naam: '', van: '', selfoon: '', epos: '', adres: '', geboortedatum: '' });
    setShowAddModal(false);
    toast.success('Lidmaat suksesvol bygevoeg');
  };

  const handleAddAksie = async () => {
    if (!selectedMember || !newAksie.nota) { toast.error('Kies \'n lidmaat en voeg \'n nota by'); return; }
    await addPastoraleAksie({ gebruiker_id: selectedMember.id, leier_id: currentUser.id, tipe: newAksie.tipe, datum: new Date().toISOString().split('T')[0], nota: newAksie.nota });
    setNewAksie({ tipe: 'besoek', nota: '' });
    setShowAksieModal(false);
    setSelectedMember(null);
    toast.success('Pastorale aksie geregistreer');
  };

  // Get recipients based on selection
  const getRecipientsList = (): Gebruiker[] => {
    if (kommunikasieRecipients === 'all') {
      return membersWithPhone;
    }
    return wykMembers.filter(m => selectedRecipients.includes(m.id) && m.selfoon);
  };

  // Handle sending communication
  const handleSendKommunikasie = async () => {
    const recipients = getRecipientsList();
    if (recipients.length === 0) {
      toast.error('Geen ontvangers met selfoonnommers gekies nie');
      return;
    }
    if (!kommunikasieMessage.trim()) {
      toast.error('Skryf asseblief \'n boodskap');
      return;
    }

    setSendingMessage(true);

    try {
      const finalMessage = whatsappGroupName
        ? `*${whatsappGroupName}*\n\n${kommunikasieMessage}`
        : kommunikasieMessage;

      if (sendMethod === 'sms') {
        const result = await sendBemoediging(recipients, kommunikasieMessage);
        if (result.success) {
          for (const member of recipients) {
            await addPastoraleAksie({
              gebruiker_id: member.id,
              leier_id: currentUser.id,
              tipe: 'boodskap',
              datum: new Date().toISOString().split('T')[0],
              nota: `Kmass: ${kommunikasieMessage.substring(0, 50)}...`
            });
          }
          toast.success(`SMS gestuur aan ${result.sent} lidmate`);
          setKommunikasieMessage('');
          setSelectedRecipients([]);
        } else {
          toast.error('Kon nie SMS stuur nie');
        }
      } else {
        // WhatsApp logic
        if (recipients.length > 1) {
          // Send as a group (single picker)
          const url = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
          window.open(url, '_blank');

          // Record action for all selected members
          for (const member of recipients) {
            await addPastoraleAksie({
              gebruiker_id: member.id,
              leier_id: currentUser.id,
              tipe: 'boodskap',
              datum: new Date().toISOString().split('T')[0],
              nota: `WhatsApp Groep (${whatsappGroupName || 'Geen naam'}): ${kommunikasieMessage.substring(0, 50)}...`
            });
          }
        } else {
          // Individual WhatsApp
          const member = recipients[0];
          const url = `https://wa.me/${formatPhoneForWhatsApp(member.selfoon!)}?text=${encodeURIComponent(kommunikasieMessage)}`;
          window.open(url, '_blank');

          await addPastoraleAksie({
            gebruiker_id: member.id,
            leier_id: currentUser.id,
            tipe: 'boodskap',
            datum: new Date().toISOString().split('T')[0],
            nota: `WhatsApp: ${kommunikasieMessage.substring(0, 50)}...`
          });
        }
        toast.success(`WhatsApp geopen vir ${recipients.length > 1 ? 'groep' : 'lidmaat'}`);
        setKommunikasieMessage('');
        setSelectedRecipients([]);
      }
    } catch (error) {
      toast.error('Fout met boodskap versending');
    } finally {
      setSendingMessage(false);
    }
  };

  // Toggle recipient selection
  const toggleRecipient = (memberId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setKommunikasieMessage(template.message);
    }
  };

  const sendBirthdayWish = (member: Gebruiker) => {
    if (!member.selfoon) {
      toast.error('Geen selfoonnommer beskikbaar nie');
      return;
    }
    const message = `Baie geluk met jou verjaarsdag, ${getLidmaatDisplayNaam(member)}! Mag die Here jou seën op hierdie spesiale dag en in die jaar wat voorlê. Groete van jou gemeente.`;
    const url = `https://wa.me/${formatPhoneForWhatsApp(member.selfoon)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Record action
    addPastoraleAksie({
      gebruiker_id: member.id,
      leier_id: currentUser.id,
      tipe: 'boodskap',
      datum: new Date().toISOString().split('T')[0],
      nota: 'Verjaarsdag wense gestuur'
    });
  };

  const handleWhatsAppSingle = (member: Gebruiker) => {
    if (!member.selfoon) return;
    const url = createWhatsAppUrl(member.selfoon, getLidmaatDisplayNaam(member));
    window.open(url, '_blank');

    // Record action
    addPastoraleAksie({
      gebruiker_id: member.id,
      leier_id: currentUser.id,
      tipe: 'boodskap',
      datum: new Date().toISOString().split('T')[0],
      nota: 'WhatsApp kontak vanaf My Wyk lys'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855]">{pageTitle}</h1>
          <p className="text-gray-500">{pageDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {upcomingBirthdays.length > 0 && (
            <button onClick={() => setShowBirthdayModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors shadow-lg">
              <Cake className="w-5 h-5" />
              Verjaarsdae ({upcomingBirthdays.length})
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] font-semibold rounded-xl hover:bg-[#c49a3d] transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            Voeg By
          </button>
        </div>
      </div>

      {/* Minister View Toggle */}
      {shouldSeeGemeente(currentUser.rol) && (
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('almal')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'almal'
              ? 'bg-white text-[#002855] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            My Gemeente
          </button>
          <button
            onClick={() => setViewMode('kerkraad')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'kerkraad'
              ? 'bg-white text-[#002855] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            My Kerkraad/Groepleiers
          </button>
        </div>
      )}

      {/* Communication Section */}
      <div className="bg-gradient-to-br from-[#002855] to-[#003d7a] rounded-2xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowKommunikasie(!showKommunikasie)}
          className="w-full flex items-center justify-between p-4 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-lg">Kommunikasie</h2>
              <p className="text-sm text-white/70">Stuur boodskappe aan jou wykslede</p>
            </div>
          </div>
          {showKommunikasie ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showKommunikasie && (
          <div className="p-4 pt-0 space-y-4">
            {/* Send Method Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setSendMethod('whatsapp')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium transition-all ${sendMethod === 'whatsapp'
                  ? 'bg-[#25D366] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={() => setSendMethod('sms')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium transition-all ${sendMethod === 'sms'
                  ? 'bg-[#8B7CB3] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </button>
            </div>

            {/* Recipients Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Ontvangers</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setKommunikasieRecipients('all'); setSelectedRecipients([]); }}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${kommunikasieRecipients === 'all'
                    ? 'bg-[#D4A84B] text-[#002855]'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                >
                  Alle Wykslede ({membersWithPhone.length})
                </button>
                <button
                  onClick={() => { setKommunikasieRecipients('selected'); setShowRecipientPicker(true); }}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${kommunikasieRecipients === 'selected'
                    ? 'bg-[#D4A84B] text-[#002855]'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                >
                  Spesifieke Lede {selectedRecipients.length > 0 && `(${selectedRecipients.length})`}
                </button>
              </div>

              {/* Selected Recipients Display */}
              {kommunikasieRecipients === 'selected' && selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRecipients.map(id => {
                    const member = wykMembers.find(m => m.id === id);
                    if (!member) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 text-white text-sm rounded-lg"
                      >
                        {getLidmaatDisplayNaam(member)}
                        <button
                          onClick={() => toggleRecipient(id)}
                          className="hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    onClick={() => setShowRecipientPicker(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20"
                  >
                    <Plus className="w-3 h-3" />
                    Voeg by
                  </button>
                </div>
              )}
            </div>

            {/* Message Templates */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Vinnige Sjablone</label>
              <div className="flex flex-wrap gap-2">
                {messageTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className="px-3 py-1.5 bg-white/10 text-white/80 text-sm rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Boodskap</label>
              <textarea
                value={kommunikasieMessage}
                onChange={(e) => setKommunikasieMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none resize-none"
                rows={4}
                placeholder="Skryf jou boodskap hier..."
                maxLength={sendMethod === 'sms' ? 300 : 1000}
              />
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{kommunikasieMessage.length}/{sendMethod === 'sms' ? 300 : 1000} karakters</span>
                {sendMethod === 'whatsapp' && (
                  <span>WhatsApp sal vir elke ontvanger oopmaak</span>
                )}
              </div>
            </div>

            {/* WhatsApp Group Guidance */}
            {sendMethod === 'whatsapp' && (kommunikasieRecipients === 'all' || selectedRecipients.length > 1) && (
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#D4A84B] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/90">
                    <p className="font-bold mb-1">WhatsApp Groep Boodskap</p>
                    <p>Onthou om eers die groep in jou WhatsApp toepassing te skep voordat jy stuur. Dit verseker dat die boodskap aan almal gelyktydig gaan.</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">Groepnaam (Opsioneel)</label>
                  <input
                    type="text"
                    value={whatsappGroupName}
                    onChange={(e) => setWhatsappGroupName(e.target.value)}
                    placeholder="Bv. Wyk 12 / Kerkraad"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4A84B] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendKommunikasie}
              disabled={sendingMessage || getRecipientsList().length === 0 || !kommunikasieMessage.trim()}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${sendMethod === 'whatsapp'
                ? 'bg-[#25D366] text-white hover:bg-[#20bd5a]'
                : 'bg-[#8B7CB3] text-white hover:bg-[#7a6ba0]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sendingMessage ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Stuur...
                </>
              ) : (
                <>
                  {sendMethod === 'whatsapp' ? <WhatsAppIcon className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  {sendMethod === 'whatsapp' && (kommunikasieRecipients === 'all' || selectedRecipients.length > 1)
                    ? `Stuur aan WhatsApp Groep ${whatsappGroupName ? `"${whatsappGroupName}"` : ''}`
                    : `Stuur ${sendMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} aan ${getRecipientsList().length} ${getRecipientsList().length === 1 ? 'lid' : 'lede'}`}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Dagstukkie Section */}
      {todayDagstukkie && (
        <div className="bg-[#8B7CB3]/10 border border-[#8B7CB3]/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B7CB3]" />
              <h3 className="font-semibold text-[#002855]">Dagstukkie vir Vandag</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyDagstukkie(todayDagstukkie)}
                className="p-2 rounded-lg hover:bg-white transition-colors"
                title="Kopieer teks"
              >
                {copiedId === todayDagstukkie.id ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#8B7CB3]" />}
              </button>
              <button
                onClick={() => shareDagstukkie(todayDagstukkie)}
                className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                title="Deel op WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#002855] mb-2">{todayDagstukkie.titel}</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{todayDagstukkie.inhoud}</p>
            <p className="text-sm text-[#8B7CB3] font-medium mt-3 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {todayDagstukkie.skrifverwysing}
            </p>
          </div>
          <p className="text-xs text-[#8B7CB3] mt-2">Deel hierdie dagstukkie met jou wyk of groep!</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#7A8450]"><Check className="w-5 h-5" /><span className="text-2xl font-bold">{wykMembers.filter(m => getContactStatus(m).status === 'success').length}</span></div>
          <p className="text-xs text-gray-500 mt-1">Onlangs besoek</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#D4A84B]"><Clock className="w-5 h-5" /><span className="text-2xl font-bold">{wykMembers.filter(m => getContactStatus(m).status === 'warning').length}</span></div>
          <p className="text-xs text-gray-500 mt-1">Besoek nodig</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#9E2A2B]"><AlertCircle className="w-5 h-5" /><span className="text-2xl font-bold">{wykMembers.filter(m => getContactStatus(m).status === 'danger').length}</span></div>
          <p className="text-xs text-gray-500 mt-1">Dringend</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-pink-500"><Cake className="w-5 h-5" /><span className="text-2xl font-bold">{upcomingBirthdays.length}</span></div>
          <p className="text-xs text-gray-500 mt-1">Verjaarsdae (30 dae)</p>
        </div>
      </div>

      {/* Soek bokant lidmate */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Soek op naam of van..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20 outline-none"
        />
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {wykMembers.length > 0 ? wykMembers.map(member => {
          const contactStatus = getContactStatus(member);
          const memberAksies = getMemberAksies(member.id);
          const daysUntilBirthday = member.geboortedatum ? getDaysUntilBirthday(member.geboortedatum) : null;
          const hasBirthdaySoon = daysUntilBirthday !== null && daysUntilBirthday <= 7;

          return (
            <div key={member.id} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow ${hasBirthdaySoon ? 'border-pink-300 bg-pink-50/30' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#002855] flex items-center justify-center flex-shrink-0 relative">
                    <span className="text-white font-bold text-lg">{(member.noemnaam || member.naam || '')[0]}{(member.van || '')[0]}</span>
                    {hasBirthdaySoon && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                        <Cake className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {getLidmaatDisplayNaam(member)}
                        {getOuderdom(member.geboortedatum, member.ouderdom) != null && (
                          <span className="text-gray-500 font-normal ml-1">({getOuderdom(member.geboortedatum, member.ouderdom)} jaar)</span>
                        )}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${contactStatus.status === 'success' ? 'bg-[#7A8450]/10 text-[#7A8450]' : contactStatus.status === 'warning' ? 'bg-[#D4A84B]/10 text-[#D4A84B]' : 'bg-[#9E2A2B]/10 text-[#9E2A2B]'}`}>{contactStatus.label}</span>
                      {hasBirthdaySoon && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-600">
                          {daysUntilBirthday === 0 ? 'Vandag!' : `Oor ${daysUntilBirthday} dae`}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      {member.selfoon && <a href={`tel:${member.selfoon}`} className="flex items-center gap-1 hover:text-[#002855]"><Phone className="w-4 h-4" />{member.selfoon}</a>}
                      {member.epos && <a href={`mailto:${member.epos}`} className="flex items-center gap-1 hover:text-[#002855]"><Mail className="w-4 h-4" /><span className="truncate max-w-[150px]">{member.epos}</span></a>}
                    </div>
                    {member.adres && <p className="flex items-center gap-1 mt-1 text-sm text-gray-400"><MapPin className="w-4 h-4 flex-shrink-0" /><span className="truncate">{member.adres}</span></p>}
                    {memberAksies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {memberAksies.map(aksie => <span key={aksie.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[#8B7CB3]/10 text-[#8B7CB3] rounded-lg"><Heart className="w-3 h-3" />{getAksieLabel(aksie.tipe)} - {new Date(aksie.datum).toLocaleDateString('af-ZA', { day: 'numeric', month: 'short' })}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasBirthdaySoon && member.selfoon && (
                    <button onClick={() => sendBirthdayWish(member)} className="p-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-sm" title="Stuur Verjaarsdag Wense">
                      <Cake className="w-5 h-5" />
                    </button>
                  )}
                  {member.selfoon && (
                    <button
                      onClick={() => handleWhatsAppSingle(member)}
                      className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors shadow-sm"
                      title="Stuur WhatsApp"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => { setSelectedMember(member); setShowAksieModal(true); }} className="p-2 rounded-lg bg-[#D4A84B] text-[#002855] hover:bg-[#c49a3d] transition-colors" title="Registreer Aksie"><Heart className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen lidmate gevind</h3>
            <p className="text-gray-500 mb-4">{searchTerm ? 'Probeer \'n ander soekterm' : 'Begin deur lidmate by te voeg'}</p>
          </div>
        )}
      </div>

      {/* Recipient Picker Modal */}
      {
        showRecipientPicker && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-[#002855]">Kies Ontvangers</h2>
                  <p className="text-sm text-gray-500">{selectedRecipients.length} gekies</p>
                </div>
                <button onClick={() => setShowRecipientPicker(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setSelectedRecipients(membersWithPhone.map(m => m.id))}
                    className="text-sm text-[#002855] hover:underline"
                  >
                    Kies Almal
                  </button>
                  <button
                    onClick={() => setSelectedRecipients([])}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Verwyder Almal
                  </button>
                </div>
                <div className="space-y-2">
                  {membersWithPhone.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedRecipients.includes(member.id)
                        ? 'bg-[#002855]/10 border-2 border-[#002855]'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedRecipients.includes(member.id)
                        ? 'bg-[#002855] text-white'
                        : 'bg-gray-200'
                        }`}>
                        {selectedRecipients.includes(member.id) && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(member.id)}
                        onChange={() => toggleRecipient(member.id)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{getLidmaatDisplayNaam(member)}</p>
                        <p className="text-sm text-gray-500">{member.selfoon}</p>
                      </div>
                    </label>
                  ))}
                  {membersWithPhone.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Geen lidmate met selfoonnommers nie</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button onClick={() => setShowRecipientPicker(false)} className="flex-1 py-2 px-4 rounded-xl bg-[#002855] text-white font-semibold hover:bg-[#001a3d]">
                  Klaar ({selectedRecipients.length} gekies)
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Birthday Modal */}
      {
        showBirthdayModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Cake className="w-5 h-5 text-pink-500" />
                  <h2 className="text-lg font-bold text-[#002855]">Komende Verjaarsdae</h2>
                </div>
                <button onClick={() => setShowBirthdayModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {upcomingBirthdays.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBirthdays.map(member => {
                      const daysUntil = getDaysUntilBirthday(member.geboortedatum!);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                              <span className="text-white font-bold">{(member.noemnaam || member.naam || '')[0]}{(member.van || '')[0]}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {getLidmaatDisplayNaam(member)}
                                {getOuderdom(member.geboortedatum, member.ouderdom) != null && (
                                  <span className="text-gray-500 font-normal ml-1">({getOuderdom(member.geboortedatum, member.ouderdom)} jaar)</span>
                                )}
                              </p>
                              <p className="text-sm text-pink-600">{daysUntil === 0 ? 'Vandag!' : daysUntil === 1 ? 'Môre' : `Oor ${daysUntil} dae`}</p>
                            </div>
                          </div>
                          {member.selfoon && (
                            <button onClick={() => sendBirthdayWish(member)} className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors" title="Stuur Wense">
                              <WhatsAppIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Geen komende verjaarsdae nie</p>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Add Member Modal */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#002855]">Nuwe Lidmaat</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label><input type="text" value={newMember.naam} onChange={(e) => setNewMember({ ...newMember, naam: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none" placeholder="Voornaam" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Van *</label><input type="text" value={newMember.van} onChange={(e) => setNewMember({ ...newMember, van: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none" placeholder="Van" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Selfoon</label><input type="tel" value={newMember.selfoon} onChange={(e) => setNewMember({ ...newMember, selfoon: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none" placeholder="082 123 4567" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">E-pos</label><input type="email" value={newMember.epos} onChange={(e) => setNewMember({ ...newMember, epos: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none" placeholder="epos@voorbeeld.co.za" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum</label><input type="date" value={newMember.geboortedatum} onChange={(e) => setNewMember({ ...newMember, geboortedatum: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Adres</label><input type="text" value={newMember.adres} onChange={(e) => setNewMember({ ...newMember, adres: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none" placeholder="Straat, Stad" /></div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Kanselleer</button>
                <button onClick={handleAddMember} className="flex-1 py-2 px-4 rounded-xl bg-[#D4A84B] text-[#002855] font-semibold hover:bg-[#c49a3d]">Voeg By</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Add Aksie Modal */}
      {
        showAksieModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div><h2 className="text-lg font-bold text-[#002855]">Pastorale Aksie</h2><p className="text-sm text-gray-500">{getLidmaatDisplayNaam(selectedMember)}</p></div>
                <button onClick={() => { setShowAksieModal(false); setSelectedMember(null); }} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Tipe Aksie</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['besoek', 'boodskap', 'gebed', 'oproep'] as const).map(tipe => (
                      <button key={tipe} onClick={() => setNewAksie({ ...newAksie, tipe })} className={`p-3 rounded-xl border-2 text-sm font-medium ${newAksie.tipe === tipe ? 'border-[#D4A84B] bg-[#D4A84B]/10 text-[#002855]' : 'border-gray-200 text-gray-600 hover:border-[#D4A84B]/50'}`}>
                        {getAksieLabel(tipe)}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nota</label><textarea value={newAksie.nota} onChange={(e) => setNewAksie({ ...newAksie, nota: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#D4A84B] outline-none resize-none" rows={4} placeholder="Beskryf die aksie..." /></div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button onClick={() => { setShowAksieModal(false); setSelectedMember(null); }} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Kanselleer</button>
                <button onClick={handleAddAksie} className="flex-1 py-2 px-4 rounded-xl bg-[#7A8450] text-white font-semibold hover:bg-[#6a7445]">Registreer</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default MyWyk;
