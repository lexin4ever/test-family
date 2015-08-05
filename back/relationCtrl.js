exports = module.exports = function(req, res) {

	var People = require("./models/People"),
		Q = require("q");

	var sendError = function(message, code){
			res.writeHead(code || 404);
			res.end(message);
		},
		send = function(data){
			console.log( data );
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

	var people = req.url.substr('/api/relation/'.length).split('/');

	if (!people[0] || !people[1]) {
		sendError('Bad request', 400);
	} if (req.method !== "DELETE" && req.method !== "POST") {
		sendError('Unknown api');
	} else {
		Q.all([
			People.findById(people[0]),
			People.findById(people[1])
		]).then(function(answer){
			var parent = answer[0],
				child = answer[1];
			if (req.method === "DELETE") {
				// delete relation
				parent.removeClildren(child);
			} else {
				// add relation
				parent.addChildren(child);
			}
			send(parent.serialize());
		}, sendError)
	}
};