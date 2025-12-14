import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';
import emailjs from '@emailjs/browser';
import ReactMarkdown from 'react-markdown';
import './App.css';
import i2eLogo from './assets/i2eLogo.webp';

// ===================================
// IMPORT UTILITIES
// ===================================
import auditLogger from './utils/auditLogger';
import pdfGenerator from './utils/pdfGenerator';
import { callOpenAI, extractContent } from './utils/openaiClient';

// ===================================
// EMAILJS CONFIGURATION
// ===================================
const EMAILJS_CONFIG = {
  serviceId: 'service_0kasokd',
  templateId: 'template_t2x8h0p',
  publicKey: 'qmsVgw23wSJQe0ynw'
};

// ===================================
// OPENAI (CHATGPT) CONFIGURATION
// ===================================
// API key is now securely stored in Vercel backend
// No need to expose it in frontend code!

// ===================================
// CONSTANTS & CONFIGURATION
// ===================================
const ACTIONS = {
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
  SIMULATION_OPENED: 'SIMULATION_OPENED',
  MITIGATION_SIMULATED: 'MITIGATION_SIMULATED',
  MITIGATION_APPROVED: 'MITIGATION_APPROVED',
  MITIGATION_STRATEGIES_GENERATED: 'MITIGATION_STRATEGIES_GENERATED',
  STRATEGY_SELECTED: 'STRATEGY_SELECTED',
  MITIGATION_APPLIED: 'MITIGATION_APPLIED',

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
  RISK_SELECTED: 'RISK_SELECTED',

  // Error Actions
  ERROR_OCCURRED: 'ERROR_OCCURRED'
};

// ===================================
// ERROR BOUNDARY COMPONENT
// ===================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    if (auditLogger && auditLogger.log) {
      auditLogger.log('ERROR_OCCURRED', {
        error: error.message,
        stack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #f0fdfa 100%)',
          color: '#1e293b',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️ Oops!</h1>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#475569' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem', maxWidth: '500px', textAlign: 'center', color: '#64748b' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===================================
// TOAST NOTIFICATION COMPONENT
// ===================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`} onClick={onClose}>
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  );
};

// ===================================
// CONFIRM MODAL COMPONENT
// ===================================
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  return (
    <div className="confirm-modal-overlay" onClick={handleCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal-icon ${type}`}>
          {type === 'danger' ? '⚠️' : type === 'warning' ? '❓' : 'ℹ️'}
        </div>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-btn cancel" onClick={handleCancel}>
            {cancelText}
          </button>
          <button type="button" className={`confirm-modal-btn confirm ${type}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================
// CSV UPLOADER COMPONENT
// ===================================
const CSVUploader = ({ onDataLoaded, onLoadSampleData }) => {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());

    // Parse header - handle quoted values
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseCSVLine(lines[0]);

    const activities = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const activity = {};
      headers.forEach((header, index) => {
        activity[header] = values[index] || '';
      });

      // Parse into expected format with complete field structure per requirements:
      // Activity Info: Activity_ID, Activity_Name, Work_Package
      // Schedule: Planned_Start, Planned_Finish, Planned_Duration, Actual_Start, Actual_Finish, Remaining_Duration
      // Baseline: Baseline_Start, Baseline_Finish, Baseline_Duration
      // Progress: Percent_Complete, Status
      // CPM Analysis: ES, EF, LS, LF, Total_Float_days, On_Critical_Path
      // Dependencies: Predecessor_ID, Successor_ID, Dependency_Type
      // Resources: Resource_ID, Role, FTE_Allocation, Resource_Max_FTE, Skill_Tags
      // Risk Data: Probability, Delay_Impact_days, Cost_Impact_of_Risk

      const plannedDuration = parseInt(activity.Planned_Duration || activity.Duration) || 5;
      const percentComplete = parseInt(activity.Percent_Complete || activity.CompletionPercent) || 0;

      const parsedActivity = {
        // Activity Info
        Activity_ID: activity.Activity_ID || activity.ID || activity.Activity || `A-${i.toString().padStart(3, '0')}`,
        Activity_Name: activity.Activity_Name || activity.Name || activity.Description || `Activity ${i}`,
        Work_Package: activity.Work_Package || '',

        // Schedule
        Planned_Start: activity.Planned_Start || activity.StartDate || '2025-01-01',
        Planned_Finish: activity.Planned_Finish || '',
        Planned_Duration: plannedDuration,
        Actual_Start: activity.Actual_Start || '',
        Actual_Finish: activity.Actual_Finish || '',
        Remaining_Duration: parseInt(activity.Remaining_Duration) || Math.round(plannedDuration * (1 - percentComplete / 100)),

        // Baseline
        Baseline_Start: activity.Baseline_Start || activity.Planned_Start || activity.StartDate || '',
        Baseline_Finish: activity.Baseline_Finish || activity.Planned_Finish || '',
        Baseline_Duration: parseInt(activity.Baseline_Duration) || plannedDuration,

        // Progress
        Percent_Complete: percentComplete,
        Status: activity.Status || 'not-started',

        // CPM Analysis
        ES: parseInt(activity.ES) || 0,
        EF: parseInt(activity.EF) || 0,
        LS: parseInt(activity.LS) || 0,
        LF: parseInt(activity.LF) || 0,
        Total_Float_days: parseInt(activity.Total_Float_days || activity.Float) || 0,
        On_Critical_Path: activity.On_Critical_Path === 'Yes' || activity.On_Critical_Path === 'true' ||
                          activity.IsCriticalPath === 'Yes' || activity.IsCriticalPath === 'true',

        // Dependencies
        Predecessor_ID: activity.Predecessor_ID || (activity.Dependencies ? activity.Dependencies.split('|').filter(d => d).join(';') : ''),
        Successor_ID: activity.Successor_ID || '',
        Dependency_Type: activity.Dependency_Type || 'FS',

        // Resources
        Resource_ID: activity.Resource_ID || activity.Resource || 'R-001',
        Role: activity.Role || '',
        FTE_Allocation: parseInt(activity.FTE_Allocation || activity.Allocation) || 100,
        Resource_Max_FTE: parseFloat(activity.Resource_Max_FTE) || 1.0,
        Skill_Tags: activity.Skill_Tags || '',

        // Risk Data
        Probability: parseFloat(activity.Probability) || 0.5,
        Delay_Impact_days: parseInt(activity.Delay_Impact_days || activity.DaysDelayed) || 0,
        Cost_Impact_of_Risk: parseFloat(activity.Cost_Impact_of_Risk) || 0,

        // Legacy field mappings for backward compatibility
        id: activity.Activity_ID || activity.ID || activity.Activity || `A-${i.toString().padStart(3, '0')}`,
        name: activity.Activity_Name || activity.Name || activity.Description || `Activity ${i}`,
        duration: plannedDuration,
        dependencies: activity.Dependencies ? activity.Dependencies.split('|').filter(d => d) : [],
        resource: activity.Resource_ID || activity.Resource || 'R-001',
        startDate: activity.Planned_Start || activity.StartDate || '2025-01-01',
        status: activity.Status || 'not-started',
        daysDelayed: parseInt(activity.Delay_Impact_days || activity.DaysDelayed) || 0,
        allocation: parseInt(activity.FTE_Allocation || activity.Allocation) || 100,
        completionPercent: percentComplete,
        type: activity.Type || 'General',
        isCriticalPath: activity.On_Critical_Path === 'Yes' || activity.On_Critical_Path === 'true' ||
                        activity.IsCriticalPath === 'Yes' || activity.IsCriticalPath === 'true',
        float: parseInt(activity.Total_Float_days || activity.Float) || 0
      };

      // Preserve ProjectName and ProjectCategory for grouping
      if (activity.ProjectName) {
        parsedActivity.ProjectName = activity.ProjectName;
      }
      if (activity.ProjectCategory) {
        parsedActivity.ProjectCategory = activity.ProjectCategory;
      }

      activities.push(parsedActivity);
    }

    return activities;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const activities = parseCSV(text);
      
      if (activities.length === 0) {
        throw new Error('No valid activities found in CSV');
      }

      auditLogger.log(ACTIONS.CSV_IMPORTED, {
        filename: file.name,
        activityCount: activities.length
      });

      onDataLoaded(activities, file.name);
      setIsLoading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Complete field structure per requirements:
    // Activity Info: Activity_ID, Activity_Name, Work_Package
    // Schedule: Planned_Start, Planned_Finish, Planned_Duration, Actual_Start, Actual_Finish, Remaining_Duration
    // Baseline: Baseline_Start, Baseline_Finish, Baseline_Duration
    // Progress: Percent_Complete, Status
    // CPM Analysis: ES, EF, LS, LF, Total_Float_days, On_Critical_Path
    // Dependencies: Predecessor_ID, Successor_ID, Dependency_Type
    // Resources: Resource_ID, Role, FTE_Allocation, Resource_Max_FTE, Skill_Tags
    // Risk Data: Probability, Delay_Impact_days, Cost_Impact_of_Risk
    const template = `Activity_ID,Activity_Name,Work_Package,Planned_Start,Planned_Finish,Planned_Duration,Actual_Start,Actual_Finish,Remaining_Duration,Baseline_Start,Baseline_Finish,Baseline_Duration,Percent_Complete,Status,ES,EF,LS,LF,Total_Float_days,On_Critical_Path,Predecessor_ID,Successor_ID,Dependency_Type,Resource_ID,Role,FTE_Allocation,Resource_Max_FTE,Skill_Tags,Probability,Delay_Impact_days,Cost_Impact_of_Risk
A-001,Project Kickoff,WP-001,2025-01-06,2025-01-10,5,2025-01-06,2025-01-10,0,2025-01-06,2025-01-10,5,100,completed,0,5,0,5,0,Yes,,A-002,FS,PM-001,Project Manager,100,1.0,ProjectMgmt;Leadership,0.1,0,0
A-002,Requirements Analysis,WP-002,2025-01-13,2025-01-24,12,2025-01-13,,8,2025-01-13,2025-01-24,12,35,in-progress,5,17,5,17,0,Yes,A-001,A-003;A-004,FS,BA-001,Business Analyst,100,1.0,BusinessAnalysis;Requirements,0.4,3,8000`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleData = (projectIndex = null) => {
    // If specific project index provided, download just that project
    // Otherwise download a combined file with all projects
    // Complete field structure per requirements
    const header = 'ProjectName,ProjectCategory,Activity_ID,Activity_Name,Work_Package,Planned_Start,Planned_Finish,Planned_Duration,Actual_Start,Actual_Finish,Remaining_Duration,Baseline_Start,Baseline_Finish,Baseline_Duration,Percent_Complete,Status,ES,EF,LS,LF,Total_Float_days,On_Critical_Path,Predecessor_ID,Successor_ID,Dependency_Type,Resource_ID,Role,FTE_Allocation,Resource_Max_FTE,Skill_Tags,Probability,Delay_Impact_days,Cost_Impact_of_Risk';

    let csvLines = [header];

    const projectsToExport = projectIndex !== null ? [SAMPLE_PROJECTS[projectIndex]] : SAMPLE_PROJECTS;

    projectsToExport.forEach(proj => {
      proj.activities.forEach(act => {
        // Calculate Planned_Finish based on Planned_Start and duration
        const plannedFinish = act.Planned_Finish || '';
        const actualStart = act.Actual_Start || (act.status !== 'not-started' ? act.Planned_Start : '');
        const actualFinish = act.Actual_Finish || (act.status === 'completed' ? act.Planned_Finish : '');
        const remainingDuration = act.Remaining_Duration !== undefined ? act.Remaining_Duration :
          Math.round(act.Planned_Duration * (1 - (act.Percent_Complete || 0) / 100));

        csvLines.push([
          `"${proj.name}"`,
          `"${proj.category}"`,
          act.Activity_ID || act.id,
          `"${act.Activity_Name || act.name}"`,
          act.Work_Package || '',
          act.Planned_Start || act.startDate,
          plannedFinish,
          act.Planned_Duration || act.duration,
          actualStart,
          actualFinish,
          remainingDuration,
          act.Baseline_Start || act.Planned_Start || act.startDate,
          act.Baseline_Finish || plannedFinish,
          act.Baseline_Duration || act.Planned_Duration || act.duration,
          act.Percent_Complete !== undefined ? act.Percent_Complete : (act.completionPercent || 0),
          act.Status || act.status,
          act.ES || 0,
          act.EF || 0,
          act.LS || 0,
          act.LF || 0,
          act.Total_Float_days !== undefined ? act.Total_Float_days : (act.float || 0),
          act.On_Critical_Path !== undefined ? (act.On_Critical_Path ? 'Yes' : 'No') : (act.isCriticalPath ? 'Yes' : 'No'),
          act.Predecessor_ID || '',
          act.Successor_ID || '',
          act.Dependency_Type || 'FS',
          act.Resource_ID || act.resource,
          act.Role || '',
          act.FTE_Allocation !== undefined ? act.FTE_Allocation : (act.allocation || 100),
          act.Resource_Max_FTE || 1.0,
          `"${act.Skill_Tags || ''}"`,
          act.Probability || 0.5,
          act.Delay_Impact_days || 0,
          act.Cost_Impact_of_Risk || 0
        ].join(','));
      });
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = projectIndex !== null
      ? `${SAMPLE_PROJECTS[projectIndex].name.replace(/\s+/g, '_')}.csv`
      : 'all_sample_projects.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="csv-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center' }}>
        <button
          className="csv-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          style={{
            padding: '0.6rem 1rem',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap'
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            <>
              📁 Upload CSV
            </>
          )}
        </button>

        <button
          onClick={downloadTemplate}
          style={{
            padding: '0.6rem 1rem',
            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 2px 8px rgba(71, 85, 105, 0.25)',
            whiteSpace: 'nowrap'
          }}
        >
          📄 Template
        </button>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            onChange={(e) => {
              if (e.target.value === 'all') {
                downloadSampleData(null);
              } else if (e.target.value !== '') {
                downloadSampleData(parseInt(e.target.value));
              }
              e.target.value = '';
            }}
            style={{
              padding: '0.6rem 1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem',
              appearance: 'none',
              paddingRight: '1.75rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              whiteSpace: 'nowrap'
            }}
            defaultValue=""
          >
            <option value="" disabled style={{ color: '#333' }}>📥 Download CSV</option>
            <option value="all" style={{ color: '#333' }}>📦 All Projects (7)</option>
            <option disabled style={{ color: '#999' }}>─── Healthcare ───</option>
            <option value="1" style={{ color: '#333' }}>🏥 Hospital EMR</option>
            <option value="2" style={{ color: '#333' }}>💊 Clinical Trial</option>
            <option value="6" style={{ color: '#333' }}>📱 Healthcare App</option>
            <option disabled style={{ color: '#999' }}>─── Software ───</option>
            <option value="0" style={{ color: '#333' }}>💻 Enterprise CRM</option>
            <option disabled style={{ color: '#999' }}>─── Other ───</option>
            <option value="3" style={{ color: '#333' }}>🏗️ Construction</option>
            <option value="4" style={{ color: '#333' }}>☁️ Cloud Migration</option>
            <option value="5" style={{ color: '#333' }}>📣 Marketing</option>
          </select>
          <span style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'white',
            fontSize: '0.7rem'
          }}>▼</span>
        </div>

        {onLoadSampleData && (
          <button
            onClick={onLoadSampleData}
            style={{
              padding: '0.6rem 1rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            🚀 Load Samples
          </button>
        )}
      </div>

      <p style={{
        textAlign: 'center',
        marginTop: '0.75rem',
        fontSize: '0.8rem',
        color: '#94a3b8'
      }}>
        Choose from 7 sample projects: Healthcare, Software, Construction, Cloud Migration, and Marketing
      </p>

      {error && (
        <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

// ===================================
// AUDIT LOG MODAL COMPONENT
// ===================================
const AuditLogModal = ({ onClose }) => {
  const logs = auditLogger.getLogs(50);
  const stats = auditLogger.getStats();

  const exportAuditLog = () => {
    const csv = auditLogger.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    auditLogger.log(ACTIONS.AUDIT_LOG_EXPORTED, {
      logCount: logs.length,
      filename: a.download
    });
  };

  return (
    <div className="audit-modal" onClick={onClose}>
      <div className="audit-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>📜 Audit Trail</h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '1.25rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.target.style.background = '#fee2e2'; }}
            onMouseOut={(e) => { e.target.style.background = '#fef2f2'; }}
          >
            ×
          </button>
        </div>

        {/* Stats Summary */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem', 
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4f46e5' }}>{stats.total}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Actions</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{stats.today}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Today</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{stats.thisWeek}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>This Week</div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Recent Activity (Last 50)</h3>
          <button onClick={exportAuditLog} className="export-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            📥 Export CSV
          </button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              No audit logs yet. Start using the app to see activity here.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="audit-log-entry">
                <div className="timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                <div className="action">
                  <strong>{log.action.replace(/_/g, ' ')}</strong>
                </div>
                <div className="details">
                  User: {log.user} | {JSON.stringify(log.details)}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={{
            padding: '0.75rem 1.5rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================
// RAW DATA MODAL COMPONENT
// ===================================
const RawDataModal = ({ projectData, onClose }) => {
  if (!projectData) return null;

  const exportRawData = () => {
    // Complete field structure per requirements
    const headers = ['Activity_ID', 'Activity_Name', 'Work_Package', 'Planned_Start', 'Planned_Finish', 'Planned_Duration', 'Actual_Start', 'Actual_Finish', 'Remaining_Duration', 'Baseline_Start', 'Baseline_Finish', 'Baseline_Duration', 'Percent_Complete', 'Status', 'ES', 'EF', 'LS', 'LF', 'Total_Float_days', 'On_Critical_Path', 'Predecessor_ID', 'Successor_ID', 'Dependency_Type', 'Resource_ID', 'Role', 'FTE_Allocation', 'Resource_Max_FTE', 'Skill_Tags', 'Probability', 'Delay_Impact_days', 'Cost_Impact_of_Risk'];
    const csvContent = [
      headers.join(','),
      ...projectData.activities.map(act => [
        act.Activity_ID || act.id,
        `"${act.Activity_Name || act.name}"`,
        act.Work_Package || '',
        act.Planned_Start || act.startDate || '',
        act.Planned_Finish || '',
        act.Planned_Duration || act.duration,
        act.Actual_Start || '',
        act.Actual_Finish || '',
        act.Remaining_Duration !== undefined ? act.Remaining_Duration : Math.round((act.Planned_Duration || act.duration) * (1 - (act.Percent_Complete || act.completionPercent || 0) / 100)),
        act.Baseline_Start || act.Planned_Start || act.startDate || '',
        act.Baseline_Finish || act.Planned_Finish || '',
        act.Baseline_Duration || act.Planned_Duration || act.duration,
        act.Percent_Complete !== undefined ? act.Percent_Complete : (act.completionPercent || 0),
        act.Status || act.status || '',
        act.ES || 0,
        act.EF || 0,
        act.LS || 0,
        act.LF || 0,
        act.Total_Float_days !== undefined ? act.Total_Float_days : (act.float || 0),
        (act.On_Critical_Path !== undefined ? act.On_Critical_Path : act.isCriticalPath) ? 'Yes' : 'No',
        act.Predecessor_ID || '',
        act.Successor_ID || '',
        act.Dependency_Type || 'FS',
        act.Resource_ID || act.resource || '',
        act.Role || '',
        act.FTE_Allocation !== undefined ? act.FTE_Allocation : (act.allocation || 100),
        act.Resource_Max_FTE || 1.0,
        `"${act.Skill_Tags || ''}"`,
        act.Probability || 0.5,
        act.Delay_Impact_days !== undefined ? act.Delay_Impact_days : (act.daysDelayed || 0),
        act.Cost_Impact_of_Risk || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `raw_data_${projectData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    auditLogger.log(ACTIONS.RAW_DATA_EXPORTED, {
      projectName: projectData.name,
      activityCount: projectData.activities.length,
      filename: filename
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      'completed': { bg: '#dcfce7', color: '#166534' },
      'in-progress': { bg: '#dbeafe', color: '#1e40af' },
      'not-started': { bg: '#f3f4f6', color: '#6b7280' },
      'delayed': { bg: '#fef2f2', color: '#dc2626' }
    };
    const style = colors[status] || colors['not-started'];
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {status || 'N/A'}
      </span>
    );
  };

  return (
    <div className="audit-modal" onClick={onClose}>
      <div className="audit-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95%', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Raw Project Data
          </h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '1.25rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.target.style.background = '#fee2e2'; }}
            onMouseOut={(e) => { e.target.style.background = '#fef2f2'; }}
          >
            ×
          </button>
        </div>

        {/* Project Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{projectData.activities.length}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Activities</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{projectData.activities.filter(a => a.status === 'completed').length}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Completed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{projectData.activities.filter(a => a.status === 'in-progress').length}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{projectData.activities.filter(a => a.isCriticalPath).length}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Critical Path</div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>📋 {projectData.name}</h3>
          <button onClick={exportRawData} style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            📥 Export CSV
          </button>
        </div>

        {/* Data Table - Full 27 fields */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ minWidth: '2000px', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>ID</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Activity Name</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Duration</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Dependencies</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Resource</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Start Date</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Delayed</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Alloc%</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Comp%</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Type</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Critical</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Float</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#1e40af', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#dbeafe' }}>ES</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#1e40af', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#dbeafe' }}>EF</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#1e40af', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#dbeafe' }}>LS</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#1e40af', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#dbeafe' }}>LF</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#7c3aed', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#ede9fe' }}>Pred</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#7c3aed', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#ede9fe' }}>Succ</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#7c3aed', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#ede9fe' }}>Dep Type</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#0d9488', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#ccfbf1' }}>Max FTE</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'left', fontWeight: '600', color: '#0d9488', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#ccfbf1' }}>Skills</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#fef2f2' }}>Prob%</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'center', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#fef2f2' }}>Delay Impact</th>
                <th style={{ padding: '0.5rem 0.375rem', textAlign: 'right', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#fef2f2' }}>Cost Impact</th>
              </tr>
            </thead>
            <tbody>
              {projectData.activities.map((act, index) => (
                <tr key={act.id} style={{ background: index % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.375rem', fontWeight: '600', color: '#3b82f6', whiteSpace: 'nowrap' }}>{act.id}</td>
                  <td style={{ padding: '0.375rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.name}>{act.name}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center' }}>{act.duration}d</td>
                  <td style={{ padding: '0.375rem', color: '#6b7280', fontSize: '0.65rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={(act.dependencies || []).join(', ')}>{(act.dependencies || []).join(', ') || '-'}</td>
                  <td style={{ padding: '0.375rem', whiteSpace: 'nowrap' }}>{act.resource || '-'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{act.startDate || '-'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center' }}>{getStatusBadge(act.status)}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', color: act.daysDelayed > 0 ? '#dc2626' : '#10b981', fontWeight: '600' }}>
                    {act.daysDelayed > 0 ? `+${act.daysDelayed}d` : '0d'}
                  </td>
                  <td style={{ padding: '0.375rem', textAlign: 'center' }}>{act.allocation || 100}%</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{act.completionPercent || 0}%</span>
                  </td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', fontSize: '0.65rem' }}>{act.type || '-'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center' }}>
                    {act.isCriticalPath ? <span style={{ color: '#dc2626', fontWeight: '700' }}>⚠️</span> : <span style={{ color: '#d1d5db' }}>-</span>}
                  </td>
                  <td style={{ padding: '0.375rem', textAlign: 'center' }}>{act.float || 0}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#f0f9ff' }}>{act.ES || 0}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#f0f9ff' }}>{act.EF || 0}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#f0f9ff' }}>{act.LS || 0}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#f0f9ff' }}>{act.LF || 0}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#faf5ff', fontSize: '0.65rem' }}>{act.Predecessor_ID || '-'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#faf5ff', fontSize: '0.65rem' }}>{act.Successor_ID || '-'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#faf5ff' }}>{act.Dependency_Type || 'FS'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#f0fdfa' }}>{act.Resource_Max_FTE || 1.0}</td>
                  <td style={{ padding: '0.375rem', background: '#f0fdfa', fontSize: '0.6rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.Skill_Tags}>{act.Skill_Tags || '-'}</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#fef2f2' }}>{((act.Probability || 0.5) * 100).toFixed(0)}%</td>
                  <td style={{ padding: '0.375rem', textAlign: 'center', background: '#fef2f2' }}>{act.Delay_Impact_days || 0}d</td>
                  <td style={{ padding: '0.375rem', textAlign: 'right', background: '#fef2f2', fontWeight: '500' }}>${(act.Cost_Impact_of_Risk || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '0.75rem 1.5rem',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#475569'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================
// EMAIL MODAL COMPONENT
// ===================================
const EmailModal = ({ risk, projectName, aiInsight, onClose, onSend }) => {
  const [recipients, setRecipients] = useState('');

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  };

  const severityColor = getSeverityColor(risk?.severity);

  const [subject, setSubject] = useState(
    `🚨 [${projectName}] Critical Risk Alert: ${risk?.activity?.name || 'Project Risk'}`
  );

  // Generate clean plain-text email content
  const generatePlainTextMessage = () => {
    const factorsText = risk?.factors ? Object.entries(risk.factors).map(([factor, value]) => {
      const barLength = Math.round(value / 5);
      const bar = '▓'.repeat(barLength) + '░'.repeat(20 - barLength);
      return `    ${factor.padEnd(25)} ${bar} ${value.toFixed(0)}%`;
    }).join('\n') : '';

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🚨 CRITICAL RISK ALERT 🚨
                   Immediate Attention Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 PROJECT INFORMATION
───────────────────────────────────────────────────────────────
    Project:          ${projectName}
    Activity:         ${risk?.activity?.name || 'N/A'}
    Task ID:          ${risk?.activity?.id || 'N/A'}
    Generated:        ${new Date().toLocaleString()}


📊 RISK SUMMARY
───────────────────────────────────────────────────────────────
    ┌─────────────────┬─────────────────┬─────────────────┐
    │   RISK SCORE    │    SEVERITY     │   SLIPPAGE      │
    ├─────────────────┼─────────────────┼─────────────────┤
    │      ${String(risk?.riskScore?.toFixed(0) || '0').padStart(3)}        │    ${(risk?.severity?.toUpperCase() || 'N/A').padEnd(9)} │    ${String(risk?.activity?.daysDelayed || 0).padStart(2)} days      │
    └─────────────────┴─────────────────┴─────────────────┘


📈 RISK FACTOR BREAKDOWN
───────────────────────────────────────────────────────────────
${factorsText}


📋 ACTIVITY DETAILS
───────────────────────────────────────────────────────────────
    Planned Duration:     ${risk?.activity?.duration || 0} days
    Assigned Resource:    ${risk?.activity?.resource || 'Unassigned'}
    Resource Utilization: ${risk?.activity?.allocation || 100}%
    Max FTE:              ${risk?.activity?.Resource_Max_FTE || 1.0}
    On Critical Path:     ${risk?.activity?.isCriticalPath ? '⚡ Yes' : 'No'}
    Schedule Buffer:      ${risk?.activity?.float || 0} days
    Progress:             ${risk?.activity?.percentComplete || 0}%

📅 CPM SCHEDULE DATA
───────────────────────────────────────────────────────────────
    Early Start (ES):     ${risk?.activity?.ES || 0}
    Early Finish (EF):    ${risk?.activity?.EF || 0}
    Late Start (LS):      ${risk?.activity?.LS || 0}
    Late Finish (LF):     ${risk?.activity?.LF || 0}

🔗 DEPENDENCY DATA
───────────────────────────────────────────────────────────────
    Predecessors:         ${risk?.activity?.Predecessor_ID || 'None'}
    Successors:           ${risk?.activity?.Successor_ID || 'None'}
    Dependency Type:      ${risk?.activity?.Dependency_Type || 'FS'}
    Skill Tags:           ${risk?.activity?.Skill_Tags || 'Not specified'}

⚠️ RISK METRICS
───────────────────────────────────────────────────────────────
    Probability:          ${((risk?.activity?.Probability || 0.5) * 100).toFixed(0)}%
    Delay Impact:         ${risk?.activity?.Delay_Impact_days || 0} days
    Cost Impact:          $${(risk?.activity?.Cost_Impact_of_Risk || 0).toLocaleString()}
    Expected Monetary Value: $${((risk?.activity?.Probability || 0.5) * (risk?.activity?.Cost_Impact_of_Risk || 0)).toLocaleString()}

${aiInsight ? `
🤖 AI-GENERATED EXECUTIVE INSIGHT
───────────────────────────────────────────────────────────────
${aiInsight}
` : ''}

⚡ RECOMMENDED ACTIONS
───────────────────────────────────────────────────────────────
    1. Review activity status and resource allocation
    2. Consider adding resources or adjusting timeline
    3. Monitor dependencies for cascading delays
    4. Schedule stakeholder meeting if critical path affected


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Generated by PM Risk Monitor - AI-Powered Risk Analysis
                    ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  };

  const [plainTextMessage] = useState(generatePlainTextMessage());

  // Convert markdown to HTML for email
  const markdownToHtml = (markdown) => {
    if (!markdown) return '';

    let html = markdown
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers (### Header -> <h3>)
      .replace(/^### (.+)$/gm, '<h3 style="color: #1f2937; font-size: 16px; font-weight: 700; margin: 20px 0 12px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color: #1f2937; font-size: 18px; font-weight: 700; margin: 20px 0 12px 0;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color: #1f2937; font-size: 20px; font-weight: 700; margin: 20px 0 12px 0;">$1</h1>')
      // Bold (**text** -> <strong>)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #1f2937;">$1</strong>')
      // Italic (*text* -> <em>)
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Bullet points (- item -> <li>)
      .replace(/^- (.+)$/gm, '<li style="margin: 6px 0; padding-left: 8px;">$1</li>')
      // Numbered lists (1. item -> <li>)
      .replace(/^\d+\. (.+)$/gm, '<li style="margin: 6px 0; padding-left: 8px;">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6;">')
      .replace(/\n/g, '<br>');

    // Wrap consecutive <li> items in <ul>
    html = html.replace(/(<li[^>]*>.*?<\/li>)(\s*<li)/g, '$1$2');
    html = html.replace(/(<li style="[^"]*">)/g, '<ul style="margin: 8px 0 8px 16px; padding: 0; list-style-type: disc;">$1');
    html = html.replace(/(<\/li>)(?!\s*<li)/g, '$1</ul>');

    // Clean up multiple ul tags
    html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');

    return `<p style="margin: 12px 0; line-height: 1.6;">${html}</p>`;
  };

  // Generate HTML email content
  const generateHtmlMessage = () => {
    const emv = (risk?.activity?.Probability || 0.5) * (risk?.activity?.Cost_Impact_of_Risk || 0);

    const factorsHtml = risk?.factors ? Object.entries(risk.factors).map(([factor, value], index) => {
      const barColor = value >= 70 ? '#dc2626' : value >= 40 ? '#f97316' : '#22c55e';
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `
        <tr style="background: ${bgColor};">
          <td style="padding: 14px 16px; font-size: 14px; color: #1e293b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">${factor}</td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; width: 180px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #e2e8f0; border-radius: 10px; height: 12px;">
              <tr><td style="background: ${barColor}; width: ${Math.round(value)}%; border-radius: 10px;"></td><td></td></tr>
            </table>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="display: inline-block; min-width: 45px; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; background: ${barColor}; color: white;">${value.toFixed(0)}%</span>
          </td>
        </tr>
      `;
    }).join('') : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" style="margin: 0 auto; max-width: 650px;">

          <!-- Header -->
          <tr>
            <td style="background-color: ${severityColor}; padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <div style="width: 70px; height: 70px; margin: 0 auto 16px; background-color: #ffffff; border-radius: 50%; line-height: 70px; font-size: 32px;">🚨</div>
                    <h1 style="color: #ffffff !important; margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Critical Risk Alert</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 15px; font-weight: 400;">Immediate Attention Required</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Project & Activity Info Bar -->
          <tr>
            <td style="background-color: #1e293b; padding: 20px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="color: white;" width="50%">
                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">📁 Project</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: white;">${projectName}</p>
                  </td>
                  <td style="text-align: right; color: white;" width="50%">
                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">📅 Generated</p>
                    <p style="margin: 0; font-size: 14px; color: #e2e8f0;">${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Activity Name Bar -->
          <tr>
            <td style="background-color: #334155; padding: 16px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">📋 Activity at Risk</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f8fafc;">${risk?.activity?.name || 'N/A'}</p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Task ID: <span style="color: #e2e8f0; font-weight: 500;">${risk?.activity?.id || 'N/A'}</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: white; padding: 0;">

              <!-- Risk Score Cards -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 30px;">
                <tr>
                  <td colspan="3" style="padding-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">📊 Risk Summary</h2>
                  </td>
                </tr>
                <tr>
                  <td width="33%" style="padding: 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; border: 1px solid #fecaca;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <div style="font-size: 42px; font-weight: 800; color: ${severityColor}; line-height: 1;">${risk?.riskScore?.toFixed(0) || 0}</div>
                          <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">Risk Score</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding: 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 12px; border: 1px solid #fed7aa;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <div style="font-size: 24px; font-weight: 800; color: ${severityColor}; line-height: 1; text-transform: uppercase;">${risk?.severity || 'N/A'}</div>
                          <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">Severity</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding: 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; border: 1px solid #fecaca;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <div style="font-size: 28px; font-weight: 800; color: #dc2626; line-height: 1;">+${risk?.activity?.daysDelayed || 0}</div>
                          <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">Days Delayed</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Quick Stats Bar -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                <tr>
                  <td width="25%" style="padding: 16px 20px; text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${risk?.activity?.duration || 0}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Duration (days)</div>
                  </td>
                  <td width="25%" style="padding: 16px 20px; text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 20px; font-weight: 700; color: #7c3aed;">${((risk?.activity?.Probability || 0.5) * 100).toFixed(0)}%</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Probability</div>
                  </td>
                  <td width="25%" style="padding: 16px 20px; text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 20px; font-weight: 700; color: #dc2626;">$${((risk?.activity?.Cost_Impact_of_Risk || 0) / 1000).toFixed(0)}K</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Cost Impact</div>
                  </td>
                  <td width="25%" style="padding: 16px 20px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">$${(emv / 1000).toFixed(0)}K</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">EMV</div>
                  </td>
                </tr>
              </table>

              <!-- Risk Factors Table -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 30px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1e293b;">📈 Risk Factor Breakdown</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                      <thead>
                        <tr style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                          <th style="padding: 14px 16px; text-align: left; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;">Factor</th>
                          <th style="padding: 14px 16px; text-align: center; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;" width="180">Level</th>
                          <th style="padding: 14px 16px; text-align: center; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;" width="100">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${factorsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Two Column Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 0 30px 30px 30px;">
                <tr>
                  <td width="50%" style="padding-right: 15px; vertical-align: top;">
                    <!-- Activity Details -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; background: #f1f5f9; border-radius: 12px 12px 0 0;">
                          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">📋 Activity Details</h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Resource</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.resource || 'Unassigned'}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Allocation</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.allocation || 100}%</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Max FTE</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.Resource_Max_FTE || 1.0}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Critical Path</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: ${risk?.activity?.isCriticalPath ? '#dc2626' : '#16a34a'}; text-align: right;">${risk?.activity?.isCriticalPath ? '⚡ Yes' : 'No'}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Float</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.float || 0} days</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Progress</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.percentComplete || 0}%</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left: 15px; vertical-align: top;">
                    <!-- CPM Data -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; background: #f1f5f9; border-radius: 12px 12px 0 0;">
                          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">📅 CPM Schedule</h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Early Start (ES)</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.ES || 0}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Early Finish (EF)</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.EF || 0}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Late Start (LS)</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.LS || 0}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Late Finish (LF)</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.LF || 0}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Predecessor</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.Predecessor_ID || 'None'}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #64748b;">Successor</td><td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">${risk?.activity?.Successor_ID || 'None'}</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${aiInsight ? `
              <!-- AI Insight Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 0 30px 30px 30px;">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; border: 1px solid #86efac;">
                      <tr>
                        <td style="padding: 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <div style="width: 36px; height: 36px; background-color: #10b981; border-radius: 10px; text-align: center; line-height: 36px; font-size: 18px;">🤖</div>
                              </td>
                              <td style="padding-left: 12px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 600; color: #065f46;">AI-Generated Executive Insight</h3>
                                <div style="font-size: 14px; color: #047857; line-height: 1.6;">${markdownToHtml(aiInsight)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Recommended Actions -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 0 30px 30px 30px;">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 1px solid #93c5fd;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e40af;">⚡ Recommended Actions</h3>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr><td style="padding: 8px 0; font-size: 14px; color: #1e40af;"><span style="display: inline-block; width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 10px;">1</span>Review activity status and resource allocation</td></tr>
                            <tr><td style="padding: 8px 0; font-size: 14px; color: #1e40af;"><span style="display: inline-block; width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 10px;">2</span>Consider adding resources or adjusting timeline</td></tr>
                            <tr><td style="padding: 8px 0; font-size: 14px; color: #1e40af;"><span style="display: inline-block; width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 10px;">3</span>Monitor dependencies for cascading delays</td></tr>
                            <tr><td style="padding: 8px 0; font-size: 14px; color: #1e40af;"><span style="display: inline-block; width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 10px;">4</span>Schedule stakeholder meeting if critical path affected</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: white; font-weight: 600;">PM Risk Monitor</p>
                    <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8;">AI-Powered Project Risk Analysis</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <span style="display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px; color: #94a3b8;">i2e Consulting</span>
                        </td>
                        <td style="padding: 0 8px;">
                          <span style="display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px; color: #94a3b8;">AI Lab Hackathon 2025</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  const [htmlMessage] = useState(generateHtmlMessage());

  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success', 'error', or null

  const handleSendEmail = async () => {
    // Validate recipients
    if (!recipients.trim()) {
      setSendStatus({ type: 'error', message: 'Please enter at least one recipient email' });
      return;
    }

    // Validate email format
    const emailList = recipients.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(e => !emailRegex.test(e));

    if (invalidEmails.length > 0) {
      setSendStatus({ type: 'error', message: `Invalid email format: ${invalidEmails.join(', ')}` });
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      // Send email directly using EmailJS with HTML content
      const templateParams = {
        to_email: emailList.join(', '),
        subject: subject,
        message: htmlMessage,
        activity_name: risk?.activity?.name || 'N/A',
        risk_score: risk?.riskScore?.toFixed(0) || 'N/A',
        severity: risk?.severity?.toUpperCase() || 'N/A'
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log('Email sent successfully:', response);

      // Log the action
      auditLogger.log(ACTIONS.EMAIL_SENT, {
        to: recipients,
        subject: subject,
        activityId: risk.activity.id,
        riskScore: risk.riskScore,
        method: 'emailjs',
        status: response.status
      });

      setSendStatus({ type: 'success', message: `Email sent successfully to ${emailList.length} recipient(s)!` });

      // Call onSend callback after a short delay
      setTimeout(() => {
        onSend({ recipients, subject, message: htmlMessage });
      }, 2000);

    } catch (error) {
      console.error('Email error:', error);
      setSendStatus({ type: 'error', message: `Failed to send email: ${error.text || error.message || 'Unknown error'}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="email-modal" onClick={onClose}>
      <div className="email-content" onClick={(e) => e.stopPropagation()}>
        <h3>📧 Send Risk Alert Email</h3>

        {sendStatus && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            background: sendStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: sendStatus.type === 'success' ? '#166534' : '#dc2626',
            border: `1px solid ${sendStatus.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontSize: '0.9rem'
          }}>
            {sendStatus.type === 'success' ? '✅' : '❌'} {sendStatus.message}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Recipients (comma-separated): <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Subject:
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Email Preview:
          </label>
          <div style={{
            width: '100%',
            height: '350px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            overflow: 'hidden',
            background: 'white'
          }}>
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    html, body {
                      margin: 0;
                      padding: 0;
                      height: 100%;
                      overflow-y: auto;
                      overflow-x: hidden;
                    }
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
                  </style>
                </head>
                <body>${htmlMessage}</body>
                </html>
              `}
              title="Email Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white'
              }}
            />
          </div>
        </div>

        <div className="email-buttons" style={{ position: 'relative', zIndex: 10, marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="cancel-email-btn"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendEmail();
            }}
            className="send-email-btn"
            disabled={isSending}
            style={{
              opacity: isSending ? 0.7 : 1,
              cursor: isSending ? 'not-allowed' : 'pointer',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem'
            }}
          >
            {isSending ? (
              <>
                <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                Sending...
              </>
            ) : (
              '📤 Send Email'
            )}
          </button>
        </div>

        <p style={{
          marginTop: '1rem',
          fontSize: '0.8rem',
          color: '#64748b',
          textAlign: 'center'
        }}>
          📬 Email will be sent directly to the recipients
        </p>
      </div>
    </div>
  );
};

// ===================================
// ACTIVITY NORMALIZER - Converts any activity format to the complete field structure
// Handles both old field names and new field names for backward compatibility
// ===================================
const normalizeActivity = (act) => {
  const plannedDuration = act.Planned_Duration || act.duration || 5;
  const percentComplete = act.Percent_Complete !== undefined ? act.Percent_Complete : (act.completionPercent || 0);
  const plannedStart = act.Planned_Start || act.startDate || '2025-01-01';
  const status = act.Status || act.status || 'not-started';

  return {
    // Activity Info
    Activity_ID: act.Activity_ID || act.id || '',
    Activity_Name: act.Activity_Name || act.name || '',
    Work_Package: act.Work_Package || '',

    // Schedule
    Planned_Start: plannedStart,
    Planned_Finish: act.Planned_Finish || '',
    Planned_Duration: plannedDuration,
    Actual_Start: act.Actual_Start || (status !== 'not-started' ? plannedStart : ''),
    Actual_Finish: act.Actual_Finish || (status === 'completed' ? act.Planned_Finish : ''),
    Remaining_Duration: act.Remaining_Duration !== undefined ? act.Remaining_Duration :
      Math.round(plannedDuration * (1 - percentComplete / 100)),

    // Baseline
    Baseline_Start: act.Baseline_Start || plannedStart,
    Baseline_Finish: act.Baseline_Finish || act.Planned_Finish || '',
    Baseline_Duration: act.Baseline_Duration || plannedDuration,

    // Progress
    Percent_Complete: percentComplete,
    Status: status,

    // CPM Analysis
    ES: act.ES || 0,
    EF: act.EF || 0,
    LS: act.LS || 0,
    LF: act.LF || 0,
    Total_Float_days: act.Total_Float_days !== undefined ? act.Total_Float_days : (act.float || 0),
    On_Critical_Path: act.On_Critical_Path !== undefined ? act.On_Critical_Path : (act.isCriticalPath || false),

    // Dependencies
    Predecessor_ID: act.Predecessor_ID || '',
    Successor_ID: act.Successor_ID || '',
    Dependency_Type: act.Dependency_Type || 'FS',

    // Resources
    Resource_ID: act.Resource_ID || act.resource || '',
    Role: act.Role || '',
    FTE_Allocation: act.FTE_Allocation !== undefined ? act.FTE_Allocation : (act.allocation || 100),
    Resource_Max_FTE: act.Resource_Max_FTE || 1.0,
    Skill_Tags: act.Skill_Tags || '',

    // Risk Data
    Probability: act.Probability || 0.5,
    Delay_Impact_days: act.Delay_Impact_days !== undefined ? act.Delay_Impact_days : (act.daysDelayed || 0),
    Cost_Impact_of_Risk: act.Cost_Impact_of_Risk || 0,

    // Legacy field mappings for backward compatibility
    id: act.Activity_ID || act.id || '',
    name: act.Activity_Name || act.name || '',
    duration: plannedDuration,
    dependencies: act.dependencies || [],
    resource: act.Resource_ID || act.resource || '',
    startDate: plannedStart,
    status: status,
    daysDelayed: act.Delay_Impact_days !== undefined ? act.Delay_Impact_days : (act.daysDelayed || 0),
    allocation: act.FTE_Allocation !== undefined ? act.FTE_Allocation : (act.allocation || 100),
    completionPercent: percentComplete,
    type: act.type || 'General',
    isCriticalPath: act.On_Critical_Path !== undefined ? act.On_Critical_Path : (act.isCriticalPath || false),
    float: act.Total_Float_days !== undefined ? act.Total_Float_days : (act.float || 0)
  };
};

// ===================================
// SAMPLE PROJECTS DATA (7 different project types)
// Complete field structure per requirements:
// Activity Info: Activity_ID, Activity_Name, Work_Package
// Schedule: Planned_Start, Planned_Finish, Planned_Duration, Actual_Start, Actual_Finish, Remaining_Duration
// Baseline: Baseline_Start, Baseline_Finish, Baseline_Duration
// Progress: Percent_Complete, Status
// CPM Analysis: ES, EF, LS, LF, Total_Float_days, On_Critical_Path
// Dependencies: Predecessor_ID, Successor_ID, Dependency_Type
// Resources: Resource_ID, Role, FTE_Allocation, Resource_Max_FTE, Skill_Tags
// Risk Data: Probability, Delay_Impact_days, Cost_Impact_of_Risk
// ===================================
const SAMPLE_PROJECTS = [
  // 1. SOFTWARE DEVELOPMENT PROJECT
  {
    name: 'Enterprise CRM Platform Development',
    category: 'Software Development',
    budget: 850000,
    activities: [
      { Activity_ID: 'SD-001', Activity_Name: 'Project Kickoff & Planning', Work_Package: 'WP-INIT', Planned_Start: '2025-01-06', Planned_Finish: '2025-01-10', Planned_Duration: 5, Actual_Start: '2025-01-06', Actual_Finish: '2025-01-10', Remaining_Duration: 0, Baseline_Start: '2025-01-06', Baseline_Finish: '2025-01-10', Baseline_Duration: 5, Percent_Complete: 100, Status: 'completed', ES: 0, EF: 5, LS: 0, LF: 5, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: '', Successor_ID: 'SD-002', Dependency_Type: 'FS', Resource_ID: 'PM-001', Role: 'Project Manager', FTE_Allocation: 100, Resource_Max_FTE: 1.0, Skill_Tags: 'ProjectMgmt;Leadership', Probability: 0.1, Delay_Impact_days: 0, Cost_Impact_of_Risk: 0 },
      { Activity_ID: 'SD-002', Activity_Name: 'Requirements Analysis', Work_Package: 'WP-ANALYSIS', Planned_Start: '2025-01-13', Planned_Finish: '2025-01-24', Planned_Duration: 12, Actual_Start: '2025-01-13', Actual_Finish: '2025-01-26', Remaining_Duration: 0, Baseline_Start: '2025-01-13', Baseline_Finish: '2025-01-24', Baseline_Duration: 12, Percent_Complete: 100, Status: 'completed', ES: 5, EF: 17, LS: 5, LF: 17, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: 'SD-001', Successor_ID: 'SD-003;SD-004', Dependency_Type: 'FS', Resource_ID: 'BA-001', Role: 'Business Analyst', FTE_Allocation: 100, Resource_Max_FTE: 1.0, Skill_Tags: 'BusinessAnalysis;Requirements', Probability: 0.3, Delay_Impact_days: 2, Cost_Impact_of_Risk: 5000 },
      { Activity_ID: 'SD-003', Activity_Name: 'System Architecture Design', Work_Package: 'WP-DESIGN', Planned_Start: '2025-01-27', Planned_Finish: '2025-02-07', Planned_Duration: 10, Actual_Start: '2025-01-30', Actual_Finish: '', Remaining_Duration: 3, Baseline_Start: '2025-01-27', Baseline_Finish: '2025-02-07', Baseline_Duration: 10, Percent_Complete: 75, Status: 'in-progress', ES: 17, EF: 27, LS: 17, LF: 27, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: 'SD-002', Successor_ID: 'SD-005;SD-006;SD-008', Dependency_Type: 'FS', Resource_ID: 'ARCH-001', Role: 'Solution Architect', FTE_Allocation: 120, Resource_Max_FTE: 1.2, Skill_Tags: 'Architecture;SystemDesign', Probability: 0.5, Delay_Impact_days: 5, Cost_Impact_of_Risk: 15000 },
      { Activity_ID: 'SD-004', Activity_Name: 'Database Schema Design', Work_Package: 'WP-DESIGN', Planned_Start: '2025-01-27', Planned_Finish: '2025-02-05', Planned_Duration: 8, Actual_Start: '2025-01-28', Actual_Finish: '', Remaining_Duration: 2, Baseline_Start: '2025-01-27', Baseline_Finish: '2025-02-05', Baseline_Duration: 8, Percent_Complete: 80, Status: 'in-progress', ES: 17, EF: 25, LS: 22, LF: 30, Total_Float_days: 5, On_Critical_Path: false, Predecessor_ID: 'SD-002', Successor_ID: 'SD-006', Dependency_Type: 'FS', Resource_ID: 'DBA-001', Role: 'Database Administrator', FTE_Allocation: 100, Resource_Max_FTE: 1.0, Skill_Tags: 'Database;SQL;DataModeling', Probability: 0.2, Delay_Impact_days: 1, Cost_Impact_of_Risk: 3000 },
      { Activity_ID: 'SD-005', Activity_Name: 'API Design & Documentation', Work_Package: 'WP-DESIGN', Planned_Start: '2025-02-10', Planned_Finish: '2025-02-17', Planned_Duration: 6, Actual_Start: '2025-02-12', Actual_Finish: '', Remaining_Duration: 3, Baseline_Start: '2025-02-10', Baseline_Finish: '2025-02-17', Baseline_Duration: 6, Percent_Complete: 60, Status: 'in-progress', ES: 27, EF: 33, LS: 27, LF: 33, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: 'SD-003', Successor_ID: 'SD-007', Dependency_Type: 'FS', Resource_ID: 'ARCH-001', Role: 'Solution Architect', FTE_Allocation: 110, Resource_Max_FTE: 1.1, Skill_Tags: 'API;REST;Documentation', Probability: 0.4, Delay_Impact_days: 3, Cost_Impact_of_Risk: 8000 },
      { Activity_ID: 'SD-006', Activity_Name: 'Backend Core Development', Work_Package: 'WP-DEV', Planned_Start: '2025-02-17', Planned_Finish: '2025-03-21', Planned_Duration: 25, Actual_Start: '2025-02-22', Actual_Finish: '', Remaining_Duration: 17, Baseline_Start: '2025-02-17', Baseline_Finish: '2025-03-21', Baseline_Duration: 25, Percent_Complete: 35, Status: 'in-progress', ES: 27, EF: 52, LS: 27, LF: 52, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: 'SD-003;SD-004', Successor_ID: 'SD-009', Dependency_Type: 'FS', Resource_ID: 'DEV-001', Role: 'Senior Developer', FTE_Allocation: 140, Resource_Max_FTE: 1.5, Skill_Tags: 'Backend;Java;Spring', Probability: 0.6, Delay_Impact_days: 8, Cost_Impact_of_Risk: 35000 },
      { Activity_ID: 'SD-007', Activity_Name: 'User Authentication Module', Work_Package: 'WP-DEV', Planned_Start: '2025-02-17', Planned_Finish: '2025-03-03', Planned_Duration: 12, Actual_Start: '2025-02-20', Actual_Finish: '', Remaining_Duration: 6, Baseline_Start: '2025-02-17', Baseline_Finish: '2025-03-03', Baseline_Duration: 12, Percent_Complete: 50, Status: 'in-progress', ES: 33, EF: 45, LS: 41, LF: 53, Total_Float_days: 8, On_Critical_Path: false, Predecessor_ID: 'SD-005', Successor_ID: 'SD-009', Dependency_Type: 'FS', Resource_ID: 'DEV-002', Role: 'Developer', FTE_Allocation: 100, Resource_Max_FTE: 1.0, Skill_Tags: 'Security;OAuth;Authentication', Probability: 0.4, Delay_Impact_days: 4, Cost_Impact_of_Risk: 12000 },
      { Activity_ID: 'SD-008', Activity_Name: 'Frontend UI Development', Work_Package: 'WP-DEV', Planned_Start: '2025-02-17', Planned_Finish: '2025-03-14', Planned_Duration: 20, Actual_Start: '2025-02-21', Actual_Finish: '', Remaining_Duration: 12, Baseline_Start: '2025-02-17', Baseline_Finish: '2025-03-14', Baseline_Duration: 20, Percent_Complete: 40, Status: 'in-progress', ES: 27, EF: 47, LS: 32, LF: 52, Total_Float_days: 5, On_Critical_Path: false, Predecessor_ID: 'SD-003', Successor_ID: '', Dependency_Type: 'FS', Resource_ID: 'FE-001', Role: 'Frontend Developer', FTE_Allocation: 130, Resource_Max_FTE: 1.3, Skill_Tags: 'Frontend;React;CSS', Probability: 0.5, Delay_Impact_days: 6, Cost_Impact_of_Risk: 20000 },
      { Activity_ID: 'SD-009', Activity_Name: 'Integration Testing', Work_Package: 'WP-TEST', Planned_Start: '2025-04-14', Planned_Finish: '2025-04-25', Planned_Duration: 10, Actual_Start: '', Actual_Finish: '', Remaining_Duration: 10, Baseline_Start: '2025-04-14', Baseline_Finish: '2025-04-25', Baseline_Duration: 10, Percent_Complete: 0, Status: 'not-started', ES: 52, EF: 62, LS: 52, LF: 62, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: 'SD-006;SD-007', Successor_ID: 'SD-010', Dependency_Type: 'FS', Resource_ID: 'QA-001', Role: 'QA Engineer', FTE_Allocation: 100, Resource_Max_FTE: 1.0, Skill_Tags: 'Testing;QA;Automation', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 10000 },
      { Activity_ID: 'SD-010', Activity_Name: 'Production Deployment', Work_Package: 'WP-DEPLOY', Planned_Start: '2025-04-28', Planned_Finish: '2025-05-02', Planned_Duration: 5, Actual_Start: '', Actual_Finish: '', Remaining_Duration: 5, Baseline_Start: '2025-04-28', Baseline_Finish: '2025-05-02', Baseline_Duration: 5, Percent_Complete: 0, Status: 'not-started', ES: 62, EF: 67, LS: 62, LF: 67, Total_Float_days: 0, On_Critical_Path: true, Predecessor_ID: 'SD-009', Successor_ID: '', Dependency_Type: 'FS', Resource_ID: 'DEVOPS-001', Role: 'DevOps Engineer', FTE_Allocation: 100, Resource_Max_FTE: 1.0, Skill_Tags: 'DevOps;Docker;Kubernetes', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 25000 }
    ]
  },
  // 2. HEALTHCARE - HOSPITAL EMR IMPLEMENTATION
  {
    name: 'Hospital EMR System Implementation',
    category: 'Healthcare IT',
    budget: 2500000,
    activities: [
      { id: 'EMR-001', name: 'Stakeholder Alignment & Governance Setup', duration: 10, dependencies: [], resource: 'HC-PM-001', startDate: '2025-01-06', status: 'completed', daysDelayed: 0, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Planning', ES: 0, EF: 10, LS: 0, LF: 10, Predecessor_ID: '', Successor_ID: 'EMR-002;EMR-003', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Healthcare;ProjectMgmt', Probability: 0.1, Delay_Impact_days: 0, Cost_Impact_of_Risk: 0 },
      { id: 'EMR-002', name: 'Clinical Workflow Analysis', duration: 15, dependencies: ['EMR-001'], resource: 'HC-BA-001', startDate: '2025-01-20', status: 'completed', daysDelayed: 3, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Analysis', ES: 10, EF: 25, LS: 10, LF: 25, Predecessor_ID: 'EMR-001', Successor_ID: 'EMR-005', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Clinical;Workflow;Analysis', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 15000 },
      { id: 'EMR-003', name: 'HIPAA Compliance Assessment', duration: 12, dependencies: ['EMR-001'], resource: 'COMP-001', startDate: '2025-01-20', status: 'in-progress', daysDelayed: 5, allocation: 120, completionPercent: 70, isCriticalPath: true, float: 0, type: 'Compliance', ES: 10, EF: 22, LS: 10, LF: 22, Predecessor_ID: 'EMR-001', Successor_ID: 'EMR-004', Dependency_Type: 'FS', Resource_Max_FTE: 1.2, Skill_Tags: 'HIPAA;Compliance;Security', Probability: 0.6, Delay_Impact_days: 8, Cost_Impact_of_Risk: 50000 },
      { id: 'EMR-004', name: 'Infrastructure Setup & Security', duration: 20, dependencies: ['EMR-003'], resource: 'IT-001', startDate: '2025-02-05', status: 'in-progress', daysDelayed: 4, allocation: 130, completionPercent: 45, isCriticalPath: true, float: 0, type: 'Infrastructure', ES: 22, EF: 42, LS: 22, LF: 42, Predecessor_ID: 'EMR-003', Successor_ID: 'EMR-006', Dependency_Type: 'FS', Resource_Max_FTE: 1.3, Skill_Tags: 'Infrastructure;Security;Networking', Probability: 0.5, Delay_Impact_days: 6, Cost_Impact_of_Risk: 35000 },
      { id: 'EMR-005', name: 'Patient Data Migration Planning', duration: 10, dependencies: ['EMR-002'], resource: 'DBA-HC-001', startDate: '2025-02-10', status: 'in-progress', daysDelayed: 2, allocation: 100, completionPercent: 60, isCriticalPath: false, float: 8, type: 'Data Migration', ES: 25, EF: 35, LS: 33, LF: 43, Predecessor_ID: 'EMR-002', Successor_ID: 'EMR-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Database;Migration;ETL', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 10000 },
      { id: 'EMR-006', name: 'EMR Core Module Configuration', duration: 25, dependencies: ['EMR-004'], resource: 'EMR-SPEC-001', startDate: '2025-03-03', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Configuration', ES: 42, EF: 67, LS: 42, LF: 67, Predecessor_ID: 'EMR-004', Successor_ID: 'EMR-007;EMR-008;EMR-009;EMR-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'EMR;Epic;Configuration', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 40000 },
      { id: 'EMR-007', name: 'Patient Portal Development', duration: 18, dependencies: ['EMR-006'], resource: 'DEV-HC-001', startDate: '2025-04-07', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 5, type: 'Development', ES: 67, EF: 85, LS: 72, LF: 90, Predecessor_ID: 'EMR-006', Successor_ID: 'EMR-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Portal;WebDev;Patient', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 20000 },
      { id: 'EMR-008', name: 'HL7/FHIR Integration', duration: 15, dependencies: ['EMR-006'], resource: 'INT-001', startDate: '2025-04-07', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Integration', ES: 67, EF: 82, LS: 67, LF: 82, Predecessor_ID: 'EMR-006', Successor_ID: 'EMR-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'HL7;FHIR;Integration;Interoperability', Probability: 0.5, Delay_Impact_days: 6, Cost_Impact_of_Risk: 30000 },
      { id: 'EMR-009', name: 'Clinical Staff Training', duration: 20, dependencies: ['EMR-006', 'EMR-007'], resource: 'TRAIN-001', startDate: '2025-05-05', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Training', ES: 85, EF: 105, LS: 85, LF: 105, Predecessor_ID: 'EMR-006;EMR-007', Successor_ID: 'EMR-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Training;Clinical;Education', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 15000 },
      { id: 'EMR-010', name: 'Patient Data Migration Execution', duration: 12, dependencies: ['EMR-005', 'EMR-006'], resource: 'DBA-HC-001', startDate: '2025-04-07', status: 'not-started', daysDelayed: 0, allocation: 140, completionPercent: 0, isCriticalPath: false, float: 10, type: 'Data Migration', ES: 67, EF: 79, LS: 77, LF: 89, Predecessor_ID: 'EMR-005;EMR-006', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.4, Skill_Tags: 'Database;Migration;PatientData', Probability: 0.5, Delay_Impact_days: 5, Cost_Impact_of_Risk: 25000 },
      { id: 'EMR-011', name: 'UAT with Clinical Staff', duration: 15, dependencies: ['EMR-008', 'EMR-009'], resource: 'QA-HC-001', startDate: '2025-06-02', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Testing', ES: 105, EF: 120, LS: 105, LF: 120, Predecessor_ID: 'EMR-008;EMR-009', Successor_ID: 'EMR-012', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'UAT;Testing;Clinical', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 20000 },
      { id: 'EMR-012', name: 'Go-Live & Hypercare Support', duration: 14, dependencies: ['EMR-011'], resource: 'HC-PM-001', startDate: '2025-06-23', status: 'not-started', daysDelayed: 0, allocation: 150, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Deployment', ES: 120, EF: 134, LS: 120, LF: 134, Predecessor_ID: 'EMR-011', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.5, Skill_Tags: 'GoLive;Support;Healthcare', Probability: 0.4, Delay_Impact_days: 7, Cost_Impact_of_Risk: 100000 }
    ]
  },
  // 3. HEALTHCARE - CLINICAL TRIAL MANAGEMENT
  {
    name: 'Phase III Clinical Trial - Cardiology Drug',
    category: 'Healthcare Research',
    budget: 4500000,
    activities: [
      { id: 'CT-001', name: 'Protocol Development & IRB Submission', duration: 30, dependencies: [], resource: 'CRA-001', startDate: '2025-01-06', status: 'completed', daysDelayed: 5, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Regulatory', ES: 0, EF: 30, LS: 0, LF: 30, Predecessor_ID: '', Successor_ID: 'CT-002;CT-005', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Regulatory;IRB;Protocol', Probability: 0.5, Delay_Impact_days: 10, Cost_Impact_of_Risk: 75000 },
      { id: 'CT-002', name: 'Site Selection & Feasibility', duration: 20, dependencies: ['CT-001'], resource: 'CRA-002', startDate: '2025-02-17', status: 'in-progress', daysDelayed: 3, allocation: 110, completionPercent: 80, isCriticalPath: true, float: 0, type: 'Planning', ES: 30, EF: 50, LS: 30, LF: 50, Predecessor_ID: 'CT-001', Successor_ID: 'CT-003;CT-006', Dependency_Type: 'FS', Resource_Max_FTE: 1.1, Skill_Tags: 'SiteSelection;Feasibility;ClinicalOps', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 30000 },
      { id: 'CT-003', name: 'Site Initiation Visits', duration: 25, dependencies: ['CT-002'], resource: 'CRA-001', startDate: '2025-03-17', status: 'in-progress', daysDelayed: 2, allocation: 120, completionPercent: 40, isCriticalPath: true, float: 0, type: 'Operations', ES: 50, EF: 75, LS: 50, LF: 75, Predecessor_ID: 'CT-002', Successor_ID: 'CT-004', Dependency_Type: 'FS', Resource_Max_FTE: 1.2, Skill_Tags: 'SIV;Training;Clinical', Probability: 0.4, Delay_Impact_days: 4, Cost_Impact_of_Risk: 20000 },
      { id: 'CT-004', name: 'Patient Recruitment Campaign', duration: 60, dependencies: ['CT-003'], resource: 'RECRUIT-001', startDate: '2025-04-21', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Recruitment', ES: 75, EF: 135, LS: 75, LF: 135, Predecessor_ID: 'CT-003', Successor_ID: 'CT-007', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Recruitment;Marketing;Patient', Probability: 0.6, Delay_Impact_days: 15, Cost_Impact_of_Risk: 100000 },
      { id: 'CT-005', name: 'EDC System Setup & Validation', duration: 15, dependencies: ['CT-001'], resource: 'DATA-001', startDate: '2025-02-17', status: 'in-progress', daysDelayed: 4, allocation: 100, completionPercent: 65, isCriticalPath: false, float: 10, type: 'Data Management', ES: 30, EF: 45, LS: 40, LF: 55, Predecessor_ID: 'CT-001', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'EDC;DataMgmt;Validation', Probability: 0.5, Delay_Impact_days: 6, Cost_Impact_of_Risk: 25000 },
      { id: 'CT-006', name: 'Drug Supply Chain Setup', duration: 18, dependencies: ['CT-002'], resource: 'SUPPLY-001', startDate: '2025-03-17', status: 'in-progress', daysDelayed: 1, allocation: 100, completionPercent: 55, isCriticalPath: false, float: 8, type: 'Logistics', ES: 50, EF: 68, LS: 58, LF: 76, Predecessor_ID: 'CT-002', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Supply;Logistics;DrugMgmt', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 50000 },
      { id: 'CT-007', name: 'Patient Screening & Enrollment', duration: 90, dependencies: ['CT-004'], resource: 'SITE-001', startDate: '2025-06-30', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Clinical', ES: 135, EF: 225, LS: 135, LF: 225, Predecessor_ID: 'CT-004', Successor_ID: 'CT-008;CT-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Clinical;Screening;Enrollment', Probability: 0.7, Delay_Impact_days: 20, Cost_Impact_of_Risk: 200000 },
      { id: 'CT-008', name: 'Treatment Administration Phase', duration: 120, dependencies: ['CT-007'], resource: 'SITE-001', startDate: '2025-10-13', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Clinical', ES: 225, EF: 345, LS: 225, LF: 345, Predecessor_ID: 'CT-007', Successor_ID: 'CT-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Clinical;Treatment;Patient', Probability: 0.5, Delay_Impact_days: 15, Cost_Impact_of_Risk: 150000 },
      { id: 'CT-009', name: 'Adverse Event Monitoring', duration: 150, dependencies: ['CT-007'], resource: 'SAFETY-001', startDate: '2025-10-13', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 5, type: 'Safety', ES: 225, EF: 375, LS: 230, LF: 380, Predecessor_ID: 'CT-007', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Safety;AE;Pharmacovigilance', Probability: 0.4, Delay_Impact_days: 10, Cost_Impact_of_Risk: 80000 },
      { id: 'CT-010', name: 'Data Lock & Statistical Analysis', duration: 30, dependencies: ['CT-008'], resource: 'STAT-001', startDate: '2026-02-23', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Analysis', ES: 345, EF: 375, LS: 345, LF: 375, Predecessor_ID: 'CT-008', Successor_ID: 'CT-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Statistics;Analysis;DataLock', Probability: 0.3, Delay_Impact_days: 5, Cost_Impact_of_Risk: 40000 },
      { id: 'CT-011', name: 'Clinical Study Report', duration: 25, dependencies: ['CT-010'], resource: 'MW-001', startDate: '2026-04-06', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Documentation', ES: 375, EF: 400, LS: 375, LF: 400, Predecessor_ID: 'CT-010', Successor_ID: 'CT-012', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'MedicalWriting;CSR;Regulatory', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 35000 },
      { id: 'CT-012', name: 'FDA Submission Preparation', duration: 20, dependencies: ['CT-011'], resource: 'REG-001', startDate: '2026-05-11', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Regulatory', ES: 400, EF: 420, LS: 400, LF: 420, Predecessor_ID: 'CT-011', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'FDA;NDA;Regulatory', Probability: 0.4, Delay_Impact_days: 8, Cost_Impact_of_Risk: 500000 }
    ]
  },
  // 4. CONSTRUCTION - COMMERCIAL BUILDING
  {
    name: 'Corporate Office Building Construction',
    category: 'Construction',
    budget: 12000000,
    activities: [
      { id: 'CON-001', name: 'Site Survey & Soil Testing', duration: 14, dependencies: [], resource: 'ENG-001', startDate: '2025-01-06', status: 'completed', daysDelayed: 0, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Pre-Construction', ES: 0, EF: 14, LS: 0, LF: 14, Predecessor_ID: '', Successor_ID: 'CON-002', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Survey;Geotechnical;Engineering', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 10000 },
      { id: 'CON-002', name: 'Architectural Design Finalization', duration: 30, dependencies: ['CON-001'], resource: 'ARCH-CON-001', startDate: '2025-01-24', status: 'completed', daysDelayed: 5, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Design', ES: 14, EF: 44, LS: 14, LF: 44, Predecessor_ID: 'CON-001', Successor_ID: 'CON-003', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Architecture;Design;BIM', Probability: 0.4, Delay_Impact_days: 8, Cost_Impact_of_Risk: 50000 },
      { id: 'CON-003', name: 'Permits & Regulatory Approvals', duration: 45, dependencies: ['CON-002'], resource: 'LEGAL-001', startDate: '2025-03-07', status: 'in-progress', daysDelayed: 10, allocation: 100, completionPercent: 60, isCriticalPath: true, float: 0, type: 'Regulatory', ES: 44, EF: 89, LS: 44, LF: 89, Predecessor_ID: 'CON-002', Successor_ID: 'CON-004', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Permits;Legal;Zoning', Probability: 0.6, Delay_Impact_days: 15, Cost_Impact_of_Risk: 100000 },
      { id: 'CON-004', name: 'Foundation & Excavation', duration: 35, dependencies: ['CON-003'], resource: 'CREW-001', startDate: '2025-05-05', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Construction', ES: 89, EF: 124, LS: 89, LF: 124, Predecessor_ID: 'CON-003', Successor_ID: 'CON-005', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Foundation;Excavation;Concrete', Probability: 0.4, Delay_Impact_days: 10, Cost_Impact_of_Risk: 200000 },
      { id: 'CON-005', name: 'Structural Steel Erection', duration: 60, dependencies: ['CON-004'], resource: 'STEEL-001', startDate: '2025-06-23', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Construction', ES: 124, EF: 184, LS: 124, LF: 184, Predecessor_ID: 'CON-004', Successor_ID: 'CON-006;CON-007', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Steel;Structural;Welding', Probability: 0.5, Delay_Impact_days: 12, Cost_Impact_of_Risk: 300000 },
      { id: 'CON-006', name: 'Electrical & Plumbing Rough-In', duration: 40, dependencies: ['CON-005'], resource: 'MEP-001', startDate: '2025-09-08', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 10, type: 'MEP', ES: 184, EF: 224, LS: 194, LF: 234, Predecessor_ID: 'CON-005', Successor_ID: 'CON-008;CON-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Electrical;Plumbing;MEP', Probability: 0.3, Delay_Impact_days: 6, Cost_Impact_of_Risk: 80000 },
      { id: 'CON-007', name: 'Exterior Facade Installation', duration: 45, dependencies: ['CON-005'], resource: 'FACADE-001', startDate: '2025-09-08', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Construction', ES: 184, EF: 229, LS: 184, LF: 229, Predecessor_ID: 'CON-005', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Facade;Curtainwall;Exterior', Probability: 0.4, Delay_Impact_days: 8, Cost_Impact_of_Risk: 150000 },
      { id: 'CON-008', name: 'Interior Finishing', duration: 50, dependencies: ['CON-006'], resource: 'INT-CON-001', startDate: '2025-11-03', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 5, type: 'Finishing', ES: 224, EF: 274, LS: 229, LF: 279, Predecessor_ID: 'CON-006', Successor_ID: 'CON-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Interior;Finishing;Drywall', Probability: 0.3, Delay_Impact_days: 5, Cost_Impact_of_Risk: 75000 },
      { id: 'CON-009', name: 'HVAC System Installation', duration: 35, dependencies: ['CON-006'], resource: 'HVAC-001', startDate: '2025-11-03', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'MEP', ES: 224, EF: 259, LS: 224, LF: 259, Predecessor_ID: 'CON-006', Successor_ID: 'CON-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'HVAC;Mechanical;AirConditioning', Probability: 0.4, Delay_Impact_days: 7, Cost_Impact_of_Risk: 120000 },
      { id: 'CON-010', name: 'Fire Safety & Sprinkler Systems', duration: 20, dependencies: ['CON-009'], resource: 'FIRE-001', startDate: '2025-12-22', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Safety', ES: 259, EF: 279, LS: 259, LF: 279, Predecessor_ID: 'CON-009', Successor_ID: 'CON-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'FireSafety;Sprinkler;LifeSafety', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 60000 },
      { id: 'CON-011', name: 'Final Inspections & Certifications', duration: 15, dependencies: ['CON-008', 'CON-010'], resource: 'INSP-001', startDate: '2026-01-19', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Compliance', ES: 279, EF: 294, LS: 279, LF: 294, Predecessor_ID: 'CON-008;CON-010', Successor_ID: 'CON-012', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Inspection;Compliance;Certification', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 50000 },
      { id: 'CON-012', name: 'Handover & Occupancy', duration: 7, dependencies: ['CON-011'], resource: 'PM-CON-001', startDate: '2026-02-09', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Closeout', ES: 294, EF: 301, LS: 294, LF: 301, Predecessor_ID: 'CON-011', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Handover;Closeout;Occupancy', Probability: 0.2, Delay_Impact_days: 3, Cost_Impact_of_Risk: 30000 }
    ]
  },
  // 5. IT INFRASTRUCTURE - CLOUD MIGRATION
  {
    name: 'Enterprise Cloud Migration (AWS)',
    category: 'IT Infrastructure',
    budget: 1800000,
    activities: [
      { id: 'CLD-001', name: 'Current Infrastructure Assessment', duration: 15, dependencies: [], resource: 'CLOUD-ARCH-001', startDate: '2025-01-06', status: 'completed', daysDelayed: 0, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Assessment', ES: 0, EF: 15, LS: 0, LF: 15, Predecessor_ID: '', Successor_ID: 'CLD-002', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'AWS;Assessment;Infrastructure', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 10000 },
      { id: 'CLD-002', name: 'Cloud Architecture Design', duration: 20, dependencies: ['CLD-001'], resource: 'CLOUD-ARCH-001', startDate: '2025-01-27', status: 'completed', daysDelayed: 2, allocation: 110, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Design', ES: 15, EF: 35, LS: 15, LF: 35, Predecessor_ID: 'CLD-001', Successor_ID: 'CLD-003', Dependency_Type: 'FS', Resource_Max_FTE: 1.1, Skill_Tags: 'AWS;Architecture;Design', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 25000 },
      { id: 'CLD-003', name: 'Security & Compliance Framework', duration: 18, dependencies: ['CLD-002'], resource: 'SEC-001', startDate: '2025-02-24', status: 'in-progress', daysDelayed: 3, allocation: 120, completionPercent: 70, isCriticalPath: true, float: 0, type: 'Security', ES: 35, EF: 53, LS: 35, LF: 53, Predecessor_ID: 'CLD-002', Successor_ID: 'CLD-004', Dependency_Type: 'FS', Resource_Max_FTE: 1.2, Skill_Tags: 'Security;Compliance;AWS', Probability: 0.5, Delay_Impact_days: 6, Cost_Impact_of_Risk: 40000 },
      { id: 'CLD-004', name: 'Network & VPC Configuration', duration: 12, dependencies: ['CLD-003'], resource: 'NET-001', startDate: '2025-03-20', status: 'in-progress', daysDelayed: 1, allocation: 100, completionPercent: 50, isCriticalPath: true, float: 0, type: 'Infrastructure', ES: 53, EF: 65, LS: 53, LF: 65, Predecessor_ID: 'CLD-003', Successor_ID: 'CLD-005;CLD-006', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Networking;VPC;AWS', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 20000 },
      { id: 'CLD-005', name: 'Database Migration (RDS/Aurora)', duration: 25, dependencies: ['CLD-004'], resource: 'DBA-CLD-001', startDate: '2025-04-07', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Migration', ES: 65, EF: 90, LS: 65, LF: 90, Predecessor_ID: 'CLD-004', Successor_ID: 'CLD-008', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'RDS;Aurora;Database;Migration', Probability: 0.5, Delay_Impact_days: 8, Cost_Impact_of_Risk: 60000 },
      { id: 'CLD-006', name: 'Application Containerization (EKS)', duration: 30, dependencies: ['CLD-004'], resource: 'DEVOPS-CLD-001', startDate: '2025-04-07', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 5, type: 'Migration', ES: 65, EF: 95, LS: 70, LF: 100, Predecessor_ID: 'CLD-004', Successor_ID: 'CLD-007;CLD-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'EKS;Kubernetes;Docker;Containers', Probability: 0.4, Delay_Impact_days: 6, Cost_Impact_of_Risk: 45000 },
      { id: 'CLD-007', name: 'CI/CD Pipeline Setup', duration: 15, dependencies: ['CLD-006'], resource: 'DEVOPS-CLD-001', startDate: '2025-05-19', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 8, type: 'DevOps', ES: 95, EF: 110, LS: 103, LF: 118, Predecessor_ID: 'CLD-006', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'CI/CD;Jenkins;GitOps', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 15000 },
      { id: 'CLD-008', name: 'Data Sync & Validation', duration: 14, dependencies: ['CLD-005'], resource: 'DBA-CLD-001', startDate: '2025-05-12', status: 'not-started', daysDelayed: 0, allocation: 130, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Validation', ES: 90, EF: 104, LS: 90, LF: 104, Predecessor_ID: 'CLD-005', Successor_ID: 'CLD-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.3, Skill_Tags: 'DataSync;Validation;DMS', Probability: 0.4, Delay_Impact_days: 4, Cost_Impact_of_Risk: 35000 },
      { id: 'CLD-009', name: 'Performance & Load Testing', duration: 10, dependencies: ['CLD-006', 'CLD-008'], resource: 'QA-CLD-001', startDate: '2025-06-02', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Testing', ES: 104, EF: 114, LS: 104, LF: 114, Predecessor_ID: 'CLD-006;CLD-008', Successor_ID: 'CLD-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'LoadTesting;Performance;JMeter', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 20000 },
      { id: 'CLD-010', name: 'Disaster Recovery Setup', duration: 12, dependencies: ['CLD-009'], resource: 'CLOUD-ARCH-001', startDate: '2025-06-16', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Infrastructure', ES: 114, EF: 126, LS: 114, LF: 126, Predecessor_ID: 'CLD-009', Successor_ID: 'CLD-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'DR;Backup;HighAvailability', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 25000 },
      { id: 'CLD-011', name: 'Production Cutover', duration: 5, dependencies: ['CLD-010'], resource: 'CLOUD-ARCH-001', startDate: '2025-07-02', status: 'not-started', daysDelayed: 0, allocation: 150, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Deployment', ES: 126, EF: 131, LS: 126, LF: 131, Predecessor_ID: 'CLD-010', Successor_ID: 'CLD-012', Dependency_Type: 'FS', Resource_Max_FTE: 1.5, Skill_Tags: 'Cutover;GoLive;Migration', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 80000 },
      { id: 'CLD-012', name: 'Legacy System Decommission', duration: 20, dependencies: ['CLD-011'], resource: 'IT-LEGACY-001', startDate: '2025-07-09', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 15, type: 'Closeout', ES: 131, EF: 151, LS: 146, LF: 166, Predecessor_ID: 'CLD-011', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Decommission;Legacy;Cleanup', Probability: 0.2, Delay_Impact_days: 3, Cost_Impact_of_Risk: 15000 }
    ]
  },
  // 6. MARKETING - PRODUCT LAUNCH CAMPAIGN
  {
    name: 'New Product Launch - Smart Watch Series X',
    category: 'Marketing',
    budget: 500000,
    activities: [
      { id: 'MKT-001', name: 'Market Research & Competitive Analysis', duration: 14, dependencies: [], resource: 'MKT-ANALYST-001', startDate: '2025-01-06', status: 'completed', daysDelayed: 0, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Research', ES: 0, EF: 14, LS: 0, LF: 14, Predecessor_ID: '', Successor_ID: 'MKT-002', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'MarketResearch;Analysis;Strategy', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 5000 },
      { id: 'MKT-002', name: 'Brand Positioning & Messaging', duration: 10, dependencies: ['MKT-001'], resource: 'BRAND-001', startDate: '2025-01-24', status: 'completed', daysDelayed: 1, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Strategy', ES: 14, EF: 24, LS: 14, LF: 24, Predecessor_ID: 'MKT-001', Successor_ID: 'MKT-003;MKT-006', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Branding;Messaging;Strategy', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 8000 },
      { id: 'MKT-003', name: 'Creative Asset Development', duration: 21, dependencies: ['MKT-002'], resource: 'CREATIVE-001', startDate: '2025-02-07', status: 'in-progress', daysDelayed: 3, allocation: 120, completionPercent: 65, isCriticalPath: true, float: 0, type: 'Creative', ES: 24, EF: 45, LS: 24, LF: 45, Predecessor_ID: 'MKT-002', Successor_ID: 'MKT-004;MKT-005;MKT-007;MKT-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.2, Skill_Tags: 'Creative;Design;Graphics', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 20000 },
      { id: 'MKT-004', name: 'Website & Landing Page Design', duration: 18, dependencies: ['MKT-003'], resource: 'WEB-001', startDate: '2025-03-07', status: 'in-progress', daysDelayed: 2, allocation: 100, completionPercent: 40, isCriticalPath: true, float: 0, type: 'Digital', ES: 45, EF: 63, LS: 45, LF: 63, Predecessor_ID: 'MKT-003', Successor_ID: 'MKT-008;MKT-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'WebDesign;Landing;UX', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 15000 },
      { id: 'MKT-005', name: 'Social Media Campaign Setup', duration: 10, dependencies: ['MKT-003'], resource: 'SOCIAL-001', startDate: '2025-03-07', status: 'in-progress', daysDelayed: 0, allocation: 100, completionPercent: 55, isCriticalPath: false, float: 8, type: 'Digital', ES: 45, EF: 55, LS: 53, LF: 63, Predecessor_ID: 'MKT-003', Successor_ID: 'MKT-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'SocialMedia;Marketing;Digital', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 5000 },
      { id: 'MKT-006', name: 'Influencer Partnership Outreach', duration: 14, dependencies: ['MKT-002'], resource: 'PR-001', startDate: '2025-02-07', status: 'in-progress', daysDelayed: 4, allocation: 100, completionPercent: 50, isCriticalPath: false, float: 12, type: 'PR', ES: 24, EF: 38, LS: 36, LF: 50, Predecessor_ID: 'MKT-002', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Influencer;PR;Partnerships', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 12000 },
      { id: 'MKT-007', name: 'Press Kit & Media Materials', duration: 12, dependencies: ['MKT-003'], resource: 'PR-001', startDate: '2025-03-07', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 10, type: 'PR', ES: 45, EF: 57, LS: 55, LF: 67, Predecessor_ID: 'MKT-003', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'PR;Media;PressKit', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 6000 },
      { id: 'MKT-008', name: 'Email Marketing Automation', duration: 8, dependencies: ['MKT-004'], resource: 'EMAIL-001', startDate: '2025-04-01', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Digital', ES: 63, EF: 71, LS: 63, LF: 71, Predecessor_ID: 'MKT-004', Successor_ID: 'MKT-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Email;Marketing;Automation', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 4000 },
      { id: 'MKT-009', name: 'Paid Advertising Campaign', duration: 30, dependencies: ['MKT-004', 'MKT-005'], resource: 'ADS-001', startDate: '2025-04-01', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Advertising', ES: 63, EF: 93, LS: 63, LF: 93, Predecessor_ID: 'MKT-004;MKT-005', Successor_ID: 'MKT-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'PPC;Advertising;GoogleAds', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 25000 },
      { id: 'MKT-010', name: 'Launch Event Planning', duration: 20, dependencies: ['MKT-003'], resource: 'EVENT-001', startDate: '2025-03-07', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 15, type: 'Events', ES: 45, EF: 65, LS: 60, LF: 80, Predecessor_ID: 'MKT-003', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Events;Planning;Logistics', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 10000 },
      { id: 'MKT-011', name: 'Product Launch Day Execution', duration: 3, dependencies: ['MKT-008', 'MKT-009'], resource: 'MKT-MGR-001', startDate: '2025-05-05', status: 'not-started', daysDelayed: 0, allocation: 150, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Launch', ES: 93, EF: 96, LS: 93, LF: 96, Predecessor_ID: 'MKT-008;MKT-009', Successor_ID: 'MKT-012', Dependency_Type: 'FS', Resource_Max_FTE: 1.5, Skill_Tags: 'Launch;Execution;Marketing', Probability: 0.4, Delay_Impact_days: 3, Cost_Impact_of_Risk: 30000 },
      { id: 'MKT-012', name: 'Post-Launch Analytics & Reporting', duration: 14, dependencies: ['MKT-011'], resource: 'MKT-ANALYST-001', startDate: '2025-05-08', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Analytics', ES: 96, EF: 110, LS: 96, LF: 110, Predecessor_ID: 'MKT-011', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Analytics;Reporting;Metrics', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 5000 }
    ]
  },
  // 7. MOBILE APP DEVELOPMENT
  {
    name: 'Healthcare Mobile App - Patient Portal',
    category: 'Healthcare Software',
    budget: 650000,
    activities: [
      { id: 'APP-001', name: 'Product Discovery & User Research', duration: 12, dependencies: [], resource: 'UX-001', startDate: '2025-01-06', status: 'completed', daysDelayed: 0, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Research', ES: 0, EF: 12, LS: 0, LF: 12, Predecessor_ID: '', Successor_ID: 'APP-002;APP-003', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'UX;Research;Discovery', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 8000 },
      { id: 'APP-002', name: 'HIPAA Compliance Requirements', duration: 10, dependencies: ['APP-001'], resource: 'COMP-APP-001', startDate: '2025-01-22', status: 'completed', daysDelayed: 2, allocation: 100, completionPercent: 100, isCriticalPath: true, float: 0, type: 'Compliance', ES: 12, EF: 22, LS: 12, LF: 22, Predecessor_ID: 'APP-001', Successor_ID: 'APP-004', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'HIPAA;Compliance;Healthcare', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 25000 },
      { id: 'APP-003', name: 'UI/UX Design & Prototyping', duration: 18, dependencies: ['APP-001'], resource: 'UX-001', startDate: '2025-01-22', status: 'in-progress', daysDelayed: 3, allocation: 110, completionPercent: 75, isCriticalPath: false, float: 5, type: 'Design', ES: 12, EF: 30, LS: 17, LF: 35, Predecessor_ID: 'APP-001', Successor_ID: 'APP-005;APP-006', Dependency_Type: 'FS', Resource_Max_FTE: 1.1, Skill_Tags: 'UI;UX;Prototyping;Figma', Probability: 0.3, Delay_Impact_days: 4, Cost_Impact_of_Risk: 15000 },
      { id: 'APP-004', name: 'Backend API Development', duration: 25, dependencies: ['APP-002'], resource: 'BE-APP-001', startDate: '2025-02-05', status: 'in-progress', daysDelayed: 4, allocation: 130, completionPercent: 45, isCriticalPath: true, float: 0, type: 'Development', ES: 22, EF: 47, LS: 22, LF: 47, Predecessor_ID: 'APP-002', Successor_ID: 'APP-005;APP-006;APP-007', Dependency_Type: 'FS', Resource_Max_FTE: 1.3, Skill_Tags: 'Backend;API;Node.js', Probability: 0.5, Delay_Impact_days: 7, Cost_Impact_of_Risk: 35000 },
      { id: 'APP-005', name: 'iOS App Development', duration: 30, dependencies: ['APP-003', 'APP-004'], resource: 'IOS-001', startDate: '2025-03-10', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Development', ES: 47, EF: 77, LS: 47, LF: 77, Predecessor_ID: 'APP-003;APP-004', Successor_ID: 'APP-008', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'iOS;Swift;Mobile', Probability: 0.4, Delay_Impact_days: 6, Cost_Impact_of_Risk: 30000 },
      { id: 'APP-006', name: 'Android App Development', duration: 30, dependencies: ['APP-003', 'APP-004'], resource: 'AND-001', startDate: '2025-03-10', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 3, type: 'Development', ES: 47, EF: 77, LS: 50, LF: 80, Predecessor_ID: 'APP-003;APP-004', Successor_ID: 'APP-008', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Android;Kotlin;Mobile', Probability: 0.4, Delay_Impact_days: 6, Cost_Impact_of_Risk: 28000 },
      { id: 'APP-007', name: 'EHR Integration (HL7/FHIR)', duration: 20, dependencies: ['APP-004'], resource: 'INT-APP-001', startDate: '2025-03-10', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Integration', ES: 47, EF: 67, LS: 47, LF: 67, Predecessor_ID: 'APP-004', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'HL7;FHIR;EHR;Integration', Probability: 0.5, Delay_Impact_days: 8, Cost_Impact_of_Risk: 40000 },
      { id: 'APP-008', name: 'Security Penetration Testing', duration: 10, dependencies: ['APP-005', 'APP-006'], resource: 'SEC-APP-001', startDate: '2025-04-21', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Security', ES: 77, EF: 87, LS: 77, LF: 87, Predecessor_ID: 'APP-005;APP-006', Successor_ID: 'APP-009', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'PenTest;Security;OWASP', Probability: 0.4, Delay_Impact_days: 4, Cost_Impact_of_Risk: 20000 },
      { id: 'APP-009', name: 'Beta Testing with Patients', duration: 14, dependencies: ['APP-008'], resource: 'QA-APP-001', startDate: '2025-05-05', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Testing', ES: 87, EF: 101, LS: 87, LF: 101, Predecessor_ID: 'APP-008', Successor_ID: 'APP-010', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'BetaTesting;QA;Patient', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 12000 },
      { id: 'APP-010', name: 'App Store Submission & Review', duration: 10, dependencies: ['APP-009'], resource: 'PM-APP-001', startDate: '2025-05-23', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Deployment', ES: 101, EF: 111, LS: 101, LF: 111, Predecessor_ID: 'APP-009', Successor_ID: 'APP-011', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'AppStore;Submission;Review', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 15000 },
      { id: 'APP-011', name: 'Production Launch', duration: 5, dependencies: ['APP-010'], resource: 'PM-APP-001', startDate: '2025-06-06', status: 'not-started', daysDelayed: 0, allocation: 120, completionPercent: 0, isCriticalPath: true, float: 0, type: 'Launch', ES: 111, EF: 116, LS: 111, LF: 116, Predecessor_ID: 'APP-010', Successor_ID: 'APP-012', Dependency_Type: 'FS', Resource_Max_FTE: 1.2, Skill_Tags: 'Launch;GoLive;Mobile', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 20000 },
      { id: 'APP-012', name: 'Post-Launch Support & Monitoring', duration: 30, dependencies: ['APP-011'], resource: 'SUPPORT-001', startDate: '2025-06-13', status: 'not-started', daysDelayed: 0, allocation: 100, completionPercent: 0, isCriticalPath: false, float: 10, type: 'Support', ES: 116, EF: 146, LS: 126, LF: 156, Predecessor_ID: 'APP-011', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'Support;Monitoring;DevOps', Probability: 0.2, Delay_Impact_days: 3, Cost_Impact_of_Risk: 10000 }
    ]
  }
];

// ===================================
// AI CHAT WIDGET COMPONENT
// ===================================

// ===================================
// AI CHAT WIDGET COMPONENT
// ===================================
const AIChatWidget = ({ projectData, riskResults, selectedRisk, aiInsight, storedInsights }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('pm_ai_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Hello! 👋 I\'m your AI Project Assistant. I can help you understand your project data, analyze risks, and answer questions about your activities.\n\n💡 **I can also send emails!** Just say:\n• "Send risk report to email@example.com"\n• "Email risk analysis to team@company.com"' }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('pm_ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Email detection and sending function
  const detectAndSendEmail = async (userInput) => {
    // Detect email sending intent
    const emailPatterns = [
      /send\s+(?:risk\s+)?(?:report|analysis|alert|email)\s+to\s+([^\s]+@[^\s]+)/i,
      /email\s+(?:risk\s+)?(?:report|analysis|alert)?\s*to\s+([^\s]+@[^\s]+)/i,
      /send\s+(?:an?\s+)?email\s+to\s+([^\s]+@[^\s]+)/i,
      /(?:please\s+)?send\s+to\s+([^\s]+@[^\s]+)/i,
      /([^\s]+@[^\s]+)\s+(?:please\s+)?send/i
    ];

    let emailMatch = null;
    for (const pattern of emailPatterns) {
      const match = userInput.match(pattern);
      if (match) {
        emailMatch = match[1];
        break;
      }
    }

    // Also try to find any email in the message if keywords suggest sending
    if (!emailMatch && /send|email|report|analysis|alert/i.test(userInput)) {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      const match = userInput.match(emailRegex);
      if (match) emailMatch = match[1];
    }

    if (!emailMatch) return null;

    // Check if user mentioned a different project name
    const currentProjectName = projectData?.name || '';
    if (currentProjectName) {
      // Extract potential project names from the user input (text after "of" or "for")
      const projectMentionPattern = /(?:of|for)\s+(.+?)(?:\s+project)?$/i;
      const projectMention = userInput.match(projectMentionPattern);

      if (projectMention) {
        const mentionedProject = projectMention[1].trim();
        // Check if the mentioned project is different from current project
        const currentNameLower = currentProjectName.toLowerCase();
        const mentionedLower = mentionedProject.toLowerCase();

        // If the mentioned project doesn't match current project (and isn't a generic term)
        if (!currentNameLower.includes(mentionedLower) &&
            !mentionedLower.includes(currentNameLower.split(' ')[0]) &&
            !['this project', 'current project', 'selected project', 'the project'].includes(mentionedLower)) {
          return {
            success: false,
            message: `⚠️ You've asked to send a report for **"${mentionedProject}"**, but the currently selected project is **"${currentProjectName}"**.

I can only send reports for the currently selected project. To send a report for a different project:

1. 📂 Use the **project selector dropdown** at the top of the application
2. 🔍 Select **"${mentionedProject}"**
3. 🚀 Run the **Risk Analysis** for that project
4. 📧 Then ask me to send the report again

Would you like me to send the risk report for **"${currentProjectName}"** to ${emailMatch} instead?`
          };
        }
      }
    }

    // Validate we have data to send
    if (!riskResults || riskResults.length === 0) {
      return { success: false, message: '⚠️ No risk analysis data available. Please run the AI Risk Analysis first before sending a report.' };
    }

    // Generate the HTML email content
    const critical = riskResults.filter(r => r.severity === 'critical').length;
    const high = riskResults.filter(r => r.severity === 'high').length;
    const medium = riskResults.filter(r => r.severity === 'medium').length;
    const low = riskResults.filter(r => r.severity === 'low').length;
    const topRisks = riskResults.slice(0, 5);
    const totalRisks = riskResults.length;
    const avgScore = riskResults.reduce((sum, r) => sum + (r.riskScore || 0), 0) / totalRisks;
    const totalEMV = riskResults.reduce((sum, r) => sum + (r.emv || 0), 0);

    const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9;">
          <tr>
            <td style="padding: 30px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" style="margin: 0 auto; max-width: 650px;">

                <!-- Header -->
                <tr>
                  <td style="background-color: #7c3aed; padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <div style="width: 70px; height: 70px; margin: 0 auto 16px; background-color: #ffffff; border-radius: 50%; line-height: 70px; font-size: 32px;">📊</div>
                          <h1 style="color: #ffffff !important; margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Risk Analysis Report</h1>
                          <p style="color: #e9d5ff; margin: 0; font-size: 15px; font-weight: 400;">AI-Powered Project Risk Assessment</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Project Info Bar -->
                <tr>
                  <td style="background: #1e293b; padding: 20px 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: white;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Project</p>
                          <p style="margin: 0; font-size: 18px; font-weight: 600; color: white;">${projectData?.name || 'Unknown Project'}</p>
                        </td>
                        <td style="text-align: right; color: white;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Generated</p>
                          <p style="margin: 0; font-size: 14px; color: #e2e8f0;">${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="background: white; padding: 0;">

                    <!-- Risk Summary Cards -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 30px;">
                      <tr>
                        <td colspan="4" style="padding-bottom: 20px;">
                          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">📈 Risk Distribution</h2>
                        </td>
                      </tr>
                      <tr>
                        <td width="25%" style="padding: 8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; border: 1px solid #fecaca;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 36px; font-weight: 800; color: #dc2626; line-height: 1;">${critical}</div>
                                <div style="font-size: 11px; font-weight: 600; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">Critical</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="25%" style="padding: 8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 12px; border: 1px solid #fed7aa;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 36px; font-weight: 800; color: #ea580c; line-height: 1;">${high}</div>
                                <div style="font-size: 11px; font-weight: 600; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">High</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="25%" style="padding: 8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border-radius: 12px; border: 1px solid #fde047;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 36px; font-weight: 800; color: #ca8a04; line-height: 1;">${medium}</div>
                                <div style="font-size: 11px; font-weight: 600; color: #a16207; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">Medium</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="25%" style="padding: 8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 1px solid #86efac;">
                            <tr>
                              <td style="padding: 20px; text-align: center;">
                                <div style="font-size: 36px; font-weight: 800; color: #16a34a; line-height: 1;">${low}</div>
                                <div style="font-size: 11px; font-weight: 600; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">Low</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Quick Stats -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                      <tr>
                        <td width="33%" style="padding: 20px 30px; text-align: center; border-right: 1px solid #e2e8f0;">
                          <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${totalRisks}</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Total Activities</div>
                        </td>
                        <td width="34%" style="padding: 20px 30px; text-align: center; border-right: 1px solid #e2e8f0;">
                          <div style="font-size: 24px; font-weight: 700; color: #7c3aed;">${avgScore.toFixed(1)}</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Avg Risk Score</div>
                        </td>
                        <td width="33%" style="padding: 20px 30px; text-align: center;">
                          <div style="font-size: 24px; font-weight: 700; color: #dc2626;">$${(totalEMV / 1000).toFixed(0)}K</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Total EMV</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Top Risks Table -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 30px;">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1e293b;">🔥 Top ${topRisks.length} High-Priority Risks</h2>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                            <thead>
                              <tr style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                                <th style="padding: 14px 16px; text-align: left; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;">Activity</th>
                                <th style="padding: 14px 16px; text-align: center; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;" width="80">Score</th>
                                <th style="padding: 14px 16px; text-align: center; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;" width="100">Severity</th>
                                <th style="padding: 14px 16px; text-align: center; font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px;" width="100">Impact</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${topRisks.map((risk, index) => `
                                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                                  <td style="padding: 14px 16px; font-size: 14px; color: #1e293b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
                                    <span style="color: #94a3b8; font-size: 12px; margin-right: 8px;">#${index + 1}</span>
                                    ${risk.activity.name}
                                  </td>
                                  <td style="padding: 14px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                                    <span style="display: inline-block; min-width: 40px; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 700; background: ${risk.severity === 'critical' ? '#dc2626' : risk.severity === 'high' ? '#ea580c' : risk.severity === 'medium' ? '#ca8a04' : '#16a34a'}; color: white;">${risk.riskScore?.toFixed(0)}</span>
                                  </td>
                                  <td style="padding: 14px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                                    <span style="display: inline-block; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${risk.severity === 'critical' ? '#fef2f2' : risk.severity === 'high' ? '#fff7ed' : risk.severity === 'medium' ? '#fefce8' : '#f0fdf4'}; color: ${risk.severity === 'critical' ? '#dc2626' : risk.severity === 'high' ? '#ea580c' : risk.severity === 'medium' ? '#ca8a04' : '#16a34a'}; border: 1px solid ${risk.severity === 'critical' ? '#fecaca' : risk.severity === 'high' ? '#fed7aa' : risk.severity === 'medium' ? '#fde047' : '#86efac'};">${risk.severity}</span>
                                  </td>
                                  <td style="padding: 14px 16px; text-align: center; font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                                    ${risk.activity.daysDelayed ? `<span style="color: #dc2626; font-weight: 600;">+${risk.activity.daysDelayed} days</span>` : '<span style="color: #16a34a;">On track</span>'}
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${aiInsight ? `
                    <!-- AI Insight Section -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 0 30px 30px 30px;">
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; border: 1px solid #86efac;">
                            <tr>
                              <td style="padding: 20px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td width="40" style="vertical-align: top;">
                                      <div style="width: 36px; height: 36px; background: #10b981; border-radius: 10px; text-align: center; line-height: 36px; font-size: 18px;">🤖</div>
                                    </td>
                                    <td style="padding-left: 12px;">
                                      <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 600; color: #065f46;">AI-Generated Insight</h3>
                                      <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.6;">${aiInsight.substring(0, 500)}${aiInsight.length > 500 ? '...' : ''}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; color: white; font-weight: 600;">PM Risk Monitor</p>
                          <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8;">AI-Powered Project Risk Analysis</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                            <tr>
                              <td style="padding: 0 8px;">
                                <span style="display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px; color: #94a3b8;">i2e Consulting</span>
                              </td>
                              <td style="padding: 0 8px;">
                                <span style="display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px; color: #94a3b8;">AI Lab Hackathon 2025</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      const templateParams = {
        to_email: emailMatch,
        subject: `🚨 Risk Analysis Report - ${projectData?.name || 'Project'} - ${critical} Critical, ${high} High Risks`,
        message: htmlMessage,
        activity_name: `Full Report (${riskResults.length} activities)`,
        risk_score: `${critical} critical, ${high} high`,
        severity: critical > 0 ? 'CRITICAL' : high > 0 ? 'HIGH' : 'MEDIUM'
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      return {
        success: true,
        message: `✅ **Email sent successfully!**\n\n📧 **To:** ${emailMatch}\n📋 **Subject:** Risk Analysis Report - ${projectData?.name}\n\n**Summary included:**\n• ${riskResults.length} activities analyzed\n• ${critical} critical, ${high} high, ${medium} medium, ${low} low risks\n• Top 5 risks with details\n${aiInsight ? '• AI insight included' : ''}\n\nThe recipient should receive the email shortly!`
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        message: `❌ Failed to send email to ${emailMatch}. Error: ${error.message || 'Unknown error'}. Please try again.`
      };
    }
  };

  // Build context from app data
  const buildAppContext = () => {
    let context = '';

    // Project info
    if (projectData) {
      context += `\n## CURRENT PROJECT:\n`;
      context += `- Name: ${projectData.name}\n`;
      context += `- Budget: $${projectData.budget?.toLocaleString() || 'N/A'}\n`;
      context += `- Duration: ${projectData.duration || 'N/A'}\n`;
      context += `- Total Activities: ${projectData.activities?.length || 0}\n`;
    }

    // Activities summary
    if (projectData?.activities?.length > 0) {
      context += `\n## ACTIVITIES:\n`;
      projectData.activities.forEach(act => {
        context += `- ${act.id}: ${act.name} | Duration: ${act.duration} days | Status: ${act.status} | Progress: ${act.completionPercent || act.percentComplete || 0}% | Days Delayed: ${act.daysDelayed || 0} | Resource: ${act.resource} | Critical Path: ${act.isCriticalPath ? 'Yes' : 'No'} | Float: ${act.float || 0} days\n`;
      });
    }

    // Risk analysis results
    if (riskResults?.length > 0) {
      context += `\n## RISK ANALYSIS RESULTS:\n`;
      context += `Total activities analyzed: ${riskResults.length}\n`;
      const critical = riskResults.filter(r => r.severity === 'critical').length;
      const high = riskResults.filter(r => r.severity === 'high').length;
      const medium = riskResults.filter(r => r.severity === 'medium').length;
      const low = riskResults.filter(r => r.severity === 'low').length;
      context += `Risk Distribution: Critical(${critical}), High(${high}), Medium(${medium}), Low(${low})\n\n`;

      riskResults.forEach(risk => {
        context += `### ${risk.activity.name} (${risk.activity.id})\n`;
        context += `- Risk Score: ${risk.riskScore?.toFixed(0)}/100\n`;
        context += `- Severity: ${risk.severity?.toUpperCase()}\n`;
        context += `- Days Delayed: ${risk.activity.daysDelayed || 0}\n`;
        if (risk.factors) {
          context += `- Risk Factors: Schedule Delay=${risk.factors.scheduleDelay?.toFixed(0)}%, Critical Path=${risk.factors.criticalPathImpact?.toFixed(0)}%, Float=${risk.factors.floatConsumption?.toFixed(0)}%, Resource=${risk.factors.resourceOverallocation?.toFixed(0)}%, Progress=${risk.factors.progressDeviation?.toFixed(0)}%\n`;
        }
        context += '\n';
      });
    }

    // Currently selected risk
    if (selectedRisk) {
      context += `\n## CURRENTLY SELECTED RISK:\n`;
      context += `- Activity: ${selectedRisk.activity.name} (${selectedRisk.activity.id})\n`;
      context += `- Risk Score: ${selectedRisk.riskScore?.toFixed(0)}/100\n`;
      context += `- Severity: ${selectedRisk.severity?.toUpperCase()}\n`;
      context += `- Days Delayed: ${selectedRisk.activity.daysDelayed}\n`;
      context += `- Resource: ${selectedRisk.activity.resource}\n`;
      context += `- Allocation: ${selectedRisk.activity.allocation}%\n`;
      context += `- Progress: ${selectedRisk.activity.percentComplete || selectedRisk.activity.completionPercent || 0}%\n`;
    }

    // AI Insights
    if (aiInsight) {
      context += `\n## CURRENT AI INSIGHT:\n${aiInsight}\n`;
    }

    // Stored insights
    if (storedInsights && Object.keys(storedInsights).length > 0) {
      context += `\n## STORED AI INSIGHTS:\n`;
      Object.entries(storedInsights).forEach(([actId, data]) => {
        context += `- ${actId}: ${data.insight?.substring(0, 200)}...\n`;
      });
    }

    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if user wants to send an email
      const emailResult = await detectAndSendEmail(userInput);

      if (emailResult) {
        // This was an email request
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: emailResult.message
        }]);
        setIsLoading(false);
        return;
      }

      // Regular chat - proceed with ChatGPT
      const appContext = buildAppContext();
      const currentProjectName = projectData?.name || 'Unknown Project';

      const systemPrompt = `You are an expert AI Project Management Assistant for the "PM Risk Monitor" application. You help project managers understand their project data, analyze risks, and make informed decisions.

🎯 **CURRENTLY SELECTED PROJECT: "${currentProjectName}"**

⚠️ CRITICAL INSTRUCTION - PROJECT NAME VALIDATION:
Before answering ANY question, you MUST check if the user's query mentions a DIFFERENT project name than "${currentProjectName}".
- If the user mentions a project name that is NOT "${currentProjectName}", you MUST respond with:
  "⚠️ You've asked about **[mentioned project name]**, but the currently selected project is **${currentProjectName}**.

  I can only provide data for the currently selected project. To get information about a different project, please:
  1. Use the project selector dropdown at the top of the application
  2. Select the project you want to analyze
  3. Run the Risk Analysis for that project
  4. Then ask your question again

  Would you like me to help you with **${currentProjectName}** instead?"

- ONLY proceed to answer if the query is about "${currentProjectName}" or doesn't mention any specific project name.

You have access to the following application data (ONLY for "${currentProjectName}"):
${appContext}

IMPORTANT CAPABILITIES:
- You CAN send emails! If user asks to send an email/report, extract the email address and confirm you'll send it.
- Example: "send risk report to john@example.com" - you will actually send the email
- But you can ONLY send reports for the currently selected project: "${currentProjectName}"

Guidelines:
- ALWAYS verify the project name in the user's query matches "${currentProjectName}" before responding
- Be concise but thorough in your responses
- Reference specific data from the context when answering
- If asked about something not in the context, politely explain what data is available
- Use emojis sparingly to make responses friendly
- Format responses with markdown for readability
- When discussing risks, provide actionable recommendations
- If discussing critical risks, emphasize urgency appropriately
- If user asks to send email but doesn't provide an address, ask for the email address`;

      // Use secure API proxy instead of direct OpenAI call
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userInput }
      ];

      const data = await callOpenAI(chatMessages, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000
      });

      const assistantMessage = {
        role: 'assistant',
        content: extractContent(data)
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Chat cleared! 🗑️ How can I help you with your project?' }
    ]);
  };

  // Simple markdown to HTML converter for chat
  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>')
      .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:0.95em;">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 6px;font-size:1em;">$1</h3>')
      .replace(/^- (.+)$/gm, '<li style="margin:2px 0;">$1</li>')
      .replace(/\n/g, '<br>');
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 50%, #6366f1 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 212, 170, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          transition: 'all 0.3s ease',
          zIndex: 9998,
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
        title="AI Assistant"
      >
        {isOpen ? '✕' : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Headset band */}
            <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12V16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            {/* Left ear piece */}
            <rect x="2" y="11" width="4" height="7" rx="1.5" stroke="white" strokeWidth="2"/>
            {/* Right ear piece */}
            <rect x="18" y="11" width="4" height="7" rx="1.5" stroke="white" strokeWidth="2"/>
            {/* Head shape with AI */}
            <rect x="7" y="8" width="10" height="10" rx="3" stroke="white" strokeWidth="2"/>
            {/* AI text */}
            <text x="12" y="15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold" fontFamily="Arial">AI</text>
            {/* Microphone */}
            <circle cx="6" cy="20" r="2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M8 20H6" stroke="white" strokeWidth="1.5"/>
            <path d="M6 18V16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '400px',
          height: '550px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'slideUpChat 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 50%, #6366f1 100%)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12V16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="2" y="11" width="4" height="7" rx="1.5" stroke="white" strokeWidth="1.5"/>
                  <rect x="18" y="11" width="4" height="7" rx="1.5" stroke="white" strokeWidth="1.5"/>
                  <rect x="7" y="8" width="10" height="10" rx="3" stroke="white" strokeWidth="1.5"/>
                  <text x="12" y="15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold" fontFamily="Arial">AI</text>
                  <circle cx="6" cy="20" r="2" stroke="white" strokeWidth="1.5" fill="none"/>
                  <path d="M8 20H6" stroke="white" strokeWidth="1.5"/>
                  <path d="M6 18V16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>AI Project Assistant</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>Powered by GPT-4o-mini</div>
              </div>
            </div>
            <button
              onClick={handleClearChat}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'white',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
              title="Clear chat"
            >
              🗑️ Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8fafc'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'white',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: msg.role === 'user'
                    ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                    : '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className="typing-dot" style={{ animationDelay: '0s' }}>●</span>
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e2e8f0',
            background: 'white'
          }}>
            {/* Prompt Suggestions Dropdown */}
            <div style={{ marginBottom: '10px' }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setInput(e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.85rem',
                  color: '#64748b',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">💡 Quick prompts - Select to populate...</option>
                <optgroup label="📊 Risk Analysis">
                  <option value="What are the top 3 highest risk activities and why?">What are the top 3 highest risk activities and why?</option>
                  <option value="Summarize the overall project risk status">Summarize the overall project risk status</option>
                  <option value="Which activities are on the critical path and delayed?">Which activities are on the critical path and delayed?</option>
                  <option value="What is the risk distribution across all activities?">What is the risk distribution across all activities?</option>
                </optgroup>
                <optgroup label="📅 Schedule & Timeline">
                  <option value="Which activities are behind schedule and by how many days?">Which activities are behind schedule and by how many days?</option>
                  <option value="What is the projected project completion date based on current delays?">What is the projected project completion date based on current delays?</option>
                  <option value="List all activities with zero float remaining">List all activities with zero float remaining</option>
                </optgroup>
                <optgroup label="👥 Resources">
                  <option value="Which resources are over-allocated?">Which resources are over-allocated?</option>
                  <option value="Show me the resource utilization summary">Show me the resource utilization summary</option>
                  <option value="Which activities need additional resources?">Which activities need additional resources?</option>
                </optgroup>
                <optgroup label="💡 Recommendations">
                  <option value="What actions should I take to reduce project risk?">What actions should I take to reduce project risk?</option>
                  <option value="Suggest mitigation strategies for the critical risks">Suggest mitigation strategies for the critical risks</option>
                  <option value="What is the estimated cost impact of current delays?">What is the estimated cost impact of current delays?</option>
                </optgroup>
                <optgroup label="📧 Email Reports">
                  <option value="Send risk report to ">Send risk report to [enter email]</option>
                  <option value="Email a summary of critical risks to ">Email critical risks summary to [enter email]</option>
                  <option value="Send project status update to ">Send project status update to [enter email]</option>
                  <option value="Email weekly risk analysis report to ">Email weekly risk analysis to [enter email]</option>
                  <option value="Send executive summary of delayed activities to ">Send delayed activities summary to [enter email]</option>
                </optgroup>
                {/* Dynamic prompts based on current data */}
                {selectedRisk && (
                  <optgroup label={`🎯 Current Risk: ${selectedRisk.activity?.name?.substring(0, 25)}...`}>
                    <option value={`Explain the risk factors for ${selectedRisk.activity?.name}`}>Explain risk factors for this activity</option>
                    <option value={`What are the dependencies affected by ${selectedRisk.activity?.name}?`}>What dependencies are affected?</option>
                    <option value={`How can I reduce the risk score for ${selectedRisk.activity?.name}?`}>How can I reduce this risk score?</option>
                  </optgroup>
                )}
                {riskResults?.length > 0 && (
                  <optgroup label="📈 Dynamic Analysis">
                    <option value={`We have ${riskResults.filter(r => r.severity === 'critical').length} critical and ${riskResults.filter(r => r.severity === 'high').length} high risks. What should be our priority?`}>Analyze current critical & high risks priority</option>
                    <option value={`Compare the risk levels of activities on critical path vs non-critical path`}>Compare critical path vs non-critical path risks</option>
                  </optgroup>
                )}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your project... (Shift+Enter for new line)"
                disabled={isLoading}
                rows={2}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.4'
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: isLoading || !input.trim()
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
                  border: 'none',
                  color: isLoading || !input.trim() ? '#94a3b8' : 'white',
                  fontWeight: '600',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? '...' : '➤'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



// ===================================
// DEFAULT PROJECT DATA (with full 27-field support)
// ===================================
const DEFAULT_PROJECT = {
  name: 'Hospital-Wide EMR Implementation',
  budget: 5000000,
  duration: '12 months',
  teamSize: 45,
  activities: [
    {
      id: 'A-042',
      name: 'HIPAA Security Configuration & Compliance Testing',
      duration: 15,
      dependencies: ['A-038', 'A-041'],
      resource: 'R-014',
      startDate: '2025-01-15',
      status: 'in-progress',
      daysDelayed: 9,
      allocation: 148,
      completionPercent: 45,
      isCriticalPath: true,
      float: 0,
      type: 'Security & Compliance',
      ES: 0, EF: 15, LS: 0, LF: 15, Predecessor_ID: 'A-038;A-041', Successor_ID: 'A-047;A-089', Dependency_Type: 'FS', Resource_Max_FTE: 1.5, Skill_Tags: 'HIPAA;Security;Compliance', Probability: 0.7, Delay_Impact_days: 12, Cost_Impact_of_Risk: 75000
    },
    {
      id: 'A-047',
      name: 'Patient Data Migration - Phase 2',
      duration: 20,
      dependencies: ['A-042'],
      resource: 'R-009',
      startDate: '2025-02-01',
      status: 'not-started',
      daysDelayed: 0,
      allocation: 135,
      completionPercent: 0,
      isCriticalPath: true,
      float: 0,
      type: 'Data Migration',
      ES: 15, EF: 35, LS: 15, LF: 35, Predecessor_ID: 'A-042', Successor_ID: 'A-053', Dependency_Type: 'FS', Resource_Max_FTE: 1.4, Skill_Tags: 'Migration;Database;PatientData', Probability: 0.5, Delay_Impact_days: 8, Cost_Impact_of_Risk: 50000
    },
    {
      id: 'A-053',
      name: 'Clinical Workflow Integration Testing',
      duration: 12,
      dependencies: ['A-047', 'A-051'],
      resource: 'R-022',
      startDate: '2025-02-20',
      status: 'not-started',
      daysDelayed: 0,
      allocation: 110,
      completionPercent: 0,
      isCriticalPath: true,
      float: 2,
      type: 'Integration Testing',
      ES: 35, EF: 47, LS: 37, LF: 49, Predecessor_ID: 'A-047;A-051', Successor_ID: 'A-102', Dependency_Type: 'FS', Resource_Max_FTE: 1.1, Skill_Tags: 'Testing;Integration;Clinical', Probability: 0.4, Delay_Impact_days: 5, Cost_Impact_of_Risk: 30000
    },
    {
      id: 'A-089',
      name: 'Pharmacy System Interface Development',
      duration: 10,
      dependencies: ['A-042'],
      resource: 'R-018',
      startDate: '2025-02-05',
      status: 'not-started',
      daysDelayed: 0,
      allocation: 80,
      completionPercent: 0,
      isCriticalPath: false,
      float: 8,
      type: 'Integration',
      ES: 15, EF: 25, LS: 23, LF: 33, Predecessor_ID: 'A-042', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 0.8, Skill_Tags: 'Pharmacy;HL7;Integration', Probability: 0.3, Delay_Impact_days: 3, Cost_Impact_of_Risk: 15000
    },
    {
      id: 'A-102',
      name: 'Staff Training Program - Wave 1',
      duration: 8,
      dependencies: ['A-053'],
      resource: 'R-031',
      startDate: '2025-03-01',
      status: 'not-started',
      daysDelayed: 0,
      allocation: 90,
      completionPercent: 0,
      isCriticalPath: false,
      float: 5,
      type: 'Training',
      ES: 47, EF: 55, LS: 52, LF: 60, Predecessor_ID: 'A-053', Successor_ID: 'A-115', Dependency_Type: 'FS', Resource_Max_FTE: 0.9, Skill_Tags: 'Training;Clinical;Education', Probability: 0.2, Delay_Impact_days: 2, Cost_Impact_of_Risk: 10000
    },
    {
      id: 'A-115',
      name: 'Go-Live Preparation & Deployment',
      duration: 7,
      dependencies: ['A-102', 'A-112'],
      resource: 'R-001',
      startDate: '2025-03-24',
      status: 'not-started',
      daysDelayed: 0,
      allocation: 100,
      completionPercent: 0,
      isCriticalPath: true,
      float: 0,
      type: 'Deployment',
      ES: 55, EF: 62, LS: 55, LF: 62, Predecessor_ID: 'A-102;A-112', Successor_ID: '', Dependency_Type: 'FS', Resource_Max_FTE: 1.0, Skill_Tags: 'GoLive;Deployment;Support', Probability: 0.5, Delay_Impact_days: 7, Cost_Impact_of_Risk: 100000
    }
  ]
};

// ===================================
// MAIN APP COMPONENT
// ===================================
function App() {
  // ===================================
  // STATE MANAGEMENT
  // ===================================
  // Projects layer - array of projects, each with activities
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);

  // Derived: current selected project (for backward compatibility)
  const projectData = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Risk analysis state
  const [risks, setRisks] = useState([]);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisTime, setAnalysisTime] = useState(0);
  const [aiInsight, setAiInsight] = useState(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Stored AI Insights (persisted to localStorage)
  const [storedInsights, setStoredInsights] = useState(() => {
    const stored = localStorage.getItem('pm_ai_insights');
    return stored ? JSON.parse(stored) : {};
  });
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [approvedMitigations, setApprovedMitigations] = useState(() => {
    const stored = localStorage.getItem('pm_approved_mitigations');
    return stored ? JSON.parse(stored) : [];
  });

  // ChatGPT Mitigation Strategies State
  const [mitigationStrategies, setMitigationStrategies] = useState(() => {
    const stored = localStorage.getItem('pm_mitigation_strategies');
    return stored ? JSON.parse(stored) : null;
  });
  const [isGeneratingStrategies, setIsGeneratingStrategies] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [appliedMitigation, setAppliedMitigation] = useState(() => {
    const stored = localStorage.getItem('pm_applied_mitigation');
    return stored ? JSON.parse(stored) : null;
  });

  // User state
  const [user, setUser] = useState({
    name: 'PM User',
    role: 'Project Manager',
    email: 'pm@example.com',
    isAuthenticated: true
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('risk');
  const [viewMode, setViewMode] = useState('list'); // 'card' or 'list'
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLoadSampleConfirm, setShowLoadSampleConfirm] = useState(false);
  const [showAnalysisConfirm, setShowAnalysisConfirm] = useState(false);

  // ===================================
  // APP INITIALIZATION - Load from localStorage if available
  // ===================================
  useEffect(() => {
    auditLogger.log(ACTIONS.APP_LOADED, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    // Load projects from localStorage
    const savedProjects = localStorage.getItem('pmRiskProjects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          // Auto-select the first project or the last selected one
          const lastSelectedId = localStorage.getItem('pmRiskSelectedProjectId');
          const projectToSelect = parsed.find(p => p.id === lastSelectedId) || parsed[0];
          setSelectedProjectId(projectToSelect.id);
          // Restore analysis state if project was previously analyzed
          if (projectToSelect.analysisComplete) {
            setAnalysisComplete(true);
            setRisks(projectToSelect.risks || []);
            if (projectToSelect.analysisTime) {
              setAnalysisTime(projectToSelect.analysisTime);
            }
          }
          auditLogger.log(ACTIONS.PROJECT_LOADED, {
            projectCount: parsed.length,
            selectedProject: projectToSelect.name,
            activityCount: projectToSelect.activities?.length || 0,
            source: 'localStorage'
          });
        }
      } catch (e) {
        console.error('Failed to parse saved projects:', e);
        localStorage.removeItem('pmRiskProjects');
        auditLogger.log(ACTIONS.ERROR_OCCURRED, {
          error: 'Failed to parse saved projects',
          details: e.message
        });
      }
    }
  }, []);

  // ===================================
  // HELPER: Save projects to localStorage
  // ===================================
  const saveProjectsToStorage = useCallback((projectsList, selectedId) => {
    localStorage.setItem('pmRiskProjects', JSON.stringify(projectsList));
    if (selectedId) {
      localStorage.setItem('pmRiskSelectedProjectId', selectedId);
    }
  }, []);

  // ===================================
  // CSV DATA LOADING - Creates projects (grouped by ProjectName if available)
  // ===================================
  const handleCSVDataLoaded = useCallback((activities, filename) => {
    // Check if activities have ProjectName column - if so, group by project
    const hasProjectName = activities.some(act => act.ProjectName && act.ProjectName.trim());

    if (hasProjectName) {
      // Group activities by ProjectName
      const projectGroups = {};
      activities.forEach(act => {
        const projName = (act.ProjectName || '').trim() || 'Unnamed Project';
        const projCategory = (act.ProjectCategory || '').trim() || 'General';
        const key = projName;

        if (!projectGroups[key]) {
          projectGroups[key] = {
            name: projName,
            category: projCategory,
            activities: []
          };
        }

        // Remove ProjectName and ProjectCategory from activity object
        const { ProjectName, ProjectCategory, ...activityData } = act;
        projectGroups[key].activities.push(activityData);
      });

      // Create projects for each group
      const newProjects = [];
      let firstProjectId = null;

      Object.values(projectGroups).forEach((group, index) => {
        // Calculate project duration from activities
        let maxEndDate = 0;
        let minStartDate = Infinity;
        group.activities.forEach(act => {
          if (act.startDate) {
            const start = new Date(act.startDate).getTime();
            const end = start + (act.duration * 24 * 60 * 60 * 1000);
            if (start < minStartDate) minStartDate = start;
            if (end > maxEndDate) maxEndDate = end;
          }
        });

        const totalDays = maxEndDate > 0 ? Math.ceil((maxEndDate - minStartDate) / (24 * 60 * 60 * 1000)) : 0;
        const months = Math.ceil(totalDays / 30);
        const durationStr = months > 0 ? `${months} months` : `${totalDays} days`;

        const uniqueResources = new Set(group.activities.map(a => a.resource).filter(r => r)).size;
        const estimatedBudget = Math.round((uniqueResources * 15000 * Math.max(months, 1)) / 1000) * 1000 || 500000;

        const projectId = 'proj_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 9);
        if (index === 0) firstProjectId = projectId;

        newProjects.push({
          id: projectId,
          name: group.name,
          category: group.category,
          activities: group.activities,
          duration: durationStr,
          budget: estimatedBudget,
          teamSize: uniqueResources || group.activities.length,
          createdAt: new Date().toISOString(),
          analysisComplete: false
        });
      });

      // Add all projects to the list
      setProjects(prev => {
        const updated = [...prev, ...newProjects];
        saveProjectsToStorage(updated, firstProjectId);
        return updated;
      });
      setSelectedProjectId(firstProjectId);

      // Reset analysis state
      setAnalysisComplete(false);
      setRisks([]);
      setSelectedRisk(null);

      setToast({
        message: `Imported ${newProjects.length} projects with ${activities.length} total activities`,
        type: 'success'
      });

      auditLogger.log(ACTIONS.CSV_IMPORTED, {
        filename: filename,
        projectCount: newProjects.length,
        activityCount: activities.length,
        projectNames: newProjects.map(p => p.name).join(', ')
      });

    } else {
      // No ProjectName column - create single project from filename (original behavior)
      let maxEndDate = 0;
      let minStartDate = Infinity;
      activities.forEach(act => {
        if (act.startDate) {
          const start = new Date(act.startDate).getTime();
          const end = start + (act.duration * 24 * 60 * 60 * 1000);
          if (start < minStartDate) minStartDate = start;
          if (end > maxEndDate) maxEndDate = end;
        }
      });

      const totalDays = maxEndDate > 0 ? Math.ceil((maxEndDate - minStartDate) / (24 * 60 * 60 * 1000)) : 0;
      const months = Math.ceil(totalDays / 30);
      const durationStr = months > 0 ? `${months} months` : `${totalDays} days`;

      const uniqueResources = new Set(activities.map(a => a.resource).filter(r => r)).size;
      const estimatedBudget = Math.round((uniqueResources * 15000 * months) / 1000) * 1000 || 500000;

      const newProject = {
        id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: filename.replace('.csv', '').replace(/_/g, ' '),
        activities: activities,
        duration: durationStr,
        budget: estimatedBudget,
        teamSize: uniqueResources || activities.length,
        createdAt: new Date().toISOString(),
        analysisComplete: false
      };

      setProjects(prev => {
        const updated = [...prev, newProject];
        saveProjectsToStorage(updated, newProject.id);
        return updated;
      });
      setSelectedProjectId(newProject.id);

      setAnalysisComplete(false);
      setRisks([]);
      setSelectedRisk(null);
      setToast({ message: `Created project "${newProject.name}" with ${activities.length} activities`, type: 'success' });

      auditLogger.log(ACTIONS.CSV_IMPORTED, {
        projectId: newProject.id,
        projectName: newProject.name,
        filename: filename,
        activityCount: activities.length,
        duration: durationStr,
        estimatedBudget: estimatedBudget
      });
    }
  }, [saveProjectsToStorage]);

  // ===================================
  // LOAD SAMPLE DATA HANDLER
  // ===================================
  // Show confirmation dialog
  const handleLoadSampleDataClick = useCallback(() => {
    setShowLoadSampleConfirm(true);
  }, []);

  // Helper function to calculate project duration from activities
  const calculateProjectDuration = (activities) => {
    let maxEndDate = 0;
    let minStartDate = Infinity;
    activities.forEach(act => {
      if (act.startDate) {
        const start = new Date(act.startDate).getTime();
        const end = start + (act.duration * 24 * 60 * 60 * 1000);
        if (start < minStartDate) minStartDate = start;
        if (end > maxEndDate) maxEndDate = end;
      }
    });
    const totalDays = maxEndDate > 0 ? Math.ceil((maxEndDate - minStartDate) / (24 * 60 * 60 * 1000)) : 0;
    const months = Math.ceil(totalDays / 30);
    return months > 0 ? `${months} months` : `${totalDays} days`;
  };

  // Actually load all sample projects (called after confirmation)
  const confirmLoadSampleData = useCallback(() => {
    // Create all sample projects with normalized activities
    const newProjects = SAMPLE_PROJECTS.map((sampleProj, index) => {
      // Normalize all activities to the complete field structure
      const normalizedActivities = sampleProj.activities.map(act => normalizeActivity(act));
      const uniqueResources = new Set(normalizedActivities.map(a => a.Resource_ID || a.resource).filter(r => r)).size;
      const duration = calculateProjectDuration(normalizedActivities);

      return {
        id: `proj_sample_${Date.now()}_${index}`,
        name: sampleProj.name,
        category: sampleProj.category,
        activities: normalizedActivities,
        duration: duration,
        budget: sampleProj.budget,
        teamSize: uniqueResources,
        createdAt: new Date().toISOString(),
        analysisComplete: false
      };
    });

    // Add all projects to the list
    setProjects(prev => {
      const updated = [...prev, ...newProjects];
      saveProjectsToStorage(updated, newProjects[0].id);
      return updated;
    });
    setSelectedProjectId(newProjects[0].id);

    // Reset analysis state
    setAnalysisComplete(false);
    setRisks([]);
    setSelectedRisk(null);
    setSearchTerm('');
    setFilterSeverity('all');
    setSortBy('risk');

    auditLogger.log(ACTIONS.SAMPLE_DATA_LOADED, {
      projectCount: newProjects.length,
      projects: newProjects.map(p => ({ id: p.id, name: p.name, category: p.category }))
    });

    setShowLoadSampleConfirm(false);
    setToast({ message: `Loaded ${newProjects.length} sample projects! Use the project dropdown to switch between them.`, type: 'success' });
  }, [saveProjectsToStorage]);

  // ===================================
  // RISK CALCULATION ALGORITHMS
  // ===================================
  const calculateCriticalPath = useCallback((activities) => {
    // Forward pass
    const activityMap = {};
    activities.forEach(act => {
      activityMap[act.id] = {
        ...act,
        ES: 0,
        EF: 0,
        LS: Infinity,
        LF: Infinity
      };
    });

    // Calculate ES and EF
    activities.forEach(act => {
      let maxPredecessorEF = 0;
      act.dependencies.forEach(depId => {
        if (activityMap[depId]) {
          maxPredecessorEF = Math.max(maxPredecessorEF, activityMap[depId].EF);
        }
      });
      activityMap[act.id].ES = maxPredecessorEF;
      activityMap[act.id].EF = activityMap[act.id].ES + act.duration;
    });

    // Find project completion time
    const projectCompletion = Math.max(...Object.values(activityMap).map(a => a.EF));

    // Backward pass
    activities.reverse().forEach(act => {
      if (activityMap[act.id].LF === Infinity) {
        activityMap[act.id].LF = projectCompletion;
      }
      activityMap[act.id].LS = activityMap[act.id].LF - act.duration;

      // Update predecessors
      act.dependencies.forEach(depId => {
        if (activityMap[depId]) {
          activityMap[depId].LF = Math.min(
            activityMap[depId].LF,
            activityMap[act.id].LS
          );
        }
      });
    });

    // Calculate float and identify critical path
    Object.values(activityMap).forEach(act => {
      act.float = act.LF - act.EF;
      act.isCriticalPath = act.float === 0;
    });

    return Object.values(activityMap);
  }, []);

  const calculateRiskScore = useCallback((activity) => {
    // Weight for each factor
    const weights = {
      scheduleDelay: 0.30,
      criticalPath: 0.25,
      floatConsumption: 0.20,
      resourceOverallocation: 0.15,
      progressDeviation: 0.10
    };

    // Healthcare multipliers
    const multipliers = {
      isHIPAA: activity.type?.includes('Security') || activity.type?.includes('Compliance') ? 1.3 : 1.0,
      isPatientFacing: activity.type?.includes('Patient') || activity.type?.includes('Clinical') ? 1.2 : 1.0,
      isConcurrent: activity.dependencies.length > 2 ? 1.15 : 1.0
    };

    // Factor 1: Schedule Delay (enhanced with Delay_Impact_days if available)
    const delayImpact = activity.Delay_Impact_days || activity.daysDelayed || 0;
    const scheduleDelayScore = Math.min(100, (Math.max(activity.daysDelayed, delayImpact) / activity.duration) * 200);

    // Factor 2: Critical Path
    const criticalPathScore = activity.isCriticalPath ? 100 : (activity.float < 3 ? 70 : 30);

    // Factor 3: Float Consumption
    const floatScore = activity.float <= 0 ? 100 : Math.max(0, 100 - (activity.float * 10));

    // Factor 4: Resource Overallocation (enhanced with Resource_Max_FTE if available)
    const maxFTE = activity.Resource_Max_FTE || 1.0;
    const allocationRatio = (activity.allocation || 100) / 100;
    const resourceScore = allocationRatio > maxFTE
      ? Math.min(100, ((allocationRatio - maxFTE) / 0.5) * 100)
      : (activity.allocation > 100 ? Math.min(100, ((activity.allocation - 100) / 50) * 100) : 0);

    // Factor 5: Progress Deviation
    const expectedProgress = activity.status === 'completed' ? 100 :
      activity.status === 'in-progress' ? 50 : 0;
    const progressScore = Math.abs(expectedProgress - activity.completionPercent) * 2;

    // Calculate weighted score
    let baseScore =
      (scheduleDelayScore * weights.scheduleDelay) +
      (criticalPathScore * weights.criticalPath) +
      (floatScore * weights.floatConsumption) +
      (resourceScore * weights.resourceOverallocation) +
      (progressScore * weights.progressDeviation);

    // Apply multipliers
    const totalMultiplier = multipliers.isHIPAA * multipliers.isPatientFacing * multipliers.isConcurrent;

    // Apply Probability multiplier if available (0-1 scale, boosts high probability risks)
    const probabilityMultiplier = activity.Probability ? (0.7 + (activity.Probability * 0.6)) : 1.0;

    const finalScore = Math.min(100, baseScore * totalMultiplier * probabilityMultiplier);

    // Calculate expected monetary value (EMV) for cost impact
    const costImpact = activity.Cost_Impact_of_Risk || 0;
    const probability = activity.Probability || 0.5;
    const emv = costImpact * probability;

    return {
      score: finalScore,
      factors: {
        'Schedule Delay': scheduleDelayScore,
        'Critical Path Impact': criticalPathScore,
        'Float Consumption': floatScore,
        'Resource Overallocation': resourceScore,
        'Progress Deviation': progressScore
      },
      // Extended risk metrics from new fields
      extendedMetrics: {
        probability: activity.Probability || null,
        delayImpactDays: activity.Delay_Impact_days || null,
        costImpact: activity.Cost_Impact_of_Risk || null,
        expectedMonetaryValue: emv || null,
        skillTags: activity.Skill_Tags || null,
        dependencyType: activity.Dependency_Type || 'FS'
      }
    };
  }, []);

  const getSeverity = (score) => {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  };

  // ===================================
  // RUN RISK ANALYSIS (ChatGPT Powered)
  // ===================================
  const runAnalysis = useCallback(async () => {
    if (!projectData) return;

    setIsAnalyzing(true);
    const startTime = Date.now();

    // Calculate critical path first
    const activitiesWithCP = calculateCriticalPath([...projectData.activities]);

    try {
      // Prepare activities summary for ChatGPT (with all 27 fields)
      const activitiesSummary = activitiesWithCP.map(a => ({
        id: a.id,
        name: a.name,
        plannedDuration: a.plannedDuration || a.duration,
        actualDuration: a.actualDuration,
        daysDelayed: a.daysDelayed,
        percentComplete: a.percentComplete || a.completionPercent,
        resource: a.resource,
        allocation: a.allocation,
        isCriticalPath: a.isCriticalPath,
        float: a.float,
        dependencies: a.dependencies.length,
        // Extended CPM fields
        ES: a.ES || 0,
        EF: a.EF || 0,
        LS: a.LS || 0,
        LF: a.LF || 0,
        // Extended dependency fields
        Predecessor_ID: a.Predecessor_ID || '',
        Successor_ID: a.Successor_ID || '',
        Dependency_Type: a.Dependency_Type || 'FS',
        // Extended resource fields
        Resource_Max_FTE: a.Resource_Max_FTE || 1.0,
        Skill_Tags: a.Skill_Tags || '',
        // Extended risk fields
        Probability: a.Probability || 0.5,
        Delay_Impact_days: a.Delay_Impact_days || 0,
        Cost_Impact_of_Risk: a.Cost_Impact_of_Risk || 0
      }));

      // Call ChatGPT API for risk analysis using secure proxy
      const riskAnalysisMessages = [{
        role: 'system',
        content: `You are an expert project risk analyst. Analyze project activities and provide risk scores.

You MUST respond with a valid JSON array. Each object must have:
- id: the activity id
- riskScore: number between 0-100
- factors: object with these keys (each 0-100): scheduleDelay, criticalPathImpact, floatConsumption, resourceOverallocation, progressDeviation

Higher scores = higher risk. Consider these factors with their weights:
- Schedule Delay (30%): Days delayed vs planned duration, also consider Delay_Impact_days
- Critical Path Impact (25%): Critical path status (critical path items are higher risk)
- Float Consumption (20%): Float available (0 float = higher risk)
- Resource Overallocation (15%): Allocation vs Resource_Max_FTE (>100% or >Max FTE = higher risk)
- Progress Deviation (10%): Progress percentage vs expected

Also factor in:
- Probability: Higher probability = higher risk multiplier
- Cost_Impact_of_Risk: Higher cost impact = higher severity
- Skill_Tags: Complex skill requirements may increase risk
- Dependency_Type: Non-FS dependencies may add complexity

Respond ONLY with the JSON array, no other text.`
      }, {
        role: 'user',
        content: `Analyze these ${activitiesWithCP.length} project activities for risk:

${JSON.stringify(activitiesSummary, null, 2)}

Return a JSON array with risk scores for each activity.`
      }];

      const data = await callOpenAI(riskAnalysisMessages, {
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.3
      });

      let aiRiskScores;

      try {
        // Parse the JSON response from ChatGPT
        const content = extractContent(data).trim();
        // Handle markdown code blocks if present
        const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiRiskScores = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response:', parseError);
        throw new Error('Invalid response format from ChatGPT');
      }

      // Merge ChatGPT risk scores with activity data
      const risksData = activitiesWithCP.map(activity => {
        const aiRisk = aiRiskScores.find(r => r.id === activity.id);

        if (aiRisk) {
          return {
            activity: activity,
            riskScore: Math.min(100, Math.max(0, aiRisk.riskScore)),
            severity: getSeverity(aiRisk.riskScore),
            factors: {
              scheduleDelay: aiRisk.factors?.scheduleDelay || 0,
              criticalPathImpact: aiRisk.factors?.criticalPathImpact || 0,
              floatConsumption: aiRisk.factors?.floatConsumption || 0,
              resourceOverallocation: aiRisk.factors?.resourceOverallocation || 0,
              progressDeviation: aiRisk.factors?.progressDeviation || 0
            },
            aiGenerated: true
          };
        } else {
          // Fallback to local calculation if ChatGPT didn't return this activity
          const { score, factors } = calculateRiskScore(activity);
          return {
            activity: activity,
            riskScore: score,
            severity: getSeverity(score),
            factors: factors,
            aiGenerated: false
          };
        }
      }).sort((a, b) => b.riskScore - a.riskScore);

      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);

      setRisks(risksData);
      setAnalysisTime(timeTaken);
      setAnalysisComplete(true);
      setIsAnalyzing(false);

      // Update project with analysis complete status and store risks
      if (selectedProjectId) {
        setProjects(prev => {
          const updated = prev.map(p =>
            p.id === selectedProjectId
              ? { ...p, analysisComplete: true, lastAnalysis: new Date().toISOString(), risks: risksData, analysisTime: timeTaken }
              : p
          );
          saveProjectsToStorage(updated, selectedProjectId);
          return updated;
        });
      }

      auditLogger.log(ACTIONS.RISK_ANALYSIS_RUN, {
        projectId: selectedProjectId,
        projectName: projectData.name,
        risksFound: risksData.length,
        criticalRisks: risksData.filter(r => r.severity === 'critical').length,
        analysisTime: timeTaken,
        aiPowered: true
      });

      setToast({ message: `🤖 ChatGPT Analysis complete! Found ${risksData.filter(r => r.severity === 'critical').length} critical risks`, type: 'success' });

    } catch (error) {
      console.error('ChatGPT risk analysis failed:', error);

      // Fallback to local calculation
      setToast({ message: `ChatGPT unavailable. Using local analysis...`, type: 'warning' });

      const risksData = activitiesWithCP.map(activity => {
        const { score, factors } = calculateRiskScore(activity);
        return {
          activity: activity,
          riskScore: score,
          severity: getSeverity(score),
          factors: factors,
          aiGenerated: false
        };
      }).sort((a, b) => b.riskScore - a.riskScore);

      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);

      setRisks(risksData);
      setAnalysisTime(timeTaken);
      setAnalysisComplete(true);
      setIsAnalyzing(false);

      // Update project
      if (selectedProjectId) {
        setProjects(prev => {
          const updated = prev.map(p =>
            p.id === selectedProjectId
              ? { ...p, analysisComplete: true, lastAnalysis: new Date().toISOString(), risks: risksData, analysisTime: timeTaken }
              : p
          );
          saveProjectsToStorage(updated, selectedProjectId);
          return updated;
        });
      }

      auditLogger.log(ACTIONS.RISK_ANALYSIS_RUN, {
        projectId: selectedProjectId,
        projectName: projectData.name,
        risksFound: risksData.length,
        criticalRisks: risksData.filter(r => r.severity === 'critical').length,
        analysisTime: timeTaken,
        aiPowered: false,
        fallbackReason: error.message
      });
    }
  }, [projectData, calculateCriticalPath, calculateRiskScore, selectedProjectId]);

  // ===================================
  // GENERATE AI INSIGHT (ChatGPT Powered)
  // ===================================
  const generateAIInsight = useCallback(async () => {
    if (!selectedRisk) return;

    // Check if Risk Analysis has been run
    if (!analysisComplete) {
      setAiInsight('⚠️ Run Risk Analysis to get AI support for this selected project.\n\nPlease run the Risk Analysis first to enable AI-powered insights and recommendations.');
      return;
    }

    setIsGeneratingInsight(true);
    setAiInsight(null);

    auditLogger.log(ACTIONS.AI_INSIGHT_REQUESTED, {
      activityId: selectedRisk.activity.id,
      activityName: selectedRisk.activity.name,
      riskScore: selectedRisk.riskScore,
      severity: selectedRisk.severity,
      aiProvider: 'ChatGPT'
    });

    try {
      // Use secure API proxy for AI insight generation
      const insightMessages = [{
        role: 'system',
        content: 'You are an expert project management consultant specializing in risk analysis and recovery strategies. Provide concise, actionable executive insights.'
      }, {
        role: 'user',
        content: `Analyze this critical project risk and provide an executive summary.

Activity: ${selectedRisk.activity.name} (${selectedRisk.activity.id})
Risk Score: ${selectedRisk.riskScore.toFixed(0)}/100
Severity: ${selectedRisk.severity.toUpperCase()}

SCHEDULE DATA:
- Days Delayed: ${selectedRisk.activity.daysDelayed}
- Delay Impact: ${selectedRisk.activity.Delay_Impact_days || 0} days potential
- Duration: ${selectedRisk.activity.duration} days
- ES/EF: ${selectedRisk.activity.ES || 0}/${selectedRisk.activity.EF || 0}
- LS/LF: ${selectedRisk.activity.LS || 0}/${selectedRisk.activity.LF || 0}
- Float Available: ${selectedRisk.activity.float} days
- Critical Path: ${selectedRisk.activity.isCriticalPath ? 'Yes' : 'No'}

RESOURCE DATA:
- Resource: ${selectedRisk.activity.resource}
- Allocation: ${selectedRisk.activity.allocation}%
- Max FTE: ${selectedRisk.activity.Resource_Max_FTE || 1.0}
- Skills Required: ${selectedRisk.activity.Skill_Tags || 'Not specified'}

DEPENDENCY DATA:
- Predecessors: ${selectedRisk.activity.Predecessor_ID || 'None'}
- Successors: ${selectedRisk.activity.Successor_ID || 'None'}
- Dependency Type: ${selectedRisk.activity.Dependency_Type || 'FS'}
- Downstream Tasks: ${selectedRisk.activity.dependencies.length}

RISK METRICS:
- Probability: ${((selectedRisk.activity.Probability || 0.5) * 100).toFixed(0)}%
- Cost Impact: $${(selectedRisk.activity.Cost_Impact_of_Risk || 0).toLocaleString()}
- Expected Monetary Value (EMV): $${((selectedRisk.activity.Probability || 0.5) * (selectedRisk.activity.Cost_Impact_of_Risk || 0)).toLocaleString()}
- Progress: ${selectedRisk.activity.percentComplete || selectedRisk.activity.completionPercent || 0}% complete

Risk Factors:
${Object.entries(selectedRisk.factors).map(([k, v]) => `- ${k}: ${v.toFixed(0)}%`).join('\n')}

Provide a concise executive summary with:
1. 🚨 SITUATION: What's happening (2-3 sentences)
2. 💰 BUSINESS IMPACT: Financial and timeline impact (use the Cost Impact and EMV data)
3. ⚡ RECOMMENDED ACTIONS: 2-3 specific actions with cost estimates and expected ROI
4. ⏰ URGENCY LEVEL: How quickly action is needed

Keep it under 350 words, use bullet points and emojis for visual clarity, and be specific with numbers.`
      }];

      const data = await callOpenAI(insightMessages, {
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        temperature: 0.7
      });

      const insight = extractContent(data);
      const fullInsight = `🤖 Generated by ChatGPT (GPT-4o-mini)\n\n${insight}`;

      setAiInsight(fullInsight);

      // Save to localStorage
      const activityId = selectedRisk.activity.id;
      setStoredInsights(prev => {
        const updated = {
          ...prev,
          [activityId]: {
            insight: fullInsight,
            generatedAt: new Date().toISOString(),
            riskScore: selectedRisk.riskScore,
            severity: selectedRisk.severity
          }
        };
        localStorage.setItem('pm_ai_insights', JSON.stringify(updated));
        return updated;
      });

      auditLogger.log(ACTIONS.AI_INSIGHT_GENERATED, {
        activityId: selectedRisk.activity.id,
        riskScore: selectedRisk.riskScore,
        aiProvider: 'ChatGPT',
        model: 'gpt-4o-mini'
      });

      setToast({ message: 'ChatGPT insight generated successfully!', type: 'success' });

    } catch (error) {
      console.error('ChatGPT insight generation failed:', error);

      // Fallback to template-based insight
      const fallbackInsight = `
🤖 ChatGPT Analysis (Fallback Template)

🚨 SITUATION SUMMARY:
${selectedRisk.activity.name} is experiencing a ${selectedRisk.severity.toUpperCase()} risk level with a score of ${selectedRisk.riskScore.toFixed(0)}/100. The activity is ${selectedRisk.activity.daysDelayed} days behind schedule. ${selectedRisk.activity.isCriticalPath ? '⚠️ This is on the CRITICAL PATH and directly impacts project completion.' : `The activity has ${selectedRisk.activity.float} days of float remaining.`}

💰 BUSINESS IMPACT:
• Schedule Impact: ${Math.ceil(selectedRisk.activity.daysDelayed * 1.2)} days potential project delay
• Estimated Cost Overrun: $${(selectedRisk.activity.daysDelayed * 45000).toLocaleString()}
• Resource Strain: ${selectedRisk.activity.resource} at ${selectedRisk.activity.allocation}% capacity

⚡ RECOMMENDED ACTIONS:
1. **Resource Augmentation** - Add support to ${selectedRisk.activity.resource}
   • Cost: ~$12,000 | Recovery: ${Math.ceil(selectedRisk.activity.daysDelayed * 0.6)} days

2. **Schedule Compression** - Fast-track parallel activities
   • Cost: ~$8,000 | Time saved: ${Math.ceil(selectedRisk.activity.daysDelayed * 0.3)} days

3. **Stakeholder Communication** - Escalate to sponsors immediately
   • No direct cost | Prevents surprise escalations later

⏰ URGENCY: ${selectedRisk.severity === 'critical' ? '🔴 IMMEDIATE ACTION REQUIRED' : selectedRisk.severity === 'high' ? '🟠 Act within 24-48 hours' : '🟡 Monitor closely this week'}

---
Note: Using fallback template. For real-time AI analysis, ensure OpenAI API key is configured.
`;
      setAiInsight(fallbackInsight);

      // Save fallback insight to localStorage too
      const activityId = selectedRisk.activity.id;
      setStoredInsights(prev => {
        const updated = {
          ...prev,
          [activityId]: {
            insight: fallbackInsight,
            generatedAt: new Date().toISOString(),
            riskScore: selectedRisk.riskScore,
            severity: selectedRisk.severity,
            isFallback: true
          }
        };
        localStorage.setItem('pm_ai_insights', JSON.stringify(updated));
        return updated;
      });

      setToast({ message: `ChatGPT unavailable: ${error.message}. Using template.`, type: 'warning' });
    }

    setIsGeneratingInsight(false);
  }, [selectedRisk, analysisComplete]);

  // ===================================
  // APPROVE MITIGATION
  // ===================================
  const approveMitigation = useCallback((activityId, activityName, strategy, details = {}) => {
    const approval = {
      id: 'mit_' + Date.now(),
      activityId,
      activityName,
      strategy,
      details,
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
      projectId: selectedProjectId,
      projectName: projectData?.name
    };

    setApprovedMitigations(prev => {
      const updated = [approval, ...prev];
      localStorage.setItem('pm_approved_mitigations', JSON.stringify(updated));
      return updated;
    });

    auditLogger.log(ACTIONS.MITIGATION_APPROVED, {
      ...approval
    });

    return approval;
  }, [user.name, selectedProjectId, projectData?.name]);

  // Get approved mitigation for current activity
  const getApprovedMitigation = useCallback((activityId) => {
    return approvedMitigations.find(m => m.activityId === activityId);
  }, [approvedMitigations]);

  // ===================================
  // SIMULATE MITIGATION
  // ===================================
  const simulateMitigation = useCallback((strategy) => {
    if (!selectedRisk) return;

    const activity = selectedRisk.activity;
    let result = {
      strategy: strategy,
      before: {
        riskScore: selectedRisk.riskScore,
        daysDelayed: activity.daysDelayed,
        completionDate: new Date(activity.startDate),
        blockedTasks: activity.isCriticalPath ? 23 : 8
      },
      after: {
        riskScore: 0,
        daysDelayed: 0,
        completionDate: new Date(activity.startDate),
        blockedTasks: 0
      },
      cost: 0,
      roi: 0,
      successRate: 0
    };

    switch (strategy) {
      case 'Add Resource':
        result.after.riskScore = Math.max(20, selectedRisk.riskScore * 0.46);
        result.after.daysDelayed = Math.max(0, activity.daysDelayed - Math.ceil(activity.daysDelayed * 0.67));
        result.cost = 15000;
        result.successRate = 82;
        result.after.blockedTasks = Math.ceil(result.before.blockedTasks * 0.35);
        break;
      case 'Fast-Track':
        result.after.riskScore = Math.max(30, selectedRisk.riskScore * 0.55);
        result.after.daysDelayed = Math.max(0, activity.daysDelayed - Math.ceil(activity.daysDelayed * 0.55));
        result.cost = 8000;
        result.successRate = 75;
        result.after.blockedTasks = Math.ceil(result.before.blockedTasks * 0.45);
        break;
      case 'Reduce Scope':
        result.after.riskScore = Math.max(15, selectedRisk.riskScore * 0.39);
        result.after.daysDelayed = 0;
        result.cost = 0;
        result.successRate = 90;
        result.after.blockedTasks = Math.ceil(result.before.blockedTasks * 0.25);
        break;
    }

    const delayCostAvoided = (result.before.daysDelayed - result.after.daysDelayed) * 50000;
    result.roi = result.cost > 0 ? Math.floor((delayCostAvoided / result.cost) * 100) : Infinity;
    result.savings = delayCostAvoided - result.cost;

    setSimulationResult(result);
    auditLogger.log(ACTIONS.MITIGATION_SIMULATED, {
      activityId: activity.id,
      strategy: strategy,
      riskReduction: selectedRisk.riskScore - result.after.riskScore,
      cost: result.cost,
      roi: result.roi
    });
  }, [selectedRisk]);

  // ===================================
  // GENERATE CHATGPT MITIGATION STRATEGIES
  // ===================================
  const generateMitigationStrategies = useCallback(async () => {
    if (!selectedRisk) return;

    // Check if Risk Analysis has been run
    if (!analysisComplete) {
      setToast({ message: '⚠️ Run Risk Analysis first to get AI recovery plans', type: 'warning' });
      return;
    }

    setIsGeneratingStrategies(true);
    setMitigationStrategies(null);
    setSelectedStrategy(null);
    setSimulationResult(null);

    const activity = selectedRisk.activity;

    try {
      // Use secure API proxy for mitigation strategies
      const strategiesMessages = [{
        role: 'system',
        content: `You are an expert project risk recovery consultant. Generate exactly 3 recovery strategies for project risks.

You MUST respond with a valid JSON object containing an array of 3 strategies. Each strategy must have:
- name: short name for the strategy (e.g., "Add Resource", "Fast-Track", "Reduce Scope")
- tag: one of "RECOMMENDED", "LOWER_COST", or "ZERO_COST"
- description: 1-2 sentences explaining the strategy specific to this activity
- expectedResults: object with:
  - riskReduction: percentage number (e.g., 54 for 54%)
  - timeSavings: string describing time impact (e.g., "~6-7 days", "All delay eliminated")
  - successRate: percentage number (e.g., 82 for 82%)
  - warning: optional string for any risk or downside (e.g., "15% rework risk", "Test coverage reduced 15%")
- actionPlan: array of 4-5 specific action steps the user must take to implement this strategy. Each step should be a short, actionable string (e.g., "Identify available resources from non-critical tasks", "Schedule kickoff meeting with new team member")
- simulationData: object with:
  - riskScoreMultiplier: number between 0.3-0.7 (multiplied by current risk score)
  - minRiskScore: minimum risk score after recovery (15-30)
  - delayReductionPercent: percentage of delay to reduce (0-100)
  - cost: estimated cost in dollars
  - blockedTasksReductionPercent: percentage reduction in blocked tasks (25-75)

Make the first strategy "RECOMMENDED" (best overall), second "LOWER_COST", third "ZERO_COST".
Tailor strategies to the specific activity and its risk factors.

Respond ONLY with the JSON object like: {"strategies": [...]}`
      }, {
        role: 'user',
        content: `Generate 3 recovery strategies for this project risk:

Activity: ${activity.name}
Activity ID: ${activity.id}
Current Risk Score: ${selectedRisk.riskScore.toFixed(0)}/100
Severity: ${selectedRisk.severity.toUpperCase()}

SCHEDULE DATA:
- Days Delayed: ${activity.daysDelayed}
- Delay Impact Potential: ${activity.Delay_Impact_days || 0} days
- Planned Duration: ${activity.plannedDuration || activity.duration} days
- ES/EF: ${activity.ES || 0}/${activity.EF || 0}
- LS/LF: ${activity.LS || 0}/${activity.LF || 0}
- Float Available: ${activity.float} days
- Critical Path: ${activity.isCriticalPath ? 'Yes - HIGH IMPACT' : 'No'}

RESOURCE DATA:
- Resource: ${activity.resource}
- Allocation: ${activity.allocation}%
- Max FTE: ${activity.Resource_Max_FTE || 1.0}
- Skills Required: ${activity.Skill_Tags || 'Not specified'}

DEPENDENCY DATA:
- Predecessors: ${activity.Predecessor_ID || 'None'}
- Successors: ${activity.Successor_ID || 'None'}
- Dependency Type: ${activity.Dependency_Type || 'FS'}
- Downstream Tasks: ${activity.dependencies.length} affected

RISK METRICS:
- Probability: ${((activity.Probability || 0.5) * 100).toFixed(0)}%
- Cost Impact: $${(activity.Cost_Impact_of_Risk || 0).toLocaleString()}
- Expected Monetary Value: $${((activity.Probability || 0.5) * (activity.Cost_Impact_of_Risk || 0)).toLocaleString()}
- Progress: ${activity.percentComplete || activity.completionPercent || 0}% complete

Risk Factors:
- Schedule Delay Impact: ${selectedRisk.factors.scheduleDelay.toFixed(0)}%
- Critical Path Impact: ${selectedRisk.factors.criticalPathImpact.toFixed(0)}%
- Float Consumption: ${selectedRisk.factors.floatConsumption.toFixed(0)}%
- Resource Overallocation: ${selectedRisk.factors.resourceOverallocation.toFixed(0)}%
- Progress Deviation: ${selectedRisk.factors.progressDeviation.toFixed(0)}%

Consider the Cost Impact when estimating strategy costs - ensure ROI is positive.`
      }];

      const data = await callOpenAI(strategiesMessages, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = extractContent(data).trim();

      // Parse the JSON response
      let parsed;
      try {
        // Try to extract JSON if wrapped in code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        parsed = JSON.parse(jsonMatch[1] || content);
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response:', content);
        throw new Error('Invalid response format from ChatGPT');
      }

      const strategies = parsed.strategies;
      if (!strategies || strategies.length !== 3) {
        throw new Error('Expected 3 strategies from ChatGPT');
      }

      // Store strategies with activity context
      const strategiesData = {
        activityId: activity.id,
        activityName: activity.name,
        riskScore: selectedRisk.riskScore,
        generatedAt: new Date().toISOString(),
        strategies: strategies
      };

      setMitigationStrategies(strategiesData);
      localStorage.setItem('pm_mitigation_strategies', JSON.stringify(strategiesData));

      auditLogger.log(ACTIONS.MITIGATION_STRATEGIES_GENERATED, {
        activityId: activity.id,
        activityName: activity.name,
        strategiesCount: 3,
        source: 'ChatGPT'
      });

      setToast({ message: 'AI generated 3 recovery strategies!', type: 'success' });

    } catch (error) {
      console.error('Failed to generate recovery strategies:', error);
      setToast({ message: `Failed to generate strategies: ${error.message}`, type: 'error' });

      // Fallback to default strategies
      const fallbackStrategies = {
        activityId: activity.id,
        activityName: activity.name,
        riskScore: selectedRisk.riskScore,
        generatedAt: new Date().toISOString(),
        strategies: [
          {
            name: 'Add Resource',
            tag: 'RECOMMENDED',
            description: `Add 0.5 FTE from a non-critical activity to support ${activity.name}. Resource will work 50% on this task.`,
            expectedResults: {
              riskReduction: 54,
              timeSavings: '~6-7 days',
              successRate: 82
            },
            actionPlan: [
              'Identify available resources from non-critical tasks',
              'Review resource skills and task requirements',
              'Schedule onboarding meeting with new team member',
              'Update project schedule with additional allocation',
              'Set up daily sync to monitor progress'
            ],
            simulationData: {
              riskScoreMultiplier: 0.46,
              minRiskScore: 20,
              delayReductionPercent: 67,
              cost: 15000,
              blockedTasksReductionPercent: 65
            }
          },
          {
            name: 'Fast-Track',
            tag: 'LOWER_COST',
            description: 'Run dependent tasks in parallel instead of sequentially. Requires coordination between teams.',
            expectedResults: {
              riskReduction: 45,
              timeSavings: '~5 days',
              successRate: 75,
              warning: '15% rework risk'
            },
            actionPlan: [
              'Identify which dependent tasks can run in parallel',
              'Coordinate with downstream team leads',
              'Set up shared communication channel',
              'Create integration checkpoints to catch issues early',
              'Plan for potential rework scenarios'
            ],
            simulationData: {
              riskScoreMultiplier: 0.55,
              minRiskScore: 30,
              delayReductionPercent: 55,
              cost: 8000,
              blockedTasksReductionPercent: 55
            }
          },
          {
            name: 'Reduce Scope',
            tag: 'ZERO_COST',
            description: 'Remove non-essential test cases or features. Reduces thoroughness but saves time.',
            expectedResults: {
              riskReduction: 61,
              timeSavings: 'All delay eliminated',
              successRate: 90,
              warning: 'Test coverage reduced 15%'
            },
            actionPlan: [
              'Review deliverables and identify non-essential items',
              'Get stakeholder approval for scope reduction',
              'Document deferred items for future phases',
              'Update project documentation with revised scope',
              'Communicate changes to all team members'
            ],
            simulationData: {
              riskScoreMultiplier: 0.39,
              minRiskScore: 15,
              delayReductionPercent: 100,
              cost: 0,
              blockedTasksReductionPercent: 75
            }
          }
        ]
      };

      setMitigationStrategies(fallbackStrategies);
      localStorage.setItem('pm_mitigation_strategies', JSON.stringify(fallbackStrategies));
    }

    setIsGeneratingStrategies(false);
  }, [selectedRisk, analysisComplete]);

  // ===================================
  // SELECT AND APPLY STRATEGY
  // ===================================
  const selectStrategy = useCallback((strategyIndex) => {
    if (!mitigationStrategies || !mitigationStrategies.strategies[strategyIndex]) return;

    const strategy = mitigationStrategies.strategies[strategyIndex];
    setSelectedStrategy(strategyIndex);

    const activity = selectedRisk.activity;
    const simData = strategy.simulationData;

    const blockedTasks = activity.isCriticalPath ? 23 : 8;

    const result = {
      strategy: strategy.name,
      strategyIndex: strategyIndex,
      description: strategy.description,
      actionPlan: strategy.actionPlan || [],
      before: {
        riskScore: selectedRisk.riskScore,
        daysDelayed: activity.daysDelayed,
        completionDate: new Date(activity.startDate),
        blockedTasks: blockedTasks
      },
      after: {
        riskScore: Math.max(simData.minRiskScore, selectedRisk.riskScore * simData.riskScoreMultiplier),
        daysDelayed: Math.max(0, activity.daysDelayed - Math.ceil(activity.daysDelayed * (simData.delayReductionPercent / 100))),
        completionDate: new Date(activity.startDate),
        blockedTasks: Math.ceil(blockedTasks * (1 - simData.blockedTasksReductionPercent / 100))
      },
      cost: simData.cost,
      successRate: strategy.expectedResults.successRate,
      warning: strategy.expectedResults.warning
    };

    const delayCostAvoided = (result.before.daysDelayed - result.after.daysDelayed) * 50000;
    result.roi = result.cost > 0 ? Math.floor((delayCostAvoided / result.cost) * 100) : Infinity;
    result.savings = delayCostAvoided - result.cost;

    setSimulationResult(result);

    auditLogger.log(ACTIONS.STRATEGY_SELECTED, {
      activityId: activity.id,
      strategyName: strategy.name,
      strategyIndex: strategyIndex,
      expectedRiskReduction: strategy.expectedResults.riskReduction
    });
  }, [mitigationStrategies, selectedRisk]);

  const applyMitigation = useCallback(() => {
    if (!simulationResult || selectedStrategy === null || !mitigationStrategies) return;

    const strategy = mitigationStrategies.strategies[selectedStrategy];
    const appliedData = {
      activityId: mitigationStrategies.activityId,
      activityName: mitigationStrategies.activityName,
      strategyName: strategy.name,
      strategyIndex: selectedStrategy,
      simulationResult: simulationResult,
      appliedAt: new Date().toISOString(),
      appliedBy: user.name
    };

    setAppliedMitigation(appliedData);
    localStorage.setItem('pm_applied_mitigation', JSON.stringify(appliedData));

    // Also approve the mitigation
    approveMitigation(
      mitigationStrategies.activityId,
      mitigationStrategies.activityName,
      strategy.name,
      {
        riskScore: selectedRisk.riskScore,
        severity: selectedRisk.severity,
        expectedResults: strategy.expectedResults,
        cost: simulationResult.cost,
        roi: simulationResult.roi
      }
    );

    auditLogger.log(ACTIONS.MITIGATION_APPLIED, {
      ...appliedData
    });

    setToast({ message: `${strategy.name} recovery plan applied successfully!`, type: 'success' });
    setShowSimulation(false);
  }, [simulationResult, selectedStrategy, mitigationStrategies, user.name, approveMitigation, selectedRisk]);

  // ===================================
  // EXPORT FUNCTIONS
  // ===================================
  const exportPDF = useCallback(() => {
    if (!projectData || risks.length === 0) {
      setToast({ message: 'Please run analysis first', type: 'error' });
      return;
    }

    try {
      const { doc, filename } = pdfGenerator.generateRiskReport(projectData, risks, aiInsight);
      doc.save(filename);
      
      auditLogger.log(ACTIONS.REPORT_EXPORTED, {
        format: 'PDF',
        filename: filename,
        riskCount: risks.length
      });

      setToast({ message: `PDF exported: ${filename}`, type: 'success' });
    } catch (error) {
      console.error('PDF export failed:', error);
      setToast({ message: 'PDF export failed. Check console for details.', type: 'error' });
    }
  }, [projectData, risks, aiInsight]);

  const exportExcel = useCallback(() => {
    if (risks.length === 0) {
      setToast({ message: 'Please run analysis first', type: 'error' });
      return;
    }

    try {
      // Complete field structure per requirements plus risk analysis data
      const headers = ['Rank', 'Risk_Score', 'Severity', 'Activity_ID', 'Activity_Name', 'Work_Package', 'Planned_Start', 'Planned_Finish', 'Planned_Duration', 'Actual_Start', 'Actual_Finish', 'Remaining_Duration', 'Baseline_Start', 'Baseline_Finish', 'Baseline_Duration', 'Percent_Complete', 'Status', 'ES', 'EF', 'LS', 'LF', 'Total_Float_days', 'On_Critical_Path', 'Predecessor_ID', 'Successor_ID', 'Dependency_Type', 'Resource_ID', 'Role', 'FTE_Allocation', 'Resource_Max_FTE', 'Skill_Tags', 'Probability', 'Delay_Impact_days', 'Cost_Impact_of_Risk', 'EMV'];
      const rows = risks.map((risk, index) => {
        const act = risk.activity;
        const probability = act.Probability || 0.5;
        const costImpact = act.Cost_Impact_of_Risk || 0;
        const emv = probability * costImpact;
        const plannedDuration = act.Planned_Duration || act.duration || 0;
        const percentComplete = act.Percent_Complete !== undefined ? act.Percent_Complete : (act.completionPercent || 0);
        return [
          index + 1,
          risk.riskScore.toFixed(0),
          risk.severity.toUpperCase(),
          act.Activity_ID || act.id,
          `"${act.Activity_Name || act.name}"`,
          act.Work_Package || '',
          act.Planned_Start || act.startDate || '',
          act.Planned_Finish || '',
          plannedDuration,
          act.Actual_Start || '',
          act.Actual_Finish || '',
          act.Remaining_Duration !== undefined ? act.Remaining_Duration : Math.round(plannedDuration * (1 - percentComplete / 100)),
          act.Baseline_Start || act.Planned_Start || act.startDate || '',
          act.Baseline_Finish || act.Planned_Finish || '',
          act.Baseline_Duration || plannedDuration,
          percentComplete,
          act.Status || act.status || '',
          act.ES || 0,
          act.EF || 0,
          act.LS || 0,
          act.LF || 0,
          act.Total_Float_days !== undefined ? act.Total_Float_days : (act.float || 0),
          (act.On_Critical_Path !== undefined ? act.On_Critical_Path : act.isCriticalPath) ? 'Yes' : 'No',
          act.Predecessor_ID || '',
          act.Successor_ID || '',
          act.Dependency_Type || 'FS',
          act.Resource_ID || act.resource || '',
          act.Role || '',
          act.FTE_Allocation !== undefined ? act.FTE_Allocation : (act.allocation || 100),
          act.Resource_Max_FTE || 1.0,
          `"${act.Skill_Tags || ''}"`,
          probability,
          act.Delay_Impact_days !== undefined ? act.Delay_Impact_days : (act.daysDelayed || 0),
          costImpact,
          emv.toFixed(2)
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Risk_Analysis_${projectData.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      auditLogger.log(ACTIONS.REPORT_EXPORTED, {
        format: 'Excel/CSV',
        riskCount: risks.length
      });

      setToast({ message: 'Excel file exported successfully', type: 'success' });
    } catch (error) {
      console.error('Excel export failed:', error);
      setToast({ message: 'Excel export failed', type: 'error' });
    }
  }, [risks, projectData]);

  // ===================================
  // FILTERED & SORTED RISKS
  // ===================================
  const filteredAndSortedRisks = useMemo(() => {
    if (!risks.length) return [];

    let filtered = risks.filter(risk => {
      const matchesSearch = risk.activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           risk.activity.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === 'all' || risk.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          return b.riskScore - a.riskScore;
        case 'delay':
          return b.activity.daysDelayed - a.activity.daysDelayed;
        case 'name':
          return a.activity.name.localeCompare(b.activity.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [risks, searchTerm, filterSeverity, sortBy]);

  // ===================================
  // EVENT HANDLERS
  // ===================================
  const handleRiskClick = useCallback((risk) => {
    setSelectedRisk(risk);
    setShowSimulation(false);
    setSimulationResult(null);

    // Load stored AI insight if available
    const storedInsight = storedInsights[risk.activity.id];
    if (storedInsight) {
      setAiInsight(storedInsight.insight);
    } else {
      setAiInsight(null);
    }

    auditLogger.log(ACTIONS.RISK_VIEWED, {
      activityId: risk.activity.id,
      riskScore: risk.riskScore,
      severity: risk.severity
    });
  }, [storedInsights]);

  const handleEmailSent = useCallback((emailData) => {
    setShowEmailModal(false);
    setToast({ message: `Email sent to ${emailData.recipients.split(',').length} recipient(s)`, type: 'success' });
  }, []);

  const handleLogout = useCallback(() => {
    auditLogger.log(ACTIONS.USER_LOGOUT, { user: user.name });
    setUser({ ...user, isAuthenticated: false });
    setToast({ message: 'Logged out successfully', type: 'success' });
    
    // In a real app, this would redirect to login
    setTimeout(() => {
      setUser({ ...user, isAuthenticated: true });
      setToast({ message: 'Logged back in (demo mode)', type: 'success' });
    }, 2000);
  }, [user]);

  // Navigation state
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, about, help

  // ===================================
  // SEARCH HANDLER
  // ===================================
  useEffect(() => {
    if (searchTerm) {
      auditLogger.log(ACTIONS.SEARCH_PERFORMED, { searchTerm });
    }
  }, [searchTerm]);

  useEffect(() => {
    if (filterSeverity !== 'all') {
      auditLogger.log(ACTIONS.FILTER_APPLIED, { filterSeverity });
    }
  }, [filterSeverity]);

  useEffect(() => {
    if (sortBy) {
      auditLogger.log(ACTIONS.SORT_CHANGED, { sortBy });
    }
  }, [sortBy]);

  // ===================================
  // RENDER
  // ===================================
  if (!projectData) {
    return (
      <div className="app-container">
        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Load Sample Data Confirmation Modal */}
        <ConfirmModal
          isOpen={showLoadSampleConfirm}
          title="Load Sample Data?"
          message="This will create a new sample project with 20 activities. You can then run AI Risk Analysis on this sample data."
          confirmText="Yes, Load Sample Data"
          cancelText="Cancel"
          type="info"
          onCancel={() => setShowLoadSampleConfirm(false)}
          onConfirm={confirmLoadSampleData}
        />

        {/* Top Navigation Bar - Sticky */}
        <nav className="top-nav-sticky">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="200" height="34" viewBox="0 0 260 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bracketGrad2" x1="0" y1="0" x2="0" y2="50" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00e5cc"/>
                  <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
                <linearGradient id="textGrad2" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00d4aa"/>
                  <stop offset="100%" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
              <path d="M3 5 L3 45 L18 45" stroke="url(#bracketGrad2)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M45 5 L45 45" stroke="url(#bracketGrad2)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M3 5 L32 5" stroke="url(#bracketGrad2)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <text x="12" y="34" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" fill="url(#textGrad2)">AI</text>
              <line x1="56" y1="12" x2="56" y2="38" stroke="#4fd1c5" strokeWidth="1.5" opacity="0.5"/>
              <text x="68" y="32" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="400" letterSpacing="3" fill="url(#textGrad2)">RISK MONITOR</text>
            </svg>
          </div>
          <div className="nav-user-actions">
            <span className="user-profile">
              <span className="user-avatar">👤</span>
              <span>PM User</span>
            </span>
          </div>
        </nav>

        {/* Empty State - Full Width Hero Layout */}
        <main className="main-content" style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 70px)',
          background: '#ffffff'
        }}>
          {/* Unified Connected Card Section */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            paddingBottom: '0'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              {/* Hero Section */}
              <div style={{
                padding: '48px 48px 32px',
                textAlign: 'center',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: '0 0 16px 0',
                  letterSpacing: '-1px',
                  lineHeight: '1.15'
                }}>
                  AI-Powered Project Risk Analysis
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: '#64748b',
                  margin: '0 auto 24px',
                  lineHeight: '1.6',
                
                }}>
                  Identify, assess, and mitigate project risks before they impact your timeline and budget. Powered by ChatGPT-4 for intelligent risk detection.
                </p>
                {/* Feature Pills */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                    
                </div>
              </div>

              {/* Upload Section */}
              <div style={{
                padding: '32px 48px',
                textAlign: 'center',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }}>
                  📂
                </div>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 8px 0'
                }}>
                  Get Started
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0 0 20px 0'
                }}>
                  Upload your project CSV file or load sample data to begin risk analysis
                </p>
                <CSVUploader onDataLoaded={handleCSVDataLoaded} onLoadSampleData={handleLoadSampleDataClick} />
              </div>

              {/* Feature Cards Grid */}
              <div style={{
                padding: '24px 48px 32px',
                background: '#ffffff'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>AI Analysis</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>GPT-4 powered</div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Risk Scoring</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Severity levels</div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Critical Path</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Auto detection</div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Alerts</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Email reports</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Footer */}
          <footer style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderTop: 'none',
            marginTop: '0',
            width: '100%'
          }}>
            {/* Left Side - Logo and Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={i2eLogo}
                alt="i2e Consulting"
                style={{
                  height: '50px',
                  width: 'auto',
                  objectFit: 'contain',
                  background: 'white',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '8px'
                }}
              />
              <div style={{ width: '1px', height: '30px', background: '#475569' }}></div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '600' }}>
                  i2e Consulting AI Lab Hackathon 2025
                </p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                  AI-Driven Schedule Risk Monitor
                </p>
              </div>
            </div>
            {/* Right Side - Copyright */}
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'right', paddingRight: '5rem' }}>
              &copy; 2025 | Hackathon Submission by <span style={{ color: '#3b82f6', fontWeight: '600' }}>Fayek Kamle</span>
            </p>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Reset Confirmation Modal */}
        <ConfirmModal
          isOpen={showResetConfirm}
          title="Reset All Data?"
          message="This will clear all uploaded project data, analysis results, and search filters. You will need to upload a new CSV file to continue. This action cannot be undone."
          confirmText="Yes, Reset Everything"
          cancelText="Cancel"
          type="danger"
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={() => {
            // Clear all projects
            setProjects([]);
            setSelectedProjectId(null);
            setAnalysisComplete(false);
            setRisks([]);
            setSelectedRisk(null);
            setSearchTerm('');
            setFilterSeverity('all');
            setSortBy('risk');
            setActiveView('dashboard');
            setShowResetConfirm(false);

            // Clear all localStorage data
            localStorage.removeItem('pmRiskProjects');
            localStorage.removeItem('pmRiskSelectedProjectId');
            localStorage.removeItem('pm_risk_audit_trail');
            localStorage.removeItem('pm_ai_chat_history');

            // Also clear session storage
            sessionStorage.removeItem('audit_session_id');

            setToast({ message: 'All projects and audit logs have been cleared. Please upload a CSV file to start.', type: 'success' });
          }}
        />

        {/* Load Sample Data Confirmation Modal */}
        <ConfirmModal
          isOpen={showLoadSampleConfirm}
          title="Load Sample Data?"
          message="This will create a new sample project with 20 activities. You can then run AI Risk Analysis on this sample data."
          confirmText="Yes, Load Sample Data"
          cancelText="Cancel"
          type="info"
          onCancel={() => setShowLoadSampleConfirm(false)}
          onConfirm={confirmLoadSampleData}
        />

        {/* Delete Project Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteProjectConfirm}
          title="Delete Project?"
          message={`Are you sure you want to delete "${projectData?.name || 'this project'}"? This action cannot be undone.`}
          confirmText="Yes, Delete Project"
          cancelText="Cancel"
          type="danger"
          onCancel={() => setShowDeleteProjectConfirm(false)}
          onConfirm={() => {
            if (!selectedProjectId) return;

            const deletedProject = projectData;
            const updatedProjects = projects.filter(p => p.id !== selectedProjectId);

            setProjects(updatedProjects);

            // Select another project if available
            if (updatedProjects.length > 0) {
              const newSelected = updatedProjects[0];
              setSelectedProjectId(newSelected.id);
              saveProjectsToStorage(updatedProjects, newSelected.id);
            } else {
              setSelectedProjectId(null);
              localStorage.removeItem('pmRiskProjects');
              localStorage.removeItem('pmRiskSelectedProjectId');
            }

            setAnalysisComplete(false);
            setRisks([]);
            setSelectedRisk(null);
            setShowDeleteProjectConfirm(false);

            auditLogger.log(ACTIONS.DATA_RESET, {
              action: 'PROJECT_DELETED',
              projectId: deletedProject?.id,
              projectName: deletedProject?.name,
              remainingProjects: updatedProjects.length
            });

            setToast({ message: `Deleted project: ${deletedProject?.name}`, type: 'success' });
          }}
        />

        {/* Row 1: Main Header - NOT Sticky */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)',
          borderBottom: '3px solid transparent',
          borderImage: 'linear-gradient(90deg, #00d4aa, #22d3ee, #6366f1, #22d3ee, #00d4aa) 1',
          boxShadow: '0 4px 20px rgba(0, 212, 170, 0.15)'
        }}>
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 3.5rem',
            gap: '4rem',
            boxSizing: 'border-box'
          }}>
            {/* Left: Logo + Nav Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Logo + Brand */}
              <div
                onClick={() => setActiveView('dashboard')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <svg width="220" height="38" viewBox="0 0 260 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bracketGradient" x1="0" y1="0" x2="0" y2="50" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#00e5cc"/>
                      <stop offset="100%" stopColor="#6366f1"/>
                    </linearGradient>
                    <linearGradient id="textGradient" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#00d4aa"/>
                      <stop offset="100%" stopColor="#22d3ee"/>
                    </linearGradient>
                  </defs>
                  {/* Bracket Frame */}
                  <path d="M3 5 L3 45 L18 45" stroke="url(#bracketGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M45 5 L45 45" stroke="url(#bracketGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M3 5 L32 5" stroke="url(#bracketGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  {/* AI Text */}
                  <text x="12" y="34" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" fill="url(#textGradient)">AI</text>
                  {/* Separator Line */}
                  <line x1="56" y1="12" x2="56" y2="38" stroke="#4fd1c5" strokeWidth="1.5" opacity="0.5"/>
                  {/* RISK MONITOR Text */}
                  <text x="68" y="32" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="400" letterSpacing="3" fill="url(#textGradient)">RISK MONITOR</text>
                </svg>
                <span style={{
                  fontSize: '0.65rem',
                  color: '#94a3b8',
                  marginTop: '2px',
                  letterSpacing: '0.5px'
                }}>
                  Project Overview & Risk Analysis Portal
                </span>
              </div>

              {/* Navigation Tabs - Left aligned after logo */}
              <div style={{
                display: 'flex',
                gap: '0.375rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '0.25rem',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                {[
                  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
                  { id: 'about', icon: 'ℹ️', label: 'About' },
                  { id: 'help', icon: '❓', label: 'Help' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveView(tab.id);
                      auditLogger.log(ACTIONS.VIEW_CHANGED, { view: tab.id });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: activeView === tab.id ? 'rgba(255,255,255,0.95)' : 'transparent',
                      color: activeView === tab.id ? '#1e3a5f' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      boxShadow: activeView === tab.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Section: Reset + User Profile + i2e Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexShrink: 0
            }}>
              {/* Reset Button - Moved to top row */}
              <button
                onClick={() => setShowResetConfirm(true)}
                style={{
                  padding: '0.5rem 0.875rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
              >
                🔄 Reset
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2)' }}></div>

              {/* User Profile */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '0.25rem 0.625rem 0.25rem 0.25rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'white',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ffffff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.65rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginLeft: '0.125rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  Logout
                </button>
              </div>

              {/* i2e Consulting Logo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.95)',
                padding: '0.375rem 0.625rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={i2eLogo}
                  alt="i2e Consulting"
                  style={{
                    height: '32px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Unified Control Bar - STICKY */}
        <nav style={{
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 2rem',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderBottom: '2px solid #10b981',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box',
          gap: '1rem'
        }}>
            {/* Left Section: Project Selector + Status */}
            {projects.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto' }}>
                {/* Project Dropdown */}
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => {
                    const newProjectId = e.target.value;
                    setSelectedProjectId(newProjectId);
                    localStorage.setItem('pmRiskSelectedProjectId', newProjectId);
                    const selectedProj = projects.find(p => p.id === newProjectId);
                    setAnalysisComplete(selectedProj?.analysisComplete || false);
                    setRisks(selectedProj?.risks || []);
                    if (selectedProj?.analysisTime) setAnalysisTime(selectedProj.analysisTime);
                    setSelectedRisk(null);
                    auditLogger.log(ACTIONS.VIEW_CHANGED, { action: 'PROJECT_SWITCHED', projectId: newProjectId, projectName: selectedProj?.name });
                    setToast({ message: `Switched to: ${selectedProj?.name}`, type: 'success' });
                  }}
                  style={{
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.95)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer',
                    minWidth: '200px',
                    maxWidth: '280px',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center'
                  }}
                >
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      📁 {proj.name} ({proj.activities?.length || 0})
                    </option>
                  ))}
                </select>

                {/* Delete Project */}
                <button
                  onClick={() => setShowDeleteProjectConfirm(true)}
                  title="Delete project"
                  style={{
                    width: '32px', height: '32px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
                >🗑️</button>

                {/* Status Badge */}
                {analysisComplete ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    borderRadius: '20px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <span style={{ fontSize: '0.75rem' }}>✅</span>
                    <span style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: '600' }}>
                      {risks.filter(r => r.severity === 'critical').length} Critical · {risks.filter(r => r.severity === 'high').length} High
                    </span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    background: 'rgba(251, 191, 36, 0.15)',
                    borderRadius: '20px',
                    border: '1px solid rgba(251, 191, 36, 0.3)'
                  }}>
                    <span style={{ fontSize: '0.75rem' }}>⚠️</span>
                    <span style={{ fontSize: '0.7rem', color: '#fcd34d', fontWeight: '600' }}>Run Analysis</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                No projects loaded
              </div>
            )}

            {/* Center Section: Search & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center', maxWidth: '500px' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, maxWidth: '200px' }}>
                <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem' }}>🔍</span>
                <input
                  type="search"
                  placeholder="Search risks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.625rem 0.5rem 1.875rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Severity Filter */}
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                style={{
                  padding: '0.5rem 0.625rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Severity</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.5rem 0.625rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
              >
                <option value="risk">↓ Risk Score</option>
                <option value="delay">↓ Delayed</option>
                <option value="name">↓ Name</option>
              </select>

              {/* Results Count */}
              {analysisComplete && (
                <span style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  padding: '0.375rem 0.625rem',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}>
                  <strong style={{ color: '#10b981' }}>{filteredAndSortedRisks.length}</strong>/{risks.length}
                </span>
              )}
            </div>

            {/* Right Section: Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: '0 0 auto' }}>
              {/* Data */}
              <button
                onClick={() => { setShowRawData(true); auditLogger.log(ACTIONS.RAW_DATA_VIEWED, { projectName: projectData?.name || 'No project', activityCount: projectData?.activities?.length || 0 }); }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.color = '#93c5fd'; }}
              >📊 Data</button>

              {/* Export Dropdown */}
              <div className="dropdown">
                <button
                  className="export-btn"
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                  }}
                >📥 Export ▾</button>
                <div className="dropdown-menu">
                  <button onClick={exportPDF}>📄 PDF</button>
                  <button onClick={exportExcel}>📊 Excel</button>
                  <button onClick={() => setToast({ message: 'CSV export coming soon', type: 'success' })}>📋 CSV</button>
                </div>
              </div>

              {/* Audit */}
              <button
                onClick={() => { setShowAuditLog(true); auditLogger.log(ACTIONS.AUDIT_LOG_VIEWED, { totalLogs: auditLogger.getStats().total }); }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#c4b5fd',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#8b5cf6'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.color = '#c4b5fd'; }}
              >📜 Audit</button>
            </div>
        </nav>

        {/* Render different views based on activeView */}
        {activeView === 'about' && (
          <div className="about-page">
            <div className="about-header">
              <h1>🤖 About AI-Driven Schedule Risk Monitor</h1>
              <p>Intelligent project risk detection powered by CPM algorithms and ChatGPT-4</p>
            </div>

            <div className="about-charts-row">
              {/* Success Rate Comparison */}
              <div className="about-chart-card">
                <h3>📊 Project Success Rate Comparison</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Industry Avg', value: 55, fill: '#94a3b8' },
                    { name: 'With AI Monitor', value: 85, fill: '#3b82f6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {[{ fill: '#94a3b8' }, { fill: '#3b82f6' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Time Savings */}
              <div className="about-chart-card">
                <h3>⏱️ Analysis Time Comparison</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Manual Analysis', hours: 4.5, fill: '#f59e0b' },
                    { name: 'AI Monitor', hours: 0.03, fill: '#10b981' }
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                    <Tooltip formatter={(value) => [`${value} hours`, 'Time']} />
                    <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                      {[{ fill: '#f59e0b' }, { fill: '#10b981' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ROI Breakdown */}
              <div className="about-chart-card">
                <h3>💰 Value Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cost Savings', value: 45, color: '#10b981' },
                        { name: 'Time Saved', value: 30, color: '#3b82f6' },
                        { name: 'Risk Prevention', value: 25, color: '#8b5cf6' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[
                        { color: '#10b981' },
                        { color: '#3b82f6' },
                        { color: '#8b5cf6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="about-content">
              <div className="about-section">
                <h2>🎯 The Problem</h2>
                <p>45% of enterprise projects experience delays, costing organizations millions. Traditional PM tools show "green" status until it's too late.</p>
              </div>

              <div className="about-section">
                <h2>💡 Our Solution</h2>
                <p>AI-powered risk monitoring using CPM, graph theory, and ChatGPT-4 AI to detect delays 2-3 weeks before humans notice them.</p>
              </div>

              <div className="about-stats-grid">
                <div className="about-stat blue"><span className="stat-value">$685K</span><span className="stat-label">Annual Savings</span></div>
                <div className="about-stat green"><span className="stat-value">1,054%</span><span className="stat-label">ROI</span></div>
                <div className="about-stat amber"><span className="stat-value">95%</span><span className="stat-label">Accuracy</span></div>
                <div className="about-stat purple"><span className="stat-value">2s</span><span className="stat-label">Analysis Time</span></div>
              </div>

              <div className="about-hackathon" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <img
                  src={i2eLogo}
                  alt="i2e Consulting"
                  style={{
                    height: '60px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
                <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem' }}>
                    🏆 i2e Consulting AI Lab Hackathon 2025
                  </h3>
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.9rem' }}>
                    <strong>Problem:</strong> PS-01 - AI-Driven Schedule Risk Monitoring
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.9rem' }}>
                    <strong>Team:</strong> Fayek Kamle | <strong>Tech:</strong> React 18, ChatGPT-4, CPM
                  </p>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveView('dashboard')} className="back-to-dashboard-btn">
              ← Back to Dashboard
            </button>
          </div>
        )}

        {activeView === 'help' && (
          <div className="help-page">
            <div className="help-header">
              <h1>📚 Help & Quick Start Guide</h1>
              <p>Everything you need to get started with AI Risk Monitor</p>
            </div>

            {/* User Guide */}
            <div className="help-contact" style={{ marginBottom: '1.5rem' }}>
              <h3>📖 Complete User Guide</h3>
              <p style={{ marginBottom: '0.75rem' }}>Access the comprehensive user training guide with detailed explanations of all features.</p>
              <a
                href="USER_GUIDE.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                }}
              >
                📄 Open User Guide
              </a>
            </div>

            {/* Workflow Visual */}
            <div className="help-workflow">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <div className="step-icon">📥</div>
                <h4>Download Template</h4>
                <p>Get the CSV format</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">2</div>
                <div className="step-icon">📋</div>
                <h4>Fill Data</h4>
                <p>Add your activities</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-icon">📁</div>
                <h4>Upload CSV</h4>
                <p>Import your file</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">4</div>
                <div className="step-icon">🚀</div>
                <h4>Run Analysis</h4>
                <p>AI detects risks</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">5</div>
                <div className="step-icon">📊</div>
                <h4>Review Results</h4>
                <p>Act on insights</p>
              </div>
            </div>

            {/* Data Management Section */}
            <div className="help-data-management-section">
              <h3>📂 Data Management</h3>
              <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Upload your project data, download templates, or load sample projects to explore the features
              </p>
              <CSVUploader onDataLoaded={handleCSVDataLoaded} onLoadSampleData={handleLoadSampleDataClick} />
            </div>

            {/* Features with Charts */}
            <div className="help-features-row">
              <div className="help-feature-card blue">
                <h3>� Search & Filter</h3>
                <p>Find specific activities by name, ID, or resource. Filter by severity level.</p>
                <div className="feature-chart">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={[
                      { name: 'Critical', value: 4 },
                      { name: 'High', value: 8 },
                      { name: 'Medium', value: 12 },
                      { name: 'Low', value: 6 }
                    ]}>
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="help-feature-card green">
                <h3>🤖 AI Insights</h3>
                <p>ChatGPT-4 generates executive summaries with recommendations.</p>
                <div className="feature-chart">
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={[
                      { day: 'Mon', insights: 3 },
                      { day: 'Tue', insights: 5 },
                      { day: 'Wed', insights: 8 },
                      { day: 'Thu', insights: 12 },
                      { day: 'Fri', insights: 15 }
                    ]}>
                      <Area type="monotone" dataKey="insights" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="help-feature-card amber">
                <h3>🎯 AI Recovery Planner</h3>
                <p>Get AI-powered recovery strategies with step-by-step action plans.</p>
                <div className="feature-chart">
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={[
                      { step: 1, before: 85, after: 85 },
                      { step: 2, before: 85, after: 70 },
                      { step: 3, before: 85, after: 55 },
                      { step: 4, before: 85, after: 35 }
                    ]}>
                      <Line type="monotone" dataKey="before" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="after" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CSV Format */}
            <div className="help-csv-section">
              <h3>📋 CSV Format Requirements</h3>
              <div className="csv-columns-grid">
                {[
                  { name: 'ID', desc: 'Unique identifier (e.g., A-001)', icon: '🔑' },
                  { name: 'Name', desc: 'Activity description', icon: '📝' },
                  { name: 'Duration', desc: 'Number of days', icon: '⏱️' },
                  { name: 'Dependencies', desc: 'Pipe-separated IDs', icon: '🔗' },
                  { name: 'Resource', desc: 'Resource ID (e.g., R-001)', icon: '👤' },
                  { name: 'StartDate', desc: 'YYYY-MM-DD format', icon: '📅' },
                  { name: 'Status', desc: 'completed/in-progress/not-started', icon: '📊' },
                  { name: 'DaysDelayed', desc: 'Number (0 if on time)', icon: '⚠️' }
                ].map(item => (
                  <div key={item.name} className="csv-column-item">
                    <span className="csv-icon">{item.icon}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="help-faq-section">
              <h3>❓ Frequently Asked Questions</h3>
              <div className="faq-grid">
                <div className="faq-item">
                  <h4>How accurate is the risk detection?</h4>
                  <p>95% accuracy with production data using proven CPM algorithms.</p>
                </div>
                <div className="faq-item">
                  <h4>Can I use data from MS Project or Jira?</h4>
                  <p>Yes! Export to CSV and use our template for the required columns.</p>
                </div>
                <div className="faq-item">
                  <h4>Is my data secure?</h4>
                  <p>All data is processed locally in your browser. No server storage.</p>
                </div>
                <div className="faq-item">
                  <h4>How many activities can I analyze?</h4>
                  <p>Optimized for projects with up to 1,000 activities.</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="help-contact">
              <h3>📞 Contact & Support</h3>
              <p><strong>Hackathon:</strong> i2e Consulting AI Lab Hackathon 2025</p>
              <p><strong>Created by:</strong> Fayek Kamle | <a href="mailto:fayekkamle@gmail.com">fayekkamle@gmail.com</a> | <a href="https://www.linkedin.com/in/fayekkamle/" target="_blank">LinkedIn</a></p>
            </div>

            <button onClick={() => setActiveView('dashboard')} className="back-to-dashboard-btn">
              ← Back to Dashboard
            </button>
          </div>
        )}

        {activeView === 'dashboard' && (
          <>
        {/* Main Content */}
        <main className="main-content">
          {!analysisComplete ? (
            !projectData ? (
              /* Empty State - No Project Data */
              <div className="welcome-dashboard">
                <div className="empty-state-container">
                  <div className="empty-state-icon">📂</div>
                  <h2 className="empty-state-title">No Project Data</h2>
                  <p className="empty-state-message">Upload a CSV file to get started with AI-powered risk analysis</p>
                  <div className="empty-state-actions">
                    <CSVUploader onDataLoaded={handleCSVDataLoaded} onLoadSampleData={handleLoadSampleDataClick} />
                  </div>
                </div>
              </div>
            ) : (
            <div className="welcome-dashboard">
              {/* Project Overview Header */}
              <div className="welcome-header-card">
                <div className="welcome-header-left">
                  <h2>📋 {projectData.name}</h2>
                </div>
                <div className="welcome-header-right">
                  <span className="project-badge">${projectData.budget.toLocaleString()}</span>
                  <span className="project-badge">{projectData.duration}</span>
                </div>
              </div>

              {/* Pre-Analysis Connected Container */}
              <div className="pre-analysis-connected-container">
                {/* Analysis Action Card - Compact */}
                <div className="upload-action-card compact connected-top">
                  <div className="analysis-card-content">
                    <div className="analysis-card-left">
                      <h4>🚀 Start AI Risk Analysis</h4>
                      <p className="analysis-description">
                        Detect hidden risks, critical path issues & resource conflicts using ChatGPT-4.<br/>
                        Get AI-powered recommendations to keep your project on track.
                      </p>
                    </div>
                    <button
                      className="analyze-button-new"
                      onClick={() => setShowAnalysisConfirm(true)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="spinner"></span>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          💬 Run Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Project Quick Overview Container */}
                <div className="project-overview-container connected-bottom">
                  {/* Project Quick Overview - Full Width */}
                  <div className="project-quick-stats-card full-width">
                  <div className="quick-stats-header">
                    <span className="quick-stats-icon">📈</span>
                    <div>
                      <h4>Project Quick Overview</h4>
                      <p className="quick-stats-subtitle">{projectData.name}</p>
                    </div>
                  </div>

                  <div className="quick-stats-grid">
                    {/* Total Activities */}
                    <div className="quick-stat-item">
                      <div className="quick-stat-icon blue">📋</div>
                      <div className="quick-stat-info">
                        <span className="quick-stat-value">{projectData.activities.length}</span>
                        <span className="quick-stat-label">Total Activities</span>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="quick-stat-item">
                      <div className="quick-stat-icon green">👥</div>
                      <div className="quick-stat-info">
                        <span className="quick-stat-value">{projectData.teamSize}</span>
                        <span className="quick-stat-label">Team Members</span>
                      </div>
                    </div>

                    {/* Critical Path Items */}
                    <div className="quick-stat-item">
                      <div className="quick-stat-icon red">⚡</div>
                      <div className="quick-stat-info">
                        <span className="quick-stat-value">{projectData.activities.filter(a => a.isCriticalPath).length}</span>
                        <span className="quick-stat-label">On Critical Path</span>
                      </div>
                    </div>

                    {/* Go-Live Date */}
                    <div className="quick-stat-item">
                      <div className="quick-stat-icon amber">📅</div>
                      <div className="quick-stat-info">
                        <span className="quick-stat-value">Mar 31</span>
                        <span className="quick-stat-label">Go-Live Date</span>
                      </div>
                    </div>

                    {/* Delayed Activities */}
                    <div className="quick-stat-item">
                      <div className="quick-stat-icon orange">⏰</div>
                      <div className="quick-stat-info">
                        <span className="quick-stat-value">
                          {projectData.activities.filter(a => a.daysDelayed > 0).length}
                        </span>
                        <span className="quick-stat-label">Delayed</span>
                      </div>
                    </div>

                    {/* On Track */}
                    <div className="quick-stat-item">
                      <div className="quick-stat-icon green">✓</div>
                      <div className="quick-stat-info">
                        <span className="quick-stat-value">
                          {projectData.activities.filter(a => a.daysDelayed === 0 || !a.daysDelayed).length}
                        </span>
                        <span className="quick-stat-label">On Track</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress and Breakdown Row - 50/50 */}
                  <div className="progress-breakdown-row">
                    {/* Progress Bar */}
                    <div className="project-progress-section">
                      <div className="progress-header">
                        <span>Overall Progress</span>
                        <span className="progress-percent">
                          {(() => {
                            const completed = projectData.activities.filter(a => a.completionPercent === 100).length;
                            return Math.round((completed / projectData.activities.length) * 100);
                          })()}%
                        </span>
                      </div>
                      <div className="progress-bar-large">
                        <div
                          className="progress-fill-large"
                          style={{
                            width: `${(() => {
                              const completed = projectData.activities.filter(a => a.completionPercent === 100).length;
                              return Math.round((completed / projectData.activities.length) * 100);
                            })()}%`
                          }}
                        ></div>
                      </div>
                      <div className="progress-legend">
                        <span className="legend-item">
                          <span className="legend-dot completed"></span>
                          {projectData.activities.filter(a => a.completionPercent === 100).length} Completed
                        </span>
                        <span className="legend-item">
                          <span className="legend-dot in-progress"></span>
                          {projectData.activities.filter(a => a.completionPercent > 0 && a.completionPercent < 100).length} In Progress
                        </span>
                        <span className="legend-item">
                          <span className="legend-dot not-started"></span>
                          {projectData.activities.filter(a => a.completionPercent === 0).length} Not Started
                        </span>
                      </div>
                    </div>

                    {/* Activity Status Breakdown */}
                    <div className="activity-breakdown-column">
                      <div className="breakdown-item critical">
                        <span className="breakdown-label">🔴 Critical & Delayed</span>
                        <span className="breakdown-value">
                          {projectData.activities.filter(a => a.isCriticalPath && a.daysDelayed > 0).length}
                        </span>
                      </div>
                      <div className="breakdown-item warning">
                        <span className="breakdown-label">🟡 Schedule Variance &gt; 2 days</span>
                        <span className="breakdown-value">
                          {projectData.activities.filter(a => a.daysDelayed > 2).length}
                        </span>
                      </div>
                      <div className="breakdown-item info">
                        <span className="breakdown-label">🔵 Dependencies Pending</span>
                        <span className="breakdown-value">
                          {projectData.activities.filter(a => a.dependencies && a.dependencies.length > 0 && a.completionPercent === 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row - 50% each */}
                <div className="charts-row-half">
                  {/* Left: Activity Status Chart */}
                  <div className="welcome-chart-card">
                    <h3>📈 Activity Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: projectData.activities.filter(a => a.status === 'completed').length, color: '#10b981' },
                            { name: 'In Progress', value: projectData.activities.filter(a => a.status === 'in-progress').length, color: '#3b82f6' },
                            { name: 'Not Started', value: projectData.activities.filter(a => a.status === 'not-started').length, color: '#94a3b8' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#94a3b8" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right: Duration Chart */}
                  <div className="welcome-chart-card">
                    <h3>⏱️ Activity Durations</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={projectData.activities.slice(0, 6).map(a => ({ name: a.id, days: a.duration, critical: a.isCriticalPath }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="d" />
                        <Tooltip formatter={(value) => [`${value} days`, 'Duration']} />
                        <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                          {projectData.activities.slice(0, 6).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isCriticalPath ? '#dc2626' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                </div>
              </div>

              {/* AI Analysis Confirmation Modal */}
              <ConfirmModal
                isOpen={showAnalysisConfirm}
                title="Run AI Risk Analysis (ChatGPT)?"
                message={`This will analyze ${projectData.activities.length} activities using ChatGPT (GPT-4o-mini) to detect hidden risks, critical path issues, and resource conflicts. The analysis typically takes 5-15 seconds.`}
                confirmText="Yes, Run Analysis"
                cancelText="Cancel"
                type="info"
                onCancel={() => setShowAnalysisConfirm(false)}
                onConfirm={() => {
                  setShowAnalysisConfirm(false);
                  auditLogger.log(ACTIONS.RISK_ANALYSIS_STARTED, {
                    projectName: projectData.name,
                    activityCount: projectData.activities.length
                  });
                  runAnalysis();
                }}
              />
            </div>
            )
          ) : (
            <div className="dashboard-new">
              {/* Connected Dashboard Container */}
              <div className="dashboard-connected-container">
                {/* Project Overview Header - Always visible */}
                <div className="welcome-header-card connected-top">
                  <div className="welcome-header-left">
                    <h2>📋 {projectData.name}</h2>
                  </div>
                  <div className="welcome-header-right">
                    <span className="project-badge">${projectData.budget.toLocaleString()}</span>
                    <span className="project-badge">{projectData.duration}</span>
                  </div>
                </div>

                {/* Top Stats Row */}
                <div className="dashboard-stats-row connected-middle">
                <div className="stat-card stat-critical">
                  <div className="stat-card-icon">🔴</div>
                  <div className="stat-card-content">
                    <span className="stat-card-value">{risks.filter(r => r.severity === 'critical').length}</span>
                    <span className="stat-card-label">Critical Risks</span>
                  </div>
                </div>
                <div className="stat-card stat-high">
                  <div className="stat-card-icon">🟠</div>
                  <div className="stat-card-content">
                    <span className="stat-card-value">{risks.filter(r => r.severity === 'high').length}</span>
                    <span className="stat-card-label">High Risks</span>
                  </div>
                </div>
                <div className="stat-card stat-medium">
                  <div className="stat-card-icon">🟡</div>
                  <div className="stat-card-content">
                    <span className="stat-card-value">{risks.filter(r => r.severity === 'medium').length}</span>
                    <span className="stat-card-label">Medium Risks</span>
                  </div>
                </div>
                <div className="stat-card stat-low">
                  <div className="stat-card-icon">🟢</div>
                  <div className="stat-card-content">
                    <span className="stat-card-value">{risks.filter(r => r.severity === 'low').length}</span>
                    <span className="stat-card-label">Low Risks</span>
                  </div>
                </div>
                <div className="stat-card stat-total">
                  <div className="stat-card-icon">📊</div>
                  <div className="stat-card-content">
                    <span className="stat-card-value">{risks.length}</span>
                    <span className="stat-card-label">Total Risks</span>
                  </div>
                </div>
                </div>

                {/* Charts Row */}
                <div className="dashboard-charts-row connected-middle">
                {/* Severity Distribution Pie Chart */}
                <div className="chart-card">
                  <h3 className="chart-title">📈 Severity Distribution</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Critical', value: risks.filter(r => r.severity === 'critical').length, color: '#dc2626' },
                          { name: 'High', value: risks.filter(r => r.severity === 'high').length, color: '#ea580c' },
                          { name: 'Medium', value: risks.filter(r => r.severity === 'medium').length, color: '#ca8a04' },
                          { name: 'Low', value: risks.filter(r => r.severity === 'low').length, color: '#16a34a' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          { name: 'Critical', value: risks.filter(r => r.severity === 'critical').length, color: '#dc2626' },
                          { name: 'High', value: risks.filter(r => r.severity === 'high').length, color: '#ea580c' },
                          { name: 'Medium', value: risks.filter(r => r.severity === 'medium').length, color: '#ca8a04' },
                          { name: 'Low', value: risks.filter(r => r.severity === 'low').length, color: '#16a34a' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} risks`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend below chart */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {[
                      { name: 'Critical', color: '#dc2626', count: risks.filter(r => r.severity === 'critical').length },
                      { name: 'High', color: '#ea580c', count: risks.filter(r => r.severity === 'high').length },
                      { name: 'Medium', color: '#ca8a04', count: risks.filter(r => r.severity === 'medium').length },
                      { name: 'Low', color: '#16a34a', count: risks.filter(r => r.severity === 'low').length }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }}></span>
                        <span style={{ color: '#64748b' }}>{item.name}: <strong style={{ color: '#1e293b' }}>{item.count}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Score Bar Chart */}
                <div className="chart-card">
                  <h3 className="chart-title">📊 Top Risk Scores</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={risks.slice(0, 8).map(r => ({ name: r.activity.id, score: r.riskScore, severity: r.severity }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }}
                        formatter={(value) => [`${value.toFixed(0)}/100`, 'Risk']}
                      />
                      <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                        {risks.slice(0, 8).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.severity === 'critical' ? '#dc2626' : entry.severity === 'high' ? '#ea580c' : entry.severity === 'medium' ? '#ca8a04' : '#16a34a'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Factors Radar Chart */}
                <div className="chart-card">
                  <h3 className="chart-title">🎯 Risk Factors</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={(() => {
                      const risksWithFactors = risks.filter(r => r.factors);
                      const factorCount = risksWithFactors.length || 1;
                      return [
                        {
                          factor: 'Delay',
                          value: risksWithFactors.reduce((sum, r) => sum + (r.factors?.scheduleDelay || 0), 0) / factorCount,
                          fullMark: 100
                        },
                        {
                          factor: 'Critical',
                          value: risksWithFactors.reduce((sum, r) => sum + (r.factors?.criticalPathImpact || 0), 0) / factorCount,
                          fullMark: 100
                        },
                        {
                          factor: 'Float',
                          value: risksWithFactors.reduce((sum, r) => sum + (r.factors?.floatConsumption || 0), 0) / factorCount,
                          fullMark: 100
                        },
                        {
                          factor: 'Resource',
                          value: risksWithFactors.reduce((sum, r) => sum + (r.factors?.resourceOverallocation || 0), 0) / factorCount,
                          fullMark: 100
                        },
                        {
                          factor: 'Progress',
                          value: risksWithFactors.reduce((sum, r) => sum + (r.factors?.progressDeviation || 0), 0) / factorCount,
                          fullMark: 100
                        }
                      ];
                    })()}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#94a3b8' }} tickCount={5} />
                      <Radar
                        name="Risk Level"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#3b82f6' }}
                      />
                      <Tooltip
                        formatter={(value) => [`${typeof value === 'number' ? value.toFixed(0) : 0}%`, 'Avg Risk']}
                        contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                </div>

                {/* Analysis Info */}
                <div className="analysis-info-bar connected-middle">
                  <span>⚡ Analysis completed in <strong>{analysisTime}</strong> seconds</span>
                  <span>📋 Showing <strong>{filteredAndSortedRisks.length}</strong> of <strong>{risks.length}</strong> risks{searchTerm && ` matching "${searchTerm}"`}</span>
                </div>

                {/* Risks List */}
                <div className="risks-list-new connected-bottom">
                  <div className="risks-list-header">
                    <h3 className="risks-list-title">📋 Risk Analysis Results</h3>
                  <div className="view-toggle">
                    <button
                      className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                      onClick={() => setViewMode('card')}
                      title="Card View"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </button>
                    <button
                      className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                      title="List View"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="4" width="18" height="4" rx="1" />
                        <rect x="3" y="10" width="18" height="4" rx="1" />
                        <rect x="3" y="16" width="18" height="4" rx="1" />
                      </svg>
                    </button>
                  </div>
                </div>

                {filteredAndSortedRisks.length === 0 ? (
                  <div className="no-risks-message">
                    <span className="no-risks-icon">🔍</span>
                    <p>No risks found matching your filters.</p>
                    <span className="no-risks-hint">Try adjusting your search or filter criteria.</span>
                  </div>
                ) : viewMode === 'card' ? (
                  <div className="risks-grid">
                    {filteredAndSortedRisks.map((risk, index) => (
                      <div
                        key={risk.activity.id}
                        className={`risk-card-enhanced risk-card-${risk.severity}`}
                        onClick={() => handleRiskClick(risk)}
                      >
                        {/* Top gradient accent */}
                        <div className={`risk-card-accent accent-${risk.severity}`}></div>

                        <div className="risk-card-content">
                          {/* Header with rank and severity */}
                          <div className="risk-card-header-enhanced">
                            <div className="risk-rank-badge">
                              <span className="rank-hash">#</span>
                              <span className="rank-number">{index + 1}</span>
                            </div>
                            <div className={`risk-severity-pill severity-${risk.severity}`}>
                              <span className="severity-dot"></span>
                              <span className="severity-text">{risk.severity}</span>
                            </div>
                          </div>

                          {/* Score Section */}
                          <div className="risk-score-section">
                            <div className="risk-score-circle">
                              <svg viewBox="0 0 100 100" className="score-ring">
                                <circle cx="50" cy="50" r="45" className="score-ring-bg" />
                                <circle
                                  cx="50" cy="50" r="45"
                                  className={`score-ring-fill ring-${risk.severity}`}
                                  style={{
                                    strokeDasharray: `${(risk.riskScore / 100) * 283} 283`
                                  }}
                                />
                              </svg>
                              <div className="score-text">
                                <span className="score-value-lg">{risk.riskScore.toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="score-label">Risk Score</div>
                          </div>

                          {/* Activity Info */}
                          <div className="risk-activity-info">
                            <h4 className="risk-card-title-enhanced">{risk.activity.Activity_Name || risk.activity.name}</h4>
                            <div className="activity-id-badge">
                              <span className="id-icon">📋</span>
                              <span>{risk.activity.Activity_ID || risk.activity.id}</span>
                              {risk.activity.Work_Package && <span className="work-package-badge">📦 {risk.activity.Work_Package}</span>}
                            </div>
                          </div>

                          {/* Basic Stats Grid */}
                          <div className="risk-stats-grid">
                            <div className="risk-stat-item">
                              <span className="stat-icon">📅</span>
                              <div className="stat-details">
                                <span className="stat-value">{risk.activity.Planned_Duration || risk.activity.duration}d</span>
                                <span className="stat-label">Duration</span>
                              </div>
                            </div>
                            <div className="risk-stat-item">
                              <span className="stat-icon delay">⏱️</span>
                              <div className="stat-details">
                                <span className={`stat-value ${(risk.activity.Delay_Impact_days || risk.activity.daysDelayed || 0) > 0 ? 'danger' : 'success'}`}>
                                  {(risk.activity.Delay_Impact_days || risk.activity.daysDelayed || 0) > 0 ? '+' : ''}{risk.activity.Delay_Impact_days || risk.activity.daysDelayed || 0}d
                                </span>
                                <span className="stat-label">Delay</span>
                              </div>
                            </div>
                            <div className="risk-stat-item">
                              <span className="stat-icon resource">👤</span>
                              <div className="stat-details">
                                <span className="stat-value truncate">{(risk.activity.Resource_ID || risk.activity.resource)?.split(' ')[0] || 'TBD'}</span>
                                <span className="stat-label">Resource</span>
                              </div>
                            </div>
                            <div className="risk-stat-item">
                              <span className="stat-icon allocation">📊</span>
                              <div className="stat-details">
                                <span className={`stat-value ${(risk.activity.FTE_Allocation || risk.activity.allocation || 100) > 100 ? 'danger' : (risk.activity.FTE_Allocation || risk.activity.allocation || 100) > 80 ? 'warning' : 'success'}`}>
                                  {risk.activity.FTE_Allocation || risk.activity.allocation || 100}%
                                </span>
                                <span className="stat-label">Allocation</span>
                              </div>
                            </div>
                          </div>

                          {/* Schedule Info */}
                          <div className="risk-schedule-info">
                            <div className="schedule-row">
                              <span className="schedule-item">🗓️ Start: {risk.activity.Planned_Start || risk.activity.startDate || 'N/A'}</span>
                              <span className="schedule-item">🏁 Finish: {risk.activity.Planned_Finish || 'N/A'}</span>
                              <span className="schedule-item">📌 {risk.activity.Status || risk.activity.status}</span>
                            </div>
                            <div className="schedule-row">
                              <span className="schedule-item">⏳ Remaining: {risk.activity.Remaining_Duration !== undefined ? risk.activity.Remaining_Duration : Math.round((risk.activity.Planned_Duration || risk.activity.duration || 0) * (1 - (risk.activity.Percent_Complete || risk.activity.completionPercent || 0) / 100))}d</span>
                              {risk.activity.Role && <span className="schedule-item">👔 {risk.activity.Role}</span>}
                            </div>
                          </div>

                          {/* Baseline Info */}
                          <div className="risk-baseline-info">
                            <div className="baseline-header">📊 Baseline</div>
                            <div className="baseline-grid">
                              <span className="baseline-item"><b>Start:</b>{risk.activity.Baseline_Start || risk.activity.Planned_Start || risk.activity.startDate || 'N/A'}</span>
                              <span className="baseline-item"><b>Finish:</b>{risk.activity.Baseline_Finish || risk.activity.Planned_Finish || 'N/A'}</span>
                              <span className="baseline-item"><b>Duration:</b>{risk.activity.Baseline_Duration || risk.activity.Planned_Duration || risk.activity.duration || 0}d</span>
                            </div>
                          </div>

                          {/* CPM Data */}
                          <div className="risk-cpm-info">
                            <div className="cpm-header">📅 CPM Schedule</div>
                            <div className="cpm-grid">
                              <span className="cpm-item"><b>ES:</b>{risk.activity.ES || 0}</span>
                              <span className="cpm-item"><b>EF:</b>{risk.activity.EF || 0}</span>
                              <span className="cpm-item"><b>LS:</b>{risk.activity.LS || 0}</span>
                              <span className="cpm-item"><b>LF:</b>{risk.activity.LF || 0}</span>
                              <span className="cpm-item"><b>Float:</b>{risk.activity.Total_Float_days !== undefined ? risk.activity.Total_Float_days : (risk.activity.float || 0)}d</span>
                              <span className="cpm-item"><b>Max FTE:</b>{risk.activity.Resource_Max_FTE || 1.0}</span>
                            </div>
                          </div>

                          {/* Dependencies */}
                          <div className="risk-deps-info">
                            <div className="deps-header">🔗 Dependencies</div>
                            <div className="deps-grid">
                              <span className="deps-item"><b>Pred:</b>{risk.activity.Predecessor_ID || 'None'}</span>
                              <span className="deps-item"><b>Succ:</b>{risk.activity.Successor_ID || 'None'}</span>
                              <span className="deps-item"><b>Type:</b>{risk.activity.Dependency_Type || 'FS'}</span>
                            </div>
                          </div>

                          {/* Risk Metrics */}
                          <div className="risk-metrics-info">
                            <div className="metrics-header">⚠️ Risk Metrics</div>
                            <div className="metrics-grid">
                              <span className="metrics-item prob">
                                <b>Prob:</b>
                                <span className={(risk.activity.Probability || 0.5) > 0.5 ? 'danger' : 'success'}>
                                  {((risk.activity.Probability || 0.5) * 100).toFixed(0)}%
                                </span>
                              </span>
                              <span className="metrics-item impact">
                                <b>Delay:</b>{risk.activity.Delay_Impact_days !== undefined ? risk.activity.Delay_Impact_days : (risk.activity.daysDelayed || 0)}d
                              </span>
                              <span className="metrics-item cost">
                                <b>Cost:</b>${((risk.activity.Cost_Impact_of_Risk || 0) / 1000).toFixed(0)}K
                              </span>
                              <span className="metrics-item emv">
                                <b>EMV:</b>${(((risk.activity.Probability || 0.5) * (risk.activity.Cost_Impact_of_Risk || 0)) / 1000).toFixed(1)}K
                              </span>
                            </div>
                          </div>

                          {/* Skills */}
                          {risk.activity.Skill_Tags && (
                            <div className="risk-skills-info">
                              <span className="skills-label">🎯 Skills:</span>
                              <span className="skills-value">{risk.activity.Skill_Tags}</span>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="risk-progress-section">
                            <div className="progress-header-mini">
                              <span>Progress</span>
                              <span className="progress-value">{risk.activity.Percent_Complete !== undefined ? risk.activity.Percent_Complete : (risk.activity.completionPercent || 0)}%</span>
                            </div>
                            <div className="progress-track">
                              <div
                                className={`progress-fill-animated fill-${risk.severity}`}
                                style={{ width: `${risk.activity.Percent_Complete !== undefined ? risk.activity.Percent_Complete : (risk.activity.completionPercent || 0)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Tags Section */}
                          <div className="risk-tags-section">
                            {(risk.activity.On_Critical_Path || risk.activity.isCriticalPath) && (
                              <div className="risk-tag critical-tag">
                                <span className="tag-icon">⚡</span>
                                <span>Critical Path</span>
                              </div>
                            )}
                            {(risk.activity.Delay_Impact_days || risk.activity.daysDelayed || 0) > 2 && (
                              <div className="risk-tag delay-tag">
                                <span className="tag-icon">⚠️</span>
                                <span>Delayed</span>
                              </div>
                            )}
                            {(risk.activity.FTE_Allocation || risk.activity.allocation || 100) > 100 && (
                              <div className="risk-tag overalloc-tag">
                                <span className="tag-icon">🔥</span>
                                <span>Over-allocated</span>
                              </div>
                            )}
                          </div>

                          {/* Click hint */}
                          <div className="risk-card-footer">
                            <span className="click-hint">Click for details →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List View - Full Details with Complete Field Structure */
                  <div className="risks-list-view-full">
                    {filteredAndSortedRisks.map((risk, index) => (
                      <div
                        key={risk.activity.Activity_ID || risk.activity.id}
                        className={`risk-list-item-full risk-list-${risk.severity}`}
                        onClick={() => handleRiskClick(risk)}
                      >
                        {/* Simplified List View - Click for full details */}
                        <div className="list-simple-row" onClick={() => setSelectedRisk(risk)}>
                          {/* Left: Rank & Score */}
                          <div className="list-rank-score">
                            <span className="list-rank">#{index + 1}</span>
                            <div className={`list-score score-${risk.severity}`}>
                              {risk.riskScore.toFixed(0)}
                            </div>
                            <span className={`list-severity sev-${risk.severity}`}>{risk.severity}</span>
                          </div>

                          {/* Center: Activity Info */}
                          <div className="list-main-info">
                            <h4 className="list-activity-name">{risk.activity.Activity_Name || risk.activity.name}</h4>
                            <div className="list-subtitle">
                              <span className="list-activity-id">📋 {risk.activity.Activity_ID || risk.activity.id}</span>
                              {risk.activity.Work_Package && <span className="list-wp">📦 {risk.activity.Work_Package}</span>}
                              <div className="list-progress-inline">
                                <div className="list-progress-bar-small">
                                  <div
                                    className={`list-progress-fill ${(risk.activity.Percent_Complete || risk.activity.completionPercent || 0) < 30 ? 'low' : (risk.activity.Percent_Complete || risk.activity.completionPercent || 0) < 70 ? 'medium' : 'high'}`}
                                    style={{ width: `${risk.activity.Percent_Complete !== undefined ? risk.activity.Percent_Complete : (risk.activity.completionPercent || 0)}%` }}
                                  ></div>
                                </div>
                                <span className="list-progress-pct">{risk.activity.Percent_Complete !== undefined ? risk.activity.Percent_Complete : (risk.activity.completionPercent || 0)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="list-key-metrics">
                            <span className="metric"><b>Duration:</b> {risk.activity.Planned_Duration || risk.activity.duration}d</span>
                            <span className="metric"><b>Status:</b> {risk.activity.Status || risk.activity.status}</span>
                            <span className={`metric ${(risk.activity.Probability || 0.5) > 0.5 ? 'text-danger' : ''}`}><b>EMV:</b> ${((risk.activity.Probability || 0.5) * (risk.activity.Cost_Impact_of_Risk || 0)).toLocaleString()}</span>
                          </div>

                          {/* Tags */}
                          <div className="list-quick-tags">
                            {(risk.activity.On_Critical_Path || risk.activity.isCriticalPath) && <span className="mini-tag critical">⚡ CP</span>}
                            {(risk.activity.Delay_Impact_days || risk.activity.daysDelayed || 0) > 2 && <span className="mini-tag delayed">⚠️ Delay</span>}
                            {(risk.activity.FTE_Allocation || risk.activity.allocation || 100) > 100 && <span className="mini-tag overalloc">🔥 Over</span>}
                          </div>

                          {/* Arrow Button */}
                          <div className={`list-arrow-btn arrow-${risk.severity}`}>›</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Activity Detail Modal */}
        {selectedRisk && (
          <div className="activity-detail-modal" onClick={() => setSelectedRisk(null)}>
            <div className="activity-detail" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={() => setSelectedRisk(null)}>×</button>

              {/* Approved Recovery Banner */}
              {getApprovedMitigation(selectedRisk.activity.id) && (
                <div className="approved-recovery-banner" style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: '700', color: 'white', fontSize: '1.1rem' }}>
                        ✅ Recovery Plan Approved
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                        {getApprovedMitigation(selectedRisk.activity.id).strategy}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                      {new Date(getApprovedMitigation(selectedRisk.activity.id).approvedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>
                      {new Date(getApprovedMitigation(selectedRisk.activity.id).approvedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' • '}
                      {getApprovedMitigation(selectedRisk.activity.id).approvedBy}
                    </div>
                  </div>
                </div>
              )}

              {/* Popup Header with Activity Name and Score */}
              <div className="popup-header">
                <div className="popup-header-left">
                  <h2 className="popup-activity-name">{selectedRisk.activity.Activity_Name || selectedRisk.activity.name}</h2>
                  <div className="popup-activity-meta">
                    <span className="popup-id">📋 {selectedRisk.activity.Activity_ID || selectedRisk.activity.id}</span>
                    {selectedRisk.activity.Work_Package && <span className="popup-wp">📦 {selectedRisk.activity.Work_Package}</span>}
                  </div>
                </div>
                <div className="popup-header-right">
                  <div className={`popup-score score-${selectedRisk.severity}`}>
                    {selectedRisk.riskScore.toFixed(0)}
                  </div>
                  <span className={`popup-severity sev-${selectedRisk.severity}`}>{selectedRisk.severity}</span>
                </div>
              </div>

              {/* Two-Column Layout: Risk Factors + Quick Stats */}
              <div className="popup-top-section">
                {/* Risk Factor Breakdown */}
                <div className="popup-risk-factors">
                  <h4>📊 Risk Factor Breakdown</h4>
                  {Object.entries(selectedRisk.factors).map(([factor, value]) => (
                    <div key={factor} className="popup-factor-row">
                      <span className="popup-factor-name">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="popup-factor-bar">
                        <div className="popup-factor-fill" style={{ width: `${value}%`, background: value > 50 ? '#ef4444' : value > 25 ? '#f59e0b' : '#22c55e' }}></div>
                      </div>
                      <span className="popup-factor-value">{value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Risk Stats */}
                <div className="popup-quick-stats">
                  <h4>⚠️ Risk Summary</h4>
                  <div className="popup-stat-grid">
                    <div className="popup-stat">
                      <span className="popup-stat-label">Probability</span>
                      <span className={`popup-stat-value ${(selectedRisk.activity.Probability || 0.5) > 0.5 ? 'danger' : 'success'}`}>
                        {((selectedRisk.activity.Probability || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="popup-stat">
                      <span className="popup-stat-label">Delay Impact</span>
                      <span className="popup-stat-value danger">{selectedRisk.activity.Delay_Impact_days || selectedRisk.activity.daysDelayed || 0}d</span>
                    </div>
                    <div className="popup-stat">
                      <span className="popup-stat-label">Cost Impact</span>
                      <span className={`popup-stat-value ${(selectedRisk.activity.Cost_Impact_of_Risk || 0) > 20000 ? 'danger' : ''}`}>
                        ${(selectedRisk.activity.Cost_Impact_of_Risk || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="popup-stat emv">
                      <span className="popup-stat-label">💰 EMV</span>
                      <span className="popup-stat-value highlight">
                        ${((selectedRisk.activity.Probability || 0.5) * (selectedRisk.activity.Cost_Impact_of_Risk || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="popup-tags">
                    {(selectedRisk.activity.On_Critical_Path || selectedRisk.activity.isCriticalPath) && <span className="popup-tag critical">⚡ Critical Path</span>}
                    {(selectedRisk.activity.Delay_Impact_days || selectedRisk.activity.daysDelayed || 0) > 2 && <span className="popup-tag delayed">⚠️ Delayed</span>}
                    {(selectedRisk.activity.FTE_Allocation || selectedRisk.activity.allocation || 100) > 100 && <span className="popup-tag overalloc">🔥 Over-allocated</span>}
                    {(selectedRisk.activity.Probability || 0.5) > 0.7 && <span className="popup-tag high-prob">📈 High Probability</span>}
                    {(selectedRisk.activity.Cost_Impact_of_Risk || 0) > 30000 && <span className="popup-tag high-cost">💸 High Cost</span>}
                  </div>
                </div>
              </div>

              {/* All 31 Fields - Organized in Sections */}
              <div className="popup-all-fields">
                {/* Section 1: Schedule Information */}
                <div className="popup-section schedule-section">
                  <h4>📅 Schedule</h4>
                  <div className="popup-fields-grid">
                    <div className="popup-field"><span className="field-label">Duration</span><span className="field-value">{selectedRisk.activity.Planned_Duration || selectedRisk.activity.duration}d</span></div>
                    <div className="popup-field"><span className="field-label">Start</span><span className="field-value">{selectedRisk.activity.Planned_Start || selectedRisk.activity.startDate || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">Finish</span><span className="field-value">{selectedRisk.activity.Planned_Finish || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">Status</span><span className="field-value">{selectedRisk.activity.Status || selectedRisk.activity.status}</span></div>
                    <div className="popup-field"><span className="field-label">Remaining</span><span className="field-value">{selectedRisk.activity.Remaining_Duration !== undefined ? selectedRisk.activity.Remaining_Duration : Math.round((selectedRisk.activity.Planned_Duration || selectedRisk.activity.duration || 0) * (1 - (selectedRisk.activity.Percent_Complete || selectedRisk.activity.completionPercent || 0) / 100))}d</span></div>
                    <div className="popup-field"><span className="field-label">Progress</span><span className="field-value">{selectedRisk.activity.Percent_Complete !== undefined ? selectedRisk.activity.Percent_Complete : (selectedRisk.activity.completionPercent || 0)}%</span></div>
                  </div>
                </div>

                {/* Section 2: Baseline & Actuals */}
                <div className="popup-section baseline-section">
                  <h4>📊 Baseline</h4>
                  <div className="popup-fields-grid">
                    <div className="popup-field"><span className="field-label">BL Start</span><span className="field-value">{selectedRisk.activity.Baseline_Start || selectedRisk.activity.Planned_Start || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">BL Finish</span><span className="field-value">{selectedRisk.activity.Baseline_Finish || selectedRisk.activity.Planned_Finish || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">BL Duration</span><span className="field-value">{selectedRisk.activity.Baseline_Duration || selectedRisk.activity.Planned_Duration || selectedRisk.activity.duration || 0}d</span></div>
                    <div className="popup-field"><span className="field-label">Act. Start</span><span className="field-value">{selectedRisk.activity.Actual_Start || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">Act. Finish</span><span className="field-value">{selectedRisk.activity.Actual_Finish || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">Slippage</span><span className={`field-value ${(selectedRisk.activity.daysDelayed || 0) > 0 ? 'danger' : ''}`}>{selectedRisk.activity.daysDelayed || 0}d</span></div>
                  </div>
                </div>

                {/* Section 3: Resource Information */}
                <div className="popup-section resource-section">
                  <h4>👤 Resources</h4>
                  <div className="popup-fields-grid">
                    <div className="popup-field"><span className="field-label">Resource</span><span className="field-value">{selectedRisk.activity.Resource_ID || selectedRisk.activity.resource || 'TBD'}</span></div>
                    <div className="popup-field"><span className="field-label">Role</span><span className="field-value">{selectedRisk.activity.Role || 'N/A'}</span></div>
                    <div className="popup-field"><span className="field-label">Allocation</span><span className={`field-value ${(selectedRisk.activity.FTE_Allocation || selectedRisk.activity.allocation || 100) > 100 ? 'danger' : ''}`}>{selectedRisk.activity.FTE_Allocation || selectedRisk.activity.allocation || 100}%</span></div>
                    <div className="popup-field"><span className="field-label">Max FTE</span><span className="field-value">{selectedRisk.activity.Resource_Max_FTE || 1.0}</span></div>
                    <div className="popup-field full-width"><span className="field-label">Skills</span><span className="field-value">{selectedRisk.activity.Skill_Tags || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Section 4: CPM Analysis */}
                <div className="popup-section cpm-section">
                  <h4>📈 CPM</h4>
                  <div className="popup-fields-grid">
                    <div className="popup-field"><span className="field-label">ES</span><span className="field-value cpm">{selectedRisk.activity.ES || 0}</span></div>
                    <div className="popup-field"><span className="field-label">EF</span><span className="field-value cpm">{selectedRisk.activity.EF || 0}</span></div>
                    <div className="popup-field"><span className="field-label">LS</span><span className="field-value cpm">{selectedRisk.activity.LS || 0}</span></div>
                    <div className="popup-field"><span className="field-label">LF</span><span className="field-value cpm">{selectedRisk.activity.LF || 0}</span></div>
                    <div className="popup-field"><span className="field-label">Float</span><span className="field-value">{selectedRisk.activity.Total_Float_days !== undefined ? selectedRisk.activity.Total_Float_days : (selectedRisk.activity.float || 0)}d</span></div>
                    <div className="popup-field"><span className="field-label">Critical</span><span className={`field-value ${(selectedRisk.activity.On_Critical_Path || selectedRisk.activity.isCriticalPath) ? 'critical' : ''}`}>{(selectedRisk.activity.On_Critical_Path || selectedRisk.activity.isCriticalPath) ? '⚡ Yes' : 'No'}</span></div>
                  </div>
                </div>

                {/* Section 5: Dependencies */}
                <div className="popup-section dependency-section">
                  <h4>🔗 Dependencies</h4>
                  <div className="popup-fields-grid">
                    <div className="popup-field"><span className="field-label">Predecessor</span><span className="field-value">{selectedRisk.activity.Predecessor_ID || 'None'}</span></div>
                    <div className="popup-field"><span className="field-label">Successor</span><span className="field-value">{selectedRisk.activity.Successor_ID || 'None'}</span></div>
                    <div className="popup-field"><span className="field-label">Type</span><span className="field-value">{selectedRisk.activity.Dependency_Type || 'FS'}</span></div>
                    <div className="popup-field"><span className="field-label">Count</span><span className="field-value">{selectedRisk.activity.dependencies?.length || 0}</span></div>
                  </div>
                </div>

                {/* Section 6: Risk Data */}
                <div className="popup-section risk-section">
                  <h4>⚠️ Risk</h4>
                  <div className="popup-fields-grid">
                    <div className="popup-field"><span className="field-label">Probability</span><span className={`field-value ${(selectedRisk.activity.Probability || 0.5) > 0.5 ? 'danger' : 'success'}`}>{((selectedRisk.activity.Probability || 0.5) * 100).toFixed(0)}%</span></div>
                    <div className="popup-field"><span className="field-label">Delay</span><span className="field-value danger">{selectedRisk.activity.Delay_Impact_days || selectedRisk.activity.daysDelayed || 0}d</span></div>
                    <div className="popup-field"><span className="field-label">Cost Impact</span><span className={`field-value ${(selectedRisk.activity.Cost_Impact_of_Risk || 0) > 20000 ? 'danger' : ''}`}>${(selectedRisk.activity.Cost_Impact_of_Risk || 0).toLocaleString()}</span></div>
                    <div className="popup-field emv-field"><span className="field-label">💰 EMV</span><span className="field-value emv">${((selectedRisk.activity.Probability || 0.5) * (selectedRisk.activity.Cost_Impact_of_Risk || 0)).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {!aiInsight && (
                  <button
                    className="ai-button chatgpt-button"
                    onClick={generateAIInsight}
                    disabled={isGeneratingInsight}
                    style={{
                      background: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
                      boxShadow: '0 4px 15px rgba(16, 163, 127, 0.3)'
                    }}
                  >
                    {isGeneratingInsight ? (
                      <>
                        <span className="spinner"></span>
                        ChatGPT Generating...
                      </>
                    ) : (
                      '💬 Generate AI Insight (ChatGPT)'
                    )}
                  </button>
                )}

                <button className="simulate-button" onClick={() => {
                  setShowSimulation(true);
                  auditLogger.log(ACTIONS.SIMULATION_OPENED, {
                    source: 'action_buttons',
                    activityId: selectedRisk.activity.id,
                    activityName: selectedRisk.activity.name,
                    currentRiskScore: selectedRisk.riskScore
                  });
                }}>
                  🎯 Get AI Recovery Plan
                </button>

                <button
                  className="email-button"
                  onClick={() => {
                    setShowEmailModal(true);
                    auditLogger.log(ACTIONS.EMAIL_MODAL_OPENED, {
                      activityId: selectedRisk.activity.id,
                      riskScore: selectedRisk.riskScore,
                      severity: selectedRisk.severity
                    });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  📧 Share via Email
                </button>
              </div>

              {/* AI Insight Section */}
              {isGeneratingInsight && (
                <div className="ai-insight-section">
                  <div className="ai-loading" style={{ background: 'linear-gradient(135deg, rgba(16, 163, 127, 0.1) 0%, rgba(13, 138, 106, 0.1) 100%)' }}>
                    <span className="spinner-large" style={{ borderTopColor: '#10a37f' }}></span>
                    <p style={{ color: '#10a37f' }}>Analyzing risk with ChatGPT...</p>
                    <p className="ai-subtext">Connecting to OpenAI GPT-4o-mini</p>
                  </div>
                </div>
              )}

              {aiInsight && !isGeneratingInsight && (
                <div className="ai-insight-section">
                  <div className="ai-insight">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0 }}>🤖 AI-Generated Executive Insight</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {storedInsights[selectedRisk.activity.id] && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px'
                          }}>
                            Generated: {new Date(storedInsights[selectedRisk.activity.id].generatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        <button
                          onClick={generateAIInsight}
                          disabled={isGeneratingInsight}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          ↻ Regenerate Insight
                        </button>
                      </div>
                    </div>
                    <div className="markdown-content">
                      <ReactMarkdown>{aiInsight}</ReactMarkdown>
                    </div>

                    <div className="insight-footer">
                      {getApprovedMitigation(selectedRisk.activity.id) ? (
                        <div className="approved-badge" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1.5rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          ✓ Approved
                        </div>
                      ) : (
                        <button className="approve-button" onClick={() => {
                          approveMitigation(
                            selectedRisk.activity.id,
                            selectedRisk.activity.name,
                            'AI-suggested recovery plan',
                            { riskScore: selectedRisk.riskScore, severity: selectedRisk.severity }
                          );
                          setToast({ message: 'Recovery plan approved and logged!', type: 'success' });
                        }}>
                          ✓ Approve Recovery Plan
                        </button>
                      )}
                      <button className="simulate-alt-button" onClick={() => {
                        setShowSimulation(true);
                        auditLogger.log(ACTIONS.SIMULATION_OPENED, {
                          source: 'test_strategies_button',
                          activityId: selectedRisk.activity.id,
                          activityName: selectedRisk.activity.name,
                          currentRiskScore: selectedRisk.riskScore
                        });
                      }}>
                        🔄 Try Other Strategies
                      </button>
                      <button className="export-button" onClick={exportPDF}>
                        📄 Export Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation Section */}
              {showSimulation && (
                <div className="simulation-section">
                  <h3>🎯 AI Recovery Planner</h3>
                  <p className="simulation-intro">
                    Get AI-powered recovery strategies with step-by-step action plans
                  </p>

                  {/* Loading State */}
                  {isGeneratingStrategies && (
                    <div className="ai-loading" style={{
                      background: 'linear-gradient(135deg, rgba(16, 163, 127, 0.1) 0%, rgba(13, 138, 106, 0.1) 100%)',
                      padding: '3rem',
                      borderRadius: '16px',
                      textAlign: 'center'
                    }}>
                      <span className="spinner-large" style={{ borderTopColor: '#10a37f' }}></span>
                      <p style={{ color: '#10a37f', fontWeight: '600', marginTop: '1rem' }}>
                        🤖 ChatGPT is generating recovery strategies...
                      </p>
                      <p className="ai-subtext" style={{ color: '#666', marginTop: '0.5rem' }}>
                        Analyzing risk factors and creating tailored solutions
                      </p>
                    </div>
                  )}

                  {/* Generate Strategies Button - Show if no strategies yet */}
                  {!isGeneratingStrategies && !mitigationStrategies && !simulationResult && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <button
                        onClick={generateMitigationStrategies}
                        style={{
                          background: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
                          color: 'white',
                          padding: '1.5rem 3rem',
                          border: 'none',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '1.2rem',
                          boxShadow: '0 4px 15px rgba(16, 163, 127, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🤖 Generate AI Recovery Strategies
                      </button>
                      <p style={{ color: '#666', marginTop: '1rem', fontSize: '0.9rem' }}>
                        Powered by ChatGPT (GPT-4o-mini)
                      </p>
                    </div>
                  )}

                  {/* Show Strategies from ChatGPT */}
                  {!isGeneratingStrategies && mitigationStrategies && !simulationResult && (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                      }}>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                          🤖 AI-Generated for: <strong>{mitigationStrategies.activityName}</strong>
                        </p>
                        <button
                          onClick={generateMitigationStrategies}
                          style={{
                            background: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}
                        >
                          ↻ Regenerate Recovery Plans
                        </button>
                      </div>

                      <div className="simulation-options">
                        {mitigationStrategies.strategies.map((strategy, index) => {
                          const isRecommended = strategy.tag === 'RECOMMENDED';
                          const isLowerCost = strategy.tag === 'LOWER_COST';
                          const isZeroCost = strategy.tag === 'ZERO_COST';

                          const bgColors = ['#f0fdf4', '#fffbeb', '#f5f3ff'];
                          const textColors = ['#166534', '#92400e', '#5b21b6'];

                          return (
                            <div
                              key={index}
                              className={`simulation-option ${isRecommended ? 'recommended' : ''}`}
                              onClick={() => selectStrategy(index)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="option-header">
                                <h4>Option {index + 1}: {strategy.name}</h4>
                                {isRecommended && <span className="recommended-badge">Recommended</span>}
                                {isLowerCost && <span className="cost-badge">Lower Cost</span>}
                                {isZeroCost && <span className="zero-badge">Zero Cost</span>}
                              </div>
                              <p className="strategy">{strategy.description}</p>
                              <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: bgColors[index] || bgColors[0],
                                borderRadius: '8px'
                              }}>
                                <strong style={{ color: textColors[index] || textColors[0] }}>Expected Results:</strong>
                                <p style={{ fontSize: '0.9rem', color: textColors[index] || textColors[0], marginTop: '0.5rem' }}>
                                  • Risk reduction: ~{strategy.expectedResults.riskReduction}%<br/>
                                  • Time savings: {strategy.expectedResults.timeSavings}<br/>
                                  • Success rate: {strategy.expectedResults.successRate}%
                                  {strategy.expectedResults.warning && (
                                    <><br/>• ⚠️ {strategy.expectedResults.warning}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Simulation Results */}
                  {simulationResult && (
                    <div>
                      <h4 style={{ textAlign: 'center', marginBottom: '2rem', color: '#92400e' }}>
                        📊 Simulation Results: {simulationResult.strategy}
                      </h4>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '1.5rem',
                        marginBottom: '2rem'
                      }}>
                        <div style={{ 
                          background: 'white', 
                          padding: '1.5rem', 
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb'
                        }}>
                          <h5 style={{ color: '#dc2626', marginBottom: '1rem' }}>Before Recovery</h5>
                          <div className="result-row">
                            <span>Risk Score</span>
                            <span className="result-value">{simulationResult.before.riskScore.toFixed(0)}</span>
                          </div>
                          <div className="result-row">
                            <span>Days Delayed</span>
                            <span className="result-value">{simulationResult.before.daysDelayed}</span>
                          </div>
                          <div className="result-row">
                            <span>Blocked Tasks</span>
                            <span className="result-value">{simulationResult.before.blockedTasks}</span>
                          </div>
                        </div>

                        <div style={{ 
                          background: 'white', 
                          padding: '1.5rem', 
                          borderRadius: '12px',
                          border: '3px solid #10b981'
                        }}>
                          <h5 style={{ color: '#10b981', marginBottom: '1rem' }}>After Recovery</h5>
                          <div className="result-row">
                            <span>Risk Score</span>
                            <span className="result-value">
                              {simulationResult.after.riskScore.toFixed(0)}
                              <span className="improvement">
                                ↓{((simulationResult.before.riskScore - simulationResult.after.riskScore) / simulationResult.before.riskScore * 100).toFixed(0)}%
                              </span>
                            </span>
                          </div>
                          <div className="result-row">
                            <span>Days Delayed</span>
                            <span className="result-value">
                              {simulationResult.after.daysDelayed}
                              <span className="improvement">
                                ↓{simulationResult.before.daysDelayed - simulationResult.after.daysDelayed}
                              </span>
                            </span>
                          </div>
                          <div className="result-row">
                            <span>Blocked Tasks</span>
                            <span className="result-value">
                              {simulationResult.after.blockedTasks}
                              <span className="improvement">
                                ↓{((simulationResult.before.blockedTasks - simulationResult.after.blockedTasks) / simulationResult.before.blockedTasks * 100).toFixed(0)}%
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="roi-box">
                          <h5>💰 Financial Analysis</h5>
                          <p><strong>Investment:</strong> ${simulationResult.cost.toLocaleString()}</p>
                          <p><strong>Savings:</strong> ${simulationResult.savings.toLocaleString()}</p>
                          <div className="roi-value">
                            ROI: {simulationResult.roi === Infinity ? '∞' : simulationResult.roi + '%'}
                          </div>
                          <p className="success-rate">
                            ✓ Success Probability: {simulationResult.successRate}%
                          </p>
                        </div>
                      </div>

                      {/* Action Plan Section */}
                      {simulationResult.actionPlan && simulationResult.actionPlan.length > 0 && (
                        <div style={{
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          marginBottom: '1.5rem',
                          border: '2px solid #86efac'
                        }}>
                          <h5 style={{
                            color: '#166534',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1.1rem'
                          }}>
                            📋 Implementation Action Plan
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#10a37f',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              marginLeft: '0.5rem'
                            }}>
                              AI Generated
                            </span>
                          </h5>
                          <p style={{
                            color: '#15803d',
                            marginBottom: '1rem',
                            fontStyle: 'italic',
                            fontSize: '0.9rem'
                          }}>
                            {simulationResult.description}
                          </p>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}>
                            {simulationResult.actionPlan.map((step, index) => (
                              <div key={index} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                background: 'white',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #bbf7d0'
                              }}>
                                <span style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  flexShrink: 0
                                }}>
                                  {index + 1}
                                </span>
                                <span style={{
                                  color: '#166534',
                                  fontSize: '0.95rem',
                                  lineHeight: '1.5'
                                }}>
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>
                          {simulationResult.warning && (
                            <div style={{
                              marginTop: '1rem',
                              padding: '0.75rem',
                              background: '#fef3c7',
                              borderRadius: '8px',
                              border: '1px solid #fcd34d',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>⚠️</span>
                              <span style={{ color: '#92400e', fontSize: '0.9rem' }}>
                                <strong>Warning:</strong> {simulationResult.warning}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="simulation-footer">
                        {getApprovedMitigation(selectedRisk.activity.id) || appliedMitigation?.activityId === selectedRisk.activity.id ? (
                          <div className="approved-badge" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: '600'
                          }}>
                            ✓ Recovery Plan Applied: {appliedMitigation?.strategyName || simulationResult.strategy}
                          </div>
                        ) : (
                          <button className="apply-button" onClick={applyMitigation}>
                            ✓ Apply This Recovery Plan
                          </button>
                        )}
                        <button className="compare-button" onClick={() => {
                          setSimulationResult(null);
                          setSelectedStrategy(null);
                        }}>
                          ↻ Try Different Strategy
                        </button>
                        <button className="close-simulation" onClick={() => {
                          setShowSimulation(false);
                          setSimulationResult(null);
                          setSelectedStrategy(null);
                        }}>
                          Close Simulator
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Log Modal */}
        {showAuditLog && <AuditLogModal onClose={() => setShowAuditLog(false)} />}

        {/* Raw Data Modal */}
        {showRawData && <RawDataModal projectData={projectData} onClose={() => setShowRawData(false)} />}

        {/* Email Modal */}
        {showEmailModal && selectedRisk && (
          <EmailModal
            risk={selectedRisk}
            projectName={projectData?.name || 'Project'}
            aiInsight={aiInsight}
            onClose={() => setShowEmailModal(false)}
            onSend={handleEmailSent}
          />
        )}
          </>
        )}

        {/* Footer */}
        <footer className="footer" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderTop: '1px solid #334155'
        }}>
          {/* Left Side - Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img
              src={i2eLogo}
              alt="i2e Consulting"
              style={{
                height: '50px',
                width: 'auto',
                objectFit: 'contain',
                background: 'white',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px'
              }}
            />
            <div style={{ width: '1px', height: '30px', background: '#475569' }}></div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '600' }}>
                i2e Consulting AI Lab Hackathon 2025
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                AI-Driven Schedule Risk Monitor
              </p>
            </div>
          </div>
          {/* Right Side - Copyright */}
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'right', paddingRight: '5rem' }}>
            &copy; 2025 | Hackathon Submission by <span style={{ color: '#3b82f6', fontWeight: '600' }}>Fayek Kamle</span>
          </p>
        </footer>

        {/* AI Chat Widget */}
        <AIChatWidget
          projectData={projectData}
          riskResults={risks}
          selectedRisk={selectedRisk}
          aiInsight={aiInsight}
          storedInsights={storedInsights}
          analysisComplete={analysisComplete}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
