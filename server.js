const { program } = require('commander');
const fs = require('fs').promises;
const http = require('http');
const path = require('path');
const superagent = require('superagent');

program
  .option('-h, --host <host>', 'адреса сервера')
  .option('-p, --port <port>', 'порт сервера')
  .option('-c, --cache <cache>', 'шлях до кешованих файлів')
  .parse(process.argv);

const options = program.opts();

if (!options.host || !options.port || !options.cache) {
  console.error('Missing required parameters');
  process.exit(1);
}

http.createServer((req, res) => {
  const method = req.method;
  const match = req.url.match(/^\/(\d{3})$/);

  if (!match) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Bad Request');
  }

  const code = match[1];
  const filePath = path.join(options.cache, `${code}.jpg`);

  if (method === 'GET') {
    fs.readFile(filePath)
      .then(data => {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
         
          const url = `https://http.cat/${code}`;
          superagent
            .get(url)
            .buffer(true)
            .parse(superagent.parse.image)
            .then(response => {
             
              fs.writeFile(filePath, response.body)
                .then(() => {
                  res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                  res.end(response.body);
                })
                .catch(() => {
                  res.writeHead(500);
                  res.end('Failed to write to cache');
                });
            })
            .catch(() => {
              res.writeHead(404);
              res.end('Not Found');
            });
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
      });

  } else if (method === 'PUT') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      fs.writeFile(filePath, Buffer.concat(chunks))
        .then(() => {
          res.writeHead(201);
          res.end('Created');
        })
        .catch(() => {
          res.writeHead(500);
          res.end('Server Error');
        });
    });

  } else if (method === 'DELETE') {
    fs.unlink(filePath)
      .then(() => {
        res.writeHead(200);
        res.end('Deleted');
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
      });

  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }

}).listen(options.port, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});
