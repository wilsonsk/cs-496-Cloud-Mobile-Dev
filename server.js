var express = require('express');
const server = express();
var config = require('./config.js');

server.set('view engine', 'ejs');

var socketServer = server.listen(3000, () => {
  console.log('Express is listening on port ' + config.port);
});

server.get('/', (req, res) => {
	res.render('pages/index', {
		serverVar: "Variable from Server"
	});
});

server.use(express.static('public'));
