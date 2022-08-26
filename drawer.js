import { SVG } from "./node_modules/@svgdotjs/svg.js/dist/svg.esm.js"
import {b64EncodeUnicode, b64DecodeUnicode} from './base644utf8.js';

let parse_function_decoration = function(f) {

    return f.toString().match(/function\s+[^(]+[()]{2}\s*[{]\s*\/\*(.*)\*\/\s*[}]$/s)[1].trim();
}

let parse_base64_fun = function(f) {

    return parse_function_decoration(f).replace(/\n+/g, '');
}

let img_size = {w: 300, h: 400}

!function() {

let tablet = document.createElement('div');
document.body.append(tablet);

let q = 1;
var svg = SVG()
.addTo(tablet)
.size(img_size.w, img_size.h)
// .move(-200, -200)
.scale(q, q)

var style;

fetch('/fonts/Aboreto-Regular.woff2')
.then((resp)=>{

    resp.arrayBuffer()
    .then((data) => {

        let arrayBuffer2base64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
        data = arrayBuffer2base64(data);
        svg.style('@font-face {font-family: Textima; src: url(data:application/font-woff;charset=utf-8;base64,' + data + ');}');

        let rectCoords = [[0, 0], [0, 1], [1, 1], [1, 0]];
        let h=img_size.h>>1, w=img_size.w>>1;

        for(let rect of rectCoords) {

            svg.rect()
            .size(w, h)
            .move(rect[0] * w, rect[1] * h)
            .css({
                'fill': `rgb(${rect[0] * 255}, ${rect[1] * 255}, 0)`
            })

            svg.line(0, 0, w, h)
            .move(rect[0] * w, rect[1] * h)
            .stroke({width: 1, color: "#f00"})
        }

        let plate = svg.text("X212BA99")
        .font({
            family: 'Textima',
            size: 50,
        })
        .css({
            fill: 'rgb(255, 255, 0)'
        })

        plate
        .move(0, plate.bbox().height)

        svg2canvas();
    });
}, (err)=>{});


function svg2canvas() {

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
        ctx.moveTo(60, 60);
        ctx.fillStyle = 'rgb(0, 255, 100)';
        ctx.font = '60px Roboto';
        // ctx.fillText("Hello, Chepishillo!", 10, 60);

        var canvasdata = canvas.toDataURL("image/png");

        if(typeof(process) !== 'undefined') {


        }

        return;
    };
};
}();
