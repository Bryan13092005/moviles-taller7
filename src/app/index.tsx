import { useForm } from '@tanstack/react-form';
import NetInfo from '@react-native-community/netinfo';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedSpinner } from '@/components/animations/animated-spinner';
import { useShakeAnimation } from '@/components/animations/use-shake-animation';
import { appAlert } from '@/components/app-alert';
import { AuthScreen } from '@/components/auth/auth-screen';
import { authClass } from '@/components/auth/auth-classes';
import { PasswordField } from '@/components/auth/password-field';
import { mensajeErrorAuth } from '@/features/auth/auth.errors';
import { getSession, login } from '@/features/auth/auth.service';
import { validarEmail } from '@/features/auth/password';

export default function LoginScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { triggerShake, animatedStyle: shakeStyle } = useShakeAnimation();

  useEffect(() => {
    let activo = true;
    getSession()
      .then((s) => {
        if (activo) setHasSession(!!s);
      })
      .finally(() => {
        if (activo) setChecking(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        const red = await NetInfo.fetch();
        if (red.isConnected === false) {
          triggerShake();
          appAlert(
            'Sin conexión',
            'Revisa tu conexión a internet e inténtalo nuevamente.',
            'warning',
          );
          return;
        }

        await login(value.email, value.password);
        router.replace('/busqueda' as never);
      } catch (error) {
        if (__DEV__) console.warn('[auth] Error al iniciar sesión:', error);
        triggerShake();
        appAlert('No se pudo iniciar sesión', mensajeErrorAuth(error), 'error');
      }
    },
  });

  if (checking) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <AnimatedSpinner size={48} />
      </View>
    );
  }
  if (hasSession) return <Redirect href={'/busqueda' as never} />;

  return (
    <AuthScreen
      title="Iniciar sesión"
      subtitle="Ingresa con tu correo electrónico y contraseña para comenzar la jornada."
      headerSubtitle="Acceso">
      <Animated.View style={shakeStyle}>
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => validarEmail(value),
            onSubmit: ({ value }) => validarEmail(value),
          }}>
          {(field) => (
            <View className={authClass.group}>
              <Text className={authClass.label}>Correo electrónico</Text>
              <TextInput
                className={
                  field.state.meta.errors.length > 0 ? authClass.inputError : authClass.input
                }
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="tecnico@epmaps.gob.ec"
                placeholderTextColorClassName="accent-slate-400"
              />
              {(field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
                field.state.meta.errors.length > 0 && (
                  <Text className={authClass.error}>{String(field.state.meta.errors[0])}</Text>
                )}
            </View>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => (!value ? 'La contraseña es obligatoria' : undefined),
            onSubmit: ({ value }) => (!value ? 'La contraseña es obligatoria' : undefined),
          }}>
          {(field) => (
            <View className={authClass.group}>
              <Text className={authClass.label}>Contraseña</Text>
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
              <Pressable
                className={authClass.linkRow}
                onPress={() => router.push('/auth/recuperar-password' as never)}>
                <Text className={authClass.linkStrong}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
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
                <Text className={authClass.buttonText}>Ingresar  →</Text>
              )}
            </Pressable>
          )}
        </form.Subscribe>

        <View className={authClass.divider} />

        <Pressable
          className={authClass.secondaryButton}
          onPress={() => router.push('/auth/registro' as never)}>
          <Text className={authClass.secondaryButtonText}>Crear una cuenta</Text>
        </Pressable>
      </Animated.View>
    </AuthScreen>
  );
}
