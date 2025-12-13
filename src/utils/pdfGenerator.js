// PDF Report Generator
// Creates professional PDF reports from risk analysis data

import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    doc.text(`Project: ${projectData.name}`, 14, 32);
    doc.setFontSize(10);
    doc.text(`Budget: $${projectData.budget.toLocaleString()} | Duration: ${projectData.duration}`, 14, 38);
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
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const summaryData = [
      ['Total Activities', projectData.activities.length.toString()],
      ['Critical Path Activities', projectData.activities.filter(a => a.isCriticalPath).length.toString()],
      ['Critical Risks', critical.toString()],
      ['High Risks', high.toString()],
      ['Medium Risks', medium.toString()],
      ['Low Risks', low.toString()],
      ['Total Risks Identified', risks.length.toString()]
    ];
    
    doc.autoTable({
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
      risk.activity.id,
      risk.activity.name.substring(0, 40),
      risk.riskScore.toFixed(0),
      risk.severity.toUpperCase(),
      risk.activity.daysDelayed > 0 ? `${risk.activity.daysDelayed}d late` : 'On time'
    ]);
    
    doc.autoTable({
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
      if (this.currentY > 240) {
        doc.addPage();
        this.currentY = 20;
      }
      
      // Risk header
      doc.setFontSize(12);
      doc.setTextColor(31, 78, 120);
      doc.text(`Risk #${index + 1}: ${risk.activity.name}`, 14, this.currentY);
      this.currentY += 6;
      
      // Risk details
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      const details = [
        `Activity ID: ${risk.activity.id}`,
        `Risk Score: ${risk.riskScore.toFixed(0)}/100 (${risk.severity.toUpperCase()})`,
        `Days Delayed: ${risk.activity.daysDelayed}`,
        `Resource: ${risk.activity.resource} (${risk.activity.allocation}% allocated)`,
        `Critical Path: ${risk.activity.isCriticalPath ? 'Yes' : 'No'}`,
        `Float: ${risk.activity.float} days`,
        `Dependencies: ${risk.activity.dependencies.length} tasks`,
        ''
      ];
      
      details.forEach(detail => {
        doc.text(detail, 20, this.currentY);
        this.currentY += 5;
      });
      
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
      
      this.currentY += 5;
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