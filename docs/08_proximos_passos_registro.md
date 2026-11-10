# Roteiro de Proteção Intelectual e Ofício Institucional ao CNJ

Este guia consolida as etapas práticas para proteção da marca, registro de software e o envio formal da proposta ao Conselho Nacional de Justiça (CNJ).

---

## 1. Ordem Estratégica Recomendada

Para assegurar a titularidade da criação antes de submetê-la a órgãos públicos:

```
[1. Registro de Domínio (.br)] ➔ [2. Depósito de Marca e Software no INPI] ➔ [3. Ofício por E-mail ao CNJ] ➔ [4. Pedido de Audiência]
```

---

## 2. Passo 1: Registro do Domínio no Registro.br

* **Status da Consulta:** Verificado como **DISPONÍVEL** para registro imediato:
  - `comparecejus.com.br` (Disponível - Custo anual: ~R$ 40,00)
  - `comparecejus.org.br` (Disponível)
  - `comparecejus.app.br` (Disponível)
* **Procedimento:**
  1. Acesse: [registro.br](https://registro.br).
  2. Digite `comparecejus.com.br` no campo de busca.
  3. Realize o login com seu CPF ou crie uma conta.
  4. Conclua o pagamento via PIX ou cartão de crédito para assegurar o domínio imediatamente.

---

## 3. Passo 2: Depósito da Marca "CompareceJus" no INPI

*(Nota: O órgão responsável pela propriedade intelectual no Brasil é o **INPI - Instituto Nacional da Propriedade Industrial**, e não o INPE, que é o Instituto Nacional de Pesquisas Espaciais).*

* **Acesso:** [gov.br/inpi](https://www.gov.br/inpi) ➔ Sistema *e-Marcas*.
* **Classes Sugeridas (Classificação de Nice):**
  - **Classe NCL 9:** Programas de computador executáveis, aplicativos móveis para smartphones e softwares para validação biométrica e processamento de dados judiciais.
  - **Classe NCL 42:** Serviços de computação em nuvem (SaaS), hospedagem e suporte tecnológico para órgãos judiciais.
  - **Classe NCL 45:** Serviços jurídicos e consultoria na modernização de atos judiciais processuais.
* **Benefício de Custo:** Pessoas físicas têm desconto legal de 60% nas taxas oficiais (GRU) do INPI.

---

## 4. Passo 3: Registro do Programa de Computador (Código-Fonte) no INPI

O registro de software no INPI confere validade internacional (Convenção de Berna) por 50 anos:

1. **Geração do Hash Criptográfico (SHA-512):**
   - O INPI não armazena seu código-fonte aberto; o sistema exige o envio do **Hash Criptográfico SHA-512** calculado sobre o arquivo ZIP contendo todo o código-fonte do projeto.
   - Para gerar o hash oficial no Windows PowerShell, execute na pasta do projeto:
     ```powershell
     Compress-Archive -Path * -DestinationPath "..\CompareceJus_v2_INPI.zip" -Force
     Get-FileHash -Algorithm SHA512 "..\CompareceJus_v2_INPI.zip" | Select-Object -ExpandProperty Hash
     ```
2. **Declaração de Veracidade:**
   - Acesse o portal *e-Software* do INPI.
   - Preencha o formulário eletrônico informando a autoria (Arthur Macedo), o título ("CompareceJus - Sistema de Apresentação Periódica Digital"), a linguagem utilizada (JavaScript / HTML5 / CSS3 / NodeJS) e cole a cadeia de caracteres do Hash SHA-512 gerado.
   - Pague a GRU correspondente e receba o Certificado de Registro de Programa de Computador.
   - **IMPORTANTE:** Guarde o arquivo `CompareceJus_v2_INPI.zip` em local seguro (Drive/Pen drive) sem alterá-lo, pois ele é a prova forense material vinculada ao hash.

---

## 5. Minuta: E-mail Formal de Apresentação ao CNJ

* **Destinatários Sugeridos:**
  - **DMF/CNJ (Departamento de Monitoramento e Fiscalização do Sistema Carcerário e de Execução de Medidas Socioeducativas):** Responsável institucional pelo SAREF e pelas diretrizes do programa *Fazendo Justiça*. (Consultar endereço oficial de envio no portal do CNJ).
  - **Ouvidoria do CNJ:** Como canal complementar para registro e protocolo eletrônico formal de manifestação.
* **Assunto:** Proposta de Modernização Tecnológica: Módulo "SAREF Cautelar" para Processos Fora do SEEU (Art. 319, I, CPP)

```text
Excelentíssimos(as) Senhores(as) Conselheiros(as) e Equipe Técnica do DMF/CNJ,

Cumprimentando-os cordialmente, dirijo-me a este Conselho para submeter à apreciação institucional uma proposta de inovação tecnológica complementar ao bem-sucedido ecossistema do SAREF (Sistema de Apresentação Remota por Reconhecimento Facial).

Meu nome é Arthur Macedo, desenvolvedor e autor do projeto "CompareceJus", uma arquitetura concebida para suprir a lacuna operacional hoje existente nas Varas Criminais e Centrais de Alternativas Penais do país.

Como é de conhecimento deste órgão, o SAREF transformou a fiscalização das penas no âmbito do SEEU. Contudo, milhares de pessoas beneficiadas com Liberdade Provisória com imposição de medidas cautelares (Art. 319, I, do CPP), Acordos de Não Persecução Penal (ANPP) e Suspensão Condicional do Processo (SURSIS) tramitam nos sistemas de conhecimento (PJe, e-SAJ e eproc) e não estão cadastradas no SEEU. Na quase totalidade dos fóruns brasileiros, esse contingente permanece comparecendo mensalmente aos balcões cartorários apenas para apor assinaturas físicas em livros e fichas de papel.

Para sanar este gargalo, desenvolvemos um protótipo funcional em conformidade com as Resoluções CNJ nº 288/2019 e nº 615/2025, estruturado sobre os seguintes pilares:
1. Coleta biométrica inicial realizada diretamente na Audiência de Custódia;
2. Modelo assíncrono em 2 etapas: triagem pré-analítica automatizada pela IA do Tribunal seguida de homologação funcional humana pelo servidor público;
3. Auditoria territorial cruzada (GPS vs Comarca autorizada e endereço residencial);
4. Módulo nativo para protocolo eletrônico de justificativas com anexo de atestado;
5. Emissão imediata de certidão digital dotada de fé pública e QR Code para autoridades policiais.

Colocamos a concepção tecnológica e o protótipo funcional à inteira disposição do Conselho Nacional de Justiça, seja para adoção como aplicativo independente, seja para incorporação construtiva como o futuro módulo "SAREF Cautelar" integrado à Plataforma Digital do Poder Judiciário (PDPJ-Br).

Seguem em anexo o Resumo Executivo e a documentação técnica da proposta. O protótipo funcional pode ser consultado em ambiente demonstrativo no link: [INSERIR LINK DO RENDER].

Na expectativa de podermos contribuir com os nobres propósitos de transformação digital e humanização do Judiciário brasileiro, coloco-me à disposição para agendamento de apresentação técnica.

Respeitosamente,

Arthur Macedo
Autor do Projeto CompareceJus
E-mail: [SEU E-MAIL]
Telefone / WhatsApp: [SEU TELEFONE]
Registro de Software INPI: [Nº DO PROTOCOLO]
```

---

## 6. Minuta: Solicitação Formal de Audiência

```text
EXCELENTÍSSIMO(A) SENHOR(A) CONSELHEIRO(A) DO CONSELHO NACIONAL DE JUSTIÇA (CNJ)
SUPERVISOR(A) DO DEPARTAMENTO DE MONITORAMENTO E FISCALIZAÇÃO (DMF)

Assunto: Solicitação de Audiência Técnica de 30 minutos (Apresentação do Protótipo CompareceJus)

ARTHUR MACEDO, cidadão brasileiro e desenvolvedor de tecnologia aplicada ao setor público, vem respeitosamente à presença de Vossa Excelência solicitar a concessão de audiência de 30 minutos (em formato presencial ou por videoconferência), com Vossa Excelência ou com a assessoria técnica do DMF/SAREF.

O objetivo da audiência é realizar uma demonstração prática do protótipo funcional "CompareceJus", sistema de comparecimento periódico digital desenvolvido para desonerar as Varas Criminais no controle de medidas cautelares do Art. 319, I, do CPP que tramitam fora do SEEU (PJe, e-SAJ e eproc), propondo sua eventual incorporação como módulo complementar ao SAREF na PDPJ-Br.

Disponibilidade: [Indicar turnos ou dias da semana de sua preferência].

Termos em que,
Pede deferimento.

Arthur Macedo
[Cidade - UF], [Data].
```
