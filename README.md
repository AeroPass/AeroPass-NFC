# Módulo de Reportes - AeroPass NFC

## Descripción

El módulo de reportes permite consultar y generar información relacionada con los registros de asistencia del sistema AeroPass NFC.

Está dirigido principalmente a los administradores, permitiendo visualizar la información de asistencia de manera organizada y aplicar diferentes filtros para facilitar su consulta y análisis.

## Funcionalidades

- Consulta de registros de asistencia.
- Filtrado de información por diferentes criterios.
- Consulta de resúmenes de asistencia.
- Generación de reportes.
- Exportación de información en formato **CSV**.
- Exportación de información en formato **PDF**.

## Filtros disponibles

Los reportes pueden ser consultados utilizando diferentes filtros, como:

- Fecha inicial y fecha final.
- Asignatura o curso.
- Docente.
- Estudiante.
- Estado de asistencia.

Los filtros permiten obtener información más específica según las necesidades del administrador.

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/reports/attendance` | Consulta los registros de asistencia |
| GET | `/reports/attendance/summary` | Obtiene un resumen de asistencia |
| GET | `/reports/attendance/export?format=csv` | Exporta el reporte en CSV |
| GET | `/reports/attendance/export?format=pdf` | Exporta el reporte en PDF |

## Acceso

Los endpoints del módulo de reportes requieren autenticación mediante **JWT** y están disponibles para usuarios con rol de **administrador**.

## Tecnologías

El módulo forma parte del backend de **AeroPass NFC** y utiliza **NestJS** para la implementación de la API.

## Objetivo

El objetivo principal del módulo es facilitar la consulta, análisis y generación de información sobre la asistencia registrada en el sistema, proporcionando a los administradores una herramienta sencilla para obtener y exportar los datos necesarios.
