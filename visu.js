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
var db = require('mongojs').connect(databaseURL, ['twitts']);

var politiciansMeta = {
  "nodes": [
    { "name":"Nicolas Sarkozy", "keywords": ["sarkozy", "nsarkozy", "nicolassarkozy"] },
    { "name":"Eva Joly", "keywords": ["joly", "ejoly", "evajoly"] },
    { "name":"François Hollande", "keywords": ["hollande", "fhollande", "francoishollande"] }
		/*{ "name":"Jean-Luc Mélenchon", "keywords": ["melenchon", "jlmelenchon"] },
		{ "name":"François Bayrou", "keywords": ["bayrou", "fbayrou", "francoisbayrou"] },
		{ "name":"Nicolas Dupont-Aignan", "keywords": ["dupont-aignan"] },
		{ "name":"Philippe Poutou", "keywords": ["poutou"] },
		{ "name":"Corine Lepage", "keywords": ["corine+lepage"] },
		{ "name":"Christine Boutin", "keywords": ["christine+boutin"] },
		{ "name":"Frédéric Nihous", "keywords": ["frederic+nihous"] }*/
  ]
}

//Array containing the twitter activity per minute
var perMinuteActivity = {"nodes": []};

for(var i in politiciansMeta.nodes){
	var politicianName = politiciansMeta.nodes[i].name;
	perMinuteActivity.nodes.push({"name": politicianName, "count": 0, "twitts": [""]});
}

var perHourActivity = [];

//Saving perMinutArray in the mongodb
setInterval(function(){
  db.twitts.save(perMinuteActivity);
	console.log("------------Pushed---------------")
	console.log(perMinuteActivity.nodes[0])
	console.log(perMinuteActivity.nodes[1])
	console.log(perMinuteActivity.nodes[2])

	for(var i in perMinuteActivity.nodes){
		perMinuteActivity.nodes[i].count = 0;
		try {
			perMinuteActivity.nodes[i].twitts = [""];
		} catch(err) { console.log(err);}
	}
}, 10*1000)

//building the api streaming query
var query = "";
for(var i in politiciansMeta.nodes){
	for(var j in politiciansMeta.nodes[i].keywords){
  	query+=encodeURIComponent(politiciansMeta.nodes[i].keywords[j])+",";
	}
}
query=query.slice(0, query.length-1);
console.log(query);

//api streaming
https.get({ host: 'stream.twitter.com', path: '/1/statuses/filter.json?track='+query, headers:{'Authorization': auth} }, function(res) {

  res.on('data', function(d) {
    try{
      var o = JSON.parse(d);
      var detected = false;
      for(var i in politiciansMeta.nodes) {
				for(var j in politiciansMeta.nodes[i].keywords)
        	if(o.text.toLowerCase().indexOf(politiciansMeta.nodes[i].keywords[j].toLowerCase())!=-1){
						var politicianName = politiciansMeta.nodes[i].name
						perMinuteActivity.nodes[i].count++;
          	perMinuteActivity.nodes[i].twitts.push({"text": o.text, "user": o.user.screen_name});
						console.log("------------New detection: "+ politiciansMeta.nodes[i].keywords[j] + "---------------")		
						console.log(perMinuteActivity);
          	detected = true;
						break;
        	}
      }
      if(!detected) {
        console.error('n\'a rie détecté dans '+o.text);
      }
      else{
        //io.sockets.emit('refresh politiciansMeta', politiciansMeta);
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
