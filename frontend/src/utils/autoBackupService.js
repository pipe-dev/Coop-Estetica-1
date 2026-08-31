// S.H.I.E.L.D. Pillar 20: Silent Automated Disaster Recovery Engine (4-Day Auto-Backup)

const BACKUP_KEY = 'spa_disaster_recovery_snapshot'
const LAST_BACKUP_TIMESTAMP_KEY = 'spa_last_backup_timestamp'
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000 // 4 días en milisegundos

export function runSilentAutoBackup(fullState) {
  try {
    const now = Date.now()
    const lastBackup = localStorage.getItem(LAST_BACKUP_TIMESTAMP_KEY)
    const elapsed = lastBackup ? now - parseInt(lastBackup, 10) : FOUR_DAYS_MS + 1

    if (elapsed >= FOUR_DAYS_MS) {
      const snapshot = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        businessConfig: fullState.businessConfig,
        categories: fullState.serviceCategories,
        memberships: fullState.memberships,
        closedDates: fullState.closedDates,
        team: fullState.teamMembers,
        products: fullState.products,
        clients: fullState.clients,
        appointments: fullState.appointments,
        cashSessions: fullState.cashSessions,
        transactions: fullState.transactions,
      }

      localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot))
      localStorage.setItem(LAST_BACKUP_TIMESTAMP_KEY, now.toString())
      console.log('[S.H.I.E.L.D. DISASTER RECOVERY] Respaldo silencioso de 4 días completado con éxito.')
    }
  } catch (e) {
    console.warn('[S.H.I.E.L.D. DISASTER RECOVERY] Aviso:', e)
  }
}
