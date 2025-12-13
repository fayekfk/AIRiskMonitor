// PDF Report Generator
// Creates professional PDF reports from risk analysis data

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class PDFGenerator {
  constructor() {
    this.doc = null;
  }

  generateRiskReport(projectData, risks, insights = null) {
    this.doc = new jsPDF();
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    
    // Header
    this.addHeader(projectData);
    
    // Executive Summary
    this.addExecutiveSummary(projectData, risks);
    
    // Risk Summary Table
    this.addRiskSummary(risks);
    
    // Detailed Risks
    this.addDetailedRisks(risks);
    
    // AI Insights (if available)
    if (insights) {
      this.addAIInsights(insights);
    }
    
    // Footer
    this.addFooter();
    
    // Generate filename
    const filename = `Risk_Analysis_${projectData.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    return {
      doc: this.doc,
      filename: filename
    };
  }

  addHeader(projectData) {
    const doc = this.doc;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(31, 78, 120); // Blue color
    doc.text('AI-Driven Risk Analysis Report', 14, 22);
    
    // Project Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Project: ${projectData.name || 'Unknown Project'}`, 14, 32);
    doc.setFontSize(10);

    // Calculate duration if not provided
    const duration = projectData.duration ||
      (projectData.activities?.length > 0
        ? `${projectData.activities.reduce((sum, a) => sum + (a.duration || 0), 0)} days (total)`
        : 'N/A');
    const budget = projectData.budget ? `$${projectData.budget.toLocaleString()}` : 'N/A';

    doc.text(`Budget: ${budget} | Duration: ${duration}`, 14, 38);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 44);
    
    // Horizontal line
    doc.setDrawColor(31, 78, 120);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);
    
    this.currentY = 55;
  }

  addExecutiveSummary(projectData, risks) {
    const doc = this.doc;

    doc.setFontSize(14);
    doc.setTextColor(31, 78, 120);
    doc.text('Executive Summary', 14, this.currentY);
    this.currentY += 8;

    // Risk counts
    const critical = risks.filter(r => r.severity === 'critical').length;
    const high = risks.filter(r => r.severity === 'high').length;
    const medium = risks.filter(r => r.severity === 'medium').length;
    const low = risks.filter(r => r.severity === 'low').length;

    // Calculate total EMV (Expected Monetary Value)
    const totalEMV = risks.reduce((sum, r) => {
      const prob = r.activity.Probability || 0.5;
      const cost = r.activity.Cost_Impact_of_Risk || 0;
      return sum + (prob * cost);
    }, 0);

    // Calculate total potential delay
    const totalDelayImpact = risks.reduce((sum, r) => {
      return sum + (r.activity.Delay_Impact_days || 0);
    }, 0);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const activities = projectData.activities || [];
    const summaryData = [
      ['Total Activities', activities.length.toString()],
      ['Critical Path Activities', activities.filter(a => a.On_Critical_Path || a.isCriticalPath).length.toString()],
      ['Critical Risks', critical.toString()],
      ['High Risks', high.toString()],
      ['Medium Risks', medium.toString()],
      ['Low Risks', low.toString()],
      ['Total Risks Identified', risks.length.toString()],
      ['Total Expected Monetary Value (EMV)', `$${totalEMV.toLocaleString()}`],
      ['Total Potential Delay Impact', `${totalDelayImpact} days`]
    ];

    autoTable(doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 120], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 80, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    this.currentY = doc.lastAutoTable.finalY + 10;
  }

  addRiskSummary(risks) {
    const doc = this.doc;
    
    // Add new page if needed
    if (this.currentY > 250) {
      doc.addPage();
      this.currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 120);
    doc.text('Risk Distribution', 14, this.currentY);
    this.currentY += 8;
    
    // Top 10 risks table
    const top10 = risks.slice(0, 10);
    const riskData = top10.map((risk, index) => [
      (index + 1).toString(),
      risk.activity.Activity_ID || risk.activity.id,
      (risk.activity.Activity_Name || risk.activity.name).substring(0, 40),
      risk.riskScore.toFixed(0),
      risk.severity.toUpperCase(),
      (risk.activity.Delay_Impact_days || risk.activity.daysDelayed || 0) > 0 ? `${risk.activity.Delay_Impact_days || risk.activity.daysDelayed}d late` : 'On time'
    ]);
    
    autoTable(doc, {
      startY: this.currentY,
      head: [['#', 'ID', 'Activity', 'Score', 'Severity', 'Status']],
      body: riskData,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 120], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 80 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const severity = data.cell.raw.toLowerCase();
          if (severity === 'critical') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (severity === 'high') {
            data.cell.styles.textColor = [234, 88, 12];
            data.cell.styles.fontStyle = 'bold';
          } else if (severity === 'medium') {
            data.cell.styles.textColor = [202, 138, 4];
          }
        }
      }
    });
    
    this.currentY = doc.lastAutoTable.finalY + 10;
  }

  addDetailedRisks(risks) {
    const doc = this.doc;
    const top5 = risks.slice(0, 5);

    top5.forEach((risk, index) => {
      // Add new page if needed
      if (this.currentY > 200) {
        doc.addPage();
        this.currentY = 20;
      }

      // Risk header
      doc.setFontSize(12);
      doc.setTextColor(31, 78, 120);
      doc.text(`Risk #${index + 1}: ${risk.activity.Activity_Name || risk.activity.name}`, 14, this.currentY);
      this.currentY += 6;

      // Activity Info Section
      doc.setFontSize(9);
      doc.setTextColor(46, 92, 138);
      doc.text('Activity Info:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Activity ID: ${risk.activity.Activity_ID || risk.activity.id} | Work Package: ${risk.activity.Work_Package || 'N/A'}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Risk Score: ${risk.riskScore.toFixed(0)}/100 (${risk.severity.toUpperCase()})`, 24, this.currentY);
      this.currentY += 5;

      // Schedule Section
      doc.setTextColor(46, 92, 138);
      doc.text('Schedule:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Planned Start: ${risk.activity.Planned_Start || risk.activity.startDate || 'N/A'} | Planned Finish: ${risk.activity.Planned_Finish || 'N/A'}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Planned Duration: ${risk.activity.Planned_Duration || risk.activity.duration || 0}d | Remaining: ${risk.activity.Remaining_Duration !== undefined ? risk.activity.Remaining_Duration : 'N/A'}d`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Actual Start: ${risk.activity.Actual_Start || 'N/A'} | Actual Finish: ${risk.activity.Actual_Finish || 'N/A'}`, 24, this.currentY);
      this.currentY += 5;

      // Baseline Section
      doc.setTextColor(46, 92, 138);
      doc.text('Baseline:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Baseline Start: ${risk.activity.Baseline_Start || risk.activity.Planned_Start || 'N/A'} | Baseline Finish: ${risk.activity.Baseline_Finish || 'N/A'}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Baseline Duration: ${risk.activity.Baseline_Duration || risk.activity.Planned_Duration || risk.activity.duration || 0}d`, 24, this.currentY);
      this.currentY += 5;

      // Progress Section
      doc.setTextColor(46, 92, 138);
      doc.text('Progress:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Percent Complete: ${risk.activity.Percent_Complete !== undefined ? risk.activity.Percent_Complete : (risk.activity.completionPercent || 0)}% | Status: ${risk.activity.Status || risk.activity.status || 'N/A'}`, 24, this.currentY);
      this.currentY += 5;

      // CPM Analysis Section
      doc.setTextColor(46, 92, 138);
      doc.text('CPM Analysis:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  ES: ${risk.activity.ES || 0} | EF: ${risk.activity.EF || 0} | LS: ${risk.activity.LS || 0} | LF: ${risk.activity.LF || 0}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Total Float: ${risk.activity.Total_Float_days !== undefined ? risk.activity.Total_Float_days : (risk.activity.float || 0)}d | On Critical Path: ${(risk.activity.On_Critical_Path || risk.activity.isCriticalPath) ? 'Yes' : 'No'}`, 24, this.currentY);
      this.currentY += 5;

      // Dependencies Section
      doc.setTextColor(46, 92, 138);
      doc.text('Dependencies:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Predecessors: ${risk.activity.Predecessor_ID || 'None'} | Successors: ${risk.activity.Successor_ID || 'None'}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Dependency Type: ${risk.activity.Dependency_Type || 'FS'}`, 24, this.currentY);
      this.currentY += 5;

      // Resources Section
      doc.setTextColor(46, 92, 138);
      doc.text('Resources:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Resource ID: ${risk.activity.Resource_ID || risk.activity.resource || 'TBD'} | Role: ${risk.activity.Role || 'N/A'}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  FTE Allocation: ${risk.activity.FTE_Allocation || risk.activity.allocation || 100}% | Max FTE: ${risk.activity.Resource_Max_FTE || 1.0}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Skill Tags: ${risk.activity.Skill_Tags || 'Not specified'}`, 24, this.currentY);
      this.currentY += 5;

      // Risk Data Section
      const probability = risk.activity.Probability || 0.5;
      const costImpact = risk.activity.Cost_Impact_of_Risk || 0;
      const delayImpact = risk.activity.Delay_Impact_days !== undefined ? risk.activity.Delay_Impact_days : (risk.activity.daysDelayed || 0);
      const emv = probability * costImpact;

      doc.setTextColor(46, 92, 138);
      doc.text('Risk Data:', 20, this.currentY);
      this.currentY += 4;
      doc.setTextColor(0, 0, 0);
      doc.text(`  Probability: ${(probability * 100).toFixed(0)}% | Delay Impact: ${delayImpact}d | Cost Impact: $${costImpact.toLocaleString()}`, 24, this.currentY);
      this.currentY += 4;
      doc.text(`  Expected Monetary Value (EMV): $${emv.toLocaleString()}`, 24, this.currentY);
      this.currentY += 5;

      // Risk factors
      doc.setFontSize(10);
      doc.setTextColor(46, 92, 138);
      doc.text('Risk Factor Breakdown:', 20, this.currentY);
      this.currentY += 5;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      Object.entries(risk.factors).forEach(([factor, value]) => {
        doc.text(`  • ${factor}: ${value.toFixed(0)}/100`, 24, this.currentY);
        this.currentY += 4;
      });

      this.currentY += 8;
    });
  }

  addAIInsights(insights) {
    const doc = this.doc;
    
    // Add new page
    doc.addPage();
    this.currentY = 20;
    
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 120);
    doc.text('AI-Generated Executive Insights', 14, this.currentY);
    this.currentY += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Split insight text into lines
    const splitText = doc.splitTextToSize(insights, 180);
    doc.text(splitText, 14, this.currentY);
  }

  addFooter() {
    const doc = this.doc;
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | Generated by AI Risk Monitor | ${new Date().toLocaleDateString()}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
  }

  save(filename) {
    this.doc.save(filename);
  }
}

export default new PDFGenerator();