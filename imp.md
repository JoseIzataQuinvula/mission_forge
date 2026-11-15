# MASTER PROMPT — MISSION FORGE
## Interactive Space Mission Engineering Simulator

Assume o papel de uma equipa sénior de desenvolvimento de jogos e software, composta por:
- Game Director
- Senior React/TypeScript Developer
- Game Systems Engineer
- Three.js Developer
- UI/UX Designer
- Educational Game Designer
- QA Engineer

A tua missão é conceber e implementar um jogo educativo funcional chamado **MISSION FORGE**, desenvolvido para o desafio **Space Mission Design Game**, do NASA Space Apps Challenge 2026.

Não quero apenas um protótipo visual, landing page ou dashboard estático. Quero um jogo interativo funcional, no qual as decisões do jogador influenciam efetivamente o desenvolvimento, lançamento e resultado de uma missão espacial.

---

# 1. IDENTIDADE DO JOGO

**Nome:** MISSION FORGE

**Slogan:** Design. Engineer. Launch. Discover.

**Género:** Educational Simulation / Space Engineering / Strategy.

**Plataforma:** Web.

**Modo:** Single-player.

**Destino inicial:** Lua.

**Missão inicial:** LUNAR ICE EXPLORER.

**Objetivo central:**

O jogador assume o papel de engenheiro responsável por projetar, validar, lançar e operar uma missão robótica lunar destinada a investigar indícios de gelo de água na região do polo sul lunar.

O jogador deve tomar decisões sobre:
- Estrutura da nave.
- Fonte de energia.
- Propulsão.
- Comunicação.
- Instrumentos científicos.
- Sistema térmico.
- Veículo lançador.
- Gestão de orçamento.
- Massa total.
- Consumo energético.
- Capacidade científica.
- Riscos operacionais.

Cada escolha deve ter consequências no resultado da missão.

O jogo deve transmitir a sensação de estar a trabalhar num verdadeiro centro de engenharia e controlo de missões espaciais.

---

# 2. TECNOLOGIAS OBRIGATÓRIAS

Utiliza:

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber, caso facilite a integração 3D
- Zustand para gestão de estado
- Lucide React para ícones
- CSS Modules ou CSS organizado por funcionalidades
- Vitest para testes

Não adicionar backend, autenticação, multiplayer ou base de dados nesta primeira versão.

O jogo deve funcionar localmente e poder ser publicado como aplicação web estática.

Os dados da missão devem estar separados da lógica de programação.

---

# 3. PRINCÍPIO FUNDAMENTAL DA ARQUITETURA

A lógica de engenharia deve ser independente da visualização 3D.

A simulação e os cálculos são responsáveis por determinar:
- Se a nave está tecnicamente preparada.
- Se o lançamento pode acontecer.
- Se existe energia suficiente.
- Se o orçamento é suficiente.
- Se os instrumentos conseguem cumprir os objetivos.
- Se a missão consegue sobreviver às condições operacionais.

O Three.js serve apenas para representar visualmente o estado da missão.

Nunca utilizar animações, objetos 3D ou efeitos visuais para determinar os resultados da simulação.

---

# 4. ESTRUTURA DO JOGO

Desenvolve seis fases principais.

## FASE 1 — MISSION BRIEFING

Criar um ecrã cinematográfico de apresentação da missão.

Apresentar:
- Nome da missão.
- Destino: Lua.
- Objetivo científico.
- Orçamento disponível.
- Massa máxima permitida.
- Duração estimada.
- Requisitos científicos.
- Condições ambientais.
- Descrição do desafio.

O jogador deve compreender o problema antes de começar a construir a nave.

Adicionar botão START MISSION.

## FASE 2 — SPACECRAFT DESIGN

Esta é a fase central do jogo.

Criar um construtor interativo de naves espaciais.

O jogador deve poder selecionar, adicionar e remover componentes de diferentes categorias:

1. Structure
2. Power Systems
3. Propulsion
4. Communication
5. Scientific Instruments
6. Thermal Control

Cada componente deve apresentar:
- Nome.
- Descrição.
- Massa em kg.
- Custo.
- Consumo energético em W, quando aplicável.
- Produção energética em W, quando aplicável.
- Capacidade científica, quando aplicável.
- Compatibilidade.
- Vantagens.
- Desvantagens.
- Fonte científica ou identificação explícita de valor ilustrativo.

A nave deve ser atualizada visualmente à medida que os componentes são adicionados.

Criar um painel de indicadores em tempo real:

- Total Mass.
- Remaining Budget.
- Power Balance.
- Scientific Capability.
- Available Data Capacity.
- Mission Readiness.

O jogador deve perceber imediatamente como cada decisão afeta a nave.

Implementar diferentes combinações possíveis de componentes.

Não permitir componentes duplicados quando a regra do sistema não o permitir.

## FASE 3 — MISSION VALIDATION

Antes do lançamento, executar uma avaliação técnica.

Verificar:

- Massa total dentro do limite.
- Orçamento disponível.
- Sistema de energia funcional.
- Sistema de comunicação.
- Propulsão adequada.
- Instrumentos científicos necessários.
- Sistema térmico adequado.
- Compatibilidade do lançador.
- Requisitos mínimos da missão.

Apresentar resultados:

- PASS.
- WARNING.
- FAILED.

Cada erro deve explicar:
1. O que está errado.
2. Porque representa um problema.
3. Qual a consequência provável.
4. Como o jogador pode corrigir.

Bloquear o lançamento quando existirem falhas críticas.

Adicionar botão RUN MISSION REVIEW.

## FASE 4 — LAUNCH CONTROL

Criar um centro de controlo de lançamento.

O jogador deve selecionar um veículo lançador compatível com a missão.

Apresentar:
- Nome do lançador.
- Capacidade de carga.
- Custo.
- Massa disponível.
- Compatibilidade.
- Descrição.

Depois de validar a configuração, permitir iniciar o lançamento.

Criar uma sequência visual cinematográfica:
- Preparação.
- Verificação dos sistemas.
- Contagem decrescente.
- Ignição.
- Descolagem.
- Separação de estágios, se aplicável.
- Inserção na trajetória de transferência.

A animação deve acompanhar os resultados da simulação.

Não utilizar lançadores ou especificações fictícias como se fossem dados reais. Se forem necessários valores simplificados para o jogo, identificá-los como valores ilustrativos.

## FASE 5 — LUNAR OPERATIONS

Depois do lançamento, iniciar a fase de operações.

Apresentar uma visualização da Lua e da nave em aproximação.

A missão deve decorrer através de etapas interativas:

1. Transferência para a Lua.
2. Aproximação e inserção na trajetória prevista.
3. Descida e aterragem na região selecionada.
4. Ativação do rover ou equipamento científico.
5. Exploração da região.
6. Recolha de dados.
7. Transmissão dos resultados.

Introduzir acontecimentos que possam afetar a missão:
- Perda temporária de comunicação.
- Consumo energético superior ao previsto.
- Exposição prolongada a zonas de sombra.
- Acumulação de poeira nos equipamentos.
- Falhas temporárias de instrumentos.

Cada acontecimento deve ter consequências calculadas pelo motor de simulação.

O jogador deve poder tomar decisões durante as operações, por exemplo:
- Priorizar energia.
- Suspender instrumentos secundários.
- Priorizar comunicação.
- Continuar recolha científica.
- Entrar em modo de segurança.

Implementar uma simulação determinística: a mesma configuração e a mesma seed devem produzir os mesmos resultados.

## FASE 6 — MISSION DEBRIEF

No final, apresentar um relatório completo.

Incluir:
- Resultado geral da missão.
- Sucesso ou falha.
- Objetivos científicos concluídos.
- Objetivos não concluídos.
- Massa final.
- Orçamento utilizado.
- Eficiência energética.
- Dados recolhidos e transmitidos.
- Decisões mais importantes.
- Principais falhas.
- Lições aprendidas.

Criar uma pontuação baseada em:

- Engineering Performance.
- Scientific Achievement.
- Resource Efficiency.
- Mission Reliability.

Explicar como as decisões do jogador influenciaram o resultado.

O relatório deve ter valor educativo e não se limitar a apresentar uma pontuação.

---

# 5. ENGINEERING ENGINE

Implementar um motor de engenharia independente da interface.

Criar módulos separados para:

- Mass Calculation.
- Budget Calculation.
- Power Calculation.
- Energy Consumption.
- Communication Capacity.
- Scientific Capability.
- Launch Compatibility.
- Mission Validation.
- Risk Assessment.

Utilizar unidades consistentes.

Atenção:
- Potência é medida em watts (W).
- Energia é medida em watt-hora (Wh) ou joules (J).
- Massa é medida em quilogramas (kg).
- Custos devem utilizar uma unidade monetária consistente.
- Capacidade de transmissão deve utilizar unidades consistentes, por exemplo Mbps.

Não confundir potência com energia.

Todos os cálculos devem ser testáveis e não depender de componentes React.

Criar interfaces TypeScript para:
- Mission.
- SpacecraftComponent.
- LaunchVehicle.
- MissionConfiguration.
- ValidationResult.
- SimulationEvent.
- MissionReport.

A validação deve devolver erros e avisos estruturados, não apenas true ou false.

---

# 6. VISUALIZAÇÃO 3D

Utilizar Three.js para criar uma experiência espacial imersiva.

Elementos visuais:
- Nave espacial modular.
- Lua.
- Terra ao fundo.
- Espaço profundo.
- Órbita ou trajetória simplificada.
- Animação de lançamento.
- Aproximação lunar.
- Aterragem.

O construtor deve refletir visualmente os componentes selecionados.

Não é necessário criar modelos 3D extremamente complexos.

Priorizar:
- Boa iluminação.
- Materiais convincentes.
- Movimento suave.
- Escala visual coerente.
- Interface cinematográfica.
- Desempenho em computadores comuns.

Se não existirem modelos 3D adequados, criar modelos simples proceduralmente com geometria Three.js.

Não depender de assets externos sem necessidade.

---

# 7. INTERFACE E EXPERIÊNCIA DO UTILIZADOR

A identidade visual deve combinar:

NASA Mission Control + Simulador de Engenharia + Interface de videojogo premium.

Paleta:

- Background: #080D16
- Panels: #111B2A
- Primary Text: #F1F5F9
- Secondary Text: #94A3B8
- Accent: #39BDF8
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444

Características:
- Interface escura.
- Tipografia moderna.
- Painéis técnicos.
- Indicadores de estado.
- Animações subtis.
- Transições entre fases.
- Hierarquia visual clara.
- Design responsivo.

Evitar:
- Aparência de template administrativo genérico.
- Excesso de cartões.
- Botões sem funcionalidade.
- Indicadores com valores inventados sem explicação.
- Textos de preenchimento.
- Elementos meramente decorativos que parecem interativos.

A interface deve ser fácil de compreender mesmo para alguém sem conhecimentos prévios de engenharia espacial.

---

# 8. ESTRUTURA DO PROJETO

Organizar o projeto por responsabilidades:

src/
  app/
  components/
    layout/
    dashboard/
    spacecraft/
    mission/
    reports/
  features/
    briefing/
    engineering/
    validation/
    launch/
    operations/
    debrief/
  engine/
    calculations/
    validators/
    simulation/
    tradeoffs/
  three/
    scenes/
    objects/
    animations/
  store/
  data/
  types/
  utils/
  styles/

Criar ficheiros adicionais apenas quando forem necessários.

Não colocar toda a lógica em App.tsx.

Não criar componentes gigantes.

Separar:
- Dados.
- Estado.
- Cálculos.
- Simulação.
- Apresentação.
- Visualização 3D.

---

# 9. REQUISITOS DE QUALIDADE

O projeto deve cumprir os seguintes requisitos:

1. O jogador consegue iniciar uma missão.
2. Consegue adicionar e remover componentes.
3. Os indicadores atualizam automaticamente.
4. As escolhas produzem consequências reais.
5. A validação identifica configurações inválidas.
6. O jogo bloqueia lançamentos tecnicamente impossíveis segundo as regras implementadas.
7. É possível executar uma missão completa.
8. A simulação produz resultados diferentes para configurações diferentes.
9. O relatório apresenta os resultados reais calculados pelo motor.
10. A aplicação não depende de autenticação.
11. O jogo não apresenta botões falsos.
12. Não existem erros críticos na consola.
13. A interface funciona em Chrome.
14. A aplicação é utilizável num portátil sem GPU dedicada.

Criar testes para os cálculos, validações e simulação.

---

# 10. FONTES E PRECISÃO CIENTÍFICA

Utilizar fontes científicas credíveis, preferencialmente NASA.

Referências iniciais:
- https://science.nasa.gov/moon/
- https://science.nasa.gov/mission/lro/
- https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
- https://www.nasa.gov/moon-to-mars/

Criar:
- docs/SCIENCE_SOURCES.md
- docs/ASSETS_LICENSES.md
- docs/GAME_DESIGN.md

Distinguir sempre:
- Dados científicos reais.
- Valores simplificados para fins educativos.
- Hipóteses de simulação.
- Mecânicas de jogo.

Não afirmar que a NASA desenvolveu, aprovou ou patrocina este jogo.

---

# 11. ESTRATÉGIA DE IMPLEMENTAÇÃO

O prazo é extremamente curto. A prioridade é entregar uma experiência completa e funcional, não um sistema excessivamente complexo.

Desenvolver nesta ordem:

**SPRINT 1 — FOUNDATION**
- Configurar projeto.
- Criar estrutura.
- Definir tipos.
- Criar dados da missão.
- Implementar cálculos de massa, orçamento e energia.
- Implementar Zustand.
- Criar ecrã de briefing.

**SPRINT 2 — SPACECRAFT BUILDER**
- Catálogo de componentes.
- Adicionar e remover componentes.
- Indicadores em tempo real.
- Visualização 3D básica.
- Validação técnica.

**SPRINT 3 — LAUNCH AND OPERATIONS**
- Seleção do lançador.
- Verificação de lançamento.
- Animação de lançamento.
- Simulação de missão.
- Eventos operacionais.
- Decisões do jogador.

**SPRINT