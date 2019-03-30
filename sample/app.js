import Abide from '../src/abide';

const form = document.querySelector('form');
const abide = new Abide(form, {
  liveValidate: true,
});

form.addEventListener('formInvalid', (event) => {
  console.log(event.target, 'invalid');
});
form.addEventListener('formValid', (event) => {
  console.log(event.currentTarget, 'valid');
});
