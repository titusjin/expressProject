/*
新聞資訊源推播
雅虎, 自訂規格，使用 FTP上傳。
富邦, 三竹, 嘉實，使用跟 Yahoo一樣的格式＆FTP。
根據2016.10.21 Fri. business requirement check :
目前僅有與Yahoo 及 富邦簽約 嘉實為富邦的外包，研判應是只有富邦
FTP Server 只有yahoo 及 210.66.194.142 可以使用(ping 的到) -- titus jin
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

const configPrefix = process.env.NODE_ENV === 'development' ? (process.env.NODE_DEV === 'local' ? 'loc_' : 'dev_') : '';
const Config = require(appRoot + '/config/' + configPrefix + 'config');

var Logger = Helper.logger('rss_upload');
const ARTICLE_API_HOST = Config.rss.article_api_host;

const FEED_NID_EXCESS = Config.rss.feed_nid_excess; //16000000
const FEEDS_XML_HOST = Config.rss.feeds_xml_host;
const FEED_TMP_PATH = Config.rss.feed_tmp_path;     // /home/smg/smg_op/files/

var total = 0;
var idx = 0;
var interval;
var feeds = [];

function writelog(message){
    Logger.trace(message);
}

function errorHandle(err){
    Logger.error(new Error(err));
}

function get_file_id(nid){
    return String(FEED_NID_EXCESS + Number(nid)) + '.xml';
}

function upload_xml_files(ftp_id, xmlFeeds){
    var opts = Config.ftpServer['ftp_'+ftp_id];
    var idx = 0;
    var client = new FTP();

    client.on('ready', function(){
        writelog('ftp connected.');

        xmlFeeds.forEach(function(singleFeed, index){
            var feed = feeds[index];

            client.put(FEED_TMP_PATH + feed, feed, function(err){
                if (err) {
                    errorHandlewritelog(feed + ' ' + err);
                }else{
                    writelog(feeds[idx] + ' uploaded');
                }

                idx++;
                writelog(idx + '/' + feeds.length);
                if (idx === feeds.length) {
                    client.end();
                    writelog('------------------------------------------------------');
                    writelog('ftp closed');
                };
            });
        });
    });

    client.connect({
        host: opts.host,
        user: opts.user,
        password: opts.pass
    });
};

/**
  * make xml files according to cosumer spec.
  * (replace create_xml_files function)
 **/
function makeXML_files(array){
    var articles = [];

    return new Promise(function(resolve, reject){
        array.forEach(function(node){
            var nid = node.nid;
            var file_id = get_file_id(nid);
            var feed = file_id;
            var path = FEED_TMP_PATH + feed;
            feeds.push(feed);

            if(_.isEmpty(node.article_related_title)){
                var relatedContent = '';
            }else{
                var relatedContent = '';
                node.article_related_title.forEach(function(title, index){
                    if(index <= 1){
                        relatedContent += " ● <a href=\"http://www.storm.mg/article/" + node.article_related_id[index] + "?utm_source=Yahoo&utm_medium=%E7%9B%B8%E9%97%9C%E5%A0%B1%E5%B0%8E%E9%BB%9E%E6%93%8A&utm_campaign=Y!News_RelatedCoverage target=\"_blank\" />" + title + "</a><br />";
                    }
                });
            }

            var xml = [
                {rss: [
                        {_attr: {
                                "xmlns:media"  : "http://search.yahoo.com/mrss/",
                                "xmlns:dc"     : "http://purl.org/dc/elements/1.1/",
                                "xmlns:tvg"    : "http://rss.tvguide.com/extensions",
                                "xmlns:content": "http://purl.org/rss/1.0/modules/content/",
                                "version"      : "2.0"
                            }
                        },
                        {channel :[
                                {title : node.article_title.replace(/(\{|\}|(\r?\n))/g, '')},
                                {item : [
                                            {title :node.article_title.replace(/(\{|\}|(\r?\n))/g, '')},
                                            {link  : "http://www.storm.mg/article/" + node.nid},
                                            {guid  : [{
                                                        _attr : {
                                                            "isPermaLink" : "true"
                                                       }},
                                                       parseInt(node.nid) + 16000000
                                                     ]
                                            },
                                            {description : node.article_brief.replace(/\r?\n/g, "")},
                                            {valid : "2200/12/31 00:00"},
                                            {pubDate : moment.unix(node.article_date_publish).format('YYYY/MM/DD hh:mm')},
                                            {"content:encoded" :
                                                {_cdata: "<img class=\"editorial\" src=\"" + node.article_image_home + "\" width=\"600\" height=\"400\" align=\"middle\">" + node.article_content.replace(/<img/,"<img class=\"editorial\" style=\"max-width:600px\" align=\"middle\"").replace(/\r?\n/g, "").replace(/<(a|\/a)("[^"]*"|'[^']*'|[^'">]|)*>/g, "").replace(/<iframe/g, "<iframe style=\"max-width:600px\"") + relatedContent + "</p>"
                                                }
                                            },
                                            {category : node.article_category_hash[Object.keys(node.article_category_hash)[0]]},
                                            {"media:content" :
                                                {_attr :{
                                                        url  : node.article_image_home,
                                                        type : "image/jpeg"
                                                    }
                                                }
                                            },
                                            {"dc:creator" : node.article_author_hash[Object.keys(node.article_author_hash)[0]]
                                            }
                                        ]
                                }
                            ]
                        }
                    ]
                }
            ];

            try{
                Fs.writeFileSync(FEED_TMP_PATH + feed, XML(xml, {declaration: { standalone: 'yes', encoding: 'UTF-8'}}));

                writelog('feed nid ' + nid + ' saved!');
                articles.push(XML(xml));
            }catch(error){
                reject(null);
            }
        });

        resolve(articles);
    });
}

function get_articles(){
    //Don't get data from drupal anymore
    const options = {
        uri : ARTICLE_API_HOST + 'feeds/get_yfeed',
        method : 'GET',
        headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Expires': '-1',
            'Pragma': 'no-cache'
        },
        format: 'json',
        resolveWithFullResponse : true
    }

    var p1 = new Promise(function(resolve, reject){
        rp(options).then(function(response){
            var stCode = response.statusCode;

            if(!(/^2/.test('' + stCode))){
                console.error('statusCode :' + stCode + '. api call error : ' + response.error);
                reject(null);
            }else{
                try{
                    resolve(JSON.parse(response.body));
                }catch(err){
                    reject(null);
                }
            }
        }).catch(function (err) {
            reject(null);
        });
    });

    return p1.then(function(result){
        return result;
    });
};

/**
  *  Adopt async/await concept to prepare feeds data
 **/
var getFtpDataReady = async(function(){
    var now = new Date();
    writelog('******************************************************');
    writelog('Upload begin : '+now.toLocaleString());
    writelog('Prepare FTP RSS Feeds...');

    var articleCollection = await(get_articles());

    if(articleCollection){
        writelog('FTP RSS Feeds DONE! ');
        writelog('------------------------------------------------------');
        return articleCollection;
    }else{
        writelog('No update article.');
        process.exit(0);
    }
});

function* upload(xmlFeeds){
    var now = new Date();
    writelog('******************************************************');
    writelog('Upload begin : '+now.toLocaleString());
    writelog('******************************************************');

    writelog('------------------------------------------------------');
    writelog('Upload Feeds to ftp_1');
    writelog('------------------------------------------------------');
    upload_xml_files('1', xmlFeeds);
    yield

    writelog('------------------------------------------------------');
    writelog('Upload Feeds to ftp_2');
    writelog('------------------------------------------------------');
    upload_xml_files('2', xmlFeeds);
    yield

    writelog('------------------------------------------------------');
    writelog('Upload Feeds to ftp_3');
    writelog('------------------------------------------------------');
    upload_xml_files('3', xmlFeeds);
    yield

    writelog('------------------------------------------------------');
    writelog('Upload Feeds to ftp_4');
    writelog('------------------------------------------------------');
    upload_xml_files('4', xmlFeeds);
    yield

    now = new Date();
    writelog('******************************************************');
    writelog('Upload finish : '+now.toLocaleString());
    writelog('******************************************************');

    setTimeout(function () {
        process.exit(0);
    }, 1000);

};

/*
 Only for testing propose. Product should adopt above : upload function
 */
function* test(xmlFeeds){
    console.log(xmlFeeds);
    yield;

    console.log('------------------------------------------------------');
    console.log('Upload Feeds to ftp_test');
    console.log('------------------------------------------------------');
    upload_xml_files('test', xmlFeeds);
    yield;

    console.log('------------------------------------------------------');
    console.log('Upload Feeds to ftp_test second time');
    console.log('------------------------------------------------------');
    upload_xml_files('test', xmlFeeds);
    yield;

    setTimeout(function(){
        process.exit(0);
    }, 1000);
    yield;
}

getFtpDataReady().then(function(articleCollection){
        writelog('FTP RSS Feeds DONE!');
        console.log('------------------------------------------------------');
        return makeXML_files(articleCollection);
    }).then(function(xmlFeeds){
        // use test() for testing propose. change back to upload() on productoin
        var gen = test(xmlFeeds);
        for(var i = 0 ; i <= 3 ; i++){
            gen.next();
        }
    }, function(){
        console.log('Make XML feeds went wrong.');
        process.exit(0);
    });
