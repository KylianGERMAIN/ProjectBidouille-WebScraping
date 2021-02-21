const puppeteer = require("puppeteer");
const myArgs = process.argv.slice(2);

const getJobDescription = async (page) => {
  await page.waitForTimeout("#JobPreview");
  const result = await page.evaluate(() => {
    const descriptionElement = document.querySelector("#JobDescription");
    const salaryElement = document.querySelector("#JobPreview .mux-job-cards");
    const locationElement = document.querySelector(
      "#JobViewHeader > header > div.heading > h2"
    );
    const titleElement = document.querySelector(
      "#JobViewHeader > header > div.heading > h1"
    );
    let description = "";
    let salary = "";
    let location = "";
    let title = "";

    if (descriptionElement && descriptionElement.innerText)
      description = descriptionElement.innerText;
    if (salaryElement && salaryElement.innerText)
      salary = salaryElement.innerText;
    if (locationElement && locationElement.innerText)
      location = locationElement.innerText;
    if (titleElement && titleElement.innerText) title = titleElement.innerText;
    return {
      description,
      salary,
      location,
      title,
    };
  });
  return result;
};

const CreateJSON = async (results) => {
  const fs = require("fs");
  let donnees = JSON.stringify(results);

  fs.writeFile("job.json", donnees, function (erreur) {
    if (erreur) {
      console.log(erreur);
    }
  });
};

const ManageARGV = async () => {
  if (myArgs.length == 0 || myArgs.length >= 2) {
    console.log(
      "\x1b[31m",
      'Please fill in the correct arguments otherwise type "node app.js -h"'
    );
    process.exit(84);
  } else if (myArgs[0] === "-h") {
    console.log(
      "\x1b[34m",
      'To run the program correctly "node app.js (name of your search)"\n example: node app.js "React Developper"'
    );
    process.exit(1);
  }
};

(async () => {
  ManageARGV();
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 920 });
  await page.goto("https://www.monster.fr", { waitUntil: "networkidle2" });
  const searchInput = await page.$("#q2");
  await searchInput.type(myArgs[0]);
  await page.click("#doQuickSearch2");
  await page.waitForTimeout(5000);
  const results = [];
  const jobs = await page.$$("h2.title > a");

  for (const job of jobs) {
    await job.click();
    await page.waitForTimeout(7000);
    const jobDescription = await getJobDescription(page);
    if (jobDescription.title != "") {
      results.push({
        salary: jobDescription.salary,
        location: jobDescription.location,
        title: jobDescription.title,
        url: await page.url(),
      });
    }
  }
  CreateJSON(results);
  await browser.close();
})();
