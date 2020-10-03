'use strict';

const express = require('express');
const fs = require('fs');
const router = express.Router();

router.post('/', function(req, res, next) {
  var data = JSON.stringify(req.body) + '\n'; // newline to create NDJSON
  // console.log(data);
  fs.promises.appendFile('var/subscription.json', data, {encoding:'utf8'})
  .then(function(result) {
    res.json({status: 'subscribed'});
  })
  .catch(function(error) {
    res.status(500).json({'error': error});
  });
});

router.get('/public-key/', function(req, res, next) {
  res.json({vapid_public_key: 'BNgI02ayhUa95ZmCC5Wk3wqH8wrFXWdJUu57qRvcjB9eicn2rwlmaegJtk3O7X5uP_lS9OZhNtEQ'});
});

module.exports = router
