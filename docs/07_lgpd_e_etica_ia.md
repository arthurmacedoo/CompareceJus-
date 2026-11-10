# Conformidade com a LGPD, Ética no Uso de IA e Não-Exclusão Digital

Este documento formaliza as salvaguardas jurídicas, técnicas e humanitárias adotadas pelo **CompareceJus (v2.0)** para assegurar estrita aderência à **Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)**, à governança de Inteligência Artificial do Poder Judiciário (**Resolução CNJ nº 615/2025**) e à Política de Alternativas Penais (**Resolução CNJ nº 288/2019**).

---

## 1. Fundamentação Legal e Tratamento de Dados Pessoais Sensíveis

O CompareceJus trata dados biométricos faciais (classificados como dados pessoais sensíveis pelo art. 5º, II, da LGPD) e coordenadas pontuais de geolocalização:

* **Base Legal (LGPD Art. 11, II, 'a' e 'b'):** O tratamento é legitimado pelo cumprimento de obrigação legal e execução de competências jurisdicionais pelo Poder Público, especificamente a fiscalização de medidas cautelares diversas da prisão impostas por Magistrados com esteio no **Art. 319, incisos I e IV, do Código de Processo Penal (CPP)**, acordos de não persecução penal (**Art. 28-A do CPP**) e suspensão condicional do processo (**Art. 89 da Lei nº 9.099/1995**).
* **Finalidade Específica e Não-Compartilhamento (LGPD Art. 23):** Os dados são processados com o propósito único e vinculado de certificar o ato processual de apresentação periódica e comprovar a permanência do cidadão nos limites da comarca autorizada, sendo expressamente vedado seu uso para vigilância generalizada ou compartilhamento comercial.
* **Minimização na Verificação Pública (`verificar.html`):** A consulta pública via QR Code da certidão exibe apenas o nome mascarado (`C*** E*** d* S***`), CPF mascarado (`•••.982.247-••`), metadados da assinatura ICP-Brasil do servidor e protocolo de juntada MNI, **jamais expondo a fotografia ou o endereço residencial do réu**.

---

## 2. Princípio da Minimização e Não-Rastreamento Contínuo

Uma das principais salvaguardas constitucionais do CompareceJus reside na diferenciação técnica e jurídica em relação à monitoração eletrônica contínua (tornozeleira eletrônica — art. 319, IX, do CPP):

| Característica | Tornozeleira Eletrônica (Art. 319, IX) | CompareceJus (Art. 319, I e IV) |
|---|:---:|:---:|
| **Grau de Invasividade** | Monitoramento 24 horas ininterrupto. | **Coleta pontual nos 30 segundos do ato mensal.** |
| **Vigilância de Rotina** | Rastreia itinerários, locais de repouso e trabalho. | **Não armazena histórico de deslocamentos nem roda em background.** |
| **Bateria e Conectividade** | Exige recarga diária e sinal contínuo. | Exige apenas acesso momentâneo à internet no dia escolhido. |
| **Estigmatização Social** | Dispositivo visível no corpo do cidadão. | **Zero estigma corporal:** realizado no smartphone ou totem institucional. |

> [!NOTE]
> **Desligamento Imediato de Sensores:** O aplicativo encerra completamente a sessão de câmera e GPS no exato instante em que o recibo criptográfico é emitido. Nenhuma permissão de localização em segundo plano (`ACCESS_BACKGROUND_LOCATION`) é solicitada pelo aplicativo.

---

## 3. Governança Ética de Inteligência Artificial (Resolução CNJ nº 615/2025)

Em conformidade com as diretrizes do Conselho Nacional de Justiça para sistemas de IA no Poder Judiciário:

### 3.1 Supervisão Humana Obrigatória (*Human-in-the-Loop*)
A verificação biométrica em matéria processual penal é categorizada como aplicação de **Alto Risco**. Por esse motivo:
* A Inteligência Artificial atua **exclusivamente como motor pré-analítico de triagem e organização de fila**; ela **não possui poderes decisórios para revogar medidas cautelares, certificar revelia, aplicar sanções ou decretar prisão preventiva**.
* Toda certidão judicial só adquire validade processual e fé pública após o ato volitivo do servidor judiciário de **"Homologar e Assinar Digitalmente"** via certificado qualificado **ICP-Brasil (PJeOffice)**, em cumprimento ao art. 1º, § 2º, III, da Lei nº 11.419/2006.

### 3.2 Explicabilidade Algorítmica e Mitigação de Viés
* **Auditoria Caixa-Branca (23 Sinais Explicáveis):** O sistema não utiliza escores opacos. Cada alerta aponta a regra exata acionada (`LONGE_DO_ENDERECO`, `BIOMETRIA_INCONCLUSIVA`, `MOCK_LOCATION_ATIVO`), o peso atribuído e a fundamentação em linguagem simples para o servidor e para a Defesa.
* **Limiares Conservadores pró-Cidadão:** Em situações onde iluminação precária, câmeras de baixo custo ou características fenotípicas gerem incerteza matemática (distância euclidiana entre `0.45` e `0.55`), o sistema **não rejeita o comparecimento**: classifica-o como **AMARELO (Inconclusivo)** e encaminha para conferência visual humana do escrevente.

---

## 4. Diretrizes de Acessibilidade e Não-Exclusão Digital (Resolução CNJ nº 288/2019)

A transformação digital do Poder Judiciário não pode converter a pobreza ou a vulnerabilidade social em causa de encarceramento cautelar. O CompareceJus incorpora em seu código (`POST /api/servidor/comparecimento-assistido` e modal dedicado na `tela4_painel_servidor.html`) um **Protocolo Institucional de Contingência para Hipossuficiência e Exclusão Digital**:

### 4.1 Garantias Fundamentais de Não-Discriminação
1. **Gratuidade e Facultatividade Material:** O uso do aplicativo em celular próprio é uma faculdade desoneradora. A ausência de smartphone, de pacote de dados móveis ou de energia elétrica jamais configura descumprimento de medida cautelar.
2. **Protocolo de Tolerância Técnica:** Tentativas frustradas por falha de conectividade ou limitação de hardware da câmera do réu são registradas automaticamente na trilha de auditoria e asseguram prazo de tolerância de **5 (cinco) dias úteis** para regularização sem prejuízo processual.

### 4.2 Canais Físicos Alternativos de Comparecimento Assistido
Para os cidadãos em situação de hipossuficiência, população em situação de rua, idosos ou pessoas com deficiência (PcD), o sistema disponibiliza o fluxo **"Registrar Comparecimento Assistido / Presencial no Fórum"** através de quatro canais presenciais dignos e sem filas de papel:
* **Canal 1 — Balcão da Secretaria Judicial:** O servidor localiza o réu em tela, confere seu documento físico ou a Foto-Mestra capturada na custódia e emite a certidão eletrônica assinada via ICP-Brasil com juntada automática no PJe/e-SAJ/eproc via MNI v2.2.2.
* **Canal 2 — Totem de Autoatendimento no Fórum:** Equipamento instalado na recepção do Fórum com câmera e rede interna do Tribunal, operado com auxílio de servidor ou estagiário.
* **Canal 3 — Posto de Atendimento da Defensoria Pública:** Registro realizado com assistência direta da Defensoria Pública no próprio complexo judiciário.
* **Canal 4 — Central de Alternativas Penais (CAP / CIAP):** Registro unificado no momento do atendimento multidisciplinar da equipe técnica.

Dessa forma, o CompareceJus extingue o arcaico livro de papel para 100% dos processos da vara, ao mesmo tempo em que protege integralmente os cidadãos digitalmente excluídos.
