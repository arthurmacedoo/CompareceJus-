# CompareceJus (v2.0): Resumo Executivo para o CNJ (DMF e DTI)

**Microsserviço Nativo da PDPJ-Br ("Módulo Cautelar") para Apresentação Periódica Digital em Liberdade Provisória e Medidas Cautelares Diversas da Prisão (Art. 319 do CPP).**
Autor: Arthur Macedo · Arquitetura: Nativa PDPJ-Br / MNI v2.2.2 / ICP-Brasil (PJeOffice)

---

## 1. O Problema Institucional

O comparecimento periódico em juízo (**art. 319, I, do CPP**), a proibição de ausentar-se da comarca (**art. 319, IV, do CPP**), as condições do Acordo de Não Persecução Penal (**art. 28-A do CPP**) e da suspensão condicional do processo (**art. 89 da Lei nº 9.099/1995**) obrigam centenas de milhares de pessoas a comparecer mensalmente aos fóruns brasileiros **apenas para assinar um livro ou ficha de papel**.

- **Para as Varas Criminais e Secretarias:** filas no balcão, milhares de horas de servidores gastas com conferência manual e digitalização de fichas, livros físicos sujeitos a extravio e assinaturas sem comprovação geocartográfica de permanência na comarca.
- **Para o Jurisdicionado:** perda de um dia de trabalho e custo de deslocamento mensal, atingindo de forma desproporcional trabalhadores informais e hipossuficientes.
- **A Lacuna Arquitetural Atual:** o **SAREF** (CNJ/TJDFT) solucionou esse gargalo com excelência para a **execução penal integrada ao SEEU**. Contudo, os réus da fase de conhecimento (Audiência de Custódia, Liberdade Provisória, Cautelares, ANPP e Sursis Processual) tramitam no **PJe, e-SAJ e eproc**, **não estão no SEEU** e permanecem desassistidos pela transformação digital.

---

## 2. A Solução: Módulo Cautelar Nativo da PDPJ-Br

O **CompareceJus (v2.0)** foi projetado estritamente sob os padrões da **Plataforma Digital do Poder Judiciário Brasileiro (PDPJ-Br — Resolução CNJ nº 335/2020)** para operar como o **Módulo Cautelar** integrado aos sistemas de processo eletrônico:

| Etapa | Ator / Camada | Operação Técnica e Jurídica |
|---|---|---|
| **0. Cadastro na Custódia (30s)** | Servidor na **Sala de Audiência de Custódia** (`/cadastro-custodia`) | Vincula o réu em 30 segundos com **Foto-Mestra** via: (1) Captura direta na webcam da custódia, (2) Extração do PDF do Auto de Prisão em Flagrante (APF), ou (3) Consulta ao barramento **BNMP 3.0 / TSE-ICN**, definindo o polígono da comarca e o endereço residencial. |
| **1. Apresentação Remota ou Assistida** | Cidadão no App (ou Balcão/Totem em contingência) | Coleta pontual de GPS anti-mock, prova de vida ativa/passiva, selfie e declaração de veracidade. Para vulneráveis sem celular, há o **Comparecimento Assistido no Fórum** (Res. CNJ nº 288/2019). |
| **2. Pré-Análise Auditável (IA)** | **Motor de IA do Tribunal** (`src/analise-ia.js`) | Avalia **23 sinais explicáveis** (biometria facial, geofencing comarca × endereço, detecção de Mock GPS, emuladores e câmeras virtuais), gerando escore de 0 a 100 e triagem 🟢🟡🔴. O cidadão recebe **recibo imediato**. |
| **3. Homologação e Assinatura Qualificada** | **Servidor Judiciário** no expediente (`/painel`) | Analisa os alertas e homologa (os verdes em lote de 1 clique) assinando digitalmente via **PJeOffice / ICP-Brasil (Certificado X.509 AC-JUS + Carimbo do Tempo ACT Observatório Nacional — Lei nº 11.419/2006)**. |
| **4. Juntada Automática via MNI v2.2.2** | **Conector MNI + Mensageria PDPJ-Br** (`src/integracao-mni.js`) | Dispara assincronamente (RabbitMQ/Kafka) a operação `entregarManifestacaoProcessual` do **MNI v2.2.2**, juntando a certidão PDF/A no **PJe, e-SAJ ou eproc** com movimentação **TPU/CNJ Cód. 85 (Complemento 12266)**. |

> [!IMPORTANT]
> **Supervisão Humana Obrigatória (Resolução CNJ nº 615/2025):** A Inteligência Artificial nunca profere decisão nem revoga benefício cautelar. Ela atua exclusivamente como filtro pré-analítico para o servidor investido de fé pública.

---

## 3. Blindagem dos 6 Requisitos Críticos de Arquitetura Judiciária (v2.0)

1. **Interoperabilidade MNI v2.2.2 Zero-Toque (`src/integracao-mni.js`):** O servidor não baixa nem sobe PDFs manualmente. Ao homologar, o sistema publica evento na mensageria (RabbitMQ/Kafka) e invoca `entregarManifestacaoProcessual` com código TPU/CNJ `85` (*Juntada de Certidão*) e `12266` (*Comparecimento Periódico*).
2. **Fé Pública e Assinatura Qualificada ICP-Brasil (Lei 11.419/2006):** Homologação individual e em lote integrada ao fluxo **PJeOffice / Assinador PDPJ**, gravando cadeia X.509 (`AC-JUS v5`), carimbo do tempo RFC 3161 (Observatório Nacional) e verificação pública em `/verificar` (*"Documento assinado digitalmente por [Servidor/Matrícula] com certificado ICP-Brasil"*).
3. **Segurança de Hardware Mobile (Play Integrity & App Attest):** O dossiê arquitetural distingue claramente o protótipo web demonstrativo da versão de distribuição aos réus, que opera sob atestação criptográfica de hardware (*Google Play Integrity API* no Android e *Apple App Attest / DeviceCheck* no iOS) combinada com checagens de telemetria contra Fake GPS, emuladores e câmeras virtuais (`src/analise-ia.js`).
4. **Origem Oficial da Foto-Mestra na Custódia (`/cadastro-custodia`):** Elimina qualquer brecha de autofraude no primeiro acesso ao estabelecer 3 fontes oficiais de ingestão da biometria de referência na própria audiência de custódia (Webcam da sala, PDF do APF ou Barramento BNMP 3.0 / TSE).
5. **Contingência para Hipossuficiência e Exclusão Digital (Res. CNJ 288/2019):** Módulo nativo no painel da secretaria para *"Registrar Comparecimento Assistido / Presencial no Fórum"* (balcão, totem de autoatendimento ou Defensoria Pública), garantindo que réus sem smartphone ou sem internet jamais sofram cerceamento ou prisão por vulnerabilidade econômica.
6. **Pronto para a Nuvem PDPJ-Br (Kubernetes / OpenShift):** Empacotado com `Dockerfile` non-root (UID 1001 compatível com *Restricted SCC* do Red Hat OpenShift) e `docker-compose.yml`, autenticação federada via **SSO-JUS / Keycloak** e APIs RESTful documentadas sob **OpenAPI 3.1**.

---

## 4. Proposta de Encaminhamento ao CNJ

1. **Apresentação Técnica (30 minutos)** junto ao Departamento de Monitoramento e Fiscalização do Sistema Carcerário (DMF) e à Diretoria de Tecnologia da Informação (DTI/PDPJ-Br).
2. **Avaliação de Incorporação como "Módulo Cautelar"** na Plataforma Digital do Poder Judiciário (PDPJ-Br) / ecossistema SAREF, ou autorização de **Projeto Piloto de 90 a 180 dias** em Vara Criminal / Central de Alternativas Penais.
