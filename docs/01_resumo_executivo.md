# CompareceJus • Resumo Executivo

**Apresentação periódica digital para liberdade provisória e medidas cautelares (Art. 319 do CPP).**  
*Autor: Arthur Macedo · Módulo Cautelar integrado à PDPJ-Br / MNI v2.2.2*

---

## 1. O Problema Real

O comparecimento mensal em juízo (art. 319, I, do CPP), as condições do ANPP e a suspensão condicional do processo obrigam milhares de pessoas a irem ao fórum **todo mês apenas para assinar um livro de papel**.

* **Nas Varas Criminais:** Fila no balcão, servidores gastando centenas de horas com carimbo e digitação, livros físicos sujeitos a extravio e sem prova real de data, hora ou permanência na comarca.
* **Para o Jurisdicionado:** Um dia de trabalho perdido e custo de transporte todo mês, penalizando quem tem menos condições financeiras.
* **A Lacuna do SAREF:** O SAREF (CNJ/TJDFT) é excelente, mas atende apenas a **execução penal no SEEU** (condenados definitivos). Quem recebe liberdade provisória na Audiência de Custódia responde no **PJe, e-SAJ ou eproc**, **não está no SEEU** e continua na fila do papel.

---

## 2. A Solução em 3 Passos Simples

```
[1. Sala de Custódia] ➔ [2. Celular do Cidadão] ➔ [3. Secretaria da Vara]
  Cadastro da foto       Selfie + GPS no mês       Homologação e juntada
   em 30 segundos           (ou no balcão)          automática no PJe
```

1. **Cadastro Oficial na Custódia (30 segundos):**  
   Ao conceder a liberdade provisória, a foto do réu é registrada na própria sala de audiência (via webcam, foto do Auto de Flagrante ou consulta ao BNMP 3.0/TSE). Ele já sai do fórum cadastrado.
2. **Apresentação pelo Smartphone (ou Balcão Assistido):**  
   Dentro do mês, a pessoa abre o app, faz a prova de vida (piscar/sorrir) e valida o GPS. Se não tiver celular ou internet, **tem direito garantido de ir ao balcão ou à Defensoria (Res. CNJ nº 288/2019)**, sem filas e sem risco de prisão.
3. **Triagem por IA e Homologação com Fé Pública:**  
   A IA do Tribunal apenas organiza a fila em verde, amarelo e vermelho. O servidor clica em **"Homologar e Assinar"**: o sistema assina digitalmente com certificado ICP-Brasil e protocola a certidão **direto no processo judicial via MNI v2.2.2** (TPU nº 85), sem ninguém baixar nem subir PDF manual.

---

## 3. Por que o CompareceJus vai direto ao ponto?

| O que existe hoje (Livro de Papel) | O que o CompareceJus entrega |
|---|---|
| Fila física no balcão todo mês | **Comparecimento em 30 segundos pelo celular** |
| Assinatura manual sem prova de local | **GPS certificado e liveness facial antifraude** |
| Servidor juntando certidão manual no PJe | **Juntada automática via MNI v2.2.2 (TPU 85)** |
| Réu vulnerável penalizado se não tiver celular | **Canal assistido obrigatório (Res. CNJ 288/2019)** |
| Restrito ao SEEU (como o SAREF) | **Nativo para PJe, e-SAJ e eproc (Medidas Cautelares)** |

---

## 4. Segurança e Governança

* **A IA nunca decide sozinha (Res. CNJ nº 615/2025):** Toda homologação ou decisão sobre o benefício cautelar exige a chancela de um servidor ou juiz humano.
* **Privacidade Absoluta (LGPD):** O GPS é coletado apenas no instante da selfie mensal; não existe rastreamento em segundo plano nem histórico de rotinas.
* **Arquitetura Pronta para a PDPJ-Br:** Desenvolvido como microsserviço conteinerizado, compatível com OpenShift/Kubernetes, Keycloak (SSO-JUS) e barramento MNI.

---

## 5. Proposta ao CNJ / Tribunais

* **Reunião Técnica de 30 minutos** com a equipe do DMF (SAREF) e DTI (PDPJ-Br) para demonstração do protótipo funcional já em operação.
* **Projeto-Piloto de 90 dias** em uma Vara Criminal ou Central de Alternativas Penais para validação prática de redução de filas e horas de trabalho cartorário.
