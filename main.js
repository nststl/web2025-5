const {program} = require ('commander');
const fs = require('fs');
const http = require('http');

program
.option ('-h, --host, <host>', 'адреса сервера')
.option ('-p, --port, <port>', 'порт сервера')
.option ('-c, -cache, <cache>', 'шлях до кешованих файлів')
.parse(process.argv)

http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Hello World!');
    res.end();
}).listen(8080);

if (!options.host || !options.port || !options.cache){
    console.error('Missing required parameters');
    process.exit(1);
}
