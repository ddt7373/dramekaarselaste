import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { 
  Bedieningsbehoefte, 
  BedieningsbehoefteTipe, 
  BedieningsbehoefeRegistrasie,
  getBedieningsbehoefteTipeLabel,
  isPredikant
} from '@/types/nhka';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Church, 
  Bell, 
  BellOff, 
  Check, 
  AlertCircle,
  Heart,
  Stethoscope,
  BookOpen,
  HelpCircle,
  RefreshCw,
  PlusCircle,
  HandHeart,
  Trash2,
  Eye,
  Phone,
  MessageCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const BedieningsBehoeftes: React.FC = () => {
  const { currentUser, currentGemeente } = useNHKA();
  const [behoeftes, setBehoeftes] = useState<Bedieningsbehoefte[]>([]);
  const [myBehoeftes, setMyBehoeftes] = useState<Bedieningsbehoefte[]>([]);
  const [registrasie, setRegistrasie] = useState<BedieningsbehoefeRegistrasie | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedBehoefte, setSelectedBehoefte] = useState<Bedieningsbehoefte | null>(null);
  const [activeTab, setActiveTab] = useState('alle');
  const [mainTab, setMainTab] = useState<'alle' | 'my-behoeftes'>('alle');

  // Form state for new behoefte
  const [formData, setFormData] = useState({
    tipe: 'preekbeurt' as BedieningsbehoefteTipe,
    ander_beskrywing: '',
    beskrywing: '',
    datum: '',
    tyd: '',
    plek: '',
    kontaknommer: ''
  });

  // Form state for fulfill dialog
  const [fulfillKontaknommer, setFulfillKontaknommer] = useState('');

  // Permission: ALL logged in users can create behoeftes
  const canAddBehoefte = !!currentUser;
  
  const canFulfillBehoefte = currentUser && isPredikant(currentUser.rol);


  // Fetch all open behoeftes
  const fetchBehoeftes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bedieningsbehoeftes')
        .select('*')
        .eq('status', 'oop')
        .order('datum', { ascending: true });

      if (error) throw error;
      setBehoeftes(data || []);
    } catch (error: any) {
      console.error('Error fetching behoeftes:', error);
      toast.error('Kon nie behoeftes laai nie');
    } finally {
      setLoading(false);
    }
  };

  // Fetch my behoeftes (ones I created)
  const fetchMyBehoeftes = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('bedieningsbehoeftes')
        .select('*')
        .eq('aanmelder_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyBehoeftes(data || []);
    } catch (error: any) {
      console.error('Error fetching my behoeftes:', error);
    }
  };

  // Check if current user is registered for notifications
  const checkRegistration = async () => {
    if (!currentUser || !isPredikant(currentUser.rol)) return;

    try {
      const { data, error } = await supabase
        .from('bedieningsbehoefte_registrasies')
        .select('*')
        .eq('predikant_id', currentUser.id)
        .single();

      if (!error && data) {
        setRegistrasie(data);
      }
    } catch (error) {
      // No registration found, that's fine
    }
  };

  useEffect(() => {
    fetchBehoeftes();
    fetchMyBehoeftes();
    checkRegistration();
  }, [currentUser]);

  // Toggle registration for notifications
  const toggleRegistration = async () => {
    if (!currentUser || !currentGemeente) return;

    try {
      if (registrasie) {
        // Unregister
        const { error } = await supabase
          .from('bedieningsbehoefte_registrasies')
          .delete()
          .eq('id', registrasie.id);

        if (error) throw error;
        setRegistrasie(null);
        toast.success('Jy sal nie meer kennisgewings ontvang nie');
      } else {
        // Register
        const { data, error } = await supabase
          .from('bedieningsbehoefte_registrasies')
          .insert([{
            predikant_id: currentUser.id,
            predikant_naam: `${currentUser.naam} ${currentUser.van}`,
            predikant_email: currentUser.epos,
            gemeente_id: currentGemeente.id,
            gemeente_naam: currentGemeente.naam,
            ontvang_kennisgewings: true
          }])
          .select()
          .single();

        if (error) throw error;
        setRegistrasie(data);
        toast.success('Jy is nou geregistreer vir kennisgewings');
      }
      setShowRegisterDialog(false);
    } catch (error: any) {
      console.error('Error toggling registration:', error);
      toast.error('Kon nie registrasie opdateer nie');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      tipe: 'preekbeurt',
      ander_beskrywing: '',
      beskrywing: '',
      datum: '',
      tyd: '',
      plek: '',
      kontaknommer: currentUser?.selfoon || ''
    });
  };

  // Open add dialog
  const openAddDialog = () => {
    if (!currentUser) {
      toast.error('Jy moet eers inteken om \'n bedieningsbehoefte te skep');
      return;
    }
    if (!currentGemeente) {
      toast.error('Kies eers \'n gemeente om \'n bedieningsbehoefte te skep');
      return;
    }
    // Pre-fill contact number from user profile
    setFormData(prev => ({
      ...prev,
      kontaknommer: currentUser.selfoon || ''
    }));
    setShowAddDialog(true);
  };

  // Format phone number for WhatsApp (remove spaces, add country code if needed)
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 27 (South Africa)
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }
    
    // If doesn't start with country code, add 27
    if (!cleaned.startsWith('27') && cleaned.length === 9) {
      cleaned = '27' + cleaned;
    }
    
    return cleaned;
  };

  // Open WhatsApp with pre-filled message
  const openWhatsApp = (phone: string, behoefte: Bedieningsbehoefte, isForRequester: boolean = false) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    let message = '';
    if (isForRequester) {
      // Message from helper to requester
      message = `Goeiedag! Ek reageer op jou bedieningsbehoefte:\n\n` +
        `*Tipe:* ${behoefte.tipe === 'ander' && behoefte.ander_beskrywing ? behoefte.ander_beskrywing : getBedieningsbehoefteTipeLabel(behoefte.tipe)}\n` +
        `*Datum:* ${formatDate(behoefte.datum)}\n` +
        `*Tyd:* ${behoefte.tyd}\n` +
        `*Plek:* ${behoefte.plek}\n\n` +
        `Ek is beskikbaar om te help. Kontak my asseblief vir meer besonderhede.`;
    } else {
      // Message from requester to helper
      message = `Goeiedag! Dankie dat jy aangebied het om te help met die bedieningsbehoefte:\n\n` +
        `*Tipe:* ${behoefte.tipe === 'ander' && behoefte.ander_beskrywing ? behoefte.ander_beskrywing : getBedieningsbehoefteTipeLabel(behoefte.tipe)}\n` +
        `*Datum:* ${formatDate(behoefte.datum)}\n` +
        `*Tyd:* ${behoefte.tyd}\n` +
        `*Plek:* ${behoefte.plek}`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Add new behoefte
  const handleAddBehoefte = async () => {
    if (!currentUser || !currentGemeente) {
      toast.error('Jy moet ingeteken wees en \'n gemeente gekies het');
      return;
    }

    if (!formData.beskrywing || !formData.datum || !formData.tyd || !formData.plek) {
      toast.error('Vul asb. alle verpligte velde in');
      return;
    }

    if (!formData.kontaknommer) {
      toast.error('Verskaf asb. \'n kontaknommer sodat mense jou kan kontak');
      return;
    }

    if (formData.tipe === 'ander' && !formData.ander_beskrywing) {
      toast.error('Spesifiseer asb. die tipe behoefte');
      return;
    }

    try {
      const { error } = await supabase
        .from('bedieningsbehoeftes')
        .insert([{
          gemeente_id: currentGemeente.id,
          gemeente_naam: currentGemeente.naam,
          aanmelder_id: currentUser.id,
          aanmelder_naam: `${currentUser.naam} ${currentUser.van}`,
          tipe: formData.tipe,
          ander_beskrywing: formData.tipe === 'ander' ? formData.ander_beskrywing : null,
          beskrywing: formData.beskrywing,
          datum: formData.datum,
          tyd: formData.tyd,
          plek: formData.plek,
          kontaknommer: formData.kontaknommer,
          status: 'oop'
        }]);

      if (error) throw error;

      toast.success('Bedieningsbehoefte suksesvol aangemeld');
      setShowAddDialog(false);
      resetForm();
      fetchBehoeftes();
      fetchMyBehoeftes();

      // Send push notification to registered predikante
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            type: 'bedieningsbehoefte',
            title: 'Nuwe Bedieningsbehoefte',
            body: `${currentGemeente.naam} het 'n ${getBedieningsbehoefteTipeLabel(formData.tipe)} nodig op ${formData.datum}`,
            data: { type: 'bedieningsbehoefte' }
          }
        });
      } catch (notifError) {
        console.log('Could not send notification:', notifError);
      }
    } catch (error: any) {
      console.error('Error adding behoefte:', error);
      toast.error('Kon nie behoefte aanmeld nie');
    }
  };

  // Delete a behoefte
  const handleDeleteBehoefte = async () => {
    if (!selectedBehoefte) return;

    try {
      const { error } = await supabase
        .from('bedieningsbehoeftes')
        .delete()
        .eq('id', selectedBehoefte.id);

      if (error) throw error;

      toast.success('Bedieningsbehoefte suksesvol verwyder');
      setShowDeleteDialog(false);
      setSelectedBehoefte(null);
      fetchBehoeftes();
      fetchMyBehoeftes();
    } catch (error: any) {
      console.error('Error deleting behoefte:', error);
      toast.error('Kon nie behoefte verwyder nie');
    }
  };

  // Fulfill a behoefte
  const handleFulfillBehoefte = async () => {
    if (!currentUser || !selectedBehoefte) return;

    if (!fulfillKontaknommer) {
      toast.error('Verskaf asb. jou kontaknommer sodat die gemeente jou kan kontak');
      return;
    }

    try {
      const { error } = await supabase
        .from('bedieningsbehoeftes')
        .update({
          status: 'gevul',
          vervuller_id: currentUser.id,
          vervuller_naam: `${currentUser.naam} ${currentUser.van}`,
          vervuller_kontaknommer: fulfillKontaknommer,
          vervul_datum: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBehoefte.id);

      if (error) throw error;

      toast.success('Dankie dat jy hierdie behoefte sal vervul!');
      
      // Open WhatsApp to contact the requester
      openWhatsApp(selectedBehoefte.kontaknommer, selectedBehoefte, true);
      
      setShowFulfillDialog(false);
      setSelectedBehoefte(null);
      setFulfillKontaknommer('');
      fetchBehoeftes();
      fetchMyBehoeftes();
    } catch (error: any) {
      console.error('Error fulfilling behoefte:', error);
      toast.error('Kon nie behoefte opdateer nie');
    }
  };

  // Get icon for behoefte type
  const getTypeIcon = (tipe: BedieningsbehoefteTipe) => {
    switch (tipe) {
      case 'preekbeurt':
        return <BookOpen className="h-4 w-4 flex-shrink-0" />;
      case 'hospitaalbesoek':
        return <Stethoscope className="h-4 w-4 flex-shrink-0" />;
      case 'krisispastoraat':
        return <Heart className="h-4 w-4 flex-shrink-0" />;
      default:
        return <HelpCircle className="h-4 w-4 flex-shrink-0" />;
    }
  };

  // Get color for behoefte type
  const getTypeColor = (tipe: BedieningsbehoefteTipe) => {
    switch (tipe) {
      case 'preekbeurt':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hospitaalbesoek':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'krisispastoraat':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'oop':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Oop</Badge>;
      case 'gevul':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Gevul</Badge>;
      case 'gekanselleer':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Gekanselleer</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter behoeftes based on active tab
  const filteredBehoeftes = behoeftes.filter(b => {
    if (activeTab === 'alle') return true;
    return b.tipe === activeTab;
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('af-ZA', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bedieningsbehoeftes</h1>
          <p className="text-gray-600 mt-1">
            Gemeentes help mekaar met bedieningsbehoeftes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => { fetchBehoeftes(); fetchMyBehoeftes(); }} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PROMINENT CREATE BUTTON - Always visible at top */}
      <div className="relative z-10 bg-gradient-to-r from-[#002855] to-[#003d7a] rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#D4A84B] rounded-full shadow-lg">
                <HandHeart className="h-10 w-10 text-[#002855]" />
              </div>
              <div className="text-center lg:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-white">Skep 'n Nuwe Bedieningsbehoefte</h2>
                <p className="text-[#D4A84B] mt-1 text-sm md:text-base">
                  Het jou gemeente hulp nodig met 'n preekbeurt, hospitaalbesoek, of krisispastoraat?
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-[#D4A84B] hover:bg-[#c49a3d] text-[#002855] gap-2 px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              onClick={openAddDialog}
            >
              <PlusCircle className="h-6 w-6" />
              Skep Nuwe Behoefte
            </Button>
          </div>
        </div>
      </div>

      {/* REGISTRATION FOR NOTIFICATIONS - Prominent Card for Predikante */}
      {canFulfillBehoefte && (
        <Card className={`border-2 ${registrasie ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${registrasie ? 'bg-green-200' : 'bg-amber-200'}`}>
                  {registrasie ? (
                    <Bell className="h-6 w-6 text-green-700" />
                  ) : (
                    <BellOff className="h-6 w-6 text-amber-700" />
                  )}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${registrasie ? 'text-green-800' : 'text-amber-800'}`}>
                    {registrasie ? 'Jy ontvang kennisgewings' : 'Registreer vir Kennisgewings'}
                  </h3>
                  <p className={`text-sm mt-1 ${registrasie ? 'text-green-700' : 'text-amber-700'}`}>
                    {registrasie 
                      ? 'Jy sal \'n kennisgewing ontvang wanneer nuwe bedieningsbehoeftes aangemeld word.'
                      : 'Registreer om kennisgewings te ontvang wanneer gemeentes hulp nodig het met bedieningsbehoeftes.'
                    }
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowRegisterDialog(true)}
                className={registrasie 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                }
                size="lg"
              >
                {registrasie ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Geregistreer
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Registreer Nou
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#002855]" />
              {registrasie ? 'Kennisgewings Bestuur' : 'Registreer vir Kennisgewings'}
            </DialogTitle>
            <DialogDescription>
              {registrasie 
                ? 'Jy is tans geregistreer om kennisgewings te ontvang. Wil jy afmeld?'
                : 'Registreer om kennisgewings te ontvang wanneer nuwe bedieningsbehoeftes aangemeld word.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className={registrasie ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
              <Info className={`h-4 w-4 ${registrasie ? 'text-green-600' : 'text-blue-600'}`} />
              <AlertDescription className={registrasie ? 'text-green-800' : 'text-blue-800'}>
                {registrasie 
                  ? 'Jy ontvang tans kennisgewings via die app wanneer nuwe behoeftes aangemeld word.'
                  : 'Deur te registreer sal jy kennisgewings ontvang sodat jy kan help waar nodig.'
                }
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
              Kanselleer
            </Button>
            <Button 
              onClick={toggleRegistration}
              className={registrasie ? 'bg-red-600 hover:bg-red-700' : 'bg-[#002855] hover:bg-[#001a3d]'}
            >
              {registrasie ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Meld Af
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Registreer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Add Behoefte Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#002855]" />
              Nuwe Bedieningsbehoefte
            </DialogTitle>

            <DialogDescription>
              Meld 'n bedieningsbehoefte aan sodat ander gemeentes kan help
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipe Behoefte *</Label>
              <Select
                value={formData.tipe}
                onValueChange={(value: BedieningsbehoefteTipe) => 
                  setFormData({ ...formData, tipe: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preekbeurt">Preekbeurt</SelectItem>
                  <SelectItem value="hospitaalbesoek">Hospitaalbesoek</SelectItem>
                  <SelectItem value="krisispastoraat">Krisispastoraat</SelectItem>
                  <SelectItem value="ander">Ander</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipe === 'ander' && (
              <div className="space-y-2">
                <Label>Spesifiseer Tipe *</Label>
                <Input
                  value={formData.ander_beskrywing}
                  onChange={(e) => setFormData({ ...formData, ander_beskrywing: e.target.value })}
                  placeholder="Bv. Begrafnisdiens, Huweliksbevestiging, ens."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Beskrywing *</Label>
              <Textarea
                value={formData.beskrywing}
                onChange={(e) => setFormData({ ...formData, beskrywing: e.target.value })}
                placeholder="Beskryf die behoefte in meer detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Tyd *</Label>
                <Input
                  type="time"
                  value={formData.tyd}
                  onChange={(e) => setFormData({ ...formData, tyd: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plek *</Label>
              <Input
                value={formData.plek}
                onChange={(e) => setFormData({ ...formData, plek: e.target.value })}
                placeholder="Adres of naam van plek"
              />
            </div>

            {/* Contact Number Field - REQUIRED */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Kontaknommer (WhatsApp) *
              </Label>
              <Input
                type="tel"
                value={formData.kontaknommer}
                onChange={(e) => setFormData({ ...formData, kontaknommer: e.target.value })}
                placeholder="bv. 082 123 4567"
              />
              <p className="text-xs text-gray-500">
                Hierdie nommer sal gebruik word sodat iemand jou via WhatsApp kan kontak om te help.
              </p>
            </div>

            {/* Contact Instructions */}
            <Alert className="border-green-200 bg-green-50">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                <strong>Hoe werk dit?</strong><br />
                Wanneer iemand aanbied om te help, sal hulle jou direk via WhatsApp kan kontak met 'n vooraf-opgestelde boodskap oor die behoefte.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Kanselleer
            </Button>
            <Button onClick={handleAddBehoefte} className="bg-[#002855] hover:bg-[#001a3d]">
              <Plus className="h-4 w-4 mr-2" />
              Skep Behoefte
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* Main Tabs - All Behoeftes vs My Behoeftes */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'alle' | 'my-behoeftes')}>
        <TabsList className="mb-4">
          <TabsTrigger value="alle" className="gap-2">
            <Church className="h-4 w-4" />
            Alle Behoeftes
          </TabsTrigger>
          {currentUser && (
            <TabsTrigger value="my-behoeftes" className="gap-2">
              <User className="h-4 w-4" />
              My Behoeftes ({myBehoeftes.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* All Behoeftes Tab */}
        <TabsContent value="alle">
          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1 w-full lg:w-auto mb-4">
              <TabsTrigger value="alle" className="flex-1 lg:flex-none">Alle</TabsTrigger>
              <TabsTrigger value="preekbeurt" className="flex-1 lg:flex-none">Preekbeurte</TabsTrigger>
              <TabsTrigger value="hospitaalbesoek" className="flex-1 lg:flex-none">Hospitaal</TabsTrigger>
              <TabsTrigger value="krisispastoraat" className="flex-1 lg:flex-none">Krisis</TabsTrigger>
              <TabsTrigger value="ander" className="flex-1 lg:flex-none">Ander</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#002855]" />
                </div>
              ) : filteredBehoeftes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Church className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Geen oop behoeftes nie</h3>
                    <p className="text-gray-500 mt-1 text-center">
                      {activeTab === 'alle' 
                        ? 'Daar is tans geen oop bedieningsbehoeftes nie'
                        : `Daar is tans geen oop ${getBedieningsbehoefteTipeLabel(activeTab as BedieningsbehoefteTipe).toLowerCase()} behoeftes nie`
                      }
                    </p>
                    <Button 
                      className="mt-4 bg-[#002855] hover:bg-[#001a3d]"
                      onClick={openAddDialog}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Meld Eerste Behoefte Aan
                    </Button>
                  </CardContent>
                </Card>
              ) : (

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBehoeftes.map((behoefte) => (
                    <Card key={behoefte.id} className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
                      <CardHeader className="pb-3 flex-shrink-0">
                        <div className="flex items-start justify-between gap-2">
                          <Badge className={`${getTypeColor(behoefte.tipe)} flex items-center gap-1 text-xs max-w-full`}>
                            {getTypeIcon(behoefte.tipe)}
                            <span className="truncate">
                              {behoefte.tipe === 'ander' && behoefte.ander_beskrywing 
                                ? behoefte.ander_beskrywing 
                                : getBedieningsbehoefteTipeLabel(behoefte.tipe)
                              }
                            </span>
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2 truncate" title={behoefte.gemeente_naam}>
                          {behoefte.gemeente_naam}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm min-h-[2.5rem]">
                          {behoefte.beskrywing}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 flex-grow flex flex-col">
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{formatDate(behoefte.datum)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{behoefte.tyd}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={behoefte.plek}>{behoefte.plek}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={behoefte.aanmelder_naam}>
                              {behoefte.aanmelder_naam}
                            </span>
                          </div>
                          {/* Contact Number Display */}
                          {behoefte.kontaknommer && (
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{behoefte.kontaknommer}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 mt-auto space-y-2">
                          {canFulfillBehoefte && behoefte.aanmelder_id !== currentUser?.id && (
                            <>
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedBehoefte(behoefte);
                                  setFulfillKontaknommer(currentUser?.selfoon || '');
                                  setShowFulfillDialog(true);
                                }}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Ek Kan Help
                              </Button>
                              {/* WhatsApp Button */}
                              {behoefte.kontaknommer && (
                                <Button 
                                  variant="outline"
                                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                  onClick={() => openWhatsApp(behoefte.kontaknommer, behoefte, true)}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  WhatsApp Kontak
                                </Button>
                              )}
                            </>
                          )}

                          {behoefte.aanmelder_id === currentUser?.id && (
                            <Badge variant="outline" className="w-full justify-center py-2 text-center">
                              Jy het hierdie behoefte aangemeld
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* My Behoeftes Tab */}
        <TabsContent value="my-behoeftes">
          {myBehoeftes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HandHeart className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Geen behoeftes aangemeld nie</h3>
                <p className="text-gray-500 mt-1 text-center">
                  Jy het nog geen bedieningsbehoeftes aangemeld nie
                </p>
                <Button 
                  className="mt-4 bg-[#002855] hover:bg-[#001a3d]"
                  onClick={openAddDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Meld Eerste Behoefte Aan
                </Button>
              </CardContent>

            </Card>
          ) : (
            <div className="space-y-4">
              {myBehoeftes.map((behoefte) => (
                <Card key={behoefte.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${getTypeColor(behoefte.tipe)} flex items-center gap-1 text-xs`}>
                            {getTypeIcon(behoefte.tipe)}
                            <span>
                              {behoefte.tipe === 'ander' && behoefte.ander_beskrywing 
                                ? behoefte.ander_beskrywing 
                                : getBedieningsbehoefteTipeLabel(behoefte.tipe)
                              }
                            </span>
                          </Badge>
                          {getStatusBadge(behoefte.status)}
                        </div>
                        <h3 className="font-medium text-gray-900">{behoefte.beskrywing}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(behoefte.datum)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {behoefte.tyd}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {behoefte.plek}
                          </span>
                        </div>
                        {behoefte.status === 'gevul' && behoefte.vervuller_naam && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-700 font-medium">
                              Gevul deur: {behoefte.vervuller_naam}
                            </p>
                            {behoefte.vervuller_kontaknommer && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => openWhatsApp(behoefte.vervuller_kontaknommer!, behoefte, false)}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  WhatsApp {behoefte.vervuller_naam.split(' ')[0]}
                                </Button>
                                <span className="text-sm text-green-600">
                                  {behoefte.vervuller_kontaknommer}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBehoefte(behoefte);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {behoefte.status === 'oop' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedBehoefte(behoefte);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bedieningsbehoefte Besonderhede</DialogTitle>
          </DialogHeader>
          {selectedBehoefte && (
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${getTypeColor(selectedBehoefte.tipe)} flex items-center gap-1`}>
                  {getTypeIcon(selectedBehoefte.tipe)}
                  <span>
                    {selectedBehoefte.tipe === 'ander' && selectedBehoefte.ander_beskrywing 
                      ? selectedBehoefte.ander_beskrywing 
                      : getBedieningsbehoefteTipeLabel(selectedBehoefte.tipe)
                    }
                  </span>
                </Badge>
                {getStatusBadge(selectedBehoefte.status)}
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-500 text-sm">Gemeente</Label>
                  <p className="font-medium">{selectedBehoefte.gemeente_naam}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Beskrywing</Label>
                  <p>{selectedBehoefte.beskrywing}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Datum</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(selectedBehoefte.datum)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Tyd</Label>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {selectedBehoefte.tyd}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Plek</Label>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedBehoefte.plek}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Aangemeld deur</Label>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {selectedBehoefte.aanmelder_naam}
                  </p>
                </div>
                {/* Contact Number */}
                {selectedBehoefte.kontaknommer && (
                  <div>
                    <Label className="text-gray-500 text-sm">Kontaknommer</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{selectedBehoefte.kontaknommer}</span>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="ml-2 border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => openWhatsApp(selectedBehoefte.kontaknommer, selectedBehoefte, true)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
                {selectedBehoefte.status === 'gevul' && selectedBehoefte.vervuller_naam && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <Label className="text-green-700 text-sm font-medium">Gevul deur</Label>
                    <p className="flex items-center gap-2 text-green-800 font-medium mt-1">
                      <Check className="h-4 w-4" />
                      {selectedBehoefte.vervuller_naam}
                    </p>
                    {selectedBehoefte.vervuller_kontaknommer && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span>{selectedBehoefte.vervuller_kontaknommer}</span>
                        <Button 
                          size="sm"
                          className="ml-2 bg-green-600 hover:bg-green-700"
                          onClick={() => openWhatsApp(selectedBehoefte.vervuller_kontaknommer!, selectedBehoefte, false)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Sluit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verwyder Bedieningsbehoefte</DialogTitle>
            <DialogDescription>
              Is jy seker jy wil hierdie bedieningsbehoefte verwyder? Hierdie aksie kan nie ongedaan gemaak word nie.
            </DialogDescription>
          </DialogHeader>
          {selectedBehoefte && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Badge className={`${getTypeColor(selectedBehoefte.tipe)} mb-2`}>
                  {getBedieningsbehoefteTipeLabel(selectedBehoefte.tipe)}
                </Badge>
                <p className="font-medium">{selectedBehoefte.beskrywing}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(selectedBehoefte.datum)} om {selectedBehoefte.tyd}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Kanselleer
            </Button>
            <Button variant="destructive" onClick={handleDeleteBehoefte}>
              <Trash2 className="h-4 w-4 mr-2" />
              Verwyder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfill confirmation dialog */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bevestig Hulp</DialogTitle>
            <DialogDescription>
              Jy is op die punt om aan te meld dat jy hierdie bedieningsbehoefte sal vervul.
            </DialogDescription>
          </DialogHeader>
          {selectedBehoefte && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${getTypeColor(selectedBehoefte.tipe)} text-xs`}>
                    {selectedBehoefte.tipe === 'ander' && selectedBehoefte.ander_beskrywing 
                      ? selectedBehoefte.ander_beskrywing 
                      : getBedieningsbehoefteTipeLabel(selectedBehoefte.tipe)
                    }
                  </Badge>
                </div>
                <p className="font-medium break-words">{selectedBehoefte.gemeente_naam}</p>
                <p className="text-sm text-gray-600 break-words">{selectedBehoefte.beskrywing}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(selectedBehoefte.datum)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    {selectedBehoefte.tyd}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{selectedBehoefte.plek}</span>
                </div>
              </div>

              {/* Your Contact Number - REQUIRED */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Jou Kontaknommer (WhatsApp) *
                </Label>
                <Input
                  type="tel"
                  value={fulfillKontaknommer}
                  onChange={(e) => setFulfillKontaknommer(e.target.value)}
                  placeholder="bv. 082 123 4567"
                />
                <p className="text-xs text-gray-500">
                  Die gemeente sal hierdie nommer gebruik om jou via WhatsApp te kontak.
                </p>
              </div>

              {/* Contact Instructions */}
              <Alert className="border-green-200 bg-green-50">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  <strong>Hoe om mekaar te kontak:</strong><br />
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Nadat jy bevestig, sal WhatsApp oopmaak met 'n vooraf-opgestelde boodskap.</li>
                    <li>Stuur die boodskap aan die aanmelder ({selectedBehoefte.aanmelder_naam}).</li>
                    <li>Hulle sal jou kontaknommer ook kan sien om jou terug te kontak.</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <AlertDescription className="text-amber-800 text-sm">
                  Deur te bevestig, onderneem jy om hierdie behoefte te vervul. 
                  Die gemeente sal in kennis gestel word.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowFulfillDialog(false); setFulfillKontaknommer(''); }}>
              Kanselleer
            </Button>
            <Button onClick={handleFulfillBehoefte} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Bevestig & WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BedieningsBehoeftes;
