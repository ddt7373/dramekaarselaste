import React from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Calendar, Music, Flame, User, Users, ShieldCheck, LayoutDashboard } from 'lucide-react';
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

const WorshipHub: React.FC = () => {
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
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary">Reis & Aanbidding</h1>
                    <p className="text-foreground/60 italic font-medium">Geestelike groei en die erediens as die hart van ons gemeente.</p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Personal Growth Section */}
                <Card className="sacred-card bg-blue-50/10 p-2">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <CardTitle>My Geestelike Reis</CardTitle>
                        <CardDescription>Persoonlike groei en kategese</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" onClick={() => setCurrentView('profiel')} className="w-full justify-start gap-2">
                            <User className="w-4 h-4" /> My Profiel & Belydenis
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('geloofsonderrig')} className="w-full justify-start gap-2">
                            <Flame className="w-4 h-4 text-orange-500" /> Geloofsonderrig (Kategese)
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('bybelkennis')} className="w-full justify-start gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" /> Bybelkennis & Vasvra
                        </Button>
                    </CardContent>
                </Card>

                {/* Worship & Liturgy Section */}
                <Card className="sacred-card bg-purple-50/10 p-2">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                            <Music className="w-6 h-6 text-purple-600" />
                        </div>
                        <CardTitle>Aanbidding & Liturgie</CardTitle>
                        <CardDescription>Saam as liggaam van Christus</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" onClick={() => setCurrentView('program')} className="w-full justify-start gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" /> Gemeente Program
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('erediens-info')} className="w-full justify-start gap-2">
                            <Music className="w-4 h-4 text-purple-600" /> Erediens Besonderhede
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('nuusbrief')} className="w-full justify-start gap-2">
                            <BookOpen className="w-4 h-4 text-purple-600" /> Nuusbriewe & Afkondigings
                        </Button>
                    </CardContent>
                </Card>

                {/* Leadership Pillar - Dynamic Layer */}
                {isLeader && (
                    <Card className="sacred-card bg-amber-50/10 border-l-8 border-l-amber-400 p-2">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                                <ShieldCheck className="w-6 h-6 text-amber-600" />
                            </div>
                            <CardTitle>Leierskap & Toerusting</CardTitle>
                            <CardDescription>Gereedskap vir diens</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button onClick={() => setCurrentView('vbo')} className="w-full justify-start gap-2 bg-amber-600 hover:bg-amber-700">
                                <Users className="w-4 h-4" /> VBO & Toerusting
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('erediens-info')} className="w-full justify-start gap-2">
                                <Music className="w-4 h-4" /> Liturgie Voorbereiding
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentView('konsistorieboek')} className="w-full justify-start gap-2">
                                <BookOpen className="w-4 h-4" /> Konsistorieboek
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="sacred-card p-10 bg-[#002855] text-white relative group min-h-[300px] flex items-center">
                    <div className="absolute inset-0 bg-accent/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                    <img
                        src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2071&auto=format&fit=crop"
                        alt="Worship"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                    />
                    <div className="relative z-10 w-full">
                        <h3 className="text-3xl font-serif font-black mb-4 tracking-tight">Geloofsonderrig</h3>
                        <p className="text-white/70 text-lg mb-8 leading-relaxed italic max-w-md">
                            KI-Kats is 'n interaktiewe manier om die rykdom van ons geloofsbelydenisse te verken.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentView('geloofsonderrig')}
                            className="rounded-full px-10 py-6 h-auto font-black uppercase tracking-widest bg-accent text-primary hover:bg-white transition-all shadow-lg border-none"
                        >
                            BEGIN NOU <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default WorshipHub;
