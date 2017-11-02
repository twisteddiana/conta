/**
 * Created by Diana on 11/12/2016.
 */
Conta.config(function ($stateProvider){
    $stateProvider
        .state('app.dashboard', {
            url: '^/dashboard',
            templateUrl: 'static/templates/components/dashboard/dashboard.html',
            controller: 'dashboardCtrl',
            data: {
                requireLogin: true, // this property will apply to all children of 'app'
                displayName: 'Dashboard'
            },
            menu: {
                tag: 'sidebar',
                name: 'Dashboard',
                priority: 200
            }
        })
});