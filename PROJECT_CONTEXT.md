# PROJETO: SaaS Gestor de Serviços via IA (AI-First)

## 🎯 OBJETIVO DO PROJETO
Criar uma aplicação SaaS B2C/B2B (Self-Service) para pequenos prestadores de serviço (manicures, eletricistas, pedreiros).
A interface principal é um **Chat via IA** que atua como uma secretária eficiente. O sistema deve ser extremamente simples, mobile-first (PWA) e gerido por comandos de voz/texto.

---

## 🛠️ TECH STACK (IMUTÁVEL)
- **Frontend:** Next.js (Foco em PWA/Mobile).
- **Voz (Input):** Web Speech API (Nativa do navegador via `window.webkitSpeechRecognition`) - **CUSTO ZERO**.
- **Backend/DB:** Supabase (Postgres, Auth, RLS, Edge Functions).
- **Pagamentos:** Integração Asaas (Pix/Assinatura) via Webhooks.
- **AI Core:** Integração LLM (OpenAI/Gemini) para processamento de intenção e extração de JSON.

---

## 🧠 FILOSOFIA DE DESENVOLVIMENTO
1.  **Backend Manda, Frontend Obedece:** Regras de negócio ficam no banco (RLS) ou Edge Functions, nunca no client-side.
2.  **Simplicidade Radical:** O usuário não quer configurar nada. Ele quer falar "Marquei a Maria" e pronto.
3.  **Segurança Silenciosa:** Multi-tenancy rigoroso. Um usuário NUNCA pode ver dados de outro.
4.  **Implementação em Camadas:** Não reescrever o que funciona. Adicionar funcionalidades (Pagamento, Confirmação) como "wrappers" ao redor do núcleo existente.

---

## 📱 FRONTEND & UX RULES
1.  **Voice-First (Custo Zero):**
    - Implementar um Hook React customizado (`useSpeechRecognition`).
    - Usar estritamente a API nativa do navegador.
    - O fluxo deve ser: Clicar Mic -> Falar -> Texto aparece no Input -> Usuário Confirma -> Envia.
    - Se o navegador não suportar, esconder o botão graciosamente.

---

## 🔒 REGRAS DE BANCO DE DADOS & SEGURANÇA (CRÍTICO)
1.  **Multi-Tenancy:**
    - TODAS as tabelas de dados do usuário (`services`, `clients`, etc.) DEVEM ter uma coluna `user_id`.
    - TODAS as queries e Policies RLS devem filtrar por `auth.uid()`.
2.  **Tabelas Core:**
    - `profiles`: Dados cadastrais (`whatsapp`, `referred_by`).
    - `subscriptions`: Controle de acesso (`status`, `current_period_end`, `access_level`).
    - `services`: Onde a IA grava os agendamentos.

---

## 🤖 COMPORTAMENTO DA IA (SYSTEM PROMPT RULES)
**Persona:** Secretária eficiente, educada, mas objetiva.
1.  **Validação de Ação (CONFIRMATION LOOP):**
    - Antes de executar qualquer `INSERT`, `UPDATE` ou `DELETE` no banco, a IA deve resumir a intenção e **pedir confirmação explícita**.
    - Exemplo: *"Entendi. Agendar [Serviço] para [Cliente] às [Horário]. Confirma?"*
    - Só executa após receber "Sim/Ok".
2.  **Zero Alucinação:**
    - Se faltar dado (ex: valor), PERGUNTE. Não invente.
    - Se o cliente não existe, pergunte se deve cadastrar.
3.  **Contexto Limitado:**
    - A IA foca em gestão. Se o usuário fugir do assunto (futebol, novela), traga de volta gentilmente para o trabalho.

---

## 💳 REGRAS DE NEGÓCIO: ASSINATURAS & PAGAMENTOS
**Conceito:** "Pagamento gera tempo de acesso."

1.  **Estados da Assinatura (`status`):**
    - `trial`: Acesso total por X dias.
    - `active`: Pagamento em dia. Acesso total.
    - `overdue`: Vencido. Bloqueio progressivo.
    - `canceled`: Sem acesso.

2.  **Lógica de Renovação (Webhook Asaas):**
    - **Pagamento Antecipado:** Soma 30 dias à data de vencimento atual (`current_period_end`).
    - **Pagamento Vencido:** Reseta a data para `NOW()` + 30 dias.

3.  **Bloqueio Progressivo (`access_level`):**
    - Nível 3 (Total): Cria, Edita, Vê.
    - Nível 2 (Inadimplência Leve): Vê, Edita, mas NÃO CRIA novos.
    - Nível 1 (Bloqueio Forte): Apenas Vê (Read-Only).
    - Nível 0: Bloqueio de Login.

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO (ORDEM DE EXECUÇÃO)

### FASE 1: Segurança & Auditoria (Prioridade Imediata)
- [ ] Auditar todas as funções existentes de DB para garantir `WHERE user_id = auth.uid()`.
- [ ] Garantir que RLS esteja ativo no Supabase.

### FASE 2: Refinamento da IA (UX)
- [ ] Implementar o "Confirmation Loop" no prompt do sistema.
- [ ] Criar Hook `useSpeechRecognition` (Web Speech API).

### FASE 3: Camada de Pagamento (Sidecar)
- [ ] Criar tabela `subscriptions`.
- [ ] Criar Middleware no Next.js que verifica `subscriptions.status` antes de carregar a IA.
- [ ] Implementar Webhook do Asaas (Edge Function) para renovar tempo automaticamente.

### FASE 4: Indicação (Growth)
- [ ] Implementar lógica de Referral: Quem indica ganha dias extras APÓS o indicado pagar o primeiro boleto.
