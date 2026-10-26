// Anel de progresso (web: SVG nativo do navegador).
import React from 'react';
import { Text, View } from 'react-native';
import { C, F } from '../../constants/brand';

type Props = { valor: number; tamanho?: number; espessura?: number; cor?: string; trilho?: string; textoCor?: string };

export default function Anel({ valor, tamanho = 64, espessura = 6, cor = C.accent, trilho = C.line, textoCor = C.ink }: Props) {
  const v = Math.max(0, Math.min(100, valor || 0));
  const r = (tamanho - espessura) / 2, circ = 2 * Math.PI * r;
  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <svg width={tamanho} height={tamanho} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={trilho} strokeWidth={espessura} />
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round"
          strokeDasharray={`${(circ * v) / 100} ${circ}`} style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <Text style={{ fontFamily: F.display, fontWeight: '700', fontSize: tamanho * 0.3, color: textoCor }}>{Math.round(v)}%</Text>
    </View>
  );
}
