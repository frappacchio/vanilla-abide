class Abide {
    /**
     * Creates a new instance of Abide.
     * @class
     * @name Abide
     * @fires Abide#init
     * @param {Element} element - DOM Element to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    _setup(element, options = {}) {
        this.$element = element;
        //this.options = $.extend(true, {}, Abide.defaults, this.$element.data(), options);
        this.options = {
            ...Abide.defaults,
            ...options
        };

        this.className = 'Abide'; // ie9 back compat
        this._init();
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */
    _init() {
        /* this.$inputs = $.merge( // Consider as input to validate:
            this.$element.find('input').not('[type=submit]'), // * all input fields expect submit
            this.$element.find('textarea, select') // * all textareas and select fields
        ); */
        const inputs = [].slice.call(this.$element.querySelectorAll('input:not([type="submit"])'));
        const selectAndTextArea = [].slice.call(this.$element.querySelectorAll('textarea,select'));
        this.$inputs = [...inputs, ...selectAndTextArea];
        //const $globalErrors = this.$element.find('[data-abide-error]');
        const $globalErrors = [].slice.call(this.$element.querySelectorAll('[data-abide-error]'));

        // Add a11y attributes to all fields
        if (this.options.a11yAttributes) {
            this.$inputs.each((i, input) => this.addA11yAttributes(input));
            $globalErrors.each((i, error) => this.addGlobalErrorA11yAttributes(error));
        }

        this._events();
    }

    /**
     * Initializes events for Abide.
     * @private
     */
    _events() {
        this.$element.off('.abide')
            .on('reset.zf.abide', () => {
                this.resetForm();
            })
            .on('submit.zf.abide', () => {
                return this.validateForm();
            });

        if (this.options.validateOn === 'fieldChange') {
            this.$inputs
                .off('change.zf.abide')
                .on('change.zf.abide', (e) => {
                    this.validateInput($(e.target));
                });
        }

        if (this.options.liveValidate) {
            this.$inputs
                .off('input.zf.abide')
                .on('input.zf.abide', (e) => {
                    this.validateInput($(e.target));
                });
        }

        if (this.options.validateOnBlur) {
            this.$inputs
                .off('blur.zf.abide')
                .on('blur.zf.abide', (e) => {
                    this.validateInput($(e.target));
                });
        }
    }

    /**
     * Calls necessary functions to update Abide upon DOM change
     * @private
     */
    _reflow() {
        this._init();
    }



    /**
     * Checks whether or not a form element has the required attribute and if it's checked or not
     * @param {Element} element - DOM Element to check for required attribute
     * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
     */
    requiredCheck($el) {
        if (!$el.required) return true;

        let isGood = true;

        switch ($el.type) {
            case 'checkbox':
                isGood = $el.checked;
                break;

            case 'select':
            case 'select-one':
            case 'select-multiple':
                var opt = $el.find('option:selected');
                if (!opt.length || !opt.value) isGood = false;
                break;

            default:
                if (!$el.value || !$el.value.length) isGood = false;
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
    siblings(el, filter = '') {
        let siblings = [];
        let sibling = element.parentNode.firstChild;
        while (sibling) {
            if (sibling.nodeType === 1 && sibling !== element) {
                siblings.push(sibling);
            }
            sibling = sibling.nextSibling
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
     * - Based on $el, the first element(s) corresponding to `formErrorSelector` in this order:
     *   1. The element's direct sibling('s).
     *   2. The element's parent's children.
     * - Element(s) with the attribute `[data-form-error-for]` set with the element's id.
     *
     * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
     *
     * @param {Object} $el - DOM Element to use as reference to find the form error selector.
     * @returns {Object} DOM Element with the selector.
     */
    findFormError($el) {
        var id = $el.id;
        var $error = siblings($el, this.options.formErrorSelector);

        if (!$error.length) {
            $error = $el.parentNode.querySelector(this.options.formErrorSelector);
        }

        if (id) {
            $error = $error.psuh(this.$element.querySelector(`[data-form-error-for="${id}"]`));
        }

        return $error;
    }

    /**
     * Get the first element in this order:
     * 2. The <label> with the attribute `[for="someInputId"]`
     * 3. The `.closest()` <label>
     *
     * @param {Object} $el - DOM Element to check for required attribute
     * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
     */
    findLabel($el) {
        var id = $el.id;
        var $label = this.$element.querySelector(`label[for="${id}"]`);

        if (!$label.length) {
            return $el.closest('label');
        }

        return $label;
    }

    /**
     * Get the set of labels associated with a set of radio els in this order
     * 2. The <label> with the attribute `[for="someInputId"]`
     * 3. The `.closest()` <label>
     *
     * @param {Object} $el - DOM Element to check for required attribute
     * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
     */
    findRadioLabels($els) {
        var labels = $els.map((i, el) => {
            var id = el.id;
            var $label = this.$element.querySelector(`label[for="${id}"]`);

            if (!$label.length) {
                $label = el.closest('label');
            }
            return $label;
        });

        return [].slice.call(labels);
    }

    /**
     * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
     * @param {Object} $el - DOM Element to add the class to
     */
    addErrorClasses($el) {
        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
            $label.classList.add(this.options.labelErrorClass);
        }

        if ($formError.length) {
            $formError.classList.add(this.options.formErrorClass);
        }

        $el.classList.add(this.options.inputErrorClass)
            .setAttribute('data-invalid', '')
            .setAttribute('aria-invalid', true);
    }

    /**
     * Adds [for] and [role=alert] attributes to all form error targetting $el,
     * and [aria-describedby] attribute to $el toward the first form error.
     * @param {Object} $el - DOM Element
     */
    addA11yAttributes($el) {
        let $errors = this.findFormError($el);
        let $labels = $errors.filter('label');
        let $error = $errors.first();
        if (!$errors.length) return;

        // Set [aria-describedby] on the input toward the first form error if it is not set
        if (typeof $el.getAttribute('aria-describedby') === 'undefined') {
            // Get the first error ID or create one
            let errorId = $error.getAttribute('id');
            if (typeof errorId === 'undefined') {
                errorId = GetYoDigits(6, 'abide-error');
                $error.setAttribute('id', errorId);
            };

            $el.setAttribute('aria-describedby', errorId);
        }

        if ($labels.filter('[for]').length < $labels.length) {
            // Get the input ID or create one
            let elemId = $el.getAttribute('id');
            if (typeof elemId === 'undefined') {
                elemId = GetYoDigits(6, 'abide-input');
                $el.setAttribute('id', elemId);
            };

            // For each label targeting $el, set [for] if it is not set.
            $labels.each((i, label) => {
                const $label = $(label);
                if (typeof $label.getAttribute('for') === 'undefined')
                    $label.setAttribute('for', elemId);
            });
        }

        // For each error targeting $el, set [role=alert] if it is not set.
        $errors.each((i, label) => {
            const $label = $(label);
            if (typeof $label.getAttribute('role') === 'undefined')
                $label.setAttribute('role', 'alert');
        }).end();
    }

    /**
     * Adds [aria-live] attribute to the given global form error $el.
     * @param {Object} $el - DOM Element to add the attribute to
     */
    addGlobalErrorA11yAttributes($el) {
        if (typeof $el.getAttribute('aria-live') === 'undefined')
            $el.setAttribute('aria-live', this.options.a11yErrorLevel);
    }

    /**
     * Remove CSS error classes etc from an entire radio button group
     * @param {String} groupName - A string that specifies the name of a radio button group
     *
     */
    removeRadioErrorClasses(groupName) {
        var $els = this.$element.find(`:radio[name="${groupName}"]`);
        var $labels = this.findRadioLabels($els);
        var $formErrors = this.findFormError($els);

        if ($labels.length) {
            $labels.classList.remove(this.options.labelErrorClass);
        }

        if ($formErrors.length) {
            $formErrors.classList.remove(this.options.formErrorClass);
        }

        /* $els.classList.remove(this.options.inputErrorClass).setAttribute({
            'data-invalid': null,
            'aria-invalid': null
        }); */
        $els.classList.remove(this.options.inputErrorClass);
        $els.removeAttribute('data-invalid');
        $els.removeAttribute('aria-invalid');

    }

    /**
     * Removes CSS error class as specified by the Abide settings from the label, input, and the form
     * @param {Object} $el - DOM Element to remove the class from
     */
    removeErrorClasses($el) {
        // radios need to clear all of the els
        if ($el[0].type == 'radio') {
            return this.removeRadioErrorClasses($el.getAttribute('name'));
        }

        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
            $label.classList.remove(this.options.labelErrorClass);
        }

        if ($formError.length) {
            $formError.classList.remove(this.options.formErrorClass);
        }
        $els.classList.remove(this.options.inputErrorClass);
        $els.removeAttribute('data-invalid');
        $els.removeAttribute('aria-invalid');
        /* $el.classList.remove(this.options.inputErrorClass).attr({
            'data-invalid': null,
            'aria-invalid': null
        }); */
    }

    /**
     * Goes through a form to find inputs and proceeds to validate them in ways specific to their type.
     * Ignores inputs with data-abide-ignore, type="hidden" or disabled attributes set
     * @fires Abide#invalid
     * @fires Abide#valid
     * @param {Element} element - DOM Element to validate, should be an HTML input
     * @returns {Boolean} goodToGo - If the input is valid or not.
     */
    validateInput($el) {
        var clearRequire = this.requiredCheck($el),
            validated = false,
            customValidator = true,
            validator = $el.getAttribute('data-validator'),
            equalTo = true;

        // don't validate ignored inputs or hidden inputs or disabled inputs
        if ($el.is('[data-abide-ignore]') || $el.is('[type="hidden"]') || $el.is('[disabled]')) {
            return true;
        }

        switch ($el[0].type) {
            case 'radio':
                validated = this.validateRadio($el.getAttribute('name'));
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
                validated = this.validateText($el);
        }

        if (validator) {
            customValidator = this.matchValidation($el, validator, $el.getAttribute('required'));
        }

        if ($el.getAttribute('data-equalto')) {
            equalTo = this.options.validators.equalTo($el);
        }


        var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
        var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

        if (goodToGo) {
            // Re-validate inputs that depend on this one with equalto
            const dependentElements = this.$element.find(`[data-equalto="${$el.getAttribute('id')}"]`);
            if (dependentElements.length) {
                let _this = this;
                dependentElements.each(function () {
                    if ($(this).val()) {
                        _this.validateInput($(this));
                    }
                });
            }
        }

        this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

        /**
         * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
         * Trigger includes the DOM element of the input.
         * @event Abide#valid
         * @event Abide#invalid
         */
        $el.trigger(message, [$el]);

        return goodToGo;
    }

    /**
     * Goes through a form and if there are any invalid inputs, it will display the form error element
     * @returns {Boolean} noError - true if no errors were detected...
     * @fires Abide#formvalid
     * @fires Abide#forminvalid
     */
    validateForm() {
        var acc = [];
        var _this = this;

        this.$inputs.each(function () {
            acc.push(_this.validateInput($(this)));
        });

        var noError = acc.indexOf(false) === -1;

        this.$element.find('[data-abide-error]').each((i, elem) => {
            const $elem = $(elem);
            // Ensure a11y attributes are set
            if (this.options.a11yAttributes) this.addGlobalErrorA11yAttributes($elem);
            // Show or hide the error
            $elem.css('display', (noError ? 'none' : 'block'));
        });

        /**
         * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
         * Trigger includes the element of the form.
         * @event Abide#formvalid
         * @event Abide#forminvalid
         */
        this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

        return noError;
    }

    /**
     * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
     * @param {Object} $el - DOM Element to validate, should be a text input HTML element
     * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
     * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
     */
    validateText($el, pattern) {
        // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
        pattern = (pattern || $el.getAttribute('pattern') || $el.getAttribute('type'));
        var inputText = $el.val();
        var valid = false;

        if (inputText.length) {
            // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
            if (this.options.patterns.hasOwnProperty(pattern)) {
                valid = this.options.patterns[pattern].test(inputText);
            }
            // If the pattern name isn't also the type attribute of the field, then test it as a regexp
            else if (pattern !== $el.getAttribute('type')) {
                valid = new RegExp(pattern).test(inputText);
            } else {
                valid = true;
            }
        }
        // An empty field is valid if it's not required
        else if (!$el.prop('required')) {
            valid = true;
        }

        return valid;
    }

    /**
     * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
     * @param {String} groupName - A string that specifies the name of a radio button group
     * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
     */
    validateRadio(groupName) {
        // If at least one radio in the group has the `required` attribute, the group is considered required
        // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
        var $group = this.$element.find(`:radio[name="${groupName}"]`);
        var valid = false,
            required = false;

        // For the group to be required, at least one radio needs to be required
        $group.each((i, e) => {
            if ($(e).getAttribute('required')) {
                required = true;
            }
        });
        if (!required) valid = true;

        if (!valid) {
            // For the group to be valid, at least one radio needs to be checked
            $group.each((i, e) => {
                if ($(e).prop('checked')) {
                    valid = true;
                }
            });
        };

        return valid;
    }

    /**
     * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
     * @param {Object} $el - jQuery input element.
     * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
     * @param {Boolean} required - self explanatory?
     * @returns {Boolean} - true if validations passed.
     */
    matchValidation($el, validators, required) {
        required = required ? true : false;

        var clear = validators.split(' ').map((v) => {
            return this.options.validators[v]($el, required, $el.parent());
        });
        return clear.indexOf(false) === -1;
    }

    /**
     * Resets form inputs and styles
     * @fires Abide#formreset
     */
    resetForm() {
        const $form = this.$element;

        $form.querySelectorAll(`.${this.options.labelErrorClass}:not(small)`).forEach(node => {
            node.classList.remove(this.options.labelErrorClass);
        });
        $form.querySelectorAll(`.${this.options.inputErrorClass}:not(small)`).forEach(node => {
            node.classList.remove(this.options.inputErrorClass);
        });
        document.querySelectorAll(`${this.options.formErrorSelector}.${this.options.formErrorClass}`).forEach(node => {
            node.classList.remove(this.options.formErrorClass);
        });

        $form.find('[data-abide-error]').css('display', 'none');
        $(':input', $form).not(':button, :submit, :reset, :hidden, :radio, :checkbox, [data-abide-ignore]').val('').attr({
            'data-invalid': null,
            'aria-invalid': null
        });
        $(':input:radio', $form).not('[data-abide-ignore]').prop('checked', false).attr({
            'data-invalid': null,
            'aria-invalid': null
        });
        $(':input:checkbox', $form).not('[data-abide-ignore]').prop('checked', false).attr({
            'data-invalid': null,
            'aria-invalid': null
        });
        /**
         * Fires when the form has been reset.
         * @event Abide#formreset
         */
        $form.trigger('formreset.zf.abide', [$form]);
    }

    /**
     * Destroys an instance of Abide.
     * Removes error styles and classes from elements, without resetting their values.
     */
    _destroy() {
        var _this = this;
        this.$element
            .off('.abide')
            .find('[data-abide-error]')
            .css('display', 'none');

        this.$inputs
            .off('.abide')
            .each(function () {
                _this.removeErrorClasses($(this));
            });
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
        number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

        // amex, visa, diners
        card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(?:222[1-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
        cvv: /^([0-9]){3,4}$/,

        // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
        email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

        // From CommonRegexJS (@talyssonoc)
        // https://github.com/talyssonoc/CommonRegexJS/blob/e2901b9f57222bc14069dc8f0598d5f412555411/lib/commonregex.js#L76
        // For more restrictive URL Regexs, see https://mathiasbynens.be/demo/url-regex.
        url: /^((?:(https?|ftps?|file|ssh|sftp):\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))$/,

        // abc.de
        domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

        datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
        // YYYY-MM-DD
        date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
        // HH:MM:SS
        time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
        dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
        // MM/DD/YYYY
        month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
        // DD/MM/YYYY
        day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

        // #FFF or #FFFFFF
        color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,

        // Domain || URL
        website: {
            test: (text) => {
                return Abide.defaults.patterns['domain'].test(text) || Abide.defaults.patterns['url'].test(text);
            }
        }
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
        equalTo: function (el, required, parent) {
            return $(`#${el.getAttribute('data-equalto')}`).val() === el.val();
        }
    }
}