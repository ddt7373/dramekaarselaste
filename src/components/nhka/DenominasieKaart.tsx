import React, { useState, useEffect, useMemo } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Search,
  Church,
  Users,
  Phone,
  Mail,
  Globe,
  ArrowRightLeft,
  Filter,
  X,
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  Info,
  Navigation,
  List,
  Map,
  Eye,
  ChevronRight
} from 'lucide-react';
import { GEMEENTE_LOCATIONS, GemeenteLocation, getUniqueProvinces, getUniqueCountries } from '@/constants/gemeenteCoordinates';
import { NHKA_GEMEENTES, sortGemeentesWithUserFirst } from '@/constants/gemeentes';
import { supabase } from '@/lib/supabase';
import { Gemeente, isAdmin } from '@/types/nhka';
import { toast } from 'sonner';

interface GemeenteWithStats extends GemeenteLocation {
  gemeente?: Gemeente;
  lidmateCount?: number;
  isRegistered?: boolean;
}

const DenominasieKaart: React.FC = () => {
  const { currentUser, currentGemeente, setCurrentView, gemeentes } = useNHKA();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('alle');
  const [selectedCountry, setSelectedCountry] = useState<string>('alle');
  const [selectedGemeente, setSelectedGemeente] = useState<GemeenteWithStats | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gemeenteStats, setGemeenteStats] = useState<Record<string, number>>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([-26.0, 28.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const [hoveredGemeente, setHoveredGemeente] = useState<GemeenteWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<string>('lys');

  // Get unique provinces and countries
  const provinces = useMemo(() => getUniqueProvinces(), []);
  const countries = useMemo(() => getUniqueCountries(), []);

  // Fetch gemeente stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('gebruikers')
          .select('gemeente_id')
          .eq('aktief', true);

        if (!error && data) {
          const stats: Record<string, number> = {};
          data.forEach((user: any) => {
            if (user.gemeente_id) {
              stats[user.gemeente_id] = (stats[user.gemeente_id] || 0) + 1;
            }
          });
          setGemeenteStats(stats);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  // Merge locations with gemeente data
  const gemeentesWithData: GemeenteWithStats[] = useMemo(() => {
    return GEMEENTE_LOCATIONS.map(loc => {
      const gemeente = gemeentes.find(g => g.naam.toLowerCase() === loc.naam.toLowerCase());
      return {
        ...loc,
        gemeente,
        lidmateCount: gemeente ? gemeenteStats[gemeente.id] || 0 : 0,
        isRegistered: !!gemeente
      };
    });
  }, [gemeentes, gemeenteStats]);

  // Sort gemeentes with user's gemeente first
  const sortedGemeentes = useMemo(() => {
    return sortGemeentesWithUserFirst(gemeentesWithData, currentGemeente?.naam);
  }, [gemeentesWithData, currentGemeente]);

  // Filter gemeentes
  const filteredGemeentes = useMemo(() => {
    return sortedGemeentes.filter(g => {
      const matchesSearch = g.naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.provinsie.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvince = selectedProvince === 'alle' || g.provinsie === selectedProvince;
      const matchesCountry = selectedCountry === 'alle' || g.land === selectedCountry;
      return matchesSearch && matchesProvince && matchesCountry;
    });
  }, [sortedGemeentes, searchQuery, selectedProvince, selectedCountry]);

  // Group by province for stats
  const provinceStats = useMemo(() => {
    const stats: Record<string, { count: number; registered: number }> = {};
    gemeentesWithData.forEach(g => {
      if (!stats[g.provinsie]) {
        stats[g.provinsie] = { count: 0, registered: 0 };
      }
      stats[g.provinsie].count++;
      if (g.isRegistered) stats[g.provinsie].registered++;
    });
    return stats;
  }, [gemeentesWithData]);

  // Handle transfer request
  const handleTransferRequest = async () => {
    if (!selectedGemeente || !currentUser || !currentGemeente) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('oordrag_versoeke')
        .insert({
          gemeente_id: currentGemeente.id,
          lidmaat_id: currentUser.id,
          oordrag_tipe: 'gemeente',
          bestemming_gemeente_id: selectedGemeente.gemeente?.id || null,
          bestemming_gemeente_naam: selectedGemeente.naam,
          rede: transferReason,
          status: 'hangende'
        });

      if (error) throw error;

      toast.success('Oordragversoek ingedien', {
        description: `Jou versoek om na ${selectedGemeente.naam} oor te dra is suksesvol ingedien.`
      });
      setShowTransferDialog(false);
      setTransferReason('');
      setSelectedGemeente(null);
    } catch (err) {
      console.error('Error submitting transfer:', err);
      toast.error('Kon nie versoek indien nie');
    } finally {
      setSubmitting(false);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 1, 12));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 1, 4));
  const handleCenterOnUser = () => {
    if (currentGemeente) {
      const loc = GEMEENTE_LOCATIONS.find(l => l.naam.toLowerCase() === currentGemeente.naam.toLowerCase());
      if (loc) {
        setMapCenter(loc.coordinates);
        setMapZoom(10);
      }
    }
  };

  // Get color based on province
  const getProvinceColor = (provinsie: string) => {
    const colors: Record<string, string> = {
      'Gauteng': '#002855',
      'Mpumalanga': '#1e40af',
      'Limpopo': '#059669',
      'Noordwes': '#d97706',
      'Vrystaat': '#dc2626',
      'KwaZulu-Natal': '#7c3aed',
      'Noord-Kaap': '#0891b2',
      'Wes-Kaap': '#65a30d',
      'Oos-Kaap': '#db2777',
      'Omaheke': '#f59e0b',
      'Otjozondjupa': '#10b981',
      'Hardap': '#6366f1',
      'Erongo': '#ec4899',
      'Kunene': '#14b8a6',
      'Khomas': '#8b5cf6',
      'South-East': '#f97316',
      'Harare': '#ef4444'
    };
    return colors[provinsie] || '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-2">
            <MapPin className="w-7 h-7 text-[#D4A84B]" />
            NHKA Gemeente Kaart
          </h1>
          <p className="text-gray-600 mt-1">
            Alle {NHKA_GEMEENTES.length} NHKA gemeentes in Suider-Afrika
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[#002855]/10 text-[#002855]">
            <Church className="w-3 h-3 mr-1" />
            {NHKA_GEMEENTES.length} Gemeentes
          </Badge>
          <Badge variant="outline" className="bg-[#D4A84B]/10 text-[#D4A84B]">
            <Users className="w-3 h-3 mr-1" />
            {gemeentes.length} Geregistreer
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Soek gemeente of provinsie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Land" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Lande</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Provinsie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Provinsies</SelectItem>
                {provinces.map(prov => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || selectedProvince !== 'alle' || selectedCountry !== 'alle') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProvince('alle');
                  setSelectedCountry('alle');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Herstel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for List/Map View */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="lys" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Lys Aansig ({filteredGemeentes.length})
          </TabsTrigger>
          <TabsTrigger value="kaart" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Kaart Aansig
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="lys" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Church className="w-5 h-5 text-[#D4A84B]" />
                  Alle NHKA Gemeentes
                </span>
                <Badge variant="secondary">{filteredGemeentes.length} van {NHKA_GEMEENTES.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Gemeente</TableHead>
                      <TableHead>Provinsie</TableHead>
                      <TableHead>Land</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGemeentes.map((gemeente, index) => {
                      const isUserGemeente = currentGemeente?.naam.toLowerCase() === gemeente.naam.toLowerCase();

                      return (
                        <TableRow
                          key={gemeente.naam}
                          className={`cursor-pointer hover:bg-gray-50 ${isUserGemeente ? 'bg-[#D4A84B]/10' : ''}`}
                          onClick={() => setSelectedGemeente(gemeente)}
                        >
                          <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getProvinceColor(gemeente.provinsie) }}
                              />
                              <span className={`font-medium ${isUserGemeente ? 'text-[#D4A84B]' : 'text-gray-900'}`}>
                                {gemeente.naam}
                              </span>
                              {isUserGemeente && (
                                <Badge className="bg-[#D4A84B] text-[#002855] text-xs ml-1">Jou Gemeente</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{gemeente.provinsie}</TableCell>
                          <TableCell className="text-gray-600">{gemeente.land}</TableCell>
                          <TableCell className="text-center">
                            {gemeente.isRegistered ? (
                              <Badge className="bg-green-100 text-green-700">Geregistreer</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">Nie Geregistreer</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGemeente(gemeente);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Besonderhede
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredGemeentes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Church className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Geen gemeentes gevind</p>
                    <p className="text-sm">Probeer 'n ander soekterm of filter</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map View */}
        <TabsContent value="kaart" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#D4A84B]" />
                    Kaart Aansig
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    {currentGemeente && (
                      <Button variant="outline" size="icon" onClick={handleCenterOnUser} className="h-8 w-8">
                        <Locate className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* SVG Map of Southern Africa */}
                <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden" style={{ height: '500px' }}>
                  {/* Background map outline */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Simplified South Africa outline */}
                    <path
                      d="M20,35 L25,30 L35,28 L50,25 L65,28 L80,35 L85,50 L80,65 L70,75 L55,80 L40,78 L25,70 L18,55 L20,35 Z"
                      fill="#e5e7eb"
                      stroke="#9ca3af"
                      strokeWidth="0.5"
                    />
                    {/* Namibia */}
                    <path
                      d="M10,25 L20,20 L25,30 L20,35 L18,55 L10,50 L8,35 L10,25 Z"
                      fill="#d1d5db"
                      stroke="#9ca3af"
                      strokeWidth="0.5"
                    />
                    {/* Botswana */}
                    <path
                      d="M25,20 L40,18 L50,25 L35,28 L25,30 L25,20 Z"
                      fill="#d1d5db"
                      stroke="#9ca3af"
                      strokeWidth="0.5"
                    />
                    {/* Zimbabwe */}
                    <path
                      d="M50,15 L65,18 L65,28 L50,25 L50,15 Z"
                      fill="#d1d5db"
                      stroke="#9ca3af"
                      strokeWidth="0.5"
                    />
                  </svg>

                  {/* Gemeente Markers */}
                  {filteredGemeentes.map((gemeente) => {
                    const latRange = 13;
                    const lngRange = 17;
                    const x = ((gemeente.coordinates[1] - 16) / lngRange) * 80 + 10;
                    const y = ((-22 - gemeente.coordinates[0]) / latRange) * 70 + 15;

                    const isUserGemeente = currentGemeente?.naam.toLowerCase() === gemeente.naam.toLowerCase();
                    const isHovered = hoveredGemeente?.naam === gemeente.naam;
                    const isSelected = selectedGemeente?.naam === gemeente.naam;

                    return (
                      <div
                        key={gemeente.naam}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10
                          ${isHovered || isSelected ? 'z-20 scale-150' : 'hover:scale-125'}
                        `}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onMouseEnter={() => setHoveredGemeente(gemeente)}
                        onMouseLeave={() => setHoveredGemeente(null)}
                        onClick={() => setSelectedGemeente(gemeente)}
                      >
                        <div
                          className={`w-3 h-3 rounded-full border-2 shadow-lg transition-all
                            ${isUserGemeente
                              ? 'bg-[#D4A84B] border-[#002855] w-4 h-4'
                              : gemeente.isRegistered
                                ? 'bg-[#002855] border-white'
                                : 'bg-gray-400 border-white'
                            }
                            ${isHovered || isSelected ? 'ring-4 ring-[#D4A84B]/30' : ''}
                          `}
                          style={{ backgroundColor: isUserGemeente ? '#D4A84B' : gemeente.isRegistered ? getProvinceColor(gemeente.provinsie) : undefined }}
                        />
                      </div>
                    );
                  })}

                  {/* Hover Tooltip */}
                  {hoveredGemeente && (
                    <div
                      className="absolute z-30 bg-white rounded-lg shadow-xl p-3 pointer-events-none transform -translate-x-1/2"
                      style={{
                        left: `${((hoveredGemeente.coordinates[1] - 16) / 17) * 80 + 10}%`,
                        top: `${((-22 - hoveredGemeente.coordinates[0]) / 13) * 70 + 5}%`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Church className="w-4 h-4 text-[#002855]" />
                        <span className="font-semibold text-[#002855]">{hoveredGemeente.naam}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {hoveredGemeente.provinsie}, {hoveredGemeente.land}
                        </div>
                        {hoveredGemeente.isRegistered && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {hoveredGemeente.lidmateCount} Lidmate
                          </div>
                        )}
                        {!hoveredGemeente.isRegistered && (
                          <Badge variant="outline" className="text-xs mt-1">Nie geregistreer</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Legende</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#D4A84B] border-2 border-[#002855]" />
                        <span className="text-xs text-gray-600">Jou Gemeente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#002855] border-2 border-white" />
                        <span className="text-xs text-gray-600">Geregistreer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                        <span className="text-xs text-gray-600">Nie Geregistreer</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats overlay */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Wys: {filteredGemeentes.length} gemeentes</p>
                    {selectedProvince !== 'alle' && provinceStats[selectedProvince] && (
                      <p className="text-xs text-gray-500">
                        {provinceStats[selectedProvince].registered} van {provinceStats[selectedProvince].count} geregistreer
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gemeente Details Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedGemeente ? (
                    <>
                      <Info className="w-5 h-5 text-[#D4A84B]" />
                      Gemeente Besonderhede
                    </>
                  ) : (
                    <>
                      <Church className="w-5 h-5 text-[#D4A84B]" />
                      Kies 'n Gemeente
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGemeente ? (
                  <div className="space-y-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGemeente(null)}
                      className="mb-2"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Sluit
                    </Button>

                    <div className="bg-gradient-to-br from-[#002855] to-[#003d7a] rounded-xl p-4 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Church className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedGemeente.naam}</h3>
                          <p className="text-white/70 text-sm">{selectedGemeente.provinsie}, {selectedGemeente.land}</p>
                        </div>
                      </div>
                      {selectedGemeente.isRegistered ? (
                        <Badge className="bg-[#D4A84B] text-[#002855]">Geregistreer op Platform</Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/30 text-white/70">Nie Geregistreer</Badge>
                      )}
                    </div>

                    {selectedGemeente.isRegistered && selectedGemeente.gemeente && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Lidmate</span>
                          </div>
                          <span className="font-semibold text-[#002855]">{selectedGemeente.lidmateCount}</span>
                        </div>

                        {selectedGemeente.gemeente.telefoon && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{selectedGemeente.gemeente.telefoon}</span>
                          </div>
                        )}

                        {selectedGemeente.gemeente.epos && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 text-sm break-all">{selectedGemeente.gemeente.epos}</span>
                          </div>
                        )}

                        {selectedGemeente.gemeente.webwerf && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a
                              href={selectedGemeente.gemeente.webwerf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#002855] hover:underline text-sm break-all"
                            >
                              {selectedGemeente.gemeente.webwerf}
                            </a>
                          </div>
                        )}

                        {selectedGemeente.gemeente.adres && (
                          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-gray-700 text-sm">{selectedGemeente.gemeente.adres}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transfer Button */}
                    {currentUser && currentGemeente && selectedGemeente.naam !== currentGemeente.naam && (
                      <Button
                        className="w-full bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]"
                        onClick={() => setShowTransferDialog(true)}
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Versoek Oordrag na Hierdie Gemeente
                      </Button>
                    )}

                    {/* Coordinates */}
                    <div className="text-xs text-gray-400 text-center pt-2 border-t">
                      Koördinate: {selectedGemeente.coordinates[0].toFixed(4)}, {selectedGemeente.coordinates[1].toFixed(4)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Klik op 'n gemeente</p>
                    <p className="text-sm">op die kaart om besonderhede te sien</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Province Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#D4A84B]" />
            Gemeentes per Provinsie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(provinceStats)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([province, stats]) => (
                <button
                  key={province}
                  onClick={() => {
                    setSelectedProvince(province);
                    setSelectedCountry('alle');
                  }}
                  className={`p-3 rounded-lg border transition-all hover:shadow-md text-left
                    ${selectedProvince === province
                      ? 'border-[#002855] bg-[#002855]/5'
                      : 'border-gray-200 hover:border-[#D4A84B]'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getProvinceColor(province) }}
                    />
                    <span className="font-medium text-sm text-gray-800 truncate">{province}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.count} gemeentes
                  </div>
                  <div className="text-xs text-[#002855]">
                    {stats.registered} geregistreer
                  </div>
                </button>
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Selected Gemeente Detail Dialog */}
      <Dialog open={!!selectedGemeente && activeTab === 'lys'} onOpenChange={(open) => !open && setSelectedGemeente(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Church className="w-5 h-5 text-[#D4A84B]" />
              {selectedGemeente?.naam}
            </DialogTitle>
            <DialogDescription>
              {selectedGemeente?.provinsie}, {selectedGemeente?.land}
            </DialogDescription>
          </DialogHeader>

          {selectedGemeente && (
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-br from-[#002855] to-[#003d7a] rounded-xl p-4 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Church className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedGemeente.naam}</h3>
                    <p className="text-white/70 text-sm">{selectedGemeente.provinsie}</p>
                  </div>
                </div>
                {selectedGemeente.isRegistered ? (
                  <Badge className="bg-[#D4A84B] text-[#002855]">Geregistreer op Platform</Badge>
                ) : (
                  <Badge variant="outline" className="border-white/30 text-white/70">Nie Geregistreer</Badge>
                )}
              </div>

              {selectedGemeente.isRegistered && selectedGemeente.gemeente && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Lidmate</span>
                    </div>
                    <span className="font-semibold text-[#002855]">{selectedGemeente.lidmateCount}</span>
                  </div>

                  {selectedGemeente.gemeente.telefoon && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedGemeente.gemeente.telefoon}</span>
                    </div>
                  )}

                  {selectedGemeente.gemeente.epos && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 text-sm break-all">{selectedGemeente.gemeente.epos}</span>
                    </div>
                  )}
                </div>
              )}

              {!selectedGemeente.isRegistered && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    Hierdie gemeente is nog nie op die platform geregistreer nie. Kontak die sinodale kantoor vir meer inligting.
                  </p>
                </div>
              )}

              {/* Coordinates */}
              <div className="text-xs text-gray-400 text-center pt-2 border-t">
                Koördinate: {selectedGemeente.coordinates[0].toFixed(4)}, {selectedGemeente.coordinates[1].toFixed(4)}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {currentUser && currentGemeente && selectedGemeente && selectedGemeente.naam !== currentGemeente.naam && (
              <Button
                className="w-full sm:w-auto bg-[#D4A84B] hover:bg-[#c49a3f] text-[#002855]"
                onClick={() => {
                  setShowTransferDialog(true);
                }}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Versoek Oordrag
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedGemeente(null)}>
              Sluit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#D4A84B]" />
              Oordrag Versoek
            </DialogTitle>
            <DialogDescription>
              Versoek om jou lidmaatskap oor te dra na {selectedGemeente?.naam}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Van:</span>
                <span className="font-medium text-[#002855]">{currentGemeente?.naam}</span>
              </div>
              <div className="flex items-center justify-center my-2">
                <Navigation className="w-5 h-5 text-[#D4A84B] rotate-90" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Na:</span>
                <span className="font-medium text-[#002855]">{selectedGemeente?.naam}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rede vir Oordrag (Opsioneel)
              </label>
              <Input
                placeholder="Bv. Verhuis na nuwe area..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Let wel:</strong> Hierdie versoek sal na jou huidige gemeente se administrateur gestuur word vir goedkeuring.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Kanselleer
            </Button>
            <Button
              onClick={handleTransferRequest}
              disabled={submitting}
              className="bg-[#002855] hover:bg-[#001d40]"
            >
              {submitting ? 'Stuur...' : 'Stuur Versoek'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DenominasieKaart;
