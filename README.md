# Gestão de Demandas

App de gestão de demandas em Next.js com grupos, um quadro Kanban por grupo
(Aberto → Desenvolvimento → Concluído) e Supabase Postgres como backend.

## Funcionalidades

- Login por e-mail/senha (Supabase Auth). Não há cadastro público avulso —
  o acesso é por criação manual (painel do Supabase) ou por link de convite
  de um grupo.
- **Grupos**: cada grupo tem seu próprio quadro de demandas e sua própria
  lista de membros. Qualquer usuário logado pode criar um grupo (vira admin
  dele automaticamente).
- **Convite por link**: um admin do grupo gera um link (`/join/<token>`,
  válido por 7 dias, revogável). Quem abre o link cria a própria conta e já
  entra no grupo — ou, se já estiver logado, só confirma a entrada.
- CRUD de demandas: descrição, solicitante, responsável (um membro do
  grupo), urgência (baixa/média/alta) e observações.
- Quadro Kanban com arrastar-e-soltar (via [dnd-kit](https://dndkit.com/)),
  em duas visualizações trocáveis:
  - **Swimlanes**: uma faixa por usuário, com as 3 colunas de status dentro
    de cada uma — bom para transferir uma demanda de um usuário para outro
    (arrasta na diagonal, muda responsável e status de uma vez).
  - **Por usuário**: abas para focar no quadro de 3 colunas de uma pessoa
    por vez.
- Atualização otimista da UI com reversão automática se a gravação falhar.
- **Tempo real**: mudanças feitas por outras pessoas no mesmo grupo (mover,
  criar, editar, excluir demanda) aparecem sozinhas, sem precisar atualizar
  a página — via Supabase Realtime.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql). O script é idempotente —
   se você já tinha rodado uma versão anterior, rodar de novo só adiciona o
   que estiver faltando (tabelas de grupos, policies de leitura para o
   tempo real, etc.) sem apagar nada.
3. Copie `.env.local.example` para `.env.local` e preencha com a URL, a
   **publishable key** e a **secret key** do projeto (Project Settings →
   API):

   ```bash
   cp .env.local.example .env.local
   ```

4. Crie ao menos um usuário inicial em Authentication → Users, no painel do
   Supabase (defina um e-mail e uma senha, marque **Auto Confirm User**).
   Esse primeiro usuário faz login, cria um grupo, e a partir daí pode
   convidar o resto do time por link — não precisa criar todo mundo
   manualmente.

   A chave publishable é pública por natureza, então qualquer pessoa
   poderia chamar a API de signup do Supabase diretamente, por fora do
   fluxo de convite do app. Para evitar isso, desative "Allow new users to
   sign up" em Authentication → Sign In / Providers → Email — as contas
   passam a só poder ser criadas pelo app (via link de convite, que usa a
   service role key) ou manualmente pelo painel.

5. Instale as dependências e rode o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

6. Abra [http://localhost:3000](http://localhost:3000), entre com o
   usuário do passo 4, crie um grupo e gere um link de convite para o
   resto do time.

Sem as variáveis de ambiente configuradas, o app mostra uma tela explicando
os passos acima em vez de quebrar.

## Arquitetura

- `src/proxy.ts` — gate de autenticação (convenção `proxy.js` do Next.js 16,
  substitui o antigo `middleware.js`): redireciona visitantes não
  autenticados para `/login` e atualiza o cookie de sessão a cada request.
  `/login` e `/join/*` ficam de fora do gate (são as únicas rotas públicas).
- `src/lib/supabase/auth.ts` — cliente Supabase baseado em cookies, usado
  para login/logout e para ler o usuário autenticado em Server
  Components/Actions.
- `src/app/auth-actions.ts` — Server Actions de login (`signIn`) e logout
  (`signOut`).
- `src/app/groups/actions.ts` — Server Actions de grupos: criar, listar,
  listar membros, remover membro, gerar/listar/revogar convites. Toda ação
  confere que o usuário é membro (e, quando necessário, admin) do grupo
  antes de tocar no banco.
- `src/app/join/actions.ts` — Server Actions do fluxo de convite: validar
  token, criar conta via API admin do Supabase (`auth.admin.createUser`,
  contorna o cadastro público desativado) e adicionar a pessoa ao grupo.
- `src/app/actions.ts` — Server Actions para CRUD e reordenação de
  demandas, escopadas por grupo, usando a service role key do Supabase
  (nunca exposta ao navegador). Cada action confere autenticação e
  participação no grupo de forma independente do `proxy.ts`, como
  recomendado pela documentação do Next.js.
- `src/lib/kanban-dnd.ts` — lógica de reordenação do drag-and-drop,
  genérica sobre o que é uma "célula" (uma coluna de status simples, ou uma
  célula composta usuário+status no swimlane), reusada pelas duas
  visualizações do quadro.
- `src/components/GroupBoard.tsx` — orquestra o quadro (as duas
  visualizações), o drag-and-drop e os modais.
- `src/hooks/useGroupRealtimeTasks.ts` + `src/lib/supabase/browser.ts` —
  assinatura Realtime read-only do navegador para a tabela `tasks` do
  grupo aberto. Só escuta; toda escrita continua indo pelas Server Actions
  com a service role key. A escuta só entrega eventos que passam pela RLS
  policy de leitura (ver abaixo), então um usuário nunca recebe eventos de
  um grupo do qual não é membro.
- `src/lib/supabase/server.ts` — cliente Supabase server-only (service
  role), usado só para acesso a dados, nunca para autenticação.
- `supabase/schema.sql` — schema completo (`profiles`, `groups`,
  `group_members`, `group_invites`, `tasks`). RLS habilitada em todas as
  tabelas; a única exceção às "sem policies públicas" são duas policies de
  **leitura** (`group_members` e `tasks`, escopadas por participação no
  grupo) que existem só para o Realtime funcionar — nenhuma policy de
  escrita existe em lugar nenhum, então o navegador nunca consegue gravar
  direto no Postgres, só o server via service role. `profiles` espelha
  `auth.users` via trigger, porque `auth.users` não é consultável pela API
  normal do Postgres.

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # eslint
```
