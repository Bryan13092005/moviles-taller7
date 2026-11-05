import { useForm } from '@tanstack/react-form';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { appAlert } from '@/components/app-alert';
import { AnimatedSpinner } from '@/components/animations/animated-spinner';
import { AuthScreen } from '@/components/auth/auth-screen';
import { authClass } from '@/components/auth/auth-classes';
import { mensajeErrorAuth } from '@/features/auth/auth.errors';
import { actualizarNombre, getSession, type Session } from '@/features/auth/auth.service';
import { DISPLAY_NAME_MAX_LENGTH, validarNombre } from '@/features/auth/profile';

export default function EditarNombreScreen() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let activo = true;
    getSession().then((s) => {
      if (activo) setSession(s);
    });
    return () => {
      activo = false;
    };
  }, []);

  if (session === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <AnimatedSpinner size={48} />
      </View>
    );
  }

  if (session === null) return <Redirect href={'/' as never} />;

  return <EditarNombreForm session={session} />;
}

function EditarNombreForm({ session }: { session: Session }) {
  const router = useRouter();
  const [nombreActual, setNombreActual] = useState(session.displayName ?? '');

  const form = useForm({
    defaultValues: { nombre: session.displayName ?? '' },
    onSubmit: async ({ value }) => {
      try {
        const actualizada = await actualizarNombre(value.nombre);
        const nombre = actualizada.displayName ?? '';
        setNombreActual(nombre);
        form.setFieldValue('nombre', nombre);
        appAlert(
          'Nombre actualizado',
          `Tu nombre ahora es "${nombre}".`,
          'success',
          [
            {
              texto: 'Volver a la búsqueda',
              onPress: () => router.replace('/busqueda' as never),
            },
          ],
        );
      } catch (error) {
        appAlert('No se pudo actualizar el nombre', mensajeErrorAuth(error), 'error');
      }
    },
  });

  return (
    <AuthScreen
      title="Editar nombre"
      subtitle="Actualiza el nombre que se muestra en tu cuenta de EPMAPS Campo."
      headerSubtitle="Mi cuenta"
      footer={
        <Pressable className={authClass.footer} onPress={() => router.replace('/busqueda' as never)}>
          <Text className={authClass.footerText}>
            <Text className={authClass.footerLink}>Volver a la búsqueda</Text>
          </Text>
        </Pressable>
      }>
      <View className={authClass.sessionBox}>
        <Text className={authClass.sessionLabel}>Cuenta</Text>
        <Text className={authClass.sessionValue}>{session.email}</Text>
        {!!nombreActual && (
          <>
            <Text className={`${authClass.sessionLabel} mt-2.5`}>Nombre actual</Text>
            <Text className={authClass.sessionValue}>{nombreActual}</Text>
          </>
        )}
      </View>

      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => validarNombre(value),
          onSubmit: ({ value }) => validarNombre(value),
        }}>
        {(field) => (
          <View className={authClass.group}>
            <Text className={authClass.label}>Nombre del usuario</Text>
            <TextInput
              className={
                field.state.meta.errors.length > 0 ? authClass.inputError : authClass.input
              }
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              autoComplete="name"
              placeholder="Ej. Bryan Salvador"
              placeholderTextColorClassName="accent-slate-400"
            />
            {(field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
              field.state.meta.errors.length > 0 && (
                <Text className={authClass.error}>{String(field.state.meta.errors[0])}</Text>
              )}
            <Text className={authClass.hint}>
              El nombre se guarda con updateProfile de Firebase en tu cuenta autenticada.
            </Text>
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Pressable
            className={authClass.button}
            disabled={!canSubmit || isSubmitting}
            onPress={() => form.handleSubmit()}>
            {isSubmitting ? (
              <ActivityIndicator colorClassName="accent-white" />
            ) : (
              <Text className={authClass.buttonText}>Guardar nombre</Text>
            )}
          </Pressable>
        )}
      </form.Subscribe>
    </AuthScreen>
  );
}
