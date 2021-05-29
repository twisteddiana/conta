angular.module('Conta').config(function ($stateProvider){
    $stateProvider
        .state('app.settings', {
            url: '^/settings',
            templateUrl: 'static/templates/components/settings/list.html',
            controller: 'settingsCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Settings'
            },
            menu: {
                tag: 'sidebar',
                name: 'Settings',
                priority: 400
            }
        })
        .state('app.settings-edit-general', {
            url: '^/settings/edit',
            data: {
                displayName: 'Edit settings'
            },
            templateUrl: 'static/templates/components/settings/form.html',
            controller: 'settingsEditCtrl'
        })
        .state('app.settings-edit', {
            url: '^/settings/edit/:year',
            data: {
                displayName: 'Edit settings'
            },
            templateUrl: 'static/templates/components/settings/form.html',
            controller: 'settingsEditCtrl'
        })
});