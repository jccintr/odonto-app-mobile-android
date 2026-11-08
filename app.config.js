/**
 * Configuração do app do dentista. O que muda de um ambiente para outro vem de variáveis (arquivo .env na pasta do app;
 * o Expo lê as que começam com EXPO_PUBLIC_ para dentro do app):
 *
 *   EXPO_PUBLIC_API_URL  endereço da API (ex.: https://odonto-api.up.railway.app). No emulador Android, a API no seu PC é http://10.0.2.2:3000
 *   APP_NAME             nome na tela do celular (padrão: OdontoApp Dentista)
 *   ANDROID_PACKAGE      identificador do app no Android (padrão: com.jccintr.odontoapp.dentista)
 *   EAS_PROJECT_ID       (opcional) id do projeto no EAS
 */
const fs = require('fs');
const path = require('path');

const googleServicesFile = fs.existsSync(path.join(__dirname, 'google-services.json')) ? './google-services.json' : undefined;
const icon = fs.existsSync(path.join(__dirname, 'assets', 'icon.png')) ? './assets/icon.png' : undefined;
const adaptive = fs.existsSync(path.join(__dirname, 'assets', 'adaptive-icon.png')) ? './assets/adaptive-icon.png' : undefined;

module.exports = () => ({
  expo: {
    name: process.env.APP_NAME || 'OdontoApp Dentista',
    slug: 'odontoapp-dentista',
    scheme: 'odontoapp-dentista',
    version: '0.1.0',
    // celular e tablet: o app gira livremente e a tela se adapta (lista e detalhe lado a lado no tablet)
    orientation: 'default',
    icon,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    android: {
      package: process.env.ANDROID_PACKAGE || 'com.jccintr.odontoapp.dentista',
      softwareKeyboardLayoutMode: 'resize',
      googleServicesFile,
      ...(adaptive ? { adaptiveIcon: { foregroundImage: adaptive, backgroundColor: '#0f766e' } } : {}),
      permissions: ['CAMERA'],
    },
    plugins: [
      'expo-secure-store',
      ['expo-image-picker', { photosPermission: 'O app acessa suas fotos para anexar radiografias e imagens ao paciente.', cameraPermission: 'O app usa a câmera para fotografar radiografias e imagens do paciente.' }],
    ],
    extra: { eas: { projectId: process.env.EAS_PROJECT_ID || undefined } },
  },
});
