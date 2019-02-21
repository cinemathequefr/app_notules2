/**
 * Ce script de ligne de commande fait des requêtes sur la base de données et
 * génère les fichiers de données films et seances correspondant au programme et cycle passé en paramètres.
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

// Décode les arguments passés de la forme : -p 55 -c 400
try {
  let args = helpers.extractArgsValue(process.argv.slice(2).join(" "));
  var idProg = helpers.toNumOrNull(args.p[0]);
  var idCycle = helpers.toNumOrNull(args.c[0]);
} catch (e) {
  console.error("Erreur d'arguments. Les arguments attendus sont de la forme : -p <id programme> -c <id cycle>.")
}

const timestamp = helpers.timestamp();

(async function () {
  const cyclesConfig = await helpers.readFileAsJson(`./config/prog${idProg}.json`);
  let cycleConfig = helpers.cycleConfig(cyclesConfig, idCycle);

  try {
    const db = await database.attach(config.db);

    console.log(`Importation des données pour le cycle ${cycleConfig.idCycleProg} ${cycleConfig.titreCycle}.`);
    console.log("Connecté à la base de données.");

    // Films
    let f = await films(db, cycleConfig);
    console.log(`Films : ${_.map(f).length} items.`);

    await writeFile(
      `data/cycles/PROG${idProg}_CYCL${idCycle}_FILMS.json`,
      JSON.stringify(f, null, 2),
      "utf8"
    );

    // TEMPORAIREMENT DESACTIVE: copie du fichier avec timestamp
    // await copyFile(
    //   `data/cycles/PROG${idProg}_CYCL${idCycle}_FILMS.json`,
    //   `data/cycles/ts/PROG${idProg}_CYCL${idCycle}_FILMS ${timestamp}.json`
    // );

    // Séances
    let s = await seances(db, cycleConfig);


    console.log(`Séances : ${s.length} items.`);

    await writeFile(
      `data/cycles/PROG${idProg}_CYCL${idCycle}_SEANCES.json`,
      JSON.stringify(s, null, 2),
      "utf8"
    );

    // TEMPORAIREMENT DESACTIVE: copie du fichier avec timestamp
    // await copyFile(
    //   `data/cycles/PROG${idProg}_CYCL${idCycle}_SEANCES.json`,
    //   `data/cycles/ts/PROG${idProg}_CYCL${idCycle}_SEANCES ${timestamp}.json`
    // );

    database.detach(db);
  } catch (e) {
    console.log(e);
    database.detach(db);
  }
})();