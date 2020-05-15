angular.module('zerv.security')
    .factory('htmlElementResource', function($security) {
        return {
            target: 'dom',
            apply: function applyToHtmlElement(element, setting) {
                if (setting.value === 'hide') {
                    element.addClass('z-policy-hide');
                } else {
                    element.removeClass('z-policy-hide');
                }
            },
        };
    });
