# CompareceJus • Apresentação Periódica Digital
> **Modernização do Comparecimento em Juízo (Medida Cautelar — Art. 319, I, do CPP)**

![CompareceJus Banner](https://img.shields.io/badge/Status-Protótipo%20Validado-success?style=for-the-badge)
![Poder Judiciário](https://img.shields.io/badge/Poder%20Judiciário-Tribunal%20de%20Justiça-0c326f?style=for-the-badge)
![LGPD](https://img.shields.io/badge/Privacidade-LGPD%20%2B%20ICP--Brasil-1351b4?style=for-the-badge)

---

## ⚖️ Sobre o Projeto

O **CompareceJus** é uma solução tecnológica desenhada para desonerar as Varas Criminais, Juizados e Centrais de Alternativas Penais do Poder Judiciário brasileiro. 

Atualmente, milhares de cidadãos em cumprimento de medidas cautelares diversas da prisão (**Art. 319, I, CPP**), livramento condicional e acordos de não persecução penal (ANPP) precisam comparecer todo mês presencialmente às secretarias dos fóruns apenas para assinar um livro físico. Isso gera:
- Filas e aglomerações nas secretarias dos fóruns.
- Sobrecarga contínua de servidores públicos em atendimentos manuais de balcão.
- Custos de transporte recorrentes e perda de dias de trabalho para populações vulneráveis.

A plataforma substitui o comparecimento físico por uma **apresentação digital segura e auditável** via celular, com validação de presença territorial (**Geofencing**), prova de vida biométrica facial (**Liveness 3D**) e emissão instantânea de **Certidão Digital com QR Code**.

---

## 📱 Estrutura das Telas do Protótipo

### 1. App Mobile do Cidadão (Viewport 390x844)
- **Tela 1 — Dashboard Minimalista:** Foco imediato no ciclo mensal vigente (`Outubro / 2026 • Pendente`), data limite e botão de ação primária em alto contraste (*"Realizar Comparecimento"*). Resumo do processo em 2 linhas e histórico recente.
- **Tela 2 — Câmera & GPS Full Screen:** Visor biométrico oval de alta fidelidade com detecção em tempo real e prova de vida dinâmica (*"Olhe para a câmera e pisque devagar"*), acompanhado de chip flutuante de leitura territorial imediata: `● Comarca Autorizada (GPS OK)`.
- **Tela 3 — Comprovante Digital (Clean Receipt):** Recibo no estilo bancário contemporâneo com indicador verde de homologação, dados tabulares do processo, carimbo de data/hora oficial de Brasília, código de validação, Hash SHA-256 e QR Code em alta definição para conferência por policiais e oficiais de justiça.

### 2. Painel Web da Vara Criminal (Desktop 1280x800)
- **Tela 4 — Gestão por Exceção (Triagem Inteligente):** O sistema valida automaticamente 94.4% dos comparecimentos regulares e isola em uma aba de atenção imediata apenas os casos com alertas (ex.: tentativa fora do raio da comarca ou biometria atípica).
- **Dossiê Comparativo de Auditoria:** Foto oficial de cadastro (TSE/CNJ) lado a lado com a foto ao vivo capturada, mapa com o ponto GPS e status do detector anti-mocking (bloqueio de GPS falso).
- **Protocolo em Lote PJe/SEEU:** Botão de assinatura e juntada em lote de centenas de certidões nos autos com recibo eletrônico unificado.

---

## 🏛️ Fundamentação Legal e Conformidade

| Pilar | Base Legal / Técnica | Descrição |
| :--- | :--- | :--- |
| **Medida Cautelar** | Art. 319, I do CPP | Comparecimento periódico para informar e justificar atividades |
| **Processo Eletrônico** | Lei nº 11.419/2006 | Validade jurídica plena de atos e comunicações por meio telemático |
| **Diretrizes CNJ** | Resolução CNJ nº 288/2019 | Política institucional para a aplicação de alternativas penais |
| **Privacidade / LGPD** | Lei nº 13.709/2018 | Coleta estritamente pontual no momento do ato mensal (**sem rastreamento contínuo 24h**) |
| **Fé Pública** | ICP-Brasil / SHA-256 | Assinatura com não-repúdio e carimbo de tempo |

---

## 🚀 Como Executar o Protótipo Localmente

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd eager-turing
   ```

2. Abra o arquivo principal no navegador:
   - Dê um duplo clique em `index.html` (ou abra via Live Server).

3. O visualizador integrado permite alternar instantaneamente entre:
   - **📱 App Mobile (Cidadão):** Navegação entre as Telas 1, 2 e 3 em moldura de smartphone.
   - **💻 Painel Web (Servidor da Vara):** Simulação interativa do ambiente de secretaria com botões funcionais de auditoria de dossiê e protocolo em lote.

---

## 📄 Dossiê Institucional para Apresentação
O dossiê completo de pitch com argumentação técnica e jurídica para juízes e diretores de fórum está disponível em:
- [`docs/pitch_institucional.md`](docs/pitch_institucional.md)

---

### Autoria & Desenvolvimento
Projeto idealizado para modernização dos serviços judiciários e desoneração dos fóruns estaduais.
