var fs = require('fs');

// simple http server
var port = process.env.PORT || 8888;

require('http')
	.createServer(function(req, res){
		if (req.url.indexOf('/api/') === 0) {
			require("./back/routes")(req, res);
		} else {
			var fileName = req.url==='/' ? '/index.html' : req.url;  // default file
			fs.readFile(__dirname + "/front" + fileName, function(err, data){   // try to read file
				if (err) {
					res.writeHead(404);
					return res.end('File not found');   // or any other error, see err
				}

				res.writeHead(200);
				res.end(data);
			});
		}
	}).listen(port, function(){
		console.log("server starts on port " + port)
	});