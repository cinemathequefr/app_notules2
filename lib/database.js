const Firebird = require("node-firebird");

function attach(options) {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, db) => {
      if (db) {
        resolve(db);
      } else {
        reject(err);
      }
    });
  });
}

module.exports = {
  attach: attach
}