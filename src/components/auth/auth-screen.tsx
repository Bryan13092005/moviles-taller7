import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { HeaderEpmaps } from '@/components/header-epmaps';

import { authClass } from './auth-classes';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  headerSubtitle?: string;
}

/** Estructura común de las pantallas de autenticación. */
export function AuthScreen({ title, subtitle, children, footer, headerSubtitle = 'Acceso' }: Props) {
  return (
    <View className={authClass.screen}>
      <HeaderEpmaps subtitulo={headerSubtitle} />
      <KeyboardAvoidingView
        className={authClass.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerClassName={authClass.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View className={authClass.card}>
            <Text className={authClass.title}>{title}</Text>
            <Text className={authClass.lead}>{subtitle}</Text>
            {children}
          </View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
