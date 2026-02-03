import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNHKA } from '@/contexts/NHKAContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MapPin,
    Users,
    Search,
    Filter,
    Navigation,
    Map as MapIcon,
    Phone,
    MessageCircle,
    MoreVertical,
    Layers,
    Locate,
    RefreshCcw,
    CheckCircle2
} from 'lucide-react';
import { Gebruiker, Wyk, Besoekpunt, getLidmaatDisplayNaam } from '@/types/nhka';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Colors based on Ward
const getWardColor = (index: number) => {
    const colors = [
        '#002855', '#D4A84B', '#7A8450', '#9E2A2B',
        '#8B7CB3', '#2E5A88', '#D81159', '#218380',
        '#FBB13C', '#73956F'
    ];
    return colors[index % colors.length];
};

const createColoredIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

// Component to handle map centering and zooming
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const GemeenteKaart: React.FC = () => {
    const { currentGemeente, currentUser } = useNHKA();
    const [wards, setWards] = useState<Wyk[]>([]);
    const [members, setMembers] = useState<Gebruiker[]>([]);
    const [selectedWardIds, setSelectedWardIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [geocoding, setGeocoding] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-26.2041, 28.0473]); // Default to Joburg
    const [zoom, setZoom] = useState(13);

    // Fetch Wards and Members
    useEffect(() => {
        const fetchData = async () => {
            if (!currentGemeente) return;
            setLoading(true);
            try {
                // Fetch all wards for this gemeente
                const { data: wardsData } = await supabase
                    .from('wyke')
                    .select('*')
                    .eq('gemeente_id', currentGemeente.id);

                setWards(wardsData || []);

                // Default selection: If ward leader, select their ward. If admin, select all.
                if (currentUser?.rol === 'predikant' || currentUser?.rol === 'admin' || currentUser?.rol === 'hoof_admin') {
                    setSelectedWardIds((wardsData || []).map(w => w.id));
                } else if (currentUser?.wyk_id) {
                    setSelectedWardIds([currentUser.wyk_id]);
                }

                // Fetch all members with addresses
                const { data: membersData } = await supabase
                    .from('gebruikers')
                    .select('*')
                    .eq('gemeente_id', currentGemeente.id)
                    .not('adres', 'is', null);

                setMembers(membersData || []);

                // Try to find a center based on members who already have coordinates
                const membersWithCoords = membersData?.filter(m => m.latitude && m.longitude);
                if (membersWithCoords && membersWithCoords.length > 0) {
                    const avgLat = membersWithCoords.reduce((acc, m) => acc + (m.latitude || 0), 0) / membersWithCoords.length;
                    const avgLng = membersWithCoords.reduce((acc, m) => acc + (m.longitude || 0), 0) / membersWithCoords.length;
                    setMapCenter([avgLat, avgLng]);
                } else if (currentGemeente.adres) {
                    // Fallback to congregation address (would need geocoding too, but for now we'll rely on members)
                }

            } catch (err) {
                console.error('Error fetching map data:', err);
                toast.error('Kon nie kaartdata laai nie');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentGemeente, currentUser]);

    // Filtered members based on selected wards and search
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const isInSelectedWard = m.wyk_id && selectedWardIds.includes(m.wyk_id);
            const matchesSearch = `${m.naam} ${m.van}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.adres && m.adres.toLowerCase().includes(searchTerm.toLowerCase()));
            return isInSelectedWard && matchesSearch;
        });
    }, [members, selectedWardIds, searchTerm]);

    const toggleWard = (wardId: string) => {
        setSelectedWardIds(prev =>
            prev.includes(wardId)
                ? prev.filter(id => id !== wardId)
                : [...prev, wardId]
        );
    };

    // Helper to geocode an address
    const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'DraMekaarSeLaste-App/1.0',
                        'Accept-Language': 'af,en'
                    }
                }
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        }
        return null;
    };

    // Bulk Geocode missing coordinates
    const handleBulkGeocode = async () => {
        const unGeocoded = members.filter(m => !m.latitude || !m.longitude);
        if (unGeocoded.length === 0) {
            toast.info('Alle lede het reeds koördinate');
            return;
        }

        setGeocoding(true);
        let count = 0;

        toast.info(`Begin geokodering vir ${unGeocoded.length} lede...`);

        for (const member of unGeocoded) {
            if (!member.adres) continue;

            const coords = await geocodeAddress(member.adres);
            if (coords) {
                const { error: updateError } = await supabase
                    .from('gebruikers')
                    .update({ latitude: coords[0], longitude: coords[1] })
                    .eq('id', member.id);

                if (!updateError) {
                    member.latitude = coords[0];
                    member.longitude = coords[1];
                    count++;
                } else {
                    console.error(`Fout met opdatering vir ${member.naam}:`, updateError);
                }
            }
            // Respect Nominatim usage policy (1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setGeocoding(false);
        setMembers([...members]); // Trigger re-render
        toast.success(`${count} lede se ligging is suksesvol opgedateer`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#002855] flex items-center gap-2">
                        <MapIcon className="w-7 h-7 text-[#D4A84B]" />
                        Gemeente Geografiese Kaart
                    </h1>
                    <p className="text-gray-500">Sien lidmate se ligging gegroepeer per wyk</p>
                </div>
                <div className="flex gap-2">
                    {(currentUser?.rol === 'admin' || currentUser?.rol === 'hoof_admin' || currentUser?.rol === 'predikant') && (
                        <Button
                            variant="outline"
                            onClick={handleBulkGeocode}
                            disabled={geocoding}
                            className="gap-2"
                        >
                            <RefreshCcw className={`w-4 h-4 ${geocoding ? 'animate-spin' : ''}`} />
                            Omskep adresse in liggings
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Controls */}
                <div className="space-y-6 lg:col-span-1">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[#D4A84B]" />
                                Filter Wyke
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Soek lidmaat..."
                                    className="pl-9 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-1">
                                    <span>Wyke</span>
                                    <button
                                        onClick={() => setSelectedWardIds(wards.map(w => w.id))}
                                        className="text-[#002855] hover:underline"
                                    >
                                        Kies Almal
                                    </button>
                                </div>
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-2">
                                        {wards.map((ward, idx) => (
                                            <div key={ward.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`ward-${ward.id}`}
                                                    checked={selectedWardIds.includes(ward.id)}
                                                    onCheckedChange={() => toggleWard(ward.id)}
                                                />
                                                <label
                                                    htmlFor={`ward-${ward.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                                                >
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getWardColor(idx) }} />
                                                    {ward.naam}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Lidmate op kaart:</span>
                                <span className="font-bold">{filteredMembers.filter(m => m.latitude).length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Sonder koördinate:</span>
                                <span className="font-bold text-amber-600">{members.filter(m => !m.latitude).length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Map View */}
                <div className="lg:col-span-3 min-h-[600px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
                    <MapContainer
                        center={mapCenter}
                        zoom={zoom}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ChangeView center={mapCenter} zoom={zoom} />

                        {filteredMembers.map((member) => {
                            if (!member.latitude || !member.longitude) return null;

                            const wardIndex = wards.findIndex(w => w.id === member.wyk_id);
                            const color = getWardColor(wardIndex);

                            return (
                                <Marker
                                    key={member.id}
                                    position={[member.latitude, member.longitude]}
                                    icon={createColoredIcon(color)}
                                >
                                    <Popup>
                                        <div className="min-w-[200px] p-1">
                                            <div className="font-bold text-[#002855] mb-1">{getLidmaatDisplayNaam(member)}</div>
                                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {member.adres}
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                {member.selfoon && (
                                                    <>
                                                        <a
                                                            href={`tel:${member.selfoon}`}
                                                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#002855] transition-colors"
                                                            title="Bel"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${member.selfoon.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            className="p-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                                                            title="WhatsApp"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </a>
                                                    </>
                                                )}
                                                <Badge variant="outline" className="ml-auto text-[10px]">
                                                    {wards.find(w => w.id === member.wyk_id)?.naam}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-[#002855] border-t-transparent rounded-full animate-spin" />
                                <p className="font-medium text-[#002855]">Laai kaartdata...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GemeenteKaart;
