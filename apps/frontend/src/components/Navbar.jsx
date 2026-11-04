import { Button, Navbar as BootstrapNavbar, NavbarBrand } from "reactstrap";

export default function Navbar({ user, onLogout }) {
  return (
    <BootstrapNavbar className="app-navbar px-3 px-lg-4" color="light" light>
      <NavbarBrand className="fw-semibold" href="/">
        Restaurante Origenes
      </NavbarBrand>
      <div className="d-flex align-items-center gap-3">
        <span className="small text-secondary">
          {user.name} <span className="role-label">{user.role}</span>
        </span>
        <Button color="outline-dark" onClick={onLogout} size="sm" type="button">
          Cerrar sesion
        </Button>
      </div>
    </BootstrapNavbar>
  );
}
