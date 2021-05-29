angular
    .module('Conta')
    .controller("settingsCtrl", function ($scope, $http, $state, Settings) {
        $scope.title = "Settings";
        $scope.subtitle = "List";

        const getList = () => Settings.all();
        getList();

        $scope.edit = (year) => {
                if (year) {
                        return $state.go('app.settings-edit', { year: year });
                }
                return $state.go('app.settings-edit-general');
        }
    });


angular
    .module('Conta')
    .controller("settingsEditCtrl", function ($scope, $http, Settings, $state, $stateParams) {
        $scope.title = 'Edit settings';
        $scope.subtitle = 'Settings';
        $scope.year = $stateParams.year;
        if ($scope.year) {
                Settings.get($scope.year).then((data) => $scope.item = data);
        } else {
                Settings.get().then((data) => $scope.item = data);
        }


        $scope.submit = (isValid) =>
            Settings
                .create($scope.item)
                .then(() =>  $state.go('app.settings'))
                .catch(errors => $scope.errors = errors);
    });
