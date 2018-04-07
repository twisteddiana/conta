/**
 * Created by Diana on 11/22/2016.
 */
angular.module('Conta').factory('Amortization', ($http) => {
    return {
        post: (data) =>  {
            if (typeof data == 'undefined')
                data = {};

            if (data['direction'] == 'desc')
                data['descending'] = true;
            else
                data['descending'] = false;

            if (typeof data['reduce'] == 'undefined')
                data['reduce'] = false;

            return $http.post('/amortizations', data).then(data => data.data);
        },
        getOne: (id) =>  {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/amortization' + extension);
        },
        create: (data) =>  {
            return $http.post('/amortization', data).then(data => data.data);
        },
        delete: (id) => {
            return $http.delete('/amortization/' + id).then(data => data.data);
        },
        synchronize: function() {
            return $http.get('/amortizations').then(data => data.data);
        },
        downloadSheet: (id) =>  {
            return $http.get('/amortization/sheet/'+id, {responseType: 'arraybuffer'}).then(data => data.data);
        }
    }
})