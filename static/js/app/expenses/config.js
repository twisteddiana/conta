/**
 * Created by Diana on 5/1/2017.
 */
angular.module('Conta').config(($stateProvider) => {
    $stateProvider
        .state('app.expenses', {
            url: '^/expenses',
            templateUrl: 'static/templates/components/expenses/list.html',
            controller: 'expensesCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Cheltuieli'
            },
            menu: {
                tag: 'sidebar',
                name: 'Cheltuieli',
                priority: 200
            }
        })
        .state('app.expenses-edit', {
            url: '^/expenses/edit/:entityID',
            data: {
                displayName: 'Edit expenses'
            },
            templateUrl: 'static/templates/components/expenses/form.html',
            controller: 'expensesEditCtrl'
        })
        .state('app.expenses-add', {
            url: '^/expenses/add',
            data: {
                displayName: 'Add expenses'
            },
            templateUrl: 'static/templates/components/expenses/form.html',
            controller: 'expensesAddCtrl'
        })
        .state('app.expenses-delete', {
            url: '^/expenses/delete/:entityID',
            data: {
                displayName: 'Delete'
            },
            templateUrl: 'static/templates/components/expenses/form.html',
            controller: 'expensesDeleteCtrl'
        })
});