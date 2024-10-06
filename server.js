import puppeteer from "puppeteer";
import fs from "fs/promises";

const COOKIES_FILE_PATH = "./cookies.json";

async function main() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const cookiesString = await fs.readFile(COOKIES_FILE_PATH);
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);

  await page.goto(
    "https://producer.essencehealthcare.com/BookOfBusiness/MemberSummary",
    { waitUntil: "networkidle2" }
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await page.select(
    "select.form-control.bootstrap-table-filter-control-statusBoB",
    "Active"
  );

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const memberIds = await page.evaluate(() => {
    const scriptContent = Array.from(document.querySelectorAll("script"))
      .map((script) => script.textContent)
      .find((text) => text.includes("var memberSummaries ="));

    if (!scriptContent) {
      throw new Error(
        "No se pudo encontrar el script que contiene 'memberSummaries'"
      );
    }

    const match = scriptContent.match(/var memberSummaries = (.+);/);
    if (!match) {
      throw new Error("No se pudo extraer 'memberSummaries' del script");
    }

    let memberSummariesText = match[1].replace(/&quot;/g, '"');

    memberSummariesText = memberSummariesText.trim();
    memberSummariesText = memberSummariesText.replace(/^[^\[{]+/, "");
    memberSummariesText = memberSummariesText.replace(/[^}\]]+$/, "");

    try {
      const memberSummaries = JSON.parse(memberSummariesText);
      return memberSummaries
        .filter((member) => member.statusBoB === "Active")
        .map((member) => member.memberId);
    } catch (error) {
      throw new Error(
        "Error al parsear 'memberSummariesText': " + error.message
      );
    }
  });

  if (!memberIds || memberIds.length === 0) {
    throw new Error("No se encontraron 'memberIds' en la página");
  }

  console.log(`Se encontraron ${memberIds.length} miembros activos.`);

  const allMemberDetails = [];

  for (const memberId of memberIds) {
    console.log(`Procesando miembro con ID: ${memberId}`);
    const URL_DETAIL_PAGE = `https://producer.essencehealthcare.com/BookOfBusiness/MemberDetail/${memberId}`;
    await page.goto(URL_DETAIL_PAGE, { waitUntil: "networkidle2" });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const memberDetails = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.innerText.trim() || "";

      return {
        // Información Demográfica
        name: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(1) p"
        ),
        preferredSalutation: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(2) p"
        ),
        dateOfBirth: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(3) p"
        ),
        dateOfDeath: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(4) p"
        ),
        gender: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(5) p"
        ),
        permanentAddress: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(6) p"
        ),
        mailingAddress: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(7) p"
        ),
        phone: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(8) p"
        ),
        email: getText(
          "div.panel.panel-bordered div.panel-body div:nth-child(1) div:nth-child(9) p"
        ),

        // Información de Salud
        medicareClaim: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(1) p"
        ),
        memberId: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(2) p"
        ),
        applicationId: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(3) p"
        ),
        plan: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(4) p"
        ),
        effectiveDate: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(5) p"
        ),
        primaryCareProvider: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(6) p"
        ),
        osbApplication: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(7) p"
        ),
        osbEffectiveDate: getText(
          "div.panel.panel-bordered:nth-of-type(2) div.panel-body div:nth-child(1) div:nth-child(8) p"
        ),
      };
    });

    allMemberDetails.push({ memberId, ...memberDetails });

    await fs.writeFile(
      "allMemberDetails.json",
      JSON.stringify(allMemberDetails, null, 2)
    );
    console.log(
      `Datos del miembro con ID ${memberId} guardados temporalmente.`
    );
  }

  console.log("Todos los detalles de los miembros han sido procesados.");

  await browser.close();
}

main().catch((error) => console.error("Error:", error));
