const nombreCanal = 'origenes:inventario';

function abrirCanal() {
    try {
        return new BroadcastChannel(nombreCanal);
    } catch {
        return null;
    }
}

export function avisarCambioInventario() {
    const canal = abrirCanal();
    if (!canal) return;
    try {
        canal.postMessage('actualizar');
    } finally {
        canal.close();
    }
}

export function escucharCambiosInventario(actualizar) {
    const canal = abrirCanal();
    if (!canal) return;
    canal.onmessage = ({ data }) => {
        if (data === 'actualizar') actualizar();
    };
    return () => canal.close();
}
