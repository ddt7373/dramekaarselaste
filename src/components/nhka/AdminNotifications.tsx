import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import { sortWykeByNommer } from '@/types/nhka';
import { 
  Bell, 
  Send, 
  AlertTriangle, 
  Calendar, 
  Megaphone, 
  Heart, 
  BookOpen, 
  CreditCard,
  Loader2,
  Users,
  Eye,
  Clock,
  CheckCircle,
  Filter,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  target_audience: string;
  sent_at: string;
  read_count: number;
  total_sent: number;
}

interface Wyk {
  id: string;
  naam: string;
}

const notificationTypes = [
  { value: 'crisis', label: 'Krisis', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'event', label: 'Gebeurtenis', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'announcement', label: 'Aankondiging', icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-100' },
  { value: 'pastoral', label: 'Pastoraal', icon: Heart, color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'dagstukkies', label: 'Dagstukkies', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'payment', label: 'Betaling', icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-100' }
];

const priorityLevels = [
  { value: 'low', label: 'Laag', color: 'bg-gray-100 text-gray-700' },
  { value: 'normal', label: 'Normaal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'Hoog', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Dringend', color: 'bg-red-100 text-red-700' }
];

const targetAudiences = [
  { value: 'all', label: 'Alle lidmate' },
  { value: 'admins', label: 'Administrateurs' },
  { value: 'leraars', label: 'Leraars' },
  { value: 'ouderlings', label: 'Ouderlings' },
  { value: 'diakens', label: 'Diakens' },
  { value: 'specific_wyk', label: 'Spesifieke wyk' }
];

export const AdminNotifications: React.FC = () => {
  const { currentUser, selectedGemeente } = useNHKA();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('send');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wyke, setWyke] = useState<Wyk[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('announcement');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [selectedWyk, setSelectedWyk] = useState('');

  useEffect(() => {
    loadNotifications();
    loadWyke();
  }, [selectedGemeente]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (selectedGemeente?.id) {
        query = query.eq('gemeente_id', selectedGemeente.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWyke = async () => {
    if (!selectedGemeente?.id) return;

    try {
      const { data, error } = await supabase
        .from('wyke')
        .select('id, naam')
        .eq('gemeente_id', selectedGemeente.id)
        .order('naam');

      if (error) throw error;
      setWyke(sortWykeByNommer(data || []));
    } catch (error) {
      console.error('Error loading wyke:', error);
    }
  };

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: 'Velde ontbreek',
        description: 'Vul asseblief die titel en boodskap in.',
        variant: 'destructive'
      });
      return;
    }

    if (targetAudience === 'specific_wyk' && !selectedWyk) {
      toast({
        title: 'Wyk ontbreek',
        description: 'Kies asseblief \'n wyk.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          type,
          priority,
          gemeente_id: selectedGemeente?.id,
          target_audience: targetAudience,
          target_wyk_id: targetAudience === 'specific_wyk' ? selectedWyk : null,
          sent_by: currentUser?.id,
          data: {
            url: getUrlForType(type)
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Kennisgewing gestuur',
        description: `Kennisgewing is na ${data.eligible_subscriptions} ontvangers gestuur.`
      });

      // Reset form
      setTitle('');
      setBody('');
      setType('announcement');
      setPriority('normal');
      setTargetAudience('all');
      setSelectedWyk('');
      setShowPreview(false);

      // Reload notifications
      loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie kennisgewing stuur nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const getUrlForType = (notifType: string): string => {
    switch (notifType) {
      case 'crisis': return '/krisis';
      case 'event': return '/program';
      case 'pastoral': return '/pastorale-aksie';
      case 'dagstukkies': return '/';
      case 'payment': return '/betaling';
      default: return '/';
    }
  };

  const getTypeInfo = (typeValue: string) => {
    return notificationTypes.find(t => t.value === typeValue) || notificationTypes[2];
  };

  const getPriorityInfo = (priorityValue: string) => {
    return priorityLevels.find(p => p.value === priorityValue) || priorityLevels[1];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('af-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: 'Verwyder',
        description: 'Kennisgewing is verwyder.'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie kennisgewing verwyder nie.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kennisgewings</h2>
          <p className="text-gray-500">Stuur kennisgewings aan lidmate</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadNotifications}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Herlaai
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Stuur kennisgewing
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Geskiedenis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notification Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nuwe kennisgewing</CardTitle>
                  <CardDescription>
                    Stel jou kennisgewing op en stuur dit aan die geselekteerde ontvangers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Voer die kennisgewingtitel in..."
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500">{title.length}/100 karakters</p>
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label htmlFor="body">Boodskap *</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Voer die kennisgewingboodskap in..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">{body.length}/500 karakters</p>
                  </div>

                  {/* Type and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipe</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {notificationTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              <div className="flex items-center gap-2">
                                <t.icon className={`h-4 w-4 ${t.color}`} />
                                {t.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioriteit</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityLevels.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              <Badge className={p.color}>{p.label}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label>Teikengehoor</Label>
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {targetAudiences.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Wyk Selection */}
                  {targetAudience === 'specific_wyk' && (
                    <div className="space-y-2">
                      <Label>Wyk</Label>
                      <Select value={selectedWyk} onValueChange={setSelectedWyk}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kies 'n wyk..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wyke.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.naam}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      disabled={!title.trim() || !body.trim()}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voorskou
                    </Button>
                    <Button
                      onClick={sendNotification}
                      disabled={sending || !title.trim() || !body.trim()}
                      className="bg-nhka-blue hover:bg-nhka-blue/90"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Stuur...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Stuur kennisgewing
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Templates */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vinnige sjablone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setTitle('Erediens herinnering');
                      setBody('Onthou om vanoggend se erediens by te woon. Ons sien uit daarna om jou te sien!');
                      setType('event');
                      setPriority('normal');
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Erediens herinnering
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setTitle('Dringende gebedversoek');
                      setBody('Ons versoek dringende gebed vir \'n lidmaat wat in nood verkeer.');
                      setType('pastoral');
                      setPriority('high');
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2 text-green-600" />
                    Gebedversoek
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setTitle('Belangrike aankondiging');
                      setBody('Daar is \'n belangrike aankondiging wat alle lidmate raak.');
                      setType('announcement');
                      setPriority('normal');
                    }}
                  >
                    <Megaphone className="h-4 w-4 mr-2 text-purple-600" />
                    Aankondiging
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setTitle('DRINGEND: Krisis waarskuwing');
                      setBody('Daar is \'n dringende krisis wat onmiddellike aandag vereis.');
                      setType('crisis');
                      setPriority('urgent');
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Krisis waarskuwing
                  </Button>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistieke</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Totaal gestuur</span>
                    <span className="font-semibold">{notifications.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Hierdie maand</span>
                    <span className="font-semibold">
                      {notifications.filter(n => {
                        const date = new Date(n.sent_at);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Dringende</span>
                    <span className="font-semibold text-red-600">
                      {notifications.filter(n => n.priority === 'urgent').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kennisgewinggeskiedenis</CardTitle>
              <CardDescription>
                Alle kennisgewings wat gestuur is
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-nhka-blue" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Geen kennisgewings gestuur nie</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Titel</TableHead>
                        <TableHead>Prioriteit</TableHead>
                        <TableHead>Gehoor</TableHead>
                        <TableHead>Gestuur</TableHead>
                        <TableHead className="text-right">Aksies</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => {
                        const typeInfo = getTypeInfo(notification.type);
                        const priorityInfo = getPriorityInfo(notification.priority);
                        const TypeIcon = typeInfo.icon;
                        
                        return (
                          <TableRow key={notification.id}>
                            <TableCell>
                              <div className={`p-2 rounded-lg inline-flex ${typeInfo.bg}`}>
                                <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{notification.title}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {notification.body}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={priorityInfo.color}>
                                {priorityInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{notification.total_sent}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(notification.sent_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kennisgewingvoorskou</DialogTitle>
            <DialogDescription>
              So sal die kennisgewing op toestelle lyk
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Mobile Preview */}
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="bg-white rounded-lg shadow-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeInfo(type).bg}`}>
                    {React.createElement(getTypeInfo(type).icon, {
                      className: `h-5 w-5 ${getTypeInfo(type).color}`
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">NHKA</p>
                      <span className="text-xs text-gray-400">nou</span>
                    </div>
                    <p className="font-medium text-gray-900">{title || 'Titel'}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {body || 'Boodskap...'}
                    </p>
                  </div>
                </div>
                {priority === 'urgent' && (
                  <Badge className="bg-red-100 text-red-700">Dringend</Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Tipe:</strong> {getTypeInfo(type).label}</p>
              <p><strong>Prioriteit:</strong> {getPriorityInfo(priority).label}</p>
              <p><strong>Gehoor:</strong> {targetAudiences.find(a => a.value === targetAudience)?.label}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Sluit
            </Button>
            <Button 
              onClick={() => {
                setShowPreview(false);
                sendNotification();
              }}
              disabled={sending}
              className="bg-nhka-blue hover:bg-nhka-blue/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Stuur nou
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
