const _ = require("lodash");

/**
 * getIdCats
 * Extrait d'un objet de configuration des cycles la liste de toutes les catégories.
 * @example
 * {
 *  "titreCycle": "Éric Rohmer",
 *  "idCycleProg": 357,
 *  "sousCycles": [ { "Six contes moraux": [1768] }, { "Comédies et proverbes": [1777] }, { "Contes des quatre saisons": [1776] } ]
 * }
 * => [1768, 1777, 1776]
 * @requires lodash
 * @param {Object} cycleConfig objet de configuration de cycle.
 * @returns {Array}
 */
function getIdCats(cycleConfig) {
  return _(cycleConfig.sousCycles)
    .map(d => _(d).map().value())
    .flatten()
    .flatten()
    .value();
}

/**
 * keysToCamel
 * @description
 * Normalise les clés d'un objet en camelCase.
 * (Utile lors de la récupération de données d'une base dont les champs sont en snakeCase.)
 * @example
 * { art_fr: "Le", titre_fr: "Doulos" }
 * => { artFr: "Le", titreFr: "Doulos" }
 * @requires lodash
 * @param { Object } obj Objet à traiter.
 * @returns { Object } Objet avec les clés en camelCase.
 */

function keysToCamel(obj) {
  return _(obj)
    .mapKeys((v, k) => _(k).camelCase())
    .value();
}

module.exports = {
  getIdCats: getIdCats,
  keysToCamel: keysToCamel
}