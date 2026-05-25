# SPEC.md

## Objetivo general

SV Barber Turnos es la base de un SaaS de gestion de turnos para barberias. El sistema debe permitir que una barberia publique sus servicios, horarios disponibles y barberos, y que sus clientes puedan reservar turnos de forma simple desde una experiencia web optimizada para movil.

El objetivo no es construir una solucion exclusiva para una sola barberia, sino una plataforma reutilizable para multiples barberias, donde cada negocio pueda tener su propia configuracion, identidad, servicios y reglas operativas.

## Vision SaaS multi-barberia

La vision del producto es ofrecer una plataforma escalable para barberias que necesitan organizar reservas, reducir ausencias, ordenar horarios y mejorar la comunicacion con clientes.

Cada barberia debera poder tener:

- Nombre.
- Servicios.
- Precios.
- Horarios.
- Barberos.
- Instagram.
- WhatsApp.
- Configuracion de duracion de turnos.
- Reglas de cancelacion.
- Mensajes y recordatorios personalizados.

La arquitectura debe pensarse desde el inicio como multi-tenant: una misma aplicacion debe poder servir a varias barberias sin duplicar codigo ni crear proyectos separados por cliente.

## SV Barber como demo inicial

SV Barber sera el primer cliente/demo del sistema. Su landing inicial sirve para validar la experiencia basica de reserva y presentar el estilo visual del producto.

SV Barber no debe quedar hardcodeado como unica barberia del sistema. Cualquier dato de SV Barber debe considerarse informacion demo o configuracion inicial reemplazable por datos dinamicos en futuras fases.

Datos demo iniciales:

- Nombre: SV Barber.
- Texto principal: Reserva tu turno online.
- Servicio: Corte - $8500.
- Servicio: Corte + barba - $10000.
- Horario inicial: 16:00 a 21:00.
- Duracion inicial de turno: 30 minutos.

## MVP 1 actual

El MVP 1 actual es una base tecnica y visual minima:

- Proyecto Next.js con TypeScript.
- App Router.
- Tailwind CSS.
- ESLint.
- Estructura `src/`.
- Landing inicial simple para SV Barber.
- Documentacion de producto y reglas de desarrollo.

Este MVP no incluye todavia persistencia, integraciones, autenticacion ni paneles funcionales.

## Futuras funcionalidades

Funcionalidades previstas para fases posteriores:

- Flujo completo de reserva online.
- Seleccion de servicio.
- Seleccion de barbero.
- Seleccion de fecha y horario.
- Confirmacion del turno.
- Panel admin para barberias.
- Panel de gestion de servicios.
- Panel de horarios.
- Panel de barberos.
- Estadisticas de reservas.
- Recordatorios automaticos.
- WhatsApp API.
- Google Calendar.
- Pagos online.
- Sistema de fidelizacion.
- Descuentos y promociones.
- Historial de clientes.
- Control de ausencias.
- Reglas personalizadas por barberia.
- Multiples barberos por barberia.

## Reglas de negocio

Reglas iniciales del dominio:

- Los turnos demo funcionan de 16:00 a 21:00.
- La duracion demo de cada turno es de 30 minutos.
- Los servicios demo son Corte y Corte + barba.
- La cancelacion debe realizarse como minimo 1 hora antes del turno.
- Los clientes que faltan sin avisar pueden perder prioridad en reservas futuras.
- Los barberos podran modificar la duracion de los turnos.
- Una barberia debe poder definir sus propios horarios.
- Una barberia debe poder definir sus propios servicios y precios.
- Una barberia debe poder activar o desactivar barberos.
- En el futuro, un turno no deberia poder reservarse dos veces para el mismo barbero y horario.
- En el futuro, cada barberia podria definir reglas distintas de disponibilidad, anticipacion y cancelacion.

## Flujo completo de reserva

Flujo objetivo para una reserva online:

1. El cliente entra a la pagina publica de una barberia.
2. El sistema muestra nombre, servicios, precios y disponibilidad.
3. El cliente selecciona un servicio.
4. El cliente selecciona un barbero, si la barberia tiene mas de uno.
5. El cliente selecciona fecha.
6. El sistema calcula horarios disponibles segun duracion, horario de atencion y turnos ya reservados.
7. El cliente selecciona un horario.
8. El cliente completa sus datos basicos.
9. El sistema muestra un resumen del turno.
10. El cliente confirma la reserva.
11. El sistema registra el turno.
12. El cliente recibe confirmacion.
13. La barberia visualiza el turno en su panel.

En el MVP actual solo existe la landing inicial. Este flujo se documenta como direccion futura.

## Flujo futuro de confirmacion por WhatsApp

Flujo esperado cuando se implemente WhatsApp:

1. El cliente confirma una reserva desde la web.
2. El sistema guarda el turno con estado pendiente o confirmado segun la regla de la barberia.
3. El sistema genera un mensaje con barberia, servicio, barbero, fecha, hora y politica de cancelacion.
4. El sistema envia la confirmacion por WhatsApp API.
5. El cliente puede recibir botones o instrucciones para confirmar, cancelar o reprogramar.
6. El sistema registra la respuesta del cliente.
7. Si el cliente cancela con mas de 1 hora de anticipacion, el horario vuelve a estar disponible.
8. Si el cliente cancela tarde o no asiste, el sistema puede marcar el evento para reglas de prioridad futuras.

WhatsApp no debe implementarse en esta fase.

## Estructura futura de paneles

Panel publico de barberia:

- Landing de la barberia.
- Listado de servicios.
- Flujo de reserva.
- Informacion de contacto.
- Enlaces a Instagram y WhatsApp.

Panel admin de barberia:

- Resumen del dia.
- Calendario o agenda de turnos.
- Gestion de servicios.
- Gestion de precios.
- Gestion de horarios.
- Gestion de barberos.
- Gestion de clientes.
- Estadisticas.
- Configuracion de integraciones.

Panel interno SaaS:

- Gestion de barberias.
- Estado de clientes.
- Planes o suscripciones futuras.
- Configuracion global.
- Monitoreo de uso.

Ningun panel admin funcional debe implementarse todavia.

## Posibles integraciones futuras

Integraciones previstas:

- Supabase para base de datos, autenticacion y storage si se define como stack final.
- WhatsApp API para confirmaciones, recordatorios y cancelaciones.
- Google Calendar para sincronizacion de agenda.
- Pasarelas de pago para senas o pagos online.
- Servicios de email transaccional.
- Analitica para conversiones y uso del sistema.
- Herramientas de observabilidad y monitoreo.

Estas integraciones deben mantenerse desacopladas de la UI y encapsuladas en modulos propios.

## Arquitectura general del sistema

La arquitectura objetivo debe separar:

- Presentacion: componentes de UI y paginas.
- Dominio: reglas de negocio de reservas, horarios, servicios y barberos.
- Datos: origen de datos demo, base de datos futura o APIs.
- Integraciones: WhatsApp, Google Calendar, pagos y otros servicios externos.
- Configuracion por barberia: branding, servicios, horarios, barberos y canales de contacto.

Modelo conceptual inicial:

- Barberia.
- Servicio.
- Barbero.
- Horario de atencion.
- Turno.
- Cliente.
- Integracion.
- Regla de negocio.

La aplicacion debe permitir avanzar desde datos estaticos demo hacia datos persistidos sin reescribir la experiencia principal.

## Enfoque escalable

El proyecto debe crecer con una mentalidad SaaS:

- Multi-barberia desde el modelo de datos.
- Configuracion por cliente, no forks por cliente.
- Componentes compartidos.
- Reglas de negocio centralizadas.
- Integraciones desacopladas.
- UI reusable para distintos perfiles.
- Soporte para multiples barberos y servicios.
- Preparacion para planes, limites y funcionalidades premium.

El primer objetivo tecnico es evitar decisiones que aten el sistema a SV Barber como caso unico. La demo debe validar la experiencia, pero la arquitectura debe preparar el camino para que nuevas barberias puedan incorporarse con configuracion propia.
