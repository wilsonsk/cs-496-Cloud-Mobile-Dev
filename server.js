const express = require('express');
const server = express();
const config = require('./config.js');

server.set('view engine', 'ejs');

var socketServer = server.listen(config.port, () => {
  console.log('Express is listening on port ' + config.port);
});

// Boats
server.use('/boats', require('./boats/crud'));
server.use('/api/books', require('./boats/api'));

// Redirect to Boats
server.get('/', (req, res) => {
	res.redirect('/boats');
});

/*
server.get('/', (req, res) => {
	res.render('pages/index', {
		serverVar: "Variable from Server"
	});
});
*/

server.use((req, res) => {
	res.status(404).send('Not Found');
});

server.use(express.static('public'));
