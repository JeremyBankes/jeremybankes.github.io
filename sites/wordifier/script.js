const THESAURUS_API = 'https://tuna.thesaurus.com/pageData/';
const DICTIONARY_URL = 'https://www.dictionary.com/browse/';

async function getSynonyms(word) {
    const synonyms = [word];
    const data = (await fetch(`${THESAURUS_API}${word.toLowerCase()}`).then(response => response.json())).data;
    if (data === null) return synonyms;
    const definitions = data.definitionData.definitions;
    console.log(definitions);
    if (definitions.length === 0) return synonyms;
    const definition = definitions.reduce((a, b) => b.synonyms.length > a.synonyms.length ? b : a);
    const similarity = Math.max.apply(Math, definition.synonyms.map(synonym => parseInt(synonym.similarity)));
    synonyms.push(...definition.synonyms.filter(synonym => synonym.similarity == similarity).map(synonym => synonym.term));
    return synonyms;
}

async function wordify(phrase) {
    const matches = [...phrase.matchAll(/[A-Za-z]+/g)].reduce((matches, match) => { matches[match.index] = match[0]; return matches; }, {});
    let buffer = [];
    let wordified = [];
    for (let i = 0; i < phrase.length; i++) {
        if (i in matches) {
            const match = matches[i];
            const synonyms = await getSynonyms(match);
            const longest = synonyms.reduce((a, b) => b.length > a.length ? b : a);
            if (buffer.length > 0) {
                wordified.push({ original: buffer.join('') });
                buffer = [];
            }
            wordified.push({ original: match, new: longest });
            i += match.length - 1;
        } else {
            buffer.push(phrase[i]);
        }
    }
    wordified.push({ original: buffer.join('') });
    return wordified;
}

async function onFormSubmit(form) {
    const phrase = form.phrase.value;
    const display = document.getElementById('display');
    const loading = document.getElementById('loading');
    if (phrase) {
        while (display.lastElementChild) display.lastElementChild.remove();
        loading.style.visibility = 'visible';
        const wordified = await wordify(phrase);
        loading.style.visibility = 'hidden';

        wordified.forEach(word => {
            if (word.new) {
                const wordAnchor = document.createElement('a');
                wordAnchor.innerText = word.new;
                wordAnchor.href = `${DICTIONARY_URL}${word.new}`;
                wordAnchor.target = '_blank';
                wordAnchor.setAttribute('tooltip', word.original);
                wordAnchor.classList.add('word');
                display.appendChild(wordAnchor);
            } else {
                const punctuationSpan = document.createElement('span');
                punctuationSpan.innerText = word.original;
                display.appendChild(punctuationSpan);
            }
        });
    } else {

    }
}