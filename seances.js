const _ = require("lodash");
const execQuery = require("./lib/exec_query");
const config = require("./lib/config");
const queries = require("./lib/queries");
const helpers = require("./lib/helpers");
const format = require("./lib/format");

async function getSeancesFromCats(db, idCats) {
  let seances = await execQuery.single(db, queries.seancesFromCats, idCats);
  seances = _(seances)
    .map(d => helpers.keysToCamel(d))
    .map(d => _(d).assign({
        version: ((config.dict.version[d.version] || "") + (config.dict.sousTitres[d.sousTitres] || "") || (config.dict.intertitres[d.intertitres] || "")),
        format: (config.dict.format[d.format] || "")
      })
      .omit(["sousTitres", "intertitres"])
      .value()
    )
    .groupBy(d => d.idSeance)
    .value();

  // On transforme chaque séance pour passer d'une structure à plat à une structure hiérarchisée (une séances = un objet avec en-tête et liste d'items)
  seances = _(seances).mapValues(d => {
    return _({}).assign(
      _(d[0]).pick(["idCycle", "idCategorie", "idSeance", "dateHeure", "idSalle"]).value(), {
        items: _(d).map(e => _(e).omit(["idCycle", "idCategorie", "idSeance", "dateHeure", "idSalle"]).value()).sortBy("ordre").value()
      }).value();
  }).value();

  return seances;

}

// Effectue une requête de mentions de séances et la transforme pour renvoyer un objet où
// keys = idSeance et values = chaîne en clair de mention de séance
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

module.exports = async function (db, cycleConfig) {
  let idCats = helpers.getIdCats(cycleConfig);
  let seances = await getSeancesFromCats(db, idCats);
  let seancesMentions = await getSeancesMentionsFromCats(db, idCats);

  console.log(seances);
  console.log(seancesMentions);

  let seancesMerged = _.merge(seances, seancesMentions);

  // Pour fusionner les séances et les mentions, on ne peut pas utiliser un simple _.merge
  // car les objets séance contiennent un _tableau_ d'items.
  // On intègre la mention de séance dans chacun de ces items. On utilise pour cela _.mergeWith et une fonction ad hoc.
  // let seancesMerged = _.mergeWith(
  //   seances,
  //   seancesMentions,
  //   (objValue, srcValue) =>
  //   _(objValue).map(d =>
  //     _(d).assign(srcValue).value()
  //   )
  //   .value()
  // );

  seancesMerged = _(seancesMerged).map().flatten().value(); // Convertit en tableau (retire les clés de regroupement idSeance)
  return seancesMerged;
}