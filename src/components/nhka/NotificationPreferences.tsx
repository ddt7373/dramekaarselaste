import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNHKA } from '@/contexts/NHKAContext';
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  Calendar, 
  Megaphone, 
  Heart, 
  BookOpen, 
  CreditCard,
  Mail,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle,
  Smartphone
} from 'lucide-react';

// VAPID public key for push notifications
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

interface NotificationPrefs {
  crisis_alerts: boolean;
  event_reminders: boolean;
  announcements: boolean;
  pastoral_updates: boolean;
  dagstukkies: boolean;
  payment_reminders: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

const defaultPreferences: NotificationPrefs = {
  crisis_alerts: true,
  event_reminders: true,
  announcements: true,
  pastoral_updates: true,
  dagstukkies: true,
  payment_reminders: true,
  email_notifications: false,
  sms_notifications: false
};

export const NotificationPreferences: React.FC = () => {
  const { currentUser, selectedGemeente } = useNHKA();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<NotificationPrefs>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    checkPushSupport();
    loadPreferences();
  }, [currentUser]);

  const checkPushSupport = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushSubscription(subscription);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    }
  };

  const loadPreferences = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          crisis_alerts: data.crisis_alerts,
          event_reminders: data.event_reminders,
          announcements: data.announcements,
          pastoral_updates: data.pastoral_updates,
          dagstukkies: data.dagstukkies,
          payment_reminders: data.payment_reminders,
          email_notifications: data.email_notifications,
          sms_notifications: data.sms_notifications
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: currentUser.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Voorkeure gestoor',
        description: 'Jou kennisgewingvoorkeure is suksesvol opgedateer.'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie voorkeure stoor nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!currentUser?.id) {
      toast({
        title: 'Nie aangemeld',
        description: 'Meld asseblief aan om kennisgewings te aktiveer.',
        variant: 'destructive'
      });
      return;
    }

    setSubscribing(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        toast({
          title: 'Toestemming geweier',
          description: 'Kennisgewings is geblok. Aktiveer dit asseblief in jou blaaier-instellings.',
          variant: 'destructive'
        });
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setPushSubscription(subscription);

      // Save subscription to database
      const subscriptionJson = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: currentUser.id,
          gemeente_id: selectedGemeente?.id,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (error) throw error;

      toast({
        title: 'Kennisgewings geaktiveer',
        description: 'Jy sal nou stootkennisgewings ontvang.'
      });
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie kennisgewings aktiveer nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setSubscribing(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!pushSubscription || !currentUser?.id) return;

    setSubscribing(true);
    try {
      await pushSubscription.unsubscribe();
      
      // Remove from database
      const subscriptionJson = pushSubscription.toJSON();
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptionJson.endpoint);

      setPushSubscription(null);

      toast({
        title: 'Kennisgewings gedeaktiveer',
        description: 'Jy sal nie meer stootkennisgewings ontvang nie.'
      });
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie kennisgewings deaktiveer nie.',
        variant: 'destructive'
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testNotification = async () => {
    if (!pushSubscription) {
      toast({
        title: 'Nie geregistreer',
        description: 'Aktiveer eers stootkennisgewings.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Show a local notification for testing
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Toets Kennisgewing', {
        body: 'Hierdie is \'n toetskennisgewing van NHKA.',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'test-notification',
        data: { url: '/' }
      });

      toast({
        title: 'Toets gestuur',
        description: 'Kyk of jy die kennisgewing ontvang het.'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie toetskennisgewing stuur nie.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-nhka-blue" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Push Notification Status */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smartphone className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Stootkennisgewings</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Ontvang kennisgewings direk op jou toestel, selfs wanneer die webwerf nie oop is nie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-amber-800 text-sm sm:text-base">Nie ondersteun nie</p>
                <p className="text-xs sm:text-sm text-amber-600 break-words">
                  Jou blaaier ondersteun nie stootkennisgewings nie. Probeer Chrome, Firefox, of Edge.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {pushSubscription ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {pushSubscription ? 'Kennisgewings aktief' : 'Kennisgewings nie aktief nie'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 break-words">
                      {pushPermission === 'denied' 
                        ? 'Toestemming geweier in blaaier-instellings'
                        : pushSubscription 
                          ? 'Jy ontvang stootkennisgewings'
                          : 'Aktiveer om kennisgewings te ontvang'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                  {pushSubscription ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={testNotification}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Toets
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={unsubscribeFromPush}
                        disabled={subscribing}
                        className="px-2 sm:px-3"
                      >
                        {subscribing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={subscribeToPush}
                      disabled={subscribing || pushPermission === 'denied'}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      {subscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1 sm:mr-2" />
                      ) : (
                        <Bell className="h-4 w-4 mr-1 sm:mr-2" />
                      )}
                      Aktiveer
                    </Button>
                  )}
                </div>
              </div>

              {pushPermission === 'denied' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-red-800 text-sm sm:text-base">Toestemming geweier</p>
                    <p className="text-xs sm:text-sm text-red-600 break-words">
                      Gaan na jou blaaier-instellings om kennisgewings vir hierdie webwerf te aktiveer.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>


      {/* Notification Categories */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Kennisgewingkategorieë</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Kies watter tipe kennisgewings jy wil ontvang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Crisis Alerts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="crisis_alerts" className="font-medium text-sm sm:text-base">Krisiswaarskuwings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Dringende krisisse en noodgevalle</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
              <Badge variant="destructive" className="text-xs hidden sm:inline-flex">Dringend</Badge>
              <Switch
                id="crisis_alerts"
                checked={preferences.crisis_alerts}
                onCheckedChange={() => handleToggle('crisis_alerts')}
              />
            </div>
          </div>

          <Separator />

          {/* Event Reminders */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="event_reminders" className="font-medium text-sm sm:text-base">Gebeurtenisherinnerings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Eredienste, vergaderings en gemeentebyeenkomste</p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <Switch
                id="event_reminders"
                checked={preferences.event_reminders}
                onCheckedChange={() => handleToggle('event_reminders')}
              />
            </div>
          </div>

          <Separator />

          {/* Announcements */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="announcements" className="font-medium text-sm sm:text-base">Aankondigings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Algemene gemeente-aankondigings en nuus</p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <Switch
                id="announcements"
                checked={preferences.announcements}
                onCheckedChange={() => handleToggle('announcements')}
              />
            </div>
          </div>

          <Separator />

          {/* Pastoral Updates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="pastoral_updates" className="font-medium text-sm sm:text-base">Pastorale opdaterings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Besoeke, gebedversoeke en pastorale sorg</p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <Switch
                id="pastoral_updates"
                checked={preferences.pastoral_updates}
                onCheckedChange={() => handleToggle('pastoral_updates')}
              />
            </div>
          </div>

          <Separator />

          {/* Dagstukkies */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="dagstukkies" className="font-medium text-sm sm:text-base">Dagstukkies</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Daaglikse Bybelstudie en oordenking</p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <Switch
                id="dagstukkies"
                checked={preferences.dagstukkies}
                onCheckedChange={() => handleToggle('dagstukkies')}
              />
            </div>
          </div>

          <Separator />

          {/* Payment Reminders */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="payment_reminders" className="font-medium text-sm sm:text-base">Betalingsherinnerings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Dankoffers en finansiële bydraes</p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <Switch
                id="payment_reminders"
                checked={preferences.payment_reminders}
                onCheckedChange={() => handleToggle('payment_reminders')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notification Channels */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Addisionele kanale</CardTitle>
          <CardDescription className="text-sm">
            Ontvang kennisgewings via ander kommunikasiekanale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Email Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="email_notifications" className="font-medium text-sm sm:text-base">E-pos kennisgewings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Ontvang opsommings en belangrike kennisgewings per e-pos</p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <Switch
                id="email_notifications"
                checked={preferences.email_notifications}
                onCheckedChange={() => handleToggle('email_notifications')}
              />
            </div>
          </div>

          <Separator />

          {/* SMS Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="sms_notifications" className="font-medium text-sm sm:text-base">SMS kennisgewings</Label>
                <p className="text-xs sm:text-sm text-gray-500 break-words">Ontvang dringende kennisgewings per SMS</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Slegs dringend</Badge>
              <Switch
                id="sms_notifications"
                checked={preferences.sms_notifications}
                onCheckedChange={() => handleToggle('sms_notifications')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={savePreferences}
          disabled={saving}
          className="bg-nhka-blue hover:bg-nhka-blue/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Stoor...
            </>
          ) : (
            'Stoor voorkeure'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
