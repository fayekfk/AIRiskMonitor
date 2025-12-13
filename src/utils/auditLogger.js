// Audit Trail System
// Tracks all user actions for compliance and auditing

class AuditLogger {
  constructor() {
    this.storageKey = 'pm_risk_audit_trail';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  log(action, details, user = 'PM User') {
    const entry = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user: user,
      action: action,
      details: details,
      sessionId: this.getSessionId()
    };

    const logs = this.getLogs();
    logs.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(logs));

    return entry;
  }

  getLogs(limit = null) {
    const logs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    if (limit) {
      return logs.slice(-limit).reverse();
    }
    return logs.reverse();
  }

  getLogsByDate(startDate, endDate) {
    const logs = this.getLogs();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });
  }

  getLogsByAction(actionType) {
    const logs = this.getLogs();
    return logs.filter(log => log.action === actionType);
  }

  getLogsByUser(username) {
    const logs = this.getLogs();
    return logs.filter(log => log.user === username);
  }

  clearLogs() {
    localStorage.setItem(this.storageKey, JSON.stringify([]));
  }

  exportToCSV() {
    const logs = this.getLogs();
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details', 'Session ID'];
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        JSON.stringify(log.details).replace(/,/g, ';'),
        log.sessionId
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  getStats() {
    const logs = this.getLogs();
    const stats = {
      total: logs.length,
      today: logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate >= weekAgo;
      }).length,
      byAction: {},
      byUser: {}
    };

    logs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

export default auditLogger;

// Action Types
export const ACTIONS = {
  // Session Actions
  APP_LOADED: 'APP_LOADED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',

  // Data Actions
  PROJECT_LOADED: 'PROJECT_LOADED',
  CSV_IMPORTED: 'CSV_IMPORTED',
  SAMPLE_DATA_LOADED: 'SAMPLE_DATA_LOADED',
  DATA_RESET: 'DATA_RESET',
  RAW_DATA_VIEWED: 'RAW_DATA_VIEWED',
  RAW_DATA_EXPORTED: 'RAW_DATA_EXPORTED',

  // Analysis Actions
  RISK_ANALYSIS_STARTED: 'RISK_ANALYSIS_STARTED',
  RISK_ANALYSIS_RUN: 'RISK_ANALYSIS_RUN',
  RISK_VIEWED: 'RISK_VIEWED',

  // AI Actions
  AI_INSIGHT_REQUESTED: 'AI_INSIGHT_REQUESTED',
  AI_INSIGHT_GENERATED: 'AI_INSIGHT_GENERATED',

  // Mitigation Actions
  MITIGATION_SIMULATED: 'MITIGATION_SIMULATED',
  MITIGATION_APPROVED: 'MITIGATION_APPROVED',

  // Export Actions
  REPORT_EXPORTED: 'REPORT_EXPORTED',
  AUDIT_LOG_EXPORTED: 'AUDIT_LOG_EXPORTED',
  AUDIT_LOG_VIEWED: 'AUDIT_LOG_VIEWED',

  // Communication Actions
  EMAIL_SENT: 'EMAIL_SENT',
  EMAIL_MODAL_OPENED: 'EMAIL_MODAL_OPENED',

  // Navigation Actions
  VIEW_CHANGED: 'VIEW_CHANGED',
  SEARCH_PERFORMED: 'SEARCH_PERFORMED',
  FILTER_APPLIED: 'FILTER_APPLIED',
  SORT_CHANGED: 'SORT_CHANGED',

  // Settings Actions
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',

  // Error Actions
  ERROR_OCCURRED: 'ERROR_OCCURRED'
};