exports = module.exports = function(req, res) {

	var People = require("./models/People"),
		Q = require("q"),
		URL = require("url");

	var sendError = function(message){
			res.writeHead(404);
			res.end(message);
		},
		send = function(data){
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(200);
			res.end(JSON.stringify(data));
		},
		collectPostData = function(){
			var deferred = Q.defer();
			var body = "";
			req.on('data', function(data){
				body += data;
				// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
				if (body.length > 1e6) {
					// FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
					req.connection.destroy();
					deferred.reject();
				}
			});
			req.on('end', function(){
				try{
					deferred.resolve(JSON.parse(body));
				}catch(e){
					deferred.reject("Bad request");
				}
			});
			return deferred.promise;
		};

	var url = URL.parse(req.url, true);
	var peopleId = url.pathname.substr('/api/people/'.length);

	if (peopleId.length===0 && req.method !== "POST") {
		if (req.method === "GET") { // get all
			send(People.find(url.query.page*url.query.limit, url.query.limit, url.query.filter));
		} else {
			sendError('Unknown api');
		}
	} else {
		switch (req.method) {
			case "GET":  // get one
			case "HEAD":
				People.findById(peopleId)
					.then(function(man){
						if (req.method === "GET") return man.serialize();
					}, sendError)
					.then(send);
				break;
			case "POST":
				collectPostData().then(function(body){
					return new People(body);
				}, sendError).then(function(man){
					return man.serialize();
				}).then(send);
				break;
			case "PUT":
				Q.all([
					collectPostData(),
					People.findById(peopleId)
				]).then(function(answer){
					var man = answer[1],
						body = answer[0];

					return man.update(body);
				}, sendError)
				.then(function(man){
					return man.serialize()
				}).then(send, sendError);
				break;
			case "DELETE": // delete man
				People.findById(peopleId)
					.then(function(man){
						man.remove();
					}, sendError)
					.then(send);
				break;
			default :
				sendError('Unknown api');
		}
	}
};