function load() {
    const rows = 20;
    const columns = 50;
    const lifetime = 60 * 4;
    const pallet = [
        '#FFFFFFFF',
        '#9978D6FF',
        '#92BD3BFF',
        '#C2396AFF',
        '#63BCCEFF',
        '#E48D27FF',
        '#00000000'
    ];

    const canvas = document.getElementById('fancycode');
    const context = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;


    let unit = Math.round(canvas.width / 120);
    const left = Math.round((canvas.width / unit - columns) / 2);
    const top = Math.round((canvas.height / unit - rows) / 2);
    let age = 0;

    let data = [];
    let rowStart = 3;
    let maxLineLength = 15;
    for (let i = 0; i < rows; i++) {
        data.push([0, i, 1, 1, pallet[0], 0, true]);
        if (i % 2 == 0) {
            let start = rowStart, length;
            do {
                length = Math.random() < 0.15 ? 1 : Math.floor(4 + Math.random() * maxLineLength);
                data.push([
                    start, i, length, 1,
                    length == 1 ? pallet[0] : pallet[Math.floor(Math.random() * pallet.length)],
                    Math.random() * i / rows,
                    Math.random() > 0.5
                ]);
                start += length + 1;
            } while (start + length < columns);
        } else {
            if (rowStart <= 6) {
                if (Math.random() < 0.5) rowStart += 3;
            } else if (rowStart >= 3) {
                if (Math.random() < 0.5) rowStart -= 3;
            }
        }
    }

    const animate = () => {
        let r, x, y, width, height;
        for (let shape of data) {
            x = left * unit + shape[0] * unit;
            y = top * unit + shape[1] * unit;
            width = unit * shape[2];
            height = unit * shape[3];

            r = Math.min(1, age / ((lifetime + shape[5] * 3 * lifetime) / 4));

            context.fillStyle = shape[4];
            context.fillRect(shape[6] ? x : x + ((1 - r) * width), y, r * width, height);
        }
        if (age < lifetime) {
            window.requestAnimationFrame(animate);
            age++;
        }
    };

    animate();
}

window.addEventListener('load', load);