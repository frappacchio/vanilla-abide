class Abide {
  /**
   * Creates a new instance of Abide.
   * @class
   * @name Abide
   * @param {Element} element - DOM Element to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  constructor(element, options = {}) {
    this.element = element;
    this.options = this.mergeDeep(Abide.defaults, options);
    this.className = 'Abide'; // ie9 back compat
    this.init();
  }


  static factory(element, options) {
    return new Abide(element, options);
  }

  /**
   * Simple is object check.
   * @param item
   * @returns {boolean}
   */
  static isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  /**
   * Deep merge two objects.
   * @param target
   * @param source
   */
  mergeDeep(target, source) {
    if (Abide.isObject(target) && Abide.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (Abide.isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, {
              [key]: {},
            });
          }
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, {
            [key]: source[key],
          });
        }
      });
    }
    return target;
  }

  /**
   * Initializes the Abide plugin and calls functions to get Abide functioning on load.
   */
  init() {
    const inputs = [].slice.call(this.element.querySelectorAll('input:not([type="submit"])'));
    const selectAndTextArea = [].slice.call(this.element.querySelectorAll('textarea,select'));
    this.inputs = [...inputs, ...selectAndTextArea];
    const globalErrors = [].slice.call(this.element.querySelectorAll('[data-abide-error]'));

    // Add accessibility attributes to all fields
    if (this.options.a11yAttributes) {
      this.inputs.forEach(input => this.addA11yAttributes(input));
      globalErrors.forEach(error => this.addGlobalErrorForA11yAttributes(error));
    }

    this.events();
  }

  /**
   * Initializes events for Abide.
   */
  events() {
    this.element.addEventListener('reset', () => {
      this.resetForm();
    });
    this.element.addEventListener('submit', (event) => {
      if (!this.validateForm()) {
        event.preventDefault();
      }
    });
    if (this.options.validateOn === 'fieldChange') {
      this.inputs.forEach((input) => {
        input.addEventListener('change', (event) => {
          this.validateInput(event.currentTarget);
        });
      });
    }

    if (this.options.liveValidate) {
      this.inputs.forEach((input) => {
        input.addEventListener('input', (event) => {
          this.validateInput(event.currentTarget);
        });
      });
    }

    if (this.options.validateOnBlur) {
      this.inputs.forEach((input) => {
        input.addEventListener('blur', (event) => {
          this.validateInput(event.currentTarget);
        });
      });
    }
  }


  /**
   * Checks whether or not a form element has the required attribute and if it's checked or not
   * @param {Element} element - DOM Element to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  static requiredCheck(element) {
    if (!element.required) return true;
    let isGood = true;
    switch (element.type) {
      case 'checkbox':
        isGood = element.checked;
        break;

      case 'select':
      case 'select-one':
      case 'select-multiple':
        if (!element[element.selectedIndex] || !element[element.selectedIndex].hasAttribute('value')) isGood = false;
        break;

      default:
        if (!element.value || !element.value.length) isGood = false;
    }

    return isGood;
  }

  /**
   * Get all elements siblings
   * @param {Element} el DOM Element
   * @param {String}* filter DOM Query string
   * @returns {Array}
   * @private
   */
  static siblings(element, filter = '') {
    let siblings = [];
    let sibling = element.parentNode.firstChild;
    while (sibling) {
      if (sibling.nodeType === 1 && sibling !== element) {
        siblings.push(sibling);
      }
      sibling = sibling.nextSibling;
    }
    if (filter !== '') {
      const filtered = [].slice.call(element.parentNode.querySelectorAll(filter));
      const matched = siblings.filter(x => filtered.includes(x));
      siblings = matched;
    }
    return siblings;
  }

  /**
   * Get:
   * - Based on element, the first element(s) corresponding to `formErrorSelector` in this order:
   *   1. The element's direct sibling('s).
   *   2. The element's parent's children.
   * - Element(s) with the attribute `[data-form-error-for]` set with the element's id.
   *
   * This allows for multiple form errors per input, though if none are found,
   * no form errors will be shown.
   *
   * @param {Object} element - DOM Element to use as reference to find the form error selector.
   * @returns {Object} DOM Element with the selector.
   */
  findFormError(element) {
    const {
      id,
    } = element;
    let error = Abide.siblings(element, this.options.formErrorSelector);

    if (!error.length) {
      error = [].slice.call(element.parentNode.querySelectorAll(this.options.formErrorSelector));
    }

    if (id) {
      const parent = this.element.querySelector(`[data-form-error-for="${id}"]`);
      if (parent) {
        error.push(parent);
      }
    }

    return error;
  }

  /**
   * Get the first element in this order:
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} element - DOM Element to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  findLabel(element) {
    const {
      id,
    } = element;
    const label = this.element.querySelector(`label[for="${id}"]`);

    if (!label) {
      return element.closest('label');
    }

    return label;
  }

  /**
   * Get the set of labels associated with a set of radio els in this order
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} element - DOM Element to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  findRadioLabels(elements) {
    const labels = elements.filter((element) => {
      const {
        id,
      } = element;
      let label = this.element.querySelector(`label[for="${id}"]`);
      if (!label) {
        label = element.closest('label');
      }
      return label;
    });
    /* const labels = elements.forEach((element) => {
      const {
        id,
      } = element;
      let label = this.element.querySelector(`label[for="${id}"]`);
      if (!label) {
        label = element.closest('label');
      }
      if (label) {
        return label;
      }
    }); */
    return labels;
  }

  /**
   * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
   * @param {Object} element - DOM Element to add the class to
   */
  addErrorClasses(element) {
    const label = this.findLabel(element);
    const formError = this.findFormError(element);

    if (label) {
      label.classList.add(this.options.labelErrorClass);
    }

    if (formError.length) {
      formError.forEach((form) => {
        form.classList.add(this.options.formErrorClass);
      });
    }

    element.classList.add(this.options.inputErrorClass);
    element.setAttribute('data-invalid', '');
    element.setAttribute('aria-invalid', true);
  }

  /**
   * Adds [for] and [role=alert] attributes to all form error targetting element,
   * and [aria-describedby] attribute to element toward the first form error.
   * @param {Object} element - DOM Element
   */
  addA11yAttributes(element) {
    const errors = this.findFormError(element);
    const labels = errors.filter(errorElement => errorElement.nodeName.toLowerCase() === 'label');
    const error = errors[0];
    if (!errors.length) return;

    // Set [aria-describedby] on the input toward the first form error if it is not set
    if (!element.hasAttribute('aria-describedby')) {
      // Get the first error ID or create one
      let errorId;
      if (!error.hasAttribute('id')) {
        errorId = Abide.GetYoDigits(6, 'abide-error');
        error.setAttribute('id', errorId);
      } else {
        errorId = error.getAttribute('id');
      }

      element.setAttribute('aria-describedby', errorId);
    }

    if (labels.filter(labelElement => labelElement.hasAttribute('for')).length < labels.length) {
      // Get the input ID or create one

      let elemId;
      if (!element.hasAttribute('id')) {
        elemId = Abide.GetYoDigits(6, 'abide-input');
        element.setAttribute('id', elemId);
      } else {
        elemId = element.getAttribute('id');
      }
      // For each label targeting element, set [for] if it is not set.
      labels.forEach((label) => {
        if (!label.hasAttribute('for')) {
          label.setAttribute('for', elemId);
        }
      });
    }

    // For each error targeting element, set [role=alert] if it is not set.
    errors.forEach((label) => {
      if (!label.hasAttribute('role')) {
        label.setAttribute('role', 'alert');
      }
    });
  }

  /**
   * Adds [aria-live] attribute to the given global form error element.
   * @param {Object} element - DOM Element to add the attribute to
   */
  addGlobalErrorForA11yAttributes(element) {
    if (!element.hasAttribute('aria-live')) {
      element.setAttribute('aria-live', this.options.a11yErrorLevel);
    }
  }

  /**
   * Remove CSS error classes etc from an entire radio button group
   * @param {String} groupName - A string that specifies the name of a radio button group
   *
   */
  removeRadioErrorClasses(groupName) {
    const elements = [].slice.call(this.element.querySelectorAll(`[type="radio"][name="${groupName}"]`));

    const labels = this.findRadioLabels(elements);
    labels.forEach((label) => {
      label.classList.remove(this.options.labelErrorClass);
    });

    elements.forEach((element) => {
      const formErrors = this.findFormError(element);
      if (formErrors.length) {
        formErrors.classList.remove(this.options.formErrorClass);
      }
      element.classList.remove(this.options.inputErrorClass);
      element.removeAttribute('data-invalid');
      element.removeAttribute('aria-invalid');
    });
  }

  /**
   * Removes CSS error class as specified by the Abide settings
   * from the label, input, and the form
   * @param {Object} element - DOM Element to remove the class from
   */
  removeErrorClasses(element) {
    // radios need to clear all of the els
    if (element.type === 'radio') {
      return this.removeRadioErrorClasses(element.getAttribute('name'));
    }

    const label = this.findLabel(element);
    const formError = this.findFormError(element);

    if (label) {
      label.classList.remove(this.options.labelErrorClass);
    }

    if (formError.length) {
      for (let i = 0; i < formError.length; i++) {
        formError[i].classList.remove(this.options.formErrorClass);
      }
    }
    element.classList.remove(this.options.inputErrorClass);
    element.removeAttribute('data-invalid');
    element.removeAttribute('aria-invalid');
    return true;
  }

  /**
   * Goes through a form to find inputs and proceeds
   * to validate them in ways specific to their type.
   * Ignores inputs with data-abide-ignore, type="hidden" or disabled attributes set
   * @fires Abide#invalid
   * @fires Abide#valid
   * @param {Element} element - DOM Element to validate, should be an HTML input
   * @returns {Boolean} goodToGo - If the input is valid or not.
   */
  validateInput(element) {
    const clearRequire = Abide.requiredCheck(element);
    let validated = false;
    let customValidator = true;
    const validator = element.getAttribute('data-validator');
    let equalTo = true;

    // don't validate ignored inputs or hidden inputs or disabled inputs
    if (element.hasAttribute('data-abide-ignore') || element.type === 'hidden' || element.hasAttribute('disabled')) {
      return true;
    }

    switch (element.type) {
      case 'radio':
        validated = this.validateRadio(element.getAttribute('name'));
        break;

      case 'checkbox':
        validated = clearRequire;
        break;

      case 'select':
      case 'select-one':
      case 'select-multiple':
        validated = clearRequire;
        break;

      default:
        validated = this.validateText(element);
    }

    if (validator) {
      customValidator = this.matchValidation(element, validator, element.getAttribute('required'));
    }

    if (element.getAttribute('data-equalto')) {
      equalTo = this.options.validators.equalTo(element);
    }


    const goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;

    if (goodToGo && element.hasAttribute('id')) {
      // Re-validate inputs that depend on this one with equalto
      const dependentElements = this.element.querySelectorAll(`[data-equalto="${element.getAttribute('id')}"]`);
      dependentElements.forEach((dependentElement) => {
        this.validateInput(dependentElement);
      });
    }

    this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses'](element);
    return goodToGo;
  }

  /**
   * Goes through a form and if there are any invalid inputs,
   * it will display the form error element
   * @returns {Boolean} noError - true if no errors were detected...
   * @fires Abide#formvalid
   * @fires Abide#forminvalid
   */
  validateForm() {
    const acc = [];

    this.inputs.forEach((element) => {
      acc.push(this.validateInput(element));
    });

    const noError = acc.indexOf(false) === -1;

    this.element.querySelectorAll('[data-abide-error]').forEach((element) => {
      const tmpElement = element;
      // Ensure accessibility attributes are set
      if (this.options.a11yAttributes) {
        this.addGlobalErrorForA11yAttributes(tmpElement);
      }
      // Show or hide the error
      tmpElement.style.display = (noError ? 'none' : 'block');
      // element.css('display', (noError ? 'none' : 'block'));
    });

    /**
     * Fires when the form is finished validating.
     * Event trigger is either `formValid` or `formInvalid`.
     * Trigger includes the element of the form.
     * @event Abide#formvalid
     * @event Abide#forminvalid
     */
    this.element.dispatchEvent(new Event(`${noError ? 'formValid' : 'formInvalid'}`));

    return noError;
  }

  /**
   * Determines whether or a not a text input is valid based
   * on the pattern specified in the attribute.
   *  If no matching pattern is found, returns true.
   * @param {Object} element - DOM Element to validate, should be a text input HTML element
   * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
   * @returns {Boolean} Boolean value depends on whether or not
   * the input value matches the pattern specified
   */
  validateText(element, pattern) {
    const usedPattern = (pattern || element.getAttribute('pattern') || element.getAttribute('type'));
    const inputText = element.value;
    let valid = false;

    if (inputText.length) {
      if (Object.prototype.hasOwnProperty.call(this.options.patterns, usedPattern)) {
        valid = this.options.patterns[usedPattern].test(inputText);
      } else if (pattern !== element.getAttribute('type')) {
        valid = new RegExp(pattern).test(inputText);
      } else {
        valid = true;
      }
    } else if (!element.getAttribute('required')) {
      valid = true;
    }

    return valid;
  }

  /**
   * Determines whether or a not a radio input is valid based on whether or not
   * it is required and selected.
   * Although the function targets a single `<input>`,
   * it validates by checking the `required` and `checked` properties
   * of all radio buttons in its group.
   * @param {String} groupName - A string that specifies the name of a radio button group
   * @returns {Boolean} Boolean value depends on whether or not at least
   * one radio input has been selected (if it's required)
   */
  validateRadio(groupName) {
    // If at least one radio in the group has the `required` attribute,
    // the group is considered required
    // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
    const group = this.element.querySelectorAll(`[type="radio"][name="${groupName}"]`);
    let valid = false;
    let required = false;

    // For the group to be required, at least one radio needs to be required
    group.forEach((e) => {
      if (e.hasAttribute('required')) {
        required = true;
      }
    });
    if (!required) valid = true;

    if (!valid) {
      // For the group to be valid, at least one radio needs to be checked
      group.forEach((e) => {
        if (e.checked) {
          valid = true;
        }
      });
    }

    return valid;
  }

  /**
   * Determines if a selected input passes a custom validation function.
   * Multiple validations can be used,
   * if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
   * @param {Object} element - DOM input element.
   * @param {String} validators - a string of function names matching
   * functions in the Abide.options.validators object.
   * @param {Boolean} required - self explanatory?
   * @returns {Boolean} - true if validations passed.
   */
  matchValidation(element, validators, required) {
    const requiredParam = !!required;
    const clear = validators.split(' ').map(v => this.options.validators[v](element, requiredParam, element.parentNode));
    return clear.indexOf(false) === -1;
  }

  /**
   * Resets form inputs and styles
   * @fires Abide#formreset
   */
  resetForm() {
    this.element.querySelectorAll(`.${this.options.labelErrorClass}:not(small)`).forEach((node) => {
      node.classList.remove(this.options.labelErrorClass);
    });
    this.element.querySelectorAll(`.${this.options.inputErrorClass}:not(small)`).forEach((node) => {
      node.classList.remove(this.options.inputErrorClass);
    });
    document.querySelectorAll(`${this.options.formErrorSelector}.${this.options.formErrorClass}`).forEach((node) => {
      node.classList.remove(this.options.formErrorClass);
    });

    const abideErrors = [].slice.call(this.element.querySelectorAll('[data-abide-error]'));
    abideErrors.forEach((element) => {
      const fakeElement = element;
      fakeElement.style.display = 'none';
    });
    this.element.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([data-abide-ignore])').forEach((element) => {
      element.removeAttribute('data-invalid');
      element.removeAttribute('aria-invalid');
      element.setAttribute('value', '');
    });
    this.element.querySelectorAll('[type="radio"]:not([data-abide-ignore]), [type="checkbox"]:not([data-abide-ignore])').forEach((element) => {
      element.removeAttribute('data-invalid');
      element.removeAttribute('aria-invalid');
      element.removeAttribute('checked');
    });
  }

  /**
   * Destroys an instance of Abide.
   * Removes error styles and classes from elements, without resetting their values.
   */
  destroy() {
    [].slice.call(this.element.querySelectorAll('[data-abide-error]')).forEach((element) => {
      const destroyElement = element;
      destroyElement.style.display = 'none';
    });

    this.inputs.forEach((element) => {
      this.removeErrorClasses(element);
    });
  }

  static GetYoDigits(length, namespace) {
    const givenLength = length || 6;
    return Math.round(((36 ** (givenLength + 1)) - Math.random() * (36 ** (givenLength + 1)))).toString(36).slice(1) + (namespace ? `-${namespace}` : '');
  }
}

/**
 * Default settings for plugin
 */
Abide.defaults = {
  /**
   * The default event to validate inputs. Checkboxes and radios validate immediately.
   * Remove or change this value for manual validation.
   * @option
   * @type {?string}
   * @default 'fieldChange'
   */
  validateOn: 'fieldChange',

  /**
   * Class to be applied to input labels on failed validation.
   * @option
   * @type {string}
   * @default 'is-invalid-label'
   */
  labelErrorClass: 'is-invalid-label',

  /**
   * Class to be applied to inputs on failed validation.
   * @option
   * @type {string}
   * @default 'is-invalid-input'
   */
  inputErrorClass: 'is-invalid-input',

  /**
   * Class selector to use to target Form Errors for show/hide.
   * @option
   * @type {string}
   * @default '.form-error'
   */
  formErrorSelector: '.form-error',

  /**
   * Class added to Form Errors on failed validation.
   * @option
   * @type {string}
   * @default 'is-visible'
   */
  formErrorClass: 'is-visible',

  /**
   * If true, automatically insert when possible:
   * - `[aria-describedby]` on fields
   * - `[role=alert]` on form errors and `[for]` on form error labels
   * - `[aria-live]` on global errors `[data-abide-error]` (see option `a11yErrorLevel`).
   * @option
   * @type {boolean}
   * @default true
   */
  a11yAttributes: true,

  /**
   * [aria-live] attribute value to be applied on global errors `[data-abide-error]`.
   * Options are: 'assertive', 'polite' and 'off'/null
   * @option
   * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
   * @type {string}
   * @default 'assertive'
   */
  a11yErrorLevel: 'assertive',

  /**
   * Set to true to validate text inputs on any value change.
   * @option
   * @type {boolean}
   * @default false
   */
  liveValidate: false,

  /**
   * Set to true to validate inputs on blur.
   * @option
   * @type {boolean}
   * @default false
   */
  validateOnBlur: false,

  patterns: {
    alpha: /^[a-zA-Z]+$/,
    alpha_numeric: /^[a-zA-Z0-9]+$/,
    integer: /^[-+]?\d+$/,
    number: /^[-+]?\d*(?:[\\.\\,]\d+)?$/,

    // amex, visa, diners
    card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(?:222[1-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
    cvv: /^([0-9]){3,4}$/,

    // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
    email: /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

    // From CommonRegexJS (@talyssonoc)
    // https://github.com/talyssonoc/CommonRegexJS/blob/e2901b9f57222bc14069dc8f0598d5f412555411/lib/commonregex.js#L76
    // For more restrictive URL Regexs, see https://mathiasbynens.be/demo/url-regex.
    url: /^((?:(https?|ftps?|file|ssh|sftp):\/\/|www\d{0,3}[.]|[a-z0-9.\\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\\[\]{};:\\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))$/,

    // abc.de
    domain: /^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

    datetime: /^([0-2][0-9]{3})\\-([0-1][0-9])\\-([0-3][0-9])T([0-5][0-9])\\:([0-5][0-9])\\:([0-5][0-9])(Z|([\\-\\+]([0-1][0-9])\\:00))$/,
    // YYYY-MM-DD
    date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
    // HH:MM:SS
    time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
    dateISO: /^\d{4}[\\/\\-]\d{1,2}[\\/\\-]\d{1,2}$/,
    // MM/DD/YYYY
    month_day_year: /^(0[1-9]|1[012])[- \\/.](0[1-9]|[12][0-9]|3[01])[- \\/.]\d{4}$/,
    // DD/MM/YYYY
    day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \\/.](0[1-9]|1[012])[- \\/.]\d{4}$/,

    // #FFF or #FFFFFF
    color: /^(#[0-9a-f-A-F]{3}|#(?:[0-9a-f-A-F]{2}){2,4}|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))$/,

    // Domain || URL
    website: {
      test: text => Abide.defaults.patterns.domain.test(text)
        || Abide.defaults.patterns.url.test(text),
    },
  },

  /**
   * Optional validation functions to be used. `equalTo` being the only default included function.
   * Functions should return only a boolean if the input is valid or not.
   * Functions are given the following arguments:
   * el : The DOM element to validate.
   * required : Boolean value of the required attribute be present or not.
   * parent : The direct parent of the input.
   * @option
   */
  validators: {
    equalTo(el) {
      const matcherElement = document.querySelector(`#${el.getAttribute('data-equalto')}`);
      return matcherElement.getAttribute('value') === el.getAttribute('value');
    },
  },
};
export default Abide;
