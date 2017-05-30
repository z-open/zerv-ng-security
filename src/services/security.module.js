angular
    .module('zimit.security', [])
    .run(function(securityService) {
        // this will prevent the security check to activate on quote-canvas directive changes.
        securityService.addExcludedDirective('quote-canvas');
        securityService.addExcludedDirective('z-history'); // each time canvas is modified z-history is modified even when not visible....should use ng-if instead ng-show!!!
    });
