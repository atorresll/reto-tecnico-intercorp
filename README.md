# Servicio Serverless de Traducción y Mapeo de Endosos

Monorepo para procesar solicitudes de endoso mediante una API serverless
protegida con Amazon Cognito. El endpoint principal es:

```text
POST /v1/endorse/translate
```

La solución obtiene una equivalencia desde DynamoDB usando `producto` y
`tipoEndoso`, transforma el payload mediante reglas configurables y devuelve el
JSON traducido.

## 1. Descripción del proyecto y arquitectura

### Stack tecnológico

- **Frontend:** React, TypeScript, Vite y Zod. El formulario está servido desde
  Amazon S3 a través de CloudFront con Origin Access Control (OAC).
- **Backend:** Node.js 24, Hapi.js y
  [`@vendia/serverless-express`](https://github.com/awslabs/aws-serverless-express)
  ejecutándose sobre AWS Lambda.
- **Base de datos:** Amazon DynamoDB, tabla `EndorsementMappings`, con claves
  `PK` y `SK` y modo de facturación bajo demanda.
- **Autenticación:** Amazon Cognito User Pool. API Gateway valida el JWT
  recibido en el header `Authorization` con esquema Bearer.
- **API:** Amazon API Gateway REST API (v1), con el recurso
  `/v1/endorse/translate`.
- **Infraestructura:** AWS CDK v2 en TypeScript.
- **CI/CD:** GitHub Actions, ejecutado en cada `push` a `main`.

> **Estado actual del frontend:** la validación usa Zod y la lógica de estado
> está encapsulada en `useEndorsement`. React Hook Form no está actualmente
> declarado como dependencia ni integrado en el formulario.

### Flujo de la solicitud

1. El usuario completa el formulario React.
2. Cognito proporciona el token de sesión.
3. El frontend realiza un `POST` con el header `Authorization`.
4. API Gateway valida el JWT mediante el authorizer de Cognito.
5. Lambda inicializa Hapi y delega la petición a las capas del backend.
6. El repositorio consulta `EndorsementMappings`.
7. El mapper aplica la equivalencia, listas y reglas dinámicas.
8. El servicio devuelve la traducción al cliente.

## 2. Estructura de software del backend

```text
backend/src/
├── routes/
│   └── endorsement.routes.ts
├── controller/
│   └── endorsement.controller.ts
├── service/
│   └── endorsement.service.ts
├── repository/
│   └── mapping.repository.ts
├── integration/
│   └── external-api.integration.ts
├── publisher/
│   └── event.publisher.ts
├── entity/
│   └── endorsement.entity.ts
├── model/
│   └── mapping.model.ts
├── mapper/
│   └── endorsement.mapper.ts
├── test/
│   └── endorsement.service.test.ts
└── index.ts
```

- `routes/`: define los endpoints Hapi.
- `controller/`: valida el payload HTTP y construye la respuesta.
- `service/`: contiene la lógica de negocio de traducción.
- `repository/`: consulta DynamoDB sin exponer detalles de persistencia al
  servicio.
- `integration/`: punto de extensión para clientes de servicios externos.
- `publisher/`: punto de extensión para SNS, EventBridge u otros buses.
- `entity/`: interfaces y tipos del dominio.
- `model/`: modelos de los registros almacenados en DynamoDB.
- `mapper/`: transforma el payload y aplica reglas y listas dinámicas.
- `test/`: pruebas unitarias de la lógica de negocio.
- `index.ts`: crea el servidor Hapi y exporta el adaptador Lambda.

El repositorio busca una separación de responsabilidades: el controller no
consulta DynamoDB directamente, el service no conoce el transporte HTTP y el
mapper no depende de AWS.

## 3. Guía de ejecución local

### Requisitos

- Node.js 24 o superior.
- npm.
- AWS CLI configurado si se ejecutan comandos de CDK contra una cuenta AWS.
- AWS CDK bootstrap ejecutado una vez por cuenta y región:

```bash
npx cdk bootstrap
```

### Instalación

Desde la raíz del monorepo:

```bash
npm ci
```

### Backend

El backend actual está preparado como entrypoint serverless en
`backend/src/index.ts`. No existe todavía un archivo
`backend/src/server.local.ts` ni un script `npm run dev`; por tanto, el
siguiente comando no está disponible en el estado actual:

```bash
cd backend
npm install
npm run dev
```

Para validar el backend localmente mediante TypeScript:

```bash
npm run build:backend
```

La prueba unitaria disponible puede ejecutarse con el runner nativo de Node
después de transpilar el proyecto con una herramienta de test adecuada. La
prueba está ubicada en:

```text
backend/src/test/endorsement.service.test.ts
```

La ejecución integrada del endpoint se realiza después del despliegue mediante
API Gateway. El nombre de la tabla se proporciona a Lambda por la variable de
entorno `TABLE_NAME`.

### Frontend

Para generar el build de producción:

```bash
npm run build:frontend
```

El resultado queda en:

```text
frontend/dist/
```

Variables usadas durante el build:

```text
VITE_API_BASE_URL
VITE_AWS_REGION
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_USER_POOL_CLIENT_ID
```

## 4. Infraestructura como código

La aplicación CDK está definida en `infra/bin/app.ts` y compone cuatro stacks:

| Stack | Recursos principales |
| --- | --- |
| `EndorsementDatabaseStack` | DynamoDB `EndorsementMappings` |
| `EndorsementAuthStack` | Cognito User Pool y User Pool Client |
| `EndorsementBackendStack` | Lambda Node.js 24, API Gateway REST y authorizer Cognito |
| `EndorsementFrontendStack` | Bucket S3 privado, CloudFront OAC y despliegue del frontend |

Validar la infraestructura:

```bash
npm run build:infra
npx cdk synth
```

Desplegar todos los stacks:

```bash
npm run cdk:deploy
```

También puede utilizarse directamente:

```bash
npx cdk deploy --all --require-approval never
```

La tabla usa:

```text
PK: PRODUCT#<producto>
SK: ENDORSEMENT#<tipoEndoso>
```

El registro puede contener `translation`, `rules` y `lists`, que son
interpretados por `EndorsementMapper`.

## 5. CI/CD con GitHub Actions

El workflow se encuentra en
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) y se ejecuta
automáticamente al hacer `push` a `main`.

El pipeline:

1. Descarga el repositorio.
2. Configura Node.js 24.
3. Configura AWS mediante `aws-actions/configure-aws-credentials@v4`.
4. Instala dependencias y construye el frontend.
5. Compila la infraestructura.
6. Ejecuta `npx cdk deploy --all --require-approval never`.

### Repository Secrets

Configurar en GitHub:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
```

### Repository Variables

Configurar también:

```text
VITE_API_BASE_URL
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_USER_POOL_CLIENT_ID
```

La Access Key utilizada por GitHub debe pertenecer a una identidad dedicada,
con permisos mínimos para el despliegue de los stacks. Nunca se deben
comitear credenciales ni valores sensibles en el repositorio.

## 6. Comandos disponibles

```bash
npm run build            # Frontend, backend e infraestructura
npm run build:frontend   # Build de React/Vite
npm run build:backend    # Type-check del backend
npm run build:infra      # Type-check de CDK
npm run cdk:synth        # Build frontend y síntesis CDK
npm run cdk:deploy       # Build frontend y despliegue completo
```

## 7. Seguridad y operación

- El bucket de frontend es privado y solo CloudFront puede acceder mediante
  OAC.
- API Gateway valida tokens Cognito antes de invocar Lambda.
- DynamoDB utiliza cifrado administrado por AWS y recuperación point-in-time.
- La tabla conserva los datos mediante `RemovalPolicy.RETAIN`.
- El pipeline no contiene credenciales en texto plano.
- Las credenciales de despliegue deben rotarse periódicamente y limitarse al
  alcance estrictamente necesario.
