// Get Frameworks
const express = require('express');
const config = require('./config.js');
const Datastore = require('@google-cloud/datastore');
const crypto = require('crypto');
const bodyParser = require('body-parser');

// Initialize Objects
const server = express();
const datastore = Datastore();

//Body Parser
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

server.set('view engine', 'ejs');

var socketServer = server.listen(config.port, () => {
  console.log('Express is listening on port ' + config.port);
});

//REST API - Boats

/*
// Temporary Landing Page
server.get('/', (req, res) => {
	res.render('pages/index', {
		serverVar: "Variable from Server"
	});
});
*/

/** 
  * Save a 'boat' record into the database
  * 
  * @param {boat} boat - The boat record to save
  */
function saveBoat(boat){
	return datastore.save({
		key: datastore.key('boat'),
		data: boat
	});
}

/** 
  * Insert a 'boat' record into the database
  * 
  * @param {boat} boat - The boat record to insert
  */
function createBoat(boat){
	return datastore.insert({
		key: datastore.key('boat'),
		data: boat
	});
}

/** 
  * Retrieve the latest 10 boat records from the database
  */
function retrieveBoat(boatId){
	if(typeof boatId === 'undefined'){
		const query = datastore.createQuery('boat')
			.order('timestamp', {descending: true })
			.limit(10);

		return datastore.runQuery(query) 
			.then((results) => {
				const entities = results[0];
				//return entities.map((entity) => `Entity.timestamp: ${entity.timestamp}, Entity id: ${entity[datastore.KEY].id}`);
				return entities.map((entity) => `Entity id: ${entity[datastore.KEY].id}, Entity.name: ${entity.name}, Entity.type: ${entity.type}, Entity.length: ${entity.length}, Entity.at_sea: ${entity.at_sea}`);
			});
	}else{
		const query = datastore.createQuery('boat')
			.filter('__key__', '=', boatId);

		return datastore.runQuery(query)
			.then((result) => {
				const entities = result[0];
				const entity = entities[0];
				var key = entity[datastore.KEY];
				return key;
			});
	}
}

// REST API - Route Handlers
/**
  * Get Record Route
  */
server.get('/', (req, res, next) => {
	retrieveBoat()
		.then((boats) => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`Last 10 boats:\n${boats.join('\n')}`)
				.end();
		})
		.catch(next);
});

// REST API - Route Handlers
/**
  * Get Record Route - Calls retrieveBoat() which queries for the boat entity with the user's defined boat ID.
  * 			- responds with a string containing the boat id returned from the datastore entity
  */
server.get('/:boatId', (req, res, next) => {
	var key = datastore.key(['boat', parseInt(req.params.boatId)]); // req.params.<> gets parameters from URL
	retrieveBoat(key)
		.then((boat) => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`Boat: ${JSON.stringify(boat)}`);
		})
		.catch(next);
});

// REST API - Insert Record Route
/**
  * POST Record Route - Calls createBoat() which initializes a new boat entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
server.post('/boats', (req, res, next) => {
	// Create a boat record to be stored in the database
	const boat = {
		name: req.body.name, //req.body.<> gets parameters from body of request
		type: req.body.boatType,
		length: req.body.boatLength,
		at_sea: true,
		timestamp: new Date()
		// Store a hash of the IP address of the user doing the insertion
		//userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7)
	};
	createBoat(boat)
		.then(res.redirect('/'));
});



// 404 Error Handler
server.use((req, res) => {
	res.status(404).send('Not Found');
});

server.use(express.static('public'));
module.exports = server;
