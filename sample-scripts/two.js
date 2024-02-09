export function c() {
  console.log('C');
  let p = document.querySelector('section.content p');
  p.textContent = 'C ' + p.textContent;
  p.style.backgroundColor = '#' + Math.random().toString(16).substring(2, 8);
}

export function d() {
  console.log('D');
  let p = document.querySelector('section.content p');
  p.textContent = 'D ' + p.textContent;
  p.style.backgroundColor = '#' + Math.random().toString(16).substring(2, 8);
}
