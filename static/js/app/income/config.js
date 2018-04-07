/**
 * Created by Diana on 11/12/2016.
 */
angular.module('Conta').config(function ($stateProvider){
    $stateProvider
        .state('app.income', {
            url: '^/income',
            templateUrl: 'static/templates/components/income/list.html',
            controller: 'incomeCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Incasari'
            },
            menu: {
                tag: 'sidebar',
                name: 'Incasari',
                priority: 200
            }
        })
        .state('app.income-edit', {
            url: '^/income/edit/:entityID',
            data: {
                displayName: 'Edit income entity'
            },
            templateUrl: 'static/templates/components/income/form.html',
            controller: 'incomeEditCtrl'
        })
        .state('app.income-add', {
            url: '^/income/add',
            data: {
                displayName: 'Add income entity'
            },
            templateUrl: 'static/templates/components/income/form.html',
            controller: 'incomeAddCtrl'
        })
        .state('app.income-delete', {
            url: '^/income/delete/:entityID',
            data: {
                displayName: 'Delete'
            },
            templateUrl: 'static/templates/components/income/form.html',
            controller: 'incomeDeleteCtrl'
        })
});