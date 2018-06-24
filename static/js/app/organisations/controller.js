/**
 * Created by Diana on 11/12/2016.
 */
angular
  .module('Conta')
  .controller("organisationsCtrl", function ($scope, $http, $state, Organisation) {
    $scope.title = "Organisations";
    $scope.subtitle = "List";
    $scope.filter = {};

    $scope.limit = 50;
    $scope.sort = 'id';
    $scope.direction = 'asc';
    $scope.offset = 0;

    const getListParams = () => ({
      offset: $scope.offset,
      limit: $scope.limit,
      sort: $scope.sort,
      direction: $scope.direction
    });

    const getList = () =>
      Organisation
        .all(getListParams())
        .then((data) => {
          $scope.offset = data.offset;
          $scope.total_rows = data.total_rows;
          $scope.rows = data.rows;
          $scope.pages = Math.ceil($scope.total_rows/$scope.limit);
        });
    getList();

    $scope.changeSort = (column) => {
      if ($scope.sort == column) {
        $scope.direction = $scope.direction === 'asc' ? 'desc' : 'asc';
      } else {
        $scope.sort = column;
        $scope.direction = "asc";
      }
      getList();
    };

    $scope.edit = (id) => $state.go('app.organisations-edit', { organisationID: id });
    $scope.add = () => $state.go('app.organisations-add');
    $scope.delete = (id) => $state.go('app.organisations-delete', { organisationID: id });

    $scope.clear_search = () => {
      $scope.search = "";
      $scope.execute_search();
    };

    $scope.range = (min, max, step) => {
      step = step || 1;
      const input = [];
      for (let i = min; i <= max; i += step) input.push(i);
      return input;
    };

    $scope.prevPage = () => $scope.page-- && getList();

    $scope.nextPage = () => $scope.page++ && getList();

    $scope.setPage = (page) => {
      $scope.page = page;
      getList();
    }
  });

angular
  .module('Conta')
  .controller("organisationsAddCtrl", function ($scope, $http, Organisation, $state) {
    $scope.title = 'Create organisation';
    $scope.subtitle = 'Organisations';
    $scope.item = {};
    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }

      Organisation
        .create($scope.item)
        .then((data) => $state.go('app.organisations'))
        .catch(errors => $scope.errors = errors);
    }
  });

angular
  .module('Conta')
  .controller("organisationsEditCtrl", function ($scope, $http, Organisation, $state, $stateParams) {
    $scope.title = 'Edit organisation';
    $scope.subtitle = 'Organisations';
    $scope.item_id = $stateParams.organisationID;
    Organisation.get($scope.item_id).then((data) => $scope.item = data);

    $scope.submit = (isValid) =>
      Organisation
        .create($scope.item)
        .then(() =>  $state.go('app.organisations'))
        .catch(errors => $scope.errors = errors);
  });

angular
  .module('Conta')
  .controller("organisationsDeleteCtrl", function ($scope, $http, Organisation, $state, $stateParams) {
    $scope.item_id = $stateParams.organisationID;

    Organisation
      .delete($scope.item_id)
      .then(() =>  $state.go('app.organisations'));
  });
