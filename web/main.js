var path = "CYCLE370_ALL.json";
// var path = "CYCLE370_ALL La Nouvelle Vague tchèque... et après.json";
// var path = "CYCLE408_ALL Federico Fellini.json";
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

// Fonctions de tri dans les sous-cycles
var tri = {
  "1": function (items) {
    // Tri par film
    return _(items)
      .groupBy("idFilm")
      .map(d =>
        _(d[0])
        .pick([
          "idCycle",
          "idFilm",
          "titre",
          "art",
          "titreVo",
          "artVo",
          "realisateurs",
          "annee",
          "pays",
          "textes",
          "adaptation",
          "generique",
          "duree",
          "format",
          "version"
        ])
        .assign({
          seance: _(d)
            .map(e =>
              _(e)
              .pick([
                "idSeance",
                "ordre",
                "idEvenement",
                "dateHeure",
                "idSalle",
                "mention"
              ])
              .assign({
                avant: _(items)
                  .filter(
                    f => f.idSeance === e.idSeance && f.ordre < e.ordre
                  )
                  .thru(g =>
                    g.length > 0 ?
                    _(g)
                    .map(g =>
                      _(g)
                      .pick(["idFilm", "titre", "art"])
                      .value()
                    )
                    .value() :
                    null
                  )
                  .value(),
                apres: _(items)
                  .filter(
                    f => f.idSeance === e.idSeance && f.ordre > e.ordre
                  )
                  .thru(g =>
                    g.length > 0 ?
                    _(g)
                    .map(g =>
                      _(g)
                      .pick(["idFilm", "titre", "art"])
                      .value()
                    )
                    .value() :
                    null
                  )
                  .value()
              })
              .value()
            )
            .value()
        })
        .value()
      )
      .orderBy("titre")
      .value();
  },
  "2": function (d) {
    return _(items)
      .sortBy("titre")
      .value();
  },
  "3": function (d) {
    return _(items)
      .sortBy("titre")
      .value();
  }
};

var temp = {
  cycle: _.template(`
<% _.forEach(data, function (d) { %>
  <div class="souscycle">
    <h2><%= d.titreSousCycle %></h2>
    <% if (d.tri === 1) { %>
      <% _.forEach(tri[1](d.items), function (e) { %>
        <div class="item">
          <div class="titrefilm"><%= artTitre(e.art, e.titre) %></div>
          <% if(e.titreVo) { %><div class="titreFilm">(<%= artTitre(e.artVo, e.titreVo) %>)</div><% } %>
          <div><%= joinLast(" / ", " / ", [e.pays, e.annee, (e.duree ? e.duree + "'" : null) , e.version, e.format]) %></div>
          <% if (e.adaptation) { %><div><%= e.adaptation %></div><% } %>
          <% if (e.generique) { %>Avec <%= e.generique %>.<% } %>
          <% _.forEach(e.textes, function (f) { %>
            <p><%= f.texte %></p>
          <% }); %>          
          <% _.forEach(e.seance, function (f) { %>
            <div class="seance">
            <div><%= moment(f.dateHeure).format("ddd D MMM HH[h]mm") %> <span class="salle"><%= f.idSalle[0] %></span></div>
            <div><%= precedeSuivi(f.avant, f.apres) %></div>
            <% if (f.mention) { %><div class="mentionSeance"><%= f.mention %></div><% } %>
            </div>
          <% }); %>
        </div>
      <% }); %>
    <% } %>
  </div>
<% }); %>
  `)
};

Promise.all([cycleData, documentReady()]).then(run);

function run() {
  var data = arguments[0][0];
  var $cont = $(".container");
  var o = temp.cycle({
    data: data
  });
  $cont.html(o);
}

// Fonctions de formatage
function joinLast(separator, lastSeparator, arr) {
  separator = separator || "";
  lastSeparator = lastSeparator || separator;
  arr = _(arr)
    .filter(i => !!i)
    .value(); // Elimine les items falsy
  function j(a) {
    a = a || [];
    if (a.length < 2) return a.join("");
    var last = a.pop();
    return a.join(separator) + lastSeparator + last;
  }
  return j(arr);
}

function precedeSuivi(avant, apres) {
  avant = joinLast(
    ", ",
    ", ",
    _(avant).map(function (d) {
      return "_" + artTitre(d.art, d.titre) + "_";
    })
  );
  apres = joinLast(
    ", ",
    ", ",
    _(apres).map(function (d) {
      return "_" + artTitre(d.art, d.titre) + "_";
    })
  );
  if (avant !== "" && apres != "") {
    return `Film précédé ${de(avant) + avant} et suivi de ${de(apres) +
      apres}.`;
  } else if (avant !== "") {
    return `Film précédé ${de(avant) + avant}.`;
  } else if (apres !== "") {
    return `Film suivi ${de(apres) + apres}.`;
  } else {
    return "";
  }
}

function artTitre(art, titre) {
  return !art ? titre : art === "L'" ? art + titre : art + " " + titre;
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
  return _.indexOf("AEIOU", _.upperCase(_.deburr(str)).charAt(0)) > -1 ?
    "d'" :
    "de ";
}

function documentReady() {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }
  return new Promise(function (resolve) {
    window.addEventListener("load", resolve);
  });
}