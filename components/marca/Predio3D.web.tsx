// Prédio 3D realista que vai sendo construído conforme o progresso da obra (somente web, three.js).
// A cena fica em predio-cena.ts; aqui só montamos/desmontamos e passamos o progresso.
// Sem WebGL: mostra o anel de progresso.
import React, { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { C } from '../../constants/brand';
import Anel from './Anel';
import { criarCenaPredio, temWebGL } from './predio-cena';

type Props = {
  progresso: number;            // 0..100
  andares?: number;             // andares do prédio
  tema?: 'claro' | 'escuro';
  vitrine?: boolean;            // login: constrói em loop
  style?: StyleProp<ViewStyle>;
};

export default function Predio3D({ progresso, andares = 8, tema = 'claro', vitrine = false, style }: Props) {
  const caixa = useRef<View>(null);
  const alvo = useRef(progresso);
  const suporta = useRef<boolean | null>(null);
  if (suporta.current === null) suporta.current = typeof document !== 'undefined' && temWebGL();
  alvo.current = progresso;

  useEffect(() => {
    const el = caixa.current as unknown as HTMLDivElement | null;
    if (!el || !suporta.current) return;
    try {
      return criarCenaPredio(el, { andares, tema, vitrine, progresso: () => alvo.current });
    } catch (e) {
      console.warn('Prédio 3D indisponível:', e);
    }
  }, [andares, tema, vitrine]);

  if (!suporta.current) {
    return (
      <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
        <Anel valor={progresso} tamanho={110} espessura={9} trilho={tema === 'escuro' ? C.graphite3 : C.line} textoCor={tema === 'escuro' ? C.onGraphite : C.ink} />
      </View>
    );
  }
  return <View ref={caixa} style={[{ position: 'relative', overflow: 'hidden' }, style]} />;
}
