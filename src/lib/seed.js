import { v4 as uuid } from 'uuid'
import { format, addDays } from 'date-fns'

const today = new Date()
const fmt = (d) => format(d, 'yyyy-MM-dd')
const now = () => new Date().toISOString()

export function getSeedData() {
  const projectIds = {
    quietFracture:   uuid(),
    harvestMarket:   uuid(),
    onlineCollector: uuid(),
    realmEngine:     uuid(),
    tether:          uuid(),
    redPen:          uuid(),
    hollowAtlas:     uuid(),
    kirksDaily:      uuid(),
    theTithe:        uuid(),
    fiveTriesLive:   uuid(),
    worldWears:      uuid(),
    bloodMarkers:    uuid(),
  }

  const projects = [
    { id: projectIds.quietFracture,   businessId: 'signal9', name: 'The Quiet Fracture collection', status: 'active',   description: 'Debut fine art collection — A2 archival giclée prints, editions of 25.', note: 'First 6 pieces complete. Pricing finalised at $350 per print. Need to update Gumroad listing with new hero images.', tags: ['giclée', 'editions', 'Gumroad'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.harvestMarket,   businessId: 'signal9', name: 'Harvest Market presence',       status: 'active',   description: 'Regular market stall — display, sales, and collector outreach.', note: 'Next market confirmed. Print inventory: 12 units across 4 pieces. Need new banner stand.', tags: ['market', 'sales', 'display'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.onlineCollector, businessId: 'signal9', name: 'Online collector channel',      status: 'planning', description: 'Build direct-to-collector online presence via Substack + Gumroad.', note: 'Draft Substack welcome post written. Decide on launch date.', tags: ['Substack', 'Gumroad', 'collectors'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.realmEngine,     businessId: 'app',     name: 'Realm Engine',                  status: 'active',   description: 'World-building PWA for LitRPG and fantasy authors.', note: 'v0.8 in QA. Fixing map renderer bug on iOS Safari. Target v1.0 next month.', tags: ['PWA', 'iOS', 'v1'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.tether,          businessId: 'app',     name: 'Tether',                        status: 'active',   description: 'Habit and accountability tracker.', note: 'Streak feature shipped. User testing feedback being reviewed.', tags: ['habits', 'PWA'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.redPen,          businessId: 'app',     name: 'The Red Pen',                   status: 'active',   description: 'Manuscript editing and revision tracker for writers.', note: 'Core editing loop working. Need to add chapter-level progress bars.', tags: ['writing', 'PWA', 'editing'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.hollowAtlas,     businessId: 'app',     name: 'Hollow Atlas',                  status: 'planning', description: 'Interactive campaign atlas for tabletop RPG groups.', note: 'Research phase. Evaluating offline-first map storage approach.', tags: ['TTRPG', 'maps', 'PWA'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.kirksDaily,      businessId: 'app',     name: "Kirk's Daily",                  status: 'active',   description: 'This app — Signal9 Life Planner.', note: 'v1 build in progress. Focus: data layer and dashboard first.', tags: ['planner', 'PWA', 'personal'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.theTithe,        businessId: 'writing', name: 'The Tithe — Book 1',            status: 'active',   description: 'Grimdark LitRPG. A world where taxes are paid in years of life.', note: 'Chapter 14 drafted. Target: 90,000 words for Book 1. Currently ~52,000.', tags: ['grimdark', 'LitRPG', 'Book 1'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.fiveTriesLive,   businessId: 'writing', name: 'Five Tries to Live',            status: 'paused',   description: 'Grimdark survival story — five protagonists, one will survive.', note: 'Paused at 28,000 words. Structure outline needs rethink before continuing.', tags: ['grimdark', 'survival'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.worldWears,      businessId: 'writing', name: 'The World That Wears Your Face',status: 'active',   description: 'LitRPG with identity-swap mechanics — who are you when the system rewrites you?', note: 'Prologue and Act 1 outlined. Starting Chapter 1 this week.', tags: ['LitRPG', 'identity'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.bloodMarkers,    businessId: 'writing', name: 'Blood Markers — Book 2',        status: 'planning', description: 'Sequel to The Tithe. Map the political fallout of the Lifetithe system.', note: 'Series bible being built in parallel with Book 1 drafting.', tags: ['grimdark', 'LitRPG', 'Book 2'], links: [], createdAt: now(), updatedAt: now() },
  ]

  const events = [
    { id: uuid(), title: 'Harvest Market — City Square', date: fmt(addDays(today, 5)), time: '08:00', endTime: '16:00', category: 'signal9', note: 'Set up from 7:30am. Bring full inventory + new banner. Card reader charged.', reminder: true, reminderMinutes: 60, recurring: 'none', createdAt: now(), updatedAt: now() },
    { id: uuid(), title: 'Chapter 14 draft due — The Tithe', date: fmt(addDays(today, 10)), time: null, endTime: null, category: 'writing', note: 'Target ~4,500 words. Scene: The Collector arrives at the village.', reminder: true, reminderMinutes: 1440, recurring: 'none', createdAt: now(), updatedAt: now() },
    { id: uuid(), title: 'Realm Engine v1.0 QA deadline', date: fmt(addDays(today, 18)), time: null, endTime: null, category: 'app', note: 'All critical bugs resolved before this date. iOS Safari map render is priority.', reminder: true, reminderMinutes: 1440, recurring: 'none', createdAt: now(), updatedAt: now() },
  ]

  const tasks = [
    { id: uuid(), text: 'Update Gumroad listing with new hero images for The Quiet Fracture', category: 'signal9', done: false, doneAt: null, reminder: false, reminderDate: null, reminderTime: null, priority: 'high', note: 'Use the three landscape-oriented pieces. Export at 1800px wide.', projectId: projectIds.quietFracture, createdAt: now(), updatedAt: now() },
    { id: uuid(), text: 'Fix map renderer crash on iOS Safari — Realm Engine', category: 'app', done: false, doneAt: null, reminder: true, reminderDate: fmt(addDays(today, 3)), reminderTime: '09:00', priority: 'high', note: 'Reproduces on iPhone 14+ running iOS 17. WebGL context loss on background.', projectId: projectIds.realmEngine, createdAt: now(), updatedAt: now() },
    { id: uuid(), text: 'Write prologue for The World That Wears Your Face', category: 'writing', done: false, doneAt: null, reminder: false, reminderDate: null, reminderTime: null, priority: 'normal', note: 'Open with the character in the moment before the System first speaks to them.', projectId: projectIds.worldWears, createdAt: now(), updatedAt: now() },
    { id: uuid(), text: 'Order new banner stand for Harvest Market', category: 'signal9', done: false, doneAt: null, reminder: true, reminderDate: fmt(addDays(today, 2)), reminderTime: '10:00', priority: 'normal', note: '2.4m height. Retractable. Budget ~$180.', projectId: projectIds.harvestMarket, createdAt: now(), updatedAt: now() },
  ]

  const notes = [
    { id: uuid(), title: 'Signal9 Studio — Print Pricing Notes', body: 'The Quiet Fracture collection: A2 giclée, editions of 25.\n\nPricing:\n- Standard edition: $350\n- Artist proof (3 per edition): $500\n- Commission rate at Harvest Market: 15%\n\nPrinter: Archival Arts, 5-day turnaround. Order minimum 3 units.\n\nGumroad takes 10% + payment fees. Net ~$297 per sale.', category: 'signal9', pinned: true, tags: ['pricing', 'printing'], projectId: projectIds.quietFracture, createdAt: now(), updatedAt: now() },
    { id: uuid(), title: 'Realm Engine — iOS Safari Bug Notes', body: 'Bug: WebGL context is lost when app goes to background on iPhone.\n\nSteps to reproduce:\n1. Open map view\n2. Switch to another app (or lock screen)\n3. Return — map is blank, console shows "WebGL context lost"\n\nPotential fix: listen for webglcontextlost event and reinitialise renderer.\nSee: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isContextLost\n\nAlso worth checking: does the PWA manifest prevent this via display: standalone?', category: 'app', pinned: false, tags: ['bug', 'iOS', 'WebGL'], projectId: projectIds.realmEngine, createdAt: now(), updatedAt: now() },
    { id: uuid(), title: 'The Tithe — World Notes', body: "The Lifetithe System:\n- Citizens pay taxes in literal years of life\n- The Collectors are the state's enforcers — they carry 'life ledgers'\n- Wealthy families buy exemptions by tithing servants or prisoners\n- The MC discovers a loophole: you can pay someone else's tithe if they're already dead\n\nKey themes: class, exploitation, the cost of survival, found family in impossible circumstances.\n\nBook 1 ends with the MC surviving the Great Tithe at the cost of ten years — but discovering the ledgers are falsified.", category: 'writing', pinned: true, tags: ['world-building', 'LitRPG'], projectId: projectIds.theTithe, createdAt: now(), updatedAt: now() },
    { id: uuid(), title: 'App Dev — Revenue Model Notes', body: 'Current monetisation approach:\n- One-time purchase via Gumroad (no subscription)\n- Price points: $12–$29 per app depending on complexity\n- Realm Engine: $19 (planned)\n- The Red Pen: $14 (planned)\n- Tether: $9 (planned, free tier with limits)\n\nGumroad setup:\n- Signal9 Studio seller account\n- All apps listed under same account\n- Licence keys via Gumroad licence API\n\nTODO: Evaluate whether Paddle is better for AUS tax compliance.', category: 'app', pinned: false, tags: ['revenue', 'Gumroad', 'pricing'], projectId: null, createdAt: now(), updatedAt: now() },
  ]

  const wordcount = {
    sessions: [
      { id: uuid(), projectId: projectIds.theTithe,   date: fmt(addDays(today, -6)), count: 1240, note: 'Chapter 12 — the village council scene', createdAt: now() },
      { id: uuid(), projectId: projectIds.theTithe,   date: fmt(addDays(today, -5)), count: 980,  note: '', createdAt: now() },
      { id: uuid(), projectId: projectIds.theTithe,   date: fmt(addDays(today, -4)), count: 1450, note: 'Chapter 13 — first confrontation with a Collector', createdAt: now() },
      { id: uuid(), projectId: projectIds.theTithe,   date: fmt(addDays(today, -3)), count: 0,    note: '', createdAt: now() },
      { id: uuid(), projectId: projectIds.theTithe,   date: fmt(addDays(today, -2)), count: 1100, note: 'Chapter 13 continued', createdAt: now() },
      { id: uuid(), projectId: projectIds.theTithe,   date: fmt(addDays(today, -1)), count: 820,  note: '', createdAt: now() },
      { id: uuid(), projectId: projectIds.worldWears,  date: fmt(addDays(today, -2)), count: 600,  note: 'Prologue outline and first scene', createdAt: now() },
    ],
    goals: {
      [projectIds.theTithe]:  1000,
      [projectIds.worldWears]: 500,
    },
  }

  const finance = {
    entries: [
      { id: uuid(), businessId: 'signal9', date: fmt(addDays(today, -20)), amount: 350, source: 'Harvest Market — The Quiet Fracture #1', note: 'Cash sale', createdAt: now() },
      { id: uuid(), businessId: 'signal9', date: fmt(addDays(today, -20)), amount: 350, source: 'Harvest Market — The Quiet Fracture #3', note: 'Card sale', createdAt: now() },
      { id: uuid(), businessId: 'signal9', date: fmt(addDays(today, -15)), amount: 350, source: 'Gumroad — The Quiet Fracture #2 (online)', note: 'After fees: ~$297', createdAt: now() },
      { id: uuid(), businessId: 'app',     date: fmt(addDays(today, -10)), amount: 19,  source: 'Gumroad — Realm Engine licence', note: '', createdAt: now() },
      { id: uuid(), businessId: 'app',     date: fmt(addDays(today, -8)),  amount: 19,  source: 'Gumroad — Realm Engine licence', note: '', createdAt: now() },
      { id: uuid(), businessId: 'app',     date: fmt(addDays(today, -3)),  amount: 14,  source: 'Gumroad — The Red Pen licence', note: '', createdAt: now() },
    ],
    goals: {
      signal9: { monthly: 2000 },
      app:     { monthly: 500 },
    },
  }

  const settings = {
    displayName: 'Kirk',
    dailyWordGoal: 1000,
    theme: 'dark',
    notificationsEnabled: false,
    firedReminders: [],
    monthlyGoals: { signal9: 2000, app: 500 },
  }

  return { projects, events, tasks, notes, wordcount, finance, settings }
}
