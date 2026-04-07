import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService, Role } from '../Auth/services/auth-service.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const allowedRole = route.data['role'] as Role | undefined;
  if (allowedRole && !auth.hasRole(allowedRole)) {
    auth.redirectByRole();
    return false;
  }

  return true;
};
