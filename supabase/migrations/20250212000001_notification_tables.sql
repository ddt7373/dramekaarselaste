-- Create notifications table if not exists (for admin notification history)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemeente_id uuid REFERENCES public.gemeentes(id),
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'announcement',
  priority text DEFAULT 'normal',
  target_audience text DEFAULT 'all',
  target_wyk_id uuid,
  sent_by uuid REFERENCES public.gebruikers(id),
  total_sent integer DEFAULT 0,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create notification_preferences if not exists
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.gebruikers(id),
  crisis_alerts boolean DEFAULT true,
  event_reminders boolean DEFAULT true,
  announcements boolean DEFAULT true,
  pastoral_updates boolean DEFAULT true,
  dagstukkies boolean DEFAULT true,
  payment_reminders boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  sms_notifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create push_subscriptions if not exists
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.gebruikers(id),
  endpoint text NOT NULL,
  p256dh text,
  auth text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own notification_preferences" ON public.notification_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
