export function isNavigationPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}
