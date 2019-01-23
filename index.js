/**
 * Ce script de ligne de commande fait des requêtes sur la base de données et
 * génère les fichiers de données films et seances pour l'identifiant de cycle passé en paramètre.
 */
const fs = require("fs");
const _ = require("lodash");
const database = require("./lib/database");
const config = require("./lib/config");
const seances = require("./lib/query/seances.js");
const films = require("./lib/query/films.js");
const helpers = require("./lib/helpers.js");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);

const idCycle = parseInt(process.argv[2], 10); // Id de cycle saisie en paramètre de ligne de commande
const timestamp = helpers.timestamp();

(async function () {

  const cyclesConfig = await helpers.readFileAsJson("./data/config/cycles.json");
  let cycleConfig = _(cyclesConfig).find({
    idCycleProg: idCycle
  });


  try {
    const db = await database.attach(config.db);

    console.log(`Importation des données pour le cycle ${cycleConfig.idCycleProg} ${cycleConfig.titreCycle}.`);
    console.log("Connecté à la base de données.");

    // Films
    let f = await films(db, cycleConfig);
    console.log(`Films : ${_.map(f).length} items.`);

    await writeFile(
      `data/cycles/ts/CYCLE${cycleConfig.idCycleProg}_FILMS ${timestamp}.json`,
      JSON.stringify(f, null, 2),
      "utf8"
    );

    await copyFile(
      `data/cycles/ts/CYCLE${cycleConfig.idCycleProg}_FILMS ${timestamp}.json`,
      `data/cycles/CYCLE${cycleConfig.idCycleProg}_FILMS.json`
    );

    // Séances
    let s = await seances(db, cycleConfig);
    console.log(`Séances : ${s.length} items.`);

    await writeFile(
      `data/cycles/ts/CYCLE${cycleConfig.idCycleProg}_SEANCES ${timestamp}.json`,
      JSON.stringify(s, null, 2),
      "utf8"
    );

    await copyFile(
      `data/cycles/ts/CYCLE${cycleConfig.idCycleProg}_SEANCES ${timestamp}.json`,
      `data/cycles/CYCLE${cycleConfig.idCycleProg}_SEANCES.json`
    );

    database.detach(db);
  } catch (e) {
    console.log(e);
    database.detach(db);
  }
})();