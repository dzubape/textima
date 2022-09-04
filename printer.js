import * as htmlToImage from './node_modules/html-to-image/es/index';

// import { toCanvas, toPng, toJpeg, toBlob, toPixelData, toSvg } from './node_modules/html-to-image/dist/html-to-image.js ';
//import './node_modules/html-to-image/dist/html-to-image.js';

// var htmlToImage = await import('./node_modules/html-to-image/dist/html-to-image.js');

let randomFromRange = (lower, upper) => Math.floor(Math.random() * (upper - lower)) + lower;
let ranCol = () => randomFromRange(0, 255);
let ranRot = () => randomFromRange(-15, 15);
let ranShift = () => randomFromRange(-8, 8);
let ranFontSize = () => randomFromRange(45, 50);

let toCanvas = htmlToImage.toCanvas;

let text = "Hello, babe! Какой чудесный день!";

let tablet = document.getElementById('tablet');
tablet.style.transform = 'rotateY(5deg)';
// tablet.style.background = `rgb(${ranCol()}, ${ranCol()}, ${ranCol()})`;

for(let c of text) {

    let cspan = document.createElement('span');
    cspan.innerText = c;
    cspan.style.color = `rgb(${ranCol()}, ${ranCol()}, ${ranCol()})`;
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
