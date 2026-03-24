# ZabbixApp

Aplicativo mobile profissional para monitoramento de servidores Zabbix, desenvolvido com React Native e Expo. Permite acompanhar incidentes, hosts, métricas e receber alertas em tempo real diretamente no seu dispositivo móvel.

---

## Funcionalidades

- **Multi-servidor** — conecte e gerencie múltiplos servidores Zabbix simultaneamente com sessões independentes
- **Dashboard de incidentes** — visualize problemas ativos com filtros por severidade, servidor e status de acknowledgement
- **Hosts & Itens** — navegue pelo inventário de hosts, visualize métricas em tempo real e gráficos de série temporal
- **Notificações push** — receba alertas instantâneos de novos problemas com configuração independente por servidor (severidade, horário silencioso, som e vibração)
- **Relatórios** — gere relatórios de disponibilidade, MTTR e top hosts com exportação em PDF, CSV e JSON
- **Acknowledge & Supressão** — confirme e suprima problemas diretamente pelo app
- **Atualizações OTA** — receba atualizações automáticas sem precisar reinstalar o app

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Linguagem | TypeScript (strict) |
| Navegação | Expo Router (file-based) |
| Estado global | Zustand |
| Requisições & cache | Axios + TanStack Query v5 |
| Estilização | NativeWind v4 (Tailwind CSS) |
| Formulários | React Hook Form + Zod |
| Armazenamento seguro | Expo SecureStore |
| Notificações | Expo Notifications |
| Gráficos | React Native SVG |
| Exportação | react-native-html-to-pdf + expo-file-system |
| Testes | Jest + Testing Library |
| Build & Deploy | EAS Build + EAS Submit |

---

## Pré-requisitos

- Node.js 18+
- JDK 17 (para build Android local)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Servidor Zabbix 6.4+ ou 7.x acessível pela rede
- Conta Expo em [expo.dev](https://expo.dev)

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/zabbix-app.git
cd zabbix-app

# Instale as dependências
npm install

# Instale dependências nativas com versões compatíveis
npx expo install --fix

# Inicie o servidor de desenvolvimento
npx expo start
```

---

## Variáveis de ambiente

O app não utiliza variáveis de ambiente — todas as configurações de servidor são feitas dentro do próprio app em tempo de execução, permitindo múltiplos servidores por usuário.

---

## Estrutura do projeto

```
zabbix-app/
├── app/                          # Rotas (Expo Router)
│   ├── (auth)/                   # Telas de autenticação
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (app)/                    # Telas principais (requer autenticação)
│   │   ├── _layout.tsx           # Tab bar + poller de notificações
│   │   ├── dashboard.tsx         # Dashboard de incidentes
│   │   ├── hosts.tsx             # Lista de hosts
│   │   ├── notifications.tsx     # Central de notificações
│   │   ├── reports.tsx           # Relatórios
│   │   └── profile.tsx           # Perfil e configurações
│   ├── host/[id].tsx             # Detalhe do host
│   ├── problem/[id].tsx          # Detalhe do problema
│   ├── notifications-settings/   # Configurações de notificação por servidor
│   ├── reports/export.tsx        # Exportação de relatórios
│   ├── servers/                  # Gerenciamento de servidores
│   └── index.tsx                 # Redirecionamento inicial
├── src/
│   ├── api/
│   │   ├── zabbix.client.ts      # Cliente Axios + JSON-RPC
│   │   └── zabbix.types.ts       # Tipos da API Zabbix
│   ├── services/
│   │   ├── auth.service.ts       # Login/logout Zabbix
│   │   ├── problems.service.ts   # Busca de problemas + triggers
│   │   ├── hosts.service.ts      # Hosts, grupos e itens
│   │   ├── reports.service.ts    # Cálculo e exportação de relatórios
│   │   ├── trigger.service.ts    # Triggers
│   │   └── push.service.ts       # Notificações push locais
│   ├── stores/
│   │   ├── auth.store.ts         # Sessões múltiplas (Zustand)
│   │   ├── servers.store.ts      # Lista de servidores
│   │   └── notifications.store.ts # Histórico de notificações
│   │   └── theme.store.ts        # Dark / Light
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProblems.ts
│   │   ├── useHosts.ts
│   │   ├── useHostDetail.ts
│   │   ├── useHostGroups.ts
│   │   ├── useReport.ts
│   │   ├── useExport.ts
│   │   ├── useActiveSessions.ts
│   │   ├── useNetworkError.ts
│   │   └── usePushNotifications.ts
│   │   └── useTrigger.ts
│   └── components/
│       ├── ProblemCard.tsx
│       ├── HostCard.tsx
│       ├── ModalAcknowledge.tsx
│       ├── NotificationCard.tsx
│       ├── ServerSelector.tsx
│       ├── ServerBadge.tsx
│       ├── MiniChart.tsx
│       ├── ErrorBoundary.tsx
│       ├── reports/
│       │   ├── MetricCard.tsx
│       │   └── SeverityBar.tsx
│       └── ui/
│           ├── SeverityBadge.tsx
│           ├── SeverityCounter.tsx
│           └── ErrorState.tsx
├── assets/                       # Ícones e imagens
├── eas.json                      # Configuração de build EAS
├── tailwind.config.js
├── babel.config.js
└── metro.config.js
└── index.js
```

---

## Compatibilidade com a API Zabbix

O app detecta automaticamente a versão da API do servidor e adapta o comportamento:

| Versão | Campo de login | Autenticação |
|---|---|---|
| Zabbix < 6.4 | `user` | Campo `auth` no body |
| Zabbix 6.4+ / 7.x | `username` | Header `Authorization: Bearer` |

---

## Build e publicação

### APK para testes (Android)

```bash
eas build --platform android --profile preview
```

### Build de produção

```bash
# Android (AAB para Play Store)
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Ambos
eas build --platform all --profile production
```

### Submeter para as stores

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### Atualização OTA (sem passar pela store)

```bash
eas update --branch production --message "Descrição da atualização"
```

---


## Configuração de notificações push

As notificações push locais funcionam sem configuração adicional. Para push remoto (notificações mesmo com o app fechado), configure o Firebase:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Adicione um app Android com o package `com.zabbixapp`
3. Baixe o `google-services.json` e coloque na raiz do projeto
4. Siga o guia: [docs.expo.dev/push-notifications/fcm-credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)
5. Rode `npx expo prebuild --platform android --clean`

---


## Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas alterações (`git commit -m 'feat: adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Requisitos do servidor Zabbix

- Zabbix Server 6.4 ou superior (recomendado 7.x)
- API JSON-RPC habilitada e acessível via HTTPS
- Usuário com permissões de leitura nos hosts e problemas monitorados
- Para acknowledge e supressão: permissão de escrita nos eventos
