var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:geo', function(req, res, next) {
    var db = req.db;
    var collection = db.get(req.params.geo);
    collection.find({}, {}, function(e, docs) {
        res.json(docs);
    });
});

module.exports = router;