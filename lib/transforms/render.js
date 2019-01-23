const _ = require("lodash");
const format = require("../format.js");

/**
 * render
 * Transforme des données de cycle (_MERGE) en données _RENDER.
 * @param {Array} cycle Données JSON de cycle.
 * @returns {Array} Données JSON de cycle formatées pour rendu.
 */
function render(cycle) {
  cycle = _(cycle).map(d => _(d).pick(["titreSousCycle", "tri"]).assign({
    items: _(d.items).thru(items => {

      // Mode de tri 1
      if (d.tri === 1) {
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
                  .thru(e => {
                    let precedeSuivi = format.precedeSuivi(
                      _(items)
                      .filter(
                        f => f.idSeance === e.idSeance && f.ordre < e.ordre
                      )
                      .thru(g =>
                        g.length > 0 ?
                        _(g)
                        .map(g =>
                          _(g)
                          .pick(["idFilm", "titre", "art", "realisateurs"])
                          .value()
                        )
                        .value() :
                        null
                      )
                      .value(),
                      _(items)
                      .filter(
                        f => f.idSeance === e.idSeance && f.ordre > e.ordre
                      )
                      .thru(g =>
                        g.length > 0 ?
                        _(g)
                        .map(g =>
                          _(g)
                          .pick(["idFilm", "titre", "art", "realisateurs"])
                          .value()
                        )
                        .value() :
                        null
                      )
                      .value()
                    );

                    return precedeSuivi === "" ? e : _(e).assign({
                      precedeSuivi: precedeSuivi
                    }).value();
                  })
                  .value()
                )
                .value()
            })
            .value()
          )
          .orderBy("titre")
          .value()


      }
    }).value()
  }).value()).value();




  return cycle;
}

module.exports = render;