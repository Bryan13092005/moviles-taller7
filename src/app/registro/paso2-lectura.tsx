import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HeaderEpmaps } from '@/components/header-epmaps';
import { BotonCancelarRegistro } from '@/components/boton-cancelar-registro';
import { AnimatedSpinner } from '@/components/animations/animated-spinner';
import { FadeSlideIn } from '@/components/animations/fade-slide-in';
import { ProgressBarRegistro } from '@/components/progress-bar-registro';
import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';

const NUMERO = /^\d+(\.\d+)?$/;

/** Botón estilizado de retorno prominente con esquinas redondeadas */
function BotonVolver({ onPress, label = 'Volver al Paso 1' }: { onPress: () => void; label?: string }) {
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

export default function Paso2LecturaScreen() {
  const router = useRouter();
  const medidorCodigo = useLecturaStore((s) => s.medidorCodigo);
  const estado = useLecturaStore((s) => s.estadoMedidor);
  const confirmacion = useLecturaStore((s) => s.confirmacionAnomalia);
  const { data: medidor, isLoading } = useMedidorQuery(medidorCodigo || null);

  // R5: En 'danado' la lectura es opcional; en 'normal' es obligatoria.
  const lecturaOpcional = estado === 'danado';

  const form = useForm({
    defaultValues: { lectura: useLecturaStore.getState().lecturaActual },
    onSubmit: () => {
      router.push('/registro/confirmacion' as never);
    },
  });

  const actualizarStore = (valor: string) => {
    const s = useLecturaStore.getState();
    s.setLecturaActual(valor);
    const n = Number(valor);
    const anomalo =
      !!medidor &&
      NUMERO.test(valor.trim()) &&
      calcularConsumo(n, medidor.ultimaLectura, medidor.promedioMensual).esAnomalo;
    s.setEsAnomalo(anomalo);
  };

  /** Validador de negocio R5 y R6 con mensajes destinados a Alert.alert */
  const validarLecturaParaAlerta = (valor: string): { esValido: boolean; motivo?: string } => {
    const limpio = valor.trim();
    if (!limpio) {
      if (lecturaOpcional) return { esValido: true };
      return {
        esValido: false,
        motivo: 'La lectura actual es obligatoria para medidores en estado normal.',
      };
    }
    if (!NUMERO.test(limpio)) {
      return {
        esValido: false,
        motivo: 'La lectura ingresada debe contener exclusivamente números.',
      };
    }
    if (medidor && Number(limpio) < medidor.ultimaLectura) {
      return {
        esValido: false,
        motivo: `La lectura ingresada (${limpio}) no puede ser menor a la lectura anterior (${medidor.ultimaLectura}).`,
      };
    }
    return { esValido: true };
  };

  const handleSiguientePaso = (lecturaActual: string) => {
    const resultado = validarLecturaParaAlerta(lecturaActual);
    if (!resultado.esValido) {
      Alert.alert('Lectura Inválida', resultado.motivo);
      return;
    }

    const n = Number(lecturaActual.trim());
    const hayLectura = NUMERO.test(lecturaActual.trim());
    const esAnomalo =
      !!medidor &&
      hayLectura &&
      calcularConsumo(n, medidor.ultimaLectura, medidor.promedioMensual).esAnomalo;

    if (esAnomalo && !confirmacion) {
      Alert.alert(
        'Confirmación Requerida',
        `El consumo calculado supera 3 veces el promedio mensual (${medidor.promedioMensual * 3}). Debe confirmar la lectura antes de
        continuar.`,
      );
      return;
    }

    form.handleSubmit();
  };

  if (isLoading || !medidor) {
    return (
      <View className="flex-1 bg-background">
        <HeaderEpmaps />
        <BotonCancelarRegistro />
        <View className="flex-1 items-center justify-center">
          <AnimatedSpinner size={48} />
          <Text className="font-roboto-medium text-muted text-[15px] mt-3">
            Cargando datos del medidor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <HeaderEpmaps />
      <BotonCancelarRegistro />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerClassName="p-[18px] pb-9"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <BotonVolver onPress={() => router.back()} />

          <ProgressBarRegistro pasoActual={2} />
          <Text className="font-roboto-bold text-2xl text-primary mt-0.5">Lectura actual</Text>
          <Text className="font-roboto-medium text-[15px] text-muted mb-4">
            Medidor: {medidorCodigo}
          </Text>

          {/* Tarjeta de referencia de consumo previo */}
          <View className="bg-card rounded-xl border border-border p-3.5 mb-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-roboto text-muted text-sm">Última lectura registrada</Text>
              <Text className="font-roboto-bold text-foreground text-base">
                {medidor.ultimaLectura}
              </Text>
            </View>
            <View className="flex-row justify-between items-center border-t border-slate-100 mt-2 pt-2">
              <Text className="font-roboto text-muted text-sm">Promedio mensual</Text>
              <Text className="font-roboto-bold text-foreground text-base">
                {medidor.promedioMensual}
              </Text>
            </View>
          </View>

          {/* Tarjeta Elevada: Formulario de lectura y confirmación de anomalía */}
          <form.Field name="lectura">
            {(field) => (
              <View className="bg-card rounded-2xl border border-border p-[18px] mb-4 shadow-sm">
                <Text className="font-roboto-medium text-[15px] text-primary mb-2">
                  Lectura actual {lecturaOpcional ? '(opcional)' : '(obligatoria)'}
                </Text>
                <TextInput
                  className="font-roboto-bold min-h-16 border-[1.5px] border-border rounded-xl px-4 text-[28px] text-foreground bg-background"
                  value={field.state.value}
                  onChangeText={(t) => {
                    field.handleChange(t);
                    actualizarStore(t);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColorClassName="accent-slate-400"
                />

                <form.Subscribe selector={(s) => s.values.lectura}>
                  {(lectura) => {
                    const hayLectura = NUMERO.test(lectura.trim());
                    const validacion = validarLecturaParaAlerta(lectura);
                    const resultado =
                      hayLectura && validacion.esValido
                        ? calcularConsumo(
                            Number(lectura),
                            medidor.ultimaLectura,
                            medidor.promedioMensual,
                          )
                        : null;
                    const anomalo = !!resultado?.esAnomalo;

                    return (
                      <>
                        {resultado && (
                          <View className="mt-4 pt-3 border-t border-border">
                            <Text className="font-roboto-medium text-[13px] text-muted">
                              Consumo calculado
                            </Text>
                            <Text
                              className={`font-roboto-bold text-3xl mt-0.5 ${
                                anomalo ? 'text-warning' : 'text-primary'
                              }`}>
                              {resultado.consumo} m³
                            </Text>
                          </View>
                        )}

                        {anomalo && (
                          <FadeSlideIn
                            visible={anomalo}
                            className="bg-warning-soft border-[1.5px] border-warning rounded-xl p-3.5 mt-4">
                            <Text className="font-roboto-bold text-base text-amber-800">
                              ⚠️ Consumo alto detectado
                            </Text>
                            <Text className="font-roboto text-[13px] text-amber-800 mt-1 leading-[18px]">
                              El consumo supera 3 veces el promedio mensual (
                              {medidor.promedioMensual * 3}). La fotografía del medidor será
                              obligatoria en el Paso 3.
                            </Text>
                            <Pressable
                              className="flex-row items-center mt-3 min-h-11"
                              onPress={() =>
                                useLecturaStore.getState().setConfirmacionAnomalia(!confirmacion)
                              }>
                              <View
                                className={`w-[26px] h-[26px] rounded-[7px] border-2 items-center justify-center mr-2.5 ${
                                  confirmacion
                                    ? 'bg-primary border-primary'
                                    : 'bg-white border-warning'
                                }`}>
                                {confirmacion && (
                                  <Text className="text-white text-base font-roboto-bold">✓</Text>
                                )}
                              </View>
                              <Text className="flex-1 font-roboto-medium text-sm text-amber-800">
                                Confirmo que la lectura ingresada es correcta
                              </Text>
                            </Pressable>
                          </FadeSlideIn>
                        )}

                        {lectura.trim() !== '' && !validacion.esValido && (
                          <Text className="text-danger mt-2 font-roboto-medium">
                            {validacion.motivo}
                          </Text>
                        )}

                        <Pressable
                          disabled={!validacion.esValido}
                          className="min-h-[54px] rounded-xl bg-primary items-center justify-center mt-5 active:opacity-90 disabled:opacity-40"
                          onPress={() => handleSiguientePaso(lectura)}>
                          <Text className="font-roboto-medium text-white text-[17px]">
                            Siguiente Paso
                          </Text>
                        </Pressable>
                      </>
                    );
                  }}
                </form.Subscribe>
              </View>
            )}
          </form.Field>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
