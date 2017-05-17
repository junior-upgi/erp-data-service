import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import exphbs from 'express-handlebars';
import jwt from 'jsonwebtoken';
import mssql from 'mssql';
import path from 'path';
// import request from 'request-promise';

import tokenValidate from './middleware/tokenValidate.js';

dotenv.config(); // loads .env file from root of project
const systemReference = 'erpDataService';
const baseUrl = 'http://localhost';
const mssql_config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: '192.168.168.5',
    database: 'DB_U105'
};

const app = express(); // init express.js framework
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // use json body parser middleware
const main = express.Router();  // initiate express router
app.use(`/${systemReference}`, main); // adds 'erpDataService' to all routes
main.use(cors());   // allowing cross origin request

// static file route
// main.use('/', express.static(path.join(__dirname, '/../public')));

// console.log(process.env.MSSQL_ACCOUNT);
// console.log(process.env.MSSQL_PASSWORD);

// Handlebars templating engine and set up test route
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, '/../public/layouts'),
    partialsDir: path.join(__dirname, '/../public/partials')
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, '/../public'));
app.set('layouts', path.join(__dirname, '/../public/layouts'));
app.set('partials', path.join(__dirname, '/../public/partials'));
main.get('/serviceStatus', (request, response) => {
    return response.status(200)
        .render('serviceStatus', { // render 'serviceStatus.hbs' view
            title: 'erpDataService' // test passing data to rendered template
        });
});

// default routing error handlers
if (app.get(process.env.ENV) === 'development') {
    app.use((error, request, response, next) => {
        console.log('default routing error handler middleware triggered');
        response.status(error.status || 500);
        response.json({
            message: error.message,
            error: error
        });
    });
}
if (app.get(process.env.ENV) === 'production') {
    app.use((error, request, response, next) => {
        console.log('default routing error handler middleware triggered');
        response.status(error.status || 500);
        response.json({
            message: error.message,
            error: {}
        });
    });
}

// route to verify and issue jwt
main.post('/getToken', (request, response) => {
    let loginId = request.body.loginId;
    let password = request.body.password;
    if (
        (loginId === process.env.AUTHORIZED_USER) &&
        (password === process.env.AUTHORIZED_PASSWORD)
    ) {
        let payload = { loginId: loginId };
        return response.status(200).json({
            success: true,
            token: jwt.sign(payload, process.env.PASS_PHRASE, { expiresIn: '24h' }),
            message: 'valid web-token is supplied for 24 hours'
        });
    } else {
        return response.status(401).json({
            success: false,
            token: null,
            message: '401 Forbidden'
        });
    }
});

// route to get SUNLIKE DB_U105.dbo.CUST data
main.get('/CUST', tokenValidate, (request, response) => {
    const queryString = 'SELECT CUS_NO, SNM, SAL FROM DB_U105.dbo.CUST WHERE SAL IN (SELECT SAL_NO AS SAL FROM overdueMonitor.dbo.activeSalesStaff);';
    mssql.connect(mssql_config).then(() => {
        const request = new mssql.Request();
        return request.query(queryString);
    }).then((result) => {
        mssql.close();
        return response.status(200).json({
            success: true,
            data: result.recordset,
            message: null
        });
    }).catch((error) => {
        mssql.close();
        return response.status(500).json({
            success: false,
            data: null,
            message: `unable to supply customer data: ${error}`
        });
    });
});

// route to get SUNLIKE DB_U105.dbo.SALM data
main.get('/SALM/:SAL_NO', tokenValidate, (request, response) => {
    const queryString = `SELECT a.SAL_NO, a.NAME, b.DEP, b.NAME AS DEP_NAME FROM DB_U105.dbo.SALM a LEFT JOIN DB_U105.dbo.DEPT b ON a.DEP=b.DEP WHERE a.SAL_NO = '${request.params.SAL_NO}';`;
    mssql.connect(mssql_config).then(() => {
        const request = new mssql.Request();
        return request.query(queryString);
    }).then((result) => {
        mssql.close();
        return response.status(200).json({
            success: true,
            data: result.recordset[0],
            message: null
        });
    }).catch((error) => {
        mssql.close();
        return response.status(500).json({
            success: false,
            data: null,
            message: `unable to supply customer data: ${error}`
        });
    });
});

app.listen(process.env.PORT, (error) => {
    if (error) {
        console.log(`${systemReference}啟動程序發生異常: ${error}`);
    } else {
        console.log(`${systemReference}系統正確啟動 (${baseUrl}:${process.env.PORT})...`);
    }
});
