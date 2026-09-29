const express = require('express');
const { Resend } = require('resend');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TO = process.env.TO_EMAIL || 'kapmarkets@gmail.com';
const FROM = process.env.FROM_EMAIL || 'KapMarkets <onboarding@resend.dev>';
const KEY = process.env.RESEND_API_KEY;
const resend = new Resend(KEY);

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function sendMail(subject, html, replyTo) {
  try {
    const r = await resend.emails.send({ from: FROM, to: TO, replyTo: replyTo || undefined, subject, html });
    if (r.error) console.error('EMAIL ERROR:', r.error.message || JSON.stringify(r.error));
    else console.log('email sent:', r.data && r.data.id);
  } catch (e) {
    console.error('EMAIL EXCEPTION:', e.message);
  }
}

// Diagnostics: open  https://YOUR-URL/api/health  — this actually sends a test email to your inbox
app.get('/api/health', async (req, res) => {
  const config = {
    RESEND_API_KEY: KEY ? 'set (' + KEY.length + ' chars)' : 'MISSING',
    FROM_EMAIL: FROM,
    TO_EMAIL: TO
  };
  if (!KEY) return res.status(500).json({ ok: false, error: 'RESEND_API_KEY is missing', config });
  try {
    const r = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: 'KapMarkets health check',
      html: '<p>If you received this, your lead emails are working.</p>'
    });
    if (r.error) return res.status(500).json({ ok: false, error: r.error.message || JSON.stringify(r.error), config });
    res.json({ ok: true, message: 'Test email sent — check your inbox (and spam).', id: r.data && r.data.id, config });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, config });
  }
});

app.post('/api/lead', (req, res) => {
  const { name, business, email, phone } = req.body || {};
  if (!name || !business || !email || !phone) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }
  console.log('LEAD:', JSON.stringify({ name, business, email, phone, at: new Date().toISOString() }));
  res.json({ ok: true });
  const html = `
    <h2 style="font-family:sans-serif">New KapMarkets lead</h2>
    <p style="font-family:sans-serif"><b>Name:</b> ${esc(name)}</p>
    <p style="font-family:sans-serif"><b>Business:</b> ${esc(business)}</p>
    <p style="font-family:sans-serif"><b>Email:</b> ${esc(email)}</p>
    <p style="font-family:sans-serif"><b>Phone:</b> ${esc(phone)}</p>
    <p style="font-family:sans-serif;color:#888">Submitted ${new Date().toLocaleString()}</p>`;
  sendMail(`New KapMarkets lead: ${business}`, html, email);
});

app.post('/api/details', (req, res) => {
  const { name, business, email, phone, details } = req.body || {};
  console.log('DETAILS:', JSON.stringify({ business, details, at: new Date().toISOString() }));
  res.json({ ok: true });
  const html = `
    <h2 style="font-family:sans-serif">Business details${business ? ' — ' + esc(business) : ''}</h2>
    <p style="font-family:sans-serif"><b>Name:</b> ${esc(name)}</p>
    <p style="font-family:sans-serif"><b>Business:</b> ${esc(business)}</p>
    <p style="font-family:sans-serif"><b>Email:</b> ${esc(email)}</p>
    <p style="font-family:sans-serif"><b>Phone:</b> ${esc(phone)}</p>
    <p style="font-family:sans-serif"><b>What they told us:</b></p>
    <p style="font-family:sans-serif;white-space:pre-wrap">${esc(details) || '(left blank)'}</p>`;
  sendMail(`Business details: ${business || name || 'lead'}`, html, email);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('KapMarkets running on port ' + PORT);
  console.log('RESEND_API_KEY:', KEY ? 'set' : 'MISSING');
  console.log('FROM_EMAIL:', FROM);
  console.log('TO_EMAIL:', TO);
});
