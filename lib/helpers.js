const _ = require("lodash");
const fs = require("fs");


async function readFile(path, encoding) {
  encoding = encoding || "utf8";
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  });
}

async function readFileAsJson(path, encoding) {
  let data = await readFile(path, encoding);
  return JSON.parse(data);
}

/**
 * getIdCats
 * Extrait d'un objet de configuration de cycle la liste de toutes les catégories.
 * @example
 * {
 *   "idProg": 55,
 *   "idCycleProg": 400,
 *   "titreCycle": "Jerzy Skolimowski",
 *   "sousCycles": [{
 *       "titre": "Les films",
 *       "cats": [1810],
 *       "tri": 1
 *     },
 *     {
 *       "titre": "Autour de Jerzy Skolimowski",
 *       "cats": [1850],
 *       "tri": 1
 *     }
 *   ]
 * }
 *  => [1810, 1850]
 * @requires lodash
 * @param {Object} cycleConfig Objet de configuration de cycle.
 * @returns {Array}
 */
function getIdCats(cycleConfig) {
  return _(cycleConfig.sousCycles).map(d => d.cats).flatten().value();
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
  readFile: readFile,
  readFileAsJson: readFileAsJson,
  getIdCats: getIdCats,
  keysToCamel: keysToCamel
}