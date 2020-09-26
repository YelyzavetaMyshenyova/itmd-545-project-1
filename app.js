"use strict";

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const io = require("socket.io")();

//Add fs module
const fs = require("fs")

const indexRouter = require("./routes/index");

const app = express();

//Diff testing locally
fs.watch('var/file.txt', function(eventType, filename){
  fs.readFile(`./var/${filename}`, function(err, data){
    console.log(`The file has this content:\n\n${data}`);
    //console.log(data); This logs the data without string format.
    //To be able to see it as a string representation, add "{encoding: "utf8"}" object before the callback function
    
  });
  console.log(`${filename} has changed. It was a ${eventType} event.`);
});

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
  //test if client receive data
  socket.on('message received', function(data){
    console.log('Client is saying:' + data)
  })
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
