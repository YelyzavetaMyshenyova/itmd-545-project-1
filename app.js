"use strict";

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const io = require("socket.io")();
const fs = require("fs");
const diff = require("diff");
const {EventEmitter} = require('events');
const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

const indexRouter = require("./routes/index");
const app = express();

var old_file = fs.readFileSync('./var/file.txt', {encoding:"utf8"});
var fileEvent = new EventEmitter();

//Diff testing locally
fs.watch('./var/file.txt', function(eventType, filename){
  fs.promises.readFile(`./var/${filename}`,{encoding:"utf8"})
  .then(function(data) {
    var new_file = data;
    if (new_file !== old_file)
    {
      console.log(`The content of ${filename} has changed. It was a ${eventType} event.`);
      var file_changes = diff.diffLines(old_file, new_file);
      var new_changes = file_changes.map((change, i) => {
        if (change.added){
          return `<li class="ins">${change.value}</li>`;
        }
        if (change.removed){
          return `<li class="del">${change.value}</li>`;
        }
      });
      fileEvent.emit('changed file', new_changes.join('\n'));
    }
    old_file = new_file
  });
});

//a function that handles axios request for weather data
function requestData() {
  //requesting html from the webpage
  axios.get('https://www.weather.gov/ilx/maxtemp')
    .then((res) => {
      if (res.status === 200){
        const html = res.data;
        //load html into cheerio
        const $ = cheerio.load(html);
        //loading weather infomation
        const weatherInfo = $('pre');
        const output = weatherInfo.html();
        //console.log(output);
        fs.writeFile('./var/file.txt', output, error => {
          //In case of error throw err exception
          if (error) throw err;
        });
      }
    })
    .catch((error) => {
      console.log('Fail to fetch', error);
    })
}

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// send a message on successful socket connection
io.on('connection', function(socket){
  socket.emit('message', 'Successfully connected.');
  //test if client receives data
  socket.on('message received', function(data){
    console.log('Client is saying:' + data)
  })
  //when `changed file` event fires, send changes to browser
  fileEvent.on('changed file', function(data){
    socket.emit('diffed changes', data);
  });

  //request weather data initially
  requestData();

  //rRequest weather data every 10 minutes
  var scheduleTask = schedule.scheduleJob('*/10 * * * *', function(){
    requestData();
  });
});




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, io };
