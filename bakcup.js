import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const COOKIES_FILE_PATH = './cookies.json';
const BASE_URL = "https://producer.essencehealthcare.com/BookOfBusiness/MemberDetail/";

async function main() {
    // Iniciar Puppeteer
    const browser = await puppeteer.launch({ headless: false }); // Cambia a true si no deseas ver la ejecución
    const page = await browser.newPage();

    // Cargar cookies desde el archivo
    const cookiesString = await fs.readFile(COOKIES_FILE_PATH);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);

    // Navegar a la página de resumen de miembros
    await page.goto('https://producer.essencehealthcare.com/BookOfBusiness/MemberSummary', { waitUntil: 'networkidle2' });

    // Filtrar miembros activos
    await page.select('select.form-control.bootstrap-table-filter-control-statusBoB', 'Active');

    // Extraer los IDs de los miembros activos
    const memberIds = await page.evaluate(() => {
        return [...document.querySelectorAll('tr td[data-field="memberId"]')].map(td => td.innerText.trim());
    });

    if (!memberIds || memberIds.length === 0) {
        throw new Error("No se encontraron 'memberIds' activos en la página");
    }

    const allMemberDetails = [];

    // Iterar sobre cada ID de miembro y obtener los detalles
    for (const memberId of memberIds) {
        await page.goto(`${BASE_URL}${memberId}`, { waitUntil: 'networkidle2' });
        
        // Evaluar la página para extraer los detalles del miembro
        const memberDetails = await page.evaluate(() => {
            const getText = (selector) => document.querySelector(selector)?.innerText.trim() || '';

            return {
                // Información Demográfica
                name: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(1) p'),
                preferredSalutation: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(2) p'),
                dateOfBirth: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(3) p'),
                dateOfDeath: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(4) p'),
                gender: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(5) p'),
                permanentAddress: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(6) p'),
                mailingAddress: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(7) p'),
                phone: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(8) p'),
                email: getText('div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(9) p'),

                // Información de Salud
                medicareClaim: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(1) p'),
                memberId: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(2) p'),
                applicationId: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(3) p'),
                plan: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(4) p'),
                effectiveDate: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(5) p'),
                primaryCareProvider: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(6) p'),
                osbApplication: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(7) p'),
                osbEffectiveDate: getText('div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(8) p'),
            };
        });

        // Agregar los detalles del miembro a la lista
        allMemberDetails.push(memberDetails);
    }

    // Guardar todos los datos obtenidos en un archivo
    await fs.writeFile('allMemberDetails.json', JSON.stringify(allMemberDetails, null, 2));
    console.log("Todos los detalles de los miembros guardados en allMemberDetails.json");

    // Cerrar el navegador
    await browser.close();
}

main().catch(error => console.error("Error:", error));
