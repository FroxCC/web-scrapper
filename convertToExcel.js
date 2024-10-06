import fs from 'fs/promises';
import XLSX from 'xlsx';

async function convertToExcel() {
    try {
        const jsonString = await fs.readFile('allMemberDetails.json', 'utf-8');
        const jsonData = JSON.parse(jsonString);

        const workbook = XLSX.utils.book_new();

        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Details');

        XLSX.writeFile(workbook, 'allMemberDetails.xlsx');

        console.log('Datos convertidos a Excel y guardados en allMemberDetails.xlsx');
    } catch (error) {
        console.error('Error al convertir a Excel:', error);
    }
}

convertToExcel();
