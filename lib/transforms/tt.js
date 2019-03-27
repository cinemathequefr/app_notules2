const _ = require("lodash");
const moment = require("moment");
const format = require("../format.js");

moment.updateLocale("fr", require("../config.js").momentLocale.fr);
moment.updateLocale("fr", {
  monthsShort: [
    "jan",
    "fév",
    "mar",
    "avr",
    "mai",
    "juin",
    "juil",
    "aoû",
    "sep",
    "oct",
    "nov",
    "déc"
  ],
  weekdaysShort: ["di", "lu", "ma", "me", "je", "ve", "sa"]
});






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
        <% _.forEach(film.textes, texte => { %>
          <% if (texte.typeTexte === 9) { %><pstyle:SYNOPSIS><% } %>
          <% if (texte.typeTexte === 99) { %><pstyle:INFOS_UTILES><% } %>
          <%= mdToIndesign(format.nbsp(texte.texte, "<0x00A0>")) %>
          ¤
        <% }) %>
      <% } %>

      <pstyle:>
      <% _.forEach(film.seance, seance => { %>
        <%= ba("<cstyle:INFOSBLEUES>", "", moment(seance.dateHeure).format("ddd DD MMM[XXX]HH[h]mm[XXX]")) %>
        <%= ba("<cstyle:SALLESBLEUES>", "¤", salle(seance.idSalle[0])) %>
        <%= ba("<pstyle:EVENEMENT>", "¤", mdToIndesign(seance.mention)) %>
        <%= ba("<pstyle:EVENEMENT>", "¤", mdToIndesign(film.precedeSuivi)) %>
      <% }) %>
      ¤
    <% }); %>
  <% } %>
  

  <% if (sousCycle.tri === 2 || sousCycle.tri === 3 || sousCycle.tri === 4) { %>
    <% _.forEach(sousCycle.items, evenement => { %>
      <%= ba("<pstyle:CATEGORIE>", "¤", evenement.titreEvenement) %>
      <% _.forEach(evenement.films, (film, i) => { %>

        <pstyle:TITRE><%= format.artTitre(film.art, film.titre) %>¤

        <%= ba("<pstyle:TITRE_ANG>(", ")¤", format.artTitre(film.artVo, film.titreVo)) %>
        <%= ba("<pstyle:TECHNIQUE>", "¤", format.de(film.realisateurs) + film.realisateurs) %>
        <%= ba("<pstyle:TECHNIQUE>", "¤", format.join("/", [film.pays, film.annee, ba("", "'", film.duree), film.version, film.format])) %>
        <%= ba("<pstyle:TECHNIQUE>", "¤", mdToIndesign(film.adaptation)) %>
        <%= ba("<pstyle:TECHNIQUE>Avec ", ".¤", format.join(", ", film.generique)) %>
  
        <% if(film.textes.length > 0) { %>
          <% _.forEach(film.textes, texte => { %>
            <%= ba("<pstyle:SYNOPSIS>", "¤", mdToIndesign(format.nbsp(texte.texte, "<0x00A0>"))) %>
            <% if (i < evenement.films.length - 1) { %><pstyle:SUIVI_DE>Suivi de¤<% } %>
          <% }) %>
        <% } %>

      <% }) %>

      <pstyle:>
      <% _.forEach(evenement.seance, seance => { %>
        <%= ba("<cstyle:INFOSBLEUES>", "", moment(seance.dateHeure).format("ddd DD MMM[XXX]HH[h]mm[XXX]")) %>
        <%= ba("<cstyle:SALLESBLEUES>", "¤", salle(seance.idSalle[0])) %>
        <%= ba("<pstyle:EVENEMENT>", "¤", mdToIndesign(seance.mention)) %>
      <% }) %>
      ¤


    <% }) %>
  <% } %>


  <% }); %>
`.replace(/\n\s*/g, "")
  // .replace(/œ/g, "<0x0093>")

);



// Pour test : fonction pour convertir l'italique Markdown en séquence de style InDesign
function mdToIndesign(str) {
  let o = str;
  try {
    o = o.replace(/\\/g, ""); // Retire les backslash (échappement Markdown)
    o = o.replace(/_([^_]+)_/gi, "<cSkew:9>$1<cSkew:>");
    // o = o.replace(/_([^_]+)_/gi, "<cstyle:ITAL>$1<cstyle:>");
    o = o.replace(/<sup>(.*?)<\/sup>/gi, "<cPosition:Superscript>$1<cPosition:>");

    return o;
  } catch (e) {
    return "";
  }
}

function salle(s) {
  let i = _.indexOf(["HL", "GF", "JE"], s);
  return i > -1 ? ["A", "B", "C"][i] : "";
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
    mdToIndesign: mdToIndesign,
    salle: salle
  });

  // Remplacement des ¤ par des sauts de ligne (attention : séquence \r\n)
  o = o.replace(/¤{2,}/g, "\r\n\r\n");
  o = o.replace(/¤/g, "\r\n");



  // Remplacement par le code correspondant en représentation UTF-16 (hex)
  o = o.replace(/Œ/g, "<0x0152>");
  o = o.replace(/œ/g, "<0x0153>");

  return o;
}

module.exports = tt;