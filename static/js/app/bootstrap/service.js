angular
  .module('Conta')
  .factory('Authorization', ($http, $state) => ({
    authorize: () => {
      let userCtx;
      return $http
        .get('/_session')
        .then(data => data.data)
        .then(result => {
          return (result && result.ok) ? ( userCtx = result.userCtx) && userCtx : false;
        })
        .catch()
        .finally(() => {
          !userCtx && $state.go('login');
        })
    },
    authenticate: (name, password) => {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${window.btoa(name + ':' + password)}`
        }
      };
      const body = { name, password };
      return $http.post('/_session', body, config).then(data => data.data);
    },
  }));