const fs = require("fs");
const _ = require("lodash");
const database = require("./lib/database");
const config = require("./lib/config");
const seances = require("./seances.js");
const films = require("./films.js");
const helpers = require("./lib/helpers.js");

const idCycle = parseInt(process.argv[2], 10); // Id de cycle saisie en paramètre de ligne de commande

(async function () {

  const cyclesConfig = await helpers.readFileAsJson("./data/config/cycles.json");
  let cycleConfig = _(cyclesConfig).find({
    idCycleProg: idCycle
  });

  // console.log(JSON.stringify(cycle, null, 2));

  try {
    const db = await database.attach(config.db);
    let f = await films(db, cycleConfig);

    console.log(JSON.stringify(f, null, 2));

    // TEMPORAIREMENT DESACTIVE
    // let s = await seances(db, cycleConfig);

    // fs.writeFile(
    //   `data/json/CYCLE${cycle.idCycleProg} ${cycle.titreCycle} - seances.json`,
    //   JSON.stringify(s, null, 2),
    //   "utf8",
    //   () => {}
    // );

    database.detach(db);
  } catch (e) {
    console.log(e);
    database.detach(db);
  }
})();