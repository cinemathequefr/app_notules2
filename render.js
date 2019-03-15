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
  var def = !_.isUndefined(args.d) ? "_DEF" : ""; // Utiliser les données films "définitives" (= corrigées) (fichier avec suffixe _DEF).
} catch (e) {
  console.error("Erreur d'arguments. Les arguments attendus sont de la forme : -p <id programme> -c <id cycle>\n-d pour utiliser la version corrigée (DEF) des films")
}


(async function () {
  const cyclesConfig = await helpers.readFileAsJson(
    `./config/prog${idProg}.json`
  );

  let cycleConfig = helpers.cycleConfig(cyclesConfig, idCycle);
  let filename = getFilenameFromCycle(idCycle);

  let seancesFilename = `./data/cycles/${filename.seances}.json`;
  console.log(`Lecture : ${seancesFilename}`);
  let seances = await helpers.readFileAsJson(
    seancesFilename
  );

  let filmsFilename = `./data/cycles/${filename.films}${def}.json`;
  console.log(`Lecture : ${filmsFilename}`);
  let films = await helpers.readFileAsJson(
    filmsFilename
  );

  let cycle = merge(cycleConfig, films, seances); // Etape MERGE : fusion des données (renvoie `{data,info}`)
  cycle = cleanTitreEvenement(cycle);

  // Pour test, on peut sérialiser le cycle à l'étape MERGE ici.
  // let mergeFilename = `./data/cycles/PROG${idProg}_CYCL${idCycle}_MERGE${def}.json`;
  // console.log(`Ecriture : ${mergeFilename}`);
  // await writeFile(
  //   mergeFilename,
  //   JSON.stringify(cycle, null, 2),
  //   "utf8"
  // );

  cycle = render(cycle.data);
  cycle = {
    header: cycleConfig,
    data: cycle
  };

  let renderFilename = `./data/cycles/PROG${idProg}_CYCL${idCycle}_RENDER${def}.json`;
  console.log(`Ecriture : ${renderFilename}`);
  await writeFile(
    renderFilename,
    // `./data/cycles/PROG${idProg}_CYCL${idCycle}_RENDER${def}.json`,
    JSON.stringify(cycle, null, 2),
    "utf8"
  );

  let mdFilename = `./data/cycles/markdown/PROG${idProg}_CYCL${idCycle} ${format.stripInvalidFilenameChars(cycleConfig.titreCycle)}${def}.md`;
  console.log(`Ecriture : ${mdFilename}`);
  await writeFile(
    mdFilename,
    // `./data/cycles/markdown/PROG${idProg}_CYCL${idCycle} ${format.stripInvalidFilenameChars(cycleConfig.titreCycle)}${def}.md`,
    markdown(cycle),
    "utf8"
  );

  let ttFilename = `./data/cycles/tt/PROG${idProg}_CYCL${idCycle} ${format.stripInvalidFilenameChars(cycleConfig.titreCycle)}${def}.txt`;
  console.log(`Ecriture : ${ttFilename}`);
  await writeFile(
    ttFilename,
    // `./data/cycles/tt/PROG${idProg}_CYCL${idCycle} ${format.stripInvalidFilenameChars(cycleConfig.titreCycle)}${def}.txt`,
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