import { SVG, Rect } from "./node_modules/@svgdotjs/svg.js/dist/svg.esm.js"
import d2i from './node_modules/dom-to-image/dist/dom-to-image.min.js';

let img_size = {w: 300, h: 400}

!function() {

let tablet = document.createElement('div');
document.body.append(tablet);

let q = 1;
var draw = SVG()
.addTo(tablet)
.size(img_size.w, img_size.h)
// .move(-200, -200)
.scale(q, q)

let rectCoords = [[0, 0], [0, 1], [1, 1], [1, 0]];
let h=img_size.h>>1, w=img_size.w>>1;

for(let rect of rectCoords) {

    draw.rect()
    .size(w, h)
    .move(rect[0] * w, rect[1] * h)
    .css({
        'fill': `rgb(${rect[0] * 255}, ${rect[1] * 255}, 0)`
    })

    draw.line(0, 0, w, h)
    .move(rect[0] * w, rect[1] * h)
    .stroke({width: 1, color: "#f00"})
}

// return;

var text = draw.text("X212BA99");


////////////////////////////////////
var html = document.querySelector("svg").parentNode.innerHTML;
var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);
var canvas;
canvas = document.createElement("canvas");
document.body.appendChild(canvas);
var ctx = canvas.getContext("2d");
let k = 1;
canvas.setAttribute('width', img_size.w * k);
canvas.setAttribute('height', img_size.h * k);

var image = new Image;
image.src = imgsrc;
image.onload = function() {

    ctx.drawImage(image, 0, 0);
    ctx.moveTo(20, 30);
    ctx.fillStyle = 'rgb(0, 255, 100)';
    ctx.font = '60px Roboto';
    ctx.fillText("Hello, Petya!", 10, 60);

    var canvasdata = canvas.toDataURL("image/png");
    console.log(canvasdata);

    if(typeof(process) !== 'undefined') {


    }

    return;


    var a = document.createElement("a");
    a.textContent = "save";
    // a.download = "export_" + Date.now() + ".png";
    a.download = "storedSVG.png";
    a.href = canvasdata;
    document.body.appendChild(a);
    canvas.parentNode.removeChild(canvas);
};
}();

!function() {

let tablet = document.createElement('div');
document.body.append(tablet);

let canvas = document.createElement('canvas')
tablet.append(canvas)
let ctx = canvas.getContext("2d");
var data = "data:image/svg+xml," +
           "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
           "<style>* {font-size: 20px;} @font-face {font-family: Textima; src: url(/fonts/Aboreto-Regular.woff2);}</style>" +
             "<foreignObject width='100%' height='100%'>" +
               "<div xmlns='http://www.w3.org/1999/xhtml' font-family='Textima'>" +
                document.getElementById('text-sample').innerHTML  +
               "</div>" +
             "</foreignObject>" +
           "</svg>";

var img = new Image();
img.src = data;
img.onload = function() {

    ctx.drawImage(img, 0, 0);
}

}();

domtoimage.toPng(node)
    .then(function (dataUrl) {
        var img = new Image();
        img.src = dataUrl;
        document.body.appendChild(img);
    })
    .catch(function (error) {
        console.error('oops, something went wrong!', error);
    });
