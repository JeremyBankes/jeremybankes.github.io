const state = {
    fullScreenButton: /** @type {HTMLButtonElement}  */ (/** @type {unknown} */ (null)),
    buttonSection:    /** @type {HTMLDivElement}     */ (/** @type {unknown} */ (null)),
    numberInput:      /** @type {HTMLInputElement}   */ (/** @type {unknown} */ (null)),
    display:          /** @type {HTMLHeadingElement} */ (/** @type {unknown} */ (null)),
    answer: 0
};

function randomNumber() {
    return Math.round(1 + Math.random() * 11);
}

function newProblem() {
    const x = randomNumber();
    const y = randomNumber();
    state.answer = x * y;
    state.display.innerHTML = `${x} &times; ${y} = ?`;
}

/**
 * @param {number} number 
 */
function enter(number) {
    if (number === state.answer) {
        state.display.classList.add('correctAnimation');
        newProblem();
    } else {
        state.display.classList.add('incorrectAnimation');
    }
}

function onLoad() {
    state.fullScreenButton = /** @type {HTMLButtonElement} */ (document.getElementById('fullScreenButton'));
    state.buttonSection = /** @type {HTMLDivElement} */ (document.getElementById('buttonSection'));
    state.numberInput = /** @type {HTMLInputElement} */ (document.getElementById('numberInput'));
    state.display = /** @type {HTMLInputElement} */ (document.getElementById('display'));
    for (const button of state.buttonSection.children) {
        if (button instanceof HTMLButtonElement) {
            /** @type {(event: MouseEvent) => any} */ let handler;
            switch (button.textContent) {
                case 'CLEAR':
                    handler = () => {
                        state.numberInput.value = '';
                    };
                    break;
                case 'ENTER':
                    handler = () => {
                        enter(parseInt(state.numberInput.value));
                        state.numberInput.value = '';
                    };
                    break;
                default:
                    handler = () => state.numberInput.value += button.textContent;
                    break;
            }
            button.addEventListener('mousedown', handler);
        }
    }
    newProblem();

    state.display.onanimationend = () => {
        for (const className of state.display.classList) {
            if (className.toLowerCase().includes('animation')) {
                state.display.classList.remove(className);
            }
        }
    };

    state.fullScreenButton.onmousedown = () => {
        if (document.fullscreenElement === null) {
            state.fullScreenButton.textContent = 'Enter Fullscreen';
            document.body.requestFullscreen();
        } else {
            state.fullScreenButton.textContent = 'Exit Fullscreen';
            document.exitFullscreen();
        }
    };
}

window.addEventListener('DOMContentLoaded', onLoad);