let observer;
const observerConfig = {
  rootMargin: '40px 0%',
  threshold: 0.1
};
let loadImage = el => {
  //console.log(el.dataset);
  if (el.dataset && el.dataset.srcset) {
    el.srcset = el.dataset.srcset;
  }
  if (el.dataset && el.dataset.src) {
    el.src = el.dataset.src;
  }
};
let onIntersection = elements => {
  elements.forEach(el => {
    if (el.intersectionRatio > 0) {
      observer.unobserve(el.target);
      //console.log('Intersection!');
      //console.log(el.target);
      loadImage(el.target);
    }
  });
};
function lazyload() {
  const images = window.document.querySelectorAll('source, img');
  if (!('IntersectionObserver' in window)) {
    console.log('Intersection Observer not found :(');
    Array.from(images).forEach(image => loadImage(image));
  } else {
    //console.log('intersection loaded!');
    observer = new IntersectionObserver(onIntersection, observerConfig);
    images.forEach(image => {
      observer.observe(image);
    });
  }
}
