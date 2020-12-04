/*
  Makeshift Input/Output Iot Backend
*/
const express = require('express');
const bodyParser = require('body-parser');
const yaml = require('js-yaml');
const fs   = require('fs');
const WebSocket = require('ws');
const chalk = require('chalk');


var devices = []; // list of connected iot devices

var config = []; // current configuration


/*
  get configs
*/

// secret / server config
require('dotenv').config();

// project config
var defaultConfig = null;
try {
  if (fs.existsSync('./config.yml')) {
    defaultConfig = yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'));
  } else {
    defaultConfig = yaml.safeLoad(fs.readFileSync('./sample.config.yml', 'utf8'));
  }
} catch (e) {
  console.log('failed loading config.yml',e);
}

// set the current config
config = defaultConfig;

/*
  Create the HTTP Server
*/

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

/*
  Return the current project configuration
*/
app.get('/', (req, res) => {
  res.json(config);
});

/*
  Build all the dynamic pathes
*/

nestedLoopEndpoints(config,app);

function nestedLoopEndpoints(obj, app) {
    const res = {};
    function recurse(obj, current, path, app) {
        for (const key in obj) {
            let value = obj[key];
            if(value != undefined) {
                if (value && typeof value === 'object') {

                  console.log(('Created')+' '+chalk.bold.bgGreen("GET")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                  app.get(path+'/'+key, (req, res) => {
                    res.json(value);
                  });

                  recurse(value, key, path+'/'+key, app);
                } else {

                    console.log(('Created')+' '+chalk.bold.bgGreen("GET")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                    app.get(path+'/'+key, (req, res) => {
                      res.json(value);
                    });

                  	// Do your stuff here to var value
                    res[key] = value;
                }
            }
        }
    }
    recurse(obj, null, '', app);
    return res;
}

app.listen(8080, () => {
  console.log('Backend API listening on port 8080.');
});


/*
  WebSocket
  On Connection
*/
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
  console.log("New Iot Device Connection");
  // push to known devices
  devices.push(ws);

  // send current config
  ws.send(JSON.stringify(config));

  /* receive data */
  ws.on('message', (datastring) => {
    let data = JSON.parse(datastring);
  });

});

console.log('Backend Websocket listening on port 3000.');
