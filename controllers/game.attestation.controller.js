var   express = require('express');
var   router = express.Router();
const Attestation = require('../models/Attest');

const BaseController = require('./base.controller');

class AttestationController extends BaseController{
  
  constructor() {
    super(Attestation,  'attestations');
  }
  
}

module.exports =  AttestationController