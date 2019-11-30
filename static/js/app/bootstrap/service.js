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
    authenticate: (username, password) => $http.post('/_session', { username, password }).then(data => data.data),
  }));