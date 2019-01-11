const _ = require("lodash");
const config = require("./config.js")

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
 * @param {string} lastSeparator Séparateur d'items pour la dernière position (entre l'avant-dernier et le dernier item)
 * @param {array} arr Tableau des items de liste à joindre
 * @return {function|string}
 */
function joinLast(separator, lastSeparator, arr) {
  separator = separator || "";
  lastSeparator = lastSeparator || separator;

  arr = _(arr).filter(i => !!i).value(); // Elimine les items falsy

  function j(a) {
    a = a || [];
    if (a.length < 2) return a.join("");
    var last = a.pop();
    return a.join(separator) + lastSeparator + last;
  }
  return j(arr);
}


/**
 * normalizeTitle
 * @description
 * Normalise des valeurs de champs composant un titre de film.
 * Si le titre Vo est identique au title Fr, il n'est pas renvoyé.
 * Traitement supplémentaire : on retire les crochets droits, qui identifient dans Cinédoc les titres forgés.
 * @param {string|null} titleVo Titre original (sans article).
 * @param {string|null} artVo Article du titre original.
 * @param {string|null} titleFr Titre français (sans article).
 * @param {string|null} artFr Article du titre français.
 * @param {string} titleFieldName (optionnel) Pour la sortie, nom du champ du titre usuel (français), par défaut : "title".
 * @param {string} artFieldName (optionnel) Pour la sortie, nom du champ de l'article du titre usuel (français), par défaut : "art".
 * @param {string} titleVoFieldName (optionnel) Pour la sortie, nom du champ du titre original, par défaut : "titleVo".
 * @param {string} artVoFieldName (optionnel) Pour la sortie, nom du champ de l'article du titre original, par défaut : "artVo".
 * @returns {Object} Objet de la forme { title: "", art: "", titleVo: "", artVo: "" }. Les champs null ne sont pas renvoyés.
 */
function normalizeTitle(
  titleVo,
  artVo,
  titleFr,
  artFr,
  titleFieldName,
  artFieldName,
  titleVoFieldName,
  artVoFieldName
) {
  titleFieldName = titleFieldName || "titre";
  artFieldName = artFieldName || "art";
  titleVoFieldName = titleVoFieldName || "titreVo";
  artVoFieldName = artVoFieldName || "artVo";
  var output = {};
  var art;
  var title = titleFr ? ((art = artFr), titleFr) : ((art = artVo), titleVo);

  output[titleFieldName] = title;
  if (art) output[artFieldName] = art;

  if (title !== titleVo) {
    output[titleVoFieldName] = titleVo;
    if (artVo) output[artVoFieldName] = artVo;
  }

  output = _(output)
    .mapValues(v => v.replace(/[\[\]]/g, "")) // Retire les crochets des titres (indiquant les titres forgés)
    .value();

  return output;
}

/**
 * de
 * @description
 * Renvoie "de " ou "d'" selon la chaîne passée en paramètre
 * @param {string} str
 * @returns {string}
 */
function de(str) {
  if (!str) return;
  return (_.indexOf("AEIOU", _.upperCase(_.deburr(str)).charAt(0)) > -1 ? "d'" : "de ");
}


/**
 * expandCountries(codes)
 * Transforme une chaîne avec une liste de codes pays (ex. "ESP;FRA;ITA") par une chaîne avec les noms complets ("Espagne, France, Italie")
 * La liste des pays se trouve dans le tableau `config.countries`
 * @param codes {string}
 * @output {array}
 */
function expandCountries(codes) {
  return _(codes.split(";"))
    .map(code => _.find(config.countries, f => f[0] === code)[1] || code)
    .value()
}


module.exports = {
  beforeAfterStr: beforeAfterStr,
  cudm: require("./cudm.js"),
  expandCountries: expandCountries,
  formatName: formatName,
  joinLast: joinLast,
  de: de,
  normalizeTitle: normalizeTitle
};