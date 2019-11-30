/**
 * Created by Diana on 11/12/2016.
 */

angular
  .module('Conta')
  .config($stateProvider => {
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
        },
        resolve: {
            authorize: ['Authorization', function (Authorization) {
              return Authorization.authorize();
            }]
        },
      })
      .state('login', {
        url: '^/login',
        templateUrl: 'static/templates/components/login/login.html',
        controller: 'loginCtrl',
        data: {
          requireLogin: false, // this property will apply to all children of 'app'
          displayName: 'Login'
        },
      })

  });
