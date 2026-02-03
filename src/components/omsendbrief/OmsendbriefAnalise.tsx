import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  MessageCircle,
  Loader2,
  TrendingUp,
  Hash,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface OmsendbriefVraag {
  id: string;
  vraag: string;
  antwoord?: string;
  asked_at: string;
  gemeente_id?: string;
  gebruiker_id?: string;
}

interface VraagTipe {
  sleutelwoord: string;
  tipe: string;
  telling: number;
}

const OmsendbriefAnalise: React.FC = () => {
  const [vrae, setVrae] = useState<OmsendbriefVraag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipeAnalise, setTipeAnalise] = useState<VraagTipe[]>([]);

  const fetchVrae = async () => {
    try {
      const { data, error } = await supabase
        .from('omsendbrief_vrae')
        .select('id, vraag, antwoord, asked_at, gemeente_id, gebruiker_id')
        .order('asked_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setVrae(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Kon nie vrae laai nie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVrae();
  }, []);

  // Analiseer vrae-tipes op grond van sleutelwoorde
  useEffect(() => {
    const sleutelwoorde: { woorde: string[]; tipe: string }[] = [
      { woorde: ['wanneer', 'datum', 'tyd', 'watter dag', 'watter tyd'], tipe: 'Tyd/Datum' },
      { woorde: ['waar', 'plek', 'adres', 'lokasie', 'venue'], tipe: 'Plek/Lokasie' },
      { woorde: ['wie', 'persoon', 'kontak', 'verantwoordelik'], tipe: 'Persoon/Kontak' },
      { woorde: ['hoe', 'prosedure', 'proses', 'stappe'], tipe: 'Prosedure' },
      { woorde: ['wat', 'definisie', 'betekenis', 'verduidelik'], tipe: 'Definisie' },
      { woorde: ['waarom', 'rede', 'oorsaak'], tipe: 'Rede/Oorsaak' },
      { woorde: ['koste', 'prys', 'fooie', 'geld', 'betal'], tipe: 'Finansies' },
      { woorde: ['aanmeld', 'registreer', 'inskryf'], tipe: 'Registrasie' },
      { woorde: ['program', 'skedule', 'agenda'], tipe: 'Program' },
      { woorde: ['vereistes', 'benodig', 'nodig'], tipe: 'Vereistes' },
    ];

    const telling: Record<string, number> = {};
    vrae.forEach((v) => {
      const vraagLower = v.vraag.toLowerCase();
      let gevind = false;
      for (const { woorde, tipe } of sleutelwoorde) {
        if (woorde.some((w) => vraagLower.includes(w))) {
          telling[tipe] = (telling[tipe] || 0) + 1;
          gevind = true;
          break;
        }
      }
      if (!gevind) {
        telling['Algemeen'] = (telling['Algemeen'] || 0) + 1;
      }
    });

    const resultaat = Object.entries(telling)
      .map(([tipe, count]) => ({ sleutelwoord: tipe, tipe, telling: count }))
      .sort((a, b) => b.telling - a.telling);
    setTipeAnalise(resultaat);
  }, [vrae]);

  const vandag = new Date().toDateString();
  const vandagVrae = vrae.filter((v) => new Date(v.asked_at).toDateString() === vandag).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#002855]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#002855] flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Omsendbrief Kletsbot Analise
        </h2>
        <p className="text-sm text-gray-500">
          Sien watter vrae gebruikers stel en analiseer die tipe vrae.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Totaal Vrae
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#002855]">{vrae.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Vandag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#002855]">{vandagVrae}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Vraag Tipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#002855]">{tipeAnalise.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Vraag Tipe Verdeling
          </CardTitle>
          <CardDescription>
            Analise van vrae op grond van sleutelwoorde (Tyd, Plek, Persoon, ens.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tipeAnalise.length === 0 ? (
            <p className="text-gray-500 py-4">Nog geen vrae gelog nie.</p>
          ) : (
            <div className="space-y-3">
              {tipeAnalise.map((t) => (
                <div key={t.tipe} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-medium text-gray-700">{t.tipe}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#002855] rounded-full"
                      style={{
                        width: `${Math.max(5, (t.telling / Math.max(...tipeAnalise.map((x) => x.telling))) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#002855] w-8">{t.telling}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Onlangse Vrae
          </CardTitle>
          <CardDescription>
            Laaste vrae wat aan die Kletsbot gestel is
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vrae.length === 0 ? (
            <p className="text-gray-500 py-4">Nog geen vrae nie.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {vrae.slice(0, 50).map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{v.vraag}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(v.asked_at).toLocaleString('af-ZA')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OmsendbriefAnalise;
