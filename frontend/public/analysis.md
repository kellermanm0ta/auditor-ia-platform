# Relatório de Análise - `meu-projeto`

**Repositório:** https://github.com/exemplo/meu-projeto  
**Data:** 08/08/2026  
**Agentes utilizados:** 4

---

## 🔒 Análise de Segurança

### Crítico
- **Credenciais expostas** no arquivo `src/config.js:12` — string de conexão com banco de dados contém senha em texto puro.
  ```javascript
  const db = new Database("postgres://admin:senha123@localhost:5432/app");
  ```
  > **Recomendação:** Utilize variáveis de ambiente ou um cofre de secrets (ex: Vault, AWS Secrets Manager).

- **SQL Injection** em `src/routes/users.js:34` — interpolação direta de parâmetros na query.
  ```javascript
  db.query("SELECT * FROM users WHERE id = " + req.params.id);
  ```
  > **Recomendação:** Utilize prepared statements ou um ORM com sanitização automática.

### Alto
- **Falta de validação de entrada** no endpoint `POST /api/upload` — ausência de sanitização de arquivos enviados pelo usuário.

---

## 🏗️ Análise de Arquitetura

### Médio
- **Acoplamento elevado** entre os módulos `services/auth.js` e `services/email.js` — o módulo de email importa e instancia dependências diretamente do módulo de autenticação.
  > **Recomendação:** Adote injeção de dependência ou um container IoC para reduzir o acoplamento.

- **Camada de controller muito densa** — `src/controllers/orderController.js` possui mais de 400 linhas e acumula regras de negócio, validação e acesso a dados.
  > **Recomendação:** Extraia a lógica de negócio para services e mantenha os controllers enxutos.

---

## 🧹 Code Smell

### Médio
- **Código duplicado** — bloco de formatação de data repetido em `src/utils/format.js:22`, `src/helpers/date.js:45` e `src/services/report.js:88`.
  > **Recomendação:** Centralize a lógica em um único utilitário e reutilize.

### Baixo
- **Função muito longa** — `processOrder()` em `src/services/order.js` possui 120 linhas.
  > **Recomendação:** Quebre em funções menores com responsabilidades únicas.

---

## 📊 Resumo

| Categoria | Crítico | Alto | Médio | Baixo |
|-----------|---------|------|-------|-------|
| Segurança | 2 | 1 | 0 | 0 |
| Arquitetura | 0 | 0 | 2 | 0 |
| Code Smell | 0 | 0 | 1 | 1 |

**Total de pontos de melhoria encontrados: 7**  
**Nível de criticidade geral: 🔴 Alto**