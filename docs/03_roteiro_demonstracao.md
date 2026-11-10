# Roteiro de Demonstração ao Vivo do CompareceJus

Este guia orienta o apresentador (Arthur Macedo) durante reuniões com o Conselho Nacional de Justiça (CNJ), magistrados ou equipes técnicas de Tribunais de Justiça.

---

## 1. Preparação Prévia (5 minutos antes)

### Opção A: Demonstração Local (Recomendada em Notebook)
1. Certifique-se de que o servidor local está em execução:
   ```powershell
   cd "c:\Users\Marcelo Jr\Desktop\Projetos\CompareceJus"
   node server.js
   ```
2. Abra no navegador: `http://localhost:3000` (Hub Central de Demonstração).
3. Se desejar testar com seu próprio smartphone na mesma rede Wi-Fi, clique em **"Conectar Celular Real"** no topo da tela e aponte a câmera para o QR Code exibido.

### Opção B: Demonstração em Nuvem (Render / Backup)
- Link direto: acesse a URL do Render configurada no projeto (ex: `https://comparecejus.onrender.com`).

---

## 2. Passo a Passo da Apresentação (12 a 15 minutos)

### Ato 1: O Ponto Cego do Judiciário (2 minutos)
* **Fala sugerida:** *"Senhores Conselheiros e equipe técnica, o SAREF transformou a Execução Penal conectada ao SEEU. Mas hoje, a cada audiência de custódia onde se concede liberdade provisória com cautelar do artigo 319, inciso I, do CPP, o réu continua saindo com uma folha na mão para pegar fila no balcão todo mês apenas para assinar um livro físico. Isso afoga os servidores do PJe e do e-SAJ em tarefas manuais repetitivas."*

### Ato 2: O Hub e a Visão do Réu no App (3 minutos)
1. No Hub (`http://localhost:3000`), mostre a **moldura mobile do cidadão**:
   - Aponte a clareza do card: status do mês corrente (*"Outubro / 2026 • Pendente"*), contagem regressiva de dias para encerramento do prazo legal.
   - Mostre o botão principal em destaque: *"Realizar Comparecimento"*.
   - Mostre o histórico recente de meses anteriores e o atalho *"Precisa justificar ausência?"*.

### Ato 3: A Execução da Apresentação pelo Cidadão (3 minutos)
1. Clique em **"Realizar Comparecimento"** (leva à Tela 2):
   - Mostre o visor oval e a câmera aberta.
   - Demonstre a **prova de vida interativa**: enquadramento centralizado ➔ desafio de piscar os olhos / virar o rosto.
   - Aponte a telemetria territorial (GPS): o sistema obtém a coordenada real com precisão métrica.
   - Clique em **"Capturar e Validar"**.
   - Enfatize o feedback na tela: *"IA do Tribunal Analisando..."*.
2. A tela avança para o **Recibo Provisório de Apresentação (Tela 3)**:
   - **Ponto fundamental de governança:** Mostre que o réu **não recebe de imediato uma certidão definitiva**, e sim um **Recibo com protocolo e hash**, com o badge: *"Pré-Análise da IA Concluída • Aguardando Homologação da Secretaria"*.
   - Explique que isso cumpre o modelo assíncrono e a governança ética: a máquina pré-analisa, o servidor homologa no expediente do cartório.

### Ato 4: A Visão da Secretaria no Painel Desktop (4 minutos)
1. Alterne para a visão **Painel Web (Servidor da Vara)** no topo ou acesse `/painel`:
   - Destaque o recebimento em tempo real via Server-Sent Events (SSE) sem necessidade de atualizar a página.
   - Mostre os cards de triagem:
     * 🟢 **Verdes (Validados pela IA):** 94% dos casos com biometria conferida e dentro do raio da comarca.
     * 🟡 **Amarelos (Alertas Territoriais/Biometria):** ex: Bruno Carvalho (dentro da comarca, mas longe da residência cadastrada).
     * 🔴 **Vermelhos (Casos Graves):** ex: Lucas Mendes (detectado a 86 km fora da comarca, em Campinas).
2. Clique no caso vermelho de **Lucas Mendes**:
   - Mostre o **Dossiê Comparativo de Auditoria**: foto oficial da audiência de custódia ao lado da foto capturada pelo réu.
   - Mostre o laudo analítico da IA:
     * *Sinal de Alerta:* `FORA_DA_COMARCA (Peso 40)`.
     * *Parecer Técnico da IA:* *"ALERTA DE DESCUMPRIMENTO CAUTELAR (Art. 319, IV, CPP). Não homologar de plano. Recomendada conclusão imediata ao Juiz de Direito."*
   - Clique em **"Remeter Conclusão ao Juiz de Direito"** e registre o despacho.
3. Volte para os casos regulares e demonstre a **Homologação em Lote**:
   - Clique em **"Juntar Certidões nos Autos em Lote"**: o sistema homologa com 1 clique todas as apresentações verdes e protocola petição simulada na PDPJ-Br.

### Ato 5: A Verificação Pública com Fé Pública (2 minutos)
1. Abra no navegador: `http://localhost:3000/verificar?p=CJ-2026-000101-7` (ou escaneie o QR Code do recibo/certidão).
2. Mostre como um policial militar em abordagem de rua ou oficial de justiça valida na hora a autenticidade da certidão, sem expor dados desnecessários (em estrita conformidade com a LGPD).

---

## 3. Plano de Contingência ("Plano B")

| Imprevisto | Causa Provável | O que fazer na hora |
|---|---|---|
| **Câmera do celular não abre** | Permissão negada no navegador | O app possui botão de alternar para a câmera nativa do sistema operacional (arquivo/galeria). |
| **Queda de Wi-Fi** | Instabilidade de rede no local | Utilize o servidor local (`localhost:3000`) em tela única ou espelhe a tela do celular via cabo USB. |
| **GPS impreciso em local fechado** | Ausência de sinal de satélite | O sistema adota automaticamente tolerância com base na precisão reportada e classifica em modo amarelo se necessário. |

---

## 4. FAQ: Respostas para Perguntas Técnicas e Jurídicas do CNJ

### 1. "O SAREF já não faz isso?"
> *"O SAREF é uma conquista fundamental para a execução penal, mas foi concebido especificamente para quem já possui condenação definitiva no SEEU. Nosso foco é resolver o gargalo que antecede a condenação: a liberdade provisória, cautelares do art. 319 do CPP e ANPP, que tramitam no PJe, e-SAJ e eproc. Além disso, no CompareceJus a foto é cadastrada na própria Audiência de Custódia, evitando que o cidadão precise ir ao fórum depois para cadastrar a biometria."*

### 2. "E se a pessoa usar um aplicativo de GPS falso (Mock Location)?"
> *"No protótipo web simulamos a detecção por telemetria e análise de inconsistência geográfica (velocidade implícita e desvio de rota). Na versão final para produção, o CompareceJus é concebido como um app nativo, utilizando as APIs de integridade oficiais dos sistemas operacionais (Google Play Integrity API no Android e DeviceCheck/App Attest no iOS), que bloqueiam nativamente root, jailbreak e flags de mock provider."*

### 3. "A Inteligência Artificial pode punir um réu automaticamente?"
> *"Jamais. Em conformidade com a Resolução CNJ nº 615/2025 (Governança de IA no Poder Judiciário), o reconhecimento facial e análise territorial são classificados como sistemas de alto risco. Portanto, a IA atua única e exclusivamente como ferramenta de triagem pré-analítica (Human-in-the-Loop). A decisão final de homologar, determinar nova tentativa ou remeter os autos ao magistrado é sempre do servidor ou do juiz."*

### 4. "Como fica o cidadão em extrema vulnerabilidade que não possui smartphone?"
> *"O CompareceJus não extingue o comparecimento presencial; ele é uma alternativa de desoneração. Quem não possuir dispositivo móvel ou acesso à rede continua tendo o balcão da secretaria ou o Totem biométrico à disposição, com a vantagem de encontrar o balcão totalmente livre de filas."*
