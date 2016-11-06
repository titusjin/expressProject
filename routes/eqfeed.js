/*
 Produce earthquake RSS feeds form CWBE opendata
 if we have new data input will return RSS 2.0 standard feed
 if no update or no data will return null
 */

'use strict';

const appRoot = require('app-root-path');
const api = require(appRoot + '/utils/api')('/eqfeeds');  // use Kaede's code
const await   = require('asyncawait/await');
const express = require('express');
const eqgenerator = require(appRoot + '/opendata/earthquake');
const xj = require('xml2js').parseString;
const moment = require('moment');
const XML = require('xml');

const configPrefix = process.env.NODE_ENV === 'development' ? (process.env.NODE_DEV === 'local' ? 'loc_' : 'dev_') : '';
const Config      = require(appRoot + '/config/' + configPrefix + 'config');
const EQ_API_HOST = Config.openapi.eq_api_host;


api.get('/getFeedAsync', function(req, res){
  var data = await(eqgenerator.getEqRowData(EQ_API_HOST));
  try{
    xj(data,{ trim: true }, function(err, result){
        try{
            var opendata = JSON.parse(JSON.stringify(result)).cwbopendata;
            const issueTimeStr = opendata.dataset[0].datasetInfo[0].issueTime[0];

            // only within 5mins 1 sec issued data would be parsed into our feed. (for testing : adding "!" judgement, pls remove on prod env.)
            if(!(moment().valueOf() - moment(issueTimeStr).valueOf()) <= 360000 ){
                var rssFeed = await(eqgenerator.makeRSSFeed(opendata));

                res.set('Content-Type', 'text/xml');
                res.send(rssFeed);
            }else{
                res.json(null);
            }
        }catch(e){
            console.error(e);
            res.json(null);
        }
    });
  }catch(error){
    console.error(error);
    res.json(null);
  }
});

// Below method is too redundent just a learning path from promise to async/await
api.get('/getFeed', function(req, res){
    eqgenerator
        .getEqRowData(EQ_API_HOST)
        .then(
            function(data){
                var nextPromise;

                xj(data,{ trim: true }, function(err, result){
                    try{
                        var opendata = JSON.parse(JSON.stringify(result)).cwbopendata;
                        const issueTimeStr = opendata.dataset[0].datasetInfo[0].issueTime[0];

                        // only within 5mins 1 sec issued data would be parsed into our feed. (for testing : adding "!" judgement, pls remove on prod env.)
                        if(!(moment().valueOf() - moment(issueTimeStr).valueOf()) <= 360000 ){
                            nextPromise = eqgenerator.makeRSSFeed(opendata);
                        }else{
                            res.json(null);
                        }
                    }catch(e){
                        console.error(e);
                        res.json(null);
                    }
                });
                return nextPromise;
            },
            function(data){
                console.log('No data');
                res.json(null);
            }
        )
        .then(
            function(result){
                res.set('Content-Type', 'text/xml');
                res.send(result);
            }
        );
});

module.exports = api;
