---
description: Sincroniza a documentação do projeto com a implementação atual
---

# Objetivo

Realizar uma auditoria e sincronização da documentação do repositório, garantindo que AGENTS.md, README.md e os demais documentos técnicos representem fielmente o estado atual do projeto.

A documentação deve ser baseada em evidências encontradas no código, nos testes, nas configurações e no histórico de alterações. Nunca presuma que a documentação existente está correta ou que o código implementado está necessariamente de acordo com ela.

# 1. Análise do estado atual

Antes de modificar qualquer arquivo:

1. Leia integralmente o AGENTS.md e o README.md existentes.
2. Identifique outros arquivos de documentação, instruções de agentes e documentos de arquitetura presentes no repositório.
3. Analise o estado do Git, incluindo alterações pendentes, arquivos novos e o diff das implementações recentes.
4. Inspecione os módulos, componentes, serviços, interfaces, configurações, testes e pontos de entrada relevantes para compreender o comportamento real do sistema.
5. Identifique divergências entre a implementação, os testes e a documentação.
6. Identifique informações redundantes, obsoletas, contraditórias, incompletas ou que não possam ser verificadas.

Não assuma que o último commit representa todas as alterações relevantes. Considere também mudanças locais ainda não commitadas.

# 2. Princípios de sincronização

Siga rigorosamente estas regras:

* O código e os testes atuais são as principais evidências do comportamento implementado.
* A documentação existente é uma fonte de contexto, não uma verdade absoluta.
* Não invente funcionalidades, comandos, dependências, decisões arquiteturais ou comportamentos.
* Preserve informações válidas que não possam ser inferidas diretamente do código, especialmente decisões arquiteturais, restrições operacionais e justificativas de negócio.
* Quando houver conflito entre documentação e implementação, documente o conflito no relatório e atualize a documentação desatualizada somente quando houver evidências suficientes.
* Se não for possível determinar qual comportamento é o desejado, não altere o código para adequá-lo à documentação nem invente uma solução. Registre a dúvida para decisão humana.
* Evite reescrever arquivos inteiros quando alterações pontuais forem suficientes.
* Preserve o idioma, o estilo, a estrutura e as convenções existentes no projeto.
* Não altere a implementação funcional do sistema nesta tarefa.

# 3. Responsabilidade de cada documento

## AGENTS.md

Mantenha neste arquivo somente as informações necessárias para orientar agentes durante o desenvolvimento:

* Estrutura relevante do projeto e localização dos módulos.
* Regras de arquitetura e dependências entre componentes.
* Convenções de implementação e restrições técnicas.
* Comandos confirmados de build, execução, testes e validação.
* Procedimentos obrigatórios de desenvolvimento.
* Referências para documentação técnica complementar.
* Regras para manter a documentação sincronizada após futuras alterações.

Não transforme o AGENTS.md em um inventário extenso de todas as funcionalidades do sistema.

Preserve instruções personalizadas, regras explícitas e decisões relevantes já existentes. Não as remova apenas porque não podem ser deduzidas do código.

## README.md

Mantenha neste arquivo as informações necessárias para que uma pessoa compreenda e utilize o projeto:

* Objetivo e escopo da aplicação.
* Principais funcionalidades efetivamente implementadas.
* Pré-requisitos e dependências necessárias.
* Configuração do ambiente.
* Instruções confirmadas de instalação, execução e testes.
* Exemplos de uso relevantes.
* Links para a documentação técnica complementar.

Não inclua funcionalidades planejadas como se já estivessem implementadas.

## Documentação técnica complementar

Se existirem documentos específicos de arquitetura, funcionalidades, APIs, configuração ou decisões técnicas, mantenha-os atualizados quando forem afetados pelas alterações recentes.

Não crie documentos desnecessários. Quando a documentação já estiver bem organizada, preserve sua estrutura.

Se houver duplicação significativa, prefira estabelecer uma fonte de verdade e referenciar o documento correspondente nos demais arquivos.

Não remova conteúdo técnico importante apenas para reduzir o tamanho da documentação.

# 4. Processo de sincronização

Execute as etapas a seguir nesta ordem.

## Etapa A — Diagnóstico

Compare a documentação com a implementação e classifique as divergências por categoria:

* Funcionalidades implementadas, alteradas ou removidas.
* Arquitetura, módulos e dependências.
* Interfaces, APIs, contratos e integrações.
* Configuração, variáveis de ambiente e dependências.
* Comandos de build, execução e testes.
* Regras operacionais e instruções dos agentes.
* Exemplos, links e referências desatualizados.
* Conteúdo duplicado ou contraditório.

Considere apenas as alterações efetivamente necessárias. Não force mudanças em arquivos que continuam corretos.

## Etapa B — Atualização

Atualize os documentos afetados de acordo com suas responsabilidades.

Ao atualizar o AGENTS.md:

* Preserve as instruções válidas e personalizadas.
* Inclua novas convenções somente quando forem confirmadas e relevantes para trabalhos futuros.
* Remova instruções comprovadamente obsoletas.
* Evite duplicação de informações já disponíveis em documentos especializados.

Ao atualizar o README.md:

* Reflita o comportamento atualmente implementado.
* Atualize exemplos e comandos afetados.
* Remova referências comprovadamente obsoletas.
* Mantenha o documento objetivo e útil.

Ao atualizar a documentação técnica:

* Descreva o comportamento real.
* Atualize diagramas, fluxos, contratos e exemplos afetados, quando existirem.
* Preserve decisões históricas que ainda sejam relevantes.
* Não reescreva decisões arquiteturais apenas porque a implementação evoluiu; registre a mudança quando necessário.

## Etapa C — Validação

Depois das atualizações:

1. Releia os documentos modificados.
2. Verifique se existem contradições entre AGENTS.md, README.md e a documentação técnica.
3. Confira se os links internos apontam para arquivos existentes.
4. Confira se os comandos e exemplos alterados possuem evidências de validade.
5. Verifique se as instruções essenciais dos agentes foram preservadas.
6. Confirme que nenhuma alteração funcional do sistema foi introduzida.
7. Examine o diff final para identificar exclusões acidentais, alterações excessivas ou conteúdo sem fundamento.

Execute verificações automatizadas de documentação somente quando houver ferramentas disponíveis e quando sua execução for segura.

Não execute operações destrutivas, não descarte alterações locais e não reverta mudanças de terceiros.

Se não for possível validar algum item, informe explicitamente essa limitação. Não declare uma verificação como concluída sem tê-la realizado.

# 5. Critérios de conclusão

A tarefa estará concluída quando:

* Os documentos afetados refletirem a implementação atual, dentro do que foi possível verificar.
* AGENTS.md e README.md tiverem responsabilidades distintas e claras.
* Não houver contradições conhecidas que possam ser resolvidas com as evidências disponíveis.
* As informações importantes e ainda válidas tiverem sido preservadas.
* As alterações estiverem limitadas à documentação e aos arquivos estritamente necessários para sua organização.
* As dúvidas não resolvidas estiverem registradas para revisão humana.

Não considere a ausência de divergências identificadas como prova de que toda a documentação está perfeita.

# 6. Relatório final

Ao terminar, apresente um relatório objetivo contendo:

1. **Resumo:** estado geral da documentação antes e depois da sincronização.
2. **Arquivos alterados:** lista dos arquivos e descrição das alterações realizadas.
3. **Divergências corrigidas:** principais inconsistências identificadas e como foram resolvidas.
4. **Validações executadas:** verificações realizadas e seus resultados.
5. **Pendências:** dúvidas, informações não verificáveis ou conflitos que exigem decisão humana.
6. **Estado final:** informe se a documentação está sincronizada, parcialmente sincronizada ou se existem bloqueios que impedem a conclusão.

Não faça commit automaticamente. Deixe as alterações disponíveis para revisão.
