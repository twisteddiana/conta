/**
 * Created by Diana on 11/20/2016.
 */
Conta.controller("entityController", function ($scope, $http, $state, Entity, $cookies) {
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

    $scope.execute_filter = function() {
        var params = $scope.getListParams();
        params.filter = {};
        $scope.saveCookieFilter();

        angular.forEach($scope.filters, function(filter, filter_name) {
            if (typeof filter.value != 'undefined') {
                if (filter_name == 'date') {
                    var date_filter = {}
                    if (typeof filter.value.start_key != 'undefined') {
                        date_filter['start_key'] =  parseDate(filter.value.start_key).getTime() / 1000;
                    }
                    if (typeof filter.value.end_key != 'undefined') {
                        date_filter['end_key'] =  parseDate(filter.value.end_key).getTime() / 1000;
                    }
                    params.filter[filter_name] = date_filter;
                } else
                    params.filter[filter_name] = filter.value;
            }
        })

        Entity.post(params).success(function(data) {
            $scope.skip = data.skip;
            $scope.total_rows = data.total_rows;
            $scope.rows = data.rows;
            $scope.pages = Math.ceil($scope.total_rows/$scope.limit);
        })
    }

    $scope.display_filter = function() {
        $scope.show_filter = !$scope.show_filter;
    }

    $scope.applyCookieFilter = function() {
        var filters = $cookies.getObject('filters');
        if (filters) {
            angular.forEach(filters, function (value, key) {
                if (typeof $scope.filters[key] != 'undefined') {
                    $scope.filters[key]['value'] = value.value;
                }
            })
        }
    }

    var pagination = $cookies.getObject('pagination');
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

    $scope.getListParams = function() {
        if (!$scope.skip)
            $scope.skip = 0;
        return {
            design: $scope.design,
            skip: $scope.skip,
            limit: parseInt($scope.limit),
            sort: $scope.sort,
            direction: $scope.direction
        }
    }

    $scope.getList = function() {
        if ($scope.show_filter) {
            $scope.execute_filter();
        } else {
            Entity.post($scope.getListParams())
                .success(function (data) {
                    $scope.total_rows = data.total_rows;
                    $scope.rows = data.rows;
                    $scope.pages = Math.ceil($scope.total_rows / $scope.limit);
                })
        }
    }

    $scope.changeSort = function(column) {
        if ($scope.sort == column) {
            $scope.direction = reverseSort($scope.direction);
        } else {
            $scope.sort = column;
            $scope.direction = "asc";
        }

        $scope.getList();
    }

    function reverseSort(sort) {
        if (sort == 'asc')
            return 'desc';
        return 'asc';
    }

    $scope.saveCookie =  function() {
        $cookies.putObject('pagination', {
            limit: $scope.limit,
            sort: $scope.sort,
            direction: $scope.direction,
            skip: $scope.skip,
            show_filter: $scope.show_filter,
            filters: $scope.filters
        });
    }

    $scope.saveCookieFilter = function() {
        $cookies.putObject('filters', $scope.filters);
    }

    $scope.$watchGroup(['limit', 'sort', 'direction', 'skip', 'show_filter'], $scope.saveCookie)
})

Conta.controller("entityAddCtrl", function($scope, $http, Entity, Currency, Organisation, ExchangeRates, $state){
    $scope.getCurrencies = function() {
        Currency.get().success(function(data) {
            $scope.currencies = data.rows;

            $scope.currencies.forEach(function(currency) {
                if (currency.doc.main) {
                    $scope.item.currency = currency.doc.iso;
                    $scope.main_currency = currency.doc.iso;
                    $scope.exchange_rate = 1;
                }
            })
        })
    }
    $scope.getCurrencies();

    $scope.$watch('item.date', $scope.updateExchangeRate);
    $scope.$watch('item.currency', $scope.updateExchangeRate);

    $scope.updateExchangeRate = function() {
        if ($scope.item.date && !isValidDate($scope.item.date)) {
            $scope.item.date = '';
        }

        if ($scope.item.currency != $scope.main_currency && $scope.item.date) {
            ExchangeRates.get($scope.item.currency, $scope.item.date).success(function (data) {
                $scope.exchange_rate = data.rows[0].value;
            });
        } else {
            $scope.exchange_rate = 1;
        }
    }

    $scope.getOrganisations = function() {
        Organisation.get('name').success(function(data) {
            $scope.organisations = data.rows;
        })
    }

    $scope.getOrganisations();
})