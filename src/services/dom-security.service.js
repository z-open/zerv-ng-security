angular.module('zerv.security')
    .config(['$provide', '$injector', function($provide, $injector) {

    }])
    .factory('domSecurityService', function($q, $state, $sync, sessionUser, $injector) {
        let protectedResources;

        // --- performance indicators ----
        let checkCount = 0, maxCheckCount = 0;
        let timeoutId;
        // ------------------------------

        return {
            getNgData: getNgData,
            observeDomChanges: observeDomChanges,
            applyPolicies: applyPolicies,
            digestDom: digestDom,
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
            const data = element.data(dataName);
            if (!data) {
                throw new Error('Element located at ' + config.resource.locator + ' is not a protected resource of type ' + config.resource.type + '. Missing ' + dataName);
            }
            return data;
        }


        /**
          * Initialize DOM Observation and run 'digest dom'' task on specific DOM changes.
          */
        function observeDomChanges(excludedElementNames) {
            const observer = new MutationObserver(function(mutations) {
                let elementChanged = false;
                let classChanged = false;

                const excludedElements = findAllExcludedElements(excludedElementNames);


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

                        const nodesToCheck = concatNodes(mutation.target, mutation.addedNodes);
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

                // for performance evaluation purposes
                measureCheckCountBeforeStabilization();
            });

            observer.observe(document, {attributes: true, childList: true, subtree: true});
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
            const elementsUnderPolicy = protectedResources ? findDomElementsWhichAreProtectedResources() : [];

            if (elementsUnderPolicy.length === 0) {
                // console.debug('No DOM elements are covered by the policy.');
            } else {
                elementsUnderPolicy.forEach(function(protectedElement) {
                    applyPoliciesToProtectedElement(protectedElement.element, protectedElement.resource);
                });
            }
        }


        // /////////////////////////////////////////  


        function applyPoliciesToProtectedElement(element, protectedResource) {
            const setting = protectedResource.calculateSetting(); // computeResourceSetting(protectedElement.resource);

            const currentState = element.data('policy');
            // Has the policy changed?
            // instead of storing the setting...should store the revision number
            // because a setting might not have changed but the configuration for that setting might have changed?  ex: disabled htmt-element class param was grey-disable to white-disable... 
            // Currently we use the sync...but if we use the claim...we should keep the revision number there too!!

            if (setting.value !== (currentState ? currentState.value : null)) {
                console.debug('Apply policy to [' + protectedResource.resource.name + '] ->' + JSON.stringify(setting));
                // console.debug(element.data());
                protectedResource.apply(element, setting);
                element.data('policy', setting);
            }
            // else {
            //     console.debug('policy already applied to [' + protectedResource.resource.name + ']');
            // }
        }


        function findDomElementsWhichAreProtectedResources() {
            const protectedElements = [];
            protectedResources.forEach(function(protectedResource) {
                const elements = $(protectedResource.resource.locator);
                if (elements.length > 0) {
                    for (let n = 0; n < elements.length; n++) {
                        protectedElements.push({
                            element: elements.eq(n),
                            resource: protectedResource,
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
            const elements = [];
            _.forEach(elementNames, function(name) {
                const list = document.getElementsByTagName(name);
                _.forEach(list, function(el) {
                    elements.push(el);
                });
            });
            return elements;
        }

        function concatNodes(node, nodes) {
            const r = [];
            if (node) {
                r.push(node);
            }
            for (let n = 0; n < nodes.length; n++) {
                r.push(nodes[n]);
            }
            return r;
        }
    });


