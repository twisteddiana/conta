/**
 * Created by Diana on 11/22/2016.
 * Some irrelevant change
 */
angular.module('Conta').config(($stateProvider) => {
  $stateProvider
    .state('app.amortizations', {
      url: '^/amortizations',
      templateUrl: 'static/templates/components/amortizations/list.html',
      controller: 'amortizationsCtrl',
      data: {
        requireLogin: true, // this property will apply to all children of 'app'
        displayName: 'Mijloace fixe'
      },
      menu: {
        tag: 'sidebar',
        name: 'Mijloace fixe',
        priority: 200,
      }
    })
    .state('app.amortizations-edit', {
      url: '^/amortizations/edit/:entityID',
      data: {
        displayName: 'Edit amortization'
      },
      templateUrl: 'static/templates/components/amortizations/form.html',
      controller: 'amortizationsEditCtrl'
    })
    .state('app.amortizations-view', {
      url: '^/amortizations/view/:entityID',
      data: {
        displayName: 'View amortization'
      },
      templateUrl: 'static/templates/components/amortizations/view.html',
      controller: 'amortizationsViewCtrl'
    })
    .state('app.amortizations-add', {
      url: '^/amortizations/add',
      data: {
        displayName: 'Add amortization'
      },
      templateUrl: 'static/templates/components/amortizations/form.html',
      controller: 'amortizationsAddCtrl'
    })
    .state('app.amortizations-delete', {
      url: '^/amortizations/delete/:entityID',
      data: {
        displayName: 'Delete'
      },
      templateUrl: 'static/templates/components/amortizations/form.html',
      controller: 'amortizationsDeleteCtrl'
    })
});