const _ = require("lodash");
const execQuery = require("../exec_query");
const config = require("../config");
const queries = require("../queries");
const helpers = require("../helpers");
const format = require("../format");
const turndownService = new require("turndown")(config.turndown);

async function getFilmsFromCats(db, idCats) {
  let films = await execQuery.single(db, queries.filmsFromCats, idCats);
  films = _(films)
    .map(d => helpers.keysToCamel(d))
    .map(d => _({}).assign(
      format.normalizeTitle(format.cudm(d.titreVo), format.cudm(d.artVo), format.cudm(d.titreFr), format.cudm(d.artFr)),
      _(d).omit(["titreVo", "artVo", "titreFr", "artFr"]).value()
    ).value())
    .groupBy("idFilm")
    .mapValues(d => d[0])
    .mapValues(d =>
      _(d)
      .assign({
        pays: format.expandCountries(d.pays).join("-")
      })
      .value()
    )
    .value();
  return films;
}

async function getFilmsTextesFromCats(db, idCats) {
  let filmsTextes = await execQuery.single(db, queries.filmsTextesFromCats, idCats);
  filmsTextes = _(filmsTextes)
    .map(d => helpers.keysToCamel(d))
    .groupBy("idFilm")
    .mapValues(d => {
      return {
        textes: _(d).map(f => {
          return {
            typeTexte: f.typeTexte,
            texte: turndownService.turndown(format.cudm(f.texte))
          };
        }).value()
      };
    })
    .value();
  return filmsTextes;
}

async function getFilmsGeneriquesFromCats(db, idCats) {
  let filmsGeneriques = await execQuery.single(db, queries.filmsGeneriquesFromCats, idCats);
  filmsGeneriques = _(filmsGeneriques)
    .map(d => helpers.keysToCamel(d))
    .filter(d => d.fonction === 32)
    .orderBy(d => d.ordre)
    .groupBy(d => d.idFilm)
    .mapValues(d => {
      return {
        generique: _(d)
          .take(4)
          .map(f => format.formatName(f.prenom, f.particule, f.nom))
          .value()
      };
    })
    .value();

  return filmsGeneriques;
}

async function getFilmsAdaptationsFromCats(db, idCats) {
  let filmsAdaptations = await execQuery.single(db, queries.filmsAdaptationsFromCats, idCats);

  filmsAdaptations = _(filmsAdaptations)
    .map(d => helpers.keysToCamel(d))
    .groupBy("idFilm")
    .mapValues(d => {
      return {
        adaptation: format
          .beforeAfterStr(
            "",
            ".",
            _(d)
            .groupBy("mention")
            .map(c => {
              let auteurs = format.joinLast(" , ", " et ", _(c).map(b => format.formatName(b.prenom, b.particule, b.nom)).value());
              return _.upperFirst(c[0].mention) + " " + format.de(auteurs) + auteurs;
            })
            .value()
            .join(`.  \n`)
          )
          .replace(/\"([^\"]+)\"/gi, "_$1_") // Remplace les guillemets des titres par l'italique markdown `_`
      };
    })
    .value();

  return filmsAdaptations;
}

module.exports = async function (db, cycleConfig) {
  let idCats = helpers.getIdCats(cycleConfig);
  let films = await getFilmsFromCats(db, idCats);
  let filmsTextes = await getFilmsTextesFromCats(db, idCats);
  let filmsGeneriques = await getFilmsGeneriquesFromCats(db, idCats);
  let filmsAdaptations = await getFilmsAdaptationsFromCats(db, idCats);
  let filmsMerged = _.merge(films, filmsTextes, filmsGeneriques, filmsAdaptations);
  filmsMerged = _(filmsMerged).map().orderBy(d => _.kebabCase(d.titre)).value();
  return filmsMerged;
};