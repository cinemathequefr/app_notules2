const fs = require("fs");
const _ = require("lodash");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const helpers = require("./lib/helpers.js");
const merge = require("./lib/transforms/merge.js");
const render = require("./lib/transforms/render.js");
const markdown = require("./lib/transforms/markdown.js");

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

  let cycle = merge(cycleConfig, films, seances); // Fusion des données (renvoie `{data,info}`)
  cycle = render(cycle.data);
  cycle = {
    header: cycleConfig,
    data: cycle
  };

  // await writeFile(
  //   `data/cycles/CYCLE${cycleConfig.idCycleProg}_RENDER.json`,
  //   JSON.stringify(cycle, null, 2),
  //   "utf8"
  // );

  console.log(markdown(cycle));





})();

// Obtient les noms de fichiers json d'un cycle à partir de son id.
// NOTE: en replacement de la fonction renvoyant les titres avec le nom du cycle en clair.
function getFilenameFromCycle(idCycle) {
  return {
    films: `CYCLE${idCycle}_FILMS`,
    seances: `CYCLE${idCycle}_SEANCES`
  };
}