import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

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

const ANIMACIONES: Record<TipoAlerta, any> = {
  success: require('../../assets/animations/Checklist.json'),
  warning: require('../../assets/animations/Alert Warning Informtion.json'),
  error: require('../../assets/animations/Error animation.json'),
  info: require('../../assets/animations/Checklist.json'),
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

  const animacion = alerta ? ANIMACIONES[alerta.tipo] : null;

  return (
    <Modal visible={!!alerta} transparent animationType="fade" onRequestClose={() => setAlerta(null)}>
      <View className="flex-1 bg-slate-900/55 justify-center items-center p-6">
        <View className="w-full max-w-[360px] bg-white rounded-2xl p-6 items-center shadow-xl">
          <View className="w-24 h-24 items-center justify-center mb-3">
            {alerta && animacion && (
              <LottieView
                key={`${alerta.tipo}-${alerta.titulo}`}
                source={animacion}
                autoPlay={true}
                loop={false}
                style={{ width: '100%', height: '100%' }}
              />
            )}
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
