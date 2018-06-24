/**
 * Created by Diana on 12/3/2016.
 */

angular
  .module('Conta')
  .controller("inventoryListCtrl", function ($scope, $http, $state, Inventory, SweetAlert) {
    $scope.title = "Inventar";
    $scope.subtitle = "Lista";

    $scope.design = 'default';
    $scope.limit = 50;
    $scope.sort = 'entry_date';
    $scope.direction = 'desc';
    $scope.skip = 0;


    $scope.getListParams = () => ({
      design: $scope.design,
      skip: $scope.skip,
      limit: parseInt($scope.limit),
      sort: $scope.sort,
      direction: $scope.direction
    });

    $scope.getList = () =>
      Inventory
        .all($scope.getListParams())
        .then(data => {
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
          $scope.pages = Math.ceil($scope.total_rows / $scope.limit);
        });

    $scope.getList();
    $scope.edit = (id) => $state.go('app.inventory-edit', {entityID: id});
    $scope.add = () => $state.go('app.inventory-add');
    $scope.delete = (id) =>
      SweetAlert.swal(
        {
          title: "Are you sure?",
          text: "Your will not be able to recover this document!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "No, cancel plx!",
          closeOnConfirm: true,
          closeOnCancel: true
        },
        (isConfirm) => isConfirm && $state.go('app.inventory-delete', {entityID: id}));

    $scope.changeSort = (column) => {
      if ($scope.sort == column) {
        $scope.direction = $scope.direction === 'asc' ? 'desc' : 'asc';
      } else {
        $scope.sort = column;
        $scope.direction = "asc";
      }

      $scope.getList();
    };
  });

angular
  .module('Conta')
  .controller("inventoryAddCtrl", function ($scope, $http, Inventory, $controller, $state) {
    $scope.title = 'Obiect nou';
    $scope.subtitle = 'Inventar';
    $scope.item = {};

    $controller('inventoryController', { $scope: $scope });
    $controller('bootstrapCtrl', { $scope });
    $scope.loadCurrencies();

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }
      Inventory.create($scope.item)
        .then(() => $state.go('app.inventory'))
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .controller("inventoryEditCtrl", function ($scope, $http, Inventory, $state, $stateParams, $controller) {
    $scope.title = 'Modificare obiect inventar';
    $scope.subtitle = 'Inventar';
    $scope.entityID = $stateParams.entityID;
    $scope.item = {}
    Inventory
      .get($scope.entityID)
      .then((data) => {
        $scope.item = data;
        $scope.item.entry_date = $scope.item.entry_date_clear;
        $scope.item.exit_date = $scope.item.exit_date_clear;
        $scope.subtitle = $scope.item.name;
      })

    $controller('inventoryController', { $scope: $scope });

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }
      Inventory
        .create($scope.item)
        .then(() => $state.go('app.inventory'))
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .directive('bindEvent', () => ({
    restrict: 'EAC',
    controller: function ($scope) { $scope.$on('saveLog', () => console.log('custom event is triggered')) }
  }));

angular
  .module('Conta')
  .controller('inventoryController', function ($scope, SweetAlert) {
    $scope.deleteLog = (idx) =>
      SweetAlert.swal(
        {
          title: "Are you sure?",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "No, cancel plx!",
          closeOnConfirm: true,
          closeOnCancel: true
        },
        isConfirm => isConfirm && $scope.item.logs.splice(idx, 1));

    $scope.addLog = () => {
      $scope.item.logs = $scope.item.logs || [];

      const new_log = {
        value: 0,
        inventory_value: 0,
        description: '',
        year: (new Date()).getFullYear()
      };

      if ($scope.item.logs.length) {
        new_log.year = 0;
        angular.forEach($scope.item.logs, (log) => {
          if (log.year > new_log.year)
            new_log.year = log.year;
        });
        new_log.year++;
      }

      $scope.item.logs.push(new_log);
    }
  });
