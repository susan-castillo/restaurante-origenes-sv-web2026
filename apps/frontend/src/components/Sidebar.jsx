import { Nav, NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";

const modulesByRole = {
  ADMIN: [
    { path: "pos", label: "Punto de venta" },
    { path: "planilla", label: "Planilla" },
    { path: "inventario", label: "Inventario" },
  ],
  RRHH: [{ path: "planilla", label: "Planilla" }],
  EMPLEADO: [{ path: "pos", label: "Punto de venta" }],
};

export default function Sidebar({ role }) {
  const modules = modulesByRole[role] ?? [];

  return (
    <aside className="app-sidebar p-3">
      <p className="sidebar-heading">Menu</p>
      <Nav vertical>
        <NavItem>
          <NavLink tag={Link} to="/">
            Inicio
          </NavLink>
        </NavItem>
        {modules.map((module) => (
          <NavItem key={module.path}>
            <NavLink tag={Link} to={`/modulos/${module.path}`}>
              {module.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
    </aside>
  );
}
