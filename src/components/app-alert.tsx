import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

export type TipoAlerta = 'error' | 'info' | 'warning' | 'success';

interface AlertaData {
  titulo: string;
  mensaje: string;
  tipo: TipoAlerta;
  acciones?: AccionAlerta[];
}

export interface AccionAlerta {
  texto: string;
  onPress?: () => void;
  secundario?: boolean;
}

const TIPOS: Record<TipoAlerta, { iconWrap: string; icon: string; icono: string }> = {
  error: { iconWrap: 'bg-red-100', icon: 'text-red-500', icono: '✕' },
  warning: { iconWrap: 'bg-amber-100', icon: 'text-amber-500', icono: '!' },
  info: { iconWrap: 'bg-sky-100', icon: 'text-accent', icono: 'i' },
  success: { iconWrap: 'bg-emerald-100', icon: 'text-emerald-500', icono: '✓' },
};

let mostrar: ((a: AlertaData) => void) | null = null;

export function appAlert(
  titulo: string,
  mensaje: string,
  tipo: TipoAlerta = 'info',
  acciones?: AccionAlerta[],
) {
  mostrar?.({ titulo, mensaje, tipo, acciones });
}

// Se monta una sola vez en el layout raíz.
export function AppAlertHost() {
  const [alerta, setAlerta] = useState<AlertaData | null>(null);

  useEffect(() => {
    mostrar = setAlerta;
    return () => {
      mostrar = null;
    };
  }, []);

  const t = alerta ? TIPOS[alerta.tipo] : TIPOS.info;

  return (
    <Modal visible={!!alerta} transparent animationType="fade" onRequestClose={() => setAlerta(null)}>
      <View className="flex-1 bg-slate-900/55 justify-center items-center p-6">
        <View className="w-full max-w-[360px] bg-white rounded-xl p-6 items-center shadow-xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${t.iconWrap}`}>
            <Text className={`font-roboto-bold text-3xl ${t.icon}`}>{t.icono}</Text>
          </View>
          <Text className="font-roboto-bold text-xl text-primary text-center mb-2">
            {alerta?.titulo}
          </Text>
          <Text className="font-roboto text-[15px] text-slate-600 text-center mb-5 leading-[22px]">
            {alerta?.mensaje}
          </Text>
          {(alerta?.acciones ?? [{ texto: 'Entendido' }]).map((a) => (
            <Pressable
              key={a.texto}
              className={`self-stretch rounded-xl py-3.5 items-center active:opacity-85 ${
                a.secundario ? 'bg-white border border-primary mt-2' : 'bg-primary'
              }`}
              onPress={() => {
                setAlerta(null);
                a.onPress?.();
              }}>
              <Text
                className={`font-roboto-medium text-base ${
                  a.secundario ? 'text-primary' : 'text-white'
                }`}>
                {a.texto}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
