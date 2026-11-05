import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { appAlert } from '@/components/app-alert';
import { FadeSlideIn } from '@/components/animations/fade-slide-in';
import { BotonCancelarRegistro } from '@/components/boton-cancelar-registro';
import { HeaderEpmaps } from '@/components/header-epmaps';
import { ProgressBarRegistro } from '@/components/progress-bar-registro';
import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
import { guardarLecturaLocal } from '@/features/lecturas/lecturas.service';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { medidorQueryKey, useMedidorQuery } from '@/features/medidores/useMedidorQuery';
import { sincronizarSiHayRed } from '@/features/sync/sync.service';
import { guardarFotoPermanente } from '@/utils/fileSystemStorage';

const ETIQUETAS_ESTADO = {
  normal: { texto: 'NORMAL', badge: 'bg-accent-soft', badgeText: 'text-secondary' },
  inaccesible: { texto: 'INACCESIBLE', badge: 'bg-warning-soft', badgeText: 'text-warning' },
  danado: { texto: 'DAÑADO', badge: 'bg-danger-soft', badgeText: 'text-danger-strong' },
} as const;

const CAMERA_FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Botón estilizado de retorno prominente */
function BotonVolver({ onPress, label = 'Volver' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      className="flex-row items-center self-start bg-input border border-border rounded-xl py-2 px-3.5 mb-4 active:opacity-85"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text className="text-xl leading-[22px] font-roboto-bold text-primary mr-1.5">‹</Text>
      <Text className="font-roboto-medium text-sm text-primary">{label}</Text>
    </Pressable>
  );
}

export default function ConfirmacionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const datos = useLecturaStore();
  const { data: medidor } = useMedidorQuery(datos.medidorCodigo || null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camaraRef = useRef<CameraView>(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const hayLectura = datos.estadoMedidor !== 'inaccesible' && datos.lecturaActual.trim() !== '';
  const consumo =
    hayLectura && medidor
      ? calcularConsumo(Number(datos.lecturaActual), medidor.ultimaLectura, medidor.promedioMensual)
          .consumo
      : null;

  // R7: Foto obligatoria si el consumo es anómalo o el medidor está dañado
  const fotoObligatoria = datos.esAnomalo || datos.estadoMedidor === 'danado';

  const solicitarPermiso = async () => {
    const res = await pedirPermiso();
    if (res.granted) {
      setCamaraAbierta(true);
      return;
    }
    appAlert(
      'Permiso de cámara denegado',
      fotoObligatoria
        ? 'La fotografía de respaldo es obligatoria en este registro. Active el permiso de cámara en los ajustes del dispositivo.'
        : 'Puede activar el permiso en los ajustes del dispositivo o continuar sin fotografía.',
      'warning',
      [
        { texto: 'Reintentar', onPress: solicitarPermiso },
        { texto: 'Continuar', secundario: true },
      ],
    );
  };

  const abrirCamara = () => {
    if (permiso?.granted) {
      setCamaraAbierta(true);
      return;
    }
    appAlert(
      'Acceso a la cámara',
      'EPMAPS Campo necesita la cámara para tomar la foto de respaldo del medidor.',
      'info',
      [
        { texto: 'Permitir cámara', onPress: solicitarPermiso },
        { texto: 'Ahora no', secundario: true },
      ],
    );
  };

  const tomarFoto = async () => {
    try {
      const foto = await camaraRef.current?.takePictureAsync({ quality: 0.6 });
      if (!foto) return;
      datos.setFotoUri(guardarFotoPermanente(foto.uri, datos.medidorCodigo));
      setCamaraAbierta(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la fotografía. Intente nuevamente.');
    }
  };

  const ejecutarGuardado = async () => {
    setGuardando(true);
    try {
      await guardarLecturaLocal({
        medidorCodigo: datos.medidorCodigo,
        estadoMedidor: datos.estadoMedidor,
        lectura: hayLectura ? Number(datos.lecturaActual) : null,
        motivo: datos.motivoInaccesibilidad || undefined,
        descripcionDano: datos.descripcionDano || undefined,
        consumoCalculado: consumo,
        fotoUri: datos.fotoUri,
      });

      useLecturaStore.getState().resetFormulario();
      queryClient.removeQueries({ queryKey: medidorQueryKey(datos.medidorCodigo) });
      sincronizarSiHayRed().catch(() => undefined);

      Alert.alert('Lectura guardada', 'El registro quedó PENDIENTE de envío.', [
        {
          text: 'Aceptar',
          onPress: () => {
            if (router.canDismiss()) router.dismissAll();
            router.replace('/busqueda' as never);
          },
        },
      ]);
    } catch (e) {
      setGuardando(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar la lectura.');
    }
  };

  const solicitarConfirmacionGuardado = () => {
    if (fotoObligatoria && !datos.fotoUri) {
      Alert.alert(
        'Fotografía Requerida',
        'La fotografía del medidor es obligatoria debido a que se registró una anomalía de consumo o un daño en el medidor.',
        [
          { text: 'Tomar Foto', onPress: abrirCamara },
          { text: 'Cancelar', style: 'cancel' },
        ],
      );
      return;
    }

    Alert.alert('Confirmar Guardado', '¿Desea registrar esta lectura en el sistema?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Guardar', onPress: ejecutarGuardado },
    ]);
  };

  if (camaraAbierta) {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={camaraRef} style={CAMERA_FILL} facing="back" />
        <View className="absolute bottom-10 left-5 right-5 flex-row justify-between gap-4">
          <Pressable
            className="flex-1 min-h-[54px] rounded-xl items-center justify-center bg-slate-700 active:opacity-85"
            onPress={() => setCamaraAbierta(false)}>
            <Text className="font-roboto-medium text-white text-base">Cancelar</Text>
          </Pressable>
          <Pressable
            className="flex-1 min-h-[54px] rounded-xl items-center justify-center bg-primary active:opacity-85"
            onPress={tomarFoto}>
            <Text className="font-roboto-bold text-white text-base">Capturar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const badgeEstado = ETIQUETAS_ESTADO[datos.estadoMedidor];

  return (
    <View className="flex-1 bg-background">
      <HeaderEpmaps subtitulo="Confirmación" />
      <BotonCancelarRegistro />
      <ScrollView contentContainerClassName="p-[18px] pb-10">
        <BotonVolver onPress={() => router.back()} label="Volver al Paso Anterior" />

        <ProgressBarRegistro pasoActual={3} />
        <Text className="font-roboto-bold text-2xl text-primary mb-4">
          Confirmación del Registro
        </Text>

        {/* Tarjeta de Resumen de Datos */}
        <View className="bg-card rounded-2xl border border-border p-[18px] mb-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="font-roboto text-[13px] text-muted">Medidor</Text>
              <Text className="font-roboto-bold text-xl text-primary mt-0.5">
                {datos.medidorCodigo}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-lg ${badgeEstado.badge}`}>
              <Text
                className={`font-roboto-bold text-[13px] tracking-[0.8px] ${badgeEstado.badgeText}`}>
                {badgeEstado.texto}
              </Text>
            </View>
          </View>

          <View className="h-px bg-border my-3.5" />

          {datos.estadoMedidor === 'inaccesible' && (
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="font-roboto text-sm text-muted">Motivo de inaccesibilidad</Text>
              <Text className="font-roboto-medium text-[15px] text-foreground text-right shrink ml-3">
                {datos.motivoInaccesibilidad || 'No especificado'}
              </Text>
            </View>
          )}

          {datos.estadoMedidor === 'danado' && (
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="font-roboto text-sm text-muted">Descripción del daño</Text>
              <Text className="font-roboto-medium text-[15px] text-foreground text-right shrink ml-3">
                {datos.descripcionDano || 'No especificada'}
              </Text>
            </View>
          )}

          {hayLectura && (
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="font-roboto text-sm text-muted">Lectura actual ingresada</Text>
              <Text className="font-roboto-bold text-lg text-primary">{datos.lecturaActual}</Text>
            </View>
          )}

          {consumo !== null && (
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="font-roboto text-sm text-muted">Consumo calculado</Text>
              <Text className="font-roboto-medium text-[15px] text-foreground text-right shrink ml-3">
                {consumo} m³
              </Text>
            </View>
          )}

          {datos.esAnomalo && (
            <FadeSlideIn
              visible={datos.esAnomalo}
              className="bg-warning-soft rounded-[10px] p-2.5 mt-3 border-l-4 border-l-warning">
              <Text className="font-roboto-medium text-[13px] text-amber-800 leading-[18px]">
                ⚠️ Consumo alto confirmado por el técnico (requiere respaldo fotográfico).
              </Text>
            </FadeSlideIn>
          )}
        </View>

        {/* Tarjeta Visor de Fotografía */}
        <View className="bg-card rounded-2xl border border-border p-[18px] mb-5 shadow-sm">
          <Text className="font-roboto-medium text-[15px] text-primary mb-3">
            Fotografía de Respaldo {fotoObligatoria ? '(Obligatoria)' : '(Opcional)'}
          </Text>

          {datos.fotoUri ? (
            <View className="rounded-[14px] border border-border overflow-hidden mb-3.5 shadow-sm">
              <Image source={{ uri: datos.fotoUri }} resizeMode="cover" className="w-full h-[220px]" />
            </View>
          ) : (
            <View className="bg-background rounded-[14px] border border-dashed border-border items-center justify-center py-8 mb-3.5">
              <Text className="text-[32px] mb-1.5">📷</Text>
              <Text className="font-roboto text-sm text-muted">
                {fotoObligatoria
                  ? 'Fotografía obligatoria antes de guardar.'
                  : 'Sin fotografía capturada.'}
              </Text>
            </View>
          )}

          <Pressable
            className={`min-h-12 rounded-xl items-center justify-center active:opacity-85 ${
              datos.fotoUri ? 'bg-slate-100 border border-border' : 'bg-secondary'
            }`}
            onPress={abrirCamara}>
            <Text
              className={`font-roboto-medium text-[15px] ${
                datos.fotoUri ? 'text-primary' : 'text-white'
              }`}>
              {datos.fotoUri ? 'Repetir Fotografía' : 'Tomar Fotografía'}
            </Text>
          </Pressable>
        </View>

        {/* Botón Principal Destacado */}
        <Pressable
          className="min-h-[58px] rounded-[14px] bg-primary items-center justify-center px-6 shadow-md active:opacity-90 disabled:opacity-50"
          disabled={guardando}
          onPress={solicitarConfirmacionGuardado}>
          {guardando ? (
            <ActivityIndicator colorClassName="accent-white" size="small" />
          ) : (
            <Text className="font-roboto-bold text-white text-lg">Guardar Lectura</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
