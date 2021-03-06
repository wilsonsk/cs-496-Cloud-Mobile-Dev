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

//REST API - Boats - helper functions
/** 
  * Save a 'boat' record into the database
  * 
  * @param {boat} boat - The boat record to save
  */
function saveEntity(ent, key, kind){
	return datastore.save({
		key: datastore.key(String(kind)),
		data: ent
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
				//var key = entity[datastore.KEY];
				//return key;
				return entity;
			});
	}
}

/** 
  * DELETE boat records from the database
  */
function deleteBoat(boatId){
        if(typeof boatId === 'undefined'){
                const query = datastore.createQuery('boat')

                return datastore.runQuery(query)
                        .then((results) => {
                                const entities = results[0];
				var allBoatKeys = [];
				/*for(var i = 0; i < entities.length; i++){
					allBoatKeys.push(entities[i][datastore.KEY])
				}*/
				entities.map((entity) => {
					allBoatKeys.push(entity[datastore.KEY]);
				});

				datastore.delete(allBoatKeys)
					.then(() => {
						console.log('deleteBoat (All boats) complete');
					});
                        });
        }else{
                const query = datastore.createQuery('boat')
                        .filter('__key__', '=', boatId);

                return datastore.runQuery(query)
                        .then((result) => {
                                const entities = result[0];
                                const entity = entities[0];
                                var key = entity[datastore.KEY];
				
				datastore.delete(key)
					.then(() => {
						console.log('deleteBoat (one boat) complete');
					});
                        });
        }
}

/** 
  * REPLACE a 'boat' record in the database
  * 
  * @param {boat} boat - The boat record to replace
  */
function replaceBoat(boat_key, boat){
	return datastore.update({
		key: boat_key,
		data: boat
	});
}

/** 
  * MODIFY a 'boat' record in the database
  * 
  * @param {boat} boat - The boat record to modify
  */
function modifyBoat(boat_key, boat){
	return datastore.update({
		key: boat_key,
		data: boat
	});
}

/** 
  * Retrieve all slip records from the database
  */
function retrieveSlip(slipId){
        if(typeof slipId === 'undefined'){
                const query = datastore.createQuery('slip')
                        .order('timestamp', {descending: true })

                return datastore.runQuery(query)
                        .then((results) => {
                                const entities = results[0];
                                return entities.map((entity) => `Entity id: ${entity[datastore.KEY].id}, Entity.number: ${entity.number}, Entity.current_boat: ${entity.current_boat}, Entity.arrival_date: ${entity.arrival_date}`);
                        });
        }else{
                const query = datastore.createQuery('slip')
                        .filter('__key__', '=', slipId);

                return datastore.runQuery(query)
                        .then((result) => {
                                const entities = result[0];
                                const entity = entities[0];
                                //var key = entity[datastore.KEY];
                                //return key;
                                return entity;
                        });
        }
}

/** 
  * Insert a 'boat' record into the database
  * 
  * @param {boat} boat - The boat record to insert
  */
function createSlip(slip){
	console.log(`Creating slip...${JSON.stringify(slip)}`);
        return datastore.insert({
                key: datastore.key('slip'),
                data: slip
        });
}

/** 
  * DELETE slip records from the database
  */
function deleteSlip(slipId){
        if(typeof slipId === 'undefined'){
                const query = datastore.createQuery('slip')

                return datastore.runQuery(query)
                        .then((results) => {
                                const entities = results[0];
                                var allSlipKeys = [];
                                entities.map((entity) => {
                                        allSlipKeys.push(entity[datastore.KEY]);
                                });

                                datastore.delete(allSlipKeys)
                                        .then(() => {
                                                console.log('deleteSlip (All slips) complete');
                                        });
                        });
        }else{
                const query = datastore.createQuery('slip')
                        .filter('__key__', '=', slipId);

                return datastore.runQuery(query)
                        .then((result) => {
                                const entities = result[0];
                                const entity = entities[0];
                                var key = entity[datastore.KEY];

                                datastore.delete(key)
                                        .then(() => {
                                                console.log('deleteSlip (one slip) complete');
                                        });
                        });
        }
}

/** 
  * REPLACE a 'slip' record in the database
  * 
  * @param {slip} slip - The slip record to replace
  */
function replaceSlip(slip_key, slip){
	return datastore.update({
		key: slip_key,
		data: slip
	});
}

/** 
  * MODIFY a 'slip' record in the database
  * 
  * @param {slip} slip - The slip record to modify
  */
function modifySlip(slip_key, slip){
	return datastore.update({
		key: slip_key,
		data: slip
	});
}



// REST API - Route Handlers
/**
  * Get Record Route
  */
server.get('/boats', (req, res, next) => {
	retrieveBoat()
		.then((boats) => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`All boats:\n${boats.join('\n')}`)
				.end();
		})
		.catch(next);
});

// REST API - Route Handlers
/**
  * Get Record Route - Calls retrieveBoats() which queries for the boat entity with the user's defined boat ID.
  * 			- responds with a string containing the boat id returned from the datastore entity
  */
server.get('/boats/:boatId', (req, res, next) => {
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
		.then(res.redirect('/boats'));
});

// REST API 
/**
  * DELETE Record Route - Calls deleteBoat() which retrieves all boat entity keys, then deletes those keys
  * 			- response redirects to '/'
  */
server.delete('/boats', (req, res, next) => {
	deleteBoat()
		.then(() => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`DELETED ALL BOATS`)
				.end();
		})
		.catch(next);
});

// REST API 
/**
  * DELETE Record Route - Calls deleteBoat() which retrieves a single boat key based on user input, then deletes those keys
  * 			- response redirects to '/'
  */
server.delete('/boats/:boatId', (req, res, next) => {
	var key = datastore.key(['boat', parseInt(req.params.boatId)]); // req.params.<> gets parameters from URL
	deleteBoat(key)
		.then(() => {
			res
				.status(200)
				.set('Content-Type', 'text/plain')
				.send(`DELETED BOAT: ${req.params.boatId}`)
				.end();
		})
		.catch(next);
});

// REST API - REPLACE Record Route
/**
  * PUT Record Route - Calls replaceBoat() which replaces a new boat entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
server.put('/boats/:boatId', (req, res, next) => {
	var key = datastore.key(['boat', parseInt(req.params.boatId)]); // req.params.<> gets parameters from URL
	// Create a boat record to be stored in the database
	const replacementBoat = {
		//name: req.body.name, //req.body.<> gets parameters from body of request
		//type: req.body.boatType,
		//length: req.body.boatLength,
		//at_sea: true,
		//timestamp: new Date()
		// Store a hash of the IP address of the user doing the insertion
		//userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7)
	};
	replacementBoat.timestamp = new Date();
	if(typeof req.body.name === 'undefined'){
		replacementBoat.name = 'Default Boat Name';
	}else{
		replacementBoat.name = req.body.name;
	}
	if(typeof req.body.type === 'undefined'){
		replacementBoat.type = 'Default Boat Type';
	}else{
		replacementBoat.type = req.body.type;
	}
	if(typeof req.body.length === 'undefined'){
		replacementBoat.length = 'Default Boat Length';
	}else{
		replacementBoat.length = req.body.length;
	}
	if(typeof req.body.at_sea === 'undefined'){
		replacementBoat.at_sea = true;
	}else{
		if(req.body.at_sea === true){
			replacementBoat.at_sea = true;
		}else{
			replacementBoat.at_sea = false;
		}
	}
	replaceBoat(key, replacementBoat)
		.then(res.redirect(303, '/boats'));
});

// REST API - MODIFY Record Route
/**
  * PATCH Record Route - Calls modifyBoat() which modifies an existing boat entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
server.patch('/boats/:boatId', (req, res, next) => {
	var key = datastore.key(['boat', parseInt(req.params.boatId)]); // req.params.<> gets parameters from URL
	// Create a boat record to be stored in the database
	const replacementBoat = {
		//name: req.body.name, //req.body.<> gets parameters from body of request
		//type: req.body.boatType,
		//length: req.body.boatLength,
		//at_sea: true,
		//timestamp: new Date()
		// Store a hash of the IP address of the user doing the insertion
		//userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7)
	};
	
	//RUN A QUERY HERE INSTEAD OF get()	
	retrieveBoat(key)
                .then((boatToModify) => {
                        res
			        replacementBoat.timestamp = new Date();
        			if(typeof req.body.name === 'undefined'){
                			replacementBoat.name = boatToModify.name;
        			}else{
        			        replacementBoat.name = req.body.name;
        			}
        			if(typeof req.body.type === 'undefined'){
        			        replacementBoat.type = boatToModify.type;
        			}else{
        			        replacementBoat.type = req.body.type;
        			}
        			if(typeof req.body.length === 'undefined'){
        			        replacementBoat.length = boatToModify.length;
        			}else{
        			        replacementBoat.length = req.body.length;
        			}
        			if(typeof req.body.at_sea === 'undefined'){
		       	        	replacementBoat.at_sea = true;
		       		}else{
		       	        	replacementBoat.at_sea = boatToModify.at_sea;
		        	}
		        	replaceBoat(key, replacementBoat);

		        	console.log("req.params.boatId: " + req.params.boatId);
		        	console.log("key from boatId: " + key);
		        	console.log("boatToModify: " + JSON.stringify(boatToModify));
		        	console.log("PATCH TUEST: " + JSON.stringify(boatToModify.name));
		        	console.log("PATCH TEST: " + req.body.name);
		        	console.log("PATCH TEST: " + replacementBoat.name);

		                res.redirect(303, '/boats');
                })
});


/**
  * Slip routes
  */

// REST API - Route Handlers
/**
  * Get Record Route
  */
server.get('/slips', (req, res, next) => {
        retrieveSlip()
                .then((slips) => {
                        res
                                .status(200)
                                .set('Content-Type', 'text/plain')
                                .send(`All slips:\n${slips.join('\n')}`)
                                .end();
                })
                .catch(next);
});

// REST API - Route Handlers
/**
  * Get Record Route - Calls retrieveSlipss() which queries for the slip entity with the user's defined slip ID.
  *                     - responds with a string containing the slip id returned from the datastore entity
  */
server.get('/slips/:slipId', (req, res, next) => {
        var key = datastore.key(['slip', parseInt(req.params.slipId)]); // req.params.<> gets parameters from URL
        retrieveSlip(key)
                .then((slip) => {
                        res
                                .status(200)
                                .set('Content-Type', 'text/plain')
                                .send(`Slip: ${JSON.stringify(slip)}`);
                })
                .catch(next);
});

// REST API - Route Handlers
/**
  * Get Record Route - Calls retrieveSlipss() which queries for the slip entity with the user's defined slip ID.
  *                     - responds with a string containing the slip id returned from the datastore entity
  */
server.get('/slips/:slipId/boat', (req, res, next) => {
        var key = datastore.key(['slip', parseInt(req.params.slipId)]); // req.params.<> gets parameters from URL
        retrieveSlip(key)
                .then((slip) => {
                        res
                                .status(200)
                                .set('Content-Type', 'text/plain')
                                .send(`Slip ${JSON.stringify(slip)}: current_boat: ${JSON.stringify(slip.current_boat)}`);
                })
                .catch(next);
});


// REST API - Insert Record Route
/**
  * POST Record Route - Calls createSlip() which initializes a new slip entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
server.post('/slips', (req, res, next) => {
	// Create a slip record to be stored in the database
	const slip = {
		number: req.body.number, //req.body.<> gets parameters from body of request
		current_boat: null,
		arrival_date: null,
		timestamp: new Date()
	};
	createSlip(slip)
		.then(res.redirect('/slips'));
});

// REST API 
/**
  * DELETE Record Route - Calls deleteSlip() which retrieves all slip entity keys, then deletes those keys
  *                     - response redirects to '/'
  */
server.delete('/slips', (req, res, next) => {
        deleteSlip()
                .then(() => {
                        res
                                .status(200)
                                .set('Content-Type', 'text/plain')
                                .send(`DELETED ALL SLIPS`)
                                .end();
                })
                .catch(next);
});

// REST API 
/**
  * DELETE Record Route - Calls deleteSlip() which retrieves a single slip key based on user input, then deletes those keys
  *                     - response redirects to '/'
  */
server.delete('/slips/:slipId', (req, res, next) => {
        var key = datastore.key(['slip', parseInt(req.params.slipId)]); // req.params.<> gets parameters from URL
        deleteSlip(key)
                .then(() => {
                        res
                                .status(200)
                                .set('Content-Type', 'text/plain')
                                .send(`DELETED SLIP: ${req.params.slipId}`)
                                .end();
                })
                .catch(next);
});

// REST API - REPLACE Record Route
/**
  * PUT Record Route - Calls replaceSlip() which replaces a new slip entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
/*
server.put('/slips/:slipId', (req, res, next) => {
	var key = datastore.key(['slip', parseInt(req.params.slipId)]); // req.params.<> gets parameters from URL
	// Create a boat record to be stored in the database
	const replacementSlip = {};
	replacementSlip.timestamp = new Date();
	if(typeof req.body.number === 'undefined'){
		replacementSlip.number = 'Default Slip Number';
	}else{
		replacementSlip.number = req.body.number;
	}
	replacementSlip.arrival_date = null;
	if(typeof req.body.current_boat === 'undefined'){
		replacementSlip.current_boat = null;
	}else{
		datastore.get(key, function(err, entity) {
			var curBoat = entity.current_boat;
			var boat_key = datastore.key(['boat', parseInt(curBoat)]);
			datastore.get(boat_key, function (err, entity) {
				entity.at_sea = true;
				datastore.update({
					key: boat_key,
					data: entity
				});
			});
		});
		console.log(`key = ${JSON.stringify(key)}`);
		retrieveSlip(key)
			.then((entity) => {
				var temp = entity.current_boat;
				console.log(`temp: current boat = ${entity.current_boat}`);
				var tempKey = datastore.key(['boat', parseInt(temp)]); 
				console.log(`tempKey = ${JSON.stringify(tempKey)}`);
				retrieveBoat(tempKey)
					.then((entity) => {
						var ent = {};
						entity.at_sea = true;
						console.log(`entity from tempKey = ${JSON.stringify(entity)}`);
						console.log(`tempKey = ${JSON.stringify(tempKey)}`);
						var t_k1 = entity[datastore.KEY];
						var t_k2 = datastore.key(['boat', parseInt(temp)]); 

						console.log(`entity[datastore.KEY] = ${JSON.stringify(t_k1)}`);
						console.log(`datastore.key(['boat', id]) = ${JSON.stringify(t_k2)}`);
						//replaceBoat(t_k, entity);
					        datastore.update({
                					key: tempKey,
                					data: {
								at_sea: true
							}
					        });
					});			
			});
		

		const query1 = datastore.createQuery('slip');

		// Check for any slips that currently have this boat and remove it from their properties as well as the arrival date
		datastore.runQuery(query1)
			.then((results) => {
				const entities = results[0];	
				entities.map((entity) => {
					console.log(`entity.current_boat = ${entity.current_boat}`);
					if(entity.current_boat !== null && entity.current_boat == req.body.current_boat){
						var x = datastore.key(['slip', parseInt(entity[datastore.KEY].id)]);

						var changedSlip = {};
						changedSlip.number = entity.number;
						changedSlip.current_boat = null;
						changedSlip.arrival_date = null;

						entity[datastore.KEY].id = parseInt(entity[datastore.KEY].id);
						var k = entity[datastore.KEY];

						console.log(`k =  ${JSON.stringify(k)}`);
						console.log(`x =  ${JSON.stringify(k)}`);
						//saveEntity(changedSlip, k, 'slip');
					        datastore.update({
                					key: x,
                					data: changeSlip
					        });
					}
				});
			});
	

		// Put this new boat and arrival time into the replacement slip
		replacementSlip.current_boat = req.body.current_boat;
		replacementSlip.arrival_date = new Date();

		// Find that boat entity and set it's at_sea property to false
		var boatKey = datastore.key(['boat', parseInt(req.body.current_boat)]); // req.body.<> gets parameters from urlencoded body
		datastore.get(boatKey, function(err, entity) {
			entity.at_sea = true;
			datastore.update({
				key: boatKey,
				data: entity
			});
		});

		const query2 = datastore.createQuery('boat')
			.filter('__key__', '=', boatKey);

		datastore.runQuery(query2)
			.then((result) => {
				var changedBoat = {};
                                const entities = result[0];
				const entity = entities[0];
				console.log(`Q2 entity.at_sea = ${entity.at_sea}`);
				console.log(`Q2 boatKey = ${boatKey}`);
				
				changedBoat.name = entity.name;
				changedBoat.type = entity.type;
				changedBoat.length = entity.length;		
				changedBoat.at_sea = false;

				//replace(boatKey, changedBoat);
				datastore.update({
					key: boatKey,
					data: {
						name: entity.name,
						type: entity.type,
						length: entity.length,		
						at_sea: false
					}
				});
			});
		
	}

	replaceSlip(key, replacementSlip)
		.then(res.redirect(303, '/slips'));
});
*/
// REST API - MODIFY Record Route
/**
  * PATCH Record Route - Calls modifySlip() which modifies an existing slip entity with appropriate auto and user defined properties.
  * 			- response redirects to '/'
  */
server.patch('/slips/:slipId', (req, res, next) => {
	var key = datastore.key(['slip', parseInt(req.params.slipId)]); // req.params.<> gets parameters from URL
	// Create a boat record to be stored in the database
	const replacementSlip = {
		//name: req.body.name, //req.body.<> gets parameters from body of request
		//type: req.body.boatType,
		//length: req.body.boatLength,
		//at_sea: true,
		//timestamp: new Date()
		// Store a hash of the IP address of the user doing the insertion
		//userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0, 7)
	};
	
	//RUN A QUERY HERE INSTEAD OF get()	
	retrieveSlip(key)
                .then((slipToModify) => {
                        res
			        replacementSlip.timestamp = new Date();
        			if(typeof req.body.number === 'undefined'){
                			replacementSlip.number = slipToModify.number;
        			}else{
        			        replacementSlip.number = req.body.number;
        			}
        			if(typeof req.body.current_boat === 'undefined'){
        			        replacementSlip.current_boat = slipToModify.current_boat;
        			}else{
        			        replacementSlip.current_boat = req.body.current_boat;
        			}
        			if(typeof req.body.arrival_date === 'undefined'){
        			        replacementSlip.arrival_date = slipToModify.arrival_date;
        			}else{
        			        replacementSlip.arrival_date = req.body.arrival_date;
        			}

		        	replaceSlip(key, replacementSlip);

		        	console.log("req.params.slipId: " + req.params.slipId);
		        	console.log("key from slipId: " + key);
		        	console.log("slipToModify: " + JSON.stringify(slipToModify));
		        	console.log("PATCH TUEST: " + JSON.stringify(slipToModify.name));
		        	console.log("PATCH TEST: " + req.body.name);
		        	console.log("PATCH TEST: " + replacementSlip.name);

		                res.redirect(303, '/slips');
                })
});






// 404 Error Handler
server.use((req, res) => {
	res.status(404).send('Not Found');
});

server.use(express.static('public'));
module.exports = server;
