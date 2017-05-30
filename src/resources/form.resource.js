/**
 * Make all fields of a form disabled.
 *
 * 
 *
 *
 */
angular.module('zimit.security')
    .factory('formResource', function(securityService) {

        return {
            target: 'dom',
            apply: function applyToHtmlElement(element, setting) {
                if (setting.value === 'disabled') {
                    element.prop('disabled', true);
                } else {
                    element.prop('disabled', false);
                }
            }
        };
    });

