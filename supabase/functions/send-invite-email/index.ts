import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code, familyName } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'email and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const family = familyName ?? 'your family';
    const appUrl = Deno.env.get('APP_URL') ?? 'https://reward-hazel.vercel.app';
    const joinUrl = `${appUrl}/signup-child?code=${encodeURIComponent(code)}`;
    // Use the verified sender domain set as a Supabase secret, or fall back to
    // Resend's onboarding sender (which can only deliver to the Resend account
    // owner's own email — fine for local dev, must set RESEND_FROM in prod).
    const fromAddress = Deno.env.get('RESEND_FROM') ?? 'KidReward <onboarding@resend.dev>';

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FFF7ED; color: #1A0A2E;">
  <h1 style="color: #6C3CE1; font-size: 28px; margin-bottom: 4px;">KidReward 🏆</h1>
  <p style="color: #8B7BA8; margin-top: 0;">You've been invited!</p>

  <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid #6C3CE1;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #8B7BA8; font-weight: 600; letter-spacing: 1px;">YOUR INVITE CODE</p>
    <p style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #6C3CE1; margin: 0 0 16px 0;">${code}</p>
    <p style="margin: 0; color: #5C4F7A;">You've been invited to join <strong>${family}</strong> on KidReward — where kids earn gems for completing challenges and redeem them for real rewards!</p>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="${joinUrl}" style="display: inline-block; background: #6C3CE1; color: #FFFFFF; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">Join ${family} 🎉</a>
  </div>

  <p style="color: #8B7BA8; font-size: 13px;">Tapping the button signs you straight in with your code already filled in — no typing needed.</p>

  <h2 style="font-size: 14px; color: #1A0A2E;">Button not working?</h2>
  <ol style="color: #5C4F7A; line-height: 2; font-size: 14px;">
    <li>Open <a href="${appUrl}" style="color: #6C3CE1;">${appUrl}</a></li>
    <li>Tap <strong>"Join with invite code"</strong></li>
    <li>Enter your code: <strong>${code}</strong></li>
    <li>Sign up using this email address</li>
  </ol>

  <p style="color: #8B7BA8; font-size: 13px; margin-top: 32px;">This invite expires in 7 days and can only be used once.</p>
</body>
</html>`;

    const text = `KidReward — You've been invited!

Your invite code: ${code}

You've been invited to join ${family} on KidReward, where kids earn gems for completing challenges and redeem them for real rewards.

Tap this link to join — your code is already filled in, no typing needed:
${joinUrl}

Button not working? Do it manually:
1. Open ${appUrl}
2. Tap "Join with invite code"
3. Enter your code: ${code}
4. Sign up using this email address

This invite expires in 7 days and can only be used once.`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Your KidReward invite code: ${code}`,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend error:', data);
      return new Response(
        JSON.stringify({ error: data.message ?? 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
