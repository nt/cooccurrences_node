var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');
var path = require('path');
var sys = require('sys');

var port = process.env.PORT || 8080;
app.listen(port);

io.configure(function () { // Polling due to heroku
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
})

function handler (request, response) {
  var filePath = '.' + request.url;
    if (filePath == './')
      filePath = './visu.html';

    path.exists(filePath, function(exists) {

      if (exists) {
        fs.readFile(filePath, function(error, content) {
          if (error) {
            response.writeHead(500);
            response.end();
          }
          else {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(content, 'utf-8');
          }
        });
      }
      else {
        response.writeHead(404);
        response.end();
      }
    });
}

var https = require('https');

var pass = process.env.TWITTER_PASS || 'username:password';
var auth = 'Basic ' + new Buffer(pass).toString('base64');

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
    { "name":"Bieber", "value":0 },
    { "name":"Steve Jobs", "value":0 },
  ],
  "links":
    []
}

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
        io.sockets.emit('refresh data', data);
        io.sockets.emit('last tweet', o.text);
      }
    }
    catch(err) {
      console.error(err);
    }
  });

}).on('error', function(e) {
  console.error("BIGGGG: "+e);
});

setInterval(function(){
  for(var i in data.nodes) {
    data.nodes[i].value = Math.floor(data.nodes[i].value/2);
  }
  io.sockets.emit('refresh rate', data);
}, 30*60*1000)


io.sockets.on('connection', function (socket) {
  socket.emit('data', data);
})
/*
setInterval(function () {
  for(var i in data.nodes) {
    data.nodes[i].value += Math.floor(Math.random()*5);
  }
  io.sockets.emit('refresh data', data);
}, 1000)
*/