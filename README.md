# Gestão de Demandas

App de gestão de demandas em Next.js com um quadro Kanban (Aberto →
Desenvolvimento → Concluído) e Supabase Postgres como backend.

## Funcionalidades

- CRUD de demandas: descrição, solicitante, urgência (baixa/média/alta) e
  observações.
- Quadro Kanban com arrastar-e-soltar (via [dnd-kit](https://dndkit.com/))
  para mudar o status e reordenar demandas dentro de uma coluna.
- Atualização otimista da UI com reversão automática se a gravação falhar.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql).
3. Copie `.env.local.example` para `.env.local` e preencha com a URL e a
   **service role key** do projeto (Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

4. Instale as dependências e rode o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

5. Abra [http://localhost:3000](http://localhost:3000).

Sem as variáveis de ambiente configuradas, o app mostra uma tela explicando
os passos acima em vez de quebrar.

## Arquitetura

- `src/app/actions.ts` — Server Actions para CRUD e reordenação, usando a
  service role key do Supabase (nunca exposta ao navegador).
- `src/components/Board.tsx` — orquestra o quadro Kanban, o drag-and-drop e
  os modais de criação/edição/exclusão.
- `src/lib/supabase/server.ts` — cliente Supabase server-only.
- `supabase/schema.sql` — schema da tabela `tasks`, incluindo RLS habilitada
  (sem policies públicas: todo o acesso passa pelo server via service role).

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # eslint
```
