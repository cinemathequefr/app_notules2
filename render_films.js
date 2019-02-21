const fs = require("fs");
const _ = require("lodash");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const helpers = require("./lib/helpers.js");
const markdownFilms = require("./lib/transforms/markdown_films.js");
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
  let films = await helpers.readFileAsJson(
    `./data/cycles/${filename.films}.json`
  );

  let md = markdownFilms({
    header: cycleConfig,
    data: films
  });

  await writeFile(
    `./data/cycles/markdown/PROG${idProg}_CYCL${idCycle}_FILMS ${cycleConfig.titreCycle}.md`,
    md,
    "utf8"
  );


})();

// Obtient les noms de fichiers json d'un cycle à partir de son id.
function getFilenameFromCycle(idCycle) {
  return {
    films: `PROG${idProg}_CYCL${idCycle}_FILMS`,
  };
}