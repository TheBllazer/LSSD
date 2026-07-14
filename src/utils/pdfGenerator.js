import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = (report) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 212, 255);
  doc.text('LSSD RAPPORT D\'INTERVENTION', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Rapport #${report.reportNumber}`, 15, yPosition);
  yPosition += 8;

  // Main content
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const sections = [
    { label: 'Date', value: report.date },
    { label: 'Agent Responsable', value: report.officer },
    { label: 'Type', value: report.type },
    { label: 'Statut', value: report.status },
    { label: 'Sujet', value: report.subject },
    { label: 'Lieu', value: report.location },
  ];

  sections.forEach(section => {
    doc.setFont(undefined, 'bold');
    doc.text(`${section.label}:`, 15, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(section.value || 'N/A', 50, yPosition);
    yPosition += 8;

    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 15;
    }
  });

  yPosition += 5;
  doc.setFont(undefined, 'bold');
  doc.text('Détails:', 15, yPosition);
  yPosition += 5;

  // Parse HTML content
  const details = report.details
    .replace(/<[^>]*>/g, '')
    .substring(0, 500);

  const detailsLines = doc.splitTextToSize(details, pageWidth - 30);
  doc.setFont(undefined, 'normal');
  doc.text(detailsLines, 15, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  doc.save(`rapport_${report.reportNumber}.pdf`);
};
