const express = require('express');
const router = express.Router();

const versions = {
    '1.0' : require('./v1.0')
};

router.use('/v1.0', versions['1.0']);

module.exports = router;