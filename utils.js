//common global util classes
function fadingAlert() {
  this.div = document.createElement('div');
  this.div.id = 'alertBoxDiv';
  document.body.appendChild(this.div);

  const s = this.div.style;
  s.position = 'fixed';
  s.top = '40%';
  s.left = '45%';
  s.textAlign = 'center';
  s.width = '300px';
  s.height = 'auto';
  s.padding = '2px';
  s.border = 0;
  s.color = 'Black';
  s.backgroundColor = 'LawnGreen';
  s.overflow = 'auto';
  s.zIndex = '1000'; //z-index on css is 999

  this.log = async (...txt) => {
    if (txt.length == 0) {
      await sleep(1);
      this.div.style.opacity = 0;
      this.div.style.transition = 'opacity 2s ease-in';
    }
    else {
      this.div.textContent = txt.join(' ');
      this.div.style.transition = '';
      this.div.style.opacity = 1;
      console.log(...txt);
    }
  };
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function elementReady(selector, baseEl, countEmpty = true) {
  return new Promise((resolve, reject) => {
    if (!baseEl)
      baseEl = document.documentElement;

    let els = [...baseEl.querySelectorAll(selector)];
    if(els.length > 0)
      resolve(els[els.length-1]);

    new MutationObserver(async (m, o) => {
      let els = [...baseEl.querySelectorAll(selector)];
      if (els.length > 0) {
        if (countEmpty || els.pop().childNodes.length > 0) {
          o.disconnect();
          resolve(els[els.length - 1]);
        }
      }
    })
      .observe(baseEl, {
        childList: true,
        subtree: true
      });
  });
}
//others' small utils
function dateDiffInDays(a, b) {
  //https://stackoverflow.com/a/15289883/6153990
  // a and b are javascript Date objects
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
