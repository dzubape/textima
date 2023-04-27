import * as html2image from './node_modules/html-to-image/es/index';

// import { toCanvas, toPng, toJpeg, toBlob, toPixelData, toSvg } from './node_modules/html-to-image/dist/html-to-image.js ';
//import './node_modules/html-to-image/dist/html-to-image.js';

// var htmlToImage = await import('./node_modules/html-to-image/dist/html-to-image.js');


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

#tablet {

    padding: 30px 30px;
    display: inline-block;
}

#tablet span {

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
        // letters: 'АВЕКМНОРСТУХ',
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


let tablet = document.getElementById('tablet');
// tablet.style.transform = 'rotateY(5deg)';
// tablet.style.background = `rgb(${ranCol()}, ${ranCol()}, ${ranCol()})`;
let plateAngle = randomFromRange(-45, 45);
console.log(plateAngle)
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
symbols = Object.keys(symbols);

let hideStyle = '.show-only span {visibility: hidden;}';
for(let c of symbols) {

    hideStyle += `.show-only[show-symbol="${c}"] span[symbol="${c}"] {visibility: visible; color: black !important;}`
}
style.innerHTML += hideStyle;

setTimeout(() => {

let maskCanvas = document.createElement('canvas');

html2image.toCanvas(document.getElementById('tablet'))
.then((colorCanvas) => {

    document.body.appendChild(colorCanvas);

    maskCanvas.width = colorCanvas.width;
    maskCanvas.height = colorCanvas.height * symbols.length;
    document.body.appendChild(maskCanvas);

    colorCanvas.style.border = 'solid 1px red';
    colorCanvas.style.display = 'block';
    maskCanvas.style.border = 'solid 1px red';
    maskCanvas.style.display = 'block';

    tablet.classList.add('show-only');
    let i=0;
    let interv = setInterval(() => {

        if(i >= symbols.length) {

            tablet.classList.remove('show-only');
        }
        else {

            tablet.setAttribute('show-symbol', symbols[i]);

            html2image.toCanvas(document.getElementById('tablet'))
            .then((symbolMask) => {

                document.body.appendChild(symbolMask);
                symbolMask.style.display = 'block';
                symbolMask.style.border = 'solid 1px red';

                let maskImage = symbolMask.getContext('2d').getImageData(0, 0, symbolMask.width, symbolMask.height);
                console.log(maskImage);
                let y = i*symbolMask.height;
                console.log(`y: ${y}`)
                maskCanvas.getContext('2d').putImageData(maskImage, 0, y)
            })

            ++i;
        }
    }, 100)
});

}, 100); // setTimeout
