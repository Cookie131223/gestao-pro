// Logo do GestãoPro: guindaste em um quadrado amarelo de segurança.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { C } from '../../constants/brand';

export default function Logo({ tamanho = 42 }: { tamanho?: number }) {
  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.24, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name="crane" size={tamanho * 0.6} color={C.accentInk} />
    </View>
  );
}
