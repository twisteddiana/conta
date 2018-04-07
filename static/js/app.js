window.$ = window.jQuery = require('jquery');

require('bootstrap');
require('angular');
require('angular-cookies');
require('angular-file-upload');
require('angular-ui-mask');
require('@uirouter/angularjs');
require('angular-ui-router-menus');
require('sweetalert2');
require('angular-sweetalert');
require('angular-sanitize')

const Conta = angular.module('Conta', ['ui.router', 'ui.router.menus', 'ui.mask', 'oitozero.ngSweetAlert', 'ngCookies', 'ngSanitize']);
Conta.run(['$rootScope', '$location', function ($rootScope, $location) {
    if ($location.path() == '')
        $location.path('/dashboard');
    $rootScope.$on('$stateChangeStart', function (event, toState, $window) {
        /*if (requireLogin && typeof $rootScope.user === 'undefined') {
            $location.path('/login');
        }*/
    });
}]);

require('./app/bootstrap');
require('./app/dashboard');
require('./app/amortizations');
require('./app/entity');
require('./app/expenses');
require('./app/income');
require('./app/inventory');
require('./app/organisations');
require('./app/payments');
require('./app/reports');
