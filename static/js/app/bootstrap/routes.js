/**
 * Created by Diana on 11/12/2016.
 */

Conta.config(function ($stateProvider){
    $stateProvider
        .state('app', {
            abstract: true,
            data: {
                displayName: 'Home'
            },
            views: {
                'header@app': {
                    templateUrl: 'static/templates/utils/header.html'
                },
                'menu@app': {
                    templateUrl: 'static/templates/utils/menu/menu.html'
                },
                '': {
                    templateUrl: 'static/templates/utils/index.html'
                }
            }
        })
});
