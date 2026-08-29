import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    requiresSuperAdmin?: boolean
    // Permission backend exigee pour la route. Aligne le frontend sur la
    // matrice du serveur : la meme permission garde l'ecran et l'API.
    requiresPermission?: string
    agentOnly?: boolean
  }
}
