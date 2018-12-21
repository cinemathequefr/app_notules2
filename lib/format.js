const _ = require("lodash");


/**
 * beforeAfterStr
 * @description
 * Ajoute des chaînes avant et après une chaîne si celle-ci existe.
 * Fonction utilitaire pour formater un contenu variable, et ne pas formater en l'absence de contenu.
 * @param {string|function} before Chaîne à ajouter avant (ou fonction)
 * @param {string|function} after Chaîne à ajouter après (ou fonction)
 * @param {string} str  Chaîne à traîter
 * @return {string}
 */
function beforeAfterStr(before, after, str) {
  if (!str) return;
  let _before = before;
  let _after = after;
  if (typeof before !== "function") before = () => (_before || "");
  if (typeof after !== "function") after = () => (_after || "");
  return before(str) + str + after(str);
}


/**
 * formatName
 * @description
 * Formate un  nom à partir des paramètres passés en les séparant par une espace, puis retire les espaces après apostrophe.
 * Cette version ne présuppose pas un nombre d'arguments défini.
 * On peut également passer les éléments du nom sous forme d'un array.
 * Cas d'utilisation :
 * - Formater un nom propre à partir de prénom, particule, nom
 * - Format un titre de film à partir d'article, reste du titre
 * @example
 * formatName("Albert", ["de", "Monaco"]) => "Albert de Monaco"
 * @requires lodash
 * @param {arguments} - Eléments séparés compasant le nom (strings ou tableaux (de tableaux) de strings)
 * @return {string}
 */
function formatName() {
  return _(Array.from(arguments)).flattenDeep().value()
    .join(" ")
    .replace(/\'\s/gi, "'")
    .replace(/\s+/gi, " ")
    .trim();
}

/**
 * joinLast
 * @description
 * Fonction équivalent à la méthode `Array.join` mais permettant de spécifier un séparateur particulier pour la dernière position.
 * A la différence de `join`, gère correctement le cas où `arr` est `undefined`.
 * Cas évident : la conjonction "et" en fin de liste.
 * @param {string} separator Séparateur d'items
 * @param {string} lastSeparator Séparateur d'items pour la dernière position
 * @param {array} arr Tableau des items de liste à joindre
 * @return {function|string}
 */
function joinLast(separator, lastSeparator, arr) {
  separator = separator || "";
  lastSeparator = lastSeparator || separator;

  function j(a) {
    a = a || [];
    if (a.length < 2) return a.join("");
    var last = a.pop();
    return a.join(separator) + lastSeparator + last;
  }
  return j(arr);
}



module.exports = {
  beforeAfterStr: beforeAfterStr,
  formatName: formatName,
  joinLast: joinLast
};