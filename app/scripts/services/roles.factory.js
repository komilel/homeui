/**
 * Created by ozknemoy on 21.06.2017.
 */

export default function rolesFactory () {
    'ngInject';
    var roles = {};

    roles._ROLE_ONE = {id: 1, name: 'User', shortName: 'U', description: 'Can view dashboards and history', isAdmin: false};
    roles._ROLE_TWO = {id: 2, name: 'Operator', shortName: 'O', description: 'Can create and edit dashboards', isAdmin: false};
    roles._ROLE_THREE = {id: 3, name: 'Administrator', shortName: 'A', description: 'Has full access to device settings and rules', isAdmin: true};
    roles.ROLE_ONE = roles._ROLE_ONE.id;
    roles.ROLE_TWO = roles._ROLE_TWO.id;
    roles.ROLE_THREE = roles._ROLE_THREE.id;
    roles.ROLES = [roles._ROLE_ONE, roles._ROLE_TWO, roles._ROLE_THREE];

    const setDefaultRole = (defaultRole = 1) => {
      localStorage.setItem('role', defaultRole);
      return defaultRole;
    }

    roles.current = {
        role: localStorage.getItem('role') || setDefaultRole(),
        roles: roles.ROLES[(localStorage.getItem('role') || 1) - 1]
    };

    roles.getRole = ()=> {
        roles.current.role = localStorage.getItem('role');
        roles.current.roles = roles.ROLES[roles.current.role - 1];
        return roles.current.role
    };

    roles.setRole = (n)=> {
        roles.current = {role:n, roles: roles.ROLES[n - 1]};
        localStorage.setItem('role',n)
    };

    roles.resetRole = (n)=> {
        localStorage.setItem('role',n)
    };

    // проверяет есть ли права доступа/просмотра
    // принимает значение минимально возможного статуса для доступа/просмотра
    roles.checkRights = (onlyRoleGreatThanOrEqual)=> {
        return roles.getRole() >= onlyRoleGreatThanOrEqual
    };

    return roles
}