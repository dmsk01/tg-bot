import ExcelJS from 'exceljs';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export class ExportService {
  exportToCsv<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn[]
  ): string {
    const headers = columns.map((col) => col.header);
    const rows = data.map((item) =>
      columns.map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
    );

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  async exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn[],
    sheetName: string
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    data.forEach((item) => {
      const row: Record<string, unknown> = {};
      columns.forEach((col) => {
        const value = item[col.key];
        if (typeof value === 'object' && value !== null) {
          row[col.key] = JSON.stringify(value);
        } else {
          row[col.key] = value;
        }
      });
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const exportService = new ExportService();
