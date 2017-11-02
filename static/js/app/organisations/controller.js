/**
 * Created by Diana on 11/12/2016.
 */
Conta.controller("organisationsCtrl", function ($scope, $http, $state, Organisation) {
    $scope.title = "Organisations";
    $scope.subtitle = "List";
    $scope.filter = {};

    $scope.limit = 50;
    $scope.sort = 'id';
    $scope.direction = 'asc';
    $scope.offset = 0;

    function getListParams() {
        return {
            offset: $scope.offset,
            limit: $scope.limit,
            sort: $scope.sort,
            direction: $scope.direction
        }
    }

    function getList() {
        Organisation.post(getListParams())
            .success(function(data) {
                $scope.offset = data.offset;
                $scope.total_rows = data.total_rows;
                $scope.rows = data.rows;
                $scope.pages = Math.ceil($scope.total_rows/$scope.limit);
            })
    }

    getList();

    $scope.changeSort = function(column) {
        if ($scope.sort == column) {
            $scope.direction = reverseSort($scope.direction);
        } else {
            $scope.sort = column;
            $scope.direction = "asc";
        }

        getList();
    }

    function reverseSort(sort) {
        if (sort == 'asc')
            return 'desc';
        return 'asc';
    }

    $scope.edit = function(id) {;
        $state.go('app.organisations-edit', {organisationID: id})
    };
    $scope.add = function() {
        $state.go('app.organisations-add');
    };
    $scope.delete = function(id) {
        $state.go('app.organisations-delete', {organisationID: id})
    };

    $scope.clear_search = function () {
        $scope.search = "";
        $scope.execute_search();
    }

    $scope.range = function(min, max, step){
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i += step) input.push(i);
        return input;
    };

    $scope.prevPage = function() {
        $scope.page--;
        getList();

    }

    $scope.nextPage = function() {
        $scope.page++;
        getList();
    }

    $scope.setPage = function(page) {
        $scope.page = page;
        getList();
    }
});


Conta.controller("organisationsAddCtrl", function($scope, $http, Organisation, $state){
    $scope.title = 'Create organisation';
    $scope.subtitle = 'Organisations';
    $scope.item = {};
    $scope.submit = function(isValid) {
        if (isValid) {
            Organisation.create($scope.item)
                .success(function (data) {
                    $state.go('app.organisations');
                })
                .error(function (data, status) {
                    if (status == 500)
                        $scope.errors = data;
                });
        }
    }
})

Conta.controller("organisationsEditCtrl", function($scope, $http, Organisation, $state, $stateParams){
    $scope.title = 'Edit organisation';
    $scope.subtitle = 'Organisations';
    $scope.item_id = $stateParams.organisationID;
    Organisation.getOne($scope.item_id).success(function(data) {
        $scope.item = data;
    })

    $scope.submit = function(isValid) {
        Organisation.create($scope.item)
            .success(function(data) {$state.go('app.organisations');
            })
            .error(function(data, status) {
                if (status == 500)
                    $scope.errors = data;
            });
    }
})

Conta.controller("organisationsDeleteCtrl", function($scope, $http, Organisation, $state, $stateParams){
    $scope.item_id = $stateParams.organisationID;

    Organisation.delete($scope.item_id)
        .success(function(data) {
            $state.go('app.organisations');
        })
})