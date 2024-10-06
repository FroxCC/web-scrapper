import fs from 'fs/promises';
import { parse } from 'json2csv';

async function convertToCsv() {
    try {
        // Leer el archivo JSON
        const jsonString = await fs.readFile('allMemberDetails.json', 'utf-8');
        const jsonData = JSON.parse(jsonString);

        // Convertir a CSV usando json2csv
        const csvData = parse(jsonData);

        // Guardar el CSV en un archivo
        await fs.writeFile('allMemberDetails.csv', csvData);
        console.log('Datos convertidos a CSV y guardados en allMemberDetails.csv');
    } catch (error) {
        console.error('Error al convertir a CSV:', error);
    }
}

convertToCsv();
