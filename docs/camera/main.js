const canvas = document.getElementById('canvas');

const DENSITY_LINE = '@&0Oo=~+,.          ';

/**
 * @param {HTMLElement} canvasElement 
 */
function getResolution(canvasElement) {
    if (canvasElement.parentElement === null) {
        throw new Error('Canvas element must have a parent to fill.');
    }
    canvasElement.textContent = '.';
    const lineHeight = canvasElement.clientHeight;
    let newLineHeight = lineHeight;
    while (lineHeight === newLineHeight) {
        canvasElement.textContent += '.';
        newLineHeight = canvasElement.clientHeight;
    }
    const row = canvasElement.textContent.substring(1);
    canvasElement.textContent = row;
    while (canvasElement.clientHeight < canvasElement.parentElement.clientHeight) {
        canvasElement.textContent += row;
    }
    return {
        width: row.length,
        height: canvasElement.textContent.length / row.length
    }
}

/**
 * @param {HTMLVideoElement} video 
 */
async function startCapture(video) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}

/**
 * @param {HTMLVideoElement} source 
 * @param {HTMLElement} canvas
 */
async function setupAsciiRendering(source, canvas) {
    const bufferCanvas = document.createElement('canvas');
    const context = bufferCanvas.getContext('2d');
    if (context === null) {
        throw new Error('Failed to create rendering context.');
    }
    const resolution = getResolution(canvas);
    bufferCanvas.width = resolution.width;
    bufferCanvas.height = resolution.height;
    const aspectRatio = 640 / 480;
    const update = () => {
        const y = (resolution.height - (resolution.height * aspectRatio)) / 2;
        context.drawImage(source, 0, y, resolution.width, resolution.height * aspectRatio);
        const imageData = context.getImageData(0, 0, resolution.width, resolution.height);
        const pixelData = imageData.data;
        const content = [];
        for (let i = 0; i < imageData.height; i++) {
            for (let j = 0; j < imageData.width; j++) {
                const index = i * 4 * imageData.width + (imageData.width - j - 1) * 4;
                const red = pixelData[index + 0];
                const green = pixelData[index + 1];
                const blue = pixelData[index + 2];
                const average = 0.3 * red + 0.59 * green + 0.11 * blue;
                const normalized = average / 255;
                let character = DENSITY_LINE.charAt(Math.floor(DENSITY_LINE.length * normalized));
                content.push(character);
            }
        }
        let credit = 'Jeremy Bankes : jeremybankes.com ';
        let line = (credit + content.join('').substring(credit.length)).replace(/ /g, '&nbsp;');
        canvas.innerHTML = line;
        window.requestAnimationFrame(update);
    };
    window.requestAnimationFrame(update);
}

const video = document.createElement('video');
video.autoplay = true;
startCapture(video).then(() => {
    if (canvas instanceof HTMLElement) {
        setupAsciiRendering(video, canvas);
    }
});