const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');

const send404 = function(resp) {

    resp.writeHead(404, {
        'Content-Type': ['text/plain', 'charset=utf-8']
    });
    resp.write("fuck off!");
    resp.end();
}

const sendFile = function(resp, filePath) {

    var fileStat = fs.statSync(filePath);

    if(fileStat.isDirectory()) {

        resp.writeHead(200);
    }

    if(filePath.endsWith('.js'))
        resp.setHeader('Content-Type', 'application/javascript');

    resp.writeHead(200);

    fs.createReadStream(filePath).pipe(resp);
}

const server = http.createServer(function(req, resp) {

    var req_url = url.parse(req.url, true);

    var filePath = path.join(__dirname, req_url.pathname);

    fs.stat(filePath, (err, stats) => {

        if(err || stats.isDirectory()) {

            filePath += '.js';

            fs.stat(filePath, (err, stats) => {

                if(err || stats.isDirectory()) {

                    send404(resp);
                    return;
                }

                sendFile(resp, filePath);
            });

            return;
        }

        // console.log(url.parse(req.url,true).query);

        sendFile(resp, filePath);
    });
});

let serverPort = 8080;
console.log(`Server is started on: http://localhost:${serverPort}`);
server.listen(serverPort);
