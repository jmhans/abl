/*jshint esversion: 8 */

const axios = require('axios');
var   express = require('express');
var   router = express.Router();

let clients = [];
let facts = [];
let gamesClients = [];
let games = [];

class mlbEventHandler{

  constructor() {
  }

   eventsHandler(request, response, next) {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      response.writeHead(200, headers);

      const data = `data: ${JSON.stringify(facts)}\n\n`;

      response.write(data);

      const clientId = Date.now();

      const newClient = {
        id: clientId,
        response
      };

      clients.push(newClient);

      request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
      });
    }

    gamesEventHandler(request, response, next) {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      response.writeHead(200, headers);

      const data = `data: ${JSON.stringify(games)}\n\n`;

      response.write(data);

      const clientId = Date.now();

      const newGamesClient = {
        id: clientId,
        response
      };

      gamesClients.push(newGamesClient);

      request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        gamesClients = gamesClients.filter(client => client.id !== clientId);
      });
    }

    sendEventsToGamesClients(newGame) {
      gamesClients.forEach(gamesClient => gamesClient.response.write(`data: ${JSON.stringify(newGame)}\n\n`))
    }



    sendEventsToAll(newFact) {
      clients.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
    }

    async addFact(request, response, next) {
      const newFact = request.body;
      facts.push(newFact);
      response.json(newFact)
      return this.sendEventsToAll(newFact);
    }

    async addGame(request, response, next) {
      const newGame = request.body;
      games.push(newGame);
      response.json(newGame)
      return this.sendEventsToGamesClients(newGame);
    }



  route() {
    router.post('/fact',  (...args) => this.addFact(...args));
    router.get('/events', (...args) => this.eventsHandler(...args));
    router.post('/game',  (...args) => this.addGame(...args));
    router.get('/gameevents', (...args) => this.gamesEventHandler(...args));
    return router;
  }

}

module.exports =  {mlbEventHandler}
