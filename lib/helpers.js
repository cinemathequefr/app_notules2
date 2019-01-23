const _ = require("lodash");
const fs = require("fs");
const moment = require("moment");

/**
 * readFile
 * Fonction asynchrone pour lire un fichier et retourner son contenu.
 * @param {string} path Chemin d'accès du fichier
 * @param {string} encoding Encodage
 * @return {string} Contenu (chaîne de caractères) du fichier
 */
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

/**
 * readFile
 * Fonction asynchrone pour lire un fichier et retourner son contenu.
 * @param {string} path Chemin d'accès du fichier JSON
 * @param {string} encoding Encodage
 * @return {object} Objet
 */
async function readFileAsJson(path, encoding) {
  let data = await readFile(path, encoding);
  return JSON.parse(data);
}

/**
 * getIdCats
 * Extrait d'un objet de configuration de cycle la liste de toutes les catégories.
 * @example
 * { idProg, idCycleProg, titreCyle, sousCycles: [{titre, cats: [1810], tri }, {titre, cats: [1850], tri }]} => [1810, 1850]
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

/**
 * timestamp
 * @returns {string} Timestamp de l'heure courante au format YYYYMMDDHHmm
 */
function timestamp() {
  return moment().format("YYYYMMDDHHmm");
}

module.exports = {
  readFile: readFile,
  readFileAsJson: readFileAsJson,
  getIdCats: getIdCats,
  keysToCamel: keysToCamel,
  timestamp: timestamp
}