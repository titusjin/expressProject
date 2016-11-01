/*
 Produce 空屋 RSS feeds form 環保署 opendata
 return RSS 2.0 standard feed
 */

'use strict';

const appRoot = require('app-root-path');
const api = require(appRoot + '/utils/api')('/aqxfeeds');  // use Kaede's code
const await   = require('asyncawait/await');
const express = require('express');
const feedGenerator = require(appRoot + '/opendata/aqx');
const xj = require('xml2js').parseString;
const moment = require('moment');
const XML = require('xml');

const configPrefix = process.env.NODE_ENV === 'development' ? (process.env.NODE_DEV === 'local' ? 'loc_' : 'dev_') : '';
const Config      = require(appRoot + '/config/' + configPrefix + 'config');
const AQX_API_HOST = Config.openapi.aqx_api_host;

api.get('/getFeed', function(req, res){
    feedGenerator
        .getAqxRowData(AQX_API_HOST)
        .then(
            function(data){
                var nextPromise;

                try{
                    nextPromise = feedGenerator.makeRSSFeed(data);
                }catch(e){
                    console.error(e);
                    res.json(null);
                }
                return nextPromise;
            },
            function(data){
                console.log('No data');
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
