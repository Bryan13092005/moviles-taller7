import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BotonCancelarRegistro } from '@/components/boton-cancelar-registro';
import { HeaderEpmaps } from '@/components/header-epmaps';
import { ProgressBarRegistro } from '@/components/progress-bar-registro';
import { useLecturaStore, type EstadoMedidor } from '@/features/lecturas/useLecturaStore';

const ESTADOS: {
  valor: EstadoMedidor;
  etiqueta: string;
  dot: string;
  activeCard: string;
  activeText: string;
}[] = [
  {
    valor: 'normal',
    etiqueta: 'Normal',
    dot: 'bg-accent',
    activeCard: 'border-accent bg-white',
    activeText: 'text-accent',
  },
  {
    valor: 'inaccesible',
    etiqueta: 'Inaccesible',
    dot: 'bg-amber-500',
    activeCard: 'border-amber-500 bg-white',
    activeText: 'text-amber-500',
  },
  {
    valor: 'danado',
    etiqueta: 'Dañado',
    dot: 'bg-danger',
    activeCard: 'border-danger bg-white',
    activeText: 'text-danger',
  },
];

const MOTIVOS = ['Perro agresivo', 'Predio cerrado', 'Medidor bloqueado', 'Acceso peligroso'];

const inputBase =
  'font-roboto min-h-[52px] border-[1.5px] rounded-xl px-3.5 text-base text-slate-900 bg-card';
const inputClass = `${inputBase} border-slate-300`;
const inputErrorClass = `${inputBase} border-danger`;

export default function Paso1EstadoScreen() {
  const router = useRouter();
  const store = useLecturaStore;
  const inicial = store.getState();

  const form = useForm({
    defaultValues: {
      estado: inicial.estadoMedidor as EstadoMedidor,
      motivo: inicial.motivoInaccesibilidad,
      descripcion: inicial.descripcionDano,
    },
    onSubmit: ({ value }) => {
      // Inaccesible salta a la confirmación; Normal y Dañado siguen a la lectura.
      const ruta =
        value.estado === 'inaccesible' ? '/registro/confirmacion' : '/registro/paso2-lectura';
      router.push(ruta as never);
    },
  });

  return (
    <View className="flex-1 bg-background">
      <HeaderEpmaps subtitulo="Registro" />
      <BotonCancelarRegistro />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerClassName="p-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <ProgressBarRegistro pasoActual={1} />
          <Text className="font-roboto-bold text-2xl text-primary mt-0.5">Estado del medidor</Text>
          {!!store.getState().medidorCodigo && (
            <Text className="font-roboto-bold text-base text-slate-600 mb-4">
              {store.getState().medidorCodigo}
            </Text>
          )}

          <form.Field name="estado">
            {(field) => (
              <View className="gap-2.5 mt-2 mb-4">
                {ESTADOS.map((e) => {
                  const activo = field.state.value === e.valor;
                  return (
                    <Pressable
                      key={e.valor}
                      onPress={() => {
                        field.handleChange(e.valor);
                        store.getState().setEstadoMedidor(e.valor);
                        if (e.valor !== 'inaccesible') form.setFieldValue('motivo', '');
                        if (e.valor !== 'danado') form.setFieldValue('descripcion', '');
                      }}
                      className={`flex-row items-center min-h-[60px] px-4 rounded-xl border-2 bg-card shadow-sm active:opacity-90 ${
                        activo ? e.activeCard : 'border-border'
                      }`}>
                      <View className={`w-3.5 h-3.5 rounded-full mr-3 ${e.dot}`} />
                      <Text
                        className={`font-roboto-medium text-lg ${
                          activo ? e.activeText : 'text-slate-700'
                        }`}>
                        {e.etiqueta}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.estado}>
            {(estado) => (
              <>
                {estado === 'inaccesible' && (
                  <View className="bg-card rounded-xl p-4 mb-4 shadow-sm">
                    <Text className="font-roboto-medium text-sm text-primary mb-2">
                      Motivo (obligatorio)
                    </Text>
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {MOTIVOS.map((m) => (
                        <Pressable
                          key={m}
                          className="px-3 py-2 rounded-full bg-background border border-accent active:opacity-85"
                          onPress={() => {
                            form.setFieldValue('motivo', m);
                            store.getState().setMotivoInaccesibilidad(m);
                          }}>
                          <Text className="font-roboto text-sm text-primary">{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <form.Field
                      name="motivo"
                      validators={{
                        onChange: ({ value, fieldApi }) =>
                          fieldApi.form.getFieldValue('estado') === 'inaccesible' && !value.trim()
                            ? 'El motivo es obligatorio'
                            : undefined,
                      }}>
                      {(field) => (
                        <>
                          <TextInput
                            className={
                              field.state.meta.errors.length > 0 ? inputErrorClass : inputClass
                            }
                            value={field.state.value}
                            onChangeText={(t) => {
                              field.handleChange(t);
                              store.getState().setMotivoInaccesibilidad(t);
                            }}
                            placeholder="Describa el motivo"
                            placeholderTextColorClassName="accent-slate-400"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <Text className="font-roboto text-danger text-[13px] mt-1">
                              {String(field.state.meta.errors[0])}
                            </Text>
                          )}
                        </>
                      )}
                    </form.Field>
                    <Text className="font-roboto text-[13px] text-muted mt-2.5">
                      La lectura queda bloqueada. Pasará directo a la confirmación.
                    </Text>
                  </View>
                )}

                {estado === 'danado' && (
                  <View className="bg-card rounded-xl p-4 mb-4 shadow-sm">
                    <Text className="font-roboto-medium text-sm text-primary mb-2">
                      Descripción del daño (obligatoria)
                    </Text>
                    <form.Field
                      name="descripcion"
                      validators={{
                        onChange: ({ value, fieldApi }) =>
                          fieldApi.form.getFieldValue('estado') === 'danado' && !value.trim()
                            ? 'La descripción del daño es obligatoria'
                            : undefined,
                      }}>
                      {(field) => (
                        <>
                          <TextInput
                            className={`${
                              field.state.meta.errors.length > 0 ? inputErrorClass : inputClass
                            } min-h-[100px] pt-3`}
                            style={{ textAlignVertical: 'top' }}
                            value={field.state.value}
                            onChangeText={(t) => {
                              field.handleChange(t);
                              store.getState().setDescripcionDano(t);
                            }}
                            multiline
                            placeholder="Describa el daño del medidor"
                            placeholderTextColorClassName="accent-slate-400"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <Text className="font-roboto text-danger text-[13px] mt-1">
                              {String(field.state.meta.errors[0])}
                            </Text>
                          )}
                        </>
                      )}
                    </form.Field>
                    <Text className="font-roboto text-[13px] text-muted mt-2.5">
                      La lectura es opcional y la foto será obligatoria en el Paso 3.
                    </Text>
                  </View>
                )}
              </>
            )}
          </form.Subscribe>

          <form.Subscribe
            selector={(s) => [s.values.estado, s.values.motivo, s.values.descripcion] as const}>
            {([estado, motivo, descripcion]) => {
              const completo =
                estado === 'normal' ||
                (estado === 'inaccesible' && motivo.trim().length > 0) ||
                (estado === 'danado' && descripcion.trim().length > 0);
              const habilitado = completo;
              return (
                <Pressable
                  className="min-h-14 rounded-xl bg-primary items-center justify-center mt-1 active:opacity-85 disabled:opacity-45"
                  disabled={!habilitado}
                  onPress={() => form.handleSubmit()}>
                  <Text className="font-roboto-medium text-white text-lg">
                    {estado === 'inaccesible' ? 'Ir a confirmación' : 'Continuar a lectura'}
                  </Text>
                </Pressable>
              );
            }}
          </form.Subscribe>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
