var path = "CYCLE408_ALL Federico Fellini.json";
// var path = "CYCLE400_ALL Jerzy Skolimowski.json";
// var path = "CYCLE357_ALL Éric Rohmer.json";

var cycleData = $.get("../data/cycles/" + path);

moment.locale("fr", {
  months: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre"
  ],
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
  weekdays: [
    "Dimanche",
    "Lundi ",
    "Mardi ",
    "Mercredi ",
    "Jeudi ",
    "Vendredi ",
    "Samedi "
  ],
  weekdaysShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
});



var temp = {
  cycle1: _.template(`
<% _.forEach(data, function (d) { %>
  <div class="souscycle">
    <h2><%= d.titreSousCycle %></h2>
    <% _.forEach(d.items, function (f) { %>
      <div class="film">
        <div class="titrefilm"><%= artTitre(f.art, f.titre) %></div>
        <% if(f.titreVo) { %><div class="titreFilm">(<%= artTitre(f.artVo, f.titreVo) %>)</div><% } %>
        <div><%= de(f.realisateurs) + f.realisateurs %></div>
        <div><%= joinLast(" / ", " / ", [f.pays, f.annee, (f.seance[0].duree ? f.seance[0].duree + "'" : null) , f.seance[0].version, f.seance[0].format]) %></div>
        <% if (f.adaptation) { %><div><%= f.adaptation %></div><% } %>
        <% if (f.generique) { %>Avec <%= f.generique %>.<% } %>
        <% _.forEach(f.textes, function (t) { %>
          <p><%= t.texte %></p>
        <% }); %>
        <% _.forEach(f.seance, function (s) { %>
          <div class="seance">
            <div><%= moment(s.dateHeure).format("ddd D MMM HH[h]mm") %> <span class="salle"><%= s.idSalle[0] %></span></div>
            <% if (s.mention) { %><div class="mentionSeance"><%= s.mention %></div><% } %>
          </div>
        <% }); %>
      </div>
    <% }); %>
  </div>
<% }); %>
`)
};


Promise.all([cycleData, documentReady()]).then(run);

function run() {
  var data = arguments[0][0];
  var $cont = $(".container");



  // Tri dans les sous-cycles
  var tri = {
    "1": function (d) {
      return _(d.items).sortBy("titre").value();
    },
    "2": function (d) {
      return _(d.items).sortBy("titre").value();
    },
    "3": function (d) {
      return _(d.items).sortBy("titre").value();
    },
  }

  data = _(data).map(d => _(d).assign({
    items: tri[d.tri](d)
  }).value()).value();

  console.log(data);



  var o = temp.cycle1({
    data: data
  });





  $cont.html(o);
  // $cont.html(JSON.stringify(data, null, 2));



}


function artTitre(art, titre) {
  return (!art ? titre : (art === "L'" ? art + titre : art + " " + titre));
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





function documentReady() {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }
  return new Promise(function (resolve) {
    window.addEventListener("load", resolve);
  });
}