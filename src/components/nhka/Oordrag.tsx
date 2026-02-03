import React, { useState, useEffect, useMemo } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { 
  OordragVersoek, 
  OordragTipe, 
  OordragStatus,
  getOordragTipeLabel, 
  getOordragStatusLabel,
  isAdmin,
  Gebruiker
} from '@/types/nhka';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightLeft, 
  Church, 
  Building2, 
  Plus, 
  X, 
  Check, 
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  Star
} from 'lucide-react';
import { NHKA_GEMEENTES, sortGemeentesWithUserFirst } from '@/constants/gemeentes';

const Oordrag: React.FC = () => {
  const { currentUser, currentGemeente, gemeentes, gebruikers, refreshData } = useNHKA();
  const [versoeke, setVersoeke] = useState<OordragVersoek[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  
  // Form state
  const [oordragTipe, setOordragTipe] = useState<OordragTipe>('gemeente');
  const [bestemmingGemeenteId, setBestemmingGemeenteId] = useState('');
  const [anderGemeenteNaam, setAnderGemeenteNaam] = useState(''); // For "Ander" option
  const [showAnderGemeente, setShowAnderGemeente] = useState(false);
  const [anderKerkNaam, setAnderKerkNaam] = useState('');
  const [anderKerkAdres, setAnderKerkAdres] = useState('');
  const [rede, setRede] = useState('');
  
  // Admin processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotas, setAdminNotas] = useState('');

  const isUserAdmin = currentUser && isAdmin(currentUser.rol);

  // Sort gemeentes with user's gemeente first, then filter out current gemeente
  const sortedAvailableGemeentes = useMemo(() => {
    const filtered = gemeentes.filter(g => g.id !== currentGemeente?.id && g.aktief);
    return sortGemeentesWithUserFirst(filtered, currentGemeente?.naam);
  }, [gemeentes, currentGemeente]);

  // Get list of NHKA gemeentes that are not yet registered in the system
  const unregisteredGemeentes = useMemo(() => {
    const registeredNames = gemeentes.map(g => g.naam.toLowerCase());
    return NHKA_GEMEENTES.filter(naam => 
      !registeredNames.includes(naam.toLowerCase()) && 
      naam !== currentGemeente?.naam
    );
  }, [gemeentes, currentGemeente]);

  useEffect(() => {
    fetchVersoeke();
  }, [currentGemeente]);

  const fetchVersoeke = async () => {
    if (!currentGemeente) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('oordrag_versoeke')
        .select('*')
        .order('created_at', { ascending: false });

      // If admin, show all requests for the gemeente
      // If regular user, show only their own requests
      if (isUserAdmin) {
        query = query.eq('gemeente_id', currentGemeente.id);
      } else {
        query = query.eq('lidmaat_id', currentUser?.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching oordrag versoeke:', error);
      } else if (data) {
        // Enrich with gemeente names and user info
        const enrichedData = data.map(versoek => {
          const bestemming = gemeentes.find(g => g.id === versoek.bestemming_gemeente_id);
          const lidmaat = gebruikers.find(g => g.id === versoek.lidmaat_id);
          return {
            ...versoek,
            bestemming_gemeente_naam: bestemming?.naam || versoek.bestemming_gemeente_naam,
            lidmaat
          };
        });
        setVersoeke(enrichedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!currentUser || !currentGemeente) return;
    
    // Validation for gemeente transfer
    if (oordragTipe === 'gemeente') {
      if (showAnderGemeente) {
        if (!anderGemeenteNaam.trim()) {
          alert('Voer asseblief die gemeente se naam in');
          return;
        }
      } else if (!bestemmingGemeenteId) {
        alert('Kies asseblief \'n bestemming gemeente');
        return;
      }
    }
    
    if (oordragTipe === 'ander_kerk' && !anderKerkNaam) {
      alert('Voer asseblief die kerk se naam in');
      return;
    }

    try {
      setSubmitting(true);
      
      const insertData: any = {
        gemeente_id: currentGemeente.id,
        lidmaat_id: currentUser.id,
        oordrag_tipe: oordragTipe,
        rede,
        status: 'hangende'
      };

      if (oordragTipe === 'gemeente') {
        if (showAnderGemeente) {
          // Store "Ander" gemeente name in bestemming_gemeente_naam field
          insertData.bestemming_gemeente_naam = anderGemeenteNaam;
          insertData.bestemming_gemeente_id = null;
        } else {
          insertData.bestemming_gemeente_id = bestemmingGemeenteId;
          // Also store the gemeente name for reference
          const selectedGemeente = gemeentes.find(g => g.id === bestemmingGemeenteId);
          if (selectedGemeente) {
            insertData.bestemming_gemeente_naam = selectedGemeente.naam;
          }
        }
      } else {
        insertData.ander_kerk_naam = anderKerkNaam;
        insertData.ander_kerk_adres = anderKerkAdres || null;
      }
      
      const { error } = await supabase
        .from('oordrag_versoeke')
        .insert([insertData]);

      if (error) {
        console.error('Error submitting request:', error);
        alert('Kon nie versoek indien nie: ' + error.message);
      } else {
        // Reset form
        setShowNewRequest(false);
        setOordragTipe('gemeente');
        setBestemmingGemeenteId('');
        setAnderGemeenteNaam('');
        setShowAnderGemeente(false);
        setAnderKerkNaam('');
        setAnderKerkAdres('');
        setRede('');
        fetchVersoeke();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };


  const handleProcessRequest = async (versoekId: string, newStatus: OordragStatus) => {
    if (!currentUser) return;

    try {
      setSubmitting(true);
      
      const updateData: any = {
        status: newStatus,
        verwerk_deur: currentUser.id,
        verwerk_datum: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (adminNotas) {
        updateData.admin_notas = adminNotas;
      }

      const { error } = await supabase
        .from('oordrag_versoeke')
        .update(updateData)
        .eq('id', versoekId);

      if (error) {
        console.error('Error processing request:', error);
        alert('Kon nie versoek verwerk nie: ' + error.message);
      } else {
        // If approved and it's a gemeente transfer, update the user's gemeente_id
        if (newStatus === 'goedgekeur') {
          const versoek = versoeke.find(v => v.id === versoekId);
          if (versoek && versoek.oordrag_tipe === 'gemeente' && versoek.bestemming_gemeente_id) {
            await supabase
              .from('gebruikers')
              .update({ 
                gemeente_id: versoek.bestemming_gemeente_id,
                wyk_id: null,
                besoekpunt_id: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', versoek.lidmaat_id);
          } else if (versoek && versoek.oordrag_tipe === 'ander_kerk') {
            // Mark user as inactive when transferring to another church
            await supabase
              .from('gebruikers')
              .update({ 
                aktief: false,
                notas: `Oorgedra na ${versoek.ander_kerk_naam} op ${new Date().toLocaleDateString('af-ZA')}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', versoek.lidmaat_id);
          }
        }
        
        setProcessingId(null);
        setAdminNotas('');
        fetchVersoeke();
        refreshData();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: OordragStatus) => {
    const config = {
      hangende: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      goedgekeur: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      afgekeur: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      voltooi: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Check }
    };
    const { color, icon: Icon } = config[status];
    return (
      <Badge className={`${color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {getOordragStatusLabel(status)}
      </Badge>
    );
  };

  const filteredVersoeke = versoeke.filter(v => {
    const matchesSearch = 
      v.lidmaat?.naam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.lidmaat?.van?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.bestemming_gemeente_naam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ander_kerk_naam?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'alle' || v.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = versoeke.filter(v => v.status === 'hangende').length;
  const approvedCount = versoeke.filter(v => v.status === 'goedgekeur').length;

  // Check if user already has a pending request
  const hasPendingRequest = versoeke.some(v => v.lidmaat_id === currentUser?.id && v.status === 'hangende');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-2">
            <ArrowRightLeft className="w-7 h-7 text-[#D4A84B]" />
            Lidmaatskap Oordrag
          </h1>
          <p className="text-gray-600 mt-1">
            {isUserAdmin 
              ? 'Bestuur lidmaatskap oordrags binne en buite die NHKA'
              : 'Versoek oordrag na \'n ander gemeente of kerk'}
          </p>
        </div>
        
        {!isUserAdmin && !hasPendingRequest && (
          <Button
            onClick={() => setShowNewRequest(true)}
            className="bg-[#002855] hover:bg-[#003d7a] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuwe Oordrag Versoek
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {isUserAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Hangende Versoeke</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Goedgekeur</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Totale Versoeke</p>
                  <p className="text-2xl font-bold text-blue-600">{versoeke.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Request Form */}
      {showNewRequest && (
        <Card className="border-2 border-[#D4A84B]/30 bg-[#D4A84B]/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#D4A84B]" />
                Nuwe Oordrag Versoek
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewRequest(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transfer Type Selection */}
            <div className="space-y-2">
              <Label>Tipe Oordrag</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setOordragTipe('gemeente')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    oordragTipe === 'gemeente'
                      ? 'border-[#002855] bg-[#002855]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      oordragTipe === 'gemeente' ? 'bg-[#002855] text-white' : 'bg-gray-100'
                    }`}>
                      <Church className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Na Ander NHKA Gemeente</p>
                      <p className="text-sm text-gray-500">Bly binne die NHKA familie</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setOordragTipe('ander_kerk')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    oordragTipe === 'ander_kerk'
                      ? 'border-[#9E2A2B] bg-[#9E2A2B]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      oordragTipe === 'ander_kerk' ? 'bg-[#9E2A2B] text-white' : 'bg-gray-100'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Na Ander Kerk</p>
                      <p className="text-sm text-gray-500">Verlaat die NHKA</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Destination Fields */}
            {oordragTipe === 'gemeente' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Bestemming Gemeente</Label>
                  <Select 
                    value={showAnderGemeente ? 'ander' : bestemmingGemeenteId} 
                    onValueChange={(val) => {
                      if (val === 'ander') {
                        setShowAnderGemeente(true);
                        setBestemmingGemeenteId('');
                      } else {
                        setShowAnderGemeente(false);
                        setBestemmingGemeenteId(val);
                        setAnderGemeenteNaam('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kies 'n gemeente..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {/* Registered gemeentes - sorted with user's gemeente context */}
                      {sortedAvailableGemeentes.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                            Geregistreerde Gemeentes
                          </div>
                          {sortedAvailableGemeentes.map((gemeente, index) => (
                            <SelectItem key={gemeente.id} value={gemeente.id}>
                              <div className="flex items-center gap-2">
                                <Church className="w-4 h-4 text-[#002855]" />
                                <span>{gemeente.naam}</span>
                                {index === 0 && currentGemeente && (
                                  <Star className="w-3 h-3 text-[#D4A84B]" />
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Unregistered NHKA gemeentes */}
                      {unregisteredGemeentes.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 mt-2">
                            Ander NHKA Gemeentes (Nie Geregistreer)
                          </div>
                          {unregisteredGemeentes.slice(0, 20).map(naam => (
                            <SelectItem key={naam} value={`unregistered:${naam}`}>
                              <div className="flex items-center gap-2">
                                <Church className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{naam}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {unregisteredGemeentes.length > 20 && (
                            <div className="px-2 py-1.5 text-xs text-gray-400">
                              + {unregisteredGemeentes.length - 20} meer...
                            </div>
                          )}
                        </>
                      )}
                      
                      <SelectItem value="ander" className="text-[#D4A84B] font-medium">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          <span>Ander (nie in lys nie)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Show text input when "Ander" is selected */}
                {showAnderGemeente && (
                  <div className="space-y-2">
                    <Label>Gemeente Naam *</Label>
                    <Input
                      value={anderGemeenteNaam}
                      onChange={(e) => setAnderGemeenteNaam(e.target.value)}
                      placeholder="Tik die gemeente se naam in..."
                    />
                    <p className="text-xs text-gray-500">
                      As jou bestemming gemeente nie in die lys verskyn nie, tik die naam hier in.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Kerk Naam *</Label>
                  <Input
                    value={anderKerkNaam}
                    onChange={(e) => setAnderKerkNaam(e.target.value)}
                    placeholder="bv. NG Kerk Pretoria-Oos"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kerk Adres (Opsioneel)</Label>
                  <Input
                    value={anderKerkAdres}
                    onChange={(e) => setAnderKerkAdres(e.target.value)}
                    placeholder="Straatadres van die kerk"
                  />
                </div>
              </div>
            )}


            {/* Reason */}
            <div className="space-y-2">
              <Label>Rede vir Oordrag (Opsioneel)</Label>
              <Textarea
                value={rede}
                onChange={(e) => setRede(e.target.value)}
                placeholder="Verduidelik kortliks hoekom jy wil oordra..."
                rows={3}
              />
            </div>

            {/* Warning for leaving NHKA */}
            {oordragTipe === 'ander_kerk' && (
              <div className="p-4 bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#9E2A2B] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#9E2A2B]">Belangrike Inligting</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Deur na 'n ander kerk oor te dra, sal jou lidmaatskap by die NHKA beëindig word. 
                      Jy sal 'n oordrags-sertifikaat ontvang wat jy by jou nuwe kerk kan indien.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNewRequest(false)}
              >
                Kanselleer
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="bg-[#002855] hover:bg-[#003d7a] text-white"
              >
                {submitting ? 'Dien in...' : 'Dien Versoek In'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Request Notice */}
      {!isUserAdmin && hasPendingRequest && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Jy het 'n hangende oordrag versoek</p>
                <p className="text-sm text-yellow-700">
                  Wag asseblief vir die kerkraad om jou versoek te verwerk voordat jy 'n nuwe een indien.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter (Admin only) */}
      {isUserAdmin && versoeke.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Soek na lidmaat of bestemming..."
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              <SelectItem value="hangende">Hangende</SelectItem>
              <SelectItem value="goedgekeur">Goedgekeur</SelectItem>
              <SelectItem value="afgekeur">Afgekeur</SelectItem>
              <SelectItem value="voltooi">Voltooi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredVersoeke.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ArrowRightLeft className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Geen oordrag versoeke</h3>
            <p className="text-gray-500 mt-1">
              {isUserAdmin 
                ? 'Daar is tans geen oordrag versoeke om te verwerk nie.'
                : 'Jy het nog nie \'n oordrag versoek ingedien nie.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVersoeke.map(versoek => (
            <Card key={versoek.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Request Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(versoek.status)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          {versoek.oordrag_tipe === 'gemeente' ? (
                            <Church className="w-3 h-3" />
                          ) : (
                            <Building2 className="w-3 h-3" />
                          )}
                          {getOordragTipeLabel(versoek.oordrag_tipe)}
                        </Badge>
                      </div>
                      
                      {isUserAdmin && versoek.lidmaat && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {versoek.lidmaat.naam} {versoek.lidmaat.van}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        <span>
                          {versoek.oordrag_tipe === 'gemeente' 
                            ? `Na: ${versoek.bestemming_gemeente_naam || 'Onbekend'}`
                            : `Na: ${versoek.ander_kerk_naam}`}
                        </span>
                      </div>
                      
                      {versoek.rede && (
                        <div className="flex items-start gap-2 text-gray-600">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="text-sm">{versoek.rede}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Ingedien: {new Date(versoek.created_at).toLocaleDateString('af-ZA')}</span>
                      </div>

                      {versoek.admin_notas && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Admin Notas:</p>
                          <p className="text-sm text-gray-600">{versoek.admin_notas}</p>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {isUserAdmin && versoek.status === 'hangende' && (
                      <div className="flex flex-col gap-2">
                        {processingId === versoek.id ? (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg min-w-[250px]">
                            <Textarea
                              value={adminNotas}
                              onChange={(e) => setAdminNotas(e.target.value)}
                              placeholder="Voeg notas by (opsioneel)..."
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleProcessRequest(versoek.id, 'goedgekeur')}
                                disabled={submitting}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Keur Goed
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleProcessRequest(versoek.id, 'afgekeur')}
                                disabled={submitting}
                                className="flex-1"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Keur Af
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setProcessingId(null);
                                setAdminNotas('');
                              }}
                              className="w-full"
                            >
                              Kanselleer
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setProcessingId(versoek.id)}
                            className="bg-[#002855] hover:bg-[#003d7a] text-white"
                          >
                            Verwerk Versoek
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Information Section */}
      <Card className="bg-[#002855]/5 border-[#002855]/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#002855] mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Inligting oor Lidmaatskap Oordrag
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Church className="w-4 h-4 text-[#002855]" />
                Oordrag na Ander NHKA Gemeente
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Jou lidmaatskap word oorgedra na die nuwe gemeente</li>
                <li>Alle rekords word veilig oorgedra</li>
                <li>Die proses neem gewoonlik 1-2 weke</li>
                <li>Jy sal 'n bevestiging ontvang wanneer dit voltooi is</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#9E2A2B]" />
                Oordrag na Ander Kerk
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Jou NHKA lidmaatskap word beëindig</li>
                <li>'n Oordrags-sertifikaat word uitgereik</li>
                <li>Die sertifikaat kan by jou nuwe kerk ingedien word</li>
                <li>Kontak die kerkkantoor vir enige vrae</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Oordrag;
