import * as html2image from './node_modules/html-to-image/es/index';
// import * as html2image from 'html-to-image';

// import { toCanvas, toPng, toJpeg, toBlob, toPixelData, toSvg } from './node_modules/html-to-image/dist/html-to-image.js ';
//import './node_modules/html-to-image/dist/html-to-image.js';

// var htmlToImage = await import('./node_modules/html-to-image/dist/html-to-image.js');

function dataURLtoBlob(dataURL) {

    let array, binary, i, len;
    binary = atob(dataURL.split(',')[1]);
    array = [];
    i = 0;
    len = binary.length;
    while (i < len) {
      array.push(binary.charCodeAt(i));
      i++;
    }
    return new Blob([new Uint8Array(array)], {
      type: 'image/png'
    });
  };


const style = document.createElement('style');
style.setAttribute('async', '');
style.innerHTML = `
@font-face {
    font-family: "Textima";
    src: url(/fonts/RusRoadNumbers2.0.ttf) format('truetype');
}
body {
    padding: 0;
    margin: 0px;
    font-family: Textima;
    font-size: 60px;
}

#tablet-box {

    display: inline-grid;
    background: #fff;
}

.tablet,
#tablet {

    padding: 30px 30px;
    display: inline-block;
}

.tablet-wrapper {

    display: inline-block;
    box-sizing: content-box;
    width: 256px;
    height: 128px;
    background: white;
}

.tablet span {

    font-size: 40px;
}

h2 {

    font-size: 20px;
}
`;
document.head.appendChild(style);


let randomFromRange = (lower, upper) => Math.floor(Math.random() * (upper - lower)) + lower;
let ranCol = () => randomFromRange(0, 255);
let ranRot = () => randomFromRange(-15, 15);
let ranShift = () => randomFromRange(-8, 8);
let ranFontSize = () => randomFromRange(45, 50);

let text = "Hello, babe! Какой чудесный день!";
const getRandomPlateNumber = () => {

    const symbol = {
        letters: 'ABCEHKMOPTXY',
        digits: '0123456789',
    };

    const getRandomValue = (values, count) => {

        let res = '';
        for(let i=0; i<count; ++i) {

            res += values[Math.floor(Math.random() * values.length)];
        }
        return res;
    };

    let plateNumber = getRandomValue(symbol.letters, 1);
    plateNumber += getRandomValue(symbol.digits, 3);
    plateNumber += getRandomValue(symbol.letters, 2);
    plateNumber += getRandomValue(symbol.digits, 2);

    return plateNumber;
};
text = getRandomPlateNumber();


let tabletWrapper = document.getElementById('tablet-wrapper');
// tablet.style.transform = 'rotateY(5deg)';
// tablet.style.background = `rgb(${ranCol()}, ${ranCol()}, ${ranCol()})`;
let plateAngle = randomFromRange(-45, 45);
console.debug(plateAngle)
let tablet = tabletWrapper.getElementsByClassName('tablet')[0];
tablet.style.transform = `perspective(500px) rotateY(${plateAngle}deg) rotateX(${randomFromRange(-15, 15)}deg) rotateZ(${randomFromRange(-15, 15)}deg)`;
tablet.style.transformOrigin = plateAngle > 0 ? 'left' : 'right';
tablet.style.transformOrigin = 'center';

let symbols = {};

for(let c of text) {

    let cspan = document.createElement('span');
    cspan.setAttribute('symbol',  c);
    cspan.innerText = c;
    cspan.style.color = `rgba(${ranCol()}, ${ranCol()}, ${ranCol()}, ${randomFromRange(130, 230)/255})`;
    cspan.style.transform = `rotateZ(${ranRot()}deg) translateX(${ranShift()}px) translateY(${ranShift()}px)`;
    cspan.style.fontSize = `${ranFontSize()}px`;
    cspan.style.display = 'inline-block';
    tablet.appendChild(cspan);

    symbols[c] = true;
}
symbols = Object.keys(symbols).sort();

let hideStyle = '.show-only span {visibility: hidden;}';
for(let c of symbols) {

    hideStyle += `.show-only[show-symbol="${c}"] span[symbol="${c}"] {visibility: visible; color: black !important;}`
}
style.innerHTML += hideStyle;

//############### <

for(let i=0; i<symbols.length; ++i) {

    let layer = tabletWrapper.cloneNode(true);
    layer.removeAttribute('id');
    // layer.classList.add('tablet')
    layer.classList.add('show-only');
    layer.setAttribute('show-symbol', symbols[i]);
    tabletWrapper.parentNode.appendChild(layer);
}

const parseUrl = function(url) {

    if(!arguments.length)
        url = location.toString();

    var [path, search] = url.split('?');
    var [search, anchor] = search ? search.split('#') : [];
    // let paramRex = /(\/([^/]+))/gi;
    let params = {};
    params.__proto__ = {
        build: function() {
            return Object.entries(this).map(kv => kv.join('=')).join('&')
        },
    };
    if(search) {

        search.split('&').forEach((elem) => {

            let [key, value] = elem.split('=');
            params[key] = value || undefined;
        })
    }
    return {path, params, anchor};
};
const location = parseUrl(window.location.toString());


// Send image as PNG
const LOAD_TIME=100; // ms
if(true)
setTimeout(() => {

    // console.log('html:', tabletWrapper.parentNode)

    html2image.toCanvas(tabletWrapper.parentNode)
    .then((fullCanvas) => {

        // console.log('canvas:', fullCanvas);

        document.body.appendChild(fullCanvas);
        fullCanvas.style.display = 'block';
        fullCanvas.style.border = 'solid 1px red';

        if(!location.params.length || 'test' in location.params) {

            console.log('test request. stop')
            return;
        }

        const png_data = fullCanvas.toDataURL('image/png');
        const png_blob = dataURLtoBlob(png_data);
        const form_data = new FormData();
        form_data.append('plate', png_blob, 'plate.png')

        const dsId = location.params['ds'] || '';
        fetch(`/h5/image?ds=${dsId}&label=${text}&symbols=${symbols.join('')}&sample_no=${location.params['sample_no'] || ''}`, {
            method: 'POST',
            body: form_data,
            dataType: 'image/png',
        })
        .then(resp => resp.json())
        .then(resp => {

            console.log('req. succeed with resp:', resp);

            if(resp.filled) {
                fetch(`/h5/close?ds=${resp.ds}`, {
                    method: 'POST',
                })
                .then(resp => {
                    alert('Storage successfully closed')
                })
                alert('Finished!');
            }
            else {
                location.params['next'] = resp.filling;
                location.params['ds'] = resp.ds;
                // debugger
                window.location.search = '?' + location.params.build();
            }
        })
        .catch(resp => console.error(resp))
    });
}, LOAD_TIME);
