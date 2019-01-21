/**
 * Ce script de ligne de commande lit les fichiers de données films et séances du cycle dont l'identifiant est passé en paramètre
 * et les fusionne (première étape en vue des diverses présentations des données de cycle).
 */

const fs = require("fs");
const _ = require("lodash");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const helpers = require("./lib/helpers.js");

const writeFile = promisify(fs.writeFile);

const idCycle = parseInt(process.argv[2], 10); // Id de cycle saisie en paramètre de ligne de commande

(async function () {
  const cyclesConfig = await helpers.readFileAsJson(
    "./data/config/cycles.json"
  );
  let cycleConfig = _(cyclesConfig).find({
    idCycleProg: idCycle
  });

  const filename = getFilenameFromCycle(idCycle, cyclesConfig);

  let seances = await helpers.readFileAsJson(
    `./data/cycles/${filename.seances}.json`
  );
  let films = await helpers.readFileAsJson(
    `./data/cycles/${filename.films}.json`
  );

  let filmsInSeances = _(seances)
    .map(d =>
      _(d.items)
      .map(e => e.idFilm)
      .value()
    )
    .flatten()
    .uniq()
    .sort()
    .value();
  let filmsInFilms = _(films)
    .map(d => d.idFilm)
    .sort()
    .value();
  let cycle = []; // Données du cycle, fusion de séances dans les films.

  // Vérification de la cohérence des deux fichiers avant fusion
  // Note: Cette vérification est nécessaire car le fichier films.json sera généralement généré (pour corrections)
  // bien avant le fichier seances.json.
  // Il faudra pouvoir mettre à jour film.json en ajoutant (ou retirant) des films pour retrouver la cohérence avec les séances.
  console.log(`Les données films contiennent ${filmsInFilms.length} films.`);
  console.log(
    `Les données séances référencent ${filmsInSeances.length} films.`
  );

  let diffFilmsSeances = _.difference(filmsInFilms, filmsInSeances);
  let diffSeancesFilms = _.difference(filmsInSeances, filmsInFilms);

  if (diffFilmsSeances.length === 0 && diffSeancesFilms.length === 0) {
    console.log("Ces données sont cohérentes.");
  } else {
    console.log("Les données ne sont pas cohérentes");
    if (diffFilmsSeances.length > 0) {
      // Cas bénin, il suffit d'ignorer les films concernés
      console.log(
        `Aucune séance n'a été trouvée pour les films suivants : ${diffFilmsSeances.join(
          ", "
        )}`
      );
    }
    if (diffSeancesFilms.length > 0) {
      // Il faudra pouvoir patcher films.json avec les données manquantes
      console.log(
        `Les films suivants ont des séances mais pas de données les concernant : ${diffFilmsSeances.join(
          ", "
        )}`
      );
    }
  }

  // Séances : il faut commencer par créer une entrée par item de séance combinant en-tête + données d'item.

  seances = _(seances)
    .map(d => {
      let header = _(d)
        .omit("items")
        .value();
      return _(d.items)
        .map(e =>
          _({})
          .assign(e, header)
          .value()
        )
        .value();
    })
    .flatten()
    .value();

  films = _(films)
    .groupBy("idFilm")
    .mapValues(e => e[0])
    .value();

  seances = _(seances)
    .groupBy("idFilm")
    .mapValues(e => {
      return {
        seance: e
      };
    })
    .value();

  cycle = _.merge(films, seances);
  cycle = _(cycle)
    .map()
    .value();

  // Répartition par sous-cycle (en suivant l'ordre indiqué par cycleConfig)
  cycle = _(cycleConfig.sousCycles)
    .map(d => {
      return {
        titreSousCycle: d.titre,
        tri: d.tri,
        items: _(d.cats)
          .map(
            e =>
            _(cycle)
            .groupBy("idCategorie")
            .value()[e]
          )
          .flatten()
          .orderBy("titre")
          .value()
      };
    })
    .value();

  cycle = _(cycle)
    .map(d =>
      _({}).assign(d, {
        items: _(d.items)
          .map(e =>
            _(e.seance)
            .map(f =>
              _({})
              .assign(
                f,
                _(e)
                .pick([
                  "titre",
                  "art",
                  "titreVo",
                  "artVo",
                  "realisateurs",
                  "annee",
                  "pays",
                  "generique",
                  "adaptation",
                  "textes"
                ])
                .value()
              )
              .value()
            )
            .value()
          )
          .sortBy("titre", "dateHeure")
          .flatten()
          .value()
      })
    )
    .value();

  await writeFile(
    `data/cycles/CYCLE${cycleConfig.idCycleProg}_ALL.json`,
    JSON.stringify(cycle, null, 2),
    "utf8"
  );
})();

// Obtient les noms de fichiers json d'un cycle à partir de son id.
// NOTE: en replacement de la fonction renvoyant les titres avec le nom du cycle en clair.
function getFilenameFromCycle(idCycle) {
  return {
    films: `CYCLE${idCycle}_FILMS`,
    seances: `CYCLE${idCycle}_SEANCES`
  };
}

// Obtient les noms de fichiers json d'un cycle (qui incluent le titre du cycle en clair) à partir de son id et de l'objet de configuration des cycles.
// function getFilenameFromCycle(idCycle, cyclesConfig) {
//   let cycleConfig = _(cyclesConfig).find({
//     idCycleProg: idCycle
//   });
//   return {
//     films: `CYCLE${cycleConfig.idCycleProg}_FILMS ${cycleConfig.titreCycle}`,
//     seances: `CYCLE${cycleConfig.idCycleProg}_SEANCES ${cycleConfig.titreCycle}`
//   };
// }