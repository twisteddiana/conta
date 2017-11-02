/**
 * Created by Diana on 11/12/2016.
 */
var Conta = angular.module('Conta', ['ui.router', 'ui.router.menus', 'ui.mask', 'oitozero.ngSweetAlert', 'ngCookies']);
Conta.run(['$rootScope', '$location', function ($rootScope, $location) {
    if ($location.path() == '')
        $location.path('/dashboard');
    $rootScope.$on('$stateChangeStart', function (event, toState, $window) {
        /*if (requireLogin && typeof $rootScope.user === 'undefined') {
            $location.path('/login');
        }*/
    });
}]);
