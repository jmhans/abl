const express = require('express');
const router = express.Router();

// Require the controllers WHICH WE DID NOT CREATE YET!!
const owners_controller = require('../controllers/owners.controller');


// a simple test url to check that all of our files are communicating correctly.
router.get('/test', owners_controller.test);
router.post('/create', owners_controller.owner_create);

module.exports = router;