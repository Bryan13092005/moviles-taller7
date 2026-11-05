import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { appAlert } from '@/components/app-alert';
import { FadeSlideIn } from '@/components/animations/fade-slide-in';
import { HeaderEpmaps } from '@/components/header-epmaps';
import { getSession, logout } from '@/features/auth/auth.service';
import { useRecuperarBorrador } from '@/features/lecturas/useRecuperarBorrador';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { validarCodigoMedidor } from '@/features/medidores/medidores.validator';
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';

const inputBase =
  'font-roboto-bold min-h-14 border-[1.5px] rounded-2xl px-4 text-[22px] tracking-[1px] text-slate-800 bg-input';
const inputClass = `${inputBase} border-border`;
const inputErrorClass = `${inputBase} border-danger`;

export default function BusquedaScreen() {
  const router = useRouter();
  useRecuperarBorrador();
  const [codigoConsulta, setCodigoConsulta] = useState<string | null>(null);
  const [emailSesion, setEmailSesion] = useState('');
  const [nombreSesion, setNombreSesion] = useState('');
  const query = useMedidorQuery(codigoConsulta);
  const medidor = query.data ?? null;
  const errorConsulta = query.error
    ? query.error instanceof Error
      ? query.error.message
      : 'No se pudo consultar el medidor'
    : '';

  useEffect(() => {
    if (errorConsulta) {
      const noRed = /conexi/i.test(errorConsulta);
      const dup = /registrad|mes/i.test(errorConsulta);
      appAlert(
        noRed ? 'Sin conexión' : dup ? 'Medidor ya registrado' : 'Medidor no encontrado',
        errorConsulta,
        noRed || dup ? 'warning' : 'error',
      );
    }
  }, [errorConsulta, query.errorUpdatedAt]);

  useEffect(() => {
    if (medidor && query.dataUpdatedAt) {
      Keyboard.dismiss();
      appAlert('Medidor encontrado', `${medidor.codigo} — ${medidor.direccion}`, 'success');
    }
  }, [medidor?.codigo, query.dataUpdatedAt]);

  useEffect(() => {
    let activo = true;
    getSession().then((s) => {
      if (!activo) return;
      if (!s) {
        router.replace('/' as never);
        return;
      }
      setEmailSesion(s.email);
      setNombreSesion(s.displayName ?? '');
    });
    return () => {
      activo = false;
    };
  }, [router]);

  const form = useForm({
    defaultValues: { codigo: '' },
    onSubmit: ({ value }) => {
      Keyboard.dismiss();
      if (value.codigo === codigoConsulta) {
        query.refetch();
      } else {
        setCodigoConsulta(value.codigo);
      }
    },
  });

  const filas: [string, string][] = medidor
    ? [
        ['Dirección', medidor.direccion],
        ['Sector', medidor.sector],
        ['Número de cuenta', medidor.numeroCuenta],
        ['Estado', medidor.estado],
        ['Última lectura', String(medidor.ultimaLectura)],
        ['Fecha última lectura', medidor.fechaLectura],
        ['Promedio mensual', String(medidor.promedioMensual)],
      ]
    : [];

  return (
    <View className="flex-1 bg-background">
      <HeaderEpmaps />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerClassName="p-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View className="flex-row flex-wrap justify-end items-center gap-2 mb-2">
            <Pressable
              className="min-h-10 px-3.5 rounded-xl border-[1.5px] border-accent bg-accent-soft justify-center active:opacity-85"
              onPress={() => router.push('/cuenta/editar-nombre' as never)}>
              <Text className="font-roboto-medium text-primary text-sm">Editar nombre</Text>
            </Pressable>
            <Pressable
              className="min-h-10 px-3.5 rounded-xl border-[1.5px] border-accent bg-accent-soft justify-center active:opacity-85"
              onPress={() => router.push('/cuenta/cambiar-password' as never)}>
              <Text className="font-roboto-medium text-primary text-sm">Cambiar contraseña</Text>
            </Pressable>
            <Pressable
              className="min-h-10 px-3.5 rounded-xl border-[1.5px] border-danger bg-danger-soft justify-center active:opacity-85"
              onPress={() =>
                Alert.alert('Cerrar sesión', '¿Desea cerrar la sesión actual?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                      await logout();
                      router.replace('/' as never);
                    },
                  },
                ])
              }>
              <Text className="font-roboto-medium text-danger text-sm">Cerrar Sesión</Text>
            </Pressable>
          </View>
          <View className="mb-3.5">
            <Text className="font-roboto-bold text-primary text-lg">
              Hola, {nombreSesion || 'técnico'}
            </Text>
            {!!emailSesion && (
              <Text className="font-roboto text-muted text-xs mt-px">{emailSesion}</Text>
            )}
          </View>
          <Text className="font-roboto-bold text-2xl text-primary mb-4">Consultar medidor</Text>
          <Pressable
            onPress={() => router.push('/historial' as never)}
            className="min-h-[52px] rounded-2xl bg-accent-soft border-[1.5px] border-accent border-b-4 items-center justify-center mb-5 active:opacity-85">
            <Text className="font-roboto-bold text-primary text-base">
              📋  Ver historial de lecturas
            </Text>
          </Pressable>

          <form.Field
            name="codigo"
            validators={{
              onChange: ({ value }) => validarCodigoMedidor(value).mensajeError,
            }}>
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <View className="mb-4">
                  <Text className="font-roboto-medium text-sm text-primary mb-1.5">
                    Código del medidor
                  </Text>
                  <TextInput
                    className={!!err && field.state.value.length > 0 ? inputErrorClass : inputClass}
                    value={field.state.value}
                    onChangeText={(t) => {
                      field.handleChange(t.toUpperCase());
                      setCodigoConsulta(null);
                    }}
                    onBlur={field.handleBlur}
                    maxLength={10}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="MED-123456"
                    placeholderTextColorClassName="accent-slate-400"
                  />
                  {!!err && field.state.value.length > 0 && (
                    <Text className="font-roboto text-danger text-[13px] mt-1">{String(err)}</Text>
                  )}
                </View>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(s) => [s.canSubmit, s.values.codigo] as const}>
            {([canSubmit, codigo]) => {
              const isSubmitting = query.isFetching;
              const habilitado = validarCodigoMedidor(codigo).esValido && canSubmit && !isSubmitting;
              return (
                <Pressable
                  className="min-h-[58px] rounded-2xl bg-primary items-center justify-center border-b-4 border-b-primary-dark shadow-md active:opacity-85 disabled:opacity-45"
                  disabled={!habilitado}
                  onPress={() => form.handleSubmit()}>
                  {isSubmitting ? (
                    <ActivityIndicator colorClassName="accent-white" />
                  ) : (
                    <Text className="font-roboto-bold text-white text-lg tracking-[0.5px]">
                      Buscar
                    </Text>
                  )}
                </Pressable>
              );
            }}
          </form.Subscribe>

          {medidor && (
            <FadeSlideIn
              visible
              className="mt-5 bg-card rounded-2xl p-[18px] shadow-md border border-border border-l-[5px] border-l-accent">
              <Text className="font-roboto-bold text-[22px] text-primary mb-2">{medidor.codigo}</Text>
              {filas.map(([k, v]) => (
                <View
                  key={k}
                  className="flex-row justify-between py-2 border-b border-border/70">
                  <Text className="font-roboto text-muted text-sm">{k}</Text>
                  <Text className="font-roboto-medium text-slate-900 text-[15px] shrink text-right ml-3">
                    {v}
                  </Text>
                </View>
              ))}
              <Pressable
                className="min-h-[58px] rounded-2xl bg-secondary items-center justify-center border-b-4 border-b-secondary-dark shadow-md active:opacity-85 mt-4"
                onPress={() => {
                  const s = useLecturaStore.getState();
                  if (s.medidorCodigo !== medidor.codigo) {
                    s.resetFormulario();
                    s.setMedidorCodigo(medidor.codigo);
                  }
                  router.push('/registro/paso1-estado' as never);
                }}>
                <Text className="font-roboto-bold text-white text-lg tracking-[0.5px]">
                  Iniciar Registro
                </Text>
              </Pressable>
            </FadeSlideIn>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
