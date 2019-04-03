[![npm version](https://badge.fury.io/js/vanilla-abide.svg)](https://badge.fury.io/js/vanilla-abide)
[![Build Status](https://travis-ci.org/frappacchio/vanilla-abide.svg?branch=master)](https://travis-ci.org/frappacchio/vanilla-abide)
# Abide Form validation (Vanilla JS)
A transposition in vanilla js of [Foundation Abide](https://foundation.zurb.com/sites/docs/abide.html) form validation library<br/>
This library manage all the form elements in order to be WCAG compliant.

```bash
npm install vanilla-abide
```

```javascript
import Abide from 'vanilla-abide';
const myForm = document.querySelector('#my-form');
const abideInstance = new Abide(myForm);

myForm.addEventListener('formInvalid', (event) => {
  //...
});
myForm.addEventListener('formValid', (event) => {
  //...
});
```
## Events
|event|description|
|-|-|
|`formInvalid`|fired when form validation is not passed|
|`formValid`|fired when form validation is passed|

## Built-in regex validators
```javascript
alpha : /^[a-zA-Z]+$/,
alpha_numeric : /^[a-zA-Z0-9]+$/,
integer : /^[-+]?\d+$/,
number : /^[-+]?\d*(?:[\.\,]\d+)?$/,

// amex, visa, diners
card : /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
cvv : /^([0-9]){3,4}$/,

// http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
email : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

// From CommonRegexJS (@talyssonoc)
// https://github.com/talyssonoc/CommonRegexJS/blob/e2901b9f57222bc14069dc8f0598d5f412555411/lib/commonregex.js#L76
// For more restrictive URL Regexs, see https://mathiasbynens.be/demo/url-regex.
url: /^((?:(https?|ftps?|file|ssh|sftp):\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))$/,

// abc.de
domain : /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

datetime : /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
// YYYY-MM-DD
date : /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
// HH:MM:SS
time : /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
dateISO : /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
// MM/DD/YYYY
month_day_year : /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
// DD/MM/YYYY
day_month_year : /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

/**
#f00
#ff0000
rgb(255,0,0)
rgb(100%, 0%, 0%)
rgb(300,0,0)
rgb(255,-10,0)
rgb(110%, 0%, 0%)
rgba(255,0,0,1)
rgba(100%,0%,0%,1)
rgba(0,0,255,0.5)
rgba(100%, 50%, 0%, 0.1)
hsl(0, 100%, 50%)
hsl(120, 100%, 50%)
hsl(120, 75%, 75%)
hsl(120, 100%, 50%)
hsla(120, 100%, 50%, 1)
hsla(240, 100%, 50%, 0.5)
hsla(30, 100%, 50%, 0.1)
#ff00FF00
hsla(30, 100%, 50%, .1)
*/
color : /^(#[0-9a-f-A-F]{3}|#(?:[0-9a-f-A-F]{2}){2,4}|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))$/,

// Domain || URL
website: {
  test: (text) => {
    return Abide.defaults.patterns['domain'].test(text) || Abide.defaults.patterns['url'].test(text);
  }
}
```

### Original documentation
[Foundation](https://foundation.zurb.com/sites/docs/)<br/>
[Foundation Abide](https://foundation.zurb.com/sites/docs/abide.html)
