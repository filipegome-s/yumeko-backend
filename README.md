# Yumeko Backend

Backend de autenticação com Discord OAuth, construído com Fastify, Drizzle ORM e MySQL.

## Stack

- **Runtime**: Node.js 24+
- **Framework**: Fastify 5
- **ORM**: Drizzle ORM
- **Banco**: MySQL 
- **Validação**: Zod
- **Testes**: Vitest

## Quick Start

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar banco de dados

```sql
CREATE DATABASE yumeko;
```

### 4. Gerar e aplicar migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

### 6. Rodar em produção (Docker)

```bash
docker-compose up -d
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Rodar em desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Rodar em produção |
| `npm run lint` | Verificar lint e tipos |
| `npm run lint:fix` | Corrigir problemas de lint |
| `npm run test` | Rodar todos os testes |
| `npm run test:unit` | Rodar testes unitários |
| `npm run db:generate` | Gerar migrations |
| `npm run db:migrate` | Aplicar migrations |
| `npm run db:studio` | Abrir Drizzle Studio |

## API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/auth/discord` | Obter URL de autorização Discord |
| GET | `/api/v1/auth/discord/callback` | Callback OAuth |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/logout-all` | Logout de todos dispositivos |
| POST | `/api/v1/auth/refresh` | Renovar token Discord |
| GET | `/api/v1/auth/me` | Usuario atual |

### Health Checks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe |

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string MySQL |
| `DISCORD_CLIENT_ID` | Client ID do Discord |
| `DISCORD_CLIENT_SECRET` | Client Secret do Discord |
| `DISCORD_REDIRECT_URI` | URI de callback |
| `SESSION_SECRET` | Secret para sessões (min 32 chars) |
| `ENCRYPTION_KEY` | Chave AES-256 (min 32 chars) |
| `PORT` | Porta do servidor |
| `NODE_ENV` | ambiente (development/production) |

## Arquitetura

```
src/
├── domain/
│   ├── entities/      # Entidades de domínio
│   └── repositories/  # Interfaces de repositórios
├── features/
│   └── auth/          # Feature de autenticação
│       ├── auth-controller.ts
│       ├── handle-discord-callback.ts
│       ├── get-current-user.ts
│       ├── get-discord-auth-url.ts
│       ├── logout.ts
│       ├── logout-all.ts
│       └── refresh-token.ts
├── infrastructure/
│   ├── config/        # Configuração
│   ├── crypto/        # Criptografia
│   ├── db/            # Schema Drizzle
│   ├── logger/        # Logging
│   └── repositories/  # Implementações
└── plugins/            # Plugins Fastify
```

## Discord OAuth Setup

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Em OAuth2, adicione redirect URI: `http://localhost:3000/api/v1/auth/discord/callback`
4. Copie Client ID e Client Secret para o `.env`
