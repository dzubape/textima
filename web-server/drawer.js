import { SVG } from "./node_modules/@svgdotjs/svg.js/dist/svg.esm.js"
import {arrayBufferToBase64} from './base644utf8.js';

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
.scale(q, q)

var style;

fetch('/fonts/Aboreto-Regular.woff2')
// fetch('/fonts/AlumniSansPinstripe-Italic.ttf')
.then((resp)=>{

    resp.arrayBuffer()
    .then((data) => {

        data = arrayBufferToBase64(data);
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
        .transform({
            origin: [0, 0],
            skewX: -10,
        })

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

        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = "low"
        // ctx.filter = 'blur(4px) invert(60%)';
        ctx.drawImage(image, 0, 0);
        // ctx.filter = 'blur(0)';
        ctx.fillStyle = 'rgb(0, 255, 100)';
        ctx.font = '20px Roboto';
        ctx.moveTo(60.5, 60.5);
        // ctx.moveTo(60, 60);
        ctx.fillText("Hello, Chepushillo!", 10.0, 60.0);

        var canvasdata = canvas.toDataURL("image/png");

        if(typeof(process) !== 'undefined') {


        }

        return;
    };
};
}();
