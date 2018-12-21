const fs = require("fs");
const database = require("./lib/database");
const config = require("./lib/config");
const seances = require("./seances.js");

// const idCats = [1623, 1768, 1777, 1776, 1793]; // Rohmer
// const idCats = [1588]; // Balzac
// const idCats = [1730, 1733]; // Wilder
// const idCats = [1828, 1849, 1866]; // Crawford

let cycleConfig = {
  idCycleProg: 379,
  titreCycle: "Billy Wilder",
  sousCycles: [{
    "Les films": [1730, 1733]
  }]
};

// let cycleConfig = {
//   idCycleProg: 407,
//   titreCycle: "Joan Crawford",
//   sousCycles: [{
//     "Les films": [1828, 1849, 1866]
//   }]
// };

// let cycleConfig = {
//   idCycleProg: 357,
//   titreCycle: "Éric Rohmer",
//   sousCycles: [{
//       "Six contes moraux": [1768]
//     },
//     {
//       "Comédies et proverbes": [1777]
//     },
//     {
//       "Contes des quatre saisons": [1776]
//     },
//     {
//       "Autres longs métrages": [1793]
//     },
//     {
//       "Courts métrages": [1752]
//     },
//     {
//       "Documentaires, films pédagogiques": [1755]
//     },
//     {
//       "Autour d'Éric Rohmer": [1755]
//     }
//   ]
// };


(async function () {
  try {
    const db = await database.attach(config.db);
    // let f = await films(db, cycleConfig);
    let s = await seances(db, cycleConfig);

    fs.writeFile(
      `data/json/CYCLE${cycleConfig.idCycleProg} ${cycleConfig.titreCycle} - seances.json`,
      JSON.stringify(s, null, 2),
      "utf8",
      () => {}
    );
    console.log(s);
  } catch (e) {
    console.log(e);
  }
})();