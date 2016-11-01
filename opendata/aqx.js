/*
採用行政遠環境保護署 openadata api
製作成為標準RSS2.0 新聞RSS Feed
 */

'use strict';

const appRoot = require('app-root-path');
const Fs = require('fs');
const FTP = require('ftp');
const XML = require('xml');
const Helper = require(appRoot + '/lib/helper_lib');
const _ = require('lodash');

const Promise = require('promise');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const rp = require('request-promise');
const moment = require('moment');
const wget = require('node-wget');

const configPrefix = process.env.NODE_ENV === 'development' ? (process.env.NODE_DEV === 'local' ? 'loc_' : 'dev_') : '';
const Config = require(appRoot + '/config/' + configPrefix + 'config');

var Logger = Helper.logger('aqx_RSS_Feed');

var aqxFeedGenerator = (function(){
    var result = {};

    result.getAqxRowData = function(uri){
        return new Promise((resolve, reject) => {
            // change to use wget instead of http request accoding to open-api change
            wget({
                    url: uri,
                    timeout: 2000       // duration to wait for request fulfillment in milliseconds, default is 2 seconds
                },function (error, response, body) {
                    if (error) {
                        Logger.error(error);        // error encountered
                        reject(null);
                    } else {
                        resolve(JSON.parse(body));
                    }
                }
            );
        });
    }

    result.makeRSSFeed = (jsonArray) => {
        for(var data of jsonArray){
            console.log(data.County);
        }

        var webhost = Config.openapi.aqx_api_host;
        var re = /^(.*:)\/\/([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$/;
        var regSplit = webhost.match(re);

        return new Promise(function(resolve, reject){
            try{
                var xml = [
                    {rss: [
                            {_attr: {
                                    "version": "2.0",
                                    "xmlns:dc": "http://purl.org/dc/elements/1.1/"
                                }
                            },
                            {channel :[
                                    {title : "空污資料"},
                                    {description : "AQX rss feed"},
                                    {link : {_cdata: regSplit[1] + "//" + regSplit[2] }},
                                    {pubDate :
                                        moment(jsonArray[0].PublishTime).format('ddd, DD MMM YYYY HH:mm:ss ZZ')
                                    }
                                ]
                            }
                        ]
                    },
                ];

                for(var data of jsonArray){

                    var item = {
                        item : [
                                {title : data.County + data.SiteName},
                                {description : {_cdata: "<p>" + data.Status + " 主要污染物："+ data.MajorPollutant +"</p>"} },
                                {"dc:creator" : "行政院環境保護署"}
                            ]
                    };
                    xml[0].rss[1].channel.push(item);
                }

                resolve(XML(xml,{declaration: { standalone: 'yes', encoding: 'UTF-8'}}));
            }catch(e){
                console.log('makeRSSFeed fail : ' + e);
                reject(null);
            }
        });
    }

    return result;
})();

module.exports = aqxFeedGenerator;
