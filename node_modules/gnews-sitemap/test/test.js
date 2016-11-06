/*
    use nodeunit to run tests.
*/

var GNSitemap = require('../lib/sitemap.js');

module.exports = {
    'stupid test': function(test) {
        var sitemap = new GNSitemap({
                    publication_name: '',
                    publication_language: ''
                });

        sitemap.item({
                    location: 'http://example.com/article1',
                    title:  'item 1',
                    publication_date: 'May 24, 2012'
                });
        sitemap.item({
                    location: 'http://example.com/article2',
                    title:  'item 2',
                    publication_date: 'May 25, 2012'
                });

        var expectedResult = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"><url><loc>http://example.com/article1</loc><news:news><news:publication><news:name>Untitled News</news:name><news:language>en</news:language></news:publication><news:publication_date>May 24, 2012</news:publication_date><news:title>item 1</news:title></news:news></url><url><loc>http://example.com/article2</loc><news:news><news:publication><news:name>Untitled News</news:name><news:language>en</news:language></news:publication><news:publication_date>May 25, 2012</news:publication_date><news:title>item 2</news:title></news:news></url></urlset>';
        var result = sitemap.xml();

        test.equal(result.length, expectedResult.length);
        test.equal(result, expectedResult);
        test.done();
    }
};

