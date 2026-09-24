import { Injectable, inject } from '@angular/core';
import { InventoryItem } from '../models/inventory.model';
import { ToastService } from './toast.service';
import * as ExcelJS from 'exceljs';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  private readonly toast = inject(ToastService);

  /**
   * Descarga una imagen desde una URL y la normaliza a un PNG optimizado
   * para incrustar en celdas de Excel (compatible con WebP, JPEG, PNG, etc.)
   */
  private async fetchImageAsPngBuffer(url: string): Promise<ArrayBuffer | null> {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) return null;
      const blob = await response.blob();

      return await new Promise<ArrayBuffer | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const objectUrl = URL.createObjectURL(blob);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement('canvas');
          const maxDim = 240;
          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              resolve(null);
              return;
            }
            pngBlob.arrayBuffer().then(buf => resolve(buf)).catch(() => resolve(null));
          }, 'image/png');
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };

        img.src = objectUrl;
      });
    } catch (e) {
      console.warn('No se pudo procesar la imagen para Excel:', url, e);
      return null;
    }
  }

  /**
   * Exporta la lista de equipos en formato XLSX con diseño corporativo y fotos incrustadas
   */
  async exportToExcel(items: InventoryItem[], generatedByName: string = 'Administrador'): Promise<void> {
    if (!items || items.length === 0) {
      this.toast.warning('Sin datos', 'No hay equipos en la lista actual para exportar.');
      return;
    }

    this.toast.info('Generando Excel...', `Procesando ${items.length} activos TI con fotografías y formato corporativo.`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventario-ID IT Systems';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Inventario TI', {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 4 }]
    });

    // Configuración de columnas con anchos legibles y generosos
    worksheet.columns = [
      { key: 'photo', width: 14 },            // Col 1: Foto
      { key: 'id', width: 16 },               // Col 2: ID
      { key: 'name', width: 28 },             // Col 3: Equipo / Nombre
      { key: 'category', width: 16 },         // Col 4: Categoría
      { key: 'brand', width: 14 },            // Col 5: Marca
      { key: 'model', width: 20 },            // Col 6: Modelo
      { key: 'service_tag', width: 18 },      // Col 7: Service Tag
      { key: 'gorilla_tag', width: 15 },      // Col 8: Gorilla Tag
      { key: 'quantity', width: 12 },         // Col 9: Cantidad
      { key: 'status', width: 16 },           // Col 10: Estado
      { key: 'location', width: 24 },         // Col 11: Ubicación
      { key: 'assigned_to', width: 22 },      // Col 12: Asignado A
      { key: 'specifications', width: 34 },   // Col 13: Especificaciones
      { key: 'observations', width: 34 },     // Col 14: Observaciones
      { key: 'photo_link', width: 20 }        // Col 15: Foto HD Link
    ];

    const primaryNavy = '0F2A4A';
    const accentBlue = '0284C7';
    const textMuted = '64748B';
    const borderGray = 'CBD5E1';

    // 1. TÍTULO Y BANNER CORPORATIVO
    worksheet.mergeCells('A1:O1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'INVENTARIO-ID  |  CONTROL Y GESTIÓN DE ACTIVOS TI';
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryNavy } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // 2. METADATOS DEL REPORTE
    worksheet.mergeCells('A2:O2');
    const metaCell = worksheet.getCell('A2');
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' });
    metaCell.value = `Reporte generado: ${nowStr}   •   Emitido por: ${generatedByName}   •   Total de registros: ${items.length} activos TI`;
    metaCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FFE2E8F0' } };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // Fila 3 separadora suave
    worksheet.mergeCells('A3:O3');
    worksheet.getCell('A3').value = '';
    worksheet.getRow(3).height = 6;

    // Fila 4: Encabezados de columnas
    const headerRow = worksheet.getRow(4);
    headerRow.height = 28;
    const headers = [
      'FOTO',
      'ID CORTO',
      'EQUIPO / NOMBRE',
      'CATEGORÍA',
      'MARCA',
      'MODELO',
      'SERVICE TAG (ST)',
      'GORILLA TAG',
      'CANTIDAD',
      'ESTADO',
      'UBICACIÓN',
      'ASIGNADO A',
      'ESPECIFICACIONES',
      'OBSERVACIONES',
      'FOTO ENLACE'
    ];

    headers.forEach((hdr, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = hdr;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryNavy } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: primaryNavy } },
        bottom: { style: 'medium', color: { argb: accentBlue } },
        left: { style: 'thin', color: { argb: '334155' } },
        right: { style: 'thin', color: { argb: '334155' } }
      };
    });

    // Activar autofiltro para los datos
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: headers.length }
    };

    // 3. POBLAR FILAS DE DATOS
    let currentRowIdx = 5;

    for (const item of items) {
      const row = worksheet.getRow(currentRowIdx);
      row.height = 54; // Altura para que las miniaturas de foto se vean de buen tamaño

      const isEven = (currentRowIdx % 2 === 0);
      const bgHex = isEven ? 'F8FAFC' : 'FFFFFF';

      // Estado formateado con colores tipo badge
      let statusLabel: string = item.status || 'disponible';
      let statusColor = '1E293B';
      let statusBg = 'F1F5F9';
      if (item.status === 'disponible') {
        statusLabel = 'Disponible';
        statusColor = '166534';
        statusBg = 'DCFCE7';
      } else if (item.status === 'en_uso') {
        statusLabel = 'En uso';
        statusColor = '1E40AF';
        statusBg = 'DBEAFE';
      } else if (item.status === 'para_piezas') {
        statusLabel = 'Para piezas';
        statusColor = '92400E';
        statusBg = 'FEF3C7';
      } else if (item.status === 'baja') {
        statusLabel = 'Baja';
        statusColor = '991B1B';
        statusBg = 'FEE2E2';
      } else if (item.status === 'mantenimiento') {
        statusLabel = 'Mantenimiento';
        statusColor = '7C2D12';
        statusBg = 'FFEDD5';
      }

      // ID corto legible
      const shortId = item.id.length > 8 ? item.id.substring(0, 8).toUpperCase() : item.id;

      // Obtener URL de foto principal o primera foto
      const photoUrl = item.main_photo_url || (item.photos && item.photos.length > 0 ? item.photos[0].public_url : null);

      // Asignar valores
      row.getCell(1).value = photoUrl ? '' : 'Sin foto';
      row.getCell(2).value = shortId;
      row.getCell(3).value = item.name || '—';
      row.getCell(4).value = item.category || '—';
      row.getCell(5).value = item.brand || '—';
      row.getCell(6).value = item.model || '—';
      row.getCell(7).value = item.service_tag || '—';
      row.getCell(8).value = item.gorilla_tag || '—';
      row.getCell(9).value = item.quantity ?? 1;
      row.getCell(10).value = statusLabel;
      row.getCell(11).value = item.location || '—';
      row.getCell(12).value = item.assigned_to || '—';
      row.getCell(13).value = item.specifications || '—';
      row.getCell(14).value = item.observations || '—';

      if (photoUrl) {
        row.getCell(15).value = {
          text: 'Ver Foto HD',
          hyperlink: photoUrl,
          tooltip: 'Clic para abrir foto completa en alta resolución'
        };
        row.getCell(15).font = { name: 'Segoe UI', size: 9, color: { argb: '0284C7' }, underline: true };
      } else {
        row.getCell(15).value = '—';
      }

      // Estilos de bordes y fondo cebra
      for (let colIdx = 1; colIdx <= headers.length; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.font = cell.font || { name: 'Segoe UI', size: 9.5, color: { argb: '1E293B' } };
        cell.border = {
          top: { style: 'thin', color: { argb: borderGray } },
          bottom: { style: 'thin', color: { argb: borderGray } },
          left: { style: 'thin', color: { argb: borderGray } },
          right: { style: 'thin', color: { argb: borderGray } }
        };

        if (colIdx !== 10) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgHex } };
        }
      }

      // Alineaciones de celda
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(1).font = { name: 'Segoe UI', size: 8.5, color: { argb: textMuted }, italic: true };

      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).font = { name: 'Consolas', size: 9, bold: true, color: { argb: '334155' } };

      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell(3).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '0F172A' } };

      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: '0284C7' } };

      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(8).font = { name: 'Consolas', size: 9.5, color: { argb: '475569' } };

      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(9).font = { name: 'Segoe UI', size: 10, bold: true };

      // Badge de estado
      const statusCell = row.getCell(10);
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
      statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: statusColor } };

      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell(15).alignment = { vertical: 'middle', horizontal: 'center' };

      // Si tiene foto, descargarla e incrustarla en la celda A (Columna 1)
      if (photoUrl) {
        try {
          const imgBuffer = await this.fetchImageAsPngBuffer(photoUrl);
          if (imgBuffer) {
            const imageId = workbook.addImage({
              buffer: imgBuffer,
              extension: 'png'
            });

            worksheet.addImage(imageId, {
              tl: { col: 0.1, row: currentRowIdx - 1 + 0.08 },
              ext: { width: 62, height: 62 }
            });
            row.getCell(1).value = ''; // Limpiar texto porque la foto está colocada
          }
        } catch (imgErr) {
          console.warn('Error adjuntando imagen a Excel para equipo:', item.name, imgErr);
        }
      }

      currentRowIdx++;
    }

    // Generar archivo y disparar descarga
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Inventario_TI_Reporte_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      this.toast.success(
        'Excel generado con éxito',
        `Se exportaron ${items.length} activos TI en formato XLSX con diseño corporativo y fotos incrustadas.`
      );
    } catch (exportErr: any) {
      console.error('Error exportando a Excel:', exportErr);
      this.toast.error('Error al generar Excel', exportErr.message || 'No se pudo crear el archivo.');
    }
  }
}
