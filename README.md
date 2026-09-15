# Gestão de Demandas

App de gestão de demandas em Next.js com um quadro Kanban (Aberto →
Desenvolvimento → Concluído) e Supabase Postgres como backend.

## Funcionalidades

- Login por e-mail/senha (Supabase Auth). Não há cadastro público — os
  usuários são criados manualmente no painel do Supabase.
- CRUD de demandas: descrição, solicitante, urgência (baixa/média/alta) e
  observações.
- Quadro Kanban com arrastar-e-soltar (via [dnd-kit](https://dndkit.com/))
  para mudar o status e reordenar demandas dentro de uma coluna.
- Atualização otimista da UI com reversão automática se a gravação falhar.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql).
3. Copie `.env.local.example` para `.env.local` e preencha com a URL, a
   **publishable key** e a **secret key** do projeto (Project Settings →
   API):

   ```bash
   cp .env.local.example .env.local
   ```

4. Crie os usuários que poderão acessar o app em Authentication → Users, no
   painel do Supabase (defina um e-mail e uma senha para cada um). Não há
   tela de cadastro no app — o acesso é só por convite/criação manual.

   O app não expõe cadastro, mas a chave publishable é pública por natureza,
   então qualquer pessoa poderia chamar a API de signup do Supabase
   diretamente. Para garantir que só os usuários criados por vocês possam
   entrar, desative "Allow new users to sign up" em Authentication →
   Sign In / Providers → Email.

5. Instale as dependências e rode o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

6. Abra [http://localhost:3000](http://localhost:3000) e entre com um dos
   usuários criados no passo 4.

Sem as variáveis de ambiente configuradas, o app mostra uma tela explicando
os passos acima em vez de quebrar.

## Arquitetura

- `src/proxy.ts` — gate de autenticação (convenção `proxy.js` do Next.js 16,
  substitui o antigo `middleware.js`): redireciona visitantes não
  autenticados para `/login` e atualiza o cookie de sessão a cada request.
- `src/lib/supabase/auth.ts` — cliente Supabase baseado em cookies, usado
  para login/logout e para ler o usuário autenticado em Server
  Components/Actions.
- `src/app/auth-actions.ts` — Server Actions de login (`signIn`) e logout
  (`signOut`).
- `src/app/actions.ts` — Server Actions para CRUD e reordenação de
  demandas, usando a service role key do Supabase (nunca exposta ao
  navegador). Cada action confere autenticação de forma independente do
  `proxy.ts`, como recomendado pela documentação do Next.js.
- `src/components/Board.tsx` — orquestra o quadro Kanban, o drag-and-drop e
  os modais de criação/edição/exclusão.
- `src/lib/supabase/server.ts` — cliente Supabase server-only (service
  role), usado só para acesso a dados, nunca para autenticação.
- `supabase/schema.sql` — schema da tabela `tasks`, incluindo RLS habilitada
  (sem policies públicas: todo o acesso a dados passa pelo server via
  service role, gated pela checagem de autenticação em cada action).

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # eslint
```
