angular.module('zimit.security')
    .factory('htmlElementResource', function(securityService) {
        return {
            target: 'dom',
            apply: function applyToHtmlElement(element, setting) {
                if (setting.value === 'hide') {
                    element.addClass('z-policy-hide');
                } else {
                    element.removeClass('z-policy-hide');
                }
            }
        };
    });
