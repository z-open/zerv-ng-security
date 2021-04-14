angular.module('zerv.security')
    .factory('uiStateResource', function($transitions, $state, $timeout, $security) {
        let deniedStates = [];

        $transitions.onSuccess({}, () => {
            const denied = _.find(deniedStates, function(deniedState) {
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
                let denied = _.find(deniedStates, function(denied) {
                    return denied.stateName === stateName;
                });
                if (!denied) {
                    if (setting.value === 'deny') {
                        denied = {
                            stateName: stateName,
                            value: setting.value,
                            redirect: setting.redirect,
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
            },
        };

        // ////////////////////////
        function redirect(denied) {
            const newState = denied.redirect || '/';
            console.debug('State [' + denied.stateName + '] is denied by policy. Redirected to ' + newState);
            return $state.go(newState);
        }
    });
