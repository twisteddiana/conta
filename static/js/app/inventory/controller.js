/**
 * Created by Diana on 12/3/2016.
 */

Conta.controller("inventoryListCtrl", function ($scope, $http, $state, Inventory, SweetAlert) {
	$scope.title = "Inventar";
	$scope.subtitle = "Lista";

	$scope.design = 'default';
	$scope.limit = 50;
	$scope.sort = 'entry_date';
	$scope.direction = 'desc';
	$scope.skip = 0;


	$scope.getListParams = function() {
		return {
			design: $scope.design,
			skip: $scope.skip,
			limit: parseInt($scope.limit),
			sort: $scope.sort,
			direction: $scope.direction
		}
	}

	$scope.getList = function() {
		Inventory.post($scope.getListParams())
			.success(function (data) {
				$scope.total_rows = data.total_rows;
				$scope.rows = data.rows;
				$scope.pages = Math.ceil($scope.total_rows / $scope.limit);
			})
	}

	$scope.getList();

	$scope.edit = function(id) {;
		$state.go('app.inventory-edit', {entityID: id})
	};
	$scope.add = function() {
		$state.go('app.inventory-add');
	};
	$scope.delete = function(id) {
		SweetAlert.swal({
			title: "Are you sure?",
			text: "Your will not be able to recover this document!",
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Yes, delete it!",
			cancelButtonText: "No, cancel plx!",
			closeOnConfirm: true,
			closeOnCancel: true
		}, function(isConfirm){
			if (isConfirm) {
				$state.go('app.inventory-delete', {entityID: id})
			} else {

			}
		});

	};

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
});



Conta.controller("inventoryAddCtrl", function($scope, $http, Inventory, $controller, $state){
	$scope.title = 'Obiect nou';
	$scope.subtitle = 'Inventar';
	$scope.item = {};

	$controller('inventoryController', { $scope: $scope });

	$scope.submit = function(isValid) {
		if (isValid) {

			Inventory.create($scope.item)
				.success(function (data) {
					var entity = {
						'_id': data.id,
						'_rev': data.rev
					};
					$state.go('app.inventory');
				})
				.error(function (data, status) {
					if (status == 500)
						$scope.errors = data;
				});
		}
	}
})

Conta.controller("inventoryEditCtrl", function($scope, $http, Inventory, $state, $stateParams, $controller){
	$scope.title = 'Modificare obiect inventar';
	$scope.subtitle = 'Inventar';
	$scope.entityID = $stateParams.entityID;
	$scope.item = {}
	Inventory.getOne($scope.entityID).success(function(data) {
		$scope.item = data;
		$scope.item.entry_date = $scope.item.entry_date_clear;
		$scope.item.exit_date = $scope.item.exit_date_clear;
		$scope.subtitle = $scope.item.name;
	})

	$controller('inventoryController', { $scope: $scope });

	$scope.submit = function(isValid) {
		if (isValid) {
			Inventory.create($scope.item)
				.success(function (data) {
					var entity = {
						'_id': data.id,
						'_rev': data.rev
					};
					$state.go('app.inventory');
				})
				.error(function (data, status) {
					if (status == 500)
						$scope.errors = data;
				});
		}
	}
})

Conta.directive('bindEvent', function() {
	return {
		restrict: 'EAC',
		controller: function($scope, $element, $attrs) {
			$scope.$on('saveLog', function() {
				console.log('custom event is triggered');
			});
		}
	};
});


Conta.controller('inventoryController', function($scope, SweetAlert) {
	$scope.deleteLog = function(idx) {
		SweetAlert.swal({
			title: "Are you sure?",
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Yes, delete it!",
			cancelButtonText: "No, cancel plx!",
			closeOnConfirm: true,
			closeOnCancel: true
		}, function(isConfirm){
			if (isConfirm) {
				$scope.item.logs.splice(idx, 1);
			} else {

			}
		});

	}

	$scope.addLog = function() {
		if (typeof $scope.item.logs == 'undefined') {
			$scope.item.logs = [];
		}

		var new_log = {
			value: 0,
			inventory_value: 0,
			description: ''
		};

		if ($scope.item.logs.length) {
			var max_year = 0;
			angular.forEach($scope.item.logs, function(log) {
				if (log.year > max_year)
					max_year = log.year;
			})
			max_year++;
		} else {
			var date = new Date();
			var max_year = date.getFullYear();
		}

		new_log.year = max_year;
		$scope.item.logs.push(new_log);
	}
})