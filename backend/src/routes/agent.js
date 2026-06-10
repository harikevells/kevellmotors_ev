const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Franchise = require('../models/Franchise');
const Service = require('../models/Service');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

/* ════════════════════════════════════════════════
   RULE-BASED FALLBACK ENGINE (works without OpenAI)
   ════════════════════════════════════════════════ */

const SERVICE_KEYWORDS = {
  general: ['general', 'regular', 'routine', 'basic', 'maintenance', 'full service', 'periodic'],
  battery: ['battery', 'charge', 'charging', 'range', 'capacity', 'cell', 'kwh'],
  motor: ['motor', 'engine', 'drive', 'acceleration', 'torque', 'wheel hub'],
  software: ['software', 'update', 'firmware', 'ota', 'system update', 'app'],
  accident: ['accident', 'crash', 'dent', 'damage', 'collision', 'scratch', 'repair'],
  amc: ['amc', 'annual maintenance', 'contract', 'annual contract'],
  custom: ['custom', 'other', 'special', 'different'],
};

const CITIES = [
  'chennai', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'kolkata',
  'ahmedabad', 'coimbatore', 'madurai', 'trichy', 'salem', 'vellore', 'surat', 'jaipur',
  'lucknow', 'kanpur', 'nagpur', 'indore', 'bhopal', 'visakhapatnam', 'patna', 'vadodara',
];

const SERVICE_LABELS = {
  general: 'General Service', battery: 'Battery Checkup', motor: 'Motor Inspection',
  software: 'Software Update', accident: 'Accident Repair', amc: 'AMC (Annual Maintenance)', custom: 'Custom Service',
};

function detectServiceType(text) {
  const lower = text.toLowerCase();

  // Try numerical selection first (1-7)
  const num = detectNumber(text);
  if (num !== null && num >= 1 && num <= 7) {
    const types = ['general', 'battery', 'motor', 'software', 'accident', 'amc', 'custom'];
    return types[num - 1];
  }

  for (const [type, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return null;
}

function detectCity(text) {
  const lower = text.toLowerCase();
  return CITIES.find((c) => lower.includes(c)) || null;
}

function detectConfirmation(text) {
  return /\b(yes|yeah|yep|sure|ok|okay|confirm|book it|go ahead|proceed|absolutely|do it|please book)\b/i.test(text);
}

function detectNumber(text) {
  const m = text.match(/\b(\d+)\b/);
  return m ? parseInt(m[1]) : null;
}

function parseDate(text) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const lower = text.toLowerCase();

  // Support "today"
  if (lower.includes('today')) {
    const d = new Date(now);
    // If it's past 19:00, maybe suggest tomorrow?
    // For now, just set it to 1 hour from now or 10:00 AM, whichever is later/relevant.
    const hour = Math.max(now.getHours() + 1, 10);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  if (lower.includes('tomorrow')) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const day of days) {
    if (lower.includes(day)) {
      const target = days.indexOf(day);
      const currentDay = now.getDay();
      let diff = (target - currentDay + 7) % 7;

      // If it's today but already very late (e.g., past 6 PM), move it to next week if they specifically said the day name
      if (diff === 0 && now.getHours() >= 18) diff = 7;

      const d = new Date(today);
      d.setDate(d.getDate() + diff);

      // Default to 10:00 AM or current time + 1 hour if it's for today
      if (diff === 0) {
        const hour = Math.max(now.getHours() + 1, 10);
        d.setHours(hour, 0, 0, 0);
      } else {
        d.setHours(10, 0, 0, 0);
      }
      return d;
    }
  }

  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) {
      const dayMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?/);
      if (dayMatch) {
        const d = new Date(today.getFullYear(), i, parseInt(dayMatch[1]), 10, 0, 0);
        if (d < now) d.setFullYear(d.getFullYear() + 1);
        return d;
      }
    }
  }

  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(isoMatch[0] + 'T10:00:00');
    if (d >= today) return d;
  }

  const slashMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
  if (slashMatch) {
    const yr = slashMatch[3] ? parseInt(slashMatch[3]) : today.getFullYear();
    const d = new Date(yr, parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]), 10, 0, 0);
    if (d < today) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  return null;
}

async function ruleBasedAgent(messages, userId) {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const assistantMsgs = messages.filter((m) => m.role === 'assistant');
  const lastUser = userMsgs.slice(-1)[0]?.content || '';

  // ── Derive state from USER messages only ──
  // (Scanning assistant messages causes false positives: city names in franchise
  //  address lines change the franchise filter mid-conversation; example dates in
  //  "When would you like…" messages falsely set scheduledDate too early.)
  let serviceType = null;
  let vehicleId = null;
  let franchiseId = null;
  let scheduledDate = null;

  for (const msg of userMsgs) {
    if (!serviceType) serviceType = detectServiceType(msg.content);
    if (!scheduledDate) scheduledDate = parseDate(msg.content);
  }

  // City: only from what the user typed — not from assistant franchise-list messages
  const city = detectCity(userMsgs.map((m) => m.content).join('\n'));

  // ── Load DB data ──
  const vehicles = await Vehicle.find({ owner: userId, isActive: true }).lean();
  const frFilter = { status: 'active' };
  if (city) frFilter['address.city'] = new RegExp(city, 'i');
  const franchises = await Franchise.find(frFilter).lean();

  // ── Find conversation context boundaries ──
  // Index of the last assistant message that listed vehicles
  const vehicleListMsgIdx = messages.reduce(
    (acc, m, i) => (m.role === 'assistant' && m.content.includes('Which vehicle')) ? i : acc, -1);
  // Index of the last assistant message that listed franchises
  const franchiseListMsgIdx = messages.reduce(
    (acc, m, i) => (m.role === 'assistant' && m.content.includes('available service centers')) ? i : acc, -1);

  // ── Detect vehicle selection ──
  // Only scan user messages that came AFTER the vehicle list and BEFORE the franchise list,
  // so a "2" typed to pick a franchise is never mistaken for vehicle selection.
  const vehicleSearchMsgs =
    vehicleListMsgIdx >= 0
      ? messages
        .slice(vehicleListMsgIdx + 1, franchiseListMsgIdx >= 0 ? franchiseListMsgIdx : undefined)
        .filter((m) => m.role === 'user')
      : userMsgs;

  for (const msg of vehicleSearchMsgs) {
    const num = detectNumber(msg.content);
    if (num && vehicles[num - 1]) { vehicleId = vehicles[num - 1]._id.toString(); break; }
    for (const v of vehicles) {
      if (msg.content.toLowerCase().includes(v.registrationNumber.toLowerCase()) ||
        msg.content.toLowerCase().includes(v.model.toLowerCase())) {
        vehicleId = v._id.toString(); break;
      }
    }
    if (vehicleId) break;
  }
  if (!vehicleId && vehicles.length === 1) vehicleId = vehicles[0]._id.toString();

  // ── Detect franchise selection ──
  // Only scan user messages that came AFTER the franchise list was presented,
  // so the vehicle-selection number never bleeds into franchise detection.
  const franchiseSearchMsgs =
    franchiseListMsgIdx >= 0
      ? messages.slice(franchiseListMsgIdx + 1).filter((m) => m.role === 'user')
      : [];

  for (const msg of franchiseSearchMsgs) {
    const num = detectNumber(msg.content);
    if (num && franchises[num - 1]) { franchiseId = franchises[num - 1]._id.toString(); break; }
    for (const f of franchises) {
      if (msg.content.toLowerCase().includes(f.name.toLowerCase())) {
        franchiseId = f._id.toString(); break;
      }
    }
    if (franchiseId) break;
  }

  // ── Check if we were awaiting confirmation ──
  const lastAssistant = assistantMsgs.slice(-1)[0]?.content || '';
  const awaitingConfirmation = /confirm|shall i book|type "yes"|reply "yes"/i.test(lastAssistant);

  // ── Book if confirmed ──
  if (awaitingConfirmation && detectConfirmation(lastUser) && vehicleId && franchiseId && serviceType && scheduledDate) {
    const svc = await Service.create({
      vehicle: vehicleId, owner: userId, franchise: franchiseId,
      serviceType, scheduledDate, status: 'onboarded',
    });
    await Reminder.create({
      user: userId, vehicle: vehicleId, type: 'service_due',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      message: 'Your next service is due',
    });
    const populated = await Service.findById(svc._id)
      .populate('vehicle', 'registrationNumber make model')
      .populate('franchise', 'name address phone').lean();
    const dateStr = new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return {
      reply: `✅ **Booking Confirmed!**\n\nYour appointment has been successfully booked.\n\n**Booking ID:** ${svc._id.toString().slice(-8).toUpperCase()}\n🚗 **Vehicle:** ${populated.vehicle?.make} ${populated.vehicle?.model} (${populated.vehicle?.registrationNumber})\n🔧 **Service:** ${SERVICE_LABELS[serviceType] || serviceType}\n🏪 **Center:** ${populated.franchise?.name}, ${populated.franchise?.address?.city}\n📍 **Address:** ${populated.franchise?.address?.street}\n📅 **Date:** ${dateStr}\n📞 **Center Phone:** ${populated.franchise?.phone || 'N/A'}\n\nYou'll receive updates as your service progresses. Is there anything else I can help you with?`,
      suggestions: []
    };
  }

  // ── Step-by-step guidance ──

  if (!serviceType) {
    return {
      reply: `Hi! I'm **KEMO**, your EV booking assistant ⚡\n\nWhat type of service does your vehicle need?\n\n1. General Service\n2. Battery Checkup\n3. Motor Inspection\n4. Software Update\n5. Accident Repair\n6. AMC (Annual Maintenance Contract)\n7. Custom / Other\n\nJust type the number or describe what's needed!`,
      suggestions: ['General Service', 'Battery Checkup', 'Motor Inspection', 'Software Update', 'Accident Repair', 'AMC', 'Custom']
    };
  }

  if (vehicles.length === 0) {
    return {
      reply: `I'd love to help book a **${SERVICE_LABELS[serviceType]}**! However, I don't see any vehicles registered to your account. Please add your vehicle first from **My Vehicles**, then come back here.`,
      suggestions: []
    };
  }

  if (!vehicleId) {
    const list = vehicles.map((v, i) => `${i + 1}. ${v.make} ${v.model} — **${v.registrationNumber}** (${v.vehicleType})`).join('\n');
    return {
      reply: `Which vehicle would you like to book the **${SERVICE_LABELS[serviceType]}** for?\n\n${list}\n\nReply with the number.`,
      suggestions: vehicles.map(v => `${v.make} ${v.model}`)
    };
  }

  if (franchises.length === 0) {
    return {
      reply: `No active service centers found${city ? ` near **${city}**` : ''}. Try mentioning a different city, or contact our support team for assistance.`,
      suggestions: ['Search in Chennai', 'Search in Bangalore']
    };
  }

  if (!franchiseId) {
    const list = franchises.map((f, i) =>
      `${i + 1}. **${f.name}**\n   📍 ${f.address?.street}, ${f.address?.city}, ${f.address?.state}`
    ).join('\n\n');
    return {
      reply: `Here are the available service centers${city ? ` near **${city}**` : ''}:\n\n${list}\n\nWhich one would you prefer? (Reply with the number)`,
      suggestions: franchises.slice(0, 3).map(f => f.name)
    };
  }

  if (!scheduledDate) {
    const fr = franchises.find((f) => f._id.toString() === franchiseId);
    const daysStr = (fr?.availableDays || []).map((d) => d.slice(0, 3)).join(', ') || 'Mon – Fri';

    // Generate dynamic examples based on today
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const nextMon = new Date(now); nextMon.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    const dayAfter = new Date(now); dayAfter.setDate(now.getDate() + 2);

    const ex1 = now.getHours() < 17 ? 'Tomorrow' : `This ${tomorrow.toLocaleDateString('en-IN', { weekday: 'long' })}`;
    const ex2 = nextMon.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    const ex3 = `${dayAfter.getDate()}/${dayAfter.getMonth() + 1}`;

    return {
      reply: `When would you like to schedule the service?\n\nYou can say something like:\n• "${ex1}"\n• "${ex2}"\n• "${ex3}"\n• "Today"\n\n*Working days: ${daysStr}*`,
      suggestions: ['Today', 'Tomorrow', 'Day after tomorrow', nextMon.toLocaleDateString('en-IN', { weekday: 'long' })]
    };
  }

  // ── All collected — ask for confirmation ──
  const vehicle = vehicles.find((v) => v._id.toString() === vehicleId);
  const franchise = franchises.find((f) => f._id.toString() === franchiseId);
  const dateStr = new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return {
    reply: `Here's your booking summary:\n\n🚗 **Vehicle:** ${vehicle?.make} ${vehicle?.model} (${vehicle?.registrationNumber})\n🔧 **Service:** ${SERVICE_LABELS[serviceType] || serviceType}\n🏪 **Center:** ${franchise?.name}, ${franchise?.address?.city}\n📍 **Address:** ${franchise?.address?.street}\n📅 **Date:** ${dateStr}\n\nShall I confirm this booking? Type **"yes"** to book!`,
    suggestions: ['Yes', 'No']
  };
}

/* ════════════════════════════════════════════════
   OPENAI PATH (used when key is valid + has quota)
   ════════════════════════════════════════════════ */

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_my_vehicles',
      description: 'Fetch all active vehicles registered to the current user.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_active_franchises',
      description: 'Fetch active EV service centers. Optionally filter by city.',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string', description: 'City name to filter by (optional).' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_service_appointment',
      description: 'Book an EV service appointment. Only call after explicit user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          vehicleId: { type: 'string' },
          franchiseId: { type: 'string' },
          serviceType: { type: 'string', enum: ['general', 'battery', 'motor', 'software', 'accident', 'amc', 'custom'] },
          scheduledDate: { type: 'string', description: 'ISO 8601 date-time string.' },
          description: { type: 'string' },
        },
        required: ['vehicleId', 'franchiseId', 'serviceType', 'scheduledDate'],
      },
    },
  },
];

async function executeOpenAITool(name, args, userId) {
  if (name === 'get_my_vehicles') {
    const vehicles = await Vehicle.find({ owner: userId, isActive: true }).lean();
    if (!vehicles.length) return JSON.stringify({ message: 'No vehicles registered.' });
    return JSON.stringify(vehicles.map((v) => ({ id: v._id, registration: v.registrationNumber, make: v.make, model: v.model, year: v.year, type: v.vehicleType })));
  }
  if (name === 'get_active_franchises') {
    const filter = { status: 'active' };
    if (args.city) filter['address.city'] = new RegExp(args.city, 'i');
    const franchises = await Franchise.find(filter).lean();
    if (!franchises.length) return JSON.stringify({ message: `No active service centers found${args.city ? ' in ' + args.city : ''}.` });
    return JSON.stringify(franchises.map((f) => ({ id: f._id, name: f.name, street: f.address?.street, city: f.address?.city, state: f.address?.state, phone: f.phone, schedules: f.schedules })));
  }
  if (name === 'book_service_appointment') {
    const svc = await Service.create({ vehicle: args.vehicleId, owner: userId, franchise: args.franchiseId, serviceType: args.serviceType, scheduledDate: new Date(args.scheduledDate), description: args.description || '', status: 'onboarded' });
    await Reminder.create({ user: userId, vehicle: args.vehicleId, type: 'service_due', dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), message: 'Your next service is due' });
    const pop = await Service.findById(svc._id).populate('vehicle', 'registrationNumber make model').populate('franchise', 'name address phone').lean();
    return JSON.stringify({ success: true, bookingId: svc._id, vehicle: `${pop.vehicle?.make} ${pop.vehicle?.model} (${pop.vehicle?.registrationNumber})`, franchise: pop.franchise?.name, franchiseCity: pop.franchise?.address?.city, franchisePhone: pop.franchise?.phone, serviceType: svc.serviceType, scheduledDate: svc.scheduledDate, status: 'onboarded' });
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

async function openAIAgent(messages, user) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today = new Date().toISOString().split('T')[0];
  const system = `You are EVA, an intelligent EV service booking agent for Kevell Motors. Today is ${today}. Customer name: "${user.name}". Help book EV service appointments: understand service need → get vehicles → get franchises → confirm with user → book. Never book without explicit confirmation. Resolve relative dates against today.`;
  const run = [{ role: 'system', content: system }, ...messages];
  let resp = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: run, tools, tool_choice: 'auto', temperature: 0.4 });
  while (resp.choices[0].finish_reason === 'tool_calls') {
    const asst = resp.choices[0].message;
    const results = [];
    for (const call of asst.tool_calls) {
      let args = {}; try { args = JSON.parse(call.function.arguments); } catch (_) { }
      results.push({ tool_call_id: call.id, role: 'tool', content: await executeOpenAITool(call.function.name, args, user._id) });
    }
    run.push(asst, ...results);
    resp = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: run, tools, tool_choice: 'auto', temperature: 0.4 });
  }
  return resp.choices[0].message.content;
}

/* ── POST /api/agent/chat ── */
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: '`messages` array is required.' });
    }

    let reply;

    // Try OpenAI if key is present
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your_')) {
      try {
        reply = await openAIAgent(messages, req.user);
      } catch (aiErr) {
        // 429 quota / 401 invalid key / 503 overloaded → fall through to rule-based
        const status = aiErr?.status || aiErr?.response?.status;
        if (status === 429 || status === 401 || status === 503 || status === 500) {
          reply = null; // trigger fallback
        } else {
          throw aiErr; // unexpected error — bubble up
        }
      }
    }

    let suggestions = [];
    // Rule-based fallback
    if (!reply) {
      const resObj = await ruleBasedAgent(messages, req.user._id);
      if (resObj && typeof resObj === 'object') {
        reply = resObj.reply;
        suggestions = resObj.suggestions;
      } else {
        reply = resObj;
      }
    }

    res.json({ success: true, reply, suggestions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
