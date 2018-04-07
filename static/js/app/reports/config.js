/**
 * Created by Diana on 11/22/2016.
 */
angular.module('Conta').config(function ($stateProvider){
    $stateProvider
        .state('app.reports', {
            url: '^/reports',
            templateUrl: 'static/templates/components/reports/select.html',
            controller: 'reportsCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Rapoarte'
            },
            menu: {
                tag: 'sidebar',
                name: 'Rapoarte',
                priority: 200
            }
        })
        .state('app.statement', {
            url: '^/reports/statement',
            templateUrl: 'static/templates/components/reports/statement.html',
            controller: 'statementCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Declaratia 200'
            },
            menu: {
                tag: 'sidebar',
                name: 'Declaratia 200',
                priority: 200
            }
        })
});