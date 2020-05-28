'use strict';

let fs = require('fs');
let mustache = require('mustache');

function loadPopup(isNew, userType, matieres, renduInfos) {
    console.log(renduInfos);
    let data = fs.readFileSync('./application/html/popup_rendu.html');
    let types = [{value: 'TP'}, {value: 'DS'}, {value: 'Rapport'}, {value: 'TD'}, {value: 'Personnel'}];
    if (renduInfos) {
        types.forEach((e) => {
            if (e.value === renduInfos.type_travail) {
                e.selected = true;
            }
        });
        matieres.forEach((e) => {
            if (e.id_matiere === renduInfos.id_matiere) {
                e.selected = true;
            }
        });
        renduInfos.description_travail = unescape(renduInfos.description_travail);
        renduInfos.lien_rendu = unescape(renduInfos.lien_rendu);
        renduInfos.date_travail = renduInfos.date_travail.replace(' ', 'T').substring(0, 16);
    }
    return mustache.render(data.toString(), {isNew: isNew, actionType: isNew ? 'Nouveau' : 'Modifier', professeur: (userType === 'prof'), actionSubmit: isNew ? 'Ajouter' : 'Sauvegarder', matieres: matieres,
        types: types, rendu: renduInfos});
}

// export de notre application vers le serveur principal
module.exports = loadPopup;