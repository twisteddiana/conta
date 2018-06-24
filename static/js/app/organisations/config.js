/**
 * Created by Diana on 11/12/2016.
 */
angular.module('Conta').config(function ($stateProvider){
  $stateProvider
    .state('app.organisations', {
      url: '^/organisations',
      templateUrl: 'static/templates/components/organisations/list.html',
      controller: 'organisationsCtrl',
      data: {
        requireLogin: true, // this property will apply to all children of 'app'
        displayName: 'Organizatii'
      },
      menu: {
        tag: 'sidebar',
        name: 'Organizatii',
        priority: 200
      }
    })
    .state('app.organisations-edit', {
      url: '^/organisations/edit/:organisationID',
      data: {
        displayName: 'Edit Organisation'
      },
      templateUrl: 'static/templates/components/organisations/form.html',
      controller: 'organisationsEditCtrl'
    })
    .state('app.organisations-add', {
      url: '^/organisations/add',
      data: {
        displayName: 'Add company'
      },
      templateUrl: 'static/templates/components/organisations/form.html',
      controller: 'organisationsAddCtrl'
    })
    .state('app.organisations-delete', {
      url: '^/organisations/delete/:organisationID',
      data: {
        displayName: 'Delete'
      },
      templateUrl: 'static/templates/components/organisations/form.html',
      controller: 'organisationsDeleteCtrl'
    })
});