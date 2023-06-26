const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');
const np = require('numjs');

// const PNG = require('pngjs').PNG;

// const h5 = require('h5wasm');
// import * as h5 from 'h5wasm';
// const { FS } = await h5wasm.ready;
// const h5 = require('./node_modules/h5wasm/dist/esm/hdf5_hl.js');
// import * as h5 from './node_modules/h5wasm/dist/esm/hdf5_hl';

const { buffer } = require('node:stream/consumers');

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

let h5;
import('h5wasm')
.then(_h5 => {

    h5 = _h5;
    return h5.ready;
})
.then(ready => {

    console.info('h5.ready');
})

const PlateDataset = function(id, count, width, height) {

    const _count = count;
    let _generatedNo = 0;
    const _currentTime = (new Date()).toLocaleString().replace(', ', '_').replace(/[:.]/g, '-');
    const _id = id || _currentTime;
    console.log('_id:', _id)
    const _filepath = `${_id}.h5`;
    let _fp;
    const _abc = '0123456789ABCEHKMOPTY'
    const _imgChannelNo = 4; //3;

    this.create = () => {

        _fp = new h5.File(_filepath, 'w');
        _fp.create_dataset('X', new Uint8Array(_count * _imgChannelNo * height * width), [_count, _imgChannelNo, height, width], '<B');
        _fp.create_dataset('Y', new Uint8Array(_count * _abc.length * height * width), [_count, _abc.length, height, width], '<B');
        console.log(_filepath, 'has been opened');
    };

    this.close = () => _fp.close();

    this.X = () => _fp['X'];
    this.Y = () => _fp['Y'];
    this.assign = (x, y) => {

        if(!_fp) {

            this.create();
        }

        _fp.get('X')[_generatedNo] = x;
        _fp.get('Y')[_generatedNo] = y;

        if(++_generatedNo === _count) {

            _fp.close();
            _fp = null;
            return -1;
        }

        return _generatedNo;
    };

    this.inputChannelNo = () => _imgChannelNo;
    this.width = () => width;
    this.height = () => height;

    this.finished = () => _generatedNo >= _count;

    this.id = () => _id;
};

const getDataset = function(id) {

    const datasetList = {};
    return () => {

        if(!id || !datasetList.hasOwnProperty(id)) {

            const ds = new PlateDataset(id, 10, 256, 128);
            id = ds.id();
            datasetList[id] = ds;
        }
        console.log(`getDataset(${id})`)
        return datasetList[id];
    };
}();

function readStreamToBuffer(stream) {
    
    return new Promise((resolve, reject) => {
        
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', err => reject(err));
    });
}

const server = http.createServer(function(req, resp) {

    var req_url = url.parse(req.url, true);

    if('/save-image' == req_url.pathname) {

        const plateNumber = req_url.query.number;
        const symbols = req_url.query.symbols;
        console.log('================');
        console.log(`plate number: ${plateNumber}`);
        console.log(`symbols: ${symbols}`);
        const fileStream = fs.createWriteStream(`./plates/${plateNumber}_${symbols}.png`);
        req.pipe(fileStream);

        fileStream.on('finish', () => {

            console.debug('/save-image pulled!')

            resp.writeHead(200, {
                'Content-Type': ['text/plain', 'charset=utf-8']
            });

            resp.write('Image has been saved')
            resp.end();
        })
    }
    else if('/save-imagedata-to-h5' == req_url.pathname) {

        const plateNumber = req_url.query.number;
        const symbols = req_url.query.symbols;
        let dsId = req_url.query.ds || null;
        console.log('================');
        console.log(`plate number: ${plateNumber}`);
        console.log(`symbols: ${symbols}`);
        console.log(`dsId: ${dsId}`);

        // buffer(req)
        readStreamToBuffer(req)
        .then(buf => {

            // console.log('buf:', buf);
            let imgData = new Uint8Array(buf);

            // console.log('imgData:', imgData);

            let ds = getDataset(dsId);
            let inputDataLength = ds.inputChannelNo() * ds.height() * ds.width();
            console.log('input data length:', inputDataLength);
            // let inputImgData = np.array(imgData.slice(0, inputDataLength)).reshape([])

            const nextIdx = ds.assign(
                imgData.slice(0, inputDataLength),
                imgData.slice(inputDataLength),
            );

            console.debug('/save-imagedata-to-h5 load data!')

            resp.writeHead(200, {
                'Content-Type': ['text/plain', 'charset=utf-8']
            });

            resp.write(JSON.stringify({ds: ds.id(), next: nextIdx}));
            resp.end();

            return;
        })
    }
    else if('/convert-png-to-h5' == req_url.pathname) {

        const plateNumber = req_url.query.number;
        const symbols = req_url.query.symbols;
        console.log('================');
        console.log('/convert-png-to-h5');
        console.log(`plate number: ${plateNumber}`);
        console.log(`symbols: ${symbols}`);

        req.pipe(
            new PNG({
                filterType: 4,
            })
        )
        .on('parsed', function() {

            
        })

        // test response
        resp.writeHead(200, {
            'Content-Type': ['text/plain', 'charset=utf-8']
        });

        resp.write('Image has been saved')
        resp.end();
    }
    else {

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
    }

});

let serverPort = 8080;
console.log(`Server is started on: http://localhost:${serverPort}`);
server.listen(serverPort);
