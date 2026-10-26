// Versão para o app nativo (sem WebGL): mostra o anel de progresso no lugar do prédio 3D.
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { C } from '../../constants/brand';
import Anel from './Anel';

type Props = { progresso: number; andares?: number; tema?: 'claro' | 'escuro'; vitrine?: boolean; style?: StyleProp<ViewStyle> };

export default function Predio3D({ progresso, tema = 'claro', style }: Props) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Anel valor={progresso} tamanho={110} espessura={9} trilho={tema === 'escuro' ? C.graphite3 : C.line} textoCor={tema === 'escuro' ? C.onGraphite : C.ink} />
    </View>
  );
}
