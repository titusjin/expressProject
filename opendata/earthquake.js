/*
新聞資訊源推播
採用"小區域有感地震報告": http://opendata.cwb.gov.tw/govdownload?dataid=E-A0016-001R&authorizationkey=rdec-key-123-45678-011121314
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

var Logger = Helper.logger('earthQuake_RSS_Feed');

var earthquakeFeedGenerator = (function(){
    var result = {};

    result.wgetData = function(uri){
        return new Promise((resolve, reject) => {
            wget({
                    url: uri,
                    timeout: 2000       // duration to wait for request fulfillment in milliseconds, default is 2 seconds
                },function (error, response, body) {
                    if (error) {
                        Logger.error(error);        // error encountered
                    } else {
                        resolve(body);
                    }
                }
            );
        });
    };

    result.getEqRowData = function(uri){
        return new Promise((resolve, reject) => {
            // change to use wget instead of http request accoding to open-api change
            // this.wgetData(uri)
            //         .then(function(data){
            //             resolve(data);
            //         });
            wget({
                    url: uri,
                    timeout: 2000       // duration to wait for request fulfillment in milliseconds, default is 2 seconds
                },function (error, response, body) {
                    if (error) {
                        Logger.error(error);        // error encountered
                    } else {
                        resolve(body);
                    }
                }
            );



            // const options = {
            //     uri : uri,
            //     method : 'GET',
            //     headers: {
            //         'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            //         'Expires': '-1',
            //         'Pragma': 'no-cache'
            //     },
            //     format: 'json',
            //     resolveWithFullResponse : true
            // };

            // rp(options).then(function(response){
            //     const stCode = response.statusCode;

            //     console.log(stCode);

            //     if(!(/^2/.test('' + stCode))){
            //         console.error('statusCode :' + stCode + '. api call error : ' + response.error);
            //         reject(null);
            //     }else{
            //         resolve(response.body);
            //     }
            // });
        });
    }

    result.makeRSSFeed = (opendata) => {
        var dataSet = opendata.dataset[0];

        return new Promise(function(resolve, reject){
            try{
                var xml = [
                    {rss: [
                            {_attr: {
                                    "version": "2.0"
                                }
                            },
                            {channel :[
                                {title : dataSet.datasetInfo[0].datasetDescription[0].replace(/(\{|\}|(\r?\n))/g, '')},
                                {item : [
                                            {title :dataSet.earthquake[0].reportType[0].replace(/(\{|\}|(\r?\n))/g, '')},
                                            {link  : dataSet.earthquake[0].web[0]},
                                            {guid  : [{
                                                        _attr : {
                                                            "isPermaLink" : "false"
                                                       }},
                                                       opendata.identifier[0]
                                                     ]
                                            },
                                            {description : dataSet.datasetInfo[0].datasetDescription[0].replace(/(\{|\}|(\r?\n))/g, '')
                                            },
                                            {pubDate : moment(dataSet.datasetInfo[0].issueTime[0]).format('YYYY/MM/DD hh:mm')
                                            },
                                            {"content" :
                                                {_cdata: "<img class=\"editorial\" src=\"" + dataSet.earthquake[0].reportImageURI[0] + "\" width=\"600\" height=\"400\" align=\"middle\">" + dataSet.earthquake[0].reportContent[0].replace(/<img/,"<img class=\"editorial\" style=\"max-width:600px\" align=\"middle\"").replace(/\r?\n/g, "").replace(/<(a|\/a)("[^"]*"|'[^']*'|[^'">]|)*>/g, "").replace(/<iframe/g, "<iframe style=\"max-width:600px\"") + "</p>"
                                                }
                                            },
                                            {"image" : dataSet.earthquake[0].reportImageURI[0]
                                            }
                                        ]
                                }]
                            }
                        ]
                    },
                ];

                resolve(XML(xml,{declaration: { standalone: 'yes', encoding: 'UTF-8'}}));

            }catch(e){
                console.log('makeRSSFeed fail : ' + e);
                reject(null);
            }
        });
    }

    return result;
})();

module.exports = earthquakeFeedGenerator;

// The whole process like below, should put those process into route:
// getEqRowData(EQ_API_HOST)
// .then(function(data){
//     var nextPromise;

//     xj(data,{ trim: true }, function(err, result){
//         try{
//             var opendata = JSON.parse(JSON.stringify(result)).cwbopendata;
//             const issueTimeStr = opendata.dataset[0].datasetInfo[0].issueTime[0];

//             // only within 5mins 1 sec issued data would be parsed into our feed. (for testing : adding "!" judgement, pls remove on prod env.)
//             if(!(moment().valueOf() - moment(issueTimeStr).valueOf()) <= 360000 ){
//                 nextPromise = makeRSSFeed(opendata);
//             }else{
//                 console.log('No update.');
//                 process.exit(0);
//             }
//         }catch(e){
//             console.error(e);
//             process.exit(0);
//         }
//     });
//     return nextPromise;

// }, function(data){
//     console.log('No data');
//     process.exit(0);
// })
// .then(function(result){
//     console.log(result);
//     return result;
// })
// .catch(function(err){
//     console.log(err);
//     return null;
// });
