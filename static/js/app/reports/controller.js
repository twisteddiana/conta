/**
 * Created by Diana on 11/25/2016.
 */
Conta.controller("reportsCtrl", function ($scope, $http, $state, Entity, Inventory) {
    $scope.reports = [
        {name: 'Fisa operatiuni diverse', action: 'sheet'},
        {name: 'Jurnal operatiuni diverse', action: 'journal'},
        {name: 'Registru de incasari si plati', action: 'registry'},
        {name: 'Registru inventar', action: 'inventory'}
    ];

    Entity.post({
        design: 'all',
        sort: 'classification',
        reduce: true,
        group_level: 1
    }).success(function (data) {
        $scope.classifications = data.rows;
    })

    $scope.title = "Rapoarte";

    var date = new Date();
    $scope.current_year = date.getFullYear();

    $scope.crange = function(min, max, step){
        step = step || 1;
        var input = [];
        if (step < 0)
            for (var i = max; i >= min; i += step) input.push(i);
        else
            for (var i = min; i <= max; i += step) input.push(i);
        return input;
    };

    $scope.chosen_report = '';
    $scope.chosen_classification = '';

    $scope.submit = function(report) {
        if (report.action == 'registry' || report.action == 'inventory' || report.month == 0) {
            var start_date = '01-01-' + report.year;
            var end_date = '31-12-' + report.year;
        } else {
            var start_date = '01-' + report.month + '-' + report.year;
            var end_date = '01-' + report.month + '-' + report.year;
        }
        var data = {
            date_start: start_date,
            date_end: end_date,
            report: report.action,
            classification: report.classification
        };
        if (report.action != 'inventory') {
            Entity.report(data).success(function (data) {
                downloadReport(data, report);
            })
        } else {
            Inventory.report(data).success(function(data) {
                downloadReport(data, report);
            })
        }

    }

    function downloadReport(data, report) {
        var blob = new Blob([data], {type: 'application/pdf'})
        var url = URL.createObjectURL(blob);

        var name = report.name + ' ';
        if (typeof report.month != 'undefined' && report.month > 0)
            name += report.month + '.';
        name += report.year;

        var hiddenElement = document.createElement('a');
        hiddenElement.href = url;
        hiddenElement.target = '_blank';
        hiddenElement.download = name + '.pdf';
        hiddenElement.click();
        hiddenElement.remove();
    }

});


Conta.controller("statementCtrl", function ($scope, $http, $state, Entity) {
    $scope.title = "Declaratia 200";
    $scope.subtitle = "Rapoarte";

    var date = new Date();
    $scope.current_year = date.getFullYear();

    $scope.crange = function(min, max, step){
        step = step || 1;
        var input = [];
        if (step < 0)
            for (var i = max; i >= min; i += step) input.push(i);
        else
            for (var i = min; i <= max; i += step) input.push(i);
        return input;
    };

    $scope.submit = function(isValid) {
        if (isValid) {
            Entity.statement({year: $scope.year}).success(function(data) {
                $scope.response = data;
            })
        }
    }

});
