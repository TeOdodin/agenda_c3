'use strict';

// import du module Express
const express = require('express');
const alasql = require('alasql');
const agenda = require('../agenda');
const list = require('../list');
const notifs = require('../notifs');
const popupRendu = require('../popupRendu');
const app = express();

alasql('CREATE FILESTORAGE DATABASE IF NOT EXISTS dbn("./api/api_core/data/dbn.json");');
alasql("ATTACH FILESTORAGE DATABASE dbn('./api/api_core/data/dbn.json');");
alasql('USE dbn;');
alasql('SOURCE "./api/api_core/data/db_structure.sql";');

app.all('/*', (req, res, next) => {
    const isConnected = testToken(decodeURIComponent(req.query.token));
    if (!isConnected.ok && req.query.token) {
        res.status(401).json({data: 'The connection has expired.'});
    }
    else {
        next();
    }
});
app.get('/compte', (req, res) => {
    console.log('compte');
    const isConnected = testToken(decodeURIComponent(req.query.token));
    res.status(200).json(alasql(`SELECT '${isConnected.id_user}' AS id, '${isConnected.type}' AS type, nom, prenom${isConnected.type === 'prof' ? ', mail' : ''}
                                FROM ${isConnected.type === 'prof' ? 'PROFESSEUR' : 'ETUDIANT'}
                                WHERE ${isConnected.type === 'prof' ? 'id_prof' : 'id_etudiant'} = '${isConnected.id_user}';`));
});
app.get('/rendus/popup', (req, res) => {
    console.log('rendus/popup');
    const isConnected = testToken(decodeURIComponent(req.query.token));
    if (req.query.new) {
        res.writeHead(200, {'Content-type': 'text/html'});
        res.write(popupRendu(true, isConnected.type, alasql('SELECT * FROM MATIERE JOIN PROMOTION ON MATIERE.id_promo = PROMOTION.id_promo;')));
        res.end();
    }
    else {
        res.writeHead(200, {'Content-type': 'text/html'});
        res.write(popupRendu(false, isConnected.type, alasql('SELECT * FROM MATIERE JOIN PROMOTION ON MATIERE.id_promo = PROMOTION.id_promo;'), alasql(`SELECT * FROM TRAVAIL WHERE id_travail = ${req.query.idRendu};`)[0]));
        res.end();
    }
});
app.get('/rendus/:annee/:groupe/:semaine', (req, res) => {
    console.log('rendus/annee/grp/semaine');
    const isConnected = testToken(decodeURIComponent(req.query.token));
    res.writeHead(200, {'Content-type': 'text/html'});
    let res_sql = null;
    if (isConnected.ok) {
        if (isConnected.type === 'etu') {
            if (req.params.annee < 0 || req.params.groupe < 0) {
                let getUserInfos = alasql(`SELECT annee, ETUDIANT.id_groupe FROM ETUDIANT JOIN GROUPE ON ETUDIANT.id_groupe = GROUPE.id_groupe JOIN PROMOTION ON GROUPE.id_promo = PROMOTION.id_promo WHERE ETUDIANT.id_etudiant = '${isConnected.id_user}';`)[0];
                req.params.annee = getUserInfos.annee;
                req.params.groupe = getUserInfos.id_groupe;
            }
            res_sql = alasql(`SELECT TRAVAIL.id_travail, MATIERE.id_matiere, nom_matiere, type_travail, date_travail AS full_date, TIME(date_travail) AS heure, 
                        SIMPLE_DATE(date_travail) AS date, DAY_OF_WEEK(date_travail) AS day_of_week, description_travail, personnel, 
                        annee, lien_rendu, PROMOTION.id_promo, PROMOTION.specialite, GROUPE.id_groupe, nom_groupe, mail, PROFESSEUR.nom AS nom_prof, 
                        PROFESSEUR.prenom AS prenom_prof, TRAVAIL.id_prof AS travail_prof, fait, '${isConnected.type}' AS type 
                        FROM TRAVAIL, MATIERE, PROMOTION, GROUPE LEFT JOIN PROFESSEUR ON TRAVAIL.id_prof = PROFESSEUR.id_prof
                        LEFT JOIN ETUDIANT ON TRAVAIL.id_etudiant = ETUDIANT.id_etudiant 
                        LEFT JOIN RENDU ON TRAVAIL.id_travail = RENDU.id_travail AND (NOT ETUDIANT.id_etudiant OR RENDU.id_etudiant = ETUDIANT.id_etudiant) 
                        WHERE TRAVAIL.id_matiere = MATIERE.id_matiere AND MATIERE.id_promo = PROMOTION.id_promo AND PROMOTION.id_promo = GROUPE.id_promo AND 
                        (NOT ETUDIANT.id_etudiant OR '${isConnected.id_user}' = ETUDIANT.id_etudiant) AND 
                        GROUPE.id_groupe = ${req.params.groupe} AND (NOT RENDU.id_etudiant OR RENDU.id_etudiant = '${isConnected.id_user}') AND 
                        (NOT TRAVAIL.id_groupe OR TRAVAIL.id_groupe = ${req.params.groupe}) AND (NOT TRAVAIL.id_etudiant OR TRAVAIL.id_etudiant = '${isConnected.id_user}')
                        ${req.params.semaine !== '-1' ? ` AND YEAR(TRAVAIL.date_travail) = ${req.params.annee} AND WEEK(TRAVAIL.date_travail) = ${req.params.semaine}` : ''};`);
        }
        else if (isConnected.type === 'prof') {
            res_sql = alasql(`SELECT TRAVAIL.id_travail, MATIERE.id_matiere, nom_matiere, type_travail, date_travail AS full_date, TIME(date_travail) AS heure, 
                        SIMPLE_DATE(date_travail) AS date, DAY_OF_WEEK(date_travail) AS day_of_week, description_travail, personnel, 
                        annee, lien_rendu, PROMOTION.id_promo, PROMOTION.specialite, GROUPE.id_groupe, nom_groupe, mail, PROFESSEUR.id_prof, PROFESSEUR.nom AS nom_prof, 
                        PROFESSEUR.prenom AS prenom_prof, '${isConnected.type}' AS type, '${isConnected.id_user}' AS id_user 
                        FROM TRAVAIL, PROFESSEUR, MATIERE, PROMOTION, GROUPE 
                        WHERE TRAVAIL.id_matiere = MATIERE.id_matiere AND MATIERE.id_promo = PROMOTION.id_promo AND PROMOTION.id_promo = GROUPE.id_promo AND 
                        GROUPE.id_groupe = ${req.params.groupe} AND TRAVAIL.id_prof = PROFESSEUR.id_prof AND 
                        (NOT TRAVAIL.id_groupe OR TRAVAIL.id_groupe = ${req.params.groupe})
                        ${req.params.semaine !== '-1' ? ` AND YEAR(TRAVAIL.date_travail) = ${req.params.annee} AND WEEK(TRAVAIL.date_travail) = ${req.params.semaine}` : ''};`);
        }
    }
    else {
        res_sql = alasql(`SELECT TRAVAIL.id_travail, MATIERE.id_matiere, nom_matiere, type_travail, date_travail AS full_date, TIME(date_travail) AS heure, 
                        SIMPLE_DATE(date_travail) AS date, DAY_OF_WEEK(date_travail) AS day_of_week, description_travail, personnel, 
                        annee, lien_rendu, PROMOTION.id_promo, PROMOTION.specialite, GROUPE.id_groupe, nom_groupe, mail, PROFESSEUR.nom AS nom_prof, 
                        PROFESSEUR.prenom AS prenom_prof 
                        FROM TRAVAIL, PROFESSEUR, MATIERE, PROMOTION, GROUPE 
                        WHERE TRAVAIL.id_matiere = MATIERE.id_matiere AND MATIERE.id_promo = PROMOTION.id_promo AND PROMOTION.id_promo = GROUPE.id_promo AND 
                        GROUPE.id_groupe = ${req.params.groupe} AND TRAVAIL.id_prof = PROFESSEUR.id_prof AND 
                        (NOT TRAVAIL.id_groupe OR TRAVAIL.id_groupe = ${req.params.groupe})
                        ${req.params.semaine !== '-1' ? ` AND YEAR(TRAVAIL.date_travail) = ${req.params.annee} AND WEEK(TRAVAIL.date_travail) = ${req.params.semaine}` : ''};`);
    }
    if (req.query.view === '0')
        res.write(agenda(res_sql));
    else if (req.query.view === '1')
        res.write(list(res_sql));
    else if (req.query.view === '2')
        res.write(notifs(res_sql));
    res.end();
});
app.get('/rendus/:idRendu', (req, res) => {
    console.log('rendus/id');
    res.status(200).json(alasql(`SELECT * FROM TRAVAIL WHERE id_travail = ${req.params.idRendu}`));
});
app.get('/profs/:idProf', (req, res) => {
    console.log('profs/id');
    let sql_res = alasql(`SELECT * FROM PROFESSEUR WHERE id_prof = ${req.params.idProf}`);
    sql_res.forEach(element => {
        delete element.mdp;
    });
    res.status(200).json(sql_res);
});
app.get('/groupes', (req, res) => {
    console.log('/groupes');
    if (req.query.year) {
        res.status(200).json(alasql(`SELECT * FROM GROUPE JOIN PROMOTION ON GROUPE.id_promo = PROMOTION.id_promo WHERE annee = '${escape(req.query.year)}';`));
    }
    else {
        res.status(405).json('Missing argument.');
    }
});
app.get('/groupes/:idGroupe', (req, res) => {
    console.log('groupes/id');
    res.status(200).json(alasql(`SELECT * FROM GROUPE WHERE id_groupe = ${req.params.idGroupe}`));
});
app.get('/promos', (req, res) => {
    console.log('promos');
    res.status(200).json(alasql(`SELECT DISTINCT(annee) AS annee FROM PROMOTION`));
});
app.get('/promos/:idPromo', (req, res) => {
    console.log('promos/*');
    res.status(200).json(alasql(`SELECT * FROM PROMOTION WHERE id_promo = ${req.params.idPromo}`));
});

app.post('/rendus', (req, res) => {
    const isConnected = testToken(decodeURIComponent(req.query.token));
    if (isConnected.ok) {
        if (req.query.id_matiere && req.query.date_travail && req.query.description_travail) {
            req.query.type_travail = req.query.type_travail ? pereq.query.type_travail.replace(['\'', ';'], '') : 'Personnel';
            if (req.query.type_travail === 'Personnel') req.query.personnel = '1';
            else req.query.personnel = '0';
            req.query.date_travail = req.query.date_travail.replace(['\'', ';'], '').replace(['T', 'Z'], [' ', '0000']);
            let maxId = alasql('SELECT MAX(id_travail) AS max FROM TRAVAIL')[0];
            let nbRows = alasql(`INSERT INTO TRAVAIL(id_travail, id_${isConnected.type === 'etu' ? 'etudiant' : (req.query.id_groupe === undefined ? 'prof' : 'prof, id_groupe')},
                                id_matiere, type_travail, date_travail, description_travail, ${req.query.lien_rendu !== undefined ? 'lien_rendu, ' : ''}personnel)
                                VALUES (${maxId.max + 1}, '${isConnected.id_user}', ${(isConnected.type === 'prof' && req.query.id_groupe) ? `${req.query.id_groupe}, ` : ''}
                                ${req.query.id_matiere}, '${req.query.type_travail}', '${req.query.date_travail}', '${escape(req.query.description_travail)}', 
                                ${req.query.lien_rendu ? `${escape(req.query.lien_rendu)}, ` : ''}${req.query.personnel});`);
            if (nbRows !== 0) {
                res.status(200).json(alasql(`SELECT * FROM TRAVAIL WHERE id_travail = ${maxId.max + 1}`));
            }
        }
    }
    else {
        res.status(401);
    }
});
app.post('/groupes', (req, res) => {
    const isConnected = testToken(decodeURIComponent(req.query.token));
    if (isConnected.ok && isConnected.type === 'prof') {
        if (req.query.nom_groupe && req.query.id_promo) {
            let maxId = alasql('SELECT MAX(id_groupe) AS max FROM GROUPE')[0];
            let nbRows = alasql(`INSERT INTO GROUPE VALUES (${maxId.max + 1}, ${req.query.id_promo}, '${req.query.nom_groupe}')`);
            if (nbRows !== 0) {
                res.status(200).json(alasql(`SELECT * FROM GROUPE WHERE id_groupe = ${maxId.max + 1}`));
            }
        }
    }
    else {
        res.status(401);
    }
});
app.post('/promos', (req, res) => {
    const isConnected = testToken(decodeURIComponent(req.query.token));
    if (isConnected.ok && isConnected.type === 'prof') {
        if (req.query.annee && req.query.specialite) {
            let maxId = alasql('SELECT MAX(id_promo) AS max FROM PROMOTION')[0];
            let nbRows = alasql(`INSERT INTO PROMOTION VALUES (${maxId.max + 1}, '${req.query.annee}', '${req.query.specialite}')`);
            if (nbRows !== 0) {
                res.status(200).json(alasql(`SELECT * FROM PROMOTION WHERE id_promo = ${maxId.max + 1}`));
            }
        }
    }
    else {
        res.status(401);
    }
});

app.patch('/rendu/:idRendu', (req, res) => {
    console.log('rendu/  UPDATE');
    let param = req.query;
    const connectedUser = testToken(decodeURIComponent(req.query.token));

    console.log(param);
    //Partie achèvement
    if (param.fait !== undefined) {
        let rendu = alasql(`SELECT * FROM RENDU WHERE id_travail = ${req.params.idRendu} AND id_etudiant = '${connectedUser.id_user}';`);
        console.log(rendu);
        if (rendu.length === 1) {
            console.log(`UPDATE RENDU SET fait=${param.fait} WHERE id_travail = ${req.params.idRendu} AND id_etudiant = '${connectedUser.id_user}';`);
            alasql(`UPDATE RENDU SET fait=${param.fait} WHERE id_travail = ${req.params.idRendu} AND id_etudiant = '${connectedUser.id_user}';`);
        }
        else if (rendu.length === 0) {
            alasql(`INSERT INTO RENDU VALUES ('${connectedUser.id_user}',${req.params.idRendu},${param.fait});`);
        }
        else {
            res.status(403).send();
        }
    }
    //Partie modification
    else {
        console.log('modif');
        let checkTaf = alasql(`SELECT * FROM TRAVAIL WHERE id_travail = ${req.params.idRendu};`);
        if (checkTaf.length === 1){
            if (connectedUser.type === 'prof')
                alasql(`UPDATE TRAVAIL SET type_travail='${param.type_rendu}', date_travail='${param.date_travail}', description_travail='${escape(param.description_travail)}', lien_rendu='${escape(param.lien_rendu)}', id_matiere=${param.id_matiere} WHERE id_travail=${req.params.idRendu};`);
            else
                alasql(`UPDATE TRAVAIL SET date_travail='${param.date_travail}', id_matiere=${param.id_matiere}, description_travail='${escape(param.description_travail)}' WHERE id_travail=${req.params.idRendu};`);
        }
        else {
            res.status(403).send();
        }
    }
    res.status(200).json('success');
});



//Suppression d'un rendu
app.delete('/rendus/:idRendu', (req, res) => {
    console.log('/rendus DELETE');
    const connectedUser = testToken(decodeURIComponent(req.query.token));

    if (connectedUser.ok) {
        let checkRendu = alasql(`SELECT * FROM TRAVAIL WHERE id_travail = ${req.params.idRendu} AND id_${connectedUser.type === 'etu' ? 'etudiant' : 'prof'} = '${connectedUser.id_user}';`);
        if (checkRendu.length === 1) {
            console.log(connectedUser.type === 'etu');
            console.log(connectedUser.type === 'prof');
            if ((checkRendu[0].personnel === 1 && connectedUser.type === 'etu') ||
            (connectedUser.type === 'prof')) {
                alasql(`DELETE FROM TRAVAIL WHERE id_travail = ${req.params.idRendu};`);
                alasql(`DELETE FROM RENDU WHERE id_travail = ${req.params.idRendu};`);
                res.status(200).send();
            }
            else {
                console.log('erreur dans l\'user');
                res.status(403).send();
            }
        }
        else {
            console.log('erreur dans la selection');
            res.status(403).send();
        }
    }
    else
        res.status(403).send();
});

//Suppression d'un groupe
app.delete('/groupes/:idGrp', (req, res) => {
    const connectedUser = testToken(decodeURIComponent(req.query.token));

    //On restreint la suppression aux professeurs
    if (connectedUser.ok && connectedUser.type === 'prof') {
        let checkGrp = alasql(`SELECT * FROM GROUPE WHERE id_groupe = ${req.params.idGrp};`);
        if (checkGrp.length === 1) {
            alasql(`DELETE FROM GROUPE WHERE id_groupe = ${req.params.idGrp};`);
            res.status(200).send();
        }
        else {
            res.status(403).send();
        }
    }
    else {
        res.status(403).send();
    }
});

//Suppression d'une promo
app.delete('/promos/:idPromo', (req, res) => {
    const connectedUser = testToken(decodeURIComponent(req.query.token));

    //On restreint la suppression aux professeurs
    if (connectedUser.ok && connectedUser.type === 'prof') {
        let checkProm = alasql(`SELECT * FROM PROMOTION WHERE id_promo = ${req.params.idPromo};`);

        if (checkProm.length === 1) {
            alasql(`DELETE FROM GROUPE WHERE id_promo = ${req.params.idPromo};`);
            alasql(`DELETE FROM PROMOTION WHERE id_promo = ${req.params.idPromo};`);
            res.status(200).send();
        }
        else {
            res.status(403).send();
        }
    }
    else {
        res.status(403).send();
    }
});

alasql.fn.TIME = function (dateStr) {
    var date = new Date(dateStr);
    return `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`;
};
alasql.fn.DAY_OF_WEEK = function (dateStr) {
    var date = new Date(dateStr);
    return date.getDay();
};
alasql.fn.SIMPLE_DATE = function (dateStr) {
    var date = new Date(dateStr);
    return `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}/${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}/${date.getFullYear() < 10 ? `0${date.getFullYear()}` : date.getFullYear()}`;
};
alasql.fn.WEEK = function (dateStr) {
    var date = new Date(dateStr);
    var day_of_month = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    var day_of_week = date.getDay();
    var day_of_year = day_of_month;
    var week = 0;
    for (let i = 1; i <= month; i++) {
        if (i === 2) {
            day_of_year += (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
        }
        else if (i < 8) {
            if (i % 2 === 0) {
                day_of_year += 30;
            }
            else {
                day_of_year += 31;
            }
        }
        else if (i % 2 === 0) {
            day_of_year += 31;
        }
        else {
            day_of_year += 30;
        }
    }
    week = parseInt((day_of_year - day_of_week) / 7) + 1 + (((day_of_year - day_of_week) % 7 === 0) ? 0 : 1);
    return week;
};

function testToken(token) {
    if (!token) return false;
    let res_sql = alasql(`SELECT * FROM CO_TOKEN WHERE token = '${token}' AND DATEDIFF(minute, start_date, NOW()) <= 60;`);
    if (res_sql.length === 1)
        return {ok: true, id_user: res_sql[0].id_user, type: res_sql[0].type_user};
    else
        return {ok: false, id_user: null, type: null};
}

// export de notre application vers le serveur principal
module.exports = app;
