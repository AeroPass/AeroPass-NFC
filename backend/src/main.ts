import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuracion = app.get(ConfigService);
  const prefijoApi = configuracion.getOrThrow<string>('aplicacion.prefijoApi');
  const puerto = configuracion.getOrThrow<number>('aplicacion.puerto');
  app.setGlobalPrefix(prefijoApi);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AeroPass NFC API')
    .setDescription('API con JWT, roles y permisos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerDarkCss = `
    html, body, .swagger-ui { background: #0b1220 !important; color: #e5e7eb !important; }
    .swagger-ui .topbar { background-color: #111827 !important; }
    .swagger-ui .info, .swagger-ui .info .title, .swagger-ui .info p,
    .swagger-ui .info li, .swagger-ui .opblock-tag, .swagger-ui label,
    .swagger-ui .parameter__name, .swagger-ui .parameter__type,
    .swagger-ui table thead tr th, .swagger-ui table tbody tr td,
    .swagger-ui .model-title, .swagger-ui section h3, .swagger-ui h4 { color: #e5e7eb !important; }
    .swagger-ui .scheme-container, .swagger-ui .opblock, .swagger-ui .model-box,
    .swagger-ui section.models, .swagger-ui .responses-inner, .swagger-ui .opblock-body,
    .swagger-ui .opblock-description-wrapper, .swagger-ui .opblock-external-docs-wrapper,
    .swagger-ui .opblock-title_normal, .swagger-ui .auth-wrapper { background: #111827 !important; }
    .swagger-ui input, .swagger-ui textarea, .swagger-ui select,
    .swagger-ui .dialog-ux .modal-ux { background: #1f2937 !important; color: #f9fafb !important; border-color: #374151 !important; }
    .swagger-ui .btn { color: #f9fafb !important; border-color: #64748b !important; }
    .swagger-ui .opblock .opblock-section-header { background: #1f2937 !important; }
    .swagger-ui .model-toggle:after, .swagger-ui .expand-operation:after { filter: invert(1); }
    .swagger-ui a { color: #93c5fd !important; }
  `;
  SwaggerModule.setup(`${prefijoApi}/docs`, app, document, {
    customSiteTitle: 'AeroPass NFC API · Swagger',
    customCss: swaggerDarkCss,
  });

  await app.listen(puerto);
}

void bootstrap();
