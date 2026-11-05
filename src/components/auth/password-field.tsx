import { useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

import { authClass } from './auth-classes';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  hasError?: boolean;
};

/** Campo de contraseña con opción para mostrar u ocultar el texto. */
export function PasswordField({ hasError, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View className={hasError ? authClass.inputRowError : authClass.inputRow}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColorClassName="accent-slate-400"
        {...props}
        className={authClass.inputInner}
        secureTextEntry={!visible}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        hitSlop={10}
        onPress={() => setVisible((v) => !v)}>
        <Text className={authClass.toggle}>{visible ? 'Ocultar' : 'Ver'}</Text>
      </Pressable>
    </View>
  );
}
