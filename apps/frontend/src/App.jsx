import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, Container } from "reactstrap";

const apiUrl = import.meta.env.VITE_API_URL || "/api";

export default function App() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`La API respondio con HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data) => setStatus(data.status === "ok" ? "online" : "offline"))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("offline");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell">
      <Container className="py-5">
        <p className="eyebrow mb-2">RESTAURANTE ORIGENES</p>
        <h1 className="display-5 fw-semibold mb-3">Tu proyecto ya esta listo.</h1>
        <p className="lead text-secondary mb-4">
          Frontend con React, Vite y Reactstrap, conectado a una API Express.
        </p>

        <Card className="status-card border-0 shadow-sm">
          <CardBody className="p-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h2 className="h5 mb-1">Estado del backend</h2>
                <p className="text-secondary mb-0">
                  Conexion mediante el proxy de Vite en <code>/api</code>.
                </p>
              </div>
              <Badge color={status === "online" ? "success" : status === "offline" ? "danger" : "secondary"} pill>
                {status === "online" ? "En linea" : status === "offline" ? "Sin conexion" : "Comprobando..."}
              </Badge>
            </div>
            {status === "offline" && (
              <Alert color="warning" className="mt-3 mb-0">
                Inicia el backend en el puerto configurado y vuelve a cargar la pagina.
              </Alert>
            )}
            <Button
              className="mt-4"
              color="dark"
              onClick={() => window.location.reload()}
              type="button"
            >
              Volver a comprobar
            </Button>
          </CardBody>
        </Card>
      </Container>
    </main>
  );
}
