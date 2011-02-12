// gleicon 2011 | http://zenmachine.wordpress.com | http://github.com/gleicon
// one way comet to ws proxy
// initially design for isolating restmq

var sys = require("sys");
var ws = require("./lib/node.ws.js/ws")
var http = require("http");
var qs = require("querystring");

var target_ws_uri = '/ws/test';
var target_ws_port = 8007;
var comet_src_uri = '/c/test';
var comet_src_host = '7co.cc';
var comet_src_port = '8082';

console.log('Initializing comet -> ws proxy');

var e_msg = new process.EventEmitter();

comet_client = http.createClient(comet_src_port, comet_src_host); 
req = comet_client.request('GET', comet_src_uri, {'host': comet_src_host, 'Connection': 'Keep-Alive'});
req.end();

req.on('response', function (r) { 
    r.on('data', function (chunk) {
      if (chunk != null) { console.log(chunk.toString()); e_msg.emit('message', chunk.toString()); }
    });
});

ws_endpoint =  ws.createServer(function (websocket) {
    websocket.addListener("connect", function (resource) { 
      if (resource == target_ws_uri) {
        console.log("connect: " + resource);
      } else {
        console.log("error unknown resource: " + resource);
        websocket.end();
      }
    });

    var l = function(m) { 
      if (m != null) { 
        msg = m.replace(/[\s\r\n]+$/, ''); 
        console.log('sending: '+msg);
        websocket.write(msg);
      }
    };

    e_msg.addListener('message', l)

    var to = setTimeout(function() {
      e_msg.removeListener('message', l);
      console.log("timeout from: " + websocket.remoteAddress);
    }, 60 * 1000 * 60);

    // to handle received data, you can POST or PUT to an associated URL
    websocket.addListener("data", function(data) {
        console.log(data);
    });
    
    websocket.addListener("close", function () { 
      e_msg.removeListener('message', l); 
      console.log("connection closed");
    });
    
});

ws_endpoint.listen(target_ws_port);


