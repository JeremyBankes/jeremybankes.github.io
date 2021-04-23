(() => {
    const cursorSwappingElements = document.querySelectorAll('[cursor-swap]');
    cursorSwappingElements.forEach(element => {
        const swapList = element.getAttribute('cursor-swap').split(',').map(item => item.trim());
        const moveInterval = parseInt(element.getAttribute('cursor-move-interval')) || 100;
        const wait = parseInt(element.getAttribute('cursor-swap-wait')) || 500;
        const display = text => {
            return new Promise(resolve => {
                let currentCharacterIndex = 0;
                let adding = false;
                const intervalId = setInterval(() => {
                    if (!adding) {
                        if (element.innerText.length > 0) {
                            element.innerText = element.innerText.substr(0, element.innerText.length - 1);
                        } else {
                            adding = true;
                        }
                    } else {
                        if (currentCharacterIndex < text.length) {
                            element.innerText += text[currentCharacterIndex];
                            currentCharacterIndex++;
                        } else {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }
                }, moveInterval);
            });
        };
        const displayNext = swapListIndex => {
            display(swapList[swapListIndex]).then(() => setTimeout(displayNext, wait, (swapListIndex + 1) % swapList.length));
        };
        displayNext(0);
    });
})();