import { useForm } from '@tanstack/react-form';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { appAlert } from '@/components/app-alert';
import { AnimatedSpinner } from '@/components/animations/animated-spinner';
import { AuthScreen } from '@/components/auth/auth-screen';
import { authClass } from '@/components/auth/auth-classes';
import { PasswordField } from '@/components/auth/password-field';
import { PasswordRequirements } from '@/components/auth/password-requirements';
import { IndicadorSeguridadContrasena } from '@/components/auth/password-strength-indicator';
import { mensajeErrorAuth } from '@/features/auth/auth.errors';
import { cambiarContrasena, getSession, type Session } from '@/features/auth/auth.service';
import { calcularFortalezaContrasena, validarContrasena } from '@/features/auth/password';

export default function CambiarContrasenaScreen() {
  const router = useRouter();
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

  const form = useForm({
    defaultValues: { actual: '', nueva: '', confirmar: '' },
    onSubmit: async ({ value }) => {
      try {
        await cambiarContrasena(value.actual, value.nueva);
        form.reset();
        appAlert(
          'Contraseña actualizada',
          'Tu contraseña se cambió correctamente.',
          'success',
          [
            {
              texto: 'Volver a la búsqueda',
              onPress: () => router.replace('/busqueda' as never),
            },
          ],
        );
      } catch (error) {
        appAlert('No se pudo cambiar la contraseña', mensajeErrorAuth(error, 'cambio'), 'error');
      }
    },
  });

  if (session === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <AnimatedSpinner size={48} />
      </View>
    );
  }

  if (session === null) return <Redirect href={'/' as never} />;

  return (
    <AuthScreen
      title="Cambiar contraseña"
      subtitle="Actualiza la contraseña de tu cuenta. Por seguridad debes confirmar tu contraseña actual."
      headerSubtitle="Mi cuenta"
      footer={
        <Pressable className={authClass.footer} onPress={() => router.replace('/busqueda' as never)}>
          <Text className={authClass.footerText}>
            <Text className={authClass.footerLink}>Volver a la búsqueda</Text>
          </Text>
        </Pressable>
      }>
      <View className={authClass.sessionBox}>
        <Text className={authClass.sessionLabel}>Sesión activa</Text>
        <Text className={authClass.sessionValue}>{session.email}</Text>
      </View>

      <form.Field
        name="actual"
        validators={{
          onChange: ({ value }) => (!value ? 'Ingresa tu contraseña actual' : undefined),
          onSubmit: ({ value }) => (!value ? 'Ingresa tu contraseña actual' : undefined),
        }}>
        {(field) => (
          <View className={authClass.group}>
            <Text className={authClass.label}>Contraseña actual</Text>
            <PasswordField
              hasError={field.state.meta.errors.length > 0}
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoComplete="current-password"
              textContentType="password"
              placeholder="••••••"
            />
            {(field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
              field.state.meta.errors.length > 0 && (
                <Text className={authClass.error}>{String(field.state.meta.errors[0])}</Text>
              )}
          </View>
        )}
      </form.Field>

      <form.Field
        name="nueva"
        validators={{
          onChange: ({ value, fieldApi }) => {
            const error = validarContrasena(value);
            if (error) return error;
            if (value === fieldApi.form.getFieldValue('actual')) {
              return 'La nueva contraseña debe ser diferente a la actual';
            }
            return undefined;
          },
          onSubmit: ({ value, fieldApi }) => {
            const error = validarContrasena(value);
            if (error) return error;
            if (value === fieldApi.form.getFieldValue('actual')) {
              return 'La nueva contraseña debe ser diferente a la actual';
            }
            return undefined;
          },
        }}>
        {(field) => (
          <View className={authClass.group}>
            <Text className={authClass.label}>Nueva contraseña</Text>
            <PasswordField
              hasError={field.state.meta.errors.length > 0}
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Crea una contraseña segura"
            />
            <IndicadorSeguridadContrasena
              fortaleza={calcularFortalezaContrasena(field.state.value)}
            />
            {(field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
              field.state.meta.errors.length > 0 && (
                <Text className={authClass.error}>{String(field.state.meta.errors[0])}</Text>
              )}
            <PasswordRequirements value={field.state.value} />
          </View>
        )}
      </form.Field>

      <form.Field
        name="confirmar"
        validators={{
          onChange: ({ value, fieldApi }) => {
            if (!value) return 'Confirma la nueva contraseña';
            if (value !== fieldApi.form.getFieldValue('nueva')) {
              return 'Las contraseñas no coinciden';
            }
            return undefined;
          },
          onSubmit: ({ value, fieldApi }) => {
            if (!value) return 'Confirma la nueva contraseña';
            if (value !== fieldApi.form.getFieldValue('nueva')) {
              return 'Las contraseñas no coinciden';
            }
            return undefined;
          },
        }}>
        {(field) => (
          <View className={authClass.group}>
            <Text className={authClass.label}>Confirmar nueva contraseña</Text>
            <PasswordField
              hasError={field.state.meta.errors.length > 0}
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Repite la nueva contraseña"
            />
            {(field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
              field.state.meta.errors.length > 0 && (
                <Text className={authClass.error}>{String(field.state.meta.errors[0])}</Text>
              )}
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
              <Text className={authClass.buttonText}>Actualizar contraseña</Text>
            )}
          </Pressable>
        )}
      </form.Subscribe>
    </AuthScreen>
  );
}
