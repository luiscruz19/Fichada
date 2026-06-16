import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { REPORT_COLUMNS } from './build-report-rows.js';

// ─── CSV (nativo, sin dependencias) ──────────────────────────────────────────
function csvEscape(value) {
    const s = String(value ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows) {
    const header = REPORT_COLUMNS.map(c => csvEscape(c.header)).join(';');
    const lines = rows.map(r => REPORT_COLUMNS.map(c => csvEscape(r[c.key])).join(';'));
    // BOM para que Excel reconozca UTF-8.
    return '﻿' + [header, ...lines].join('\n');
}

// ─── Excel (exceljs) ─────────────────────────────────────────────────────────
export async function toXlsx(rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Jornadas');
    ws.columns = REPORT_COLUMNS.map(c => ({ header: c.header, key: c.key, width: 22 }));
    ws.getRow(1).font = { bold: true };
    rows.forEach(r => ws.addRow(r));
    return wb.xlsx.writeBuffer();
}

// ─── PDF (pdfkit) ────────────────────────────────────────────────────────────
export function toPdf(rows, { title = 'Reporte de jornadas' } = {}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(16).text(title, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(8).fillColor('#666')
            .text(`Generado: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}  ·  ${rows.length} jornadas`);
        doc.moveDown(0.5).fillColor('#000');

        const startX = 30;
        const widths = [110, 130, 55, 45, 45, 40, 55, 50, 95, 95];
        let y = doc.y;

        const drawRow = (cells, opts = {}) => {
            let x = startX;
            doc.fontSize(7).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
            cells.forEach((cell, i) => {
                doc.text(String(cell ?? ''), x + 2, y + 2, { width: widths[i] - 4, ellipsis: true });
                x += widths[i];
            });
            y += 16;
            doc.moveTo(startX, y).lineTo(startX + widths.reduce((a, b) => a + b, 0), y).strokeColor('#ddd').stroke();
            if (y > doc.page.height - 40) { doc.addPage(); y = 30; }
        };

        drawRow(REPORT_COLUMNS.map(c => c.header), { bold: true });
        rows.forEach(r => drawRow(REPORT_COLUMNS.map(c => r[c.key])));

        doc.end();
    });
}
