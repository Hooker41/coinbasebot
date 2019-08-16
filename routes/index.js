const express = require('express');
const router = express.Router();

router.get('/', function(req, res){
  res.render('dashboard', { sessionFlash: res.locals.sessionFlash });
});

// router.post('/deposit', async function(req, res){
//   let params = req.body;
//   res.render('deposit', {id: newOrder._id, mixercode});
// });

module.exports = router;