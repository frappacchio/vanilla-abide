import Abide from '../src/abide';

describe('Abide', () => {
  let plugin;
  let htmlString;
  let myForm;

  afterEach(() => {
    myForm.parentNode.removeChild(myForm);
    plugin = null;
    myForm = null;
  });

  describe('constructor()', () => {
    it('stores the element & plugin options', () => {
      htmlString = '<form data-abide novalidate></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm, {});
      expect(typeof plugin).toBe('object');
      expect(typeof plugin.options).toBe('object');
    });

    it('the options are recursively merged', () => {
      htmlString = '<form data-abide novalidate></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');

      const options = {
        validators: {
          notEqualTo(el) {
            const element = document.querySelector(`#${el.getAttribute('data-equalto')}`);
            return element.value !== el.value;
          },
        },
      };

      plugin = new Abide(myForm, options);
      expect(Object.prototype.hasOwnProperty.call(plugin.options.validators, 'equalTo')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(plugin.options.validators, 'notEqualTo')).toBeTruthy();
    });
  });

  describe('validateInput()', () => {
    it('returns true for hidden inputs', () => {
      htmlString = '<form data-abide novalidate><input type="hidden" required></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      expect(plugin.validateInput(myForm.querySelector('input'))).toBeTruthy();
    });

    it('returns true for inputs with [data-abide-ignore]', () => {
      htmlString = "<form data-abide novalidate><input type='text' required data-abide-ignore></form>";
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      expect(plugin.validateInput(myForm.querySelector('input'))).toBeTruthy();
    });

    it('returns true for checked checkboxes', () => {
      htmlString = "<form data-abide><input id='myCheckbox' type='checkbox' required checked='checked'></form>";
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      expect(plugin.validateInput(myForm.querySelector('input'))).toBeTruthy();
    });

    it('returns false for unchecked checkboxes', () => {
      htmlString = '<form data-abide><input type=\'checkbox\' required></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      expect(plugin.validateInput(myForm.querySelector('input'))).toBeFalsy();
    });

    it('returns true for selected select option', () => {
      htmlString = "<form data-abide><select required><option value=''></option><option value='One'>One</option><option value='Two' selected='selected'>Two</option></select></form>";
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      const selectValue = myForm.querySelector('select').value;
      expect(plugin.validateInput(myForm.querySelector('select'))).toBeTruthy();
      expect(selectValue).toBe('Two');
    });

    it('returns empty value for unselected select option', () => {
      htmlString = "<form data-abide><select required><option value=''></option><option value='One'>One</option><option value='Two'>Two</option></select></form>";
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      const selectValue = myForm.querySelector('select').value;
      expect(selectValue).toBe('');
    });
  });

  describe('addErrorClasses()', () => {
    it('adds aria-invalid attribute to element', () => {
      htmlString = '<form data-abide><input type="text"></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      plugin.addErrorClasses(myForm.querySelector('input'));
      expect(myForm.querySelector('input').getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('addGlobalErrorA11yAttributes()', () => {
    it('adds [aria-live] attribute on element', () => {
      htmlString = '<form data-abide><span data-abide-error></span></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm, {
        a11yErrorLevel: 'test-level',
      });
      plugin.validateForm();
      expect(myForm.querySelector('[data-abide-error]').getAttribute('aria-live')).toBe('test-level');
    });
  });

  describe('addA11yAttributes()', () => {
    it('adds [aria-describedby] attribute to field and [for] attribute to form error', () => {
      htmlString = `
        <form data-abide>
          <input type="text" id="test-input">
          <label class="form-error" id="test-error">Form error</label>
        </form>
      `;
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      plugin.addA11yAttributes(myForm.querySelector('input'));
      expect(myForm.querySelector('input').getAttribute('aria-describedby')).toBe('test-error');
      expect(myForm.querySelector('label.form-error').getAttribute('for')).toBe('test-input');
    });

    it('adds attributes and ids when no id is set', () => {
      htmlString = `
        <form data-abide>
          <input type="text">
          <label class="form-error">Form error</label>
        </form>
      `;
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      plugin.addA11yAttributes(myForm.querySelector('input'));

      const errorId = myForm.querySelector('.form-error').getAttribute('id');
      expect(myForm.querySelector('.form-error').hasAttribute('id')).toBeTruthy();
      expect(myForm.querySelector('input').getAttribute('aria-describedby')).toBe(errorId);

      const inputId = myForm.querySelector('input').getAttribute('id');
      expect(myForm.querySelector('input').hasAttribute('id')).toBeTruthy();
      expect(myForm.querySelector('.form-error').getAttribute('for')).toBe(inputId);
    });
  });

  describe('removeErrorClasses()', () => {
    it('removes aria-invalid attribute from element', () => {
      htmlString = '<form data-abide><input type="text"></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      // Add error classes first
      plugin.addErrorClasses(myForm.querySelector('input'));
      plugin.removeErrorClasses(myForm.querySelector('input'));
      expect(myForm.querySelector('input').hasAttribute('aria-invalid')).toBeFalsy();
    });
  });

  describe('removeRadioErrorClasses()', () => {
    it('removes aria-invalid attribute from radio group', () => {
      htmlString = '<form data-abide><input type="radio" name="groupName"></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      // Add error classes first
      plugin.addErrorClasses(myForm.querySelector('input'));

      plugin.removeRadioErrorClasses('groupName');
      expect(myForm.querySelector('input').hasAttribute('aria-invalid')).toBeFalsy();
    });
  });

  describe('resetForm()', () => {
    it('removes aria-invalid attribute from elements', () => {
      htmlString = '<form data-abide><input type="text"></form>';
      document.querySelector('body').insertAdjacentHTML('beforeend', htmlString);
      myForm = document.querySelector('form');
      plugin = new Abide(myForm);
      // Add error classes first
      plugin.addErrorClasses(myForm.querySelector('input'));

      plugin.resetForm();
      expect(myForm.querySelector('input').hasAttribute('aria-invalid')).toBeFalsy();
    });
  });
});
