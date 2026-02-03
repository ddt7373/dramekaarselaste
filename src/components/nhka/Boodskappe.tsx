import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Send,
  Inbox,
  Search,
  Plus,
  ArrowLeft,
  Check,
  CheckCheck,
  Trash2,
  Users,
  User,
  Clock,
  RefreshCw,
  Filter,
  MailOpen,
  Reply,
  Forward,
  AlertCircle,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { Boodskap, BoodskapOntvanger, GroepTipe, getRolLabel, Gebruiker, isRestrictedLeader, UserRole } from '@/types/nhka';

// WhatsApp SVG Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const formatPhoneForWhatsApp = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '27' + cleaned.substring(1);
  if (!cleaned.startsWith('27') && cleaned.length === 9) cleaned = '27' + cleaned;
  return cleaned;
};

interface BoodskapMetOntvanger extends BoodskapOntvanger {
  boodskap: Boodskap;
}

type ViewMode = 'inbox' | 'sent' | 'compose' | 'detail';
type FilterMode = 'all' | 'unread' | 'read';

const Boodskappe: React.FC = () => {
  const { currentUser, currentGemeente, gebruikers, wyke, besoekpunte, addPastoraleAksie } = useNHKA();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Messages
  const [inboxMessages, setInboxMessages] = useState<BoodskapMetOntvanger[]>([]);
  const [sentMessages, setSentMessages] = useState<Boodskap[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<BoodskapMetOntvanger | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Compose state
  const [composeMode, setComposeMode] = useState<'individual' | 'group'>('individual');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [groupType, setGroupType] = useState<GroepTipe | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [replyTo, setReplyTo] = useState<BoodskapMetOntvanger | null>(null);
  const [sendMethod, setSendMethod] = useState<'app' | 'whatsapp'>('app');
  const [whatsappGroupName, setWhatsappGroupName] = useState('');

  // Fetch messages
  const fetchMessages = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Fetch inbox messages
      const { data: inboxData, error: inboxError } = await supabase
        .from('boodskap_ontvangers')
        .select(`
          *,
          boodskap:boodskappe(*)
        `)
        .eq('ontvanger_id', currentUser.id)
        .is('verwyder_op', null)
        .order('created_at', { ascending: false });

      if (inboxError) {
        console.error('Error fetching inbox:', inboxError);
      } else if (inboxData) {
        const messagesWithBoodskap = inboxData.filter(m => m.boodskap) as BoodskapMetOntvanger[];
        setInboxMessages(messagesWithBoodskap);
        setUnreadCount(messagesWithBoodskap.filter(m => !m.gelees_op).length);
      }

      // Fetch sent messages
      const { data: sentData, error: sentError } = await supabase
        .from('boodskappe')
        .select('*')
        .eq('sender_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error('Error fetching sent:', sentError);
      } else if (sentData) {
        setSentMessages(sentData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentUser]);

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('boodskap_ontvangers')
      .update({ gelees_op: new Date().toISOString() })
      .eq('id', messageId)
      .eq('ontvanger_id', currentUser.id);

    if (!error) {
      setInboxMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, gelees_op: new Date().toISOString() } : m)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('boodskap_ontvangers')
      .update({ verwyder_op: new Date().toISOString() })
      .eq('id', messageId)
      .eq('ontvanger_id', currentUser.id);

    if (!error) {
      setInboxMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
        setViewMode('inbox');
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!currentUser || !currentGemeente || !subject.trim() || !messageContent.trim()) return;

    setSending(true);
    try {
      let recipients: Gebruiker[] = [];
      let isGroupMessage = composeMode === 'group';

      if (composeMode === 'individual') {
        recipients = selectedRecipients.map(id => gebruikers.find(g => g.id === id)!).filter(Boolean);
      } else {
        // Group message filtering
        if (groupType === 'almal') {
          recipients = gebruikers.filter(g => g.aktief && g.id !== currentUser.id);
        } else if (groupType === 'wyk' && selectedGroupId) {
          recipients = gebruikers.filter(g => g.wyk_id === selectedGroupId && g.aktief && g.id !== currentUser.id);
        } else if (groupType === 'besoekpunt' && selectedGroupId) {
          recipients = gebruikers.filter(g => g.besoekpunt_id === selectedGroupId && g.aktief && g.id !== currentUser.id);
        } else if (groupType === 'rol' && selectedRole) {
          recipients = gebruikers.filter(g => g.rol === selectedRole && g.aktief && g.id !== currentUser.id);
        }
      }

      if (recipients.length === 0) {
        alert('Kies asseblief ten minste een ontvanger');
        setSending(false);
        return;
      }

      const finalMessage = whatsappGroupName
        ? `*${whatsappGroupName}*\n\n${messageContent}`
        : messageContent;

      if (sendMethod === 'whatsapp') {
        const recipientsWithPhone = recipients.filter(r => r.selfoon);
        if (recipientsWithPhone.length === 0) {
          alert('Geen gekose ontvangers het selfoonnommers nie');
          setSending(false);
          return;
        }

        if (recipientsWithPhone.length > 1) {
          window.open(`https://wa.me/?text=${encodeURIComponent(finalMessage)}`, '_blank');
        } else {
          window.open(`https://wa.me/${formatPhoneForWhatsApp(recipientsWithPhone[0].selfoon!)}?text=${encodeURIComponent(messageContent)}`, '_blank');
        }

        // Record pastoral actions for WhatsApp
        for (const r of recipientsWithPhone) {
          await addPastoraleAksie({
            gebruiker_id: r.id,
            leier_id: currentUser.id,
            tipe: 'boodskap',
            datum: new Date().toISOString().split('T')[0],
            nota: recipientsWithPhone.length > 1
              ? `WhatsApp Boodskappe (Groep: ${whatsappGroupName || 'Geen naam'}): ${messageContent.substring(0, 50)}...`
              : `WhatsApp Boodskappe: ${messageContent.substring(0, 50)}...`
          });
        }
      }

      // Always save to database as well (Internal Messaging)
      // Create the message
      const { data: messageData, error: messageError } = await supabase
        .from('boodskappe')
        .insert([{
          sender_id: currentUser.id,
          sender_naam: `${currentUser.naam} ${currentUser.van}`,
          onderwerp: subject,
          inhoud: messageContent,
          gemeente_id: currentGemeente.id,
          is_groep_boodskap: isGroupMessage,
          groep_tipe: isGroupMessage ? groupType : null,
          groep_id: isGroupMessage && (groupType === 'wyk' || groupType === 'besoekpunt') ? selectedGroupId : null,
          groep_rol: isGroupMessage && groupType === 'rol' ? selectedRole : null
        }])
        .select()
        .single();

      if (!messageError) {
        const recipientRecords = recipients.map(r => ({
          boodskap_id: messageData.id,
          ontvanger_id: r.id,
          ontvanger_naam: `${r.naam} ${r.van}`
        }));
        await supabase.from('boodskap_ontvangers').insert(recipientRecords);
      }

      // Reset form and refresh
      setSubject('');
      setMessageContent('');
      setSelectedRecipients([]);
      setGroupType('');
      setSelectedGroupId('');
      setSelectedRole('');
      setReplyTo(null);
      setWhatsappGroupName('');
      setViewMode('sent');
      await fetchMessages();

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Kon nie boodskap stuur nie');
    } finally {
      setSending(false);
    }
  };

  // Handle reply
  const handleReply = (message: BoodskapMetOntvanger) => {
    setReplyTo(message);
    setSubject(`Re: ${message.boodskap.onderwerp}`);
    setSelectedRecipients([message.boodskap.sender_id]);
    setComposeMode('individual');
    setViewMode('compose');
  };

  // Filter messages
  const filteredInbox = inboxMessages.filter(m => {
    const matchesSearch = searchQuery === '' ||
      m.boodskap.onderwerp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boodskap.sender_naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boodskap.inhoud.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterMode === 'all' ||
      (filterMode === 'unread' && !m.gelees_op) ||
      (filterMode === 'read' && m.gelees_op);

    return matchesSearch && matchesFilter;
  });

  const filteredSent = sentMessages.filter(m => {
    return searchQuery === '' ||
      m.onderwerp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.inhoud.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Gister';
    } else if (days < 7) {
      return date.toLocaleDateString('af-ZA', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('af-ZA', { day: 'numeric', month: 'short' });
    }
  };

  // Available roles for group messaging
  const availableRoles = [
    { value: 'lidmaat', label: 'Lidmate' },
    { value: 'ouderling', label: 'Ouderlinge' },
    { value: 'diaken', label: 'Diakens' },
    { value: 'predikant', label: 'Predikante' },
    { value: 'groepleier', label: 'Groepleiers' }
  ];

  if (!currentUser) return null;

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#002855]">Boodskappe</h1>
          <p className="text-sm text-gray-600">Kommunikeer met gemeentelede en leiers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Herlaai</span>
          </Button>
          <Button
            onClick={() => {
              setViewMode('compose');
              setReplyTo(null);
              setSubject('');
              setMessageContent('');
              setSelectedRecipients([]);
            }}
            className="bg-[#002855] hover:bg-[#002855]/90 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Nuwe Boodskap</span>
            <span className="sm:hidden">Nuut</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar - Navigation */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setViewMode('inbox')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${viewMode === 'inbox' ? 'bg-[#002855] text-white' : 'hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Inbox className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Inkassie</span>
                </div>
                {unreadCount > 0 && (
                  <Badge className={`flex-shrink-0 ${viewMode === 'inbox' ? 'bg-[#D4A84B] text-[#002855]' : 'bg-[#9E2A2B] text-white'}`}>
                    {unreadCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setViewMode('sent')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${viewMode === 'sent' ? 'bg-[#002855] text-white' : 'hover:bg-gray-100'
                  }`}
              >
                <Send className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Gestuur</span>
              </button>
            </nav>

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Totaal Ontvang</span>
                <span className="font-medium">{inboxMessages.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ongelees</span>
                <span className="font-medium text-[#9E2A2B]">{unreadCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Gestuur</span>
                <span className="font-medium">{sentMessages.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4 sm:p-6">
            {/* Inbox View */}
            {viewMode === 'inbox' && (
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Soek boodskappe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="unread">Ongelees</SelectItem>
                      <SelectItem value="read">Gelees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message List */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Laai boodskappe...</div>
                ) : filteredInbox.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Geen boodskappe gevind nie</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    <div className="space-y-2">
                      {filteredInbox.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => {
                            setSelectedMessage(message);
                            setViewMode('detail');
                            if (!message.gelees_op) {
                              markAsRead(message.id);
                            }
                          }}
                          className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${!message.gelees_op ? 'bg-blue-50/50 border-blue-200' : 'bg-white'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${!message.gelees_op ? 'bg-[#002855] text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                              {message.boodskap.is_groep_boodskap ? (
                                <Users className="w-5 h-5" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-medium truncate ${!message.gelees_op ? 'text-[#002855]' : 'text-gray-900'}`}>
                                  {message.boodskap.sender_naam}
                                </span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                              <p className={`text-sm truncate ${!message.gelees_op ? 'font-medium' : ''}`}>
                                {message.boodskap.onderwerp}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {message.boodskap.inhoud.substring(0, 80)}...
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {message.gelees_op ? (
                                <CheckCheck className="w-4 h-4 text-green-500" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-[#002855]" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Sent View */}
            {viewMode === 'sent' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Soek gestuurde boodskappe..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sent Message List */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Laai boodskappe...</div>
                ) : filteredSent.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Geen gestuurde boodskappe nie</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    <div className="space-y-2">
                      {filteredSent.map((message) => (
                        <div
                          key={message.id}
                          className="p-3 sm:p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D4A84B]/20 flex items-center justify-center flex-shrink-0">
                              {message.is_groep_boodskap ? (
                                <Users className="w-5 h-5 text-[#D4A84B]" />
                              ) : (
                                <Send className="w-5 h-5 text-[#D4A84B]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {message.onderwerp}
                                </span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {message.is_groep_boodskap ? (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">Groepboodskap</span>
                                  </span>
                                ) : (
                                  'Individuele boodskap'
                                )}
                              </p>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {message.inhoud.substring(0, 80)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Message Detail View */}
            {viewMode === 'detail' && selectedMessage && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewMode('inbox');
                    setSelectedMessage(null);
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                  Terug na Inkassie
                </Button>

                <div className="border rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 pb-4 border-b">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-[#002855] break-words">
                        {selectedMessage.boodskap.onderwerp}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                        <span className="font-medium">{selectedMessage.boodskap.sender_naam}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {new Date(selectedMessage.created_at).toLocaleString('af-ZA')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReply(selectedMessage)}
                      >
                        <Reply className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="hidden sm:inline">Antwoord</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMessage(selectedMessage.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 flex-shrink-0" />
                      </Button>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 break-words">
                      {selectedMessage.boodskap.inhoud}
                    </p>
                  </div>

                  {selectedMessage.boodskap.is_groep_boodskap && (
                    <div className="mt-4 pt-4 border-t">
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        Groepboodskap
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compose View */}
            {viewMode === 'compose' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setViewMode('inbox');
                      setReplyTo(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                    Kanselleer
                  </Button>
                  <h2 className="text-lg font-bold text-[#002855]">
                    {replyTo ? 'Antwoord' : 'Nuwe Boodskap'}
                  </h2>
                </div>

                {/* Send Method Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-full mb-4">
                  <button
                    onClick={() => setSendMethod('app')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${sendMethod === 'app'
                      ? 'bg-white text-[#002855] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Smartphone className="w-4 h-4 inline mr-2" />
                    In-App
                  </button>
                  <button
                    onClick={() => setSendMethod('whatsapp')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${sendMethod === 'whatsapp'
                      ? 'bg-white text-[#002855] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <WhatsAppIcon className="w-4 h-4 inline mr-2" />
                    WhatsApp
                  </button>
                </div>

                {/* Compose Mode Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                  <button
                    onClick={() => setComposeMode('individual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${composeMode === 'individual'
                      ? 'bg-white text-[#002855] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Individu
                  </button>
                  <button
                    onClick={() => setComposeMode('group')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${composeMode === 'group'
                      ? 'bg-white text-[#002855] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Groep
                  </button>
                </div>

                {/* Individual Recipients */}
                {composeMode === 'individual' && (
                  <div className="space-y-2">
                    <Label>Ontvangers</Label>
                    <ScrollArea className="h-40 border rounded-lg p-3">
                      <div className="space-y-2">
                        {gebruikers
                          .filter(g => {
                            if (!g.aktief || g.id === currentUser.id) return false;
                            if (isRestrictedLeader(currentUser.rol)) {
                              return g.wyk_id === currentUser.wyk_id;
                            }
                            return true;
                          })
                          .map((user) => (
                            <div key={user.id} className="flex items-center gap-2">
                              <Checkbox
                                id={user.id}
                                checked={selectedRecipients.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRecipients([...selectedRecipients, user.id]);
                                  } else {
                                    setSelectedRecipients(selectedRecipients.filter(id => id !== user.id));
                                  }
                                }}
                              />
                              <label htmlFor={user.id} className="text-sm cursor-pointer truncate">
                                {user.naam} {user.van}
                                <span className="text-gray-500 ml-1">({getRolLabel(user.rol)})</span>
                              </label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                    {selectedRecipients.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {selectedRecipients.length} ontvanger(s) gekies
                      </p>
                    )}
                  </div>
                )}

                {/* Group Recipients */}
                {composeMode === 'group' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Groep Tipe</Label>
                      <Select value={groupType} onValueChange={(v) => {
                        setGroupType(v as GroepTipe);
                        setSelectedGroupId('');
                        setSelectedRole('');
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kies groep tipe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {!isRestrictedLeader(currentUser.rol) && <SelectItem value="almal">Alle Lidmate</SelectItem>}
                          <SelectItem value="wyk">Spesifieke Wyk</SelectItem>
                          {!isRestrictedLeader(currentUser.rol) && (
                            <>
                              <SelectItem value="besoekpunt">Spesifieke Besoekpunt</SelectItem>
                              <SelectItem value="rol">Spesifieke Rol</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {groupType === 'wyk' && (
                      <div className="space-y-2">
                        <Label>Wyk</Label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies wyk..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wyke
                              .filter(wyk => {
                                if (isRestrictedLeader(currentUser.rol)) {
                                  return wyk.id === currentUser.wyk_id;
                                }
                                return true;
                              })
                              .map((wyk) => (
                                <SelectItem key={wyk.id} value={wyk.id}>{wyk.naam}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {groupType === 'besoekpunt' && (
                      <div className="space-y-2">
                        <Label>Besoekpunt</Label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies besoekpunt..." />
                          </SelectTrigger>
                          <SelectContent>
                            {besoekpunte.map((bp) => (
                              <SelectItem key={bp.id} value={bp.id}>{bp.naam}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {groupType === 'rol' && (
                      <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies rol..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {groupType && (
                      <p className="text-sm text-gray-500">
                        {groupType === 'almal' && `Sal gestuur word aan ${gebruikers.filter(g => g.aktief && g.id !== currentUser.id).length} lidmate`}
                        {groupType === 'wyk' && selectedGroupId && `Sal gestuur word aan ${gebruikers.filter(g => g.wyk_id === selectedGroupId && g.aktief && g.id !== currentUser.id).length} lidmate`}
                        {groupType === 'besoekpunt' && selectedGroupId && `Sal gestuur word aan ${gebruikers.filter(g => g.besoekpunt_id === selectedGroupId && g.aktief && g.id !== currentUser.id).length} lidmate`}
                        {groupType === 'rol' && selectedRole && `Sal gestuur word aan ${gebruikers.filter(g => g.rol === selectedRole && g.aktief && g.id !== currentUser.id).length} lidmate`}
                      </p>
                    )}
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-2">
                  <Label>Onderwerp</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Voer onderwerp in..."
                  />
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <Label>Boodskap</Label>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Skryf jou boodskap hier..."
                    rows={8}
                  />
                </div>

                {/* WhatsApp Group Guidance */}
                {sendMethod === 'whatsapp' && (composeMode === 'group' || selectedRecipients.length > 1) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">WhatsApp Groep Boodskap</p>
                        <p>Onthou om eers die groep in jou WhatsApp toepassing te skep voordat jy stuur.</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Groepnaam (Opsioneel)</Label>
                      <Input
                        value={whatsappGroupName}
                        onChange={(e) => setWhatsappGroupName(e.target.value)}
                        placeholder="Bv. Wyk 12 / Kerkraad"
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewMode('inbox');
                      setReplyTo(null);
                    }}
                  >
                    Kanselleer
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !subject.trim() || !messageContent.trim() ||
                      (composeMode === 'individual' && selectedRecipients.length === 0) ||
                      (composeMode === 'group' && !groupType)}
                    className="bg-[#002855] hover:bg-[#002855]/90"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                        Stuur...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2 flex-shrink-0" />
                        Stuur Boodskap
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Boodskappe;
