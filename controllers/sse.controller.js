/*jshint esversion: 8 */

var express = require('express');
var   router = express.Router();
const EventEmitter = require('events');
const Stream = new EventEmitter();

class SSE_Controller {

  constructor() {
    //this.stream = Stream; //new EventEmitter();
    setInterval(function() {
      Stream.emit('push', 'ping', {msg: "testing server ping from SSE controller"})
      }, 30000)
  }


  async _connect(req, res) {
    req.setTimeout(600000);
    res.writeHead(200, {
      'Content-Type' : 'text/event-stream',
      'Cache-Control':'no-cache',
      Connection: 'keep-alive',
        })
        Stream.on('push', function(event, data) {
        res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
      })
      //this.establishHeartbeat(Stream);

  }

  emit(...args) {
    Stream.emit(...args)
  }

  route() {
    router.get('/sse', (...args)=>this._connect(...args));
    return router;
  }

}




module.exports = new SSE_Controller()

