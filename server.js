const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TO = process.env.TO_EMAIL || 'kapmarkets@gmail.com';
const USER = process.env.GMAIL_USER;
const PASS = process.env.GMAIL_APP_PASSWORD;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function transport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: USER, pass: PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

async function sendMail(subject, html, replyTo) {
  return transport().sendMail({
    from: `"KapMarkets" <${USER}>`,
    to: TO,
    replyTo: replyTo || undefined,
    subject,
    html
  });
}

// ── Diagnostics: open  https://YOUR-URL/api/health  in a browser ──
app.get('/api/health', async (req, res) => {
  const config = {
    GMAIL_USER: USER ? 'set (' + USER + ')' : 'MISSING',
    GMAIL_APP_PASSWORD: PASS ? 'set (' + PASS.length + ' chars)' : 'MISSING',
    TO_EMAIL: TO
  };
  try {
    await transport().verify();
    res.json({ ok: true, message: 'Gmail connection works — you are ready to receive leads.', config });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, config });
  }
});

app.post('/api/lead', (req, res) => {
  const { name, business, email, phone } = req.body || {};
  if (!name || !business || !email || !phone) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }
  // Log first — this is a backup in Railway logs even if email fails
  console.log('LEAD:', JSON.stringify({ name, business, email, phone, at: new Date().toISOString() }));
  // Respond immediately so the page never hangs
  res.json({ ok: true });
  // Send the email in the background
  const html = `
    <h2 style="font-family:sans-serif">New KapMarkets lead</h2>
    <p style="font-family:sans-serif"><b>Name:</b> ${esc(name)}</p>
    <p style="font-family:sans-serif"><b>Business:</b> ${esc(business)}</p>
    <p style="font-family:sans-serif"><b>Email:</b> ${esc(email)}</p>
    <p style="font-family:sans-serif"><b>Phone:</b> ${esc(phone)}</p>
    <p style="font-family:sans-serif;color:#888">Submitted ${new Date().toLocaleString()}</p>`;
  sendMail(`New KapMarkets lead: ${business}`, html, email)
    .then(() => console.log('lead email sent for', business))
    .catch(e => console.error('LEAD EMAIL FAILED:', e.message));
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
  sendMail(`Business details: ${business || name || 'lead'}`, html, email)
    .then(() => console.log('details email sent for', business))
    .catch(e => console.error('DETAILS EMAIL FAILED:', e.message));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('KapMarkets running on port ' + PORT);
  console.log('GMAIL_USER:', USER ? 'set' : 'MISSING');
  console.log('GMAIL_APP_PASSWORD:', PASS ? PASS.length + ' chars' : 'MISSING');
  console.log('TO_EMAIL:', TO);
});
