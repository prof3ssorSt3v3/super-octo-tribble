export function a() {
  console.log('A');
  let p = document.querySelector('section.content p');
  p.textContent = 'A ' + p.textContent;
  p.style.backgroundColor = '#' + Math.random().toString(16).substring(2, 8);
}

export function b() {
  console.log('B');
  let p = document.querySelector('section.content p');
  p.textContent = 'B ' + p.textContent;
  p.style.backgroundColor = '#' + Math.random().toString(16).substring(2, 8);
}
