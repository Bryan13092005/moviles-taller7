import { Text, View } from 'react-native';

import {
  PASSWORD_MIN_LENGTH,
  obtenerChecksContrasena,
} from '@/features/auth/password';

const REGLAS = [
  { clave: 'length', etiqueta: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres` },
  { clave: 'uppercase', etiqueta: 'Una letra mayúscula (A-Z)' },
  { clave: 'lowercase', etiqueta: 'Una letra minúscula (a-z)' },
  { clave: 'number', etiqueta: 'Un número (0-9)' },
] as const;

/** Lista visual del cumplimiento de la política de contraseñas. */
export function PasswordRequirements({ value }: { value: string }) {
  const checks = obtenerChecksContrasena(value);

  return (
    <View className="mt-2 p-3 rounded-xl bg-background border border-border gap-1.5">
      {REGLAS.map((regla) => {
        const ok = checks[regla.clave];
        return (
          <View key={regla.clave} className="flex-row items-center gap-2">
            <Text
              className={`font-roboto-bold text-sm w-4 ${
                ok ? 'text-green-600' : 'text-slate-400'
              }`}>
              {ok ? '✓' : '○'}
            </Text>
            <Text className={`font-roboto text-[13px] ${ok ? 'text-green-800' : 'text-muted'}`}>
              {regla.etiqueta}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
