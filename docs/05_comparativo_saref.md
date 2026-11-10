# Estudo Comparativo: SAREF (CNJ) vs CompareceJus

Este documento analisa em detalhes as características operacionais e tecnológicas do **SAREF** (Sistema de Apresentação Remota por Reconhecimento Facial), desenvolvido pelo TJDFT e integrado à PDPJ-Br pelo CNJ, contrastando-as com as inovações introduzidas pelo **CompareceJus** e apresentando a proposta construtiva de criação do **"SAREF Cautelar"**.

---

## 1. O que o SAREF Faz Atualmente

O SAREF representou um marco histórico na modernização da execução penal no Brasil. Suas principais características documentadas são:
* **Ambiente de Acesso:** Aplicação web responsiva no endereço oficial `saref.pdpj.jus.br`.
* **Autenticação:** O apenado acessa informando CPF e código de segurança.
* **Mecanismos de Validação:** Captura de selfie com biometria facial e coleta de coordenadas de geolocalização.
* **Público e Escopo:** Desenhado estritamente para a **Vara de Execuções Penais (VEP)** e integrado de ponta a ponta ao **SEEU (Sistema Eletrônico de Execução Unificado)**.
* **Cadastro Prévio Obrigatório:** A foto de referência e os dados biométricos do apenado exigem **deslocamento presencial prévio ao fórum da comarca** para alimentação inicial na base do sistema.
* **Tratamento de Inconsistências:** Caso o reconhecimento facial não seja bem-sucedido após **3 tentativas**, o sistema bloqueia o acesso remoto e exige o comparecimento físico ao fórum.
* **Disponibilização de Comprovante:** A certidão é processada e enviada por e-mail em até 48 horas úteis, com baixa no SEEU.

---

## 2. O Gargalo Não Coberto pelo SAREF: O Ponto Cego Processual

O SAREF opera com maestria para indivíduos que já possuem condenação penal transitada em julgado e cumprem pena no SEEU (regime aberto, semiaberto ou livramento condicional).

Todavia, **a imensa maioria do fluxo físico de pessoas nos balcões dos fóruns criminais brasileiros não está no SEEU**, mas sim na fase processual de conhecimento:
1. Pessoas beneficiadas com **Liberdade Provisória** na **Audiência de Custódia** mediante imposição de medida cautelar diversa da prisão (Art. 319, inciso I, do CPP).
2. Pessoas beneficiadas com **Acordo de Não Persecução Penal (ANPP - Art. 28-A do CPP)**.
3. Pessoas em cumprimento de **Suspensão Condicional do Processo (SURSIS Processual - Art. 89 da Lei nº 9.099/95)**.

Estes processos tramitam nos sistemas processuais locais de 1º Grau: **PJe (Processo Judicial Eletrônico), e-SAJ (Tribunal de Justiça de SP, SC, etc.) e eproc (TRF4, TJRS, TJSC, etc.)**. Como estes réus não possuem processo de execução aberto no SEEU, eles não conseguem utilizar o SAREF e continuam, mês a mês, comparecendo fisicamente para assinar livros de papel.

---

## 3. Matriz Comparativa Detalhada

| Aspecto Analisado | SAREF (CNJ / TJDFT) | CompareceJus (Proposta) |
|---|---|---|
| **Público-Alvo** | Sentenciados da Execução Penal (com guia de execução ativa no SEEU). | **Réus em Liberdade Provisória (Audiência de Custódia)**, cautelares do art. 319 do CPP, ANPP e SURSIS nos sistemas de conhecimento. |
| **Sistemas Judiciais Integrados** | Exclusivamente SEEU. | **PJe, e-SAJ e eproc** via conectores da Plataforma Digital do Poder Judiciário (PDPJ-Br / MNI). |
| **Momento da Coleta da Foto Oficial** | Exige ida posterior presencial ao balcão da VEP para cadastro. | **Cadastrada de imediato na Audiência de Custódia**, aproveitando a presença obrigatória do cidadão perante o Juiz. |
| **Tratamento de Divergência Biométrica** | Bloqueio automático após 3 tentativas inválidas (obriga ida ao fórum). | **Encaminhamento para a fila de Auditoria Humana** do servidor, que avalia com 1 clique sem obrigar o réu a faltar ao trabalho. |
| **Conferência Territorial** | Registro pontual de coordenadas de GPS. | **Duplo Geofence:** Compara GPS contra o polígono da Comarca (Art. 319, IV) e contra o endereço residencial informado nos autos. |
| **Emissão do Comprovante** | Envio por e-mail em até 48 horas úteis. | **Emissão Instantânea na Tela (Recibo/Certidão)** com QR Code público de alta precisão e Hash SHA-256 para autoridades policiais. |
| **Módulo de Justificativa Judicial** | Não possui; exige peticionamento por advogado ou deslocamento físico. | **Protocolo Nativo pelo App**, permitindo anexar atestado médico ou declaração de trabalho com emissão de protocolo oficial. |
| **Modelo de Triagem da Serventia** | Fila tradicional de conferência. | **Triagem Semafórica (🟢/🟡/🔴) com Homologação em Lote**: o cartório homologa centenas de casos regulares com apenas 1 clique. |

---

## 4. Proposta Construtiva ao CNJ: O "SAREF Cautelar"

O objetivo do projeto **não é competir com o SAREF**, mas sim somar esforços com a política pública exitosa já estabelecida pelo Conselho Nacional de Justiça.

### Arquitetura da Proposta de Aprimoramento:
A proposta que submetemos ao CNJ é a criação do módulo **"SAREF Cautelar"**, incorporado ao ecossistema da **PDPJ-Br**, composto por:
1. **Aproveitamento da Infraestrutura do SAREF:** Manter a governança centralizada, a marca institucional confiável do CNJ e as diretrizes de segurança da informação da PDPJ-Br.
2. **Conectores Multi-Sistema:** Disponibilizar os adaptadores desenvolvidos no CompareceJus para permitir a consulta e a juntada automática de certidões nos autos que tramitam no PJe, e-SAJ e eproc.
3. **Módulo de Entrada na Audiência de Custódia:** Integrar a captura da foto de referência ao sistema de Audiência de Custódia (SISTAC) e ao programa *Fazendo Justiça*, garantindo que o réu saia da audiência já habilitado digitalmente.
4. **Painel de Gestão por Exceção:** Incorporar a matriz semafórica (🟢/🟡/🔴) e o fluxo de homologação em lote para desonerar as secretarias das Varas Criminais comuns.
