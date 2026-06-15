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
    const appUrl = 'https://reward-hazel.vercel.app';

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

  <h2 style="font-size: 16px; color: #1A0A2E;">How to get started:</h2>
  <ol style="color: #5C4F7A; line-height: 2;">
    <li>Open <a href="${appUrl}" style="color: #6C3CE1;">${appUrl}</a></li>
    <li>Tap <strong>"Join with invite code"</strong></li>
    <li>Enter your code: <strong>${code}</strong></li>
    <li>Sign up using this email address</li>
  </ol>

  <p style="color: #8B7BA8; font-size: 13px; margin-top: 32px;">This invite expires in 7 days and can only be used once.</p>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KidReward <noreply@kidreward.app>',
        to: [email],
        subject: `You're invited to join ${family} on KidReward! 🏆`,
        html,
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
