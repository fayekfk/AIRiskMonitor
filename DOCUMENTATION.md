# PM Risk Monitor - Application Documentation

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Application Architecture](#2-application-architecture)
3. [Application Flow](#3-application-flow)
4. [Application Components](#4-application-components)
5. [Application Dependencies](#5-application-dependencies)
6. [Application Security](#6-application-security)
7. [Application Performance](#7-application-performance)
8. [Application Testing](#8-application-testing)
9. [Application Deployment](#9-application-deployment)
10. [Application Monitoring](#10-application-monitoring)
11. [Application Support](#11-application-support)
12. [Technical Documentation](#12-technical-documentation)
13. [User Documentation](#13-user-documentation)
14. [User Manual](#14-user-manual)

---

## 1. Application Overview

### 1.1 Purpose
**PM Risk Monitor** is an AI-Driven Schedule Risk Monitoring application designed for project managers to identify, analyze, and mitigate project schedule risks using artificial intelligence (ChatGPT/GPT-4o-mini).

### 1.2 Key Features
- **AI-Powered Risk Analysis**: Uses OpenAI's GPT-4o-mini model to analyze project activities and calculate risk scores
- **Multi-Project Management**: Manage multiple projects simultaneously with sample data templates
- **Real-time Risk Scoring**: Calculate risk scores (0-100) based on 5 key factors
- **AI Executive Insights**: Generate detailed executive summaries for each risk
- **Mitigation Strategy Generation**: AI-generated recovery strategies with simulation capabilities
- **Email Notifications**: Send risk alerts via EmailJS integration
- **PDF Report Generation**: Export professional risk analysis reports
- **Audit Trail System**: Complete logging of all user actions for compliance
- **Interactive AI Chat Widget**: Natural language queries about project data
- **Data Import/Export**: CSV import and Excel/PDF export capabilities

### 1.3 Target Users
- Project Managers
- Program Managers
- Risk Analysts
- Executive Stakeholders
- PMO Teams

### 1.4 Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19.2.0 |
| Build Tool | Vite (rolldown-vite 7.2.5) |
| Charts | Recharts 3.5.1 |
| AI Integration | OpenAI GPT-4o-mini |
| Email Service | EmailJS |
| PDF Generation | jsPDF + jsPDF-autotable |
| CSV Parsing | PapaParse |
| Excel Export | xlsx (SheetJS) |
| Styling | Custom CSS |

---

## 2. Application Architecture

### 2.1 Architecture Pattern
The application follows a **Single Page Application (SPA)** architecture with component-based design.

```
┌─────────────────────────────────────────────────────────────┐
│                      PM Risk Monitor                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   React Frontend                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │    App      │ │  AI Chat    │ │   Modals    │   │   │
│  │  │  Component  │ │   Widget    │ │ (Email/PDF) │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Utility Layer                       │   │
│  │  ┌─────────────┐ ┌─────────────┐                    │   │
│  │  │auditLogger  │ │pdfGenerator │                    │   │
│  │  └─────────────┘ └─────────────┘                    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │               External Services                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  OpenAI API │ │  EmailJS    │ │LocalStorage │   │   │
│  │  │ (GPT-4o-mini)│ │             │ │             │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure
```
pm-risk-demo/
├── public/
│   ├── favicon.svg
│   └── vite.svg
├── src/
│   ├── assets/
│   │   ├── AI_RiskMonitor_Transparent.png
│   │   ├── agent-icon.png
│   │   ├── i2eLogo.webp
│   │   └── react.svg
│   ├── utils/
│   │   ├── auditLogger.js      # Audit trail system
│   │   └── pdfGenerator.js     # PDF report generation
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Application styles
│   ├── index.css               # Global styles
│   └── main.jsx                # Application entry point
├── sample_project_data.csv     # Sample project data
├── sample_project_advanced.csv # Advanced sample data
├── package.json
├── vite.config.js
└── index.html
```

### 2.3 Data Flow
```
CSV Upload → Parse Data → Calculate Risk Scores → Display Dashboard
                ↓
        OpenAI API (Risk Analysis)
                ↓
        Risk Results → User Selection → AI Insights
                                ↓
                    Mitigation Strategies → Simulation
                                ↓
                        Export (PDF/Email)
```

---

## 3. Application Flow

### 3.1 User Journey Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Launch    │────▶│ Upload CSV / │────▶│  Run AI Risk    │
│    App      │     │ Load Sample  │     │   Analysis      │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Export    │◀────│   Simulate   │◀────│  View Risk      │
│   Report    │     │  Mitigation  │     │  Dashboard      │
└─────────────┘     └──────────────┘     └─────────────────┘
```

### 3.2 Risk Analysis Flow
1. **Data Input**: User uploads CSV or selects sample project
2. **Critical Path Calculation**: System identifies critical path activities
3. **AI Analysis**: Activities sent to GPT-4o-mini for risk scoring
4. **Factor Calculation**: 5 risk factors calculated per activity
5. **Severity Classification**: Risks categorized as Critical/High/Medium/Low
6. **Dashboard Display**: Results shown with charts and cards

### 3.3 Risk Scoring Algorithm
Risk scores (0-100) are calculated using weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Schedule Delay | 30% | Days delayed vs. planned duration |
| Critical Path Impact | 25% | Impact on project completion date |
| Float Consumption | 20% | Buffer time consumed |
| Resource Overallocation | 15% | Resource utilization above 100% |
| Progress Deviation | 10% | Actual vs. expected progress |

### 3.4 Severity Thresholds
| Score Range | Severity | Color |
|-------------|----------|-------|
| 70-100 | Critical | Red |
| 50-69 | High | Orange |
| 30-49 | Medium | Yellow |
| 0-29 | Low | Green |

---

## 4. Application Components

### 4.1 Core Components

#### 4.1.1 Main App Component (`App.jsx`)
- **Purpose**: Main application container
- **State Management**: useState/useMemo/useCallback hooks
- **Features**: Project management, risk analysis, dashboard rendering

#### 4.1.2 CSVUploader Component
- **Purpose**: Handle CSV file uploads and parsing
- **Features**: Drag-and-drop, file validation, data transformation

#### 4.1.3 AIChatWidget Component
- **Purpose**: Interactive AI assistant for project queries
- **Features**: Natural language processing, email sending via chat, context-aware responses

#### 4.1.4 EmailModal Component
- **Purpose**: Send risk alert emails
- **Features**: HTML email generation, recipient validation, EmailJS integration

#### 4.1.5 RawDataModal Component
- **Purpose**: Display and export raw project data
- **Features**: Table view, CSV export, data inspection

#### 4.1.6 AuditLogModal Component
- **Purpose**: Display audit trail logs
- **Features**: Log filtering, search, CSV export

### 4.2 Utility Components

#### 4.2.1 Toast Component
- **Purpose**: Display notifications
- **Types**: Success, Error, Warning, Info

#### 4.2.2 ErrorBoundary Component
- **Purpose**: Catch and handle React errors gracefully

### 4.3 Visualization Components
- **Recharts Integration**:
  - RadarChart (Risk factors)
  - PieChart (Activity status breakdown)
  - BarChart (Risk distribution)
  - LineChart (Risk trends)

---

## 5. Application Dependencies

### 5.1 Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.0 | UI framework |
| react-dom | 19.2.0 | React DOM rendering |
| react-router-dom | 7.10.1 | Client-side routing |
| recharts | 3.5.1 | Data visualization charts |
| @emailjs/browser | 4.4.1 | Email sending service |
| jspdf | 3.0.4 | PDF generation |
| jspdf-autotable | 5.0.2 | PDF table generation |
| papaparse | 5.5.3 | CSV parsing |
| xlsx | 0.18.5 | Excel file handling |
| date-fns | 4.1.0 | Date formatting |
| file-saver | 2.0.5 | File download handling |
| react-markdown | 10.1.0 | Markdown rendering |

### 5.2 Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| vite | rolldown-vite 7.2.5 | Build tool |
| @vitejs/plugin-react | 5.1.1 | React plugin for Vite |
| eslint | 9.39.1 | Code linting |
| eslint-plugin-react-hooks | 7.0.1 | React hooks linting |
| eslint-plugin-react-refresh | 0.4.24 | Fast refresh linting |

### 5.3 External Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| OpenAI API | AI risk analysis & insights | GPT-4o-mini model |
| EmailJS | Email delivery | Service ID, Template ID, Public Key |

---

## 6. Application Security

### 6.1 Security Measures Implemented

#### 6.1.1 API Key Management
- **Current State**: API keys stored in source code (demo only)
- **Recommendation**: Use environment variables for production

#### 6.1.2 Data Storage
- **Local Storage**: Used for session data, audit logs, AI insights
- **Session Storage**: Used for session IDs
- **No Server-Side Storage**: All data processed client-side

#### 6.1.3 Input Validation
- CSV file format validation
- Email address format validation
- User input sanitization

#### 6.1.4 Audit Trail
The audit logger tracks all user actions:
```javascript
ACTIONS = {
  APP_LOADED, USER_LOGIN, USER_LOGOUT,
  PROJECT_LOADED, CSV_IMPORTED, DATA_RESET,
  RISK_ANALYSIS_RUN, RISK_VIEWED,
  AI_INSIGHT_REQUESTED, AI_INSIGHT_GENERATED,
  MITIGATION_SIMULATED, REPORT_EXPORTED,
  EMAIL_SENT, ERROR_OCCURRED
}
```

### 6.2 Security Recommendations for Production

1. **Environment Variables**: Move API keys to `.env` files
2. **Backend Proxy**: Route API calls through a secure backend
3. **Authentication**: Implement proper user authentication
4. **HTTPS**: Ensure all communications are encrypted
5. **CSP Headers**: Implement Content Security Policy
6. **Rate Limiting**: Add API call rate limiting

---

## 7. Application Performance

### 7.1 Performance Optimizations

#### 7.1.1 React Optimizations
- **useMemo**: Memoization of filtered/sorted risk lists
- **useCallback**: Memoization of event handlers
- **Lazy Loading**: Components loaded on demand

#### 7.1.2 Rendering Optimizations
- CSS transitions instead of JavaScript animations
- Virtual scrolling for large data sets (future enhancement)
- Debounced search input

#### 7.1.3 API Optimizations
- Batch risk analysis requests to OpenAI
- Local fallback calculation when API unavailable
- Cached AI insights in localStorage

### 7.2 Performance Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Initial Load | < 3s | ~1.5s |
| Risk Analysis (50 activities) | < 10s | ~5-7s |
| AI Insight Generation | < 5s | ~2-3s |
| PDF Generation | < 2s | ~1s |

### 7.3 Bundle Optimization
- Vite code splitting
- Tree shaking for unused code
- Minification in production build

---

## 8. Application Testing

### 8.1 Testing Strategy

#### 8.1.1 Manual Testing
- UI/UX testing across browsers
- CSV upload with various file formats
- API error handling scenarios
- Email delivery verification

#### 8.1.2 Recommended Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-001 | Upload valid CSV | Data parsed and displayed |
| TC-002 | Upload invalid CSV | Error message shown |
| TC-003 | Run AI analysis | Risk scores calculated |
| TC-004 | API timeout | Fallback calculation used |
| TC-005 | Generate insight | AI insight displayed |
| TC-006 | Send email | Email delivered successfully |
| TC-007 | Export PDF | PDF downloaded |
| TC-008 | Clear data | All data reset |

### 8.2 Future Testing Recommendations
- Jest/Vitest for unit testing
- React Testing Library for component tests
- Cypress for E2E testing
- Playwright for cross-browser testing

---

## 9. Application Deployment

### 9.1 Build Commands
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### 9.2 Deployment Options

#### 9.2.1 Static Hosting (Recommended)
- **Vercel**: `vercel deploy`
- **Netlify**: Drag-and-drop `dist` folder
- **GitHub Pages**: Deploy `dist` folder

#### 9.2.2 Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

### 9.3 Environment Configuration
Create `.env` file for production:
```env
VITE_OPENAI_API_KEY=your_api_key_here
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 10. Application Monitoring

### 10.1 Built-in Monitoring

#### 10.1.1 Audit Trail System
The application includes a comprehensive audit logging system:
```javascript
// Logged Events
- APP_LOADED: Application startup
- RISK_ANALYSIS_RUN: Analysis execution
- AI_INSIGHT_GENERATED: AI insight creation
- EMAIL_SENT: Email notifications
- ERROR_OCCURRED: Application errors
```

#### 10.1.2 Console Logging
- API response logging
- Error stack traces
- Performance timing logs

### 10.2 Recommended External Monitoring
| Tool | Purpose |
|------|---------|
| Sentry | Error tracking |
| LogRocket | Session replay |
| Google Analytics | Usage analytics |
| Datadog | APM monitoring |

### 10.3 Health Indicators
- API connectivity status
- LocalStorage availability
- Browser compatibility checks

---

## 11. Application Support

### 11.1 Troubleshooting Guide

#### Issue: CSV Upload Fails
**Symptoms**: Error message on upload
**Solutions**:
1. Verify CSV format matches expected columns
2. Check for special characters in data
3. Ensure file encoding is UTF-8

#### Issue: AI Analysis Not Working
**Symptoms**: "ChatGPT unavailable" message
**Solutions**:
1. Check API key validity
2. Verify internet connectivity
3. Check API rate limits
4. System falls back to local calculation

#### Issue: Email Not Sending
**Symptoms**: Email send fails
**Solutions**:
1. Verify recipient email format
2. Check EmailJS configuration
3. Verify EmailJS quota not exceeded

### 11.2 Support Contacts
- **Developer**: Fayek Kamle
- **Project**: i2e Consulting AI Lab Hackathon 2025

### 11.3 Common Error Messages
| Error | Meaning | Action |
|-------|---------|--------|
| "Invalid CSV format" | File structure incorrect | Use sample CSV as template |
| "API rate limit exceeded" | Too many API calls | Wait and retry |
| "Email validation failed" | Invalid email format | Check email addresses |

---

## 12. Technical Documentation

### 12.1 API Integration

#### 12.1.1 OpenAI API
**Endpoint**: `https://api.openai.com/v1/chat/completions`
**Model**: `gpt-4o-mini`

**Risk Analysis Request**:
```javascript
{
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: 'You are an expert project risk analyst...'
  }, {
    role: 'user',
    content: 'Analyze these activities for risk: [...]'
  }]
}
```

**Response Format**:
```javascript
[{
  id: 'A-001',
  riskScore: 75,
  factors: {
    scheduleDelay: 80,
    criticalPathImpact: 90,
    floatConsumption: 60,
    resourceOverallocation: 50,
    progressDeviation: 40
  }
}]
```

#### 12.1.2 EmailJS API
**Service**: EmailJS browser SDK
**Configuration**:
```javascript
EMAILJS_CONFIG = {
  serviceId: 'service_xxxxx',
  templateId: 'template_xxxxx',
  publicKey: 'public_key_xxxxx'
}
```

### 12.2 Data Models

#### 12.2.1 Project Model
```typescript
interface Project {
  id: string;
  name: string;
  category: string;
  budget: number;
  activities: Activity[];
}
```

#### 12.2.2 Activity Model
```typescript
interface Activity {
  id: string;
  name: string;
  duration: number;
  dependencies: string[];
  resource: string;
  startDate: string;
  status: 'completed' | 'in-progress' | 'not-started';
  daysDelayed: number;
  allocation: number;
  completionPercent: number;
  isCriticalPath: boolean;
  float: number;
  type: string;
}
```

#### 12.2.3 Risk Result Model
```typescript
interface RiskResult {
  activity: Activity;
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  factors: {
    scheduleDelay: number;
    criticalPathImpact: number;
    floatConsumption: number;
    resourceOverallocation: number;
    progressDeviation: number;
  };
  aiGenerated: boolean;
}
```

### 12.3 CSV File Format
Required columns for CSV import:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| ID | string | Yes | Unique activity identifier |
| Name | string | Yes | Activity name |
| Duration | number | Yes | Duration in days |
| Dependencies | string | No | Pipe-separated IDs (A-001\|A-002) |
| Resource | string | No | Resource identifier |
| StartDate | string | Yes | YYYY-MM-DD format |
| Status | string | Yes | completed/in-progress/not-started |
| DaysDelayed | number | No | Days behind schedule |
| Allocation | number | No | Resource allocation % |
| CompletionPercent | number | No | Progress percentage |
| Type | string | No | Activity category |

---

## 13. User Documentation

### 13.1 Getting Started

#### Step 1: Access the Application
Open the application in a modern web browser (Chrome, Firefox, Edge, Safari).

#### Step 2: Load Project Data
Choose one of the following options:
- **Upload CSV**: Click "Upload CSV" and select your project file
- **Load Sample**: Click a sample project button to use demo data

#### Step 3: Run Risk Analysis
Click the "🚀 Run AI Risk Analysis" button to analyze your project.

#### Step 4: Review Results
- View risk dashboard with charts and statistics
- Browse risk cards/list for individual activities
- Click on a risk to see detailed information

#### Step 5: Generate Insights
Select a risk and click "✨ Generate AI Insight" for executive recommendations.

#### Step 6: Take Action
- Generate mitigation strategies
- Simulate recovery scenarios
- Export PDF reports
- Send email alerts

### 13.2 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo, User Info, Navigation                         │
├─────────────────────────────────────────────────────────────┤
│ Project Overview: Name, Activities, Budget, Stats          │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  Risk Cards/    │    Risk Details Panel                    │
│  List View      │    - Score, Factors, Chart               │
│                 │    - AI Insight                           │
│                 │    - Mitigation Strategies               │
│                 │    - Action Buttons                       │
│                 │                                           │
├─────────────────┴───────────────────────────────────────────┤
│ Footer: Copyright, Credits                                  │
├─────────────────────────────────────────────────────────────┤
│ AI Chat Widget (floating)                                   │
└─────────────────────────────────────────────────────────────┘
```

### 13.3 Feature Guide

| Feature | Location | Description |
|---------|----------|-------------|
| Project Selector | Header dropdown | Switch between loaded projects |
| View Toggle | Controls bar | Switch between card and list view |
| Search | Controls bar | Filter risks by name/ID |
| Severity Filter | Controls bar | Filter by risk level |
| Sort Options | Controls bar | Sort by score/name/delay |
| AI Chat | Floating button (bottom-right) | Ask questions about data |
| Audit Log | Header menu | View all user actions |
| Export PDF | Detail panel | Download risk report |
| Email Alert | Detail panel | Send risk notification |

---

## 14. User Manual

### 14.1 Complete User Workflow

#### 14.1.1 Preparing Your Data
1. Create a CSV file with your project activities
2. Include required columns: ID, Name, Duration, StartDate, Status
3. Add optional columns for richer analysis
4. Use the sample CSV as a template

#### 14.1.2 Uploading Project Data
1. Click "Upload CSV" button
2. Select your CSV file from file explorer
3. Wait for parsing confirmation
4. Review the project overview

#### 14.1.3 Running Risk Analysis
1. Click "🚀 Run AI Risk Analysis"
2. Wait for AI processing (5-10 seconds)
3. View analysis complete notification
4. Explore the risk dashboard

#### 14.1.4 Understanding Risk Scores
- **Score 0-29 (Low)**: Activity on track, minimal intervention needed
- **Score 30-49 (Medium)**: Monitor closely, may need attention
- **Score 50-69 (High)**: Requires immediate attention
- **Score 70-100 (Critical)**: Urgent intervention required

#### 14.1.5 Viewing Risk Details
1. Click on any risk card/row
2. Review the detail panel on the right
3. Check the radar chart for factor breakdown
4. Review activity information

#### 14.1.6 Generating AI Insights
1. Select a risk from the list
2. Click "✨ Generate AI Insight"
3. Wait for ChatGPT response (2-3 seconds)
4. Read the executive summary with:
   - Situation analysis
   - Business impact assessment
   - Recommended actions
   - Urgency level

#### 14.1.7 Creating Mitigation Strategies
1. With a risk selected, scroll to mitigation section
2. Click "🎯 Generate Recovery Strategies"
3. Review 3 AI-generated strategies
4. Compare costs, timelines, and effectiveness
5. Select a strategy to simulate

#### 14.1.8 Simulating Recovery
1. Choose a mitigation strategy
2. Click "▶️ Simulate Strategy"
3. Review simulation results:
   - Projected new risk score
   - Cost estimate
   - Timeline impact
   - Success probability

#### 14.1.9 Exporting Reports
**PDF Export:**
1. Click "📄 Export Report"
2. PDF downloads automatically
3. Includes all risk analysis data

**Email Export:**
1. Click "📧 Share via Email"
2. Enter recipient email addresses
3. Customize subject and message
4. Click "Send Email"

#### 14.1.10 Using AI Chat Assistant
1. Click the floating chat icon (bottom-right)
2. Ask questions in natural language:
   - "What are the top 3 risks?"
   - "Which activities are delayed?"
   - "Show me critical path activities"
   - "Send risk report to email@example.com"
3. Receive AI-powered responses

### 14.2 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Escape | Close modals |
| Enter | Submit forms |

### 14.3 Tips & Best Practices

1. **Regular Analysis**: Run analysis weekly for active projects
2. **Monitor Critical Path**: Focus on critical path activities first
3. **Act on Insights**: Use AI insights for decision-making
4. **Document Actions**: Check audit log for compliance
5. **Multi-Project**: Compare risks across projects

### 14.4 Glossary

| Term | Definition |
|------|------------|
| Risk Score | 0-100 rating indicating risk severity |
| Critical Path | Sequence of activities determining project duration |
| Float | Buffer time available for an activity |
| Severity | Classification (Critical/High/Medium/Low) |
| Mitigation | Strategy to reduce or eliminate risk |
| Allocation | Resource utilization percentage |
| AI Insight | ChatGPT-generated executive summary |

---

## Appendix A: Sample CSV Template

```csv
ID,Name,Duration,Dependencies,Resource,StartDate,Status,DaysDelayed,Allocation,CompletionPercent,Type
A-001,Requirements Gathering,8,,R-001,2025-01-01,completed,0,100,100,Planning
A-002,System Design,15,A-001,R-002,2025-01-09,in-progress,3,120,65,Design
A-003,Development Phase 1,20,A-002,R-003,2025-01-24,not-started,0,100,0,Development
```

---

## Appendix B: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial release for i2e Hackathon 2025 |

---

## Appendix C: License & Credits

**Application**: PM Risk Monitor - AI-Driven Schedule Risk Monitoring
**Developer**: Fayek Kamle
**Event**: i2e Consulting AI Lab Hackathon 2025
**AI Model**: OpenAI GPT-4o-mini
**Framework**: React 19 + Vite

---

*Document generated: December 2025*
*PM Risk Monitor v1.0.0*

