const express = require('express');
const bodyParser = require('body-parser');

function getModel(){
	return require(`./model-${require('../config').get('DATA_BACKEND')}`);
}

const router = express.Router();


