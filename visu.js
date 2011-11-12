var app = require('http').createServer(handler)
  //, io = require('socket.io').listen(app)
  , fs = require('fs');
var path = require('path');
var sys = require('sys');

var port = process.env.PORT || 8080;
app.listen(port);

/*
io.configure(function () { // Polling due to heroku
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
})*/

// when the daemon started
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
// every 10 seconds poll for the memory.
setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);

function handler (request, response) {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end("{ "+
    "'uptime': "+(new Date() - starttime)+","+
    "'memory': "+mem.rss+
  "}", 'utf-8');
}

var https = require('https');

var pass = process.env.TWITTER_PASS || 'username:password';
var auth = 'Basic ' + new Buffer(pass).toString('base64');

var databaseURL = process.env.MONGOHQ_URL || 'dataviz';
var db = require('mongojs').connect(databaseURL, ['rates']);

var data = {
  "nodes": [
    { "name":"Sarkozy", "value":0 },
    { "name":"Fillon", "value":0 },
    { "name":"Eva Joly", "value":0 },
    { "name":"Hollande", "value":0 },
    { "name":"Merkel", "value":0 },
    { "name":"Obama", "value":0 },
    { "name":"Mélenchon", "value":0 },
    { "name":"Le Pen", "value":0 },
    { "name":"Dupont Aignant", "value":0 },
    { "name":"Natalie Arthaud", "value":0 },
    { "name":"Chevenement", "value":0 },
    { "name":"Boutin", "value":0 },
    { "name":"Nétanyahou", "value":0 },
    { "name":"Papandreou", "value":0 },
    { "name":"Berlusconi", "value":0 },
    //{ "name":"Bieber", "value":0 },
    //{ "name":"Steve Jobs", "value":0 },
  ]
}

setInterval(function(){
  var to_save = new Array();
  for(var i in data.nodes) {
    if(data.nodes[i].value > 0) {
      to_save.push({'name':data.nodes[i].name, 'value':data.nodes[i].value, 'date': new Date()});
      data.nodes[i].value = 0;
    } 
  }
  for(var i in to_save){
    db.rates.save(to_save[i]);
  }
}, 60*1000)

var query = "";
for(var i in data.nodes){
  query+=encodeURIComponent(data.nodes[i].name)+",";
}
query=query.slice(0, query.length-1);
console.log(query);
https.get({ host: 'stream.twitter.com', path: '/1/statuses/filter.json?track='+query, headers:{'Authorization': auth} }, function(res) {

  res.on('data', function(d) {
    try{
      var o = JSON.parse(d);
      var detected = false;
      for(var i in data.nodes) {
        if(o.text.toLowerCase().indexOf(data.nodes[i].name.toLowerCase())!=-1){
          console.log(data.nodes[i].name + " détecté dans: "+o.text);
          data.nodes[i].value += 1;
          detected = true;
        }
      }
      if(!detected) {
        console.error('n\'a rie détecté dans '+o.text);
      }
      else{
        //io.sockets.emit('refresh data', data);
        //io.sockets.emit('last tweet', o.text);
      }
    }
    catch(err) {
      console.error(err);
    }
  });

}).on('error', function(e) {
  console.error("BIGGGG: "+e);
});
