/**
 * Created by Diana on 11/22/2016.
 */
angular.module('Conta').controller("amortizationsCtrl", function ($scope, $http, $state, Amortization, SweetAlert) {
	$scope.title = "Mijloace fixe";
	$scope.subtitle = "Lista";

	$scope.design = 'objects';
	$scope.limit = 50;
	$scope.sort = 'date';
	$scope.direction = 'desc';
	$scope.skip = 0;


	$scope.getListParams = () => {
		return {
			design: $scope.design,
			skip: $scope.skip,
			limit: parseInt($scope.limit),
			sort: $scope.sort,
			direction: $scope.direction
		}
	}

	$scope.getList = () => {
		Amortization.post($scope.getListParams())
			.then((data) => {
				$scope.total_rows = data.total_rows;
				$scope.rows = data.rows;
				$scope.pages = Math.ceil($scope.total_rows / $scope.limit);
			})
	}

	$scope.getList();

	$scope.edit = (id) => {
		$state.go('app.amortizations-edit', {entityID: id})
	};
	$scope.add = () => {
		$state.go('app.amortizations-add');
	};
	$scope.view = (id) => {
		$state.go('app.amortizations-view', {entityID: id});
	};
	$scope.delete = (id) => {
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
		}, (isConfirm) => {
			if (isConfirm) {
				$state.go('app.amortizations-delete', {entityID: id})
			}
		});

	};

	$scope.changeSort = (column) => {
		if ($scope.sort == column) {
			$scope.direction = reverseSort($scope.direction);
		} else {
			$scope.sort = column;
			$scope.direction = "asc";
		}

		$scope.getList();
	}

	const reverseSort = (sort) => {
		if (sort == 'asc')
			return 'desc';
		return 'asc';
	}

	$scope.synchronizing = false;
	$scope.synchronizePayments = () => {
		$scope.synchronizing = true;
		Amortization.synchronize().then((data) => {
			$scope.synchronizing = false;
		})
	}

	$scope.downloadSheet = (item) => {
		Amortization.downloadSheet(item.id).then((data) => {
			var blob = new Blob([data], {type: 'application/pdf'})
			var url = URL.createObjectURL(blob);

			var name = 'Fisa mijlocului fix '+ item.doc.name;

			var hiddenElement = document.createElement('a');
			hiddenElement.href = url;
			hiddenElement.target = '_blank';
			hiddenElement.download = name + '.pdf';
			hiddenElement.click();
			hiddenElement.remove();
		})
	}

});


angular.module('Conta').controller("amortizationsAddCtrl", function ($scope, $http, Amortization, Currency, ExchangeRates, $state) {
	$scope.title = 'Noua amortizare';
	$scope.subtitle = 'Amortizari';
	$scope.item = {};
	$scope.currencies = [];

	$scope.getCurrencies = () => {
		Currency.get().then((data) => {
			$scope.currencies = data.rows;

			$scope.currencies.forEach((currency) => {
				if (currency.doc.main) {
					$scope.item.currency = currency.doc.iso;
					$scope.main_currency = currency.doc.iso;
					$scope.exchange_rate = 1;
				}
			})
		})
	}
	$scope.getCurrencies();

	$scope.submit = (isValid) => {
		if (isValid) {
			$scope.item.type = 'object';

			Amortization.create($scope.item)
				.then((data) => {
					var entity = {
						'_id': data.id,
						'_rev': data.rev
					};
					$state.go('app.amortizations');
				})
				.catch((data, status) => {
					if (status == 500)
						$scope.errors = data;
				});
		}
	}
});

angular.module('Conta').controller("amortizationsViewCtrl", function ($scope, $http, Amortization, Currency, ExchangeRates, $state, $stateParams) {
	$scope.title = 'Transe Amortizare';
	$scope.subtitle = 'Income';
	$scope.entityID = $stateParams.entityID;
	$scope.item = {};
	Amortization.getOne($scope.entityID).then((data) => {
		$scope.item = data;
		$scope.subtitle = $scope.item.name;

		$scope.getList();
	});

	$scope.getListParams = () => {
		return {
			design: 'installments',
			skip: 0,
			limit: $scope.item.duration,
			sort: 'object',
			direction: 'asc',
			start_key: [$scope.item._id],
			reduce: false
		}
	};

	$scope.getList = () => {
		Amortization.post($scope.getListParams())
			.then((data) => {
				$scope.total_rows = data.total_rows;
				$scope.rows = data.rows;
			});
	};
});

angular.module('Conta').controller("amortizationsEditCtrl", function ($scope, $http, Amortization, Currency, ExchangeRates, $state, $stateParams) {
	$scope.title = 'Modificare';
	$scope.subtitle = 'Amortizari';
	$scope.entityID = $stateParams.entityID;
	$scope.item = {};
	Amortization.getOne($scope.entityID).then((data) => {
		$scope.item = data;
		$scope.item.date = $scope.item.date_clear;
		$scope.subtitle = $scope.item.name;
	})

	$scope.currencies = [];

	$scope.getCurrencies = () => {
		Currency.get().then((data) => {
			$scope.currencies = data.rows;

			$scope.currencies.forEach((currency) => {
				if (currency.doc.main) {
					$scope.item.currency = currency.doc.iso;
					$scope.main_currency = currency.doc.iso;
					$scope.exchange_rate = 1;
				}
			})
		})
	}
	$scope.getCurrencies();

	$scope.downloadSheet = () => {
		Amortization.downloadSheet($scope.item._id).then((data) => {
			var blob = new Blob([data], {type: 'application/pdf'})
			var url = URL.createObjectURL(blob);

			var name = 'Fisa mijlocului fix '+ $scope.item.name;

			var hiddenElement = document.createElement('a');
			hiddenElement.href = url;
			hiddenElement.target = '_blank';
			hiddenElement.download = name + '.pdf';
			hiddenElement.click();
			hiddenElement.remove();
		})
	};

	$scope.submit = (isValid) => {
		if (isValid) {
			$scope.item.type = 'object';

			Amortization.create($scope.item)
				.then(() => {
					$state.go('app.amortizations');
				})
				.catch((data, status) => {
					if (status == 500)
						$scope.errors = data;
				});
		}
	}
});
