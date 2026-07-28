import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Public ──────────────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { public: true },
    },

    // ── Interface Agent ───────────────────────────────────────────────────────
    {
      path: '/agent',
      component: () => import('@/components/layout/AgentLayout.vue'),
      meta: { requiresAuth: true, agentOnly: true },
      children: [
        { path: '', name: 'agent-search', component: () => import('@/pages/agent/AgentSearchPage.vue') },
      ],
    },

    // ── App shell ────────────────────────────────────────────────────────────
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '',             name: 'dashboard',          component: () => import('@/pages/dashboard/DashboardPage.vue') },
        { path: 'safety-tracker', name: 'safety-tracker',  component: () => import('@/pages/dashboard/SafetyTrackerPage.vue') },

        // Employees
        { path: 'employees',              name: 'employees',       component: () => import('@/pages/employees/EmployeesPage.vue') },
        { path: 'employees/:id',          name: 'employee-detail', component: () => import('@/pages/employees/EmployeeDetailPage.vue') },

        // Safety
        { path: 'incidents',              name: 'incidents',       component: () => import('@/pages/incidents/IncidentsPage.vue') },
        { path: 'incidents/:id',          name: 'incident-detail', component: () => import('@/pages/incidents/IncidentDetailPage.vue') },
        { path: 'near-miss',              name: 'near-miss',       component: () => import('@/pages/nearmiss/NearMissPage.vue') },
        { path: 'near-miss/:id',          name: 'near-miss-detail',component: () => import('@/pages/nearmiss/NearMissDetailPage.vue') },
        { path: 'breaches',               name: 'breaches',        component: () => import('@/pages/breaches/BreachesPage.vue') },
        { path: 'environment',            name: 'environment',     component: () => import('@/pages/environment/EnvironmentPage.vue') },

        // Operations
        { path: 'permits',                name: 'permits',         component: () => import('@/pages/permits/PermitsPage.vue') },
        { path: 'permits/:id',            name: 'permit-detail',   component: () => import('@/pages/permits/PermitDetailPage.vue') },
        { path: 'equipment',              name: 'equipment',       component: () => import('@/pages/equipment/EquipmentPage.vue') },
        { path: 'contractors',            name: 'contractors',     component: () => import('@/pages/contractors/ContractorsPage.vue') },
        { path: 'visitors',               name: 'visitors',        component: () => import('@/pages/visitors/VisitorsPage.vue') },
        { path: 'gemba-walks',            name: 'gemba',           component: () => import('@/pages/gemba/GembaPage.vue') },

        // Reports & Data
        { path: 'reports',                name: 'reports',         component: () => import('@/pages/reports/ReportsPage.vue') },
        { path: 'notifications',          name: 'notifications',   component: () => import('@/pages/notifications/NotificationsPage.vue') },
        { path: 'audit',                  name: 'audit',           component: () => import('@/pages/audit/AuditPage.vue') },

        // Settings — super_admin only
        { path: 'settings',               name: 'settings',        component: () => import('@/pages/settings/SettingsPage.vue'),    meta: { requiresSuperAdmin: true } },
        { path: 'settings/users',         name: 'users',           component: () => import('@/pages/settings/UsersPage.vue'),       meta: { requiresSuperAdmin: true } },
        { path: 'settings/departments',   name: 'departments',     component: () => import('@/pages/settings/DepartmentsPage.vue'), meta: { requiresSuperAdmin: true } },

        // 403
        { path: 'forbidden',              name: 'forbidden',       component: () => import('@/pages/auth/ForbiddenPage.vue') },
      ],
    },

    // ── Activation de compte (public) ─────────────────────────────────────────
    {
      path: '/activate',
      name: 'activate',
      component: () => import('@/pages/activate/ActivatePage.vue'),
      meta: { public: true },
    },

    // ── Console Super Admin plateforme (super_admin uniquement) ───────────────
    {
      path: '/superadmin',
      component: () => import('@/pages/superadmin/SuperAdminLayout.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true },
      children: [
        { path: '',              name: 'sa-dashboard',     component: () => import('@/pages/superadmin/SaDashboard.vue') },
        { path: 'demo-requests', name: 'sa-demo-requests', component: () => import('@/pages/superadmin/SaDemoRequests.vue') },
        { path: 'plans',         name: 'sa-plans',         component: () => import('@/pages/superadmin/SaPlans.vue') },
        { path: 'orders',        name: 'sa-orders',        component: () => import('@/pages/superadmin/SaOrders.vue') },
        { path: 'payments',      name: 'sa-payments',      component: () => import('@/pages/superadmin/SaPayments.vue') },
        { path: 'subscriptions', name: 'sa-subscriptions', component: () => import('@/pages/superadmin/SaSubscriptions.vue') },
      ],
    },

    // ── Catch-all ────────────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) return true

  if (!auth.isAuthenticated) {
    if (!auth.token) return { name: 'login' }
    await auth.fetchMe()
    if (!auth.isAuthenticated) return { name: 'login' }
  }

  const role = auth.user?.role

  // Super Admin plateforme → console dédiée (aucun contexte tenant)
  if (auth.isSuperAdmin && !to.path.startsWith('/superadmin')) {
    return { name: 'sa-dashboard' }
  }

  // Agents → interface agent seulement, aucun accès à l'AppLayout
  if (role === 'agent' && !to.meta.agentOnly) {
    return { name: 'agent-search' }
  }

  // Admin/super_admin → ne peuvent pas accéder à /agent
  if (role !== 'agent' && to.meta.agentOnly) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresSuperAdmin && !auth.isSuperAdmin) {
    return { name: 'forbidden' }
  }

  return true
})

export default router
