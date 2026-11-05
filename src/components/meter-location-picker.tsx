/**
 * MeterLocationPicker
 *
 * Selector interactivo de ubicación GPS para el registro de lecturas de medidores.
 * - Modo automático: obtiene la posición actual del dispositivo con expo-location.
 * - Modo manual: el técnico puede arrastrar el pin o tocar el mapa para recolocarlo.
 * - Renderiza Leaflet + OpenStreetMap dentro de un WebView (react-native-webview).
 * - Envía las coordenadas confirmadas al padre mediante onConfirmar().
 *
 * ADR-009: solo className (Uniwind/Tailwind v4), sin StyleSheet.create.
 */

import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

/** Coordenadas por defecto: centro de Quito (EPMAPS). */
const QUITO_LAT = -0.180653;
const QUITO_LNG = -78.467838;

interface Props {
  /** Coordenadas iniciales; si no se pasan se usa la posición GPS o Quito. */
  latitudInicial?: number | null;
  longitudInicial?: number | null;
  /** Callback al confirmar la ubicación. */
  onConfirmar: (latitud: number, longitud: number) => void;
}

/** Genera el HTML completo con Leaflet + OSM para inyectar en el WebView. */
function buildMapHtml(lat: number, lng: number): string {
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
    var currentLat = ${lat};
    var currentLng = ${lng};

    var map = L.map('map', { zoomControl: true }).setView([currentLat, currentLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);

    function sendCoords(lat, lng) {
      currentLat = lat;
      currentLng = lng;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: lat, longitude: lng }));
      }
    }

    // Arrastre del marcador
    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendCoords(pos.lat, pos.lng);
    });

    // Toque/clic en el mapa recoloca el pin
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendCoords(e.latlng.lat, e.latlng.lng);
    });

    // Enviar coordenadas iniciales al montar
    sendCoords(currentLat, currentLng);
  </script>
</body>
</html>`;
}

export function MeterLocationPicker({ latitudInicial, longitudInicial, onConfirmar }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cargandoGps, setCargandoGps] = useState(true);
  const [errorGps, setErrorGps] = useState<string | null>(null);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Obtener ubicación GPS al montar
  useEffect(() => {
    let cancelado = false;

    async function obtenerUbicacion() {
      // Si ya se pasan coordenadas iniciales, usarlas directamente
      if (latitudInicial != null && longitudInicial != null) {
        if (!cancelado) {
          setCoords({ lat: latitudInicial, lng: longitudInicial });
          setCargandoGps(false);
        }
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelado) {
            setErrorGps('Permiso de ubicación denegado. Se usará la posición por defecto (Quito).');
            setCoords({ lat: QUITO_LAT, lng: QUITO_LNG });
            setCargandoGps(false);
          }
          return;
        }

        const posicion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!cancelado) {
          setCoords({
            lat: posicion.coords.latitude,
            lng: posicion.coords.longitude,
          });
          setCargandoGps(false);
        }
      } catch {
        if (!cancelado) {
          setErrorGps('No se pudo obtener la ubicación GPS. Se usará la posición por defecto.');
          setCoords({ lat: QUITO_LAT, lng: QUITO_LNG });
          setCargandoGps(false);
        }
      }
    }

    obtenerUbicacion();
    return () => {
      cancelado = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Maneja mensajes entrantes del WebView (coordenadas actualizadas). */
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { latitude: number; longitude: number };
      setCoords({ lat: data.latitude, lng: data.longitude });
      setUbicacionConfirmada(false);
    } catch {
      // mensaje no JSON, ignorar
    }
  };

  const handleConfirmar = () => {
    if (!coords) return;
    setUbicacionConfirmada(true);
    onConfirmar(coords.lat, coords.lng);
  };

  // ── Pantalla de carga GPS ──────────────────────────────────────────────────
  if (cargandoGps) {
    return (
      <View className="bg-card rounded-2xl border border-border p-5 items-center justify-center min-h-[220px] gap-3">
        <ActivityIndicator size="large" colorClassName="accent-primary" />
        <Text className="font-roboto-medium text-sm text-muted text-center">
          Obteniendo ubicación GPS…
        </Text>
      </View>
    );
  }

  const html = buildMapHtml(coords!.lat, coords!.lng);

  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4 shadow-sm">
      {/* Cabecera */}
      <View className="px-4 pt-4 pb-2">
        <Text className="font-roboto-bold text-[15px] text-primary">
          📍 Ubicación del Medidor
        </Text>
        <Text className="font-roboto text-xs text-muted mt-0.5">
          Arrastre el pin o toque el mapa para ajustar la posición exacta.
        </Text>
      </View>

      {/* Aviso de error GPS (no bloquea el flujo) */}
      {!!errorGps && (
        <View className="mx-4 mb-2 bg-warning-soft rounded-xl px-3 py-2 border border-warning/40">
          <Text className="font-roboto text-[12px] text-amber-800 leading-[16px]">
            ⚠️ {errorGps}
          </Text>
        </View>
      )}

      {/* Mapa Leaflet */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={{ width: '100%', height: 280 }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-background">
            <ActivityIndicator colorClassName="accent-primary" />
          </View>
        )}
      />

      {/* Coordenadas en tiempo real */}
      {coords && (
        <View className="flex-row justify-around px-4 py-2.5 bg-background border-t border-border">
          <Text className="font-roboto text-[12px] text-muted">
            Lat: <Text className="font-roboto-medium text-foreground">{coords.lat.toFixed(6)}</Text>
          </Text>
          <Text className="font-roboto text-[12px] text-muted">
            Lng: <Text className="font-roboto-medium text-foreground">{coords.lng.toFixed(6)}</Text>
          </Text>
        </View>
      )}

      {/* Botón Confirmar */}
      <View className="px-4 pb-4 pt-2">
        <Pressable
          className={`min-h-[52px] rounded-xl items-center justify-center active:opacity-85 ${
            ubicacionConfirmada ? 'bg-success' : 'bg-primary'
          }`}
          onPress={handleConfirmar}
          disabled={!coords}
          accessibilityRole="button"
          accessibilityLabel="Confirmar ubicación de lectura">
          <Text className="font-roboto-bold text-white text-base">
            {ubicacionConfirmada ? '✓ Ubicación Confirmada' : 'Confirmar Ubicación de Lectura'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
