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
  latitud: number;
  longitud: number;
  /** Altura del mapa en píxeles (por defecto 220). */
  altura?: number;
}

function buildViewerHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, dragging: true }).setView([${lat}, ${lng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    // Marcador estático con popup informativo
    L.marker([${lat}, ${lng}])
      .addTo(map)
      .bindPopup('Ubicación registrada<br/>${lat.toFixed(6)}, ${lng.toFixed(6)}')
      .openPopup();
  </script>
</body>
</html>`;
}

export function MeterLocationViewer({ latitud, longitud, altura = 220 }: Props) {
  const html = buildViewerHtml(latitud, longitud);

  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Cabecera */}
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <Text className="font-roboto-medium text-[13px] text-primary">📍 Ubicación registrada</Text>
      </View>

      {/* Mapa */}
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ width: '100%', height: altura }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-background">
            <ActivityIndicator colorClassName="accent-primary" />
          </View>
        )}
      />

      {/* Coordenadas legibles */}
      <View className="flex-row justify-around px-4 py-2 bg-background border-t border-border">
        <Text className="font-roboto text-[12px] text-muted">
          Lat:{' '}
          <Text className="font-roboto-medium text-foreground">{latitud.toFixed(6)}</Text>
        </Text>
        <Text className="font-roboto text-[12px] text-muted">
          Lng:{' '}
          <Text className="font-roboto-medium text-foreground">{longitud.toFixed(6)}</Text>
        </Text>
      </View>
    </View>
  );
}
