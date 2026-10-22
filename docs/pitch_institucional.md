# Dossiê de Apresentação Institucional: CompareceJus
## Modernização do Comparecimento Periódico em Juízo (Art. 319, I, CPP)

---

### 1. Resumo Executivo
O **CompareceJus** é uma solução tecnológica desenhada para desonerar as Varas Criminais e Centrais de Alternativas Penais do Poder Judiciário brasileiro. A plataforma substitui o comparecimento físico mensal presencial ao balcão dos fóruns por uma **apresentação digital segura e auditável**, via aplicativo com padrão visual **GOV.BR**, utilizando **geolocalização ativa (geofencing)**, **prova de vida biométrica facial (liveness detection)** e **certidão digital assinada com QR Code**.

---

### 2. O Problema Atual nos Fóruns
1. **Sobrecarga de Servidores:** Centenas de apenados e réus comparecem mensalmente apenas para assinar folhas ou livros físicos. Servidores de balcão perdem cerca de 3 a 5 minutos por atendimento (localização de autos, validação de documento, assinatura física e posterior lançamento em sistema).
2. **Custo e Risco para o Cidadão:** O comparecimento presencial impõe perda de dias de trabalho formal/informal e custos de transporte a populações em extrema vulnerabilidade socioeconômica.
3. **Fragilidade Probatória do Livro Físico:** A assinatura manual não garante horário preciso nem localização, sendo suscetível a extravios de fichas e fraudes de assinatura por terceiros.

---

### 3. Fundamentação Jurídica & Alinhamento Institucional
- **Art. 319, inciso I, do Código de Processo Penal (CPP):** *"Comparecimento periódico em juízo, no prazo e nas condições fixadas pelo juiz, para informar e justificar atividades."* A lei exige o ato de comparecer e informar, mas não veda o uso de meios telemáticos seguros para sua formalização.
- **Lei 11.419/2006 (Informatização do Processo Judicial):** Consagra o uso do meio eletrônico na tramitação de processos e atos judiciais.
- **Resoluções e Diretrizes do CNJ:** Alinhado ao Programa *Justiça 4.0*, *Fazendo Justiça* e às diretrizes de despenalização e humanização da execução penal do Conselho Nacional de Justiça (CNJ).
- **Art. 89 da Lei 9.099/95 (SURSIS Processual) e Art. 28-A do CPP (ANPP).**

---

### 4. Camadas de Segurança e Prevenção a Fraudes

| Camada | Tecnologia | Mecanismo de Prevenção |
| :--- | :--- | :--- |
| **Identidade** | Integração Gov.br (Prata/Ouro) | Autenticação oficial pelo CPF com duplo fator |
| **Presença Local** | Geofencing + Anti-Mocking GPS | Validação de que o réu permanece na Comarca autorizada, bloqueando apps de GPS falso |
| **Prova de Vida** | Liveness Detection (Face Match) | Instruções dinâmicas (piscar, girar rosto) impedindo o uso de fotos impressas ou vídeos |
| **Não-Repúdio** | Hash SHA-256 + QR Code | Geração de certidão digital com carimbo temporal imutável |
| **Privacidade** | Conformidade LGPD | O app **não rastreia 24h**; coleta os dados unicamente nos 60 segundos do ato mensal |

---

### 5. Benefícios para a Gestão Judiciária (ROI)
- **Redução de até 80% do fluxo de balcão** nas secretarias das Varas Criminais.
- **Integração com PJe / SEEU:** Geração de certidão automática de cumprimento mensal, pronta para juntada nos autos sem digitação manual pelo servidor.
- **Painel de Triagem Inteligente:** O servidor não precisa revisar caso a caso; o sistema sinaliza apenas as exceções (ex.: GPS fora da comarca autorizada ou foto com índice de confiança divergente).
- **Sustentabilidade:** Eliminação completa de livros e fichas de papel.
