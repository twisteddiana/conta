/**
 * Created by Diana on 12/3/2016.
 */
Conta.config(function ($stateProvider){
    $stateProvider
        .state('app.inventory', {
            url: '^/inventory',
            templateUrl: 'static/templates/components/inventory/list.html',
            controller: 'inventoryListCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Inventar'
            },
            menu: {
                tag: 'sidebar',
                name: 'Inventar',
                priority: 200
            }
        })
        .state('app.inventory-edit', {
            url: '^/inventory/edit/:entityID',
            data: {
                displayName: 'Edit amortization'
            },
            templateUrl: 'static/templates/components/inventory/form.html',
            controller: 'inventoryEditCtrl'
        })
        .state('app.inventory-add', {
            url: '^/inventory/add',
            data: {
                displayName: 'Add inventory'
            },
            templateUrl: 'static/templates/components/inventory/form.html',
            controller: 'inventoryAddCtrl'
        })
        .state('app.inventory-delete', {
            url: '^/inventory/delete/:entityID',
            data: {
                displayName: 'Delete'
            },
            templateUrl: 'static/templates/components/inventory/form.html',
            controller: 'inventoryDeleteCtrl'
        })
});