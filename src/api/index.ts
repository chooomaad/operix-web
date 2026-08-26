import api from './client'

// ── Organisation (public) ────────────────────────────────────────────────────
export const organisationApi = {
  public: () => api.get('/organisation'),
}

// ── Recherche globale ─────────────────────────────────────────────────────────
export const searchApi = {
  search: (q: string, signal?: AbortSignal) => api.get('/search', { params: { q }, signal }),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  requestOtp: (email: string) => api.post('/auth/request-otp', { email }),
  // `platform` rattache le jeton emis a ce client : une connexion mobile ne ferme
  // plus la session web, et inversement (voir operix-api AuthController::issuePlatformToken).
  verifyOtp:  (email: string, code: string) => api.post('/auth/verify-otp', { email, code, platform: 'web' }),
  loginWithMatricule: (matricule: string, pin: string) => api.post('/auth/login', { matricule, pin, platform: 'web' }),
  register:   (data: Record<string, string>) => api.post('/auth/register', data),
  forgotPin:  (email: string) => api.post('/auth/forgot-pin', { email }),
  resetPin:   (data: Record<string, string>) => api.post('/auth/reset-pin', data),
  me:      () => api.get('/auth/me'),
  logout:  () => api.post('/auth/logout'),
  activate: (token: string, password: string, password_confirmation: string) =>
    api.post('/activate', { token, password, password_confirmation }),
}

// ── Commercial (public — site marketing) ──────────────────────────────────────
export const commercialApi = {
  plans:       () => api.get('/plans'),
  requestDemo: (data: Record<string, unknown>) => api.post('/demo-requests', data),
  checkout:    (data: Record<string, unknown>) => api.post('/checkout', data),
}

// ── Super Admin plateforme (super_admin uniquement) ───────────────────────────
export const superAdminApi = {
  dashboard:     () => api.get('/superadmin/dashboard'),
  // Demandes de démo
  demoRequests:  (params?: Record<string, unknown>) => api.get('/superadmin/demo-requests', { params }),
  demoRequest:   (id: number) => api.get(`/superadmin/demo-requests/${id}`),
  demoSetStatus: (id: number, status: string) => api.put(`/superadmin/demo-requests/${id}/status`, { status }),
  demoConvert:   (id: number, data: Record<string, unknown>) => api.post(`/superadmin/demo-requests/${id}/convert`, data),
  // Plans
  plans:         () => api.get('/superadmin/plans'),
  createPlan:    (data: Record<string, unknown>) => api.post('/superadmin/plans', data),
  updatePlan:    (id: number, data: Record<string, unknown>) => api.put(`/superadmin/plans/${id}`, data),
  // Commercial (lecture)
  orders:        (params?: Record<string, unknown>) => api.get('/superadmin/orders', { params }),
  payments:      (params?: Record<string, unknown>) => api.get('/superadmin/payments', { params }),
  subscriptions: (params?: Record<string, unknown>) => api.get('/superadmin/subscriptions', { params }),
  // Tenants
  tenants:       (params?: Record<string, unknown>) => api.get('/superadmin/tenants', { params }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  index:             (params?: Record<string, unknown>) => api.get('/dashboard', { params }),
  safetyTimeline:    (year?: number) => api.get('/dashboard/safety-timeline', { params: { year } }),
  employeeBreakdown: () => api.get('/dashboard/employee-breakdown'),
  incidentStats:     (year?: number) => api.get('/dashboard/incident-stats', { params: { year } }),
  recentActivity:    () => api.get('/dashboard/recent-activity'),
  topZones:          () => api.get('/dashboard/top-zones'),
}

// ── Safety Tracker ────────────────────────────────────────────────────────────
export const safetyTrackerApi = {
  index:   (year?: number) => api.get('/safety-tracker', { params: { year } }),
  history: () => api.get('/safety-tracker/history'),
}

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeesApi = {
  list:    (params?: Record<string, unknown>) => api.get('/employees', { params }),
  show:    (id: number) => api.get(`/employees/${id}`),
  create:  (data: FormData | Record<string, unknown>) => api.post('/employees', data),
  update:  (id: number, data: FormData | Record<string, unknown>) => api.post(`/employees/${id}`, data, { params: { _method: 'PUT' } }),
  destroy: (id: number) => api.delete(`/employees/${id}`),
  history: (id: number) => api.get(`/employees/${id}/history`),
  // Nested
  formations:    (empId: number, params?: Record<string, unknown>) => api.get(`/employees/${empId}/formations`, { params }),
  addFormation:  (empId: number, data: Record<string, unknown>) => api.post(`/employees/${empId}/formations`, data),
  certifications:(empId: number) => api.get(`/employees/${empId}/certifications`),
  addCert:       (empId: number, data: Record<string, unknown>) => api.post(`/employees/${empId}/certifications`, data),
  medicalVisits: (empId: number) => api.get(`/employees/${empId}/medical-visits`),
  addMedical:    (empId: number, data: Record<string, unknown>) => api.post(`/employees/${empId}/medical-visits`, data),
}

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsApi = {
  list:    () => api.get('/departments'),
  create:  (data: Record<string, unknown>) => api.post('/departments', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/departments/${id}`, data),
  delete:  (id: number) => api.delete(`/departments/${id}`),
}

// ── Incidents ─────────────────────────────────────────────────────────────────
export const incidentsApi = {
  list:    (params?: Record<string, unknown>) => api.get('/incidents', { params }),
  show:    (id: number) => api.get(`/incidents/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/incidents', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/incidents/${id}`, data),
  destroy: (id: number) => api.delete(`/incidents/${id}`),
  close:   (id: number, data: Record<string, unknown>) => api.post(`/incidents/${id}/close`, data),
  stats:   (year?: number) => api.get('/incidents/stats', { params: { year } }),
}

// ── Near Miss ─────────────────────────────────────────────────────────────────
export const nearMissApi = {
  list:    (params?: Record<string, unknown>) => api.get('/near-miss', { params }),
  show:    (id: number) => api.get(`/near-miss/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/near-miss', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/near-miss/${id}`, data),
  destroy: (id: number) => api.delete(`/near-miss/${id}`),
  close:   (id: number, data: Record<string, unknown>) => api.post(`/near-miss/${id}/close`, data),
}

// ── Breaches ──────────────────────────────────────────────────────────────────
export const breachesApi = {
  list:    (params?: Record<string, unknown>) => api.get('/breaches', { params }),
  show:    (id: number) => api.get(`/breaches/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/breaches', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/breaches/${id}`, data),
  destroy: (id: number) => api.delete(`/breaches/${id}`),
  close:   (id: number, data: Record<string, unknown>) => api.post(`/breaches/${id}/close`, data),
}

// ── Environment ───────────────────────────────────────────────────────────────
export const environmentApi = {
  list:    (params?: Record<string, unknown>) => api.get('/environment', { params }),
  show:    (id: number) => api.get(`/environment/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/environment', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/environment/${id}`, data),
  destroy: (id: number) => api.delete(`/environment/${id}`),
  close:   (id: number, data: Record<string, unknown>) => api.post(`/environment/${id}/close`, data),
  stats:   (params?: Record<string, unknown>) => api.get('/environment/stats', { params }),
}

// ── Gemba Walks ───────────────────────────────────────────────────────────────
export const gembaApi = {
  list:    (params?: Record<string, unknown>) => api.get('/gemba-walks', { params }),
  show:    (id: number) => api.get(`/gemba-walks/${id}`),
  create:  (data: FormData) => api.post('/gemba-walks', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:  (id: number, data: FormData) => api.post(`/gemba-walks/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  destroy: (id: number) => api.delete(`/gemba-walks/${id}`),
  resolve: (id: number) => api.post(`/gemba-walks/${id}/resolve`, {}),
  stats:   (params?: Record<string, unknown>) => api.get('/gemba-walks/stats', { params }),
}

// ── Permits to Work ───────────────────────────────────────────────────────────
export const permitsApi = {
  list:    (params?: Record<string, unknown>) => api.get('/permits', { params }),
  show:    (id: number) => api.get(`/permits/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/permits', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/permits/${id}`, data),
  destroy: (id: number) => api.delete(`/permits/${id}`),
  approve: (id: number) => api.post(`/permits/${id}/approve`),
  close:   (id: number, data?: Record<string, unknown>) => api.post(`/permits/${id}/close`, data ?? {}),
  stats:   (params?: Record<string, unknown>) => api.get('/permits/stats', { params }),
}

// ── Equipment ─────────────────────────────────────────────────────────────────
export const equipmentApi = {
  list:    (params?: Record<string, unknown>) => api.get('/equipment', { params }),
  show:    (id: number) => api.get(`/equipment/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/equipment', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/equipment/${id}`, data),
  delete:  (id: number) => api.delete(`/equipment/${id}`),
  inspect: (id: number, data: Record<string, unknown>) => api.post(`/equipment/${id}/inspect`, data),
}

// ── Contractors ───────────────────────────────────────────────────────────────
export const contractorsApi = {
  list:    (params?: Record<string, unknown>) => api.get('/contractors', { params }),
  show:    (id: number) => api.get(`/contractors/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/contractors', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/contractors/${id}`, data),
  destroy: (id: number) => api.delete(`/contractors/${id}`),
  // Personnel prestataire
  employees:       (id: number, params?: Record<string, unknown>) => api.get(`/contractors/${id}/employees`, { params }),
  addEmployee:     (id: number, data: Record<string, unknown>) => api.post(`/contractors/${id}/employees`, data),
  updateEmployee:  (id: number, empId: number, data: Record<string, unknown>) => api.put(`/contractors/${id}/employees/${empId}`, data),
  deleteEmployee:  (id: number, empId: number) => api.delete(`/contractors/${id}/employees/${empId}`),
}

// ── Visitors ──────────────────────────────────────────────────────────────────
export const visitorsApi = {
  list:     (params?: Record<string, unknown>) => api.get('/visitors', { params }),
  onSite:   () => api.get('/visitors/on-site'),
  show:     (id: number) => api.get(`/visitors/${id}`),
  create:   (data: Record<string, unknown>) => api.post('/visitors', data),
  destroy:  (id: number) => api.delete(`/visitors/${id}`),
  checkout: (id: number) => api.post(`/visitors/${id}/checkout`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead:    (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  create:      (data: Record<string, unknown>) => api.post('/notifications', data),
  destroy:     (id: string) => api.delete(`/notifications/${id}`),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:    (params?: Record<string, unknown>) => api.get('/users', { params }),
  show:    (id: number) => api.get(`/users/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/users', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  destroy: (id: number) => api.delete(`/users/${id}`),
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, unknown>) => api.get('/audit', { params }),
  show: (id: number) => api.get(`/audit/${id}`),
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get:        () => api.get('/settings'),
  update:     (data: Record<string, unknown>) => api.put('/settings', data),
  uploadLogo: (fd: FormData) => api.post('/settings/logo', fd),
  deleteLogo: () => api.delete('/settings/logo'),
}

// ── Reports (PDF) ─────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard:        (params?: Record<string, unknown>) => api.get('/reports/dashboard', { params, responseType: 'blob' }),
  incidents:        (params?: Record<string, unknown>) => api.get('/reports/incidents', { params, responseType: 'blob' }),
  incidentDetail:   (id: number) => api.get(`/reports/incidents/${id}`, { responseType: 'blob' }),
  nearMiss:         (params?: Record<string, unknown>) => api.get('/reports/near-miss', { params, responseType: 'blob' }),
  breaches:         (params?: Record<string, unknown>) => api.get('/reports/breaches', { params, responseType: 'blob' }),
  environment:      (params?: Record<string, unknown>) => api.get('/reports/environment', { params, responseType: 'blob' }),
  employees:        (params?: Record<string, unknown>) => api.get('/reports/employees', { params, responseType: 'blob' }),
  employeeProfile:  (id: number) => api.get(`/reports/employees/${id}/profile`, { responseType: 'blob' }),
  permits:          (params?: Record<string, unknown>) => api.get('/reports/permits', { params, responseType: 'blob' }),
}

// ── Exports (Excel) ───────────────────────────────────────────────────────────
export const exportsApi = {
  employees:      (params?: Record<string, unknown>) => api.get('/exports/employees', { params, responseType: 'blob' }),
  incidents:      (params?: Record<string, unknown>) => api.get('/exports/incidents', { params, responseType: 'blob' }),
  nearMiss:       (params?: Record<string, unknown>) => api.get('/exports/near-miss', { params, responseType: 'blob' }),
  breaches:       (params?: Record<string, unknown>) => api.get('/exports/breaches', { params, responseType: 'blob' }),
  environment:    (params?: Record<string, unknown>) => api.get('/exports/environment', { params, responseType: 'blob' }),
  certifications: (params?: Record<string, unknown>) => api.get('/exports/certifications', { params, responseType: 'blob' }),
  medicalVisits:  (params?: Record<string, unknown>) => api.get('/exports/medical-visits', { params, responseType: 'blob' }),
  permits:        (params?: Record<string, unknown>) => api.get('/exports/permits', { params, responseType: 'blob' }),
  visitors:       (params?: Record<string, unknown>) => api.get('/exports/visitors', { params, responseType: 'blob' }),
  contractors:    (params?: Record<string, unknown>) => api.get('/exports/contractors', { params, responseType: 'blob' }),
  template:       () => api.get('/exports/templates/employees', { responseType: 'blob' }),
}

// ── Imports ───────────────────────────────────────────────────────────────────
export const importsApi = {
  previewEmployees: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/imports/employees/preview', fd) },
  importEmployees:  (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/imports/employees', fd) },
  previewIncidents: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/imports/incidents/preview', fd) },
  importIncidents:  (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/imports/incidents', fd) },
  importNearMiss:   (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/imports/near-miss', fd) },
}
