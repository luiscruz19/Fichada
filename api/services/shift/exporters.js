import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { REPORT_COLUMNS, TZ } from './build-report-rows.js';

const UTF8_BOM = '\uFEFF';
const XLSX_COLUMN_WIDTH = 22;
const PDF_MARGIN = 30;
const PDF_ROW_HEIGHT = 16;
const PDF_BOTTOM_LIMIT = 40;
const PDF_COLUMN_WIDTHS = [110, 130, 55, 45, 45, 40, 55, 50, 95, 95];

function csvEscape(value) {
    const s = String(value ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows) {
    const header = REPORT_COLUMNS.map(c => csvEscape(c.header)).join(';');
    const lines = rows.map(r => REPORT_COLUMNS.map(c => csvEscape(r[c.key])).join(';'));
    // Sin el BOM, Excel no reconoce el archivo como UTF-8.
    return UTF8_BOM + [header, ...lines].join('\n');
}

export async function toXlsx(rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Jornadas');
    ws.columns = REPORT_COLUMNS.map(c => ({ header: c.header, key: c.key, width: XLSX_COLUMN_WIDTH }));
    ws.getRow(1).font = { bold: true };
    rows.forEach(r => ws.addRow(r));
    return wb.xlsx.writeBuffer();
}

export function toPdf(rows, { title = 'Reporte de jornadas' } = {}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: PDF_MARGIN });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(16).text(title, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(8).fillColor('#666')
            .text(`Generado: ${new Date().toLocaleString('es-AR', { timeZone: TZ })}  ·  ${rows.length} jornadas`);
        doc.moveDown(0.5).fillColor('#000');

        const tableWidth = PDF_COLUMN_WIDTHS.reduce((a, b) => a + b, 0);
        let y = doc.y;

        const drawRow = (cells, opts = {}) => {
            let x = PDF_MARGIN;
            doc.fontSize(7).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
            cells.forEach((cell, i) => {
                doc.text(String(cell ?? ''), x + 2, y + 2, { width: PDF_COLUMN_WIDTHS[i] - 4, ellipsis: true });
                x += PDF_COLUMN_WIDTHS[i];
            });
            y += PDF_ROW_HEIGHT;
            doc.moveTo(PDF_MARGIN, y).lineTo(PDF_MARGIN + tableWidth, y).strokeColor('#ddd').stroke();
            if (y > doc.page.height - PDF_BOTTOM_LIMIT) { doc.addPage(); y = PDF_MARGIN; }
        };

        drawRow(REPORT_COLUMNS.map(c => c.header), { bold: true });
        rows.forEach(r => drawRow(REPORT_COLUMNS.map(c => r[c.key])));

        doc.end();
    });
}
