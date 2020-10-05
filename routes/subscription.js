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
  res.json({vapid_public_key: 'BMJ9IpyHYOZIPP4fkxbmu_rd3CD95Bw_ehAJc8KSyvR04QWU78xHOw9A0e07OYwPA4bO2SjF_BT0Z1xYViLSZbI'});
});

module.exports = router
