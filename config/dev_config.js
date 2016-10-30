module.exports = {
        sync:{
            lastTime:60*60*1000,
            syncPvLastTime:1*60*60*1000,
            syncLikesLastTime:2*60*60*1000,
            syncInterval:3000,
            onOff:{
                    homeBanners: false,
                    authors: true,
                    categories: false
            }
        },
        log:{
            // logdir should be change after on production
            logDir: "/Users/develop01/logs/",
            slack: {
                turnOff : true
            },
            levels: 4
        },
        rss:{
            // should change back to production usage.
            article_api_host: 'http://localhost:3010/',
        },
        openapi:{
            eq_api_host: 'http://opendata.cwb.gov.tw/govdownload?dataid=E-A0016-001R&authorizationkey=rdec-key-123-45678-011121314'
        },
        ftpServer : {
            ftp_test: {
                host: '127.0.0.1',
                user: 'develop01',
                pass: 'titusjin0819',
                port: 21,
                path: ''
            }
        }
};
