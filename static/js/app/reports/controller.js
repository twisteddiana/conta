/**
 * Created by Diana on 11/25/2016.
 */
angular
  .module('Conta')
  .controller("reportsCtrl", function ($scope, $http, $state, Entity, Inventory) {
    $scope.reports = [
      {name: 'Fisa operatiuni diverse', action: 'sheet'},
      {name: 'Jurnal operatiuni diverse', action: 'journal'},
      {name: 'Registru de incasari si plati', action: 'registry'},
      {name: 'Registru inventar', action: 'inventory'}
    ];

    Entity
      .all({
        design: 'all',
        sort: 'classification',
        reduce: true,
        group_level: 1
      })
      .then((data) => $scope.classifications = data.rows);

    $scope.title = "Rapoarte";
    $scope.current_year = (new Date()).getFullYear();

    $scope.crange = (min, max, step) => {
      step = step || 1;
      const input = [];
      if (step < 0)
        for (let i = max; i >= min; i += step) input.push(i);
      else
        for (let i = min; i <= max; i += step) input.push(i);
      return input;
    };

    $scope.chosen_report = '';
    $scope.chosen_classification = '';

    $scope.submit = (report) => {
      let start_date,
        end_date;
      if (report.action == 'registry' || report.action == 'inventory' || report.month == 0) {
        start_date = '01-01-' + report.year;
        end_date = '31-12-' + report.year;
      } else {
        start_date = '01-' + report.month + '-' + report.year;
        end_date = '01-' + report.month + '-' + report.year;
      }
      const data = {
        date_start: start_date,
        date_end: end_date,
        report: report.action,
        classification: report.classification
      };
      if (report.action != 'inventory') {
        Entity
          .report(data)
          .then(data => downloadReport(data, report))
      } else {
        Inventory
          .report(data)
          .then(data => downloadReport(data, report))
      }
    };

    const downloadReport = (data, report) => {
      let name = report.name + ' ';
      if (typeof report.month != 'undefined' && report.month > 0)
        name += report.month + '.';
      name += report.year;

      const hiddenElement = document.createElement('a');
      hiddenElement.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
      hiddenElement.target = '_blank';
      hiddenElement.download = name + '.pdf';
      hiddenElement.click();
      hiddenElement.remove();
    }
  });


angular
  .module('Conta')
  .controller("statementCtrl", function ($scope, $http, $state, Entity) {
    $scope.title = "Declaratia unica";
    $scope.subtitle = "Rapoarte";

    $scope.current_year = (new Date()).getFullYear();

    $scope.crange = (min, max, step) => {
      step = step || 1;
      const input = [];
      if (step < 0)
        for (let i = max; i >= min; i += step) input.push(i);
      else
        for (let i = min; i <= max; i += step) input.push(i);
      return input;
    };

    $scope.submit = (isValid) => {
      if (!isValid) {
        return;
      }
      Entity
        .statement({year: $scope.year})
        .then((data) => $scope.response = data)
    }
  });
