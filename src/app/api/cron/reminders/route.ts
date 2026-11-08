import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as webpush from 'web-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_REMINDERS = 50;

interface DueReminder {
  id: string;
  user_id: string;
  title: string;
  reminder_time: string;
}

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return errorResponse('Reminder cron is not configured.', 503);
  }

  const authorization = request.headers.get('authorization') ?? '';
  if (authorization !== `Bearer ${cronSecret}`) {
    return errorResponse('Unauthorized.', 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey || !subject) {
    return errorResponse('Reminder push environment is incomplete.', 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: claimed, error: claimError } = await supabase.rpc('claim_due_reminders', {
    p_limit: MAX_REMINDERS,
  });

  if (claimError) {
    console.error('Could not claim due reminders', claimError.message);
    return errorResponse('Could not claim due reminders.', 500);
  }

  const reminders = (claimed ?? []) as DueReminder[];
  if (!reminders.length) {
    return NextResponse.json({ ok: true, claimed: 0, sent: 0, failed: 0, removed: 0 });
  }

  const userIds = Array.from(new Set(reminders.map((reminder) => reminder.user_id)));
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)
    .eq('reminders_enabled', true);

  if (subscriptionError) {
    console.error('Could not load push subscriptions', subscriptionError.message);
    return errorResponse('Could not load push subscriptions.', 500);
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();
  for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const list = subscriptionsByUser.get(subscription.user_id) ?? [];
    list.push(subscription);
    subscriptionsByUser.set(subscription.user_id, list);
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  let sent = 0;
  let failed = 0;
  const staleSubscriptionIds = new Set<string>();

  for (const reminder of reminders) {
    const userSubscriptions = subscriptionsByUser.get(reminder.user_id) ?? [];
    if (!userSubscriptions.length) continue;

    const payload = JSON.stringify({
      title: `Reminder: ${reminder.title}`,
      body: 'It is time to work on this task.',
      url: '/app/tasks',
      tag: `task-${reminder.id}`,
    });

    await Promise.all(
      userSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
            { TTL: 60 * 60, urgency: 'high' }
          );
          sent += 1;
        } catch (error) {
          failed += 1;
          const statusCode =
            error && typeof error === 'object' && 'statusCode' in error
              ? Number((error as { statusCode?: number }).statusCode ?? 0)
              : 0;

          if (statusCode === 404 || statusCode === 410) {
            staleSubscriptionIds.add(subscription.id);
          }

          console.error(
            'Push delivery failed',
            reminder.id,
            subscription.id,
            statusCode,
            error instanceof Error ? error.message : String(error)
          );
        }
      })
    );
  }

  let removed = 0;
  if (staleSubscriptionIds.size) {
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', Array.from(staleSubscriptionIds));

    if (deleteError) {
      console.error('Could not remove stale push subscriptions', deleteError.message);
    } else {
      removed = staleSubscriptionIds.size;
    }
  }

  return NextResponse.json({
    ok: true,
    claimed: reminders.length,
    sent,
    failed,
    removed,
  });
}
