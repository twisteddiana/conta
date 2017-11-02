/**
 * Created by Diana on 5/1/2017.
 */
Conta.controller("expensesCtrl", function ($scope, $http, $state, Expenses, SweetAlert) {
	$scope.title = "Cheltuieli";
	$scope.subtitle = "Lista";

	$scope.design = 'objects';
	$scope.limit = 50;
	$scope.sort = 'date';
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
		Expenses.post($scope.getListParams())
			.success(function (data) {
				$scope.total_rows = data.total_rows;
				$scope.rows = data.rows;
				$scope.pages = Math.ceil($scope.total_rows / $scope.limit);
			})
	}

	$scope.getList();

	$scope.edit = function(id) {;
		$state.go('app.expenses-edit', {entityID: id})
	};
	$scope.add = function() {
		$state.go('app.expenses-add');
	};
	$scope.view = function(id) {
		$state.go('app.expenses-view', {entityID: id});
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
				$state.go('app.expenses-delete', {entityID: id})
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


	$scope.downloadSheet = function(item) {
		Expenses.downloadSheet(item.id).success(function(data){
			var blob = new Blob([data], {type: 'application/pdf'})
			var url = URL.createObjectURL(blob);

			var name = 'Decont cheltuieli '+ item.doc.document_number;

			var hiddenElement = document.createElement('a');
			hiddenElement.href = url;
			hiddenElement.target = '_blank';
			hiddenElement.download = name + '.pdf';
			hiddenElement.click();
			hiddenElement.remove();
		})
	}

});

Conta.controller("expensesAddCtrl", function($scope, $http, Expenses, Currency, ExchangeRates, $state, Organisation, ExpensesAttachmentUpload){
	$scope.title = 'Noua cheltuiala';
	$scope.subtitle = 'Cheltuieli';
	$scope.item = {
		'items' : []
	};
	$scope.currencies = [];

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

	$scope.getOrganisations = function() {
        Organisation.get('name').success(function(data) {
            $scope.organisations = data.rows;
        })
    }

    $scope.getOrganisations();

	$scope.addSubitem = function() {
		$scope.item.items.push({'deductible': 25});
	}

	$scope.delSubitem = function(index) {
		$scope.item.items.splice(index, 1);
	}

	$scope.$watch('item.items', function() {
		$scope.item.amount = 0;
		$scope.item.deductible_amount = 0;
		angular.forEach($scope.item.items, function(item) {
			$scope.item.amount += item.amount;
			item.deductible_amount = item.amount * parseFloat(item.deductible) / 100;
			$scope.item.deductible_amount += item.deductible_amount;
		})
	}, true)

	$scope.submit = function(isValid) {
		if (isValid) {
			$scope.item.type = 'object';

			Expenses.create($scope.item)
				.success(function (data) {
					var expense = {
						'_id': data.id,
						'_rev': data.rev
					};

					if ($scope.attachments) {
                        var uploaded = 0;
                        angular.forEach($scope.attachments, function(attachment) {
                            ExpensesAttachmentUpload.upload(attachment, expense).success(function (data) {
                                uploaded++;
                                if (uploaded == $scope.attachments.length)
                                    $state.go('app.expenses');
                            })
                        })
                    } else {
                        $state.go('app.expenses');
                    }

				})
				.error(function (data, status) {
					if (status == 500)
						$scope.errors = data;
				});
		}
	}
})


Conta.controller("expensesEditCtrl", function($scope, $http, Expenses, Currency, ExchangeRates, $state, $stateParams, ExpensesAttachmentUpload, Organisation){
	$scope.title = 'Modificare';
	$scope.subtitle = 'Cheltuieli';
	$scope.entityID = $stateParams.entityID;
	$scope.item = {}
	Expenses.getOne($scope.entityID).success(function(data) {
		$scope.item = data;
		$scope.item.date = $scope.item.date_clear;
		$scope.subtitle = $scope.item.name;
	})

	$scope.currencies = [];

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

	$scope.getOrganisations = function() {
        Organisation.get('name').success(function(data) {
            $scope.organisations = data.rows;
        })
    }

    $scope.getOrganisations();

	$scope.addSubitem = function() {
		$scope.item.items.push({'deductible': 25});
	}

	$scope.delSubitem = function(index) {
		$scope.item.items.splice(index, 1);
	}

	$scope.$watch('item.items', function() {
		$scope.item.amount = 0;
		$scope.item.deductible_amount = 0;
		angular.forEach($scope.item.items, function(item) {
			$scope.item.amount += item.amount;
			item.deductible_amount = item.amount * parseFloat(item.deductible) / 100;
			$scope.item.deductible_amount += item.deductible_amount;
		})
	}, true)

	$scope.downloadSheet = function() {
		Expenses.downloadSheet($scope.item._id).success(function(data){
			var blob = new Blob([data], {type: 'application/pdf'})
			var url = URL.createObjectURL(blob);

			var name = 'Decont cheltuieli '+ $scope.item.document_number;

			var hiddenElement = document.createElement('a');
			hiddenElement.href = url;
			hiddenElement.target = '_blank';
			hiddenElement.download = name + '.pdf';
			hiddenElement.click();
			hiddenElement.remove();
		})
	}

	$scope.submit = function(isValid) {
		if (isValid) {
			$scope.item.type = 'object';

			Expenses.create($scope.item)
				.success(function (data) {
					var expense = {
						'_id': data.id,
						'_rev': data.rev
					};
					//$state.go('app.expenses');
                    if ($scope.attachments) {
                        var uploaded = 0;
                        angular.forEach($scope.attachments, function(attachment) {
                            ExpensesAttachmentUpload.upload(attachment, expense).success(function (data) {
                                uploaded++;
                                if (uploaded == $scope.attachments.length)
                                    $state.go('app.expenses');
                            })
                        })
                    } else {
                        $state.go('app.expenses');
                    }
				})
				.error(function (data, status) {
					if (status == 500)
						$scope.errors = data;
				});
		}
	}
})
