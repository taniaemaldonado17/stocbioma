import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Colores por estado fitosanitario
const COLOR_ESTADO = {
  'Sano': '#059669',          // emerald-600
  'Enfermo': '#d97706',       // amber-600
  'Plaga': '#dc2626',         // red-600
  'Muerto en pie': '#3f3f46'  // zinc-700
};

// Marcadores dibujados con CSS (divIcon): no dependen de imágenes
// externas, así que se ven perfecto en modo offline.
function iconoArbol(estado) {
  return L.divIcon({
    className: '',
    html: `<span class="pin-arbol" style="background:${COLOR_ESTADO[estado] || '#059669'}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
}

export default function MapaParcela({ parcela, arboles }) {
  // Centro: promedio de los árboles, o el centro de la parcela
  const conGps = arboles.filter((a) => a.latitud != null);
  let centro = [parcela.latitud ?? -27.46, parcela.longitud ?? -58.83];
  if (conGps.length > 0) {
    centro = [
      conGps.reduce((s, a) => s + a.latitud, 0) / conGps.length,
      conGps.reduce((s, a) => s + a.longitud, 0) / conGps.length
    ];
  }

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200" style={{ height: 320 }}>
      <MapContainer center={centro} zoom={18} maxZoom={19} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Centro de la parcela */}
        {parcela.latitud != null && (
          <Circle
            center={[parcela.latitud, parcela.longitud]}
            radius={3}
            pathOptions={{ color: '#1e293b', fillColor: '#1e293b', fillOpacity: 0.9 }}
          />
        )}

        {/* Un pin por árbol con su ficha técnica en el popup */}
        {conGps.map((a, i) => (
          <Marker
            key={a.client_id}
            position={[a.latitud, a.longitud]}
            icon={iconoArbol(a.estado_fitosanitario)}
          >
            <Popup>
              <div style={{ minWidth: 170 }}>
                <strong>Árbol #{i + 1}</strong>
                <br />Especie: {a.especie || '—'}
                <br />DAP: {a.dap_cm ?? '—'} cm
                <br />HT: {a.ht_m ?? '—'} m
                <br />Estado: {a.estado_fitosanitario}
                <br />Riesgo: {a.riesgo}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
