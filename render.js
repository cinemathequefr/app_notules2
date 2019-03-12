const fs = require("fs");
const _ = require("lodash");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const helpers = require("./lib/helpers.js");
const format = require("./lib/format.js");
const merge = require("./lib/transforms/merge.js");
const cleanTitreEvenement = require("./lib/transforms/clean_titre_evenement.js");
const render = require("./lib/transforms/render.js");

const markdown = require("./lib/transforms/markdown.js");
// const icml = require("./lib/transforms/icml.js");
const tt = require("./lib/transforms/tt.js"); // Tagged text

const writeFile = promisify(fs.writeFile);

try {
  let args = helpers.extractArgsValue(process.argv.slice(2).join(" "));
  var idProg = helpers.toNumOrNull(args.p[0]);
  var idCycle = helpers.toNumOrNull(args.c[0]);
} catch (e) {
  console.error("Erreur d'arguments. Les arguments attendus sont de la forme : -p <id programme> -c <id cycle>.")
}

(async function () {
  const cyclesConfig = await helpers.readFileAsJson(
    `./config/prog${idProg}.json`
  );

  let cycleConfig = helpers.cycleConfig(cyclesConfig, idCycle);
  let filename = getFilenameFromCycle(idCycle);

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
    `./data/cycles/PROG${idProg}_CYCL${idCycle}_MERGE.json`,
    JSON.stringify(cycle, null, 2),
    "utf8"
  );


  // (test) Summary
  // await writeFile(
  //   `data/cycles/SUMMARY${idCycle} ${cycleConfig.titreCycle}.md`,
  //   summary(cycle.data),
  //   "utf8"
  // );


  cycle = render(cycle.data);
  cycle = {
    header: cycleConfig,
    data: cycle
  };

  await writeFile(
    `./data/cycles/PROG${idProg}_CYCL${idCycle}_RENDER.json`,
    JSON.stringify(cycle, null, 2),
    "utf8"
  );

  await writeFile(
    `./data/cycles/markdown/PROG${idProg}_CYCL${idCycle} ${format.stripInvalidFilenameChars(cycleConfig.titreCycle)}.md`,
    markdown(cycle),
    "utf8"
  );

  await writeFile(
    `./data/cycles/tt/PROG${idProg}_CYCL${idCycle} ${format.stripInvalidFilenameChars(cycleConfig.titreCycle)}.txt`,
    tt(cycle),
    "latin1"
  );

  // await writeFile(
  //   `./data/cycles/icml/PROG${idProg}_CYCL${idCycle} ${cycleConfig.titreCycle}.icml`,
  //   icml(cycle),
  //   "utf8"
  // );





})();

// getFilenameFromCycle: renvoie les noms de fichiers d'un cycle à partir de son id.
function getFilenameFromCycle(idCycle) {
  return {
    films: `PROG${idProg}_CYCL${idCycle}_FILMS`,
    seances: `PROG${idProg}_CYCL${idCycle}_SEANCES`
  };
}