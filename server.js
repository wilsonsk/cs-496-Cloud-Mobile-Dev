// Get Frameworks
const express = require('express');
const config = require('./config.js');
const Datastore = require('@google-cloud/datastore');
const crypto = require('crypto');


// Initialize Objects
const server = express();
const datastore = Datastore();

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
				return entities.map((entity) => `Entity.timestamp: ${entity.timestamp}, Entity key: ${entity[datastore.KEY].id}`);
			});
	}else{
		const query = datastore.createQuery('boat')
			.filter('__key__', '=', datastore.key([
				'boat',
				boatId
			]));

		return datastore.runQuery(query);
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
	//res.send(`boatId = ${req.params.boatId}`);
	retrieveBoat(req.params.boatId)
		.then((boat) => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`Boat ${boat[datastore.KEY]}:\n${boat.timestamp}`)
				//.send(`boatId = ${req.params.boatId}`);
		})
		.catch(next);
});

// REST API - Insert Record Route
/**
  * POST Record Route - Calls createBoat() which initializes a new boat entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
server.post('/newBoat', (req, res, next) => {
	// Create a boat record to be stored in the database
	const boat = {
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
