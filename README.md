# Makeshift Node Iot Backend

This nodejs express app provides a simple yet powerful way to create a Iot Input&Output backend in minutes.

You only need to configure the default configuration for your project (in an intuitive yaml file) and it will automatically create a simple HTTP-Server with all nessesary endpoints and on top a WebSocket, which will receive changes on the configuration in a blink of an eye! 

## Getting started

```
npm install

npm start
```

## Configuration

Your project can be defined in a ```/config.yml```. You can modify the /sample.config.yml or use it as reference.
This will be the default configuration of your project. With POST Endpoints these configurations can be changed by your devices.

```yaml
# simple on / off logic
# controllable via endpoint: HTTP GET & POST /lamp1, resp. /lamp2
lamp1: true
lamp2: true

# nested objects
# controllable via endpoint: HTTP GET & POST /livingroom/lamp, resp. /kitchen/lamp
livingroom:
  lamp:
    brightness: 0.5
    power: true
  window: false
kitchen:
  lamp: false
  window: false

# you also can utilize datatypes
# controllable via endpoint: HTTP GET & POST /volume, etc..
volume: 0.1
brightness: 100
status: "online"
```

You'll also find a ```.env.sample``` which (after you renamed it to ```.env```) basicly allows you to change the ports of your project and define other sensitive configurations.

## Usecases

### Raspberry Pi (a.k.a Homeserver Variant)

* [Install NodeJS on a RaspberryPi](https://www.w3schools.com/nodejs/nodejs_raspberrypi.asp)
* Install this Repository 
* Run the app
* Connect devices within your local network / wifi (ws://mySuperRaspberryIP:3000 or http://mySuperRaspberryIP:8080)

### Hosting it (a.k.a having it "in the Cloud")
* Might need to fork it and make your changes for configuraitons
* You can use services like [Heroku](https://www.heroku.com/) to host this app. (Free-Tier should be sufficient enough)
* Connect devices via the internet with http://myiotbackend.herokuapp.com

## Progress

- [x] configuration via yaml
- [x] build & retrieve current configuration via HTTP GET requests
- [x] create WebSocket, list connected devices, send current configration to connected devices
- [x] change current configuration via HTTP POST & PATCH requests
- [x] notify connected devices via WebSocket on changes
- [x] simple access-key-based authentification
- [x] persistent changed configuration (save current configuration to file system)

