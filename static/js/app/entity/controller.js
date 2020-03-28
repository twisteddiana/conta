/**
 * Created by Diana on 11/20/2016.
 */
const utils = require('../utils');

angular
  .module('Conta')
  .controller("entityController", function ($scope, $http, $state, Entity, $cookies) {
    $scope.filter = {};
    $scope.show_filter = false;
    $scope.filters = {
      date: {
        name: 'Data',
        type: 'range',
        format: 'date',
      },
      document_type: {
        name: 'Tip document',
        type: 'select',
        resource: 'document_type'
      },
      classification: {
        name: 'Clasificare',
        type: 'select',
        resource: 'classification'
      },
      real_amount: {
        name: 'Valoare',
        type: 'range',
        format: 'number'
      }
    };

    $scope.clean_filter = () => {
      angular.forEach($scope.filters, (filter, filter_name) => {
        if (!filter.value) {
          return
        }

        if (filter_name === 'date') {
          filter.value = {
            start_key: null,
            end_key: null
          }
        } else {
          filter.value = undefined;
          if (filter.values) {
            angular.forEach(filter.values, (value) => {
              value.checked = false;
            })
          }
        }
      });

      const params = $scope.getListParams();
      params.filter = {};
      $scope.saveCookieFilter();
      Entity
        .all(params)
        .then(data =>  {
          $scope.skip = data.skip;
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
          $scope.pages = Math.ceil($scope.total_rows/$scope.limit);
        })
    };

    $scope.execute_filter = () =>  {
      const params = $scope.getListParams();
      params.filter = {};
      $scope.saveCookieFilter();

      angular.forEach($scope.filters, (filter, filter_name) => {
        if (!filter.value) {
          return;
        }

        if (filter_name === 'date') {
          const date_filter = {};
          if (filter.value.start_key) {
            date_filter.start_key =  utils.parseDate(filter.value.start_key).getTime() / 1000;
          }
          if (filter.value.end_key) {
            date_filter.end_key =  utils.parseDate(filter.value.end_key).getTime() / 1000 + 24 * 60 * 60;
          }
          params.filter[filter_name] = date_filter;
        } else {
          params.filter[filter_name] = filter.value;
        }
      });

      Entity
        .all(params)
        .then(data => {
          $scope.skip = data.skip;
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
          $scope.pages = Math.ceil($scope.total_rows/$scope.limit);
        })
    };

    $scope.display_filter = () => $scope.show_filter = !$scope.show_filter;

    $scope.applyCookieFilter = () => {
      const filters = $cookies.getObject('filters');
      if (filters) {
        angular.forEach(filters, (value, key) => {
          if ($scope.filters[key]) {
            $scope.filters[key]['value'] = value.value
          }
        });
      }
    };

    const pagination = $cookies.getObject('pagination');
    if (pagination) {
      $scope.limit = pagination.limit;
      $scope.sort = pagination.sort;
      $scope.direction = pagination.direction;
      $scope.skip = pagination.skip;
      $scope.show_filter = pagination.show_filter;
      $scope.applyCookieFilter();
    } else {
      $scope.limit = 50;
      $scope.sort = 'date';
      $scope.direction = 'desc';
      $scope.skip = 0;
    }

    $scope.getListParams = () => ({
      design: $scope.design,
      skip: $scope.skip || 0,
      limit: parseInt($scope.limit),
      sort: $scope.sort,
      direction: $scope.direction
    });

    $scope.getList = () =>  {
      if ($scope.show_filter) {
        $scope.execute_filter();
      } else {
        Entity
          .all($scope.getListParams())
          .then(data =>  {
            $scope.total_rows = data.total_rows;
            $scope.rows = data.rows;
            $scope.pages = Math.ceil($scope.total_rows / $scope.limit);
          })
      }
    };

    $scope.changeSort = column =>  {
      if ($scope.sort === column) {
        $scope.direction = $scope.direction === 'asc' ? 'desc' : 'asc';
      } else {
        $scope.sort = column;
        $scope.direction = "asc";
      }
      $scope.getList();
    };

    $scope.saveCookie = () =>
      $cookies.putObject('pagination', {
        limit: $scope.limit,
        sort: $scope.sort,
        direction: $scope.direction,
        skip: $scope.skip,
        show_filter: $scope.show_filter,
        filters: $scope.filters
      });

    $scope.saveCookieFilter = () =>  $cookies.putObject('filters', $scope.filters);
    $scope.$watchGroup(['limit', 'sort', 'direction', 'skip', 'show_filter'], $scope.saveCookie);
  });

angular
  .module('Conta')
  .controller("entityAddCtrl", function ($scope, $http, Entity, Currency, Organisation, ExchangeRates, $controller, IncomeCalculationService) {
    $controller('bootstrapCtrl', { $scope: $scope });

    $scope.updateExchangeRate = () =>  {
      if ($scope.item.date && !utils.isValidDate($scope.item.date)) {
        $scope.item.date = '';
      }

      if ($scope.item.currency != $scope.main_currency && $scope.item.date) {
        return ExchangeRates
          .get($scope.item.currency, $scope.item.date)
          .then((data) =>  $scope.exchange_rate = data.exchange_rate);
      } else {
        $scope.exchange_rate = 1;
        return Promise.resolve();
      }
    };

    $scope.getOrganisations = () =>  {
      Organisation
        .list('name')
        .then((data) =>  $scope.organisations = data.rows);
    };

    $scope.getOrganisations();
  });
