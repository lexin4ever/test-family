exports = module.exports = function(req, res) {

	var relationCtrl = require("./relationCtrl"),
		peopeCtrl = require("./peopleCtrl");

	if (req.url.indexOf('/api/relation') === 0){
		relationCtrl(req, res);
	} else if (req.url.indexOf('/api/people') === 0){
		peopeCtrl(req, res);
	} else {
		res.writeHead(404);
		return res.end('Unknown api');
	}
};