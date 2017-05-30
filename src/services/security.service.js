angular.module('zerv.security')
    .config(['$provide', '$injector', function($provide, $injector) {

    }])
    .factory('$security', function($q, $state, $sync, sessionUser, $injector, domSecurityService) {

        var userPolicy,
            excludedDomElements = [];

        subscribeToPolicy()
            .waitForDataReady().then(function(data) {
                domSecurityService.observeDomChanges(excludedDomElements);
            });

        return {
            getNgData: domSecurityService.getNgData,
            addExcludedDirective: addExcludedDirective
        };

        /**
         * When the security checks the dom, it will not run on the descendants of an excluded directive element.
         *
         * Ex: By excluding 'quote-canvas', any modification of this element descendants will not active their security checks.
         * quote-canvas directive is very demanding and modifies Dom a lot when the user moves the mouse.
         *
         * @param <string> elementName to exclude from the security check
         */
        function addExcludedDirective(elementName) {
            excludedDomElements.push(elementName);
        }


        ///////////////////////////////////////////        

        function subscribeToPolicy() {
            return $sync.subscribe(
                'security.sync')
                .setSingle(true)

                .setOnReady(function(securityData) {
                    /* eslint-disable no-undef */
                    userPolicy = new UserPolicy(securityData, getPolicyConditionFactory, getResourceTypeFactory);
                    /* eslint-enable no-undef */
                    applyPoliciesToUiRouterRelatedProtectedResources(userPolicy.getProtectedResourcesByTarget('uiRouter'));
                    domSecurityService.applyPolicies(userPolicy.getProtectedResourcesByTarget('dom'));
                })
                .syncOn();
        }

        /**
        * Apply policies to ui router.
        */
        function applyPoliciesToUiRouterRelatedProtectedResources(protectedResources) {
            if (protectedResources && protectedResources.length) {
                protectedResources.forEach(function(protectedResource) {
                    protectedResource.apply(protectedResource.resource.locator, protectedResource.calculateSetting());
                });
            } else {
                // Hack...remove protection (admin role does not have protected resources)
                getResourceTypeFactory({name:'uiState'}).clear();
            }
        }



        /***
         * Based on their type, resource have different ways of applying policing.
         *
         * Ex: htmlElement might hide or show, while uiState resource might allow or deny a state.
         *
         * This provide the implementation to apply.
         *
         * @returns the function that will be executed to apply the policy resource setting to a resource of the dictionary.
         *
         *
         */
        function getResourceTypeFactory(resourceType) {
            return $injector.get(resourceType.name + 'Resource');
        }


        /**
         * Policy have settings that might be based conditions. This condition must return true in order to make the policy effective.
         * If a policy is effective, the status of protected resources listed under a policy setting will be applied. 
         *
         * Condition are organized in security group.
         * ex:
         *      opportunity.checkIfOpportunityBelongsToUser
         *
         * A factory for a group of conditions must be created to find the proper implementation to execute.
         *
         * ex: opportunitySecurity
         *
         *  which would define the implementation of checkIfOpportunityBelongsToUser
         *
         * returns the factory that is supposed to contain a function to execute to the check if the policy is applicable based on current data context.
         *
         */
        function getPolicyConditionFactory(factoryName) {
            return $injector.get(factoryName + 'Security');
        }

    });



