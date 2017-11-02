/**
 * Created by Diana on 11/12/2016.
 */

Conta.config(['$httpProvider', function ($httpProvider) {
    //Reset headers to avoid OPTIONS request (aka preflight)
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
}]);

angular.module('Conta').run(['$state', '$stateParams', '$rootScope',
    function($state, $stateParams, $rootScope) {
        $rootScope.$on("$stateChangeError", console.log.bind(console));
        $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
            $rootScope.previousState = from.name;
            $rootScope.currentState = to.name;
            $rootScope.$broadcast('changeState');
            $rootScope.$emit('changeState');
        })
    }]
);