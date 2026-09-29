const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TO = process.env.TO_EMAIL || 'kapmarkets@gmail.com';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function transport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendMail(subject, html, replyTo) {
  await transport().sendMail({
    from: `"KapMarkets" <${process.env.GMAIL_USER}>`,
    to: TO,
    replyTo: replyTo || undefined,
    subject,
    html
  });
}

app.post('/api/lead', async (req, res) => {
  const { name, business, email, phone } = req.body || {};
  if (!name || !business || !email || !phone) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }
  const html = `
    <h2 style="font-family:sans-serif">New KapMarkets lead</h2>
    <p style="font-family:sans-serif"><b>Name:</b> ${esc(name)}</p>
    <p style="font-family:sans-serif"><b>Business:</b> ${esc(business)}</p>
    <p style="font-family:sans-serif"><b>Email:</b> ${esc(email)}</p>
    <p style="font-family:sans-serif"><b>Phone:</b> ${esc(phone)}</p>
    <p style="font-family:sans-serif;color:#888">Submitted ${new Date().toLocaleString()}</p>`;
  try {
    await sendMail(`New KapMarkets lead: ${business}`, html, email);
    res.json({ ok: true });
  } catch (e) {
    console.error('lead mail failed:', e.message);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/details', async (req, res) => {
  const { name, business, email, phone, details } = req.body || {};
  const html = `
    <h2 style="font-family:sans-serif">Business details${business ? ' — ' + esc(business) : ''}</h2>
    <p style="font-family:sans-serif"><b>Name:</b> ${esc(name)}</p>
    <p style="font-family:sans-serif"><b>Business:</b> ${esc(business)}</p>
    <p style="font-family:sans-serif"><b>Email:</b> ${esc(email)}</p>
    <p style="font-family:sans-serif"><b>Phone:</b> ${esc(phone)}</p>
    <p style="font-family:sans-serif"><b>What they told us:</b></p>
    <p style="font-family:sans-serif;white-space:pre-wrap">${esc(details) || '(left blank)'}</p>`;
  try {
    await sendMail(`Business details: ${business || name || 'lead'}`, html, email);
    res.json({ ok: true });
  } catch (e) {
    console.error('details mail failed:', e.message);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('KapMarkets running on port ' + PORT));
