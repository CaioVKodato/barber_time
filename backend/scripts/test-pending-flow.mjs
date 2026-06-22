const BASE = 'http://localhost:3000/api/v1';
const BARBER_ID = '11111111-1111-1111-1111-111111111111';

function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

async function jpost(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const clientEmail = `cli.${Date.now()}@gmail.com`;
const reg = await jpost('/auth/register', { email: clientEmail, password: 'senha123', fullName: 'Cliente Teste' });
const token = reg.data.token;
console.log('Cliente:', clientEmail, '| register status', reg.status);

const date = nextSaturday();
const slotsRes = await fetch(`${BASE}/availability/available-slots?barberId=${BARBER_ID}&date=${date}`);
const slots = await slotsRes.json();
const start = slots.availableSlots?.[0]?.startsAt;
console.log('Data:', date, '| primeiro slot:', start);

if (!start) {
  console.error('Sem slots disponíveis nessa data.');
  process.exit(1);
}

const appt = await jpost('/appointments', { barberId: BARBER_ID, startsAt: start }, token);
console.log('Agendamento criado:', appt.status, '| id', appt.data.id, '| status', appt.data.status);
console.log('>>> Veja o terminal do worker: deve enviar e-mail ao barbeiro (caio.kodato@sga.pucminas.br)');
