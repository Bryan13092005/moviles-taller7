/**
 * MeterLocationViewer
 *
 * Componente de solo lectura que muestra en un mapa Leaflet + OpenStreetMap
 * el punto exacto donde se registró la lectura de un medidor.
 * El marcador es estático (no arrastrable).
 *
 * ADR-009: solo className (Uniwind/Tailwind v4), sin StyleSheet.create.
 */

import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  latitud: number | string;
  longitud: number | string;
  /** Altura del mapa en píxeles (por defecto 200). */
  altura?: number;
}

/**
 * Genera el HTML auto-contenido con Leaflet + OSM.
 */
function buildViewerHtml(lat: number, lng: number): string {
  const latStr = lat.toFixed(8);
  const lngStr = lng.toFixed(8);
  const label = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #f1f5f9; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var lat = ${latStr};
    var lng = ${lngStr};
    var map = L.map('map', {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
      tap: true
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup('${label}')
      .openPopup();
  </script>
</body>
</html>`;
}

export function MeterLocationViewer({ latitud, longitud, altura = 180 }: Props) {
  const numLat = typeof latitud === 'number' ? latitud : parseFloat(String(latitud));
  const numLng = typeof longitud === 'number' ? longitud : parseFloat(String(longitud));

  if (isNaN(numLat) || isNaN(numLng)) {
    return null;
  }

  const html = buildViewerHtml(numLat, numLng);

  return (
    <View className="rounded-xl border border-border overflow-hidden bg-background">
      {/* Cabecera interna dentro de la tarjeta */}
      <View className="px-3.5 py-2 flex-row items-center justify-between bg-slate-50 border-b border-border">
        <Text className="font-roboto-medium text-xs text-primary">📍 Ubicación registrada</Text>
        <Text className="font-roboto text-[11px] text-muted">
          {numLat.toFixed(5)}, {numLng.toFixed(5)}
        </Text>
      </View>

      {/* Mapa Leaflet */}
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ width: '100%', height: altura }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled={false}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8fafc',
            }}>
            <ActivityIndicator size="small" colorClassName="accent-primary" />
          </View>
        )}
      />
    </View>
  );
}
