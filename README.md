# OdontoApp — app Android do dentista (Expo 54)

App do dentista para **celular e tablet**: agenda do dia, ficha do paciente com odontograma, orçamentos (os procedimentos aprovados são executados **no atendimento**) e radiografias/fotos.
Fala com a mesma API do painel web. Não precisa funcionar offline. Administração e secretária usam o painel web: se entrarem aqui, o app avisa.

## O que faz

- **Iniciar atendimento:** o dentista toca em "Iniciar atendimento" (a API recusa se o paciente estiver inadimplente além da tolerância e mostra o aviso na tela) e depois conclui.
- **Agenda:** visões **Dia, Semana e Mês** (semana: lista por dia no celular e grade de horários de 7 colunas no tablet; mês: grade com a contagem de atendimentos, tocar no dia abre o dia). Só os atendimentos do dentista; navegação por período (setas, **arrastar para o lado** e **calendário** ao tocar na data), **confirmar, concluir o atendimento, faltou e cancelar (com motivo)**. Ao **concluir**, o dentista informa obrigatoriamente o(s) procedimento(s) e os **dentes afetados** (tocando no odontograma, ou boca toda), pode dar baixa em itens do orçamento aprovado e acrescentar um texto; fica no **Prontuário** do paciente. O dentista **não vê nem liga para o telefone do paciente** (isso é da secretária). No **tablet** a lista e o detalhe ficam lado a lado.
- **Pacientes:** busca por nome ou CPF; ficha com dados, **alerta de anamnese** (diabetes, alergias, anticoagulante…), últimos atendimentos e **Prontuário** (histórico do que foi feito em cada atendimento, com retificação dos próprios registros).
- **Odontograma:** desenho dos 32 dentes (e os de leite) em SVG; toque num dente para ver o histórico, **marcar condição e faces** ou remover. Os procedimentos realizados pintam o dente sozinhos; os **planejados** aparecem com contorno tracejado (aprovado) ou pontilhado (proposto) e listados ao tocar no dente.
- **Orçamentos:** lista com filtro; criar (procedimento, dente, faces e valor), aprovar ou recusar, os itens propostos aparecem com o selo "Proposto" e os aprovados (em qualquer rodada) como "a realizar" e são executados **ao concluir o atendimento** (o odontograma é atualizado e o repasse calculado pela API).
- **Imagens:** fotografar ou escolher da galeria; envio direto ao Cloudinary (a API assina, plano gratuito); ver e remover.
- **Minha conta:** trocar a senha, tema claro/escuro/automático, sair.
- Assinatura da clínica suspensa (a API responde 402): tela explicando que o acesso está pausado.

## Rodando

```bash
npm install
cp .env.example .env        # EXPO_PUBLIC_API_URL: no emulador Android, a API do seu PC é http://10.0.2.2:3000
```

API de demonstração (PostgreSQL embutido, nada para instalar) — na pasta `api`: `npm run demo`
Login da demonstração: `paulo@sorriso.test` / `senha-do-paulo-12345` (Dr. Paulo) ou `bia@sorriso.test` / `senha-da-bia-1234567`.
Para a demonstração ter atendimentos, entre no painel web como secretária (`secretaria@sorriso.test`) e agende alguns para o Dr. Paulo.

```bash
npx expo run:android        # build de desenvolvimento no emulador/celular (usa expo-dev-client)
npx expo start              # depois de instalado o dev client
```

Em celular físico, use o IP do PC na rede (`http://192.168.x.x:3000`) em `EXPO_PUBLIC_API_URL`, ou a URL da API publicada.
Antes do primeiro build, rode `npx expo install --check` para conferir as versões das dependências com o SDK 54.

## Publicação (EAS)

Como nos outros apps: faça o build local primeiro e só use o EAS depois de validar. `eas.json` tem os perfis `development`, `preview` (APK) e `production` (AAB).
`google-services.json` (se um dia usar notificações) fica fora do Git (`.gitignore`) e vai para o build pelo `.easignore`.
Falta colocar o ícone: `assets/icon.png` (1024×1024) e `assets/adaptive-icon.png`; o `app.config.js` usa se existirem.

## Estrutura

```
App.js, index.js, app.config.js   entrada e configuração do Expo
src/api/                          client.js (sessão no SecureStore, renovação, 402) e index.js (uma função por rota)
src/lib/                          datas (sem Intl), dinheiro, máscaras, dentes FDI, rótulos, tema, envio de imagens
src/context/                      Auth (sessão do dentista) e Theme (claro/escuro/automático)
src/components/                   ui, Odontogram (react-native-svg), ItemSheet, BudgetCard
src/screens/                      Login, Agenda (+ painel do atendimento), Pacientes, Paciente (abas), Orçamentos, Orçamento, Novo orçamento, Conta
tests/unit/                       regras, cliente da API e rotas (cobertura de 100% de src/lib e src/api)
tests/e2e/                        o app inteiro contra a API real (PostgreSQL embutido), no celular e no tablet
```

## Testes

```bash
npm test              # unitários, com cobertura de 100% de src/lib e src/api
npm run test:e2e      # ponta a ponta contra a API de demonstração (E2E_API_DIR, padrão ../api)
npx expo export --platform android   # confere que o bundle Android compila
```
O e2e sobe `api/src/scripts/demo-server.js` (precisa de `npm install` na pasta da API). Não substitui testar num aparelho: câmera, galeria e gestos só se confirmam no celular/emulador.
