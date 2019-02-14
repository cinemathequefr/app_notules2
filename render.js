const fs = require("fs");
const _ = require("lodash");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const helpers = require("./lib/helpers.js");
const merge = require("./lib/transforms/merge.js");
const cleanTitreEvenement = require("./lib/transforms/clean_titre_evenement.js");
const render = require("./lib/transforms/render.js");
const markdown = require("./lib/transforms/markdown.js");
const summary = require("./lib/transforms/summary.js");

const writeFile = promisify(fs.writeFile);
const idCycle = parseInt(process.argv[2], 10); // Id de cycle saisie en paramètre de ligne de commande

(async function () {
  const cyclesConfig = await helpers.readFileAsJson(
    "./data/config/cycles.json"
  );

  let cycleConfig = _(cyclesConfig).find({
    idCycleProg: idCycle
  });

  const filename = getFilenameFromCycle(idCycle);

  let seances = await helpers.readFileAsJson(
    `./data/cycles/${filename.seances}.json`
  );
  let films = await helpers.readFileAsJson(
    `./data/cycles/${filename.films}.json`
  );

  let cycle = merge(cycleConfig, films, seances); // Etape MERGE : fusion des données (renvoie `{data,info}`)
  cycle = cleanTitreEvenement(cycle);

  // Pour test, on peut sérialiser le cycle à l'étape MERGE ici.
  await writeFile(
    `data/cycles/CYCLE${cycleConfig.idCycleProg}_MERGE.json`,
    JSON.stringify(cycle, null, 2),
    "utf8"
  );


  // (test) Summary
  // await writeFile(
  //   `data/cycles/SUMMARY${cycleConfig.idCycleProg} ${cycleConfig.titreCycle}.md`,
  //   summary(cycle.data),
  //   "utf8"
  // );


  cycle = render(cycle.data);
  cycle = {
    header: cycleConfig,
    data: cycle
  };

  await writeFile(
    `data/cycles/CYCLE${cycleConfig.idCycleProg}_RENDER.json`,
    JSON.stringify(cycle, null, 2),
    "utf8"
  );

  let md = markdown(cycle);

  await writeFile(
    `data/cycles/CYCLE${cycleConfig.idCycleProg} ${cycleConfig.titreCycle}.md`,
    md,
    "utf8"
  );





})();

// Obtient les noms de fichiers json d'un cycle à partir de son id.
// NOTE: en replacement de la fonction renvoyant les titres avec le nom du cycle en clair.
function getFilenameFromCycle(idCycle) {
  return {
    films: `PROG56_CYCL${idCycle}_FILMS`,
    seances: `PROG56_CYCL${idCycle}_SEANCES`
    // films: `CYCLE${idCycle}_FILMS`,
    // seances: `CYCLE${idCycle}_SEANCES`
  };
}