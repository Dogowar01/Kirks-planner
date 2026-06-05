import { v4 as uuid } from 'uuid'

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
    { id: projectIds.quietFracture,   businessId: 'signal9', name: 'The Quiet Fracture collection', status: 'active',   description: 'Debut fine art collection — A2 archival giclée prints, editions of 25.', note: '', tags: ['giclée', 'editions', 'Gumroad'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.harvestMarket,   businessId: 'signal9', name: 'Harvest Market presence',       status: 'active',   description: 'Regular market stall — display, sales, and collector outreach.', note: '', tags: ['market', 'sales'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.onlineCollector, businessId: 'signal9', name: 'Online collector channel',      status: 'planning', description: 'Direct-to-collector online presence.', note: '', tags: ['Substack', 'Gumroad'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.realmEngine,     businessId: 'app',     name: 'Realm Engine',                  status: 'active',   description: 'World-building PWA for LitRPG and fantasy authors.', note: '', tags: ['PWA', 'iOS'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.tether,          businessId: 'app',     name: 'Tether',                        status: 'active',   description: 'Habit and accountability tracker.', note: '', tags: ['PWA'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.redPen,          businessId: 'app',     name: 'The Red Pen',                   status: 'active',   description: 'Manuscript editing and revision tracker.', note: '', tags: ['writing', 'PWA'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.hollowAtlas,     businessId: 'app',     name: 'Hollow Atlas',                  status: 'planning', description: 'Interactive campaign atlas for tabletop RPG groups.', note: '', tags: ['TTRPG', 'maps'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.kirksDaily,      businessId: 'app',     name: "Kirk's Daily",                  status: 'active',   description: 'Signal9 Life Planner — this app.', note: '', tags: ['planner', 'PWA'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.theTithe,        businessId: 'writing', name: 'The Tithe — Book 1',            status: 'active',   description: 'Grimdark LitRPG. A world where taxes are paid in years of life.', note: '', tags: ['grimdark', 'LitRPG'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.fiveTriesLive,   businessId: 'writing', name: 'Five Tries to Live',            status: 'paused',   description: 'Grimdark survival story — five protagonists, one will survive.', note: '', tags: ['grimdark'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.worldWears,      businessId: 'writing', name: 'The World That Wears Your Face',status: 'active',   description: 'LitRPG with identity-swap mechanics.', note: '', tags: ['LitRPG'], links: [], createdAt: now(), updatedAt: now() },
    { id: projectIds.bloodMarkers,    businessId: 'writing', name: 'Blood Markers — Book 2',        status: 'planning', description: 'Sequel to The Tithe.', note: '', tags: ['grimdark', 'LitRPG'], links: [], createdAt: now(), updatedAt: now() },
  ]

  const settings = {
    displayName: 'Kirk',
    dailyWordGoal: 1000,
    theme: 'dark',
    notificationsEnabled: false,
    firedReminders: [],
    monthlyGoals: { signal9: 0, app: 0 },
  }

  return {
    projects,
    events:    [],
    tasks:     [],
    contacts:  [],
    notes:     [],
    finance:   { entries: [], goals: { signal9: { monthly: 0 }, app: { monthly: 0 } } },
    settings,
  }
}
