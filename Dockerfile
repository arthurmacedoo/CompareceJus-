# ==============================================================================
# CompareceJus v2.0 • Módulo Cautelar Nativo PDPJ-Br (CNJ)
# Compatível com Clusters Kubernetes / Red Hat OpenShift do Poder Judiciário
# ==============================================================================
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="CompareceJus Core Service (PDPJ-Br)"
LABEL org.opencontainers.image.description="Microsserviço de Apresentação Periódica Digital Cautelar integrado ao MNI v2.2.2 e ICP-Brasil"
LABEL org.opencontainers.image.vendor="Conselho Nacional de Justiça / PDPJ-Br (Protótipo Técnico)"
LABEL org.opencontainers.image.version="2.0.0"

# Segurança OpenShift/Kubernetes: Diretório de trabalho e permissões para UID arbitrário (non-root)
WORKDIR /app

# Copia os arquivos da aplicação (Zero dependências externas de runtime, 100% Node.js nativo)
COPY package.json ./
COPY server.js ./
COPY src/ ./src/
COPY *.html ./
COPY docs/ ./docs/
COPY modelos/ ./modelos/

# Garante diretório de persistência e suporte a execução non-root (OpenShift Restricted SCC)
RUN mkdir -p /app/data && \
    chown -R 1001:0 /app && \
    chmod -R g=u /app

# Variáveis de ambiente padrão para topologia PDPJ-Br
ENV NODE_ENV=production
ENV PORT=3000
ENV PDPJ_MODULE_NAME=comparecejus-cautelar
ENV MNI_VERSION=2.2.2
ENV TZ=America/Sao_Paulo

# Executa com usuário não-privilegiado (UID 1001 compatível com OpenShift/K8s)
USER 1001

EXPOSE 3000

# Liveness / Readiness Probe compatível com Kubernetes
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/info || exit 1

CMD ["node", "server.js"]
