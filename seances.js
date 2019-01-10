/**
 * Ce module exporte une fonction asynchrone servant à obtenir un objet (sérialisable en document JSON) des données de séances d'un cycle.
 * Cette fonction reçoit 2 arguments : une instance de la base de données et un objet de configuration du cycle.
 * L'objet de configuration du cycle est de la forme : { idProg: 55, idCycleProg: 413, titreCycle: "Michel Deville", sousCycles: [{ titre: "Les films", cats: [1844], tri: 1 }]}.
 * Il liste en particulier les idCategorie qui servent de critère de requête sur la base.
 * L'objet de retour est obtenu par la fusion de 3 opérations successives de requête sur la base + transformation lodash :
 * - Obtention des données "générales de séance" (identifiants divers, date/heure, salle, items de la séance)
 * - Obtention des données de mention de la séance ("séance présentée par"), mises en forme.
 * - Obtention des données de copies des films de la séance (format, version, durée).
 */

const _ = require("lodash");
const execQuery = require("./lib/exec_query");
const config = require("./lib/config");
const queries = require("./lib/queries");
const helpers = require("./lib/helpers");
const format = require("./lib/format");

/**
 * getSeancesFromCats
 * @description
 * A partir d'une liste d'id de catégories, renvoie la collection des séances (validées) (idSeance, puis idFilm comme clés de regroupement)
 * N'inclut pas d'informations de copie.
 * @param {Object} db Instance de base de données
 * @param {Array} idCats Tableau d'id de catégories
 * @return {Object}
 */
async function getSeancesFromCats(db, idCats) {
  let seances = await execQuery.single(db, queries.seancesFromCats, idCats);
  seances = _(seances)
    .map(d => helpers.keysToCamel(d))
    .groupBy(d => d.idSeance)
    .value();

  // On transforme chaque séance pour passer d'une structure à plat à une structure hiérarchisée (une séance = un objet avec en-tête et liste d'items)
  seances = _(seances).mapValues(d => {
    return _({}).assign(
      _(d[0]).pick(["idCycle", "idCategorie", "idEvenement", "idSeance", "dateHeure", "idSalle"]).value(), {
        items: _(d).map(e => _(e).pick(["idFilm", "ordre"]).value()).sortBy("ordre").groupBy("idFilm").mapValues(e => e[0]).value()
      }).value();
  }).value();
  return seances;
}


/**
 * getSeancesMentionsFromCats
 * @description
 * A partir d'une liste d'id de catégories, renvoie la collection des mentions de séances mises en forme (idSeance comme clé de regroupement)
 * @param {Object} db Instance de base de données
 * @param {Array} idCats Tableau d'id de catégories
 * @return {Object}
 */
async function getSeancesMentionsFromCats(db, idCats) {
  let seancesMentions = await execQuery.single(db, queries.seancesMentionsFromCats, idCats);
  return _(seancesMentions)
    .map(d => helpers.keysToCamel(d))
    .groupBy("idSeance")
    .mapValues(d =>
      _(d)
      .groupBy("mentionSeance")
      .mapValues(c =>
        _(c)
        .orderBy("ordre")
        .map(b => format.formatName(b.prenom, b.particule, b.nom) + (_.kebabCase(b.note) === "sous-reserve" ? " (sous réserve)" : ""))
        .value()
      )
      .mapValues(c => format.joinLast(", ", " et ", c))
      .map((v, k) => (config.dict.mentionSeance[k] || "") + v)
      .value()
    )
    .mapValues(c => c.join(". "))
    .mapValues(c => ({
      mention: c
    }))
    .value();
}


/**
 * getSeancesCopiesFromCats
 * @description
 * A partir d'une liste d'id de catégories, renvoie la collection des informations de copie (validées) (idSeance, puis idFilm comme clés de regroupement)
 * @param {Object} db Instance de base de données
 * @param {Array} idCats Tableau d'id de catégories
 * @return {Object}
 */
async function getSeancesCopiesFromCats(db, idCats) {
  let seancesCopies = await execQuery.single(db, queries.seancesCopiesFromCats, idCats);
  return _(seancesCopies)
    .map(d => helpers.keysToCamel(d))
    .map(d => _(d).assign({
        version: ((config.dict.version[d.version] || "") + (config.dict.sousTitres[d.sousTitres] || "") || (config.dict.intertitres[d.intertitres] || "")),
        format: (config.dict.format[d.format] || "")
      })
      .omit(["sousTitres", "intertitres"])
      .value()
    )
    .groupBy("idSeance") // Regroupement par idSeance
    .mapValues(d => _(d).groupBy("idFilm").value()) // Pour chaque séance, "regroupement" par idFilm (pour fusion)
    .mapValues(d => {
      return {
        items: _(d).mapValues(e => e[0]).value()
      };
    })
    .value();
}


/**
 * @param {Object} db Instance de base de données
 * @param {Object} cycleConfig Objet de configuration du cycle, de la forme : { idProg: 55, idCycleProg: 413, titreCycle: "Michel Deville", sousCycles: [{ titre: "Les films", cats: [1844], tri: 1 }]}.
 * @returns {Object} Objet (séralisable en JSON) de données de cycle
 */
module.exports = async function (db, cycleConfig) {
  let idCats = helpers.getIdCats(cycleConfig);
  let seances = await getSeancesFromCats(db, idCats);
  let seancesMentions = await getSeancesMentionsFromCats(db, idCats);
  let seancesCopies = await getSeancesCopiesFromCats(db, idCats);
  let seancesMerged = _.merge(seances, seancesMentions, seancesCopies); // Fusionne les trois jeux de données

  // Transforme des objets en tableaux : retire idSeances en clé de séance, et idFilm en clé d'item de séance + tri final
  seancesMerged = _(seancesMerged).map(d => _(d).mapValues((v, k) => {
      return k === "items" ? _(v).map().orderBy("ordre").value() : v;
    }).value())
    .orderBy("dateHeure")
    .value()

  return seancesMerged;
}