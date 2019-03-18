const _ = require("lodash");
const moment = require("moment");
const format = require("../format.js");

moment.locale("fr", require("../config.js").momentLocale.fr);

// Template InDesign Tagged text
const temp = _.template(`<ANSI-WIN>¤
<vsn:6><fset:InDesign-Roman><dcs:INFOSBLEUES=<Nextstyle:INFOSBLEUES>><dcs:INFOSROUGES=<Nextstyle:INFOSROUGES>><dcs:SALLESBLEUES=<Nextstyle:SALLESBLEUES>><dcs:SALLESROUGES=<Nextstyle:SALLESROUGES>><dps:TITRE=<Nextstyle:TITRE>><dps:TECHNIQUE=<Nextstyle:TECHNIQUE>><dps:SYNOPSIS=<Nextstyle:SYNOPSIS>><dps:EVENEMENT=<Nextstyle:EVENEMENT>><dps:PRATIQUE=<Nextstyle:PRATIQUE>><dps:CONFERENCE NOTE=<Nextstyle:CONFERENCE NOTE>><dps:CONFERENCE TXT=<Nextstyle:CONFERENCE TXT>><dps:CONFERENCE TITRE=<Nextstyle:CONFERENCE TITRE>><dcs:ITAL=<cTypeface:Italic>>¤
<% _.forEach(data.data, sousCycle => { %>
  <pstyle:CATEGORIE><%= sousCycle.titreSousCycle %>¤¤
  <% if (sousCycle.tri === 1) { %>
    <% _.forEach(sousCycle.items, film => { %>
      <pstyle:TITRE><%= format.artTitre(film.art, film.titre) %>¤
      <%= ba("<pstyle:TITRE_ANG>(", ")¤", format.artTitre(film.artVo, film.titreVo)) %>
      <%= ba("<pstyle:TECHNIQUE>", "¤", format.de(film.realisateurs) + film.realisateurs) %>
      <%= ba("<pstyle:TECHNIQUE>", "¤", format.join("/", [film.pays, film.annee, ba("", "'", film.duree), film.version, film.format])) %>
      <%= ba("<pstyle:TECHNIQUE>", "¤", mdToIndesign(film.adaptation)) %>
      <%= ba("<pstyle:TECHNIQUE>Avec ", ".¤", format.join(", ", film.generique)) %>

      <% if(film.textes.length > 0) { %>
        <pstyle:SYNOPSIS>
        <% _.forEach(film.textes, texte => { %>
          <%= mdToIndesign(texte.texte) %>
          ¤
        <% }) %>
      <% } %>
      <pstyle:>
      <% _.forEach(film.seance, seance => { %>
        <%= ba("<cstyle:INFOSBLEUES>", "¤", format.join(" ", [moment(seance.dateHeure).format("ddd D MMM HH[h]mm"), seance.idSalle[0]])) %>
      <% }) %>
      ¤




    <% }); %>
  <% } %>
<% }); %>
`.replace(/\n\s*/g, "")
  // .replace(/œ/g, "<0x0093>")

);



// Pour test : fonction pour convertir l'italique Markdown en séquence de style InDesign
function mdToIndesign(str) {
  try {
    return str.replace(/_([^_]+)_/gi, "<cSkew:9>$1<cSkew:>");
    // return str.replace(/_([^_]+)_/gi, "<cstyle:ITAL>$1<cstyle:>");
  } catch (e) {
    return "";
  }
}

/**
 * Convertit un objet à l'étape _RENDER en chaîne InDesign TaggedText.
 * @param {json} data JSON _RENDER
 * @return {string} Chaîne tagged text
 */
function tt(data) {
  let o = temp({
    data: data,
    format: format,
    moment: moment,
    ba: format.beforeAfterStr,
    mdToIndesign: mdToIndesign // Pour test
  });

  // Remplacement des ¤ par des sauts de ligne (attention : séquence \r\n)
  o = o.replace(/¤{2,}/g, "\r\n\r\n");
  o = o.replace(/¤/g, "\r\n");

  o = o.replace(/œ/g, "<0x0153>"); // Remplacement par le code correspondant en représentation UTF-16 (hex)

  return o;
}

module.exports = tt;