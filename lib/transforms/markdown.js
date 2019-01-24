const _ = require("lodash");
const moment = require("moment");
const format = require("../format.js");

moment.locale("fr", require("../config.js").momentLocale.fr);


const temp = _.template(`
# <%= data.header.titreCycle %>¤¤
<% _.forEach(data.data, sousCycle => { %>
  ## <%= sousCycle.titreSousCycle %>¤¤
  <% _.forEach(sousCycle.items, film => { %>
    **<%= format.artTitre(film.art, film.titre) %>**¤
    <%= ba("**(", ")**¤", format.artTitre(film.artVo, film.titreVo)) %>
    <%= ba("", "¤", format.de(film.realisateurs) + film.realisateurs) %>
    <%= ba("", "¤", format.join(" / ", [film.pays, film.annee, ba("", " min", film.duree), film.version, film.format])) %>
    <%= ba("", "¤", film.adaptation) %>
    <%= ba("Avec ", ".¤", format.join(", ", film.generique)) %>
    <% _.forEach(film.textes, texte => { %>
      <%= ba("", "¤", texte.texte) %>
    <% }) %>
    <%= ba("", "¤", film.precedeSuivi) %>
    <% _.forEach(film.seance, seance => { %>
      <%= ba("", "¤", format.join(" ", [moment(seance.dateHeure).format("ddd D MMM YYYY HH[:]mm"), seance.idSalle[0]])) %>
      <%= ba("", "¤", seance.mention) %>
      <%= ba("", "¤", seance.precedeSuivi) %>
    <% }) %>
    ¤¤
  <% }) %>
  <% }) %>
`
  .replace(/\n\s*/g, "")
);

/**
 * markdown
 * @description
 * Transforme les données d'un cycle en document Markdown
 * @param {Array} data Données de cycle (étape _RENDER)
 * @returns {String} Rendu du cycle au format Markdown
 */
function markdown(data) {
  let o = temp({
    data: data,
    format: format,
    moment: moment,
    ba: format.beforeAfterStr // Raccourci
  });

  // Remplacement des ¤ par des sauts de ligne
  o = o.replace(/¤{2,}/g, "\n\n");
  o = o.replace(/¤/g, " \n");
  return o;
}

module.exports = markdown;