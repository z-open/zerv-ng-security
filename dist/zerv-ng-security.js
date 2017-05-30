(function() {
"use strict";

angular.module('zimit.security')
    .config(['$provide', '$injector', function($provide, $injector) {

    }])
    .run(["securityService", function(securityService) { }])
    .factory('securityService', ["$q", "$state", "$sync", "sessionUser", "$injector", "domSecurityService", function($q, $state, $sync, sessionUser, $injector, domSecurityService) {

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

    }]);
}());

(function() {
"use strict";

/**
 * Make all fields of a form disabled.
 *
 * 
 *
 *
 */
angular.module('zimit.security')
    .factory('formResource', ["securityService", function(securityService) {

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
    }]);
}());

(function() {
"use strict";

angular.module('zimit.security')
    .factory('htmlElementResource', ["securityService", function(securityService) {
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
    }]);
}());

(function() {
"use strict";

angular.module('zimit.security')
    .factory('inputElementResource', ["securityService", function(securityService) {
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
    }]);
}());

(function() {
"use strict";

angular.module('zimit.security')
    .factory('uiStateResource', ["$rootScope", "$state", "$timeout", "securityService", function($rootScope, $state, $timeout, securityService) {

        var deniedStates = [];

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState) {
            // console.log(toState.parent);

            // if (toState.redirectTo) {
            //     var denied = _.find(deniedStates, function(deniedState) {
            //         return !!$state.$current.includes[deniedState.resource.locator];
            //         // return toState.redirectTo.indexOf(deniedState.resource.locator) === 0;
            //     });
            //     if (denied) {
            //         event.preventDefault();
            //     }
            //     //$state.go(toState.redirectTo, toParams);
            // }
        });


        $rootScope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams) {
                var denied = _.find(deniedStates, function(deniedState) {
                    return $state.includes(deniedState.stateName);
                });
                if (denied) {
                    redirect(denied);
                }
            });

        return {
            target: 'uiRouter',
            clear: function() {
                // remove any denied states (admin role does not have any)
                deniedStates.length = 0;
            },
            apply: function applyToStateChange(stateName, setting) {
                var denied = _.find(deniedStates, function(denied) {
                    return denied.stateName === stateName;
                });
                if (!denied) {
                    if (setting.value === 'deny') {
                        denied = {
                            stateName: stateName,
                            value: setting.value,
                            redirect: setting.redirect
                        };
                        deniedStates.push(denied);

                        if ($state.includes(stateName)) {
                            redirect(denied);
                        };
                    }
                } else if (setting.value !== 'deny') {
                    _.remove(deniedStates, function(denied) {
                        return denied.stateName === stateName;
                    });
                }
            }
        };

        //////////////////////////
        function redirect(denied) {
            var newState = denied.redirect || '/';
            console.debug('State [' + denied.stateName + '] is denied by policy. Redirected to ' + newState);
            return $state.go(newState);
        }

    }]);
}());

(function() {
"use strict";

angular.module('zimit.security')
    .config(['$provide', '$injector', function($provide, $injector) {

    }])
    .run(["securityService", function(securityService) { }])
    .factory('domSecurityService', ["$q", "$state", "$sync", "sessionUser", "$injector", function($q, $state, $sync, sessionUser, $injector) {

        var protectedResources;

        // --- performance indicators ----
        var checkCount = 0, maxCheckCount = 0;
        var timeoutId;
        // ------------------------------

        return {
            getNgData: getNgData,
            observeDomChanges: observeDomChanges,
            applyPolicies: applyPolicies,
            digestDom: digestDom
        };



        /**
         * get the data related to angular in a dom element.
         *
         *
         * @param <string> dataName : Name of the element data key, ex: $scope, $ngModelController 
         *
         * @returns the object stored in the element data or throw an exception if the key is not present as expected.
         *  */
        function getNgData(dataName, element, config) {
            var data = element.data(dataName);
            if (!data) {
                throw new Error('Element located at ' + config.resource.locator + ' is not a protected resource of type ' + config.resource.type + '. Missing ' + dataName);
            }
            return data;
        }



        /**
          * Initialize DOM Observation and run 'digest dom'' task on specific DOM changes.
          */
        function observeDomChanges(excludedElementNames) {
            var observer = new MutationObserver(function(mutations) {
                var elementChanged = false;
                var classChanged = false;

                var excludedElements = findAllExcludedElements(excludedElementNames);



                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        // Elements can be added to the dom or removed
                        // ------------------------------------------
                        // when elements are added, the mutation target contains the parents of all elements added, and mutation.addedNodes, the nodes added
                        // When elements are removed, the mutation target contains the parents of all elements removed, and mutation.removeNodes, the nodes removed (the nodes provided do no contain a parent property since they are no longer part of the DOM.)
                        //
                        // and check if the elements provided do not require a security check. It would be the case if they are excluded in our configuration.
                        //
                        // 

                        var nodesToCheck = concatNodes(mutation.target, mutation.addedNodes);
                        if (_.some(nodesToCheck,
                            function(node) {
                                return checkIfNodeNeedsSecurityCheck(node, excludedElements);
                            })) {
                            // nodesToCheck.forEach(console.log);
                            elementChanged = true;
                        }

                    } else if (mutation.type === 'attributes' &&
                        mutation.attributeName === 'class' &&
                        checkIfNodeNeedsSecurityCheck(mutation.target, excludedElements)) {
                        // here mutation target contains the parent of the element that has changed classes.
                        classChanged = true;
                    }
                });
                if (elementChanged || classChanged) {
                    // console.debug('Security Check DOM (E:' + elementChanged + ',C:' + classChanged + ')');
                    digestDom();
                    checkCount++;
                }

                //for performance evaluation purposes
                measureCheckCountBeforeStabilization();

            });

            observer.observe(document, { attributes: true, childList: true, subtree: true });
        }



        /**
         * apply the new policies to the dom
         *
         * @param <array> of protected resources containing all policy and setting information
         *
         *
         */
        function applyPolicies(domProtectedResources) {
            protectedResources = domProtectedResources;
            digestDom();
        }

        /**
         * check the dom now for any protected resource.
         * If any are found, apply the settings defined in user policies as necessary
         *
         */
        function digestDom() {

            var elementsUnderPolicy = protectedResources ? findDomElementsWhichAreProtectedResources() : [];

            if (elementsUnderPolicy.length === 0) {
                //console.debug('No DOM elements are covered by the policy.');
            } else {
                elementsUnderPolicy.forEach(function(protectedElement) {
                    applyPoliciesToProtectedElement(protectedElement.element, protectedElement.resource);
                });

            }
        }



        ///////////////////////////////////////////  


        function applyPoliciesToProtectedElement(element, protectedResource) {

            var setting = protectedResource.calculateSetting(); //computeResourceSetting(protectedElement.resource);

            var currentState = element.data('policy');
            // Has the policy changed?
            // instead of storing the setting...should store the revision number
            // because a setting might not have changed but the configuration for that setting might have changed?  ex: disabled htmt-element class param was grey-disable to white-disable... 
            // Currently we use the sync...but if we use the claim...we should keep the revision number there too!!

            if (setting !== currentState) {
                console.debug('Apply policy to [' + protectedResource.resource.name + '] ->' + JSON.stringify(setting));
                // console.debug(element.data());
                protectedResource.apply(element, setting);
                element.data('policy', protectedResource.setting);
            }
            else {
 //               console.debug('policy already applied to [' + protectedResource.resource.name + ']');
            }
        }



        function findDomElementsWhichAreProtectedResources() {
            var protectedElements = [];
            protectedResources.forEach(function(protectedResource) {
                var elements = $(protectedResource.resource.locator);
                if (elements.length > 0) {
                    for (var n = 0; n < elements.length; n++) {
                        protectedElements.push({
                            element: elements.eq(n),
                            resource: protectedResource
                        });
                    }
                }
            });
            return protectedElements;
        }




        /**
         * for performance evaluation purposes
         *
         */
        function measureCheckCountBeforeStabilization() {
            window.clearTimeout(timeoutId);
            window.setTimeout(function() {
                if (checkCount > maxCheckCount) {
                    maxCheckCount = checkCount;
                }
                if (checkCount > 0) {
                    // console.debug('Check Security [' + checkCount + '] times before dom stabilization. Maximum so far:' + maxCheckCount);
                }
                checkCount = 0;
            }, 500);
        }


        /**
         * Check if the nodes are excluded from the security check
         * 
         */
        function checkIfNodeNeedsSecurityCheck(node, ancestors) {
            return !isSvgNode(node) && !_.some(ancestors, function(ancestor) {
                return ancestor.contains(node);
            });
        }

        /**
         * some nodes are svg nodes. We chose to not check these (no security to svg)
         */
        function isSvgNode(node) {
            // Notes: in phantomjs node seems not have class name(mutationObserver seems not implemented properly)
            return node.constructor.name && node.constructor.name.indexOf('SVG') === 0;
        }

        /**
         * All nodes modified in the DOM should NOT trigger an security check. The following and their descendants will be excluded;
         *
         * 
         */
        function findAllExcludedElements(elementNames) {
            var elements = [];
            _.forEach(elementNames, function(name) {
                var list = document.getElementsByTagName(name);
                _.forEach(list, function(el) {
                    elements.push(el);
                });
            });
            return elements;
        }

        function concatNodes(node, nodes) {
            var r = [];
            if (node) {
                r.push(node);
            }
            for (var n = 0; n < nodes.length; n++) {
                r.push(nodes[n]);
            }
            return r;

        }
    }]);
}());

(function() {
"use strict";

angular
    .module('zimit.security', [])
    .run(["securityService", function(securityService) {
        // this will prevent the security check to activate on quote-canvas directive changes.
        securityService.addExcludedDirective('quote-canvas');
        securityService.addExcludedDirective('z-history'); // each time canvas is modified z-history is modified even when not visible....should use ng-if instead ng-show!!!
    }]);
}());
