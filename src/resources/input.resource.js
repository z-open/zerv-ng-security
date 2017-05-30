angular.module('zimit.security')
    .factory('inputElementResource', function(securityService) {
        return {
            target: 'dom',
            apply: function applyToInputElement(element, setting) {
                securityService.getNgData('$ngModelController', element, setting);
                if (setting.value === 'disabled') {
                    element.prop('disabled', true);
                    // ngModelController.$setViewValue("10");
                } else {
                    element.prop('disabled', false);

                }
            }
        };
    });
