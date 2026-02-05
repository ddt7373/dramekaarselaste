import React from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Heart, MessageSquare, ShieldCheck, Map, LayoutDashboard, Search } from 'lucide-react';
import { isLeier, isAdmin } from '@/types/nhka';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } }
};

const CommunityHub: React.FC = () => {
    const { currentUser, currentGemeente, setCurrentView } = useNHKA();

    if (!currentUser) return null;
    const isLeader = isLeier(currentUser.rol) || isAdmin(currentUser.rol);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-2 w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" /> Terug na Dashboard
                    </button>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary">Gemeenskap & Sorg</h1>
                    <p className="text-foreground/60 italic font-medium">Omgee vir mekaar as die familie van God.</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Connection Section */}
                <Card className="sacred-card bg-green-50/10 p-2">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-2">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle>Verbondenheid</CardTitle>
                        <CardDescription>Ken mekaar, dra mekaar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" onClick={() => setCurrentView('lidmate' as any)} className="w-full justify-start gap-2">
                            <Search className="w-4 h-4 text-green-600" /> Lidmaatgids
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('advertensies')} className="w-full justify-start gap-2">
                            <MessageSquare className="w-4 h-4 text-green-600" /> Gemeenskapskunde (Gawes/Behoeftes)
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('my-wyk')} className="w-full justify-start gap-2">
                            <Map className="w-4 h-4 text-green-600" /> My Wyk & Omgee-groep
                        </Button>
                    </CardContent>
                </Card>

                {/* Pastoral Support Layer */}
                {isLeader && (
                    <Card className="sacred-card bg-orange-50/10 border-l-8 border-l-orange-400 p-2">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-2">
                                <Heart className="w-6 h-6 text-orange-600" />
                            </div>
                            <CardTitle>Pastorale Sorg</CardTitle>
                            <CardDescription>Shepherding en ondersteuning</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button onClick={() => setCurrentView('pastorale-aksie')} className="w-full justify-start gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                                <ShieldCheck className="w-4 h-4" /> Registreer Pastorale Aksie
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('krisis')} className="w-full justify-start gap-2">
                                <Heart className="w-4 h-4 text-orange-600" /> Krisisbestuur
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('my-wyk')} className="w-full justify-start gap-2">
                                <Users className="w-4 h-4 text-orange-600" /> Wyksbestuur
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Regional/Sinodal Layer */}
                {isAdmin(currentUser.rol) && (
                    <Card className="sacred-card bg-slate-50/10 border-l-8 border-l-slate-400 p-2">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                                <LayoutDashboard className="w-6 h-6 text-slate-600" />
                            </div>
                            <CardTitle>Streeks-oorsig (Ring/Sinode)</CardTitle>
                            <CardDescription>Statistiek en gesondheid</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" onClick={() => setCurrentView('hoof-admin-dashboard')} className="w-full justify-start gap-2">
                                <LayoutDashboard className="w-4 h-4 text-slate-600" /> Streeks Dashboard
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('denominasie-kaart')} className="w-full justify-start gap-2">
                                <Map className="w-4 h-4 text-slate-600" /> Predikante-netwerk & Kaart
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="sacred-card p-10 bg-[#002855] text-white relative group">
                    <div className="absolute inset-0 bg-accent/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                    <div className="relative z-10">
                        <h3 className="text-3xl font-serif font-black mb-4 tracking-tight">Het jy hulp nodig?</h3>
                        <p className="text-white/70 text-lg mb-8 leading-relaxed italic">
                            Onse Here dra ons, en ons dra mekaar. Kontak jou wyk-leier of die kerkkantoor vir enige pastorale hulp.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentView('vrae')}
                            className="rounded-full px-12 py-8 h-auto text-xl font-black uppercase tracking-widest bg-accent text-primary hover:bg-white transition-all shadow-lg border-none"
                        >
                            KONTAK ONS
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default CommunityHub;
