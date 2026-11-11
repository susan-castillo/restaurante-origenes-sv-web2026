//Aca van los componentes comunes como botones, inputs, etc. que se van a usar en varias partes de la app
import { Alert } from "reactstrap";

export default function Feedback({ color = "danger", children }) {
  if (!children) return null;
  return <Alert color={color}>{children}</Alert>;
}
