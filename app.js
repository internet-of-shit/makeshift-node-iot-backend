/*
  Makeshift Input/Output Iot Backend
*/
const express = require('express');
const yaml = require('js-yaml');
const fs   = require('fs');
const WebSocket = require('ws');
const chalk = require('chalk');
const _set = require('lodash.set');
const _get = require('lodash.get');

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

  let configfile = (process.env.CONFIG ? './'+process.env.CONFIG : './config.yml');

  if (fs.existsSync(configfile)) {
    defaultConfig = yaml.safeLoad(fs.readFileSync(configfile, 'utf8'));
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

                  /*
                    is object data
                  */
                  app.get(path+'/'+key, (req, res) => {
                    let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                    let data = _get(config,opath);
                    return res.json(data);
                  });
                  console.log(('Created')+' '+chalk.bold.bgGreen(" GET    ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));

                  app.post(path+'/'+key, (req, res) => {
                    let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                    let oldData = _get(config,opath);
                    let newData = req.body;

                    let aKeys = Object.keys(oldData).sort();
                    let bKeys = Object.keys(newData).sort();
                    if( JSON.stringify(aKeys) !== JSON.stringify(bKeys))  return res.status(400).json({message: 'object properties are not equal.'});
                    // todo: Typecheck?!

                    _set(config,opath,newData);
                    let settetData = _get(config,opath);
                    sendUpdateToDevices();

                    return res.json(newData);
                  });
                  console.log(('Created')+' '+chalk.bold.bgCyan(" POST   ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                  app.put(path+'/'+key, (req, res) => {
                    let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                    let oldData = _get(config,opath);
                    let newData = req.body;

                    let aKeys = Object.keys(oldData).sort();
                    let bKeys = Object.keys(newData).sort();
                    if( JSON.stringify(aKeys) !== JSON.stringify(bKeys))  return res.status(400).json({message: 'object properties are not equal.'});
                    // todo: Typecheck?!

                    _set(config,opath,newData);
                    let settetData = _get(config,opath);
                    sendUpdateToDevices();

                    return res.json(newData);
                  });
                  console.log(('Created')+' '+chalk.bold.bgBlue(" PUT    ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                  app.patch(path+'/'+key, (req, res) => {
                    let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                    let oldData = _get(config,opath);
                    let newData = req.body;

                    let manipulatedData = oldData;
                    Object.keys(newData).forEach(k => {
                      if(typeof oldData[k] === "undefined") return res.status(400).json({message: 'property '+k+' not found on defaultConfig.'});
                      manipulatedData[k] = newData[k];
                    });

                    _set(config,opath,manipulatedData);
                    let settetData = _get(config,opath);
                    sendUpdateToDevices();

                    return res.json(manipulatedData);
                  });
                  console.log(('Created')+' '+chalk.bold.bgYellow(" PATCH  ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                  app.delete(path+'/'+key, (req, res) => {
                    let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                    let oldData = _get(config,opath);
                    let newData = _get(defaultConfig,opath);

                    _set(config,opath,newData);
                    let settetData = _get(config,opath);
                    sendUpdateToDevices();

                    return res.json(newData);
                  });
                  console.log(('Created')+' '+chalk.bold.bgRed(" DELETE ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));

                  recurse(value, key, path+'/'+key, app);
                } else {

                    /*
                      simple flat data
                    */
                    app.get(path+'/'+key, (req, res) => {
                      let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                      let data = _get(config,opath);
                      return res.json(data);
                    });
                    console.log(('Created')+' '+chalk.bold.bgGreen(" GET    ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));

                    app.post(path+'/'+key, (req, res) => {
                      let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                      let oldData = _get(config,opath);
                      let newData = req.body[key];

                      if(typeof newData === "undefined") return res.status(400).json({message: 'sent data (POST param: '+key+') to update data.'});
                      if(typeof newData !== typeof oldData) return res.status(400).json({message: 'new data is not the same datatype as old data.'});

                      _set(config,opath,newData);
                      let settetData = _get(config,opath);
                      sendUpdateToDevices();

                      return res.json(newData);
                    });
                    console.log(('Created')+' '+chalk.bold.bgCyan(" POST   ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                    app.put(path+'/'+key, (req, res) => {
                      let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                      let oldData = _get(config,opath);
                      let newData = req.body[key];

                      if(typeof newData === "undefined") return res.status(400).json({message: 'sent data (PUT param: '+key+') to update data.'});
                      if(typeof newData !== typeof oldData) return res.status(400).json({message: 'new data is not the same datatype as old data.'});

                      _set(config,opath,newData);
                      let settetData = _get(config,opath);
                      sendUpdateToDevices();

                      return res.json(newData);
                    });
                    console.log(('Created')+' '+chalk.bold.bgBlue(" PUT    ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                    app.patch(path+'/'+key, (req, res) => {
                      let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                      let oldData = _get(config,opath);
                      let newData = req.body[key];

                      if(typeof newData === "undefined") return res.status(400).json({message: 'sent data (PATCH param: '+key+') to update data.'});
                      if(typeof newData !== typeof oldData) return res.status(400).json({message: 'new data is not the same datatype as old data.'});

                      _set(config,opath,newData);
                      let settetData = _get(config,opath);
                      sendUpdateToDevices();

                      return res.json(newData);
                    });
                    console.log(('Created')+' '+chalk.bold.bgYellow(" PATCH  ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                    app.delete(path+'/'+key, (req, res) => {
                      let opath = (path+'/'+key).replace(/\//g,'.').substring(1);
                      let oldData = _get(config,opath);
                      let newData = _get(defaultConfig,opath);

                      _set(config,opath,newData);
                      let settetData = _get(config,opath);
                      sendUpdateToDevices();

                      return res.json(newData);
                    });
                    console.log(('Created')+' '+chalk.bold.bgRed(" DELETE ")+' '+chalk.bold(path+'/'+key)+' - expect:'+(typeof value));
                    console.log('---');

                }
            }
        }
    }
    recurse(obj, null, '', app);
    return res;
}

let httpPort = (process.env.PORT ? process.env.PORT : 8080);
app.listen(httpPort, () => {
  console.log('Backend API listening on port '+httpPort+'.');
});


/*
  WebSocket
  On Connection
*/
let wsPort = (process.env.WSPORT ? process.env.WSPORT : 3000);
const wss = new WebSocket.Server({ port: wsPort });

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

function sendUpdateToDevices(){
  console.log('Sending update to devices...');
  if(devices.length){
    devices.forEach(function(d) {
      d.send(JSON.stringify(config));
    });
    console.log(chalk.green('Done!'));
  } else {
    console.log('No devices connected trough WebSocket.');
  }
}

console.log('Backend Websocket listening on port '+wsPort+'.');
