# Solución Serverless de Solicitud de Endoso

Implementación end-to-end con React, Cognito, API Gateway REST, Lambda/Hapi,
DynamoDB, CloudFront/S3 y AWS CDK v2.

## Estructura

```text
frontend/src/
  components/EndorsementForm.tsx
  domain/endorsementSchema.ts
  hooks/useEndorsement.ts
  services/{cognitoSession,endorsementService}.ts
backend/src/handler.ts
infra/{bin/app.ts,lib/*-stack.ts}
.github/workflows/deploy.yml
```

## Desarrollo y despliegue

Requisitos: Node.js 24, una cuenta AWS configurada y CDK bootstrap ejecutado
(`npx cdk bootstrap`).

```bash
npm ci
npm run build
npx cdk synth
npx cdk deploy --all --require-approval never
```

El workflow de GitHub Actions se activa en `main`. Configura el secreto
`AWS_DEPLOY_ROLE_ARN` con el ARN de un rol cuyo trust policy permita el
provider OIDC de GitHub (`token.actions.githubusercontent.com`) restringido al
repositorio y rama. Define las variables `AWS_REGION`, `VITE_API_BASE_URL` (la URL del output
`ApiUrl`, que ya incluye el stage `v1`), `VITE_COGNITO_USER_POOL_ID` y
`VITE_COGNITO_USER_POOL_CLIENT_ID` (outputs de los stacks de autenticación).

La API pública resultante es `POST /v1/endorse/translate`; API Gateway valida el
JWT de Cognito antes de invocar Lambda. El frontend usa `fetchAuthSession()` y
envía exclusivamente `Authorization: Bearer <id-token>`.
