import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { appAlert } from '@/components/app-alert';
import { AuthScreen } from '@/components/auth/auth-screen';
import { authClass } from '@/components/auth/auth-classes';
import { mensajeErrorAuth } from '@/features/auth/auth.errors';
import { recuperarContrasena } from '@/features/auth/auth.service';
import { validarEmail } from '@/features/auth/password';

export default function RecuperarContrasenaScreen() {
  const router = useRouter();

  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      try {
        await recuperarContrasena(value.email);
        appAlert(
          'Correo enviado',
          `Enviamos un enlace para restablecer la contraseña a ${value.email.trim().toLowerCase()}. Revisa tu bandeja de entrada y spam.`,
          'success',
          [{ texto: 'Entendido' }],
        );
      } catch (error) {
        appAlert('No se pudo enviar el correo', mensajeErrorAuth(error), 'error');
      }
    },
  });

  return (
    <AuthScreen
      title="Recuperar contraseña"
      subtitle="Ingresa el correo de tu cuenta y te enviaremos un enlace para restablecer la contraseña."
      headerSubtitle="Recuperar acceso"
      footer={
        <Pressable className={authClass.footer} onPress={() => router.replace('/' as never)}>
          <Text className={authClass.footerText}>
            ¿Recordaste tu contraseña?{' '}
            <Text className={authClass.footerLink}>Inicia sesión</Text>
          </Text>
        </Pressable>
      }>
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
            <Text className={authClass.hint}>
              El enlace lo envía Firebase Auth y llegará en español.
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
              <Text className={authClass.buttonText}>Enviar enlace</Text>
            )}
          </Pressable>
        )}
      </form.Subscribe>
    </AuthScreen>
  );
}
