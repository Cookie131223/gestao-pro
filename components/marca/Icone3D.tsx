// Ícones 3D realistas do GestãoPro (renderizados em plástico amarelo de segurança, grafite e aço).
// Uso: <Icone3D nome="calendario" tamanho=24 />
import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const ICONES = {
  alerta: require('../../assets/icones3d/alerta.png'),
  bandeira: require('../../assets/icones3d/bandeira.png'),
  cadeado: require('../../assets/icones3d/cadeado.png'),
  caixa: require('../../assets/icones3d/caixa.png'),
  camera: require('../../assets/icones3d/camera.png'),
  calendario: require('../../assets/icones3d/calendario.png'),
  colunas: require('../../assets/icones3d/colunas.png'),
  grafico: require('../../assets/icones3d/grafico.png'),
  imagem: require('../../assets/icones3d/imagem.png'),
  lista: require('../../assets/icones3d/lista.png'),
  maleta: require('../../assets/icones3d/maleta.png'),
  moeda: require('../../assets/icones3d/moeda.png'),
  nuvem: require('../../assets/icones3d/nuvem.png'),
  painel: require('../../assets/icones3d/painel.png'),
  pino: require('../../assets/icones3d/pino.png'),
  pizza: require('../../assets/icones3d/pizza.png'),
  relogio: require('../../assets/icones3d/relogio.png'),
  tendencia: require('../../assets/icones3d/tendencia.png'),
  usuario: require('../../assets/icones3d/usuario.png'),
};

export type NomeIcone3D = keyof typeof ICONES;

export default function Icone3D({ nome, tamanho = 24, apagado = false, style }: { nome: NomeIcone3D; tamanho?: number; apagado?: boolean; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={ICONES[nome]}
      style={[{ width: tamanho, height: tamanho, opacity: apagado ? 0.55 : 1 }, style]}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
      accessible={false}
    />
  );
}
