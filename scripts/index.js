function highlightNavigation() {
    const offsetTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    const navigationLinks = [...document.querySelectorAll('nav a')];
    const navigationPairs = navigationLinks.map(link => ({ link, to: document.querySelector(link.getAttribute('href')) }));
    const currentPair = navigationPairs.reduce((best, pair) => (pair.to.offsetTop - offsetTop) < (offsetTop - best.to.offsetTop) ? pair : best);
    navigationPairs.forEach(pair => pair.link.classList.remove('active'));
    currentPair.link.classList.add('active');
}

document.addEventListener('scroll', highlightNavigation);
highlightNavigation();