async function imageDataFromSource (source) {
    
    const img = Object.assign(new Image(), { src: source });
    await new Promise(resolve => img.addEventListener('load', () => resolve()));
    const ctx = Object.assign(document.createElement('canvas'), {
        width: img.width,
        height: img.height
    }).getctx('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}