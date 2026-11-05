import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { appAlert } from '@/components/app-alert';
import { FadeSlideIn } from '@/components/animations/fade-slide-in';
import { PressableScale } from '@/components/animations/pressable-scale';
import { HeaderEpmaps } from '@/components/header-epmaps';
import { MeterLocationViewer } from '@/components/meter-location-viewer';
import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
import {
  actualizarLecturaPendiente,
  listarLecturas,
  obtenerReferenciaConsumo,
  type LecturaRegistrada,
} from '@/features/lecturas/lecturas.service';
import { precargarDatosRemotos } from '@/features/sync/precarga.service';
import { guardarFotoPermanente } from '@/utils/fileSystemStorage';

const ANIMACION_REFRESH = require('../../assets/animations/refresh animation.json');

const NUMERO = /^\d+(\.\d+)?$/;

const CAMERA_FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });

/** Botón estilizado de retorno prominente */
function BotonVolver({ onPress, label = 'Volver a Consulta' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      className="flex-row items-center self-start bg-input border border-border rounded-xl py-2 px-3.5 mb-3 active:opacity-85"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text className="text-xl leading-[22px] font-roboto-bold text-primary mr-1.5">‹</Text>
      <Text className="font-roboto-medium text-sm text-primary">{label}</Text>
    </Pressable>
  );
}

export default function HistorialScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<LecturaRegistrada | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  // Al abrir el historial en cualquier teléfono: sincronizar datos remotos de MockAPI para obtener coordenadas y lecturas
  useEffect(() => {
    precargarDatosRemotos()
      .then(() => queryClient.invalidateQueries({ queryKey: ['lecturas'] }))
      .catch(() => undefined);
  }, [queryClient]);

  // Refresco periódico para sincronizar el estado de los chips
  const { data: lecturas = [] } = useQuery({
    queryKey: ['lecturas'],
    queryFn: listarLecturas,
    staleTime: 0,
    refetchInterval: 5000,
  });

  const handlePressItem = (item: LecturaRegistrada) => {
    const esPendiente = item.sincronizado === 0;
    if (!esPendiente) {
      appAlert(
        'Lectura Sincronizada',
        'Esta lectura ya fue transmitida a la oficina central y no puede ser modificada.',
        'info',
      );
      return;
    }
    setEditando(item);
  };

  const handleRefresh = async () => {
    setRefrescando(true);
    try {
      await precargarDatosRemotos();
      await queryClient.invalidateQueries({ queryKey: ['lecturas'] });
    } finally {
      setRefrescando(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <HeaderEpmaps subtitulo="Historial" />
      <FlatList
        data={lecturas}
        keyExtractor={(l) => String(l.id)}
        contentContainerClassName="p-[18px] pb-9 gap-3.5"
        refreshing={refrescando}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View className="mb-1.5">
            <BotonVolver onPress={() => router.back()} label="Volver a Consulta" />
            <View className="flex-row justify-between items-center mt-1">
              <View className="flex-1 mr-2">
                <Text className="font-roboto-bold text-2xl text-primary">
                  Historial de Lecturas
                </Text>
                <Text className="font-roboto text-sm text-muted mt-0.5">
                  Listado de lecturas registradas en el dispositivo móvil.
                </Text>
              </View>
              <Pressable
                onPress={handleRefresh}
                disabled={refrescando}
                className="flex-row items-center bg-input border border-border rounded-xl py-2 px-3 active:opacity-85"
                accessibilityRole="button"
                accessibilityLabel="Sincronizar historial">
                <View className="w-5 h-5 items-center justify-center mr-1.5">
                  <LottieView
                    source={ANIMACION_REFRESH}
                    autoPlay
                    loop={refrescando}
                    style={{ width: 20, height: 20 }}
                  />
                </View>
                <Text className="font-roboto-medium text-xs text-primary">
                  {refrescando ? 'Sincronizando' : 'Sincronizar'}
                </Text>
              </Pressable>
            </View>

            {refrescando && (
              <View className="flex-row items-center bg-sky-50 border border-sky-200 rounded-xl py-2.5 px-3.5 mt-3 gap-2.5">
                <View className="w-6 h-6 items-center justify-center">
                  <LottieView
                    source={ANIMACION_REFRESH}
                    autoPlay
                    loop={true}
                    style={{ width: 24, height: 24 }}
                  />
                </View>
                <Text className="font-roboto-medium text-xs text-primary flex-1">
                  Sincronizando lecturas con la oficina central...
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center mt-12 p-4">
            {refrescando ? (
              <>
                <View className="w-20 h-20 items-center justify-center mb-3">
                  <LottieView
                    source={ANIMACION_REFRESH}
                    autoPlay
                    loop={true}
                    style={{ width: 80, height: 80 }}
                  />
                </View>
                <Text className="font-roboto-bold text-primary text-base text-center">
                  Cargando lecturas...
                </Text>
                <Text className="font-roboto text-muted text-center text-xs mt-1">
                  Obteniendo datos de las lecturas registradas
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[42px] mb-2">📋</Text>
                <Text className="font-roboto text-muted text-center text-[15px]">
                  Aún no hay lecturas registradas en esta jornada.
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const pendiente = item.sincronizado === 0;
          const tieneUbicacion =
            item.latitud != null &&
            item.longitud != null &&
            !isNaN(Number(item.latitud)) &&
            !isNaN(Number(item.longitud));

          return (
            <View
              className={`bg-card rounded-2xl p-4 border border-border border-l-4 shadow-sm ${
                pendiente ? 'border-l-warning' : 'border-l-success'
              }`}>
              {/* Contenido interactivo de la lectura */}
              <PressableScale onPress={() => handlePressItem(item)}>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="font-roboto text-xs text-muted">Medidor</Text>
                    <Text className="font-roboto-bold text-lg text-primary">
                      {item.medidor_codigo}
                    </Text>
                  </View>
                  <View
                    className={`px-2.5 py-1 rounded-lg ${
                      pendiente ? 'bg-warning-soft' : 'bg-success-soft'
                    }`}>
                    <Text
                      className={`font-roboto-bold text-xs ${
                        pendiente ? 'text-warning' : 'text-success'
                      }`}>
                      {pendiente ? '⏱ PENDIENTE' : '✓ ENVIADO'}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-border my-2.5" />

                <View className="flex-row justify-between py-[3px]">
                  <Text className="font-roboto text-[13px] text-muted">Estado del medidor:</Text>
                  <Text className="font-roboto-medium text-sm text-foreground">
                    {item.estado_medidor}
                  </Text>
                </View>

                <View className="flex-row justify-between py-[3px]">
                  <Text className="font-roboto text-[13px] text-muted">Fecha de registro:</Text>
                  <Text className="font-roboto-medium text-sm text-foreground">
                    {formatoFecha(item.fecha_registro)}
                  </Text>
                </View>

                {item.lectura !== null && (
                  <View className="flex-row justify-between py-[3px]">
                    <Text className="font-roboto text-[13px] text-muted">Lectura tomada:</Text>
                    <Text className="font-roboto-bold text-[15px] text-primary">{item.lectura}</Text>
                  </View>
                )}

                {item.consumo_calculado !== null && (
                  <View className="flex-row justify-between py-[3px]">
                    <Text className="font-roboto text-[13px] text-muted">Consumo calculado:</Text>
                    <Text className="font-roboto-medium text-sm text-foreground">
                      {item.consumo_calculado} m³
                    </Text>
                  </View>
                )}

                {item.motivo && (
                  <View className="flex-row justify-between py-[3px]">
                    <Text className="font-roboto text-[13px] text-muted">Motivo:</Text>
                    <Text className="font-roboto-medium text-sm text-foreground">{item.motivo}</Text>
                  </View>
                )}

                {item.descripcion_dano && (
                  <View className="flex-row justify-between py-[3px]">
                    <Text className="font-roboto text-[13px] text-muted">Daño:</Text>
                    <Text className="font-roboto-medium text-sm text-foreground">
                      {item.descripcion_dano}
                    </Text>
                  </View>
                )}

                <View className="mt-2.5 pt-2 border-t border-slate-100">
                  {pendiente ? (
                    <Text className="font-roboto-medium text-[13px] text-secondary">
                      ✏️ Toque para editar lectura
                    </Text>
                  ) : (
                    <Text className="font-roboto-medium text-[13px] text-emerald-700">
                      🔒 Transmitido a oficina · Registro protegido
                    </Text>
                  )}
                </View>
              </PressableScale>

              {/* ── Mapa DENTRO de la tarjeta ──────────────────────────────── */}
              {tieneUbicacion ? (
                <View className="mt-3.5 pt-3 border-t border-border">
                  <MeterLocationViewer
                    latitud={Number(item.latitud)}
                    longitud={Number(item.longitud)}
                    altura={180}
                  />
                </View>
              ) : (
                <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row items-center gap-1.5">
                  <Text className="font-roboto text-xs text-muted">
                    📍 Sin coordenadas GPS registradas
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {editando && <EditarLecturaModal lectura={editando} onClose={() => setEditando(null)} />}
    </View>
  );
}

function EditarLecturaModal({
  lectura,
  onClose,
}: {
  lectura: LecturaRegistrada;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const esInaccesible = lectura.estado_medidor === 'Inaccesible';
  const esDanado = lectura.estado_medidor === 'Dañado';

  const { data: referencia } = useQuery({
    queryKey: ['referencia-consumo', lectura.medidor_codigo],
    queryFn: () => obtenerReferenciaConsumo(lectura.medidor_codigo),
  });

  const [confirmado, setConfirmado] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(lectura.foto_uri);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const camaraRef = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();

  const solicitarPermiso = async () => {
    const res = await pedirPermiso();
    if (res.granted) {
      setCamaraAbierta(true);
      return;
    }
    appAlert(
      'Permiso de cámara denegado',
      'Se requiere acceso a la cámara para capturar la fotografía de respaldo. Actívelo en los ajustes del dispositivo.',
      'warning',
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
      setFotoUri(guardarFotoPermanente(foto.uri, lectura.medidor_codigo));
      setCamaraAbierta(false);
    } catch {
      appAlert('Error', 'No se pudo guardar la fotografía.', 'error');
    }
  };

  const guardar = useMutation({
    mutationFn: (v: { lectura: string; motivo: string; descripcion: string }) =>
      actualizarLecturaPendiente(lectura.id, {
        lectura: esInaccesible || !v.lectura.trim() ? null : Number(v.lectura),
        motivo: esInaccesible ? v.motivo.trim() : null,
        descripcionDano: esDanado ? v.descripcion.trim() : null,
        fotoUri,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturas'] });
      onClose();
      appAlert('Lectura actualizada', 'La lectura se actualizó correctamente.', 'success');
    },
    onError: (e) => {
      appAlert('Error', e instanceof Error ? e.message : 'No se pudo actualizar la lectura.', 'error');
      queryClient.invalidateQueries({ queryKey: ['lecturas'] });
    },
  });

  const form = useForm({
    defaultValues: {
      lectura: lectura.lectura !== null ? String(lectura.lectura) : '',
      motivo: lectura.motivo ?? '',
      descripcion: lectura.descripcion_dano ?? '',
    },
    onSubmit: ({ value }) => guardar.mutateAsync(value),
  });

  const handleValidarYGuardar = (valores: {
    lectura: string;
    motivo: string;
    descripcion: string;
  }) => {
    if (esInaccesible) {
      if (!valores.motivo.trim()) {
        appAlert('Motivo Requerido', 'El motivo de inaccesibilidad es obligatorio.', 'warning');
        return;
      }
      form.handleSubmit();
      return;
    }

    if (esDanado && !valores.descripcion.trim()) {
      appAlert('Descripción Requerida', 'La descripción del daño es obligatoria.', 'warning');
      return;
    }

    const valorLimpio = valores.lectura.trim();
    if (!valorLimpio && !esDanado) {
      appAlert('Lectura Requerida', 'La lectura actual es obligatoria.', 'warning');
      return;
    }

    if (valorLimpio && !NUMERO.test(valorLimpio)) {
      appAlert(
        'Lectura Inválida',
        'La lectura ingresada debe contener exclusivamente números.',
        'warning',
      );
      return;
    }

    // Evaluación de Consumo Anómalo
    if (valorLimpio && referencia) {
      const numLectura = Number(valorLimpio);
      if (numLectura < referencia.ultimaLectura) {
        appAlert(
          'Lectura Inválida',
          `La lectura ingresada (${numLectura}) no puede ser menor a la lectura anterior (${referencia.ultimaLectura}).`,
          'warning',
        );
        return;
      }

      const resConsumo = calcularConsumo(
        numLectura,
        referencia.ultimaLectura,
        referencia.promedioMensual,
      );
      if (resConsumo.esAnomalo && !confirmado) {
        appAlert(
          'Consumo Anómalo Detectado',
          `El consumo calculado (${resConsumo.consumo} m³) supera 3 veces el promedio mensual (${referencia.promedioMensual * 3}). ¿Confirma que la cifra ingresada es correcta?`,
          'warning',
          [
            { texto: 'Revisar Cifra', secundario: true },
            {
              texto: 'Confirmar y Proceder',
              onPress: () => {
                setConfirmado(true);
                if (!fotoUri) {
                  appAlert(
                    'Fotografía Requerida',
                    'Al registrarse un consumo anómalo, la foto de respaldo es obligatoria.',
                    'warning',
                    [{ texto: 'Tomar Foto', onPress: abrirCamara }],
                  );
                  return;
                }
                form.handleSubmit();
              },
            },
          ],
        );
        return;
      }

      if (resConsumo.esAnomalo && !fotoUri) {
        appAlert(
          'Fotografía Requerida',
          'La fotografía del medidor es obligatoria ante un consumo anómalo.',
          'warning',
          [{ texto: 'Tomar Foto', onPress: abrirCamara }],
        );
        return;
      }
    }

    if (esDanado && !fotoUri) {
      appAlert(
        'Fotografía Requerida',
        'La fotografía del medidor es obligatoria para registros en estado Dañado.',
        'warning',
        [{ texto: 'Tomar Foto', onPress: abrirCamara }],
      );
      return;
    }

    form.handleSubmit();
  };

  if (camaraAbierta) {
    return (
      <Modal animationType="slide" onRequestClose={() => setCamaraAbierta(false)}>
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
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/45 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View className="bg-card rounded-t-[20px] p-5 max-h-[90%]">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerClassName="pb-2">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-roboto text-[13px] text-muted">
                  Editar Registro Pendiente
                </Text>
                <Text className="font-roboto-bold text-xl text-primary mt-0.5">
                  Medidor: {lectura.medidor_codigo}
                </Text>
              </View>
              <Pressable
                className="w-8 h-8 rounded-full bg-input items-center justify-center"
                onPress={onClose}>
                <Text className="text-[15px] text-muted font-roboto-bold">✕</Text>
              </Pressable>
            </View>

            <Text className="font-roboto-medium text-sm text-secondary my-2">
              Estado: {lectura.estado_medidor}
            </Text>

            {/* Visor de mapa si hay coordenadas guardadas */}
            {typeof lectura.latitud === 'number' &&
              typeof lectura.longitud === 'number' &&
              !isNaN(lectura.latitud) &&
              !isNaN(lectura.longitud) && (
              <View className="mb-3">
                <MeterLocationViewer
                  latitud={lectura.latitud}
                  longitud={lectura.longitud}
                  altura={180}
                />
              </View>
            )}

            {!esInaccesible && (
              <form.Field name="lectura">
                {(field) => (
                  <View className="mt-3">
                    <Text className="font-roboto-medium text-sm text-primary mb-1.5">
                      Lectura actual {esDanado ? '(opcional)' : '(obligatoria)'}
                    </Text>
                    <TextInput
                      className="font-roboto-medium min-h-[52px] border-[1.5px] border-border rounded-xl px-3.5 text-lg text-foreground bg-background"
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColorClassName="accent-slate-400"
                    />
                  </View>
                )}
              </form.Field>
            )}

            {esInaccesible && (
              <form.Field name="motivo">
                {(field) => (
                  <View className="mt-3">
                    <Text className="font-roboto-medium text-sm text-primary mb-1.5">
                      Motivo de inaccesibilidad
                    </Text>
                    <TextInput
                      className="font-roboto-medium min-h-[52px] border-[1.5px] border-border rounded-xl px-3.5 text-lg text-foreground bg-background"
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="Describa el motivo"
                      placeholderTextColorClassName="accent-slate-400"
                    />
                  </View>
                )}
              </form.Field>
            )}

            {esDanado && (
              <form.Field name="descripcion">
                {(field) => (
                  <View className="mt-3">
                    <Text className="font-roboto-medium text-sm text-primary mb-1.5">
                      Descripción del daño
                    </Text>
                    <TextInput
                      className="font-roboto-medium min-h-[70px] border-[1.5px] border-border rounded-xl px-3.5 text-lg text-foreground bg-background pt-3"
                      style={{ textAlignVertical: 'top' }}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      multiline
                      placeholder="Describa el daño del medidor"
                      placeholderTextColorClassName="accent-slate-400"
                    />
                  </View>
                )}
              </form.Field>
            )}

            <form.Subscribe
              selector={(s) => [s.values.lectura, s.values.motivo, s.values.descripcion] as const}>
              {([l, m, d]) => {
                const anomalo =
                  !esInaccesible &&
                  !!referencia &&
                  NUMERO.test(l.trim()) &&
                  calcularConsumo(Number(l), referencia.ultimaLectura, referencia.promedioMensual)
                    .esAnomalo;
                const fotoObligatoria = anomalo || esDanado;

                return (
                  <>
                    {anomalo && (
                      <FadeSlideIn
                        visible={anomalo}
                        className="bg-warning-soft border-[1.5px] border-warning rounded-xl p-3 mt-3.5">
                        <Text className="font-roboto-bold text-[15px] text-amber-800">
                          ⚠️ Consumo alto detectado
                        </Text>
                        <Text className="font-roboto text-[13px] text-amber-800 mt-0.5">
                          Supera 3 veces el promedio mensual ({referencia?.promedioMensual * 3}). La
                          foto de respaldo es obligatoria.
                        </Text>
                        <Pressable
                          className="flex-row items-center mt-2.5 min-h-10"
                          onPress={() => setConfirmado(!confirmado)}>
                          <View
                            className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-2.5 ${
                              confirmado ? 'bg-primary border-primary' : 'bg-white border-warning'
                            }`}>
                            {confirmado && (
                              <Text className="text-white text-[15px] font-roboto-bold">✓</Text>
                            )}
                          </View>
                          <Text className="flex-1 font-roboto-medium text-[13px] text-amber-800">
                            Confirmar que la lectura es correcta
                          </Text>
                        </Pressable>
                      </FadeSlideIn>
                    )}

                    {(fotoObligatoria || fotoUri) && (
                      <View className="mt-3">
                        <Text className="font-roboto-medium text-sm text-primary mb-1.5">
                          Foto de respaldo {fotoObligatoria ? '(obligatoria)' : '(opcional)'}
                        </Text>
                        {fotoUri && (
                          <View className="rounded-xl border border-border overflow-hidden mb-2">
                            <Image
                              source={{ uri: fotoUri }}
                              resizeMode="cover"
                              className="w-full h-40"
                            />
                          </View>
                        )}
                        <Pressable
                          className={`min-h-[46px] rounded-[10px] items-center justify-center active:opacity-85 ${
                            fotoUri ? 'bg-input border border-border' : 'bg-secondary'
                          }`}
                          onPress={abrirCamara}>
                          <Text
                            className={`font-roboto-medium text-sm ${
                              fotoUri ? 'text-primary' : 'text-white'
                            }`}>
                            {fotoUri ? 'Repetir Fotografía' : 'Tomar Fotografía'}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <View className="flex-row gap-3 mt-5">
                      <Pressable
                        className="flex-1 min-h-[52px] rounded-xl bg-input border border-border items-center justify-center active:opacity-85"
                        onPress={onClose}>
                        <Text className="font-roboto-medium text-foreground text-base">
                          Cancelar
                        </Text>
                      </Pressable>
                      <Pressable
                        className="flex-1 min-h-[52px] rounded-xl bg-primary items-center justify-center active:opacity-85 disabled:opacity-60"
                        disabled={guardar.isPending}
                        onPress={() =>
                          handleValidarYGuardar({ lectura: l, motivo: m, descripcion: d })
                        }>
                        {guardar.isPending ? (
                          <View className="flex-row items-center justify-center gap-2">
                            <View className="w-5 h-5 items-center justify-center">
                              <LottieView
                                source={ANIMACION_REFRESH}
                                autoPlay
                                loop={true}
                                style={{ width: 20, height: 20 }}
                              />
                            </View>
                            <Text className="font-roboto-bold text-white text-base">
                              Guardando...
                            </Text>
                          </View>
                        ) : (
                          <Text className="font-roboto-bold text-white text-base">
                            Guardar Cambios
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                );
              }}
            </form.Subscribe>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
