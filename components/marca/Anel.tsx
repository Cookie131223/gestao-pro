// Anel de progresso (celular nativo: versão simples, sem SVG).
import React from 'react';
import { Text, View } from 'react-native';
import { C } from '../../constants/brand';

type Props = { valor: number; tamanho?: number; espessura?: number; cor?: string; trilho?: string; textoCor?: string };

export default function Anel({ valor, tamanho = 64, espessura = 6, cor = C.accent, textoCor = C.ink }: Props) {
  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, borderWidth: espessura, borderColor: cor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontWeight: '800', fontSize: tamanho * 0.28, color: textoCor }}>{Math.round(valor || 0)}%</Text>
    </View>
  );
}
