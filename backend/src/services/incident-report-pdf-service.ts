import PDFDocument from 'pdfkit';
import type { IntelligenceContextSnapshot } from '../intelligence';

export class IncidentReportPdfService {
  async generate(snapshot: IntelligenceContextSnapshot): Promise<Buffer> {
    const { incident, events, evidence, investigation } = snapshot.context;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title: 'SentinelAI Incident Report',
        Author: 'SentinelAI',
        Subject: 'Incident operational report',
      },
    });

    const chunks: Buffer[] = [];
    const result = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const clean = (value: string | null | undefined, limit = 2000): string =>
      value ? value.replace(/\u0000/g, '').slice(0, limit) : 'Not provided';

    const dateLabel = (value: string | null | undefined): string => {
      if (!value) return 'Not available';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? clean(value, 100) : date.toISOString();
    };

    const heading = (text: string): void => {
      doc.moveDown(0.7);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#17365D').text(text);
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(9).fillColor('#222222');
    };

    const field = (label: string, value: string): void => {
      doc.font('Helvetica-Bold').text(label + ': ', { continued: true });
      doc.font('Helvetica').text(value);
    };

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#17365D').text('SENTINELAI');
    doc.font('Helvetica').fontSize(10).fillColor('#5B6573')
      .text('INCIDENT INVESTIGATION REPORT');
    doc.moveDown(0.5);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#CBD5E1').stroke();
    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').fontSize(17).fillColor('#172033')
      .text(clean(incident.title, 500));
    doc.font('Helvetica').fontSize(9).fillColor('#5B6573')
      .text('Generated: ' + new Date().toISOString());
    doc.moveDown(0.5);

    heading('1. INCIDENT OVERVIEW');
    field('Incident ID', clean(incident.id, 150));
    field('Status', clean(incident.status, 100));
    field('Severity', clean(incident.severity, 100));
    field('Priority', String(incident.priority));
    field('Created', dateLabel(incident.createdAt));
    field('Started', dateLabel(incident.startedAt));
    field('Resolved', dateLabel(incident.resolvedAt));
    field('Closed', dateLabel(incident.closedAt));
    field('Last updated', dateLabel(incident.updatedAt));
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text('Description');
    doc.font('Helvetica').text(clean(incident.description, 4000));

    heading('2. INCIDENT TIMELINE');
    doc.text('Recorded events: ' + events.length);
    if (events.length === 0) {
      doc.text('No timeline events are recorded for this incident.');
    }
    for (const event of events) {
      doc.moveDown(0.35);
      doc.font('Helvetica-Bold').fontSize(10)
        .text(dateLabel(event.occurredAt) + ' | ' + event.eventType);
      doc.font('Helvetica-Bold').fontSize(9).text(clean(event.title, 500));
      doc.font('Helvetica').fontSize(9).text(clean(event.description, 1500));
      if (event.source) doc.text('Source: ' + clean(event.source, 250));
      doc.moveDown(0.25);
    }

    heading('3. EVIDENCE REGISTER');
    doc.text('Evidence records: ' + evidence.length);
    if (evidence.length === 0) {
      doc.text('No evidence records are attached to this incident.');
    }
    for (const item of evidence) {
      doc.moveDown(0.35);
      doc.font('Helvetica-Bold').fontSize(10).text(clean(item.title, 500));
      doc.font('Helvetica').fontSize(9).text('Type: ' + item.evidenceType);
      doc.text('Source: ' + clean(item.source, 250));
      if (item.description) {
        doc.text('Description: ' + clean(item.description, 1200));
      }
      doc.text('Occurred: ' + dateLabel(item.occurredAt));
      doc.text('Collected: ' + dateLabel(item.collectedAt));
      if (item.trustLevel) doc.text('Trust level: ' + clean(item.trustLevel, 100));
      doc.moveDown(0.25);
    }

    heading('4. INVESTIGATION');
    if (investigation) {
      field('Investigation ID', clean(investigation.id, 150));
      field('Started', dateLabel(investigation.startedAt));
      field('Completed', dateLabel(investigation.completedAt));
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text('Investigation summary');
      doc.font('Helvetica').text(clean(investigation.summary, 5000));
    } else {
      doc.text('No investigation record is available for this incident.');
    }

    doc.moveDown(1);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#CBD5E1').stroke();
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(8).fillColor('#5B6573')
      .text('Generated by SentinelAI from recorded incident data. This report does not independently verify the accuracy of source records.');

    doc.end();
    return result;
  }
}

export const incidentReportPdfService = new IncidentReportPdfService();

