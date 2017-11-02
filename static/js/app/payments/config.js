/**
 * Created by Diana on 11/12/2016.
 */
Conta.config(function ($stateProvider){
    $stateProvider
        .state('app.payments', {
            url: '^/payments',
            templateUrl: 'static/templates/components/payments/list.html',
            controller: 'paymentsCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Plati'
            },
            menu: {
                tag: 'sidebar',
                name: 'Plati',
                priority: 200
            }
        })
        .state('app.payments-edit', {
            url: '^/payments/edit/:entityID',
            data: {
                displayName: 'Edit payment entity'
            },
            templateUrl: 'static/templates/components/payments/form.html',
            controller: 'paymentsEditCtrl'
        })
        .state('app.payments-add', {
            url: '^/payments/add',
            data: {
                displayName: 'Add payment entity'
            },
            templateUrl: 'static/templates/components/payments/form.html',
            controller: 'paymentsAddCtrl'
        })
        .state('app.payments-delete', {
            url: '^/payments/delete/:entityID',
            data: {
                displayName: 'Delete'
            },
            templateUrl: 'static/templates/components/payments/form.html',
            controller: 'paymentsDeleteCtrl'
        })
});