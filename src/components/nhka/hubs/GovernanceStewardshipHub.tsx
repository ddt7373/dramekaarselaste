import React from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Wallet, ShieldCheck, FileText, LayoutDashboard, Settings, Gift } from 'lucide-react';
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

const StewardshipHub: React.FC = () => {
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
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary">Bestuur & Rentmeesterskap</h1>
                    <p className="text-foreground/60 italic font-medium">Getroue bestuur van die gawes en hulpbronne wat God ons toevertrou.</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Giving Section */}
                <Card className="sacred-card bg-amber-50/10 p-2">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                            <Gift className="w-6 h-6 text-amber-600" />
                        </div>
                        <CardTitle>My Bydraes</CardTitle>
                        <CardDescription>Offers as daad van aanbidding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" onClick={() => setCurrentView('betaling')} className="w-full justify-start gap-2">
                            <Wallet className="w-4 h-4 text-amber-600" /> Doen 'n Bydrae / Offer
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('betaling')} className="w-full justify-start gap-2">
                            <Heart className="w-4 h-4 text-amber-600" /> My Talente & Gawes
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('betaling')} className="w-full justify-start gap-2">
                            <FileText className="w-4 h-4 text-amber-600" /> Offergawes Geskiedenis
                        </Button>
                    </CardContent>
                </Card>

                {/* Governance Layer */}
                {isLeader && (
                    <Card className="sacred-card bg-blue-50/10 border-l-8 border-l-blue-400 p-2">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                                <ShieldCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <CardTitle>Kerkbestuur</CardTitle>
                            <CardDescription>Gemeente administrasie</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button onClick={() => setCurrentView('gebruikers' as any)} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <LayoutDashboard className="w-4 h-4" /> Lidmaatbestuur
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('admin')} className="w-full justify-start gap-2">
                                <Settings className="w-4 h-4 text-blue-600" /> Gemeente Instellings
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('program')} className="w-full justify-start gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> Jaarprogram Bestuur
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Regional Governance Layer */}
                {isAdmin(currentUser.rol) && (
                    <Card className="sacred-card bg-slate-50/10 border-l-8 border-l-slate-400 p-2">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                                <LayoutDashboard className="w-6 h-6 text-slate-600" />
                            </div>
                            <CardTitle>Sinodale Bestuur</CardTitle>
                            <CardDescription>Nakoming en finansies</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" onClick={() => setCurrentView('hoof-admin-dashboard')} className="w-full justify-start gap-2">
                                <LayoutDashboard className="w-4 h-4 text-slate-600" /> Sinodale Dashboard
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('rol-bestuur')} className="w-full justify-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-slate-600" /> Rol & Toegang Bestuur
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            {/* Stewardship Message */}
            <motion.div variants={itemVariants}>
                <Card className="sacred-card p-10 bg-amber-50/50 border border-amber-100/50 text-center relative group">
                    <div className="absolute inset-0 bg-accent/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                    <div className="relative z-10">
                        <h3 className="text-3xl font-serif font-black text-amber-900 mb-4 tracking-tight">Rentmeesterskap</h3>
                        <p className="text-amber-800 text-lg mb-8 leading-relaxed italic max-w-2xl mx-auto">
                            Getroue bestuur van die gawes en hulpbronne wat God ons toevertrou. Vir direkte inbetalings, gebruik asseblief die besonderhede by die betaling-skerm.
                        </p>
                        <Button
                            onClick={() => setCurrentView('betaling')}
                            className="rounded-full px-12 py-8 h-auto text-xl font-black uppercase tracking-widest bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-lg border-none"
                        >
                            GAAN NA BETALINGS
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default StewardshipHub;
