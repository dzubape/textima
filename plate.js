import * as htmlToImage from './node_modules/html-to-image/es/index';

// import { toCanvas, toPng, toJpeg, toBlob, toPixelData, toSvg } from './node_modules/html-to-image/dist/html-to-image.js ';
//import './node_modules/html-to-image/dist/html-to-image.js';

// var htmlToImage = await import('./node_modules/html-to-image/dist/html-to-image.js');


const style = document.createElement('style');
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

setTimeout(() => {


let randomFromRange = (lower, upper) => Math.floor(Math.random() * (upper - lower)) + lower;
let ranCol = () => randomFromRange(0, 255);
let ranRot = () => randomFromRange(-15, 15);
let ranShift = () => randomFromRange(-8, 8);
let ranFontSize = () => randomFromRange(45, 50);

let toCanvas = htmlToImage.toCanvas;

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

for(let c of text) {

    let cspan = document.createElement('span');
    cspan.innerText = c;
    cspan.style.color = `rgba(${ranCol()}, ${ranCol()}, ${ranCol()}, ${randomFromRange(130, 230)/255})`;
    cspan.style.transform = `rotateZ(${ranRot()}deg) translateX(${ranShift()}px) translateY(${ranShift()}px)`;
    cspan.style.fontSize = `${ranFontSize()}px`;
    cspan.style.display = 'inline-block';
    tablet.appendChild(cspan);
}

toCanvas(document.getElementById('tablet'))
// toCanvas(document.body)
.then(function(canvas) {

    document.body.appendChild(canvas);
});

}, 100); // setTimeout
