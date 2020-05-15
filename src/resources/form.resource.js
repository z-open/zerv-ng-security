/**
 * Make all fields of a form disabled.
 *
 * 
 *
 *
 */
angular.module('zerv.security')
    .factory('formResource', function($security) {
        return {
            target: 'dom',
            apply: function applyToHtmlElement(element, setting) {
                if (setting.value === 'disabled') {
                    element.prop('disabled', true);
                } else {
                    element.prop('disabled', false);
                }
            },
        };
    });

