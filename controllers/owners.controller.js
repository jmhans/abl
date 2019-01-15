const Product = require('../models/owners');

//Simple version, without validation or sanitation
exports.test = function (req, res) {
    res.send('Greetings from the Test controller!');
};

exports.owner_create = function (req, res) {
    let owner = new Owner(
        {
            name: req.body.name
        }
    );

    owner.save(function (err) {
        if (err) {
            return next(err);
        }
        res.send('Owner Created successfully')
    })
};