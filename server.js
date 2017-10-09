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
  * Insert a 'boat' record into the database
  * 
  * @param {boat} boat - The boat record to insert
  */
function insertRec(boat){
	return datastore.save({
		key: datastore.key('boat'),
		data: boat
	});
}

/** 
  * Retrieve the latest 10 boat records from the database
  */
function getBoats(){
	const query = datastore.createQuery('boat')
		.order('timestamp', {descending: true })
		.limit(10);

	return datastore.runQuery(query) 
		.then((results) => {
			const entities = results[0];
			return entities.map((entity) => `Time: ${entity.timestamp}, AddrHash: ${entity.userIp}`);
		});
}

// REST API - Get Record Route
server.get('/', (req, res, next) => {
	getBoats()
		.then((boats) => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`Last 10 boats:\n${boats.join('\n')}`)
				.end();
		})
		.catch(next);
});

// REST API - Insert Record Route
server.get('/newBoat', (req, res, next) => {
	// Create a boat record to be stored in the database
	const boat = {
		timestamp: new Date(),
		// Store a hash of the IP address of the user doing the insertion
		userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7)
	};

	insertRec(boat)
		.then(res.redirect('/'));
});



// 404 Error Handler
server.use((req, res) => {
	res.status(404).send('Not Found');
});

server.use(express.static('public'));
module.exports = server;
