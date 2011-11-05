var https = require('https');

var pass = process.env.TWITTER_PASS || 'username:password';
var auth = 'Basic ' + new Buffer(pass).toString('base64');


https.get({ host: 'stream.twitter.com', path: '/1/statuses/filter.json?track=RIPSophie', headers:{'Authorization': auth} }, function(res) {

  console.log("statusCode: ", res.statusCode);
  console.log("headers: ", res.headers);

  res.on('data', function(d) {
    process.stdout.write(d);
  });

}).on('error', function(e) {
  console.error(e);
});
