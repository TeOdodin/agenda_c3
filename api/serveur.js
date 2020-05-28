'use strict';

const express = require('express');
const alasql = require('alasql');
const crypto = require('crypto');
const app = express();
const api = require('./api_core/api');

alasql('CREATE FILESTORAGE DATABASE IF NOT EXISTS dbn("./api/api_core/data/dbn.json");');
alasql("ATTACH FILESTORAGE DATABASE dbn('./api/api_core/data/dbn.json');");
alasql('USE dbn;');
alasql('SOURCE "./api/api_core/data/db_structure.sql";');

app.use(express.static('application'));
app.use('/api/', api);
app.use('/login', (req, res) => {
    let res_object = {success: false, data: ''};
    if (req.query.id && req.query.pwd) {
        console.log(alasql('DELETE FROM CO_TOKEN WHERE DATEDIFF(minute, start_date, NOW()) > 60;'));
        req.query.id = req.query.id.toUpperCase();
        console.log('Connexion request for id : ' + req.query.id);
        let res_sql = alasql(`SELECT 'etu' AS type, id_etudiant AS id, mdp FROM ETUDIANT WHERE id_etudiant = '${req.query.id}' UNION ALL SELECT 'prof' AS type, id_prof AS id, mdp FROM PROFESSEUR WHERE id_prof = '${req.query.id}'`);
        if (res_sql.length > 1) {
            console.error(`Multiple users with the same id : ${JSON.stringify(res_sql)}`);
            res_object.data = 'Sorry there was an error, multiple users have the same id.';
        }
        else if (res_sql.length === 0) {
            res_object.data = 'No user found with this id.';
        }
        else if (res_sql.length === 1) {
            if (req.query.pwd === res_sql[0].mdp) {
                const hash = crypto.createHmac('md5', 'projweb2020co3c')
                    .update(`${req.query.id}${new Date().toString()}`)
                    .digest('hex');
                alasql(`INSERT INTO CO_TOKEN VALUES ('${hash}','${req.query.id}','${res_sql[0].type}','${new Date().toString()}')`);
                res_object.success = true;
                res_object.data = hash;
            }
            else {
                res_object.data = 'The password was wrong.';
            }
        }
    }
    res.status(res_object.success ? 200 : 401).json(res_object);
});
app.use('/logout', (req, res) => {
    if (req.query.token) {
        console.log(alasql(`DELETE FROM CO_TOKEN WHERE token = '${req.query.token}';`));
    }
    res.status(200).json('success');
});
app.use((req, res) => {
    res.status(404).json(`Route "${req.url}" not found or missing resource.....\n`);
});
app.listen(8080);