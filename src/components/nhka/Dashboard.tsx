import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { useOffline } from '@/contexts/OfflineContext';
import { supabase } from '@/lib/supabase';
import {
  isLeier,
  isAdmin,
  getRolLabel,
  Dagstukkie,
} from '@/types/nhka';
import {
  Users,
  Heart,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  BookOpen,
  ShieldCheck,
  Crown,
  CreditCard,
  Church
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard: React.FC = () => {
  const {
    currentUser,
    gebruikers,
    wyke,
    aksies,
    krisisse,
    vrae,
    program,
    currentGemeente,
    setCurrentView,
    betalings
  } = useNHKA();

  const { isOnline, cacheDagstukkies } = useOffline();

  const [dagstukkies, setDagstukkies] = useState<Dagstukkie[]>([]);

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

        if (dagData) {
          setDagstukkies(dagData);
          cacheDagstukkies(dagData.map(d => ({
            id: d.id,
            titel: d.titel,
            inhoud: d.inhoud,
            datum: d.dag,
            skrywer: d.skrifverwysing
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching dagstukkies:', error);
    }
  };

  if (!currentUser) return null;

  const isUserLeier = isLeier(currentUser.rol);
  const isUserAdmin = isAdmin(currentUser.rol);

  // Intelligence Engine: Logic for Smart Cards
  const pendingPayments = betalings.filter(b => b.status === 'hangende').length;
  const activeKrisisse = krisisse.filter(k => k.status !== 'opgelos').length;
  const unansweredVrae = vrae.filter(v => v.status === 'nuut').length;

  const today = new Date();
  const dayNames = ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'];
  const todayName = dayNames[today.getDay()];
  const todayDagstukkie = dagstukkies.find(d => d.dag === todayName);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-20"
    >
      {/* 1. WELCOME & SPIRITUAL HEALTH BANNER */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-[#003672] to-primary p-10 text-white shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl font-serif font-black mb-3 tracking-tight"
            >
              Goeiedag, {currentUser.noemnaam || currentUser.naam}
            </motion.h1>
            <p className="text-white/60 text-lg font-medium mb-8 uppercase tracking-widest border-b border-white/10 pb-4 inline-block">
              Vandag is {new Date().toLocaleDateString('af-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 sacred-shadow">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  {todayDagstukkie ? (
                    <>
                      <h3 className="font-serif text-2xl font-bold mb-2 text-accent">{todayDagstukkie.titel}</h3>
                      <p className="text-white/80 line-clamp-3 text-lg leading-relaxed font-medium">{todayDagstukkie.inhoud}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="h-px w-8 bg-accent/50" />
                        <p className="text-accent text-sm font-black uppercase tracking-widest">{todayDagstukkie.skrifverwysing}</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-2">
                      <p className="italic font-serif text-2xl text-white/90 leading-relaxed max-w-lg">
                        "Dra mekaar se laste en vervul so die wet van Christus."
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="h-px w-8 bg-accent/50" />
                        <p className="text-accent text-sm font-black uppercase tracking-widest">Galasiërs 6:2</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROLE CARD - Dynamic Context */}
        <div className="sacred-card p-10 flex flex-col justify-center items-center text-center relative overflow-hidden group border-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-6 sacred-shadow-lg"
          >
            <Users className="w-10 h-10 text-accent" />
          </motion.div>

          <p className="text-xs font-black text-primary/40 uppercase tracking-[0.3em] mb-2 font-sans">Sisteem Profiel</p>
          <h2 className="text-3xl font-serif font-black text-primary mb-4 tracking-tight">{getRolLabel(currentUser.rol)}</h2>

          <div className="h-px w-12 bg-accent/20 my-2" />

          <p className="text-foreground/60 leading-relaxed italic font-medium px-4 mb-8">
            {isUserLeier ? 'Dankie vir jou getroue diens in die herderskap van ons gemeente.' : 'Dankie dat jy deel is van ons gemeente familie.'}
          </p>

          <Button
            variant="outline"
            onClick={() => setCurrentView('profiel')}
            className="w-full rounded-2xl py-6 h-auto font-black uppercase tracking-widest border-primary/10 text-primary hover:bg-primary hover:text-white transition-all sacred-shadow border-2"
          >
            BEKYK PROFIEL
          </Button>
        </div>
      </motion.div>

      {/* 2. THE THREE PILLARS - Universal Navigation */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            id: 'worship-hub',
            label: 'Reis & Aanbidding',
            desc: 'Geloofsgroei en erediens',
            icon: Church,
            color: 'blue',
            bg: 'bg-blue-50/50 dark:bg-blue-900/10',
            iconColor: 'text-blue-600 dark:text-blue-400'
          },
          {
            id: 'community-hub',
            label: 'Gemeenskap & Sorg',
            desc: 'Omgee en verbondenheid',
            icon: Users,
            color: 'green',
            bg: 'bg-green-50/50 dark:bg-green-900/10',
            iconColor: 'text-green-600 dark:text-green-400'
          },
          {
            id: 'stewardship-hub',
            label: 'Bestuur & Rentmeesterskap',
            desc: 'Gawes en administrasie',
            icon: Heart,
            color: 'amber',
            bg: 'bg-amber-50/50 dark:bg-amber-900/10',
            iconColor: 'text-amber-600 dark:text-amber-400'
          }
        ].map((pillar) => (
          <motion.div
            key={pillar.id}
            whileHover={{ y: -10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView(pillar.id as any)}
            className="sacred-card p-8 cursor-pointer group relative border-none"
          >
            <div className={`absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700`}>
              <pillar.icon className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className={`w-16 h-16 rounded-[1.5rem] bg-white dark:bg-black/40 sacred-shadow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <pillar.icon className={`w-8 h-8 ${pillar.iconColor}`} />
              </div>
              <h3 className="text-2xl font-serif font-black text-primary mb-2 tracking-tight line-clamp-1">{pillar.label}</h3>
              <p className="text-foreground/50 font-medium">{pillar.desc}</p>

              <div className="mt-8 flex items-center text-primary/30 group-hover:text-primary transition-colors">
                <span className="text-xs font-black uppercase tracking-[0.2em]">Ontsluit Hub</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Visual Progress Bar - Aesthetic only */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-accent/50 to-transparent w-full opacity-30" />
          </motion.div>
        ))}
      </motion.div>

      {/* 3. SMART CARDS - Role-Aware Alerts */}
      <motion.div variants={itemVariants} className="space-y-8">
        <div className="flex items-center justify-between border-b border-primary/5 pb-4">
          <h2 className="text-2xl font-serif font-black text-primary flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            VIR JOU AANDAG
          </h2>
          <div className="h-1 flex-1 bg-gradient-to-r from-accent/20 to-transparent ml-8 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Member Card: Pending Contributions */}
          {pendingPayments > 0 && (
            <Card className="sacred-card border-l-8 border-l-amber-500 hover:scale-[1.02] p-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-serif font-bold flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  Bydraes Benodig
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/60 font-medium leading-relaxed">
                  Daar is tans {pendingPayments} bydrae-item{pendingPayments > 1 ? 's' : ''} wat aandag verg.
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="link" onClick={() => setCurrentView('betaling')} className="text-amber-600 font-black uppercase tracking-widest p-0 h-auto text-xs hover:text-amber-700">
                  BEKYK OPSIES <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Leader Card: Pastoral Care Alerts */}
          {isUserLeier && activeKrisisse > 0 && (
            <Card className="sacred-card border-l-8 border-l-red-500 hover:scale-[1.02] p-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-serif font-bold flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  Wyk Krisis Verslae
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/60 font-medium leading-relaxed">
                  Daar is {activeKrisisse} nuwe of oop krisis-verslae wat opvolg in jou wyk benodig.
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="link" onClick={() => setCurrentView('krisis')} className="text-red-600 font-black uppercase tracking-widest p-0 h-auto text-xs">
                  Sien Aktiewe Verslae <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Admin Card: Synodal Oversight */}
          {isUserAdmin && (
            <Card className="sacred-card border-l-8 border-l-primary hover:scale-[1.02] p-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-serif font-bold flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  Oorsig Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/60 font-medium leading-relaxed">
                  {unansweredVrae > 0 ? `Daar is ${unansweredVrae} nuwe vrae aan die kantoor.` : 'Administrasie is tans op datum.'}
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="link" onClick={() => setCurrentView('hoof-admin-dashboard')} className="text-primary font-black uppercase tracking-widest p-0 h-auto text-xs">
                  SINODE BEHEER <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Fallback for empty smart layer */}
          {!pendingPayments && (!isUserLeier || !activeKrisisse) && (!isUserAdmin) && (
            <div className="lg:col-span-3 py-16 text-center glass-panel border-2 border-dashed border-primary/10 rounded-[2.5rem] sacred-shadow relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <CheckCircle className="w-16 h-16 text-accent/30 mx-auto mb-4" />
                </motion.div>
                <p className="text-primary/70 font-serif text-xl font-bold tracking-tight mb-2">Alles is in goeie orde</p>
                <p className="text-foreground/40 font-medium italic">"Mag daar vrede in jou huis wees vandag."</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. GEMEENTE VISIE SECTION */}
      <motion.div variants={itemVariants} className="relative rounded-[3rem] overflow-hidden group shadow-2xl h-80 md:h-96">
        <img
          src="https://images.unsplash.com/photo-1544427928-c49cdfebf194?q=80&w=2020&auto=format&fit=crop"
          alt="Gemeente Visie"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent flex items-end">
          <div className="p-10 md:p-16 w-full flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-serif font-black text-white mb-4 tracking-tight leading-tight">
                Ons Gemeente: <br />
                <span className="text-accent underline decoration-accent/30 underline-offset-8">'n Familie van Geloof</span>
              </h2>
              <p className="text-white/80 text-xl font-medium leading-relaxed">
                Saam bou ons aan 'n toekoms waar elke lidmaat geken, gehelp en toegerus word.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setCurrentView('vrae')}
              className="rounded-full px-12 py-8 h-auto text-xl font-black uppercase tracking-widest bg-accent text-primary hover:bg-white hover:scale-105 transition-all sacred-shadow-lg border-none"
            >
              KONTAK ONS
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
