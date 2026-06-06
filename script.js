const fs = require('fs');
let content = fs.readFileSync('src/components/quotes/QuotePrintView.tsx', 'utf-8');

const importReplacement = `import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';`;

content = content.replace(/import \* as XLSX from 'xlsx';/, importReplacement);

const startIdx = content.indexOf('    const handleExportExcel = () => {');
const endIdx = content.indexOf('    const items = quote.items || [];', startIdx);

const handleExportExcelFn = `    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Báo Giá');
            const isPriceList = quote.quote_type === 'price_list';
            const validDate = quote.valid_until ? fmtDate(quote.valid_until) : '';
            
            // Default font
            sheet.properties.defaultRowHeight = 20;

            // Header - Row 1
            sheet.mergeCells('A1:J1');
            sheet.getCell('A1').value = 'CÔNG TY TNHH LYHU - Kết nối chân thành - Hợp tác bền vững';
            sheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };

            sheet.mergeCells('A2:J2');
            sheet.getCell('A2').value = 'MST: 0110940697 | Địa chỉ: ' + COMPANY_INFO.address;
            sheet.getCell('A2').font = { name: 'Arial', size: 10 };

            sheet.mergeCells('A3:J3');
            sheet.getCell('A3').value = 'Hotline: ' + (quote.sales_phone || COMPANY_INFO.hotline) + ' | Email: ' + COMPANY_INFO.email;
            sheet.getCell('A3').font = { name: 'Arial', size: 10 };

            sheet.mergeCells('A5:J5');
            sheet.getCell('A5').value = 'BÁO GIÁ SẢN PHẨM';
            sheet.getCell('A5').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF00AFA9' } };
            sheet.getCell('A5').alignment = { horizontal: 'center' };

            sheet.mergeCells('A6:J6');
            sheet.getCell('A6').value = 'Số: BG-' + quote.readable_id + ' | Ngày: ' + fmtDate(quote.created_at) + (validDate ? ' | Hiệu lực đến: ' + validDate : '');
            sheet.getCell('A6').font = { name: 'Arial', size: 10, italic: true };
            sheet.getCell('A6').alignment = { horizontal: 'center' };

            let currentRow = 8;

            if (!isPriceList || quote.customer_name !== 'Kính gửi Quý khách hàng') {
                sheet.getCell('A' + currentRow).value = 'THÔNG TIN KHÁCH HÀNG';
                sheet.getCell('A' + currentRow).font = { name: 'Arial', size: 10, bold: true };
                currentRow++;
                sheet.getCell('A' + currentRow).value = 'Khách hàng:';
                sheet.getCell('B' + currentRow).value = quote.customer_name;
                sheet.getCell('B' + currentRow).font = { bold: true };
                currentRow++;
                if (quote.customer_phone) {
                    sheet.getCell('A' + currentRow).value = 'SĐT:';
                    sheet.getCell('B' + currentRow).value = quote.customer_phone;
                    currentRow++;
                }
                if (quote.customer_address) {
                    sheet.getCell('A' + currentRow).value = 'Địa chỉ:';
                    sheet.getCell('B' + currentRow).value = quote.customer_address;
                    currentRow++;
                }
                sheet.getCell('A' + currentRow).value = 'NV Kinh Doanh:';
                sheet.getCell('B' + currentRow).value = quote.creator_name || '-';
                currentRow += 2;
            }

            if (isPriceList) {
                sheet.mergeCells('A' + currentRow + ':J' + currentRow);
                sheet.getCell('A' + currentRow).value = 'Kính gửi: Quý khách hàng!';
                sheet.getCell('A' + currentRow).font = { bold: true };
                currentRow++;
                sheet.mergeCells('A' + currentRow + ':J' + currentRow);
                sheet.getCell('A' + currentRow).value = 'Công ty TNHH LYHU là đơn vị sản xuất, phân phối các mặt hàng tiêu dùng nhanh.';
                sheet.getCell('A' + currentRow).font = { italic: true };
                currentRow++;
                sheet.mergeCells('A' + currentRow + ':J' + currentRow);
                sheet.getCell('A' + currentRow).value = 'Cảm ơn quý khách hàng đã quan tâm đến các sản phẩm của Công ty LYHU. Chúng tôi xin trân trọng giới thiệu bảng báo giá các sản phẩm như sau:';
                sheet.getCell('A' + currentRow).font = { italic: true };
                currentRow += 2;
            }

            if (isPriceList) {
                sheet.columns = [
                    { header: 'STT', key: 'stt', width: 6 },
                    { header: 'Mã Sản Phẩm', key: 'sku', width: 15 },
                    { header: 'Tên Sản Phẩm', key: 'name', width: 35 },
                    { header: 'Đơn Vị', key: 'unit', width: 8 },
                    { header: 'Trọng Lượng', key: 'weight', width: 10 },
                    { header: 'HSD', key: 'expiry', width: 10 },
                    { header: 'Quy Cách', key: 'pack', width: 10 },
                    { header: 'Giá Lẻ', key: 'retail', width: 12 },
                    { header: 'Giá Sỉ', key: 'wholesale', width: 12 },
                    { header: 'Hình Ảnh', key: 'image', width: 12 }
                ];
            } else {
                sheet.columns = [
                    { header: 'STT', key: 'stt', width: 6 },
                    { header: 'Mã Sản Phẩm', key: 'sku', width: 15 },
                    { header: 'Tên Sản Phẩm', key: 'name', width: 40 },
                    { header: 'Đơn vị', key: 'unit', width: 10 },
                    { header: 'Số lượng', key: 'qty', width: 10 },
                    { header: 'Đơn giá', key: 'price', width: 15 },
                    { header: 'Thành tiền', key: 'total', width: 15 }
                ];
            }

            const headerRow = sheet.getRow(currentRow);
            headerRow.values = sheet.columns.map(c => c.header);
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00AFA9' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
                };
            });
            headerRow.height = 30;
            currentRow++;

            const itemsArr = quote.items || [];
            
            const applyBorders = (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                    };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                });
            };

            const imagePromises = [];

            if (isPriceList) {
                const groups = [];
                itemsArr.forEach(item => {
                    let finalCategory = item.category;
                    if (products && item.productId) {
                        const p = products.find((p) => p.id === item.productId);
                        if (p && p.brand) finalCategory = p.brand;
                    }
                    const cat = (finalCategory || 'SẢN PHẨM KHÁC').trim().toUpperCase();
                    let group = groups.find(g => g.category === cat);
                    if (!group) {
                        group = { category: cat, items: [] };
                        groups.push(group);
                    }
                    group.items.push(item);
                });
                groups.sort((a, b) => {
                    if (a.category === 'SẢN PHẨM KHÁC') return 1;
                    if (b.category === 'SẢN PHẨM KHÁC') return -1;
                    return a.category.localeCompare(b.category);
                });

                let globalIdx = 1;
                groups.forEach(group => {
                    if (groups.length > 1 || group.category !== 'SẢN PHẨM KHÁC') {
                        const grpRow = sheet.getRow(currentRow);
                        sheet.mergeCells('A' + currentRow + ':J' + currentRow);
                        grpRow.getCell(1).value = group.category;
                        grpRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF48ADB9' } };
                        grpRow.getCell(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
                        grpRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                        currentRow++;
                    }
                    group.items.forEach((item) => {
                        const row = sheet.getRow(currentRow);
                        row.values = [
                            globalIdx++,
                            item.sku || '',
                            item.name,
                            item.unit || '',
                            item.weight || '',
                            item.expiry || '',
                            item.packSize || '',
                            item.retailPrice || 0,
                            item.wholesalePrice || 0,
                            '' // Image placeholder
                        ];
                        row.getCell(8).numFmt = '#,##0';
                        row.getCell(9).numFmt = '#,##0';
                        row.getCell(9).font = { color: { argb: 'FF0369a1' }, bold: true };
                        
                        applyBorders(row);
                        
                        if (item.imageUrl) {
                            row.height = 60;
                            const rIdx = currentRow;
                            imagePromises.push((async () => {
                                try {
                                    const res = await fetch(item.imageUrl);
                                    if(res.ok) {
                                        const buffer = await res.arrayBuffer();
                                        const ext = item.imageUrl.split('.').pop().toLowerCase();
                                        const imageId = workbook.addImage({
                                            buffer: buffer,
                                            extension: ext === 'png' ? 'png' : 'jpeg',
                                        });
                                        sheet.addImage(imageId, {
                                            tl: { col: 9.1, row: rIdx - 1 + 0.1 },
                                            ext: { width: 60, height: 60 },
                                            editAs: 'oneCell'
                                        });
                                    }
                                } catch(e) {}
                            })());
                        }

                        currentRow++;
                    });
                });
            } else {
                itemsArr.forEach((item, idx) => {
                    const lineTotal = item.subtotal || (item.unitPrice || 0) * (item.quantity || 0);
                    const row = sheet.getRow(currentRow);
                    row.values = [
                        idx + 1,
                        item.sku || '',
                        item.name + (item.isGift ? ' (KM)' : ''),
                        item.isGift ? 'KM' : 'Cái',
                        item.quantity,
                        item.isGift ? 0 : (item.unitPrice || 0),
                        item.isGift ? 0 : lineTotal
                    ];
                    row.getCell(6).numFmt = '#,##0';
                    row.getCell(7).numFmt = '#,##0';
                    row.getCell(7).font = { bold: true };
                    applyBorders(row);
                    currentRow++;
                });

                const addTotalRow = (label, value, isTotal = false) => {
                    const row = sheet.getRow(currentRow);
                    sheet.mergeCells('A' + currentRow + ':F' + currentRow);
                    row.getCell(1).value = label;
                    row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
                    row.getCell(7).value = value;
                    row.getCell(7).numFmt = '#,##0';
                    if (isTotal) {
                        row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        row.getCell(7).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00AFA9' } };
                        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00AFA9' } };
                    } else {
                        row.getCell(1).font = { bold: true };
                        row.getCell(7).font = { bold: true };
                    }
                    applyBorders(row);
                    currentRow++;
                };

                addTotalRow('Tạm tính:', quote.subtotal);
                if (quote.discount_amount > 0) addTotalRow('Chiết khấu:', -quote.discount_amount);
                if (quote.vat_percent > 0) addTotalRow('VAT (' + quote.vat_percent + '%):', Math.round(quote.subtotal * quote.vat_percent / 100));
                if (quote.shipping_fee > 0) addTotalRow('Phí vận chuyển:', quote.shipping_fee);
                addTotalRow('Tổng cộng:', quote.total, true);
            }

            await Promise.all(imagePromises);

            currentRow += 2;
            sheet.getCell('A' + currentRow).value = 'GHI CHÚ';
            sheet.getCell('A' + currentRow).font = { bold: true, color: { argb: 'FFB45309' } };
            currentRow++;
            if (quote.notes) {
                sheet.getCell('A' + currentRow).value = quote.notes;
                sheet.mergeCells('A' + currentRow + ':J' + currentRow);
                sheet.getRow(currentRow).height = 40;
                sheet.getCell('A' + currentRow).alignment = { wrapText: true, vertical: 'top' };
                currentRow++;
            }

            currentRow++;
            sheet.getCell('A' + currentRow).value = 'ĐIỀU KHOẢN & ĐIỀU KIỆN';
            sheet.getCell('A' + currentRow).font = { bold: true, color: { argb: 'FF64748B' } };
            currentRow++;
            if (quote.terms) {
                quote.terms.split('\\n').forEach(t => {
                    if (t.trim()) {
                        sheet.getCell('A' + currentRow).value = '- ' + t;
                        currentRow++;
                    }
                });
            } else {
                sheet.getCell('A' + (currentRow++)).value = '- Giá trên chưa bao gồm phí vận chuyển (nếu có).';
                sheet.getCell('A' + (currentRow++)).value = '- Báo giá có hiệu lực ' + (validDate ? 'đến ' + validDate : '30 ngày') + ' kể từ ngày phát hành.';
                sheet.getCell('A' + (currentRow++)).value = '- Thanh toán: Chuyển khoản trước khi giao hàng hoặc COD.';
                sheet.getCell('A' + (currentRow++)).value = '- Hàng hóa được đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.';
            }

            currentRow += 2;
            const endCol = isPriceList ? 'G' : 'E';
            const endColNext = isPriceList ? 'I' : 'G';
            sheet.mergeCells(endCol + currentRow + ':' + endColNext + currentRow);
            sheet.getCell(endCol + currentRow).value = 'Đại diện CÔNG TY TNHH LYHU';
            sheet.getCell(endCol + currentRow).font = { bold: true };
            sheet.getCell(endCol + currentRow).alignment = { horizontal: 'center' };
            currentRow++;
            sheet.mergeCells(endCol + currentRow + ':' + endColNext + currentRow);
            sheet.getCell(endCol + currentRow).value = '(Ký, đóng dấu và ghi rõ họ tên)';
            sheet.getCell(endCol + currentRow).font = { italic: true };
            sheet.getCell(endCol + currentRow).alignment = { horizontal: 'center' };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, \`Bao_Gia_\${quote.readable_id}.xlsx\`);
        } catch (error) {
            console.error('Error exporting excel:', error);
        } finally {
            setIsExporting(false);
        }
    };
\n`;

content = content.substring(0, startIdx) + handleExportExcelFn + content.substring(endIdx);

fs.writeFileSync('src/components/quotes/QuotePrintView.tsx', content);
console.log('Done!');
