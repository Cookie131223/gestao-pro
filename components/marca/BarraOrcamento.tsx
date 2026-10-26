// Barra orçamento x gasto: verde até 75%, amarelo até 90%, vermelho acima.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F, corOrcamento, moeda } from '../../constants/brand';

export default function BarraOrcamento({ gasto, orcamento, escuro = false }: { gasto: number; orcamento: number; escuro?: boolean }) {
  const pct = orcamento > 0 ? Math.round((gasto / orcamento) * 100) : 0;
  const cor = corOrcamento(pct);
  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <Text style={[s.rotulo, escuro && { color: C.onGraphiteDim }]}>Orçamento</Text>
        <Text style={[s.valor, escuro && { color: C.onGraphite }]} numberOfLines={1}>
          {moeda(gasto)} <Text style={{ color: escuro ? C.onGraphiteDim : C.inkMute, fontWeight: '500' }}>de {moeda(orcamento)}</Text>
        </Text>
      </View>
      <View style={[s.fundo, escuro && { backgroundColor: C.graphite3 }]}>
        <View style={[s.cheia, { width: `${Math.min(100, pct)}%`, backgroundColor: cor }]} />
      </View>
      <Text style={[s.pct, { color: escuro && pct < 75 ? C.onGraphiteDim : cor }]}>{pct}% utilizado{pct >= 90 ? ' · atenção' : ''}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  rotulo: { fontFamily: F.body, color: C.inkSoft, fontSize: 12, fontWeight: '600' },
  valor: { fontFamily: F.body, color: C.ink, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  pct: { fontFamily: F.body, fontSize: 11, fontWeight: '600', marginTop: 5 },
  fundo: { height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' },
  cheia: { height: '100%', borderRadius: 4 },
});
