angular.module('zerv.security')
    .factory('inputElementResource', function($security) {
        return {
            target: 'dom',
            apply: function applyToInputElement(element, setting) {
                $security.getNgData('$ngModelController', element, setting);
                if (setting.value === 'disabled') {
                    element.prop('disabled', true);
                    // ngModelController.$setViewValue("10");
                } else {
                    element.prop('disabled', false);
                }
            },
        };
    });
