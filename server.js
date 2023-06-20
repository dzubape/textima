const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');

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
    
    let new_file = new h5.File("test.h5", "w");

    new_file.create_group("entry");

    new_file.get("entry").create_dataset("auto", [5, 4, 3, 2, 1]);
    new_file.close(); return
    // shape and dtype will match input if omitted
    new_file.get("entry").create_dataset("auto", [3.1, 4.1, 0.0, -1.0], null, '<f');
    new_file.get("entry/auto").shape

    // [4]
    new_file.get("entry/auto").dtype
    // "<d"
    new_file.get("entry/auto").value
    // Float64Array(4) [3.1, 4.1, 0, -1]

    // make float array instead of double (shape will still match input if it is set to null)
    new_file.get("entry").create_dataset("data", [3.1, 4.1, 0.0, -1.0], null, '<f');
    new_file.get("entry/data").shape
    // [4]
    new_file.get("entry/data").value
    //Float32Array(4) [3.0999999046325684, 4.099999904632568, 0, -1]

    // create a dataset with shape=[2,2]
    // The dataset stored in the HDF5 file with the correct shape, 
    // but no attempt is made to make a 2x2 array out of it in javascript
    new_file.get("entry").create_dataset("square_data", [3.1, 4.1, 0.0, -1.0], [2,2], '<d');
    new_file.get("entry/square_data").shape
    // (2) [2, 2]
    new_file.get("entry/square_data").value
    //Float64Array(4) [3.1, 4.1, 0, -1]

    // create an attribute (creates a VLEN string by default for a string)
    new_file.get("entry").create_attribute("myattr", "a string");
    Object.keys(new_file.get("entry").attrs)
    // ["myattr"]
    new_file.get("entry").attrs["myattr"]
    // {value: "a string", shape: Array(0), dtype: "S"}

    new_file.get("entry").create_attribute("fixed", ["hello", "you"], null, "S5")
    new_file.get("entry").attrs["fixed"]
    /*
    {
        "value": [
            "hello",
            "you"
        ],
        "shape": [
            2
        ],
        "dtype": "S5"
    }
    */

    // close the file - reading and writing will no longer work.
    // calls H5Fclose on the file_id.
    new_file.close()
})

const PlateDataset = function(id, count, width, height) {

    const _count = count;
    let _generatedNo = 0;
    const _currentTime = (new Date()).toLocaleString().replace(', ', '_').replace(/[:.]/g, '-');
    const _id = id || _currentTime;
    const _filepath = `${_id}.h5`;
    let _fp;
    const _abc = '0123456789ABCEHKMOPTY'
    const _imgChannelNo = 4; //3;

    this.create = () => {

        _fp = new h5.File(_filepath, 'w');
        dsX = _fp.create_dataset('X', [_count, _imgChannelNo, height, width], null, '<B');
        dsY = _fp.create_dataset('Y', [_count, _abc.length, height, width], null, '<B');
    };

    this.X = () => _fp['X'];
    this.Y = () => _fp['Y'];
    this.assign = (x, y) => {

        this.Y[_generatedNo] = 0;

        this.X[_generatedNo] = x;
        this.Y[_generatedNo] = y;
        return ++_generatedNo;
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

        if(!datasetList.hasOwnProperty(id)) {

            const ds = new PlateDataset(id, 10, 256, 128);
            ds.create();
            datasetList[id] = ds;
        }
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

            console.log('imgData:', imgData);

            let ds = getDataset(dsId);
            let inputDataLength = ds.inputChannelNo() * ds.height() * ds.width();
            let nextIdx = ds.assign(
                imgData.slice(0, inputDataLength),
                imgData.slice(inputDataLength),
            );

            console.debug('/save-imagedata-to-h5 load data!')

            resp.writeHead(200, {
                'Content-Type': ['text/plain', 'charset=utf-8']
            });

            resp.write(ds.finished() ? 'finish' : nextIdx);
            resp.end();
        })
        
        return;
        fileStream.on('finish', () => {

            console.debug('/save-image-to-h5 finished!')

            resp.writeHead(200, {
                'Content-Type': ['text/plain', 'charset=utf-8']
            });

            resp.write('Image data has been saved to h5')
            resp.end();
        });

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
